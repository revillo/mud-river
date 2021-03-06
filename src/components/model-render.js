import { DefaultAttributes } from "../buff/attribute.js";
import { RasterProgram } from "../buff/program.js";
import { ShaderSimpleTexture } from "../buff/shader-mods/simple-texture.js";
import { mat4 } from "../math/index.js";
import { Transform } from "./transform.js";

export class ModelRender
{
    asset = null;
    renderables = [];

    _loadGltfAsset(gltfAsset)
    {
        //todo modify asset loading to allow unlistening
        
        const {gpu, bufferManager, programManager} = this.context;
        this.gpu = gpu;
        const programAsset = programManager.fromMods(ShaderSimpleTexture);
        const program = programAsset.program;

        this.asset = gltfAsset;
        this.gltf = this.asset.gltf;
        const prims = [];

        this.gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(prim => {

                const localBuffer = bufferManager.allocUniformBlockBuffer("Locals", 1, program.uniformBlocks.Locals);

                prims.push({
                    binding: gpu.createGeometryBinding(prim.vertexLayout, prim.indexLayout),
                    numInstances: 0,
                    blockindex : 0,
                    localBuffer : localBuffer,
                    locals : localBuffer.getBlock(0),
                    //todo cache programs on materials?
                    program : program,
                    material : prim.material
                })
            })
        })

        //todo cleanup bindings and programs and buffers, etc
        this.renderables = prims;
    }

    setAsset(gltfAsset)
    {
        if (this.asset == gltfAsset)
        {
            return;
        }

        gltfAsset.getPromise().then(this._loadGltfAsset.bind(this));
    }

    render(target)
    {
        const gpu = this.gpu;

        const transform = this.my(Transform);
        transform.updateLocal();

        this.renderables.forEach(mesh => {

            //target.globalsBuffer.bindUniformBlock(0, this.program);
            mesh.program.use();
            target.bindGlobals(mesh.program);

            mat4.copy(mesh.locals.model, transform.localMatrix);

            //mat4.fromRotationTranslationScale(mesh.locals.getBlock(mesh.blockIndex).model, );
            mesh.material.bindTextures(gpu, mesh.program);
            mesh.locals.bind(mesh.program)
            gpu.rasterizeMesh(mesh.binding, mesh.numInstances);        
        });
    }
}

ModelRender.selfAware = true;