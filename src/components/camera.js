import { toRadian } from "../glm/common.js";
import { mat4 } from "../glm/index.js";
import { Transform } from "./transform.js";
import {EntityComponent} from "../game/game-context.js"
import { Vector3 } from "../math/index.js";

/**
 * @class
 * @extends {EntityComponent}
 */
export class Camera extends EntityComponent
{
    fovY = toRadian(60);
    near = 0.1;
    far = 1000;

    _tanX = 0.577;
    _tanY = 0.577;

    /**
     * 
     * @param {number} clipX -1 to 1 
     * @param {number} clipY -1 to 1
     * @param {Vector3} outOrigin out ray origin
     * @param {Vector3} outDirection out ray direction
     */
    getRay(clipX, clipY, outOrigin, outDirection)
    {
        let wm = Transform.getWorldMatrix(this.entity);

        wm.getTranslation(outOrigin);

        outDirection.set(
            this._tanX * clipX,
            this._tanY * clipY,
            -1.0
        );

        outDirection.normalize();

        outDirection.rotateMat4(wm);
    }


    /**
     * 
     * @param {Matrix4} outMat4 
     */
    getViewMatrix(outMat4)
    {
        mat4.affineInvert(outMat4, Transform.getWorldMatrix(this.entity));
    }
}