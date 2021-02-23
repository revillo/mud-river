import { ShaderStage, BufferType, BufferUsage } from './render/gpu.js';
import { Rasterizer } from './render/rasterizer.js';
import { GPUContextGL} from './render/gpu.js'
import { ShaderBuilder} from './render/shader-builder.js'
import { mat4, vec3, glMatrix } from './math/index.js'
import { Sphere } from './shape/sphere.js'

window.onload = function()
{        
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gpu = new GPUContextGL(canvas);
    const renderer = new Rasterizer(gpu);

    const attributeLocations = {
        a_position : 0
    };

    const vertBuilder = new ShaderBuilder(gpu.platform, ShaderStage.VERTEX);
    const fragBuilder = new ShaderBuilder(gpu.platform, ShaderStage.FRAGMENT);

    //console.log(vertBuilder.text);
    //console.log(fragBuilder.text);
    
    const vertShader = gpu.createShader(vertBuilder.text, vertBuilder.stage)
    const fragShader = gpu.createShader(fragBuilder.text, fragBuilder.stage)

    const program = gpu.createProgram(vertShader, fragShader, attributeLocations);


    /*
    function makeTriangleMesh()
    {

        //Test Triangle
        var triPositions = [
            -0.5, 0.0, 0.5, 
            0.5, 0.0, 0.5,
            0.0, 1.0, 0.5
        ];

        var triIndices = [
            0, 1, 2
        ];

        var vertBuffer = gpu.createBuffer(BufferType.VERTEX);
        var indexBuffer = gpu.createBuffer(BufferType.INDEX);

        gpu.uploadArrayBuffer(vertBuffer, new Float32Array(triPositions));
        gpu.uploadArrayBuffer(indexBuffer, new Uint16Array(triIndices));

        const triVertexLayout = 
        {
            a_position : 
            {
                location : attributeLocations.a_position,
                offset: 0,
                stride: 12,
                count: 3,
                type : "FLOAT",
                isNormalized : false
            }
        };
        
        const triBinding = gpu.createGeometryBinding(vertBuffer, triVertexLayout, 3, indexBuffer, 0);

        return {
            binding : triBinding,
            worldTransform : mat4.create()
        };
    }*/

    function makeSphereMesh()
    {
        var sphere = new Sphere(1.0);

        var sphereGeometry = sphere.createGeometry();

        var vertBuffer = gpu.createBuffer(BufferType.VERTEX);
        var indexBuffer = gpu.createBuffer(BufferType.INDEX);

        gpu.uploadArrayBuffer(vertBuffer, sphereGeometry.vertices);
        gpu.uploadArrayBuffer(indexBuffer, sphereGeometry.indices);

        const sphereVertexLayout = 
        {
            a_position : 
            {
                location : attributeLocations.a_position,
                offset: 0,
                stride: 4 * 8,
                count: 3,
                type : "FLOAT",
                isNormalized : false
            }
        };
        
        const sphereBinding = gpu.createGeometryBinding(vertBuffer, sphereVertexLayout, sphereGeometry.count, indexBuffer, 0);

        let worldTransform = mat4.create();

        return {
            binding : sphereBinding,
            worldTransform : worldTransform,
            bindUniforms : (gpu) =>
            {
                var mloc = gpu.gl.getUniformLocation(program, "u_Model");
                gpu.gl.uniformMatrix4fv(mloc, false, worldTransform);
            }
        };

    }

    //Test Sphere
    var triangleMesh = makeSphereMesh();

    const triRenderBin = {
        program : program,
        meshes : [
            triangleMesh
        ],
        bindUniforms : (gpu) =>
        {
            var vploc = gpu.gl.getUniformLocation(program, "u_ViewProjection");
            gpu.gl.uniformMatrix4fv(vploc, false, camera.viewProjection);
        }
    };


    function makePhysicsWorld()
    {
        var RAPIER = window.RAPIER;

        let gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
        let world = new RAPIER.World(gravity);

        let sphereBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(0, 10, 0);
        let sphereBody = world.createRigidBody(sphereBodyDesc);
        let sphereColliderDesc = RAPIER.ColliderDesc.ball(1.0);
        world.createCollider(sphereColliderDesc, sphereBody.handle);

        let groundBodyDesc = RAPIER.RigidBodyDesc.newStatic();
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
        view : mat4.create(),
        viewProjection : mat4.create()
    };

    mat4.perspective(camera.projection, glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 100);
    mat4.lookAt(camera.view, vec3.fromValues(0,3,10), vec3.fromValues(0,3, 0.5), vec3.fromValues(0, 1, 0));
    mat4.multiply(camera.viewProjection, camera.projection, camera.view);

    const scene = {
        camera : camera,
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