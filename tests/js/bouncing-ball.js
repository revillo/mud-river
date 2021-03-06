import { ShaderStage, BufferType, BufferUsage, BinType } from '../../src/gfx/gpu-types.js';
import { Rasterizer } from '../../src/gfx/rasterizer.js';
import { GPUContext} from '../../src/gfx/gpu.js'
import { RasterShaderBuilder} from '../../src/gfx/shader-builder.js'
import { mat4, vec3, quat, glMatrix } from '../../src/glm/index.js'
import { Sphere } from '../../src/shape/sphere.js'
import { ShaderNormals } from '../../src/gfx/shader-mods/normals.js'
import { AttributeLayoutGenerator, DefaultAttributes } from '../../src/gfx/attribute.js';
import { RasterProgram } from '../../src/gfx/program.js';
import { UniformBlockBuffer, BufferManager } from '../../src/gfx/buffer.js';

var start = function()
{        
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gpu = new GPUContext(canvas);
    const renderer = new Rasterizer(gpu);
    const program = new RasterProgram(gpu, DefaultAttributes, [ShaderNormals]);
    const bufferManager = new BufferManager(gpu);

    function makeSphereMesh()
    {
        const sphere = new Sphere(1.0);

        const sphereGeometry = sphere.createGeometry();

        const vertBufferView = bufferManager.allocVertexBufferView(sphereGeometry.vertices);
        const indexBufferView = bufferManager.allocIndexBufferView(sphereGeometry.indices);

        var attrGen = new AttributeLayoutGenerator([DefaultAttributes.POSITION, DefaultAttributes.NORMAL, DefaultAttributes.UV0], null, true, false); 
        const sphereVertexLayout = attrGen.generateAttributeLayout(vertBufferView);
    
        const sphereBinding = gpu.createGeometryBinding(sphereVertexLayout, indexBufferView);

        const localsBuffer = bufferManager.allocUniformBlockBuffer("Locals", 1, program.uniformBlocks.Locals);
        const myBlock = localsBuffer.getBlock(0);
        mat4.identity(myBlock.model);

        return {
            binding : sphereBinding,
            numInstances : 0,
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
        physWorld.step();

        const collider = physWorld.world.colliders.get(0);

        const trans = collider.translation();
        
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
        mat4.multiply(globalBlock.viewProjection, camera.projection, camera.view);
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