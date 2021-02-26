import { ShaderStage, BufferType, BufferUsage, ShaderValueType } from '../render/types.js';
import { Rasterizer } from '../render/rasterizer.js';
import { GPUContextGL} from '../render/gpu.js'
import { ShaderBuilder} from '../render/shader-builder.js'
import { mat4, vec3, quat, glMatrix } from '../math/index.js'
import { DefaultAttributes } from '../render/attribute.js';

var start = function()
{        
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gpu = new GPUContextGL(canvas);
    const renderer = new Rasterizer(gpu);
    
    const vertBuilder = new ShaderBuilder(gpu.platform, ShaderStage.VERTEX);
    const fragBuilder = new ShaderBuilder(gpu.platform, ShaderStage.FRAGMENT);

    console.log(vertBuilder.text);
    console.log(fragBuilder.text);
    
    const vertShader = gpu.createShader(vertBuilder.text, vertBuilder.stage)
    const fragShader = gpu.createShader(fragBuilder.text, fragBuilder.stage)

    const program = gpu.createProgram(vertShader, fragShader, DefaultAttributes);

    function makeQuadMesh()
    {

        //Test Quad
       
        var triPositions = [
            -1.0, -1.0, 0.5, 
            1.0, -1.0, 0.5,
            1.0, 1.0, 0.5,
            -1.0, 1.0, 0.5 
        ];

        var triIndices = [
            0, 1, 2, 0, 2, 3
        ];

        var vertBuffer = gpu.createBuffer(BufferType.VERTEX);
        var indexBuffer = gpu.createBuffer(BufferType.INDEX);

        gpu.uploadArrayBuffer(vertBuffer, new Float32Array(triPositions));
        gpu.uploadArrayBuffer(indexBuffer, new Uint16Array(triIndices));

        const triVertexLayout = 
        {
            a_Position : 
            {
                buffer: vertBuffer,
                location : DefaultAttributes.Position.location,
                offset: 0,
                stride: 12,
                count: 3,
                type : ShaderValueType.FLOAT,
                isNormalized : false
            }
        };

        const indexLayout = 
        {
            buffer : indexBuffer,
            count : triIndices.length,
            start : 0
        }
        
        const triBinding = gpu.createGeometryBinding(triVertexLayout, indexLayout);

        const worldTransform = mat4.create();

        return {
            binding : triBinding,
            worldTransform : mat4.create(),
            numInstances : 0,
            bindBuffers : function(gpu)
            {
                const modelUniformLoc = gpu.gl.getUniformLocation(program, "u_Locals.model");
                gpu.gl.uniformMatrix4fv(modelUniformLoc, false, worldTransform);
            }
        };
    }

    const camera = {
        projection : mat4.create(),
        view : mat4.create(),
        viewProjection : mat4.create()
    };

    //Test Sphere
    var triangleMesh = makeQuadMesh();

    const triRenderBin = {
        program : program,
        meshes : [
            triangleMesh
        ],
        bindBuffers : (gpu) =>
        {
            var vploc = gpu.gl.getUniformLocation(program, "u_Globals.viewProjection");
            gpu.gl.uniformMatrix4fv(vploc, false, camera.viewProjection);
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