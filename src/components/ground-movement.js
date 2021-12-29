import { EntityComponent, Plane, Quaternion, Vector3 } from "../index.js";
import { Transform } from "./transform.js";

const tempQuat = Quaternion.new();
const tempVec3 = Vector3.new();
const tempUp = Vector3.new();

const tempMovement = Vector3.new();

/**
 * A component for running and gliding physics
 */
export class GroundMovement extends EntityComponent {
    runForce = 30;
    height = 2.0;
    halfHeight = this.height / 2;
    glideForce = 5;
    cushionForce = 5;
    groundMaxDistance = 0.1;
    glideDamping = 0.2;
    runDamping = 10;
    gravityDirection = new Vector3(0, -1, 0);

    _onGround = false;
    _groundPlane = new Plane();
    _groundDistance = 0;
    _sweepShape = null;

    configure(body, height = 2, radius=0.19) {
        this._body = body;
        this.height = height;
        this.halfHeight = height / 2;
        this._sweepShape = new this.context.PHYSICS.Capsule(this.halfHeight, radius);
    }

    detectGround() {
        this.get(Transform).worldMatrix.decompose(tempVec3, tempQuat);
        tempUp.copy(this.gravityDirection);
        tempUp.scale(-1 * (this.halfHeight + 0.01));

        tempVec3.add(tempUp);
        //tempVec3.y += this.halfHeight + 0.01;

        let maxDist = this.groundMaxDistance;
        let collisionResult = this.context.physicsWorld.castShape(
            tempVec3, tempQuat, this.gravityDirection,
            this._sweepShape, maxDist, this._sweepFilter);

        tempUp.normalize();
        this._groundPlane.setNormal(tempUp);

        if (collisionResult) {
            this._body.linearDamping = this.runDamping;
            this._onGround = true;
            this._groundDistance = collisionResult.toi;
            this._groundPlane.setNormal(collisionResult.normal1);
            let cushionY = Math.max(0.0, this.groundMaxDistance - this._groundDistance) / this.groundMaxDistance;
            cushionY = Math.pow(cushionY, 0.5) * this.cushionForce;
            tempUp.setLength(cushionY);
            this._body.applyForce(tempUp);
        }
        else {
            this._body.linearDamping = this.glideDamping;
            this._onGround = false;
        }
    }

    /**
     * Update physics for running (or gliding while falling)
     * @param {Vector3} movement - movement vector in entity local coordinates
     */
    move(movement) {
        this.detectGround();
        let slope = 0.0;
        tempMovement.copy(movement);
        tempMovement.rotateMat4(Transform.getWorldMatrix(this.entity));

        if (this._onGround) {
            tempVec3.copy(tempMovement);
            tempVec3.normalize();

            slope = vec3.dot(tempVec3, this._groundPlane.normal);

            if (slope > 0.0)
                this._groundPlane.project(tempMovement, tempMovement);
        }

        vec3.setLength(tempMovement, this._onGround ? this.runForce : this.glideForce);

        //Hacky push-back normal force on steep inclines
        if (slope < -0.6) {
            tempVec3.copy(this._groundPlane.normal);
            tempVec3.scale(50);
            tempMovement.add(tempVec3);
        }

        this._body.applyForce(tempMovement);
    }


}