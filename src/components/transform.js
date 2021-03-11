import { EntityComponent } from "../game/game-context.js";
import { quat, vec3, mat4 } from "../glm/index.js";
import { Matrix4 } from "../math/index.js";

const tempMat4 = Matrix4.new();

/**
 * @class
 * @extends EntityComponent
 */
export class Transform extends EntityComponent
{
    _worldMatrix = Matrix4.new();
    _localMatrix = Matrix4.new();

    _dirty = true;



    //todo optimize - mark children dirty
    _fixDirty()
    {
        var parent = this.entity.parent;
        while(parent && !parent.has(Transform))
        {
            parent = parent.parent;
        }

        if (parent && parent.has(Transform))
        {
            mat4.multiply(this._worldMatrix, parent.get(Transform).worldMatrix, this._localMatrix); 
        }
        else
        {
            mat4.copy(this._worldMatrix, this._localMatrix);
        }
        this._dirty = false;
    }

    setLocalPosition(x, y, z)
    {
        this._localMatrix.setPosition(x, y, z);
        this._markDirty();
    }

    setLocalTranslation(v)
    {
        this._localMatrix.setTranslation(v);
        this._markDirty();
    }

    setLocalRotation(q)
    {
        this._localMatrix.setRotation(q);
        this._markDirty();
    }

    setLocalMatrix(m)
    {
        this._localMatrix.copy(m);
        this._markDirty();
    }

    setLocalTranslationRotation(v, q)
    {
        this._localMatrix.setTranslationRotation(v, q);
        this._markDirty();
    }

    getInverseParent(out)
    {
        var parent = this.entity.parent;
        while(parent && !parent.has(Transform))
        {
            parent = parent.parent;
        }

        if (parent && parent.has(Transform))
        {
            mat4.affineInvert(out, parent.get(Transform).worldMatrix);
            return true;
        }
        
        return false;
    }

    _fixLocal()
    {
        if(this.getInverseParent(this._localMatrix))
            mat4.multiply(this._localMatrix, this._localMatrix, this._worldMatrix);
        else
            mat4.copy(this._localMatrix, this._worldMatrix);
        this._markChildrenDirty();
    }

    setWorldTranslation(v)
    {
        this.worldMatrix.setTranslation(v);
        this._fixLocal();
    }

    setWorldRotation(q)
    {
        this.worldMatrix.setRotation(q);
        this._fixLocal();
    }

    setWorldTranslationRotation(v, q)
    {
        this.worldMatrix.setTranslationRotation(v, q);
        this._fixLocal();
    }

    _markChildrenDirty()
    {
        this.entity.add("moved");
        this.entity.eachChild(e => {
            if (e.has(Transform))
            {
                e.get(Transform)._markDirty();
                return false;
            }
        }, true);
    }

    _markDirty()
    {
        this._dirty = true;
        this._markChildrenDirty();
    }

    /**
     * @return {Matrix4}
     */
    get worldMatrix()
    {
        this._dirty && this._fixDirty();
        return this._worldMatrix;
    }
    

}