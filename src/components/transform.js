import { quat, vec3, mat4 } from "../math/index.js";

export class Transform
{
    //todo init
    bin = new Float32Array(26);
    position = new Float32Array(this.bin.buffer, 0, 3);
    rotation = new Float32Array(this.bin.buffer, 12, 4);
    scale = new Float32Array(this.bin.buffer, 28, 3);
    localMatrix = new Float32Array(this.bin.buffer, 40, 16);

    start()
    {
        vec3.set(this.position, 0, 0, 0);
        quat.identity(this.rotation);
        vec3.set(this.scale, 1,1,1);
        mat4.identity(this.localMatrix);
    }

    updateLocal()
    {
        mat4.fromRotationTranslationScale(this.localMatrix, this.rotation, this.position, this.scale);
    }
}