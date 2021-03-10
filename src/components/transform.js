import { quat, vec3, mat4 } from "../glm/index.js";
import { Matrix4 } from "../math/index.js";


export class Transform extends Matrix4
{
    
    /**
     * @type {Matrix4}
     */
    _worldMatrix = Matrix4.new();
    
    _dirty = true;

    //todo optimize - mark children dirty
    fixDirty()
    {
        var parent = this.parent;
        while(parent && !parent.has(Transform))
        {
            parent = parent.parent;
        }

        if (parent && parent.has(Transform))
        {
            mat4.multiply(this._worldMatrix, parent.get(Transform).worldMatrix, this); 
            //this._dirty = false;
        }
        else
        {
            mat4.copy(this._worldMatrix, this);
        }
    }

    copyWorldMatrix(out)
    {
        this._dirty && this.fixDirty();
        mat4.copy(out, this._worldMatrix);
    }

    /**
     * @return {Matrix4}
     */
    get worldMatrix()
    {
        this._dirty && this.fixDirty();
        return this._worldMatrix;
    }

    
    /**
     * @return {Matrix4}
     */
    get localMatrix()
    {
        return this;
    }
}

Transform.selfAware = true;