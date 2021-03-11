import { EntityComponent } from "../game/game-context.js";
import { vec2, vec3, quat, mat4 } from "../glm/index.js";
import { Quaternion, Vector3 } from "../math/index.js";
import { Body } from "./body.js";
import { Camera } from "./camera.js";
import { Transform } from "./transform.js";

export class FreeController extends EntityComponent
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

FreeController.inputAware = true;

const tempQuat = Quaternion.new();
const tempVec3 = Vector3.new();


export class CharacterController extends EntityComponent
{

    runForce = 30;
    jumpImpulse = 2;
    height = 2.0;
    halfHeight = this.height/2;
    lookAngles = vec2.create();
    onGround = false;
    groundDistance = 0;
    glideForce = 5;
    cushionForce = 5;
    groundMaxDistance = 0.1;

    start()
    {
        this.entity.ensure(Transform, Body);

        this.camera = this.entity.createChild(Camera, Transform);
        this.camera.get(Transform).setLocalPosition(0, this.height, 0);

        const P = this.context.PHYSICS;
        this.sweepFilter = P.getCollisionGroups([P.GROUP_PLAYER], [P.GROUP_STATIC]);

        this.capsuleColliderDesc = P.ColliderDesc.capsule(this.halfHeight, 0.2)
            .setTranslation(0, this.halfHeight, 0.0)
            .setCollisionGroups(this.sweepFilter);

        this.sweepShape = new P.Capsule(this.halfHeight, 0.19);

        this.body = this.get(Body);
        this.body.configure(Body.DYNAMIC, {lockRotations: true});
        this.body.addCollider(this.capsuleColliderDesc);
        this.movement = Vector3.new();
    
        this.bindInput("Jump", this.jump);
        this.bindInput("Look", this.look);
        this.bindInput("Aim", this.aim);

        window.player = this;
    }

    aim(axis)
    {
        if (this.isPressed('Look'))
        {
            this.lookAngles[0] -= axis.dx * 100;
            this.lookAngles[1] = Math.clamp( this.lookAngles[1] - axis.dy * 100, -89, 89);

    
            quat.fromEuler(tempQuat, 0, this.lookAngles[0], 0);
            this.get(Transform).setLocalRotation(tempQuat);

            quat.fromEuler(tempQuat, this.lookAngles[1], 0, 0);
            this.camera.get(Transform).setLocalRotation(tempQuat);
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
            this.movement.set(0, this.jumpImpulse, 0);
            this.body.applyImpulse(this.movement);
        }  
    }

    detectGround()
    {
        const P = this.context.PHYSICS;

        this.get(Transform).worldMatrix.decompose(tempVec3, tempQuat);
    
        let sweepVel = P.vec3_1.set(0, -1, 0);
        tempVec3.y += this.halfHeight + 0.01;

        let maxDist = this.groundMaxDistance;
        let collisionResult = this.context.physicsWorld.castShape(this.context.physicsWorld.colliders, tempVec3, tempQuat, sweepVel, 
            this.sweepShape, maxDist, this.sweepFilter);
        
        if (collisionResult)
        {
            this.body.setLinearDamping(10);
            this.onGround = true;
            this.groundDistance = collisionResult.toi;
   
            let cushionY = Math.max(0.0, this.groundMaxDistance - this.groundDistance) / this.groundMaxDistance;
            cushionY = Math.pow(cushionY, 0.5) * this.cushionForce; 
            vec3.set(this.movement, 0, cushionY, 0);

            this.body.applyForce(this.movement);
        }
        else
        {
            this.body.setLinearDamping(0.2);
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

        this.movement.rotateMat4(this.get(Transform).worldMatrix);
        vec3.setLength(this.movement, this.onGround ? this.runForce : this.glideForce);
        this.body.applyForce(this.movement);
    }

    destroy()
    {
        this.unbindInputs();
    }
}

CharacterController.inputAware = true;
