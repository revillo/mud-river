import { Lifetime } from "../assets/assets.js";
import { DefaultAttributes } from "../buff/attribute.js";
import { RasterProgram } from "../buff/program.js";
import { ShaderSimpleTexture } from "../buff/shader-mods/simple-texture.js";
import { mat4 } from "../math/index.js";
import { Transform } from "./transform.js";

var once = false;

export class PrimRender
{

    setPrim(prim)
    {
        this.prim = prim;
    }

    render(target)
    {
        const prim = this.prim;
        const program = prim.program;
        program.use();
        target.bindGlobals(program);        
        this.get(Transform).getWorldMatrix(prim.locals.model);
        prim.material.bindTextures(target.gpu, program);
        prim.locals.bind(program)
        target.gpu.rasterizeMesh(prim.binding, prim.numInstances);        

        if (!once)
        {
            console.log(prim.locals.model);
            once = true;
        }
    }

    destroy()
    {
        
    }

}

PrimRender.selfAware = true;

export class ModelRender
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
                    let primEntity = thiz.createChild(PrimRender, Transform);
                    primEntity.get(PrimRender).setPrim(prims[prim.id]);
                    primEntity.get(Transform).setMatrix(node.matrix);
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

        this.asset = gltfAsset;

        gltfAsset.safePromise(this.lifetime).then(this._loadGltfAsset.bind(this));
    }

    destroy()
    {
        this.lifetime.end();
    }
}

ModelRender.selfAware = true;