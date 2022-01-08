import { Lifetime } from "../assets/assets.js";
import { ShaderSimpleTexture } from "../gfx/shader-mods/simple-texture.js";
import { mat4, vec3 } from "../glm/index.js";
import { Matrix4, Quaternion, Vector3 } from "../math/index.js";
import { Transform } from "./transform.js";
import { GLTFEnum } from "./../assets/gltf.js"
import { BinType, BufferUsage } from "../gfx/gpu-types.js";
import { AttributeBlockBuffer, BufferManager, UniformBlockBuffer } from "../gfx/buffer.js";
import { ShaderSkinning } from "../gfx/shader-mods/skinning.js";
import { ShaderInstances } from "../gfx/shader-mods/instances.js";
import { AttributeLayoutGenerator, DefaultAttributes } from "../gfx/attribute.js";
import { Collision } from "../game/collision.js";
import { GameComponent } from "../game/game-component.js";
import { GameEntity } from "../game/game-entity.js";

let tempVec3 = new Vector3();
let temp2Vec3 = new Vector3();
let tempQuat = new Quaternion();
let temp2Quat = new Quaternion();
let tempMat4 = new Matrix4();

export class Rig extends GameComponent
{
    /**
     * @type {UniformBlockBuffer}
     */
    bindMatrices = null;
    invBinds = null;
    joints = null;

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
        mat4.affineInvert(tempMat4, Transform.getWorldMatrix(this.entity));

        for (let i = 0; i < this.joints.length; i++)
        {
            let block = this.bindMatrices.getBlock(i);

            mat4.affineMultiply(block.joint, tempMat4, this.joints[i].get(Transform).worldMatrix);
            mat4.affineMultiply(block.joint, block.joint, this.invBinds[i]);
        }
    }

    onDetach()
    {
        if (this.bindMatrices) {
            this.bindMatrices.freeBufferGPU();
        }
    }
}

//Used for additional culling logic
let noCull = function() 
{
    return true;
}

export class CullRegion extends GameComponent
{
    primRenders = [];
    _cullBody = null;
    _collider = null;
    cullFunction = noCull;

    addPrim(primRender)
    {
        this.primRenders.push(primRender)
    }

    configureSphere(center, radius) {
        this.addToCullWorld(
            this.context.PHYSICS.ColliderDesc.ball(radius)
            .setCollisionGroups(Collision.getCollisionGroups([Collision.CULL], [Collision.GAZE]))
            .setTranslation(center.x, center.y, center.z)
        );
    }

    configureBox(center, extents) {
        this.get(CullRegion).addToCullWorld( 
            this.context.PHYSICS.ColliderDesc.cuboid(extents.x, extents.y, extents.z)
                .setCollisionGroups(Collision.getCollisionGroups([Collision.CULL], [Collision.GAZE]))
                .setTranslation(center.x, center.y, center.z)
        );
    }

    onDetach()
    {
        if (this._collider) {
            this.context.cullMap.delete(this._collider.handle);
        }

        if (this._cullBody) {
            this.context.cullWorld.removeRigidBody(this._cullBody);
        }
    }

    addToCullWorld(colliderDesc)
    {
        if (this._cullBody)
        {
            this.remakeCollider(colliderDesc);
            return;
        }
        let P = this.context.PHYSICS;
        var desc = P.RigidBodyDesc.newStatic();
        this._cullBody = this.context.cullWorld.createRigidBody(desc);
        this._collider = this.context.cullWorld.createCollider(colliderDesc, this._cullBody.handle);
        this.context.cullMap.set(this._collider.handle, this);
    }

    remakeCollider(colliderDesc)
    {
        this.context.cullMap.delete(this._collider.handle);
        this.context.cullWorld.removeCollider(this._collider);
        this._collider = this.context.cullWorld.createCollider(colliderDesc, this._cullBody.handle);
        this.context.cullMap.set(this._collider.handle, this);
    }
}

CullRegion.views = {
    moved : [CullRegion, Transform.TAG_MOVED]
}

CullRegion.update = function() {
    this.views.moved(e => {
        let cullBody = e.get(CullRegion)._cullBody;
        if (!cullBody) return;
        const wm = Transform.getWorldMatrix(e);
        wm.getTranslation(tempVec3);
        cullBody.setTranslation(tempVec3);
    });
}

export class PrimRender extends GameComponent
{
    prim = null;
    autoCull = true;
    rig = null;

