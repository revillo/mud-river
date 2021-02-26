import { ShaderStage, BufferType, BufferUsage, ShaderValueType } from '../render/gpu-types.js';
import { Rasterizer } from '../render/rasterizer.js';
import { GPUContextGL} from '../render/gpu.js'
import { ShaderBuilder} from '../render/shader-builder.js'
import { mat4, vec3, quat, glMatrix } from '../math/index.js'
import { Sphere } from '../shape/sphere.js'
import { ShaderNormals } from '../render/shader-mods/normals.js'
import { AttributeLayoutGenerator, DefaultAttributes } from '../render/attribute.js';

var start = function()
{        
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gpu = new GPUContextGL(canvas);
    const renderer = new Rasterizer(gpu);

    const vertBuilder = new ShaderBuilder(gpu.platform, ShaderStage.VERTEX, [ShaderNormals]);
    const fragBuilder = new ShaderBuilder(gpu.platform, ShaderStage.FRAGMENT, [ShaderNormals]);

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
       
               
        var attrGen = new AttributeLayoutGenerator([DefaultAttributes.Position, DefaultAttributes.Normal, DefaultAttributes.UV0]); 
        const sphereVertexLayout = attrGen.generateAttributeLayout(vertBuffer, 0);

        const indexLayout = 
        {
            buffer : indexBuffer,
            count : sphereGeometry.count,
            start : 0
        }
        

        const sphereBinding = gpu.createGeometryBinding(sphereVertexLayout, indexLayout);

        let worldTransform = mat4.create();

        return {
            binding : sphereBinding,
            worldTransform : worldTransform,

            bindBuffers : (gpu) =>
            {
                const modelUniformLoc = gpu.gl.getUniformLocation(program, "u_Locals.model");
                gpu.gl.uniformMatrix4fv(modelUniformLoc, false, worldTransform);
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