import { ShaderStage, BufferType, BufferUsage, ShaderValueType } from '../buff/gpu-types.js';
import { Rasterizer } from '../buff/rasterizer.js';
import { GPUContext} from '../buff/gpu.js'
import { RasterShaderBuilder} from '../buff/shader-builder.js'
import { mat4, vec3, quat, glMatrix } from '../math/index.js'
import { AttributeLayoutGenerator, DefaultAttributes } from '../buff/attribute.js';
import {UniformBlockBuffer, BufferManager} from '../buff/buffer.js'
import { RasterProgram } from '../buff/program.js';

var start = function()
{        
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gpu = new GPUContext(canvas);
    const renderer = new Rasterizer(gpu);
    const program = new RasterProgram(gpu);
    const bufferManager = new BufferManager(gpu);
    
    function makeQuadMesh()
    {

        //Make buffer views for geometry
        const vertBufferView = bufferManager.allocVertexBufferView(new Float32Array([
            -1.0, -1.0, 0.5, 
            1.0, -1.0, 0.5,
            1.0, 1.0, 0.5,
            -1.0, 1.0, 0.5 
        ]));

        const indexBufferView = bufferManager.allocIndexBufferView(new Uint16Array([
            0, 1, 2, 0, 2, 3
        ]));

        //Create geometry binding
        var attrGen = new AttributeLayoutGenerator([DefaultAttributes.Position]); 
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
                localsBuffer.bindUniformBlock(0, renderBin.program)
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
        bindBuffers : function(gpu) 
        {
            globalsBuffer.bindUniformBlock(0, this.program);
        }
    };

    const scene = {
        renderBins : [triRenderBin]
    };
    
    var frame = ()=>
    {
        renderer.clear({r: 0, g: 0, b: 0, a: 1});
        renderer.rasterizeScenes([scene]);
        requestAnimationFrame(frame);
    }

    window.onresize = function()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    frame();
}

window.onload = function()
{
    start();
}