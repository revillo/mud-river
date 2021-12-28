import { Collision } from "../game/collision.js";
import { EntityComponent, GameEntity } from "../game/game-context.js";
import { toRadian } from "../glm/common.js";
import { vec2, vec3, quat, mat4 } from "../glm/index.js";
import { Quaternion, Vector3 } from "../math/index.js";
import { Plane } from "../shape/plane.js";
import { Body } from "./body.js";
import { Camera } from "./camera.js";
import { Controlled } from "./controlled.js";
import { Transform } from "./transform.js";

const tempQuat = Quaternion.new();
const tempVec3 = Vector3.new();
const tempUp = Vector3.new();

export class CharacterController extends Controlled
{

    runForce = 30;
    jumpImpulse = 2;
    height = 2.0;
    halfHeight = this.height/2;
    glideForce = 5;
    cushionForce = 5;
    groundMaxDistance = 0.1;
    glideDamping = 0.2;
    runDamping = 10;
    gravityDirection = new Vector3(0, -1, 0);

    _onGround = false;
    _groundDistance = 0;
    _sweepShape = null;
    
    /**
     * @type {Body}
     */
    _body = null;
    _lookAngles = vec2.create();
    _groundPlane = new Plane();
    _horizontalPlane = new Plane();
    _tryingToMove = false;
    _cameraTarget = null;

    /**
     * @type {GameEntity}
     */
    _camera = null;
    _sweepFilter = null;
    _cameraRadius = 0.0;
    _movement = Vector3.new();
    _isLooking = false;

    onAttach()
    {
        this.entity.ensure(Transform, Body);

        this._cameraTarget = this.entity.createChild(Transform);
        
        this._camera = this._cameraTarget.createChild(Camera, Transform);

        this._cameraTarget.get(Transform).setLocalPosition(0, this.height, 0);

        const P = this.context.PHYSICS;
        this._sweepFilter = Collision.getCollisionGroups([Collision.PLAYER], [Collision.STATIC]);

        let capsuleColliderDesc = P.ColliderDesc.capsule(this.halfHeight, 0.2)
            .setTranslation(0, this.halfHeight, 0.0)
            .setCollisionGroups(this._sweepFilter);

        this._sweepShape = new P.Capsule(this.halfHeight, 0.19);

        this._body = this.get(Body);
        this._body.configure(Body.DYNAMIC, {lockRotations: true});
        this._body.addCollider(capsuleColliderDesc);
    
        
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
        if (button.isPressed)
        {
            this._movement.copy(this.gravityDirection);
            this._movement.setLength(-this.jumpImpulse);
            this._body.applyImpulse(this._movement);
        }  
    }

    detectGround()
    {
        const P = this.context.PHYSICS;

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

        if (collisionResult)
        {
            this._body.linearDamping = this.runDamping;
            this._onGround = true;
            this._groundDistance = collisionResult.toi;
   
            this._groundPlane.setNormalXYZ(collisionResult.normal1);

            let cushionY = Math.max(0.0, this.groundMaxDistance - this._groundDistance) / this.groundMaxDistance;
            cushionY = Math.pow(cushionY, 0.5) * this.cushionForce; 
            
            tempUp.setLength(cushionY);

            this._body.applyForce(tempUp);
        }
        else
        {
            this._body.linearDamping = this.glideDamping;
            this._onGround = false;
        }

    }

    updateMovement()
    {
        vec3.zero(this._movement);

        this._tryingToMove = false;

        if (this.isPressed('Forward'))
        {
            this._tryingToMove = true;
            this._movement[2] -= 1;
        }        

        if (this.isPressed('Backward'))
        {
            this._tryingToMove = true;
            this._movement[2] += 1;
        }

        if (this.isPressed('Left'))
        {
            this._tryingToMove = true;
            this._movement[0] -= 1;
        }

        if (this.isPressed('Right'))
        {
            this._tryingToMove = true;
            this._movement[0] += 1;
        }
    }

    updateRunning(dt)
    {
        this.detectGround();

        let slope = 0.0;
        
        this._movement.rotateMat4(this.get(Transform).worldMatrix);

        if (this._onGround)
        {
            tempVec3.copy(this._movement);
            tempVec3.normalize();

            slope = vec3.dot(tempVec3, this._groundPlane.normal);

            if (slope > 0.0)
                this._groundPlane.project(this._movement, this._movement);
        }
        
        vec3.setLength(this._movement, this._onGround ? this.runForce : this.glideForce);

        if (slope < -0.6)
        {
            tempVec3.copy(this._groundPlane.normal);
            tempVec3.scale(50);
            this._movement.add(tempVec3);
        }

        this._body.applyForce(this._movement);
    }

    update(dt, clock)
    {
        this.updateMovement();
        this.updateRunning(dt);
    }
}