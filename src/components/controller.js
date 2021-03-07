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

    runForce = 10;
    jumpImpulse = 2;
    looking = false;
    height = 2.0;
    lookAngles = vec2.create();

    start()
    {
        this.ensure(Transform, Camera, Body);

        this.transform = this.get(Transform);
        this.camera = this.get(Camera);
        this.bodyComp = this.get(Body);
        this.bodyComp.configure(Body.DYNAMIC, {lockRotations: true});
        this.bodyComp.addCollider(this.PHYSICS.ColliderDesc.capsule(this.height/2, 0.2).setTranslation(0, 1.0, 0.0));
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
            this.get(Camera).transform.setRotation(tempQuat);
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
            this.bodyComp.applyImpulse(this.movement);
        }  
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


        vec3.setLength(this.movement, this.runForce);

        this.get(Transform).rotateVec3(this.movement);

        this.bodyComp.applyForce(this.movement);
    }

    destroy()
    {
        this.unbindInputs();
        super.destroy();
    }
}

CharacterController.physicsAware = true;
CharacterController.selfAware = true;
CharacterController.inputAware = true;
