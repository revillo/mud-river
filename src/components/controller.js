import { vec2, vec3, quat, mat4 } from "../math/index.js";
import { Body } from "./body.js";
import { Camera } from "./camera.js";
import { Transform } from "./transform.js";

export class FreeController
{
    cameraAngles = vec2.create();
    transform = null;
    camera = null;

    start()
    {
        this.transform = this.get(Transform);
        this.camera = this.get(Camera);
        this.movement = vec3.create();
    }

    update(dt, clock)
    {
        vec3.zero(this.movement);

         if (this.isPressed('Forward'))
        {
            this.movement[2] -= 1;
        }        

        if (this.isPressed('Backward'))
        {
            this.movement[2] += 1;
        }

        if (this.isPressed('Left'))
        {
            this.movement[0] -= 1;
        }

        if (this.isPressed('Right'))
        {
            this.movement[0] += 1;
        }

        vec3.setLength(this.movement, dt);
        this.transform.preTranslate(this.movement);
    }
}

//FreeController.updateInterval = 0;
FreeController.selfAware = true;
FreeController.inputAware = true;

const tempQuat = quat.create();

export class CharacterController
{

    runForce = 30;
    jumpImpulse = 2;
    height = 2.0;
    lookAngles = vec2.create();
    onGround = false;
    glideForce = 5;

    start()
    {
        this.ensure(Transform, Body);

        this.camera = this.createChild(Camera, Transform);
        this.camera.get(Transform).setPosition(0, this.height, 0);

        const P = this.PHYSICS;
        this.sweepFilter = P.getCollisionGroups([P.GROUP_PLAYER], [P.GROUP_STATIC]);

        this.capsuleColliderDesc = P.ColliderDesc.capsule(this.height/2, 0.2)
            .setTranslation(0, this.height/2, 0.0)
            .setCollisionGroups(this.sweepFilter);

        this.sweepShape = new P.Capsule(this.height / 2, 0.19);

        this.body = this.get(Body);
        this.body.configure(Body.DYNAMIC, {lockRotations: true});
        this.body.addCollider(this.capsuleColliderDesc);
        this.movement = vec3.create();
    
        this.bindInput("Jump", this.jump);
        this.bindInput("Look", this.look);
        this.bindInput("Aim", this.aim);
    }

    aim(axis)
    {
        if (this.isPressed('Look'))
        {
            this.lookAngles[0] -= axis.dx * 100;
            this.lookAngles[1] = Math.clamp( this.lookAngles[1] - axis.dy * 100, -89, 89);

    
            quat.fromEuler(tempQuat, 0, this.lookAngles[0], 0);
            this.get(Transform).setRotation(tempQuat);

            quat.fromEuler(tempQuat, this.lookAngles[1], 0, 0);
            this.camera.get(Transform).setRotation(tempQuat);
        }
       
    }

    look(button)
    {   
        this.inputManager.setPointerLock(button.isPressed);
    }

    jump(button)
    { 
        if (button.isPressed)
        {
            vec3.set(this.movement, 0, this.jumpImpulse, 0);
            this.body.applyImpulse(this.movement);
        }  
    }

    detectGround()
    {
        /*
        const ray = this.PHYSICS.tempRay;
        ray.dir.set(0, -1, 0);
        ray.origin.set();
        */

        //this.physicsWorld.castRayAndGetNormal(this.physicsWorld.colliders, )
        const P = this.PHYSICS;

        this.get(Transform).getWorldMatrix(mat4.temp0);
        mat4.decompose(quat.temp0, vec3.temp0, vec3.temp1, mat4.temp0);

        let physVel = P.vec3_1.set(0, -1, 0);
        let physPos = P.vec3_0.fromArray(vec3.temp0);
        let physRot = P.quat_0.fromArray(quat.temp0);

        physPos.y += this.height/2 + 0.01;

        let maxDist = 0.02;
        let collisionResult = this.physicsWorld.castShape(this.physicsWorld.colliders, physPos, physRot, physVel, 
            this.sweepShape, maxDist, this.sweepFilter);

        if (collisionResult)
        {
            this.body.setLinearDamping(10);
            this.onGround = true;
        }
        else
        {
            this.body.setLinearDamping(0);
            this.onGround = false;
        }

    }

    update(dt, clock)
    {

        this.detectGround();

        vec3.zero(this.movement);

        if (this.isPressed('Forward'))
        {
            this.movement[2] -= 1;
        }        

        if (this.isPressed('Backward'))
        {
            this.movement[2] += 1;
        }

        if (this.isPressed('Left'))
        {
            this.movement[0] -= 1;
        }

        if (this.isPressed('Right'))
        {
            this.movement[0] += 1;
        }


        vec3.setLength(this.movement, this.onGround ? this.runForce : this.glideForce);

        this.get(Transform).rotateVec3(this.movement);

        this.body.applyForce(this.movement);
        
    }

    destroy()
    {
        this.unbindInputs();
    }
}

CharacterController.physicsAware = true;
CharacterController.selfAware = true;
CharacterController.inputAware = true;
