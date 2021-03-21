import { toRadian } from "../glm/common.js";
import { mat4 } from "../glm/index.js";
import { Transform } from "./transform.js";
import {EntityComponent} from "../game/game-context.js"

/**
 * @class
 * @extends {EntityComponent}
 */
export class Camera extends EntityComponent
{
    //viewMatrix = mat4.create();
    fovY = toRadian(60);
    near = 0.01;
    far = 1000;

    start()
    {
        this.entity.ensure(Transform);
    }
    //todo ensure transform

    /**
     * 
     * @param {Matrix4} outMat4 
     */
    getViewMatrix(outMat4)
    {
        mat4.affineInvert(outMat4, this.get(Transform).worldMatrix);
    }
}