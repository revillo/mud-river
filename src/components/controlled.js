import { Collision } from "../game/collision.js";
import { EntityComponent, GameEntity } from "../game/game-context.js";
import { toRadian } from "../glm/common.js";
import { vec2, vec3, quat, mat4 } from "../glm/index.js";
import { Quaternion, Vector3 } from "../math/index.js";
import { Plane } from "../shape/plane.js";
import { Body } from "./body.js";
import { Camera } from "./camera.js";
import { Transform } from "./transform.js";

const tempQuat = new Quaternion(0,0,0,1);

export class Controlled extends EntityComponent
{
    isPressed(action)
    {
        if (this.context.activeController != this)
            return false;

        return this.inputManager.isPressed(action);
    }

    get inputManager()
    {
        return this.context.inputManager;
    }

    activate()
    {
        if (this.context.activeController && this.context.activeController != this)
        {
            this.context.activeController.unbindInputs();
        }

        this.context.activeController = this;
    }
    
    bindInput(action, handler)
    {
        this._inputListeners = this._inputListeners || [];
        handler = handler.bind(this);
        this._inputListeners.push({action, handler});
        this.inputManager.addListener(action, handler);
    }

    unbindInputs()
    {
        for (let listener of (this._inputListeners || []))
        {
            inputManager.removeListener(listener.action, listener.handler);
        }

        this._inputListeners.length = 0;
    }

    onDetach()
    {
        this.unbindInputs();
    }

    /*
    Component.prototype.addInputListener = function(action, handler)
    {
        inputManager.addListener(action, handler);
    }

    Component.prototype.removeInputListener = function(action, handler)
    {
        inputManager.removeListener(action, handler);
    }*/

    getMovement(outV3)
    {
        outV3.zero();

        let moved = false;

        if (this.isPressed('Forward'))
        {
            moved = true;
            outV3[2] -= 1;
        }        

        if (this.isPressed('Backward'))
        {
            moved = true;
            outV3[2] += 1;
        }

        if (this.isPressed('Left'))
        {
            moved = true;
            outV3[0] -= 1;
        }

        if (this.isPressed('Right'))
        {
            moved = true;
            outV3[0] += 1;
        }

        if (moved)
        {
            outV3.normalize();
        }

        return moved;
    }
}

export class FreeControlled extends Controlled
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

        vec3.setLength(this._movement, scale * dt);
        this._movement.rotateMat4(this._camera.get(Transform).worldMatrix);

        this.get(Transform).worldTranslate(this._movement);       
    }
}

