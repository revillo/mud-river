import { EntityComponent } from "../game/game-context.js";
import { quat, vec3, mat4 } from "../glm/index.js";
import { temp2 } from "../glm/mat4.js";
import { Matrix4, Quaternion, Vector3 } from "../math/index.js";

let tempVec3 = Vector3.new();
let temp2Vec3 = Vector3.new();
let temp3Vec3 = Vector3.new();
let tempQuat = Quaternion.new();

/**
 * @class
 * @extends EntityComponent
 */
export class Transform extends EntityComponent
{
    _worldMatrix = Matrix4.new();
    _localMatrix = Matrix4.new();

    _dirty = true;

    start()
    {
        this.entity.add("moved");
    }

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
            mat4.affineMultiply(this._worldMatrix, parent.get(Transform).worldMatrix, this._localMatrix); 
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

    worldTranslate(v)
    {
        this.worldMatrix.getTranslation(tempVec3);
        tempVec3.add(v);
        this.setWorldTranslation(tempVec3);
    }

    worldRotateUp(rads)
    {
        this.worldMatrix.getUp(tempVec3);
        quat.setAxisAngle(tempQuat, tempVec3, rads);
        //quat.normalize(tempQuat);

        this._worldMatrix.getForward(temp2Vec3);
        this._worldMatrix.getRight(temp3Vec3);
        
        vec3.transformQuat(temp2Vec3, temp2Vec3, tempQuat);
        vec3.transformQuat(temp3Vec3, temp3Vec3, tempQuat);

        this._worldMatrix.setRightUpForward(temp3Vec3, tempVec3, temp2Vec3);
        this._fixLocal();
    }

    setLocalUpForward(up, forward)
    {
        vec3.cross(tempVec3, forward, up);
        tempVec3.normalize();
        vec3.cross(temp2Vec3, up, tempVec3);

        this._localMatrix.setRightUpForward(tempVec3, up, temp2Vec3);

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

    setWorldMatrix(m)
    {
        this._worldMatrix.copy(m);
        this._fixLocal();
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
            mat4.affineMultiply(this._localMatrix, this._localMatrix, this._worldMatrix);
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

    getWorldTranslation(v)
    {
        this.worldMatrix.getTranslation(v);
    }

    getLocalTranslation(v)
    {
        this._localMatrix.getTranslation(v);
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
            
            e.add("moved");
            return true;
        });
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


Transform.icon = "Transform"

Transform.getWorldMatrix = function(entity)
{
    if (entity.has(Transform))
    {
        return entity.get(Transform).worldMatrix;
    }

    return Transform.getWorldMatrix(entity.parent);
}