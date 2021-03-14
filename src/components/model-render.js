import { Lifetime } from "../assets/assets.js";
import { ShaderSimpleTexture } from "../buff/shader-mods/simple-texture.js";
import { EntityComponent, GameEntity } from "../game/game-context.js";
import { mat4 } from "../glm/index.js";
import { Matrix4, Quaternion, Vector3 } from "../math/index.js";
import { Transform } from "./transform.js";
import { GLTFEnum } from "./../assets/gltf.js"
import { BinType, BufferUsage } from "../buff/gpu-types.js";
import { BufferManager } from "../buff/buffer.js";
import { ShaderSkinning } from "../buff/shader-mods/skinning.js";

let tempVec3 = new Vector3();
let temp2Vec3 = new Vector3();
let tempQuat = new Quaternion();
let temp2Quat = new Quaternion();
let tempMat4 = new Matrix4();

/*
export class BoneJoint extends EntityComponent
{
    invBind = null;

    configure(invBind, bindMatrices, index)
    {
        this.invBind = invBind;
    }
}*/

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

export class PrimRender extends EntityComponent
{

    configure(prim)
    {
        this.prim = prim;
        this.addToCullWorld();
    }

    addToCullWorld()
    {
        let P = this.context.PHYSICS;
        const prim = this.prim;

        //todo compute
        if (!this.prim.extents){
            return;
        }

        var desc = P.RigidBodyDesc.newKinematic();
        this._cullBody = this.context.cullWorld.createRigidBody(desc);

        var colliderDesc = P.ColliderDesc.cuboid(prim.extents[0], prim.extents[1], prim.extents[2])
            .setCollisionGroups(P.getCollisionGroups([P.GROUP_CULL], [P.GROUP_PLAYER]))
            .setTranslation(prim.center.x, prim.center.y, prim.center.z);
        
        this._collider = this.context.cullWorld.createCollider(colliderDesc, this._cullBody.handle);

        this.context.cullMap.set(this._collider.handle, this);
    }

    destroy()
    {
        this.context.cullMap.delete(this._collider.handle);
        this.context.gpu.deleteGeometryBinding(this.prim.binding);
        this.context.cullWorld.removeRigidBody(this._cullBody);
    }
}

PrimRender.views = {
    prim_moved : [PrimRender, "moved"]
}

PrimRender.update = function(dt, clock, context)
{
    this.views.prim_moved(e => {
        const wm = e.parent.get(Transform).worldMatrix;
        let primC = e.get(PrimRender);
        mat4.copy(primC.prim.locals.model, wm);
        wm.copyTranslation(tempVec3);
        primC._cullBody.setTranslation(tempVec3);
    });
}


export class ModelRender extends EntityComponent
{
    asset = null;
    renderables = [];
    lifetime = new Lifetime;

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

    advanceAnimationTime(dt)
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
        const programAsset = programManager.fromMods(ShaderSimpleTexture);
        const animProgramAsset = programManager.fromMods(ShaderSkinning, ShaderSimpleTexture);
        const program = programAsset.program;
        
        this.asset = gltfAsset;
        const gltf = this.asset.gltf;
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

        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(prim => {

                const localBuffer = bufferManager.allocUniformBlockBuffer("Locals", 1, program.uniformBlocks.Locals);

                prims[prim.id] ={
                    binding: gpu.createGeometryBinding(prim.vertexLayout, prim.indexLayout),
                    numInstances: 0,
                    blockindex : 0,
                    extents : prim.extents,
                    center: prim.center,
                    localBuffer : localBuffer,
                    locals : localBuffer.getBlock(0),
                    //todo cache programs on materials?
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
                        prims[prim.id].program = animProgramAsset.program;
                    }
                    let primEntity = entity.createChild(PrimRender, "moved");
                    primEntity.get(PrimRender).configure(prims[prim.id]);
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

    }

    setAsset(gltfAsset)
    {
        if (this.asset == gltfAsset)
        {
            return;
        }

        if (this.modelRoot)
        {
            this.modelRoot.destroy();
        }

        this.gltf = null;

        this.modelRoot = this.entity.createChild();

        this.asset = gltfAsset;

        gltfAsset.safePromise(this.lifetime)
            .then(this._processGltfAsset.bind(this))
            .catch(err => {err && console.error(err)});
    }

    destroy()
    {
        this.lifetime.end();
    }
}


ModelRender.views = {
    animating : ["animating"]
};

ModelRender.update = function(dt, clock)
{
    this.views.animating(e => {
        e.get(ModelRender).advanceAnimationTime(dt);
    });
}