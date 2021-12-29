import { EntityComponent, Vector3 } from "../index.js";
import { Transform } from "./transform.js";

let tempVec3 = Vector3.new();

export class Jump extends EntityComponent
{
    _body = null

    configure(body)
    {
        this._body = body;
    }

    jump(impulse = 2, up = null)
    {
        Transform.getWorldMatrix(this.entity).getUp(tempVec3);
        tempVec3.setLength(impulse);
        this._body.applyImpulse(tempVec3);
    }
}
