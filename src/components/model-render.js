import { Lifetime } from "../assets/assets.js";
import { ShaderSimpleTexture } from "../buff/shader-mods/simple-texture.js";
import { EntityComponent, GameEntity } from "../game/game-context.js";
import { mat4, vec3 } from "../glm/index.js";
import { Matrix4, Quaternion, Vector3 } from "../math/index.js";
import { Transform } from "./transform.js";
import { GLTFEnum } from "./../assets/gltf.js"
import { BinType, BufferUsage } from "../buff/gpu-types.js";
import { BufferManager } from "../buff/buffer.js";
import { ShaderSkinning } from "../buff/shader-mods/skinning.js";
import { ShaderNormals } from "../buff/shader-mods/normals.js";
import { ShaderInstances } from "../buff/shader-mods/instances.js";
import { AttributeLayoutGenerator, DefaultAttributes } from "../buff/attribute.js";
import { Entity } from "../ecso/ecso.js";
import { Collision } from "../game/collision.js";

let tempVec3 = new Vector3();
let temp2Vec3 = new Vector3();
let tempQuat = new Quaternion();
let temp2Quat = new Quaternion();
let tempMat4 = new Matrix4();

export class Rig extends EntityComponent
{
    /**
     * 
     * @param {GLTFSkin} skin 
     * @param {BufferManager} bufferManager 
     */
    configure(skin, bufferManager)
    {
        let numMatrices = skin.invBinds.length;
        this.bindMatrices = bufferManager.allocUniformBlockBuffer("Animation", numMatrices, [
            ["joint", BinType.MAT4]
        ], BufferUsage.DYNAMIC);

        this.invBinds = skin.invBinds;
        this.joints = skin.joints;
    }

    resolveJoints(nodeEntityMap)
    {
        this.joints = this.joints.map(node => nodeEntityMap.get(node.id));
    }

    bind(program)
    {
        this.bindMatrices.bindSOA(program);
    }

    computeBindMatrices()
    {        
        mat4.affineInvert(tempMat4, this.get(Transform).worldMatrix);

        for (let i = 0; i < this.joints.length; i++)
        {
            let block = this.bindMatrices.getBlock(i);

            mat4.affineMultiply(block.joint, tempMat4, this.joints[i].get(Transform).worldMatrix);
            mat4.affineMultiply(block.joint, block.joint, this.invBinds[i]);
        }
    }
}

let noCull = function() 
{
    return true;
}

export class CullRegion extends EntityComponent
{
    primRenders = [];
    _cullBody = null;
    _collider = null;
    cullFunction = noCull;

    addPrim(primRender)
    {
        this.primRenders.push(primRender)
    }

    onDetach()
    {
        this.context.cullMap.delete(this._collider.handle);
        this.context.cullWorld.removeRigidBody(this._cullBody);
    }

    addToCullWorld()
    {
        if (this._cullBody)
        {
            this.remakeCollider();
            return;
        }

        let P = this.context.PHYSICS;
        var desc = P.RigidBodyDesc.newStatic();
        this._cullBody = this.context.cullWorld.createRigidBody(desc);
        this._collider = this.context.cullWorld.createCollider(this.colliderDesc, this._cullBody.handle);
        this.context.cullMap.set(this._collider.handle, this);
    }

    remakeCollider()
    {
        this.context.cullMap.delete(this._collider.handle);
        this.context.cullWorld.removeCollider(this._collider);
        this._collider = this.context.cullWorld.createCollider(this.colliderDesc, this._cullBody.handle);
        this.context.cullMap.set(this._collider.handle, this);
    }

}

export class CullSphere extends CullRegion
{
    configure(center, radius)
    {
        let P = this.context.PHYSICS;

        this.colliderDesc = P.ColliderDesc.ball(radius)
            .setCollisionGroups(Collision.getCollisionGroups([Collision.CULL], [Collision.GAZE]))
            .setTranslation(center.x, center.y, center.z);

        this.addToCullWorld();
    }
}

CullSphere.views = {
    moved : [CullSphere, Transform.TAG_MOVED]
}

CullSphere.update = function() {
    this.views.moved(e => {
        const wm = Transform.getWorldMatrix(e);
        let cullBody = e.get(CullSphere)._cullBody;
        wm.getTranslation(tempVec3);
        //console.log(tempVec3);
        cullBody.setTranslation(tempVec3);
    });
}

export class CullBox extends CullRegion
{
    configure(center, extents)
    {
        let P = this.context.PHYSICS;
        
        this.colliderDesc = P.ColliderDesc.cuboid(extents.x, extents.y, extents.z)
            .setCollisionGroups(Collision.getCollisionGroups([Collision.CULL], [Collision.GAZE]))
            .setTranslation(center.x, center.y, center.z);

        this.addToCullWorld();
    }
}

CullBox.views = {
    moved: [CullBox, Transform.TAG_MOVED]
}

