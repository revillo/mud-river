import { Lifetime } from "../assets/assets.js";
import { Collision } from "../game/collision.js";
import { EntityComponent } from "../game/game-context.js";
import { mat4, quat, vec3 } from "../glm/index.js";
import { Quaternion, Vector3 } from "../math/index.js";
import { Transform } from "./transform.js";

const tempVec3 = new Vector3();
const tempQuat = new Quaternion();


/**
 * @class
 */
export class Body extends EntityComponent {
    colliders = [];
    _type = Body.DISABLED;
    _body = null;
    lifetime = new Lifetime;
    config = {
        lockRotations: false,
        shapeType: Body.TRIMESH,
        collisionGroups: Collision.getCollisionGroups([Collision.STATIC], [Collision.DYNAMIC, Collision.PLAYER])
    };

    onAttach() {
        this.entity.ensure(Transform);
    }

    get type() {
        return this._type;
    }

    get body() {
        return this._body;
    }

    configure(physicsType, config) {
        Object.assign(this.config, config);
        this.type = physicsType;
        return this;
    }

    set type(physicsType) {
        if (this._type == physicsType) {
            return;
        }

        const P = this.context.PHYSICS;

        this._type = physicsType;

        if (this._body) {
            this.context.physicsWorld.removeRigidBody(this._body);
            this._body = null;
        }

        var desc;

        this.entity.detach(Body.TAG_SIMULATED, Body.TAG_UNSIMULATED);

        switch (physicsType) {
            case Body.NONE:
                break;

            case Body.STATIC:
                desc = P.RigidBodyDesc.newStatic();
                this.entity.attach(Body.TAG_UNSIMULATED);
                break;

            case Body.DYNAMIC:
                desc = P.RigidBodyDesc.newDynamic();
                this.entity.attach(Body.TAG_SIMULATED);
                break;

            case Body.KINEMATIC:
                desc = P.RigidBodyDesc.newKinematic();
                this.entity.attach(Body.TAG_UNSIMULATED);
                break;
        }

        this.config.lockRotations && (desc = desc.lockRotations());

        if (desc) {
            this._body = this.context.physicsWorld.createRigidBody(desc);
            this.context.bodyMap.set(this._body.handle, this);

            this.syncBodyFromTransform();
        }

        //todo recreate colliders
    }

    addCollider(colliderDesc) {
        let collider = this.context.physicsWorld.createCollider(colliderDesc, this._body.handle);
        this.context.colliderMap.set(collider.handle, this.entity);
    }

    syncBodyFromTransform() {
        var v = new Vector3();

        this.get(Transform).worldMatrix.decompose(tempVec3, tempQuat);

        this._body.setTranslation(tempVec3);
        this._body.setRotation(tempQuat);
    }

    syncTransformFromBody() {
        var pos = this._body.translation();
        tempVec3.set(pos.x, pos.y, pos.z)

        if (this.config.lockRotations) {
            this.get(Transform).setWorldTranslation(tempVec3);
        }
        else {
            var rot = this._body.rotation();
            quat.set(tempQuat, rot.x, rot.y, rot.z, rot.w);
            this.get(Transform).setWorldTranslationRotation(tempVec3, tempQuat);
        }
    }

    applyForce(force) {
        this._body.applyForce(force, true);
    }

    applyAcceleration(accel) {
        vec3.scale(tempVec3, accel, this._body.mass());
        this._body.applyForce(tempVec3);
    }

    set linearDamping(damping) {
        this._body.setLinearDamping(damping);
    }

    applyImpulse(impulse) {
        this._body.applyImpulse(impulse, true);
    }

    set asset(gltfAsset) {
        gltfAsset.safePromise(this.lifetime)
            .then(this._processGltfAsset.bind(this))
            .catch(err => { err && console.log(err) });
    }

    _processGltfAsset(gltfAsset) {
        const P = this.context.PHYSICS;
        const gltf = gltfAsset.gltf;
        const world = this.context.physicsWorld;
        const body = this._body;
        const thiz = this;

        function nodeHelper(node) {
            if (node.mesh) {
                const mesh = gltf.meshes[node.mesh];

                mat4.getTranslation(tempVec3, node.matrix);
                mat4.getRotation(tempQuat, node.matrix);

                node.mesh.primitives.forEach(prim => {

                    let colliderDesc = null;

                    if (thiz.config.shapeType == Body.TRIMESH) {
                        colliderDesc = P.ColliderDesc.trimesh(prim.verticesPhys, prim.indicesPhys);
                        colliderDesc.setTranslation(tempVec3[0], tempVec3[1], tempVec3[2]);
                    }
                    else if (thiz.config.shapeType == Body.BOX) {
                        colliderDesc = P.ColliderDesc.cuboid(prim.extents[0], prim.extents[1], prim.extents[2]);
                        colliderDesc.setTranslation(tempVec3[0] + prim.center[0], tempVec3[1] + prim.center[1], tempVec3[2] + prim.center[2]);
                    }
                    else if (thiz.config.shapeType == Body.SPHERE) {
                        const radius = Math.max(...prim.extents);
                        colliderDesc = P.ColliderDesc.ball(radius);
                        colliderDesc.setTranslation(tempVec3[0] + prim.center[0], tempVec3[1] + prim.center[1], tempVec3[2] + prim.center[2]);
                    }

                    if (node.rotation) {
                        colliderDesc.setRotation(tempQuat[0], tempQuat[1], tempQuat[2], tempQuat[3]);
                    }

                    colliderDesc.setCollisionGroups(thiz.config.collisionGroups);

                    thiz.addCollider(colliderDesc);
                });
            }

            if (node.children)
                node.children.forEach(nodeHelper);
        }

        gltf.scenes[0].nodes.forEach(nodeHelper)
    }

    onDetach() {
        this.lifetime.end();

        if (this._body) {
            for (let i = 0; i < this._body.numColliders; ++i) {
                this.context.colliderMap.delete(this._body.collider(i));
            }

            this.context.bodyMap.delete(this._body.handle);
            this.context.physicsWorld.removeRigidBody(this._body);
            this._body = null;
        }

    }
}

Body.DISABLED = 0;
Body.STATIC = 1;
Body.DYNAMIC = 2;
Body.KINEMATIC = 3;

Body.TRIMESH = 4;
Body.HULL = 5;
Body.BOX = 6;
Body.SPHERE = 7;

Body.TAG_UNSIMULATED = 'unsim';
Body.TAG_SIMULATED = 'sim';

Body.views = {
    unsim_moved: [Body.TAG_UNSIMULATED, Transform.TAG_MOVED],
    body: [Body]
}

Body.update = function (dt, clock, context) {
    context.physicsWorld.timestep = dt;
    context.physicsWorld.step();

    context.physicsWorld.forEachActiveRigidBodyHandle(handle => {
        context.bodyMap.get(handle).syncTransformFromBody();
    });

    this.views.unsim_moved(e => {
        e.get(Body).syncBodyFromTransform();
    });
}


Body.postShift = function (t) {
    this.views.body(e => {
        e.get(Body).syncBodyFromTransform();
    });
}