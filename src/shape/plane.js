import { vec3 } from "../glm/index.js";
import { Vector3 } from "../math/index.js";

let tempVec3 = new Vector3();

export class Plane
{
    normal = new Vector3(0, 1, 0);

    construct(normal)
    {
        this.setNormal(normal);
    }

    setNormal(normal)
    {
        this.normal.copy(normal);
    }

    setNormalXYZ(normal)
    {
        this.normal.set(normal.x, normal.y, normal.z);
    }

    project(outv3, inv3)
    {
        let dot = vec3.dot(this.normal, inv3);
        tempVec3.copy(this.normal);
        tempVec3.scale(dot);

        outv3.copy(inv3);
        outv3.sub(tempVec3);
    }
}