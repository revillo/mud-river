import { Lifetime } from "../assets/assets.js";
import { ShaderSimpleTexture } from "../buff/shader-mods/simple-texture.js";
import { EntityComponent } from "../game/game-context.js";
import { mat4 } from "../glm/index.js";
import { Vector3 } from "../math/index.js";
import { Transform } from "./transform.js";

let tempVec3 = new Vector3();

export class PrimRender extends EntityComponent
{

    setPrim(prim)
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
        
        this.collider = this.context.cullWorld.createCollider(colliderDesc, this._cullBody.handle);

        this.context.cullMap.set(this.collider.handle, this);
    }

    destroy()
    {
        this.context.cullMap.delete(this.collider.handle);
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
        const wm = e.get(Transform).worldMatrix;
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

    _loadGltfAsset(gltfAsset)
    {
        const {gpu, bufferManager, programManager} = this.context;
        this.gpu = gpu;
        const programAsset = programManager.fromMods(ShaderSimpleTexture);
        const program = programAsset.program;

        this.asset = gltfAsset;
        const gltf = this.asset.gltf;
        const prims = [];
        const thiz = this;

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
        
        function nodeHelper(node)
        {
            if(node.mesh)
            {
                node.mesh.primitives.forEach(prim =>{
                    let primEntity = thiz.primContainer.createChild(PrimRender, Transform);
                    primEntity.get(PrimRender).setPrim(prims[prim.id]);
                    primEntity.get(Transform).setLocalMatrix(node.matrix);
                });
            }

            if (node.children)
            {
                node.children.forEach(nodeHelper);
            }
        }

        gltf.scenes[0].nodes.forEach(nodeHelper);
    }

    setAsset(gltfAsset)
    {
        if (this.asset == gltfAsset)
        {
            return;
        }

        if (this.primContainer)
        {
            this.primContainer.destroy();
        }

        this.primContainer = this.entity.createChild();

        this.asset = gltfAsset;

        gltfAsset.safePromise(this.lifetime)
            .then(this._loadGltfAsset.bind(this))
            .catch(err => {err && console.error(err)});
    }

    destroy()
    {
        this.lifetime.end();
    }
}
