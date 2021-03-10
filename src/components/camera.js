import { toRadian } from "../glm/common.js";
import { mat4 } from "../glm/index.js";
import { Transform } from "./transform.js";

/**
 * @class
 */
export class Camera
{
    //viewMatrix = mat4.create();
    fovY = toRadian(60);
    near = 0.01;
    far = 100;

    /**
     * 
     * @param {Matrix4} outMat4 
     */
    getViewMatrix(outMat4)
    {
        mat4.invert(outMat4, this.get(Transform).worldMatrix);
    }
}

Camera.selfAware = true;