import { toRadian } from "../math/common.js";
import { mat4 } from "../math/index.js";
import { Transform } from "./transform.js";

export class Camera
{
    //viewMatrix = mat4.create();
    fovY = toRadian(60);

    getViewMatrix(outMat4)
    {
        this.get(Transform).getWorldMatrix(outMat4);
        mat4.invert(outMat4, outMat4);
    }
}

Camera.selfAware = true;