CullBox.update = function() {
    this.views.moved(e => {
        const wm = Transform.getWorldMatrix(e);
        let cullBody = e.get(CullBox)._cullBody;
        wm.decompose(tempVec3, tempQuat);
        cullBody.setTranslation(tempVec3);
        cullBody.setRotation(tempQuat);
    });
}

export class PrimRender extends EntityComponent
{

    configure(prim, autoCull)
    {
        this.prim = prim;
        this.autoCull = autoCull;

        if (autoCull)
        {
            this.entity.ensure(CullBox);
            this.get(CullBox).configure(this.prim.center, this.prim.extents);
            this.get(CullBox).addPrim(this);
        }    
    }

    onDetach()
    {
        this.context.gpu.deleteGeometryBinding(this.prim.binding);
    }
}

PrimRender.views = {
    prim_moved : [PrimRender, Transform.TAG_MOVED]
}

PrimRender.update = function(dt, clock, context)
{
    this.views.prim_moved(e => {

        /**
         * @type {Matrix4}
         */
        const wm =  Transform.getWorldMatrix(e);
        let primC = e.get(PrimRender);
        mat4.copy(primC.prim.locals.model, wm);
    });
}


export class ModelRender extends EntityComponent
{
    _asset = null;
    _lifetime = new Lifetime;
    _doLoadedList = new Array();
    _instanceBuffer = null;
    _instanceHoles = [];
    
    config = 
    {
        shaderMods : ModelRender.defaultShaderMods,
        isInstanced : false,
        isStatic : true,
        instanceCount : 0,
        maxInstances : 0,
        autoCull : true,
        cullRegion: null
    }

    configure(modelAsset, config)
    {
        Object.assign(this.config, config);

        if (this.config.isInstanced)
        {
            this.programAsset = this.context.programManager.fromMods(ShaderInstances, ...this.config.shaderMods);
            //todo only if animated
            this.animProgramAsset = this.context.programManager.fromMods(ShaderInstances, ShaderSkinning, ...this.config.shaderMods);

            this._instanceBuffer = this.context.bufferManager.allocInstanceBlockBuffer(
                this.config.maxInstances || this.config.instanceCount, 
                this.programAsset.program.instanceAttributes,
                this.config.isStatic ? BufferUsage.STATIC : BufferUsage.DYNAMIC
            );    
        }
        else
        {
            this.programAsset = this.context.programManager.fromMods(...this.config.shaderMods);
            //todo only if animated
            this.animProgramAsset = this.context.programManager.fromMods(ShaderSkinning, ...this.config.shaderMods);
        }

        this.asset = modelAsset;
        return this;
    }

    getInstanceBlock(index)
    {
        return this._instanceBuffer.getBlock(index);
    }

    recycleInstance(index)
    {
        this._instanceHoles.push(index);
    }

    syncInstances(startIndex, count)
    {
        this._instanceBuffer.uploadBlocks(startIndex, count);
    }

    get animationCount()
    {
        if (this.gltf && this.gltf.animations)
        {
            return this.gltf.animations.length;
        }

        return 0;
    }

    getAnimationName(index)
    {
        return this.gltf.animations[index].name;
    }

    getAnimationIndex(name)
    {
        return this.gltf.animationMap.get(name);
    }

    setAnimationIndex(index)
    {
        this.animation = this.gltf.animations[index];
    }

    doLoaded(fn)
    {
        if (this.gltf)
        {
            fn.call(this);
        }
        else
        {
            this._doLoadedList.push(fn);
        }
    }

    playAnimation(index)
    {
        this.entity.add("animating");
        this.setAnimationIndex(index);
        this.animationTime = 0.0;
    }

    stopAnimating()
    {
        this.entity.remove("animating");
    }

    _advanceAnimationTime(dt)
    {
        this.setAnimationTime(this.animationTime + dt);
    }

    setAnimationTime(time, loop = true)
    {
        this.animationTime = time;
        this.looping = loop;

        if(loop) time = (time % this.animation.duration);
        
        
        for (let channel of this.animation.channels)
        {
            let entity = this.nodeEntityMap.get(channel.target.node.id);

            let vs = channel.sampler.values;
            let times = channel.sampler.times;

            let numFrames = times.length;
            let frameIndex = 0;//todo
            let nextTime = times[frameIndex + 1];

            while(nextTime && nextTime < time)
            {
                frameIndex += 1;
                nextTime = times[frameIndex + 1];
            }

            let prevTime = times[frameIndex];

            let frameDelta = 0;

            if (!nextTime)
            {
                nextTime = prevTime;
                prevTime = times[frameIndex-1];
                frameDelta = 1;
            }
            else if (prevTime < time)
            {
                frameDelta = (time - prevTime) / (nextTime - prevTime);
            }
            
            if (channel.target.path == GLTFEnum.ROTATION)
            {
                let i = frameIndex * 4;
                tempQuat.set(vs[i], vs[i + 1], vs[i + 2], vs[i + 3]);
                i += 4;
                temp2Quat.set(vs[i], vs[i + 1], vs[i + 2], vs[i + 3]);

                
                tempQuat.slerpTo(temp2Quat, frameDelta);
                
                entity.get(Transform).setLocalRotation(tempQuat);
            }
            else if (channel.target.path == GLTFEnum.TRANSLATION)
            {
                let i = frameIndex * 3;
                tempVec3.set(vs[i], vs[i+1], vs[i+2]);
                i+=3;
                temp2Vec3.set(vs[i], vs[i+1], vs[i+2]);

                vec3.lerp(tempVec3, tempVec3, temp2Vec3, frameDelta);
                entity.get(Transform).setLocalTranslation(tempVec3);
            }
            
        }

        for (let rig of this.rigs)
        {
            rig.get(Rig).computeBindMatrices();
        }
    }

