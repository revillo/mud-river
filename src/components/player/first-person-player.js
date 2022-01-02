import { Collision } from "../../game/collision.js";
import { GameEntity } from "../../game/game-entity.js";
import { toRadian } from "../../glm/common.js";
import { vec2, quat, mat4 } from "../../glm/index.js";
import { Quaternion, Vector3 } from "../../math/index.js";
import { Body } from "../body.js";
import { Camera } from "../camera.js";
import { Controlled } from "../controlled.js";
import { GroundMovement } from "../ground-movement.js";
import { Transform } from "../transform.js";

const tempQuat = Quaternion.new();
const tempVec3 = Vector3.new();
const tempUp = Vector3.new();

export class FirstPersonPlayer extends Controlled
{    
    /**
     * @type {Body}
     */
    _body = null;

    /**
     * @type {GroundMovement}
     */
    _groundMovement = null;
    _lookAngles = vec2.create();
    _tryingToMove = false;
    _cameraTarget = null;

    /**
     * @type {GameEntity}
     */
    _camera = null;
    _cameraRadius = 0.0;
    _movement = Vector3.new();
    _isLooking = false;
    _sweepFilter = Collision.getCollisionGroups([Collision.PLAYER], [Collision.STATIC]);

    height = 2.0;
    halfHeight = 1.0;

    onAttach()
    {
        this.entity.ensure(Transform, Body, GroundMovement);

        this._cameraTarget = this.entity.createChild(Transform);
        this._camera = this._cameraTarget.createChild(Camera, Transform);
        this._cameraTarget.get(Transform).setLocalPosition(0, this.height, 0);

        let radius = 0.2;

        const P = this.context.PHYSICS;
        let capsuleColliderDesc = P.ColliderDesc.capsule(this.halfHeight, radius)
            .setTranslation(0, this.halfHeight + radius, 0.0)
            .setCollisionGroups(this._sweepFilter);

        this._body = this.get(Body);
        this._body.configure(Body.DYNAMIC, {lockRotations: true});
        this._body.addCollider(capsuleColliderDesc);

        this._groundMovement = this.entity.get(GroundMovement);
        this._groundMovement.configure(this.height, radius * 0.95);
        this.activate();
    }

    set cameraRadius(radius)
    {
        this._cameraRadius = radius;
        this.updateCameraTransform();
    }

    get cameraRadius()
    {
        return this._cameraRadius;
    }

    activate()
    {
        super.activate();

        this.bindInput("Jump", this.jump);
        this.bindInput("Look", this.look);
        this.bindInput("Aim", this.aim);
    }

    get camera()
    {
        return this._camera;
    }

    aim(axis)
    {
        if (this._isLooking)
        {
            this._lookAngles[0] -= axis.dx * 100;
            this._lookAngles[1] = Math.clamp( this._lookAngles[1] - axis.dy * 100, -89, 89);
            this.get(Transform).worldRotateUp(toRadian(-axis.dx * 100));

            this.updateCameraTransform();
        }
    }

    updateCameraTransform()
    {
        //quat.fromEuler(tempQuat, 0, this._lookAngles[0], 0);
        //this.get(Transform).setLocalRotation(tempQuat);

        quat.fromEuler(tempQuat, this._lookAngles[1], 0, 0);

        this._camera.get(Transform).setLocalRotation(tempQuat);

        let clm = this._camera.get(Transform).localMatrix;
        clm.getForward(tempVec3);
        tempVec3.scale(-this._cameraRadius);

        this._camera.get(Transform).setLocalTranslation(tempVec3);
    }

    look(button)
    {   
        this.inputManager.setPointerLock(button.isPressed);
        this._isLooking = button.isPressed;
    }

    jump(button)
    { 
        if (button.isPressed) {
            this.get(GroundMovement).jump(this._body, this.jumpImpulse, Transform.getWorldMatrix(this.entity));
        }  
    }

    update(dt, clock)
    {
        this._tryingToMove = this.getMovement(this._movement);
        this._groundMovement.move(this._movement, this._body, Transform.getWorldMatrix(this.entity));
    }
}