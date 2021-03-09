import { Lifetime } from "../assets/assets.js";
import { mat4, quat, vec3 } from "../math/index.js";
import { Transform } from "./transform.js";

const tempVec3 = vec3.create();
const tempQuat = quat.create();


export class Body
{
    colliders = [];
    _type = Body.DISABLED;
    _body = null;
    lifetime = new Lifetime;

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
            this._body = null;
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

        //todo recreate colliders
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
        const tvec3 = this.PHYSICS.vec3_0;
        tvec3.x = force[0];
        tvec3.y = force[1];
        tvec3.z = force[2];

        this._body.applyForce(tvec3, true);
    }

    setLinearDamping(damping)
    {
        this._body.setLinearDamping(damping);
    }

    applyImpulse(impulse)
    {
        const tvec3 = this.PHYSICS.vec3_0;
        tvec3.x = impulse[0];
        tvec3.y = impulse[1];
        tvec3.z = impulse[2];

        this._body.applyImpulse(tvec3, true);
    }

    setAsset(gltfAsset)
    {
        gltfAsset.safePromise(this.lifetime).then(this._processGltfAsset.bind(this));
    }

    _processGltfAsset(gltfAsset)
    {
        const P = this.PHYSICS;
        const gltf = gltfAsset.gltf;
        const world = this.physicsWorld;
        const body = this._body;

        function nodeHelper(node)
        {
            if (node.mesh)
            {
                const mesh = gltf.meshes[node.mesh];

                mat4.getTranslation(tempVec3, node.matrix);
                mat4.getRotation(tempQuat, node.matrix);

                node.mesh.primitives.forEach(prim => {
                    if (prim.verticesPhys)
                    {
                        let colliderDesc = P.ColliderDesc.trimesh(prim.verticesPhys, prim.indicesPhys);
                    

                        if (node.translation)
                        {
                            colliderDesc.setTranslation(tempVec3[0], tempVec3[1], tempVec3[2]);
                        }

                        if (node.rotation)
                        {
                            colliderDesc.setRotation(tempQuat[0], tempQuat[1], tempQuat[2], tempQuat[3]);
                        }

                        colliderDesc.setCollisionGroups(P.getCollisionGroups([P.GROUP_STATIC], [P.GROUP_DYNAMIC, P.GROUP_PLAYER]));

                       world.createCollider(colliderDesc, body.handle);
                
                    }
                });
            }

            if (node.children)
                node.children.forEach(nodeHelper);
        }

        gltf.scenes[0].nodes.forEach(nodeHelper)
    }

    destroy()
    {
        this.lifetime.end();

        if (this._body)
        {
            this.physicsWorld.removeRigidBody(this._body);
            this._body = null;
        }

    }
}

Body.DISABLED = 0;
Body.STATIC = 1;
Body.DYNAMIC = 2;
Body.KINEMATIC = 2;

Body.selfAware = true;
Body.physicsAware = true;