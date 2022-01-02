import { Collision } from "../../game/collision.js";
import { GameEntity } from "../../game/game-entity.js";
import { Matrix4, Vector3 } from "../../math/index.js";
import { Body } from "../body.js";
import { Camera } from "../camera.js";
import { AnimatedCharacter } from "../animated-character.js";
import { Controlled } from "../controlled.js";
import { GroundMovement } from "../ground-movement.js";
import { SpringArm } from "../spring-arm.js";
import { Transform } from "../transform.js";
import { ShaderNormals } from "../../index.js";
import { ModelRender } from "../model-render.js";

const tempBasis = new Matrix4;

export class ThirdPersonPlayer extends Controlled
{    
    /**
     * @type {Body}
     */
    _body = null;

    /**
     * @type {GroundMovement}
     */
    _groundMovement = null;

    /**
     * @type {GameEntity}
     */
    _cameraRig = null;
    _camera = null;

    /** 
     * @type {GameEntity}
     */
    _character = null;
    
    _movement = Vector3.new();
    _isLooking = false;
    _sweepFilter = Collision.getCollisionGroups([Collision.PLAYER], [Collision.STATIC]);

    height = 2.0;
    halfHeight = 1.0;

    onAttach()
    {
        this.entity.ensure(Transform, Body, GroundMovement);

        //Set up Camera
        this._cameraRig = this.entity.createChild(SpringArm);
        this._cameraRig.get(SpringArm).maxLength = 10;
        this._cameraRig.get(Transform).setLocalPosition(0, this.height, 0);
        this._cameraRig.get(SpringArm).mountEntity.ensure(Camera);
        this._camera = this._cameraRig.get(SpringArm).mountEntity;

        //Set up Character
        this._character = this.entity.createChild(AnimatedCharacter);

        //Set up Physics
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
        
        this.bindInput("Jump", this.jump);
        this.bindInput("Look", this.look);
        this.bindInput("Aim", this.aim);
        this.bindInput("Scroll", this.zoom);
        
        this.activate();
    }

    setCharacterAsset(asset) 
    {
        this._character.get(AnimatedCharacter).model.get(ModelRender).configure(asset, {
            shaderMods: [ShaderNormals]
        });

        this._character.get(AnimatedCharacter).model.get(Transform).setLocalEulers(0, 180, 0);
        this._character.get(AnimatedCharacter).model.get(Transform).setLocalPosition(0.0, -0.05, 0);
    }

    get camera()
    {
        return this._camera;
    }

    aim(axis)
    {
        if (this._isLooking)
        {
            this._cameraRig.get(SpringArm).rotateDegrees(-axis.dy * 100, -axis.dx * 100);
        }
    }

    zoom(axis)
    {
        if (this._isLooking)
        {
            const arm = this._cameraRig.get(SpringArm);
            arm.maxLength = Math.clamp(0, arm.maxLength - axis.dy * 0.01, 30);
        }
    }

    look(button)
    {   
        this.inputManager.setPointerLock(button.isPressed);
        this._isLooking = button.isPressed;
    }

    jump(button)
    { 
        if (button.isPressed) {
            this.get(GroundMovement).jump(this._body, Transform.getWorldMatrix(this.entity));
        }  
    }

    update(dt, clock)
    {
        let cameraYaw = this._cameraRig.get(SpringArm).yaw;
        let tryingToMove = this.getMovement(this._movement);
        tempBasis.copy(Transform.getWorldMatrix(this.entity));    
        tempBasis.rotateUp(cameraYaw.radians);
        this._groundMovement.move(this._movement, this._body, tempBasis);
        this._cameraRig.get(SpringArm).cast();

        const onGround = this._groundMovement.isOnGround();

        if (tryingToMove && onGround) {
            this._character.get(AnimatedCharacter).playAnimation("run");
            let charYaw = cameraYaw.radians + Math.atan2(-this._movement.x, -this._movement.z);
            this._character.get(AnimatedCharacter).smoothRotateTo(null, charYaw, dt);
        } else if (!onGround) {
            this._character.get(AnimatedCharacter).playAnimation("jump");
        } else {
            this._character.get(AnimatedCharacter).playAnimation("idle");
        }
    }
}