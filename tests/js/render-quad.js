import { AttributeLayoutGenerator, DefaultAttributes } from "../../src/gfx/attribute.js";
import { RasterProgram } from "../../src/gfx/program.js";
import { ShaderSimpleTexture } from "../../src/gfx/shader-mods/simple-texture.js";
import { mat4 } from "../../src/glm/index.js";
import { RenderDemo } from "./render-demo.js";

class RenderQuad extends RenderDemo
{
    init()
    {
        const {bufferManager, gpu, textureManager} = this.engine;
       
        const program = new RasterProgram(gpu, DefaultAttributes, [ShaderSimpleTexture]);

        var textureAsset = textureManager.fromUrl("test-image.png");
     
        function makeQuadMesh()
        {
    
            //Make buffer views for geometry
            const vertBufferView = bufferManager.allocVertexBufferView(new Float32Array([
                -1.0, -1.0, 0.5, 0, 1,
                1.0, -1.0, 0.5, 1, 1,
                1.0, 1.0, 0.5, 1, 0,
                -1.0, 1.0, 0.5, 0, 0 
            ]));
    
            const indexBufferView = bufferManager.allocIndexBufferView(new Uint16Array([
                0, 1, 2, 0, 2, 3
            ]));
    
            //Create geometry binding
            var attrGen = new AttributeLayoutGenerator([DefaultAttributes.POSITION, DefaultAttributes.UV0], null, true); 
            const triVertexLayout = attrGen.generateAttributeLayout(vertBufferView);
            const triBinding = gpu.createGeometryBinding(triVertexLayout, indexBufferView);
    
            //Create uniform buffer for locals
            const localsBuffer = bufferManager.allocUniformBlockBuffer("Locals", 1, program.uniformBlocks.Locals);
            const myBlock = localsBuffer.getBlock(0);
            mat4.identity(myBlock.model);
    
            //Return a mesh rendering context
            return {
                binding : triBinding,
                numInstances : 0,
                bindBuffers : function(gpu, renderBin)
                {
                    textureAsset.bind(renderBin.program, "t_emissive");
                    myBlock.bind(renderBin.program);
                    //localsBuffer.bindUniformBlock(0, renderBin.program)
                }
            };
        }
         
        const globalsBuffer = bufferManager.allocUniformBlockBuffer("Globals", 1, program.uniformBlocks.Globals);
        const globalBlock = globalsBuffer.getBlock(0);
        mat4.identity(globalBlock.viewProjection);
    
        var quadMesh = makeQuadMesh();
    
        const triRenderBin = {
            program : program,
            meshes : [
                quadMesh
            ],
            bindBuffers : function() 
            {
                globalBlock.bind(this.program);
            }
        };
    
        const scene = {
            renderBins : [triRenderBin]
        };

        this.scenes = [scene];
    }
}


new RenderQuad();