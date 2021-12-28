import { Collision, EntityComponent, GameEntity, Vector3 } from "../index.js";
import { Transform } from "./transform.js";

const rayOrigin = Vector3.new();
const rayDir = Vector3.new();

export class SpringArm extends EntityComponent
{
    maxLength = 30;

    /**
     * @type {GameEntity}
     */
    mountEntity = null;

    _ray = null;

    onAttach()
    {
        this._ray = new this.context.PHYSICS.Ray(rayOrigin, rayDir);
        this.mountEntity = this.entity.createChild(Transform);
        this.collisionGroups = Collision.getCollisionGroups([Collision.GAZE], [Collision.STATIC]);
    }

    adjustMount(length)
    {
        this.mountEntity.get(Transform).setLocalPosition(0, 0, length);
    }

    castRayAndUpdate()
    {
        const wm = Transform.getWorldMatrix(this.entity);
        wm.getForward(rayDir);
        wm.getTranslation(rayOrigin);
        rayDir.invert();

        let hit = this.context.physicsWorld.queryPipeline.castRay(
            this._ray,  this.maxLength, true, this.collisionGroups);

        this.adjustMount(hit ? hit.toi : this.maxLength);
    }
}