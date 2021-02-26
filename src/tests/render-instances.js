import { ShaderStage, BufferType, BufferUsage } from '../render/types.js';
import { Rasterizer } from '../render/rasterizer.js';
import { GPUContextGL} from '../render/gpu.js'
import { ShaderBuilder} from '../render/shader-builder.js'
import { mat4, vec3, quat, glMatrix } from '../math/index.js'
import { Sphere } from '../shape/sphere.js'
import { ShaderNormals } from '../render/shader-mods/normals.js'
import { ShaderInstances } from '../render/shader-mods/instances.js'
import { DefaultAttributes } from '../render/attribute.js';

var start = function()
{        
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gpu = new GPUContextGL(canvas);
    const renderer = new Rasterizer(gpu);

    const vertBuilder = new ShaderBuilder(gpu.platform, ShaderStage.VERTEX, [ShaderInstances, ShaderNormals]);
    const fragBuilder = new ShaderBuilder(gpu.platform, ShaderStage.FRAGMENT, [ShaderInstances, ShaderNormals]);
    
    console.log(vertBuilder.text);
    console.log(fragBuilder.text);
    
    const vertShader = gpu.createShader(vertBuilder.text, vertBuilder.stage)
    const fragShader = gpu.createShader(fragBuilder.text, fragBuilder.stage)

    const program = gpu.createProgram(vertShader, fragShader, DefaultAttributes);

    function makeSphereMesh()
    {
        const sphere = new Sphere(1.0);

        const sphereGeometry = sphere.createGeometry();

        const vertBuffer = gpu.createBuffer(BufferType.VERTEX);
        const indexBuffer = gpu.createBuffer(BufferType.INDEX);

        gpu.uploadArrayBuffer(vertBuffer, sphereGeometry.vertices);
        gpu.uploadArrayBuffer(indexBuffer, sphereGeometry.indices);
        
        const instanceCount = 2;
        const floatsPerMatrix = 16;
        const bytesPerMatrix = 4 * floatsPerMatrix;
        const instances = new Float32Array(floatsPerMatrix * instanceCount);
        const instanceBuffer = gpu.createBuffer(BufferType.VERTEX, BufferUsage.STATIC);

        const m1 = new Float32Array(instances.buffer, 0, floatsPerMatrix);
        const m2 = new Float32Array(instances.buffer, bytesPerMatrix, floatsPerMatrix);
        
        mat4.fromTranslation(m2, [2,0,0]);
        mat4.identity(m1);
        
        gpu.uploadArrayBuffer(instanceBuffer, instances);
        
        const sphereVertexLayout = 
        {
            a_Position : 
            {
                buffer : vertBuffer,
                location : DefaultAttributes.Position.location,
                offset: 0,
                stride: 4 * 8,
                count: 3,
                type : "FLOAT",
                isNormalized : false
            },

            a_Normal : 
            {
                buffer : vertBuffer,
                location : DefaultAttributes.Normal.location,
                offset: 4 * 3,
                stride: 4 * 8,
                count: 3,
                type : "FLOAT",
                isNormalized : false
            }
        };

        
        const instanceLayout = 
        {
            a_InstanceMatrix :
            {
                buffer : instanceBuffer,
                location : DefaultAttributes.InstanceMatrix.location,
                offset: 0,
                count : 1,
                stride: bytesPerMatrix,
                type : "MAT4",
                isNormalized: false
            }
        }


        const indexLayout =
        {
            count : sphereGeometry.count,
            start : 0,
            buffer: indexBuffer
        }

        const sphereBinding = gpu.createGeometryBinding(sphereVertexLayout, indexLayout, instanceLayout);
        

        let worldTransform = mat4.create();

        return {
            binding : sphereBinding,
            worldTransform : worldTransform,
            numInstances : instanceCount,

            bindBuffers : (gpu) =>
            {
                const modelUniformLoc = gpu.gl.getUniformLocation(program, "u_Locals.model");
                gpu.gl.uniformMatrix4fv(modelUniformLoc, false, worldTransform);
            }
        };
    }

    //Test Sphere
    var triangleMesh = makeSphereMesh();


    const camera = {
        projection : mat4.create(),
        view : mat4.create(),
        viewProjection : mat4.create()
    };

    mat4.perspective(camera.projection, glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 100);
    mat4.lookAt(camera.view, vec3.fromValues(0,3,10), vec3.fromValues(0,3, 0.5), vec3.fromValues(0, 1, 0));
    mat4.multiply(camera.viewProjection, camera.projection, camera.view);
    
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
        camera : camera,
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
        mat4.perspective(camera.projection, glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 100);
        mat4.multiply(camera.viewProjection, camera.projection, camera.view);
    }


    frame();
}

window.onload = function()
{
    start();
}