    _processGltfAsset(gltfAsset)
    {
        const {gpu, bufferManager, programManager} = this.context;
        this.gpu = gpu;
        
        const program = this.programAsset.program;
        
        this._asset = gltfAsset;
        const gltf = this._asset.gltf;
        this.gltf = gltf;
        const prims = [];
        const thiz = this;
        
        /**
         * @type {Map<number, GameEntity>}
         */
        this.nodeEntityMap = new Map();

        /**
         * @type {Array<GameEntity>}
         */
        this.rigs = [];

        let instLayout = null;

        if (thiz.config.isInstanced)
        {
            //todo
            let instGen = new AttributeLayoutGenerator(null, [DefaultAttributes.INSTANCE_MATRIX], false, false);
            instLayout = instGen.generateAttributeLayout(null, thiz._instanceBuffer.getInstanceBufferView())
        }

        this.localsBuffer = bufferManager.allocUniformBlockBuffer("Locals", gltf.primitiveCount, program.uniformBlocks.Locals);

        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(prim => {    

                prims[prim.id] ={
                    binding: gpu.createGeometryBinding(prim.vertexLayout, prim.indexLayout, instLayout),
                    instanceConfig : thiz.config,
                    extents : prim.extents,
                    center: prim.center,
                    locals : thiz.localsBuffer.getBlock(prim.id),
                    program : program,
                    material : prim.material
                };
            })
        })
        
        /**
         * 
         * @param {GLTFNode} node 
         * @param {GameEntity} parentEntity 
         */
        function nodeHelper(node, parentEntity)
        {
            
            let entity = parentEntity.createChild(Transform);
            entity.get(Transform).setLocalMatrix(node.localMatrix);
            thiz.nodeEntityMap.set(node.id, entity);    

            if(node.mesh)
            {
                if (node.skin)
                {
                    entity.add(Rig);
                    entity.get(Rig).configure(node.skin, bufferManager);
                    thiz.rigs.push(entity);
                }

                node.mesh.primitives.forEach(prim =>{
                    if (node.skin)
                    {
                        //thiz.animProgramAsset = thiz.animProgramAsset || 
                        prims[prim.id].program = thiz.animProgramAsset.program;
                    }
                    let primEntity = entity.createChild(PrimRender, Transform.TAG_MOVED);

                    if (thiz.config.cullRegion)
                    {
                        primEntity.get(PrimRender).configure(prims[prim.id], false);
                        thiz.config.cullRegion.addPrim(primEntity.get(PrimRender));
                    }
                    else
                    {
                        primEntity.get(PrimRender).configure(prims[prim.id], thiz.config.autoCull);
                    }
                });
            }

            if (node.children)
            {
                for (let child of node.children)
                {
                    nodeHelper(child, entity);
                }
            }
        }

        //traverse node graph
        for (let node of gltf.scenes[0].nodes)
        {
            nodeHelper(node, this.modelRoot);
        }

        //Resolve joints to their entities
        for (let rig of this.rigs)
        {
            rig.get(Rig).resolveJoints(this.nodeEntityMap);
        }
        
        
        if (this.animationCount > 0)
        {
            this.setAnimationIndex(0);
            this.setAnimationTime(0);
        }

        this._doLoadedList.forEach(fn => fn.call(thiz));
    }

    set asset(gltfAsset)
    {
        if (this._asset == gltfAsset)
        {
            return;
        }

        if (this.modelRoot)
        {
            this.modelRoot.destroy();
        }

        this.gltf = null;

        this.modelRoot = this.entity.createChild();

        this._asset = gltfAsset;

        gltfAsset.safePromise(this._lifetime)
            .then(this._processGltfAsset.bind(this))
            .catch(err => {err && console.error(err)});
    }

    onDetach()
    {
        this._lifetime.end();
    }
}


ModelRender.views = {
    animating : ["animating"]
};

ModelRender.update = function(dt, clock)
{
    this.views.animating(e => {
        e.get(ModelRender)._advanceAnimationTime(dt);
    });
}

ModelRender.defaultShaderMods = [ShaderSimpleTexture]
