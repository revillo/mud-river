import { Lifetime } from "../assets/assets.js";
import { EntityComponent } from "../game/game-context.js";
import { mat4, quat, vec3 } from "../glm/index.js";
import { Quaternion, Vector3 } from "../math/index.js";
import { Transform } from "./transform.js";

const tempVec3 = new Vector3();
const tempQuat = new Quaternion();

/**
 * @class
 */
export class Body extends EntityComponent
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
        this.entity.ensure(Transform);
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

        const P = this.context.PHYSICS;

        this._type = physicsType;

        if (this._body)
        {
            this.context.physicsWorld.removeRigidBody(this._body);
            this._body = null;
        }

        var desc;

        this.entity.remove('static', 'dynamic');

        switch(physicsType)
        {
            case Body.NONE:
            break;

            case Body.STATIC:
            desc = P.RigidBodyDesc.newStatic();
            this.entity.add('static');
            break;

            case Body.DYNAMIC:
            desc = P.RigidBodyDesc.newDynamic();
            this.entity.add('static');
            break;

            case Body.KINEMATIC:
            desc = P.RigidBodyDesc.newKinematic();
            this.entity.add('dynamic');
            break;
        }

        this.options.lockRotations && (desc = desc.lockRotations());

        if (desc)
        {
            this._body = this.context.physicsWorld.createRigidBody(desc);
            this.context.dynamicMap.set(this._body.handle, this);

            this.syncTransformToBody();
        }

        //todo recreate colliders
    }

    addCollider(colliderDesc)
    {
        this.context.physicsWorld.createCollider(colliderDesc, this._body.handle);
    }    

    syncTransformToBody()
    {
        var v = new Vector3();

        this.get(Transform).worldMatrix.decompose(tempVec3, tempQuat);

        this._body.setTranslation(tempVec3);
        this._body.setRotation(tempQuat);
    }

    syncBodyToTransform()
    {
        var pos = this._body.translation();
        tempVec3.set(pos.x, pos.y, pos.z)

        if (this.options.lockRotations)
        {
            this.get(Transform).setWorldTranslation(tempVec3);
        }
        else
        {
            var rot = this._body.rotation();
            quat.set(tempQuat, rot.x, rot.y, rot.z, rot.w);
            this.get(Transform).setWorldTranslationRotation(tempVec3, tempQuat);
        }
    }

    applyForce(force)
    {
        this._body.applyForce(force, true);
    }

    setLinearDamping(damping)
    {
        this._body.setLinearDamping(damping);
    }

    applyImpulse(impulse)
    {
        this._body.applyImpulse(impulse, true);
    }

    set asset(gltfAsset)
    {
        gltfAsset.safePromise(this.lifetime)
            .then(this._processGltfAsset.bind(this))
            .catch(err => {err && console.log(err)});
    }

    _processGltfAsset(gltfAsset)
    {
        const P = this.context.PHYSICS;
        const gltf = gltfAsset.gltf;
        const world = this.context.physicsWorld;
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
            this.context.dynamicMap.delete(this._body.handle);
            this.context.physicsWorld.removeRigidBody(this._body);
            this._body = null;
        }

    }
}

Body.DISABLED = 0;
Body.STATIC = 1;
Body.DYNAMIC = 2;
Body.KINEMATIC = 2;

Body.views = {
    static_moved : ['static', 'moved']
}

Body.update = function(dt, clock, context) 
{
    context.physicsWorld.timestep = dt;
    context.physicsWorld.step();
    
    context.physicsWorld.forEachActiveRigidBodyHandle(handle => {
        context.dynamicMap.get(handle).syncBodyToTransform();
    });

    this.views.static_moved(e => {
        e.get(Body).syncTransformToBody();
    });
}