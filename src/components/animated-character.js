import { Angle, GameComponent, GameEntity } from "../index.js";
import { ModelRender } from "./model-render.js";
import { Transform } from "./transform.js";

const tempAngle = new Angle;

export class AnimatedCharacter extends GameComponent
{
    _animation = "none";
    _yaw = new Angle(0);
    _pitch = new Angle(0);
    
    /**
     * @type {ModelRender}
     */
    _modelRender = null;

    /**
     * @type {GameEntity}
     */
    model = null;

    onAttach()
    {
        this.entity.ensure(Transform);

        this.model = this.entity.createChild(ModelRender, Transform);
        this._modelRender = this.model.get(ModelRender);
    }

    playAnimation(name)
    {
        this._animHelper(name);
    }

    stopAll() 
    {
        if (this._modelRender.isLoaded()) {
            this._modelRender.stopAnimating();
        }

        this.animation = "none";
    }

    _animHelper(name) {
        if (this.animation != name) {
            if (this._modelRender.isLoaded()) {
                this._modelRender.playNamedAnimation(name);
            }
            this.animation = name;
        }
    }

    /**
     * 
     * @param {number} newYaw yaw in degrees
     */
    smoothRotateTo(newPitch, newYaw, dt)
    {
        if (newYaw != null) {
            tempAngle.radians = newYaw;
            this._yaw.lerpToDt(tempAngle, 10, dt);
        }

        if (newPitch != null) {
            tempAngle.radians = newPitch;
            this._pitch.lerpToDt(tempAngle, 10, dt);
        }

        //console.log(newYaw, this._yaw.degrees);
        this.get(Transform).setLocalEulers(this._pitch.degrees, this._yaw.degrees, 0);
        //this.get(Transform).setLocalEulers(0, newYaw, 0);
    }
}