    configure(prim, autoCull, rig)
    {
        this.prim = prim;
        this.autoCull = autoCull;
        this.rig = rig;

        if (autoCull)
        {
            this.entity.ensure(CullRegion);
            this.get(CullRegion).configureBox(this.prim.center, this.prim.extents);
            this.get(CullRegion).addPrim(this);
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


export class ModelRender extends GameComponent
{
    _asset = null;
    _lifetime = new Lifetime;
    _doLoadedList = new Array();
    /**
     * @type {AttributeBlockBuffer}
     */
    _instanceBuffer = null;

    /**
     * @type {UniformBlockBuffer}
     */
    _localsBuffer = null;

    _instanceHoles = [];
    _gltf = null;

    programAsset = null;
    animProgramAsset = null;
    animationTime = null;
    animationBlending = null;
    
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

    setAnimationNamed(name)
    {
        this.animation = this.gltf.animationMap.get(name);
    }

    setAnimationIndex(index)
    {
        this.animation = this.gltf.animations[index];
        if (!this.animation) {
            console.error("here" + index, index, this.gltf);
        }
    }

    isLoaded()
    {
        return this.gltf;
    }

    doLoaded(fn)
    {
        if (this.isLoaded())
        {
            fn.call(this);
        }
        else
        {
            this._doLoadedList.push(fn);
        }
    }

    playNamedAnimation(name)
    {
        this.entity.attach(ModelRender.ANIMATING_TAG);
        this.setAnimationNamed(name);
        this.animationTime = 0.0;
        this.animationBlending = 0.2;
    }

    /**
     * @deprecated
     * @param {number} index 
     */
    playAnimation(index)
    {
        this.entity.attach(ModelRender.ANIMATING_TAG);
        this.setAnimationIndex(index);
        this.animationTime = 0.0;
    }

    stopAnimating()
    {
        this.entity.detach(ModelRender.ANIMATING_TAG);
    }

    _advanceAnimationTime(dt)
    {
        this.animationBlending -= dt;

        let bt = 1.0 - this.animationBlending / 0.2;
        let blend = 10 + bt * 20;

        this.setAnimationTime(this.animationTime + dt, this.animationBlending > 0 ? blend : 0, dt);
    }

    setAnimationTime(time, blending, dt, loop = true)
    {
        if (!this.animation) {
            return;
        }

        this.looping = loop;

        if(loop) time = (time % this.animation.duration);
        this.animationTime = time;

        
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
                
                if (blending > 0) {
                    entity.get(Transform).smoothSlerpLocalRotation(tempQuat, blending, dt);
                } else {
                    entity.get(Transform).setLocalRotation(tempQuat);
                }
            }
            else if (channel.target.path == GLTFEnum.TRANSLATION)
            {
                let i = frameIndex * 3;
                tempVec3.set(vs[i], vs[i+1], vs[i+2]);
                i+=3;
                temp2Vec3.set(vs[i], vs[i+1], vs[i+2]);

                vec3.lerp(tempVec3, tempVec3, temp2Vec3, frameDelta);

                if (blending > 0) {
                    entity.get(Transform).smoothLerpLocalTranslation(tempVec3, blending, dt);
                } else {
                    entity.get(Transform).setLocalTranslation(tempVec3);
                }
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
        const self = this;
        
        /**
         * @type {Map<number, GameEntity>}
         */
        this.nodeEntityMap = new Map();

        /**
         * @type {Array<GameEntity>}
         */
        this.rigs = [];

        let instLayout = null;

        if (self.config.isInstanced)
        {
            //todo
            let instGen = new AttributeLayoutGenerator(null, [DefaultAttributes.INSTANCE_MATRIX], false, false);
            instLayout = instGen.generateAttributeLayout(null, self._instanceBuffer.getInstanceBufferView())
        }

        this._localsBuffer = bufferManager.allocUniformBlockBuffer("Locals", gltf.primitiveCount, program.uniformBlocks.Locals);

        if (gltf.skins) {
            gltf.skins.forEach(skin => {
                let rig = self.entity.createChild(Rig);
                rig.get(Rig).configure(skin, bufferManager);
                self.rigs.push(rig);
            });
        }

        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(prim => {    

                prims[prim.id] = {
                    //todo delete geometry binding
                    binding: gpu.createGeometryBinding(prim.vertexLayout, prim.indexLayout, instLayout),
                    instanceConfig : self.config,
                    extents : prim.extents,
                    center: prim.center,
                    locals : self._localsBuffer.getBlock(prim.id),
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
            self.nodeEntityMap.set(node.id, entity);    

            if(node.mesh)
            {

                node.mesh.primitives.forEach(prim =>{

                    let primEntity = entity.createChild(PrimRender, Transform.TAG_MOVED);
                    let rig = null;

                    if (node.skin !== undefined)
                    {
                        //thiz.animProgramAsset = thiz.animProgramAsset || 
                        prims[prim.id].program = self.animProgramAsset.program;
                        rig = self.rigs[node.skin];
                    }

                    if (self.config.cullRegion)
                    {
                        primEntity.get(PrimRender).configure(prims[prim.id], false, rig);
                        self.config.cullRegion.addPrim(primEntity.get(PrimRender));
                    }
                    else
                    {
                        primEntity.get(PrimRender).configure(prims[prim.id], self.config.autoCull, rig);
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

        this._doLoadedList.forEach(fn => fn.call(self));
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
        if (this._instanceBuffer) {
            this._instanceBuffer.freeBufferGPU();
        }

        if (this._localsBuffer) {
            this._localsBuffer.freeBufferGPU();
        }
    }
}

ModelRender.ANIMATING_TAG = "animating";

ModelRender.views = {
    animating : [ModelRender.ANIMATING_TAG]
};

ModelRender.update = function(dt, clock)
{
    this.views.animating(e => {
        e.get(ModelRender)._advanceAnimationTime(dt);
    });
}

ModelRender.defaultShaderMods = [ShaderSimpleTexture]
