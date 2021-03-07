import { mat4, quat, vec3 } from "../math/index.js";
import { Transform } from "./transform.js";

const tempVec3 = vec3.create();
const tempQuat = quat.create();


export class Body
{
    colliders = [];
    _type = Body.DISABLED;
    _body = null;

    options = {
        lockRotations : false
    };

    start()
    {
        this.ensure(Transform);
    }

    get type()
    {
        return this._type;
    }

    get body()
    {
        return this._body;
    }

    configure(physicsType, options)
    {
        this.options = options || this.options;
        this.type = physicsType;
    }

    set type(physicsType)
    {
        if(this._type == physicsType)
        {
            return;
        }

        const PHYSICS = this.PHYSICS;

        this._type = physicsType;

        if (this._body)
        {
            this.physicsWorld.removeRigidBody(this._body);
        }

        var desc;

        switch(physicsType)
        {
            case Body.NONE:
            break;

            case Body.STATIC:
            desc = PHYSICS.RigidBodyDesc.newStatic();
            break;

            case Body.DYNAMIC:
            desc = PHYSICS.RigidBodyDesc.newDynamic();
            break;

            case Body.KINEMATIC:
            desc = PHYSICS.RigidBodyDesc.newKinematic();
            break;
        }

        this.options.lockRotations && (desc = desc.lockRotations());

        if (desc)
        {
            this._body = this.physicsWorld.createRigidBody(desc);
            this._body.entity = this.entity;

            this.syncTransformToBody();
        }
    }

    addCollider(colliderDesc)
    {
        this.physicsWorld.createCollider(colliderDesc, this._body.handle);
    }    

    syncTransformToBody()
    {
        this.get(Transform).getTranslation(tempVec3);
        this.get(Transform).getRotation(tempQuat);

        const trans = this._body.translation();
        const rot = this._body.rotation();

        trans.x = tempVec3[0];
        trans.y = tempVec3[1];
        trans.z = tempVec3[2];

        rot.x = tempQuat[0];
        rot.y = tempQuat[1];
        rot.z = tempQuat[2];
        rot.w = tempQuat[3];

        this._body.setTranslation(trans);
        this._body.setRotation(rot);
    }

    syncBodyToTransform()
    {
        var pos = this._body.translation();
        vec3.set(tempVec3, pos.x, pos.y, pos.z);

        if (this.options.lockRotations)
        {
            this.get(Transform).setTranslation(tempVec3);
        }
        else
        {
            var rot = this._body.rotation();
            quat.set(tempQuat, rot.x, rot.y, rot.z, rot.w);
            this.get(Transform).setTranslationRotation(tempVec3, tempQuat);
        }
    }

    //todo remove, use forEachActiveRigidBody
    update(dt)
    {
        if (this._type == Body.DYNAMIC)
        {
            this.syncBodyToTransform();
        }
    }

    applyForce(force)
    {
        const tvec3 = this.PHYSICS.tempVec3;
        tvec3.x = force[0];
        tvec3.y = force[1];
        tvec3.z = force[2];

        this._body.applyForce(tvec3, true);
    }

    applyImpulse(impulse)
    {
        const tvec3 = this.PHYSICS.tempVec3;
        tvec3.x = impulse[0];
        tvec3.y = impulse[1];
        tvec3.z = impulse[2];

        this._body.applyImpulse(tvec3, true);
    }
}

Body.DISABLED = 0;
Body.STATIC = 1;
Body.DYNAMIC = 2;
Body.KINEMATIC = 2;

Body.selfAware = true;
Body.physicsAware = true;