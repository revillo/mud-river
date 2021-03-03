import { DefaultAttributes } from "../buff/attribute.js";
import { RasterProgram } from "../buff/program.js";
import { ShaderSimpleTexture } from "../buff/shader-mods/simple-texture.js";
import { mat4 } from "../math/index.js";
import { RenderDemo } from "./render-demo.js";

class RenderGLTF extends RenderDemo
{
    init(camera, scenes)
    {
        const {bufferManager, gpu, textureManager, gltfManager} = this.engine;
     
        const program = new RasterProgram(gpu, DefaultAttributes, [ShaderSimpleTexture]);

        var textureAsset = textureManager.fromUrl("test-image.png");

        //gltfManager.fromUrl("gltf/build/cubepack.gltf");
        const gltfAsset = gltfManager.fromUrl("gltf/src/cube.gltf");

        gltfAsset.getPromise().then(gltfAsset => {
    
            const gltf = gltfAsset.gltf;
            const geometry = gltf.meshes[0].primitives[0];
            
            
            const geoBinding = gpu.createGeometryBinding(geometry.vertexLayout, geometry.indexLayout);
            
            const localsBuffer = bufferManager.allocUniformBlockBuffer("Locals", 1, program.uniformBlocks.Locals);
            const myBlock = localsBuffer.getBlock(0);
            mat4.identity(myBlock.model);

            const globalsBuffer = bufferManager.allocUniformBlockBuffer("Globals", 1, program.uniformBlocks.Globals);
            const globalBlock = globalsBuffer.getBlock(0);
            mat4.identity(globalBlock.viewProjection);
    
       
            const mesh = {
                binding : geoBinding,
                numInstances: 0,
                bindBuffers: function(gpu, renderBin)
                {
                    textureAsset.bind(renderBin.program, "u_emissive");
                    localsBuffer.bindUniformBlock(0, renderBin.program)
                }
            }

            const triRenderBin = {
                program : program,
                meshes : [
                    mesh
                ],
                bindBuffers : function() 
                {
                    mat4.multiply(globalBlock.viewProjection, camera.projection, camera.view);
                    globalsBuffer.bindUniformBlock(0, this.program);
                }
            };
        
            const scene = {
                renderBins : [triRenderBin]
            };

            scenes[0] = scene;

            });
    }

    update(dt, time)
    {
        const theta = time;
        const radius = 10.0;

        mat4.lookAt(this.camera.view, [radius * Math.sin(theta),2,radius * Math.cos(theta)], [0, 0, 0], [0, 1, 0]);
    }


}

new RenderGLTF();