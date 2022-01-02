import { Angle, Collision, GameComponent, GameEntity, quat, Quaternion, vec3, Vector3 } from "../index.js";
import { Transform } from "./transform.js";

const rayOrigin = Vector3.new();
const rayDir = Vector3.new();

const tempPitch = new Angle;
const tempYaw = new Angle;
const tempRoll = new Angle;

const tempQuat = new Quaternion;
const tempQuat2 = new Quaternion;

const tempUp = new Vector3;
const tempRight = new Vector3;

export class SpringArm extends GameComponent
{
    maxLength = 30;

    /**
     * @type {GameEntity}
     */
    mountEntity = null;
    _ray = null;

    bias = 0.1;

    pitch = new Angle(0);
    yaw = new Angle(0);
    roll = new Angle(0);
    
    onAttach()
    {
        this.entity.ensure(Transform);
        const P = this.context.PHYSICS;

        this._ray = new this.context.PHYSICS.Ray(rayOrigin, rayDir);
        this.mountEntity = this.entity.createChild(Transform);
        this.collisionGroups = Collision.getCollisionGroups([Collision.PLAYER], [Collision.STATIC]);
    }

    _adjustMount(length)
    {
        this.mountEntity.get(Transform).setLocalPosition(0, 0, length);
    }

    cast()
    {
        const wm = Transform.getWorldMatrix(this.entity);
        wm.getForward(rayDir);
        wm.getTranslation(rayOrigin);
        rayDir.invert();

        let hit = this.context.physicsWorld.castRay(
            this._ray,  this.maxLength, true, this.collisionGroups
        );

        this._adjustMount(hit ? (hit.toi - this.bias) : this.maxLength);
    }

    rotateDegrees(pitchDiff, yawDiff, clamped = true)
    {
        let transform = this.get(Transform);

        if (clamped) {
            this.pitch.degrees = Math.clamp(this.pitch.degrees + pitchDiff, -89, 89);
            this.yaw.degrees = this.yaw.degrees + yawDiff;
            transform.setLocalEulers(this.pitch.degrees, this.yaw.degrees, this.roll.degrees);
        } else {
            tempYaw.degrees = yawDiff;
            tempPitch.degrees = pitchDiff;
            tempQuat.setAxisAngle(Vector3.UP, tempYaw.radians);
            tempQuat2.setAxisAngle(Vector3.RIGHT, tempPitch.radians);
            tempQuat.multiply(tempQuat2);
            transform.localPreRotate(tempQuat);
            transform.getLocalRotation(tempQuat);
        }
    }
}   