import { EntityComponent } from "../game/game-context.js";
import { vec2, vec3, quat, mat4 } from "../glm/index.js";
import { Quaternion, Vector3 } from "../math/index.js";
import { Body } from "./body.js";
import { Camera } from "./camera.js";
import { Transform } from "./transform.js";

export class Controller extends EntityComponent
{
    isPressed(action)
    {
        return this.inputManager.isPressed(action);
    }

    get inputManager()
    {
        return this.context.inputManager;
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

    /*

    Component.prototype.addInputListener = function(action, handler)
    {
        inputManager.addListener(action, handler);
    }

    Component.prototype.removeInputListener = function(action, handler)
    {
        inputManager.removeListener(action, handler);
    }*/
}

export class FreeController extends Controller
{
    _cameraAngles = vec2.create();
    _camera = null;
    _movement = vec3.create();

    start()
    {
        this._camera = this.get(Camera);
    }

    update(dt, clock)
    {
        vec3.zero(this._movement);

         if (this.isPressed('Forward'))
        {
            this._movement[2] -= 1;
        }        

        if (this.isPressed('Backward'))
        {
            this._movement[2] += 1;
        }

        if (this.isPressed('Left'))
        {
            this._movement[0] -= 1;
        }

        if (this.isPressed('Right'))
        {
            this._movement[0] += 1;
        }

        vec3.setLength(this._movement, dt);
        this.get(Transform).preTranslate(this._movement);
    }
}


const tempQuat = Quaternion.new();
const tempVec3 = Vector3.new();


export class CharacterController extends Controller
{

    runForce = 30;
    jumpImpulse = 2;
    height = 2.0;
    halfHeight = this.height/2;
    glideForce = 5;
    cushionForce = 5;
    groundMaxDistance = 0.1;

    _onGround = false;
    _groundDistance = 0;
    _sweepShape = null;
    _body = null;
    _lookAngles = vec2.create();
    _camera = null;
    _sweepFilter = null;

    start()
    {
        this.entity.ensure(Transform, Body);

        this._camera = this.entity.createChild(Camera, Transform);
        this._camera.get(Transform).setLocalPosition(0, this.height, 0);

        const P = this.context.PHYSICS;
        this._sweepFilter = P.getCollisionGroups([P.GROUP_PLAYER], [P.GROUP_STATIC]);

        let capsuleColliderDesc = P.ColliderDesc.capsule(this.halfHeight, 0.2)
            .setTranslation(0, this.halfHeight, 0.0)
            .setCollisionGroups(this._sweepFilter);

        this._sweepShape = new P.Capsule(this.halfHeight, 0.19);

        this._body = this.get(Body);
        this._body.configure(Body.DYNAMIC, {lockRotations: true});
        this._body.addCollider(capsuleColliderDesc);
        this._movement = Vector3.new();
    
        this.bindInput("Jump", this.jump);
        this.bindInput("Look", this.look);
        this.bindInput("Aim", this.aim);

        window.player = this;
    }

    get camera()
    {
        return this._camera;
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

    jump(button)
    { 
        if (button.isPressed)
        {
            this._movement.set(0, this.jumpImpulse, 0);
            this._body.applyImpulse(this._movement);
        }  
    }

    detectGround()
    {
        const P = this.context.PHYSICS;

        this.get(Transform).worldMatrix.decompose(tempVec3, tempQuat);
    
        tempVec3.y += this.halfHeight + 0.01;

        let maxDist = this.groundMaxDistance;
        let collisionResult = this.context.physicsWorld.castShape(this.context.physicsWorld.colliders, tempVec3, tempQuat, Vector3.DOWN, 
            this._sweepShape, maxDist, this._sweepFilter);
        
        if (collisionResult)
        {
            this._body.setLinearDamping(10);
            this._onGround = true;
            this._groundDistance = collisionResult.toi;
   
            let cushionY = Math.max(0.0, this.groundMaxDistance - this._groundDistance) / this.groundMaxDistance;
            cushionY = Math.pow(cushionY, 0.5) * this.cushionForce; 
            this._movement.set(0, cushionY, 0);

            this._body.applyForce(this._movement);
        }
        else
        {
            this._body.setLinearDamping(0.2);
            this._onGround = false;
        }

    }

    update(dt, clock)
    {

        this.detectGround();

        vec3.zero(this._movement);

        if (this.isPressed('Forward'))
        {
            this._movement[2] -= 1;
        }        

        if (this.isPressed('Backward'))
        {
            this._movement[2] += 1;
        }

        if (this.isPressed('Left'))
        {
            this._movement[0] -= 1;
        }

        if (this.isPressed('Right'))
        {
            this._movement[0] += 1;
        }

        this._movement.rotateMat4(this.get(Transform).worldMatrix);
        vec3.setLength(this._movement, this._onGround ? this.runForce : this.glideForce);
        this._body.applyForce(this._movement);
    }

    destroy()
    {
        this.unbindInputs();
    }
}