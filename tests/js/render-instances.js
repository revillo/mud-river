import { ShaderStage, BufferType, BufferUsage, ShaderValueType } from '../../src/buff/gpu-types.js';
import { Rasterizer } from '../../src/buff/rasterizer.js';
import { GPUContext} from '../../src/buff/gpu.js'
import { RasterShaderBuilder} from '../../src/buff/shader-builder.js'
import { mat4, vec3, quat, glMatrix } from '../../src/math/index.js'
import { Sphere } from '../../src/shape/sphere.js'
import { ShaderNormals } from '../../src/buff/shader-mods/normals.js'
import { ShaderInstances } from '../../src/buff/shader-mods/instances.js'
import { AttributeLayoutGenerator, DefaultAttributes } from '../../src/buff/attribute.js';
import { RasterProgram } from '../../src/buff/program.js';
import { UniformBlockBuffer, BufferManager } from '../../src/buff/buffer.js';
import { Timer } from '../../src/util/timer.js';

var start = function()
{        
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gpu = new GPUContext(canvas);
    const renderer = new Rasterizer(gpu);
    const program = new RasterProgram(gpu, DefaultAttributes, [ShaderInstances, ShaderNormals]);
    const bufferManager = new BufferManager(gpu);
    
    //Manage instances
    const instanceCount = 2;
    var instanceBB = bufferManager.allocInstanceBlockBuffer(instanceCount, program.instanceAttributes, BufferUsage.DYNAMIC);
    const m1 = instanceBB.getBlock(0).instanceMatrix;
    mat4.identity(m1);

    const m2 = instanceBB.getBlock(1).instanceMatrix;
    mat4.fromTranslation(m2, [3,0,0]);

    instanceBB.uploadBlocks(0, instanceCount);

    function makeSphereMesh()
    {
        const sphere = new Sphere(1.0);
        const sphereGeometry = sphere.createGeometry();

        const binding = bufferManager.createGeometryBinding(sphereGeometry, 
            [DefaultAttributes.position, DefaultAttributes.normal, DefaultAttributes.uv0], 
            [DefaultAttributes.instanceMatrix],
            instanceBB.getInstanceBufferView()
        );
  
        const localsBuffer = bufferManager.allocUniformBlockBuffer("Locals", 1, program.uniformBlocks.Locals);
        const myBlock = localsBuffer.getBlock(0);
        mat4.identity(myBlock.model);

        return {
            binding : binding,
            numInstances : instanceCount,
            bindBuffers : function(gpu, renderBin)
            {
                localsBuffer.bindUniformBlock(0, renderBin.program)
            }
        };
    }

    //Test Sphere
    var triangleMesh = makeSphereMesh();

    const camera = {
        projection : mat4.create(),
        view : mat4.create()
    };

    mat4.perspective(camera.projection, glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 100);
    mat4.lookAt(camera.view, vec3.fromValues(0,3,10), vec3.fromValues(0,3, 0.5), vec3.fromValues(0, 1, 0));
    
    const globalsBuffer = bufferManager.allocUniformBlockBuffer("Globals", 1, program.uniformBlocks.Globals);
    const globalBlock = globalsBuffer.getBlock(0);
    mat4.multiply(globalBlock.viewProjection, camera.projection, camera.view);

    const triRenderBin = {
        program : program,
        meshes : [
            triangleMesh
        ],
        bindBuffers : function(gpu)
        {
            globalsBuffer.bindUniformBlock(0, this.program);
        }
    };

    const scene = {
        renderBins : [triRenderBin]
    };
    
    var timer = new Timer();

    var frame = ()=>
    {
        let time = timer.now();

        mat4.fromTranslation(m2, [0, Math.sin(time), 0]);
        instanceBB.uploadBlocks(1, 1);

        renderer.clear({r: 0, g: 0, b: 0, a: 1});
        renderer.rasterizeScenes([scene]);
        requestAnimationFrame(frame);
    }

    window.onresize = function()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        mat4.perspective(camera.projection, glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 100);
        mat4.multiply(globalBlock.viewProjection, camera.projection, camera.view);
    }

    frame();
}

window.onload = function()
{
    start();
}