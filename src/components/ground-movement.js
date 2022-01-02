import { Collision, GameComponent, Matrix4, Plane, Quaternion, Vector3 } from "../index.js";
import { Body } from "./body.js";
import { Transform } from "./transform.js";

const tempQuat = Quaternion.new();
const tempVec3 = Vector3.new();
const tempUp = Vector3.new();

const tempMovement = Vector3.new();

/**
 * A component for running and gliding physics
 */
export class GroundMovement extends GameComponent {
    runForce = 30;
    glideForce = 5;
    cushionForce = 5;
    groundMaxDistance = 0.1;
    glideDamping = 0.2;
    runDamping = 10;
    gravityDirection = new Vector3(0, -1, 0);
    jumpImpulse = 2;

    _height = 2.0;
    _halfHeight = this._height / 2;
    _radius = 0.12;
    _onGround = false;
    _groundPlane = new Plane();
    _groundDistance = 0;
    _sweepShape = null;
    _sweepFilter = Collision.getCollisionGroups([Collision.PLAYER], [Collision.STATIC]);

    /**
     * 
     * @param {Body} body 
     * @param {number} height 
     * @param {number} radius 
     */
    configure(height = 2, radius=0.19) {
        this._height = height;
        this._radius = radius;
        this._halfHeight = height / 2;
        this._sweepShape = new this.context.PHYSICS.Capsule(this._halfHeight, this._radius);
    }

    detectGround() {
        this.get(Transform).worldMatrix.decompose(tempVec3, tempQuat);
        tempUp.copy(this.gravityDirection);
        tempUp.scale(-1 * (this._halfHeight + this._radius));
        tempVec3.add(tempUp);

        let maxDist = this.groundMaxDistance;
        let collisionResult = this.context.physicsWorld.castShape(
            tempVec3, tempQuat, this.gravityDirection,
            this._sweepShape, maxDist, this._sweepFilter);

        tempUp.normalize();
        this._groundPlane.setNormal(tempUp);

        if (collisionResult) {
            this._onGround = true;
            this._groundDistance = collisionResult.toi;
            this._groundPlane.setNormal(collisionResult.normal1);
        }
        else {
            this._onGround = false;
        }
    }

    /**
     * Update physics for running (or gliding while falling)
     * @param {Vector3} movement - movement vector in basis coordinates
     * @param {Body?} body - body to apply force
     * @param {Matrix4?} basis - coordinate system basis
     */
    move(movement, body, basis) {
        body = body || this.get(Body);
        basis = basis || Transform.getWorldMatrix(this.entity);

        basis.getUp(this.gravityDirection);
        this.gravityDirection.invert();
        
        this.detectGround();
        let slope = 0.0;
        tempMovement.copy(movement);
        tempMovement.rotateMat4(basis);

        if (this._onGround) {
            //Cushion force
            let cushionY = Math.max(0.0, this.groundMaxDistance - this._groundDistance) / this.groundMaxDistance;
            cushionY = Math.pow(cushionY, 0.5) * this.cushionForce;
            tempUp.copy(this.gravityDirection);
            tempUp.scale(-cushionY);
            body.applyForce(tempUp);

            //Update movement for ground
            tempVec3.copy(tempMovement);
            tempVec3.normalize();
            slope = tempVec3.dot(this._groundPlane.normal);
            if (slope > 0.0)
                this._groundPlane.project(tempMovement, tempMovement);
        
            //Hacky push-back normal force on steep inclines
            if (slope < -0.6) {
                tempVec3.copy(this._groundPlane.normal);
                tempVec3.scale(50);
                tempMovement.add(tempVec3);
            }
        }

        //Update body forces
        body.linearDamping = this._onGround ? this.runDamping : this.glideDamping;
        tempMovement.setLength(this._onGround ? this.runForce : this.glideForce);
        body.applyForce(tempMovement);
    }

    /**
     * Jump up with this.jumpImpulse
     * @param {Body?} body 
     * @param {Matrix4?} basis 
     */
    jump(body, basis)
    {
        if (!this._onGround)
        {
            return;
        }

        body = body || this.get(Body);
        basis = basis || Transform.getWorldMatrix(this.entity);
        basis.getUp(tempUp);
        tempUp.scale(this.jumpImpulse);
        body.applyImpulse(tempUp);
    }

    isOnGround()
    {
        return this._onGround;
    }
}