import { ShaderStage, BufferType, BufferUsage, ShaderValueType } from './render/gpu-types.js';
import { Rasterizer } from './render/rasterizer.js';
import { GPUContext} from './render/gpu.js'
import { mat4, vec3, quat, glMatrix } from './math/index.js'
import { Sphere } from './shape/sphere.js'
import { ShaderNormals } from './render/shader-mods/normals.js'
import { ShaderInstances } from './render/shader-mods/instances.js'
import { DefaultAttributes } from './render/attribute.js';
import { RasterProgram } from './render/program.js';
import { BufferManager, UniformBlockBuffer } from './render/buffer.js';

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
    const m1 = instanceBB.getBlock(0).InstanceMatrix;
    mat4.identity(m1);

    const m2 = instanceBB.getBlock(1).InstanceMatrix;
    mat4.fromTranslation(m2, [3,0,0]);

    instanceBB.uploadBlocks(0, instanceCount);

    function makeSphereMesh()
    {
        const sphere = new Sphere(1.0);
        const sphereGeometry = sphere.createGeometry();

        const binding = bufferManager.createGeometryBinding(sphereGeometry, 
            [DefaultAttributes.Position, DefaultAttributes.Normal, DefaultAttributes.UV0], 
            [DefaultAttributes.InstanceMatrix],
            instanceBB.getInstanceBufferView()
        );
  
        const localsBuffer = bufferManager.allocUniformBlockBuffer("Locals", 1, program.uniformBlocks.Locals);
        const myBlock = localsBuffer.getBlock(0);
        mat4.identity(myBlock.model);

        return {
            binding : binding,
            numInstances : instanceCount,
            worldTransform : myBlock.model,
            bindBuffers : function(gpu, renderBin)
            {
                localsBuffer.bindUniformBlock(0, renderBin.program)
            }
        };
    }


    //Test Sphere
    var triangleMesh = makeSphereMesh();


    function makePhysicsWorld()
    {
        var RAPIER = window.RAPIER;

        let gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
        let world = new RAPIER.World(gravity);

        let sphereBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(0, 10, 0);
        let sphereBody = world.createRigidBody(sphereBodyDesc);
        let sphereColliderDesc = RAPIER.ColliderDesc.ball(1.0);
        world.createCollider(sphereColliderDesc, sphereBody.handle);


        let groundRotation = quat.create();
        quat.rotateX(groundRotation, groundRotation, glMatrix.toRadian(10));

        let groundRotationRapier = new RAPIER.Quaternion(groundRotation[0], groundRotation[1], groundRotation[2], groundRotation[3]);

        let groundBodyDesc = RAPIER.RigidBodyDesc.newStatic().setRotation(groundRotationRapier);
        let groundBody = world.createRigidBody(groundBodyDesc);
        let groundColliderDesc = RAPIER.ColliderDesc.cuboid(50, 1.0, 50).setRestitution(0.5);
        world.createCollider(groundColliderDesc, groundBody.handle);

        var stepEvents = new RAPIER.EventQueue(true);

        return {
            world : world,
            sphereBody : sphereBody,
            step : () => {
                world.step(stepEvents)
            }
        }
    }

    var physWorld = makePhysicsWorld();

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
        globalBlock : globalBlock,
        bindBuffers : function()
        {
            globalsBuffer.bindUniformBlock(0, this.program);
        }
    };

    const scene = {
        renderBins : [triRenderBin]
    };
    
    var frame = ()=>
    {
        physWorld.step();

        var t = physWorld.world.colliders.get(0).translation();
        var r = physWorld.world.colliders.get(0).rotation();
        //mat4.fromTranslation(triangleMesh.worldTransform, [t.x, t.y, t.z]);

        mat4.fromRotationTranslation(triangleMesh.worldTransform, [r.x, r.y, r.z, r.w], [t.x, t.y, t.z]);

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

    window.physWorld = physWorld;

    frame();
}

window.onload = function()
{
    if (window.RAPIER)
    {
        start();
    }
    else
    {
        window.addEventListener("RAPIER", () => start());
    }
}