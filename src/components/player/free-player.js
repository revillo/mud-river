import { quat, Quaternion, vec2, Vector3 } from "../../index.js";
import { Camera } from "../camera.js";
import { Controlled } from "../controlled.js";
import { Transform } from "../transform.js";

const tempQuat = new Quaternion(0,0,0,1);

export class FreePlayer extends Controlled
{
    _lookAngles = vec2.create();
    _camera = null;
    _movement = Vector3.new();

    onAttach()
    {
        this.entity.ensure(Transform);
        this._camera = this.entity.createChild(Camera, Transform);
        this.activate();
    }

    activate()
    {
        super.activate();

        this.bindInput("Look", this.look);
        this.bindInput("Aim", this.aim);
    }
  
    aim(axis)
    {
        if (this.isPressed('Look'))
        {
            this._lookAngles[0] -= axis.dx * 100;
            this._lookAngles[1] = Math.clamp( this._lookAngles[1] - axis.dy * 100, -89, 89);
    
            quat.fromEuler(tempQuat, 0, this._lookAngles[0], 0);
            this.get(Transform).setLocalRotation(tempQuat);

            quat.fromEuler(tempQuat, this._lookAngles[1], 0, 0);
            this._camera.get(Transform).setLocalRotation(tempQuat);
        }
    }

    look(button)
    {   
        this.inputManager.setPointerLock(button.isPressed);
    }

    update(dt, clock)
    {
        this.getMovement(this._movement);

        let scale = 6;

        if (this.isPressed('Sprint'))
        {
            scale = 60;
        }

        this._movement.setLength(scale * dt);
        this._movement.rotateMat4(this._camera.get(Transform).worldMatrix);

        this.get(Transform).worldTranslate(this._movement);       
    }
}

