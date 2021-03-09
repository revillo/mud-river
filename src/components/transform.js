import { quat, vec3, mat4 } from "../math/index.js";

const tempMatrix = mat4.create();
const tempVec3 = vec3.create();

export class Transform
{
    matrix = mat4.create();

    getTranslation(posOut)
    {
        mat4.getTranslation(posOut, this.matrix);
    }

    getRotation(rotOut)
    {
        mat4.getRotation(rotOut, this.matrix);
    }

    getScale(scaleOut)
    {
        mat4.getScaling(scaleOut, this.matrix);
    }

    setMatrix(m)
    {
        mat4.copy(this.matrix, m);
    }

    reset()
    {
        mat4.identity(this.matrix);
    }

    compose(position, rotation, scale)
    {
        mat4.fromRotationTranslationScale(this.matrix, rotation, position, scale);
    }

    decompose(outTranslation, outRotation, outScale)
    {
        mat4.getScaling(outScale, this.matrix);
        outRotation && mat4.getRotation(outRotation, this.matrix);
        outScale && mat4.getTranslation(outTranslation, this.matrix);
    }

    preTranslate(translation)
    {
        mat4.fromTranslation(tempMatrix, translation);
        mat4.multiply(this.matrix, this.matrix, tempMatrix);
    }

    postTranslate(translation)
    {
        mat4.translate(this.matrix, this.matrix, translation);
    }

    setTranslation(translation)
    {
        mat4.setTranslation(this.matrix, translation);
    }

    setPosition(x, y, z)
    {
        vec3.set(tempVec3, x, y, z);
        mat4.setTranslation(this.matrix, tempVec3);
    }

    setRotation(rotation)
    {
        mat4.setRotation(this.matrix, rotation);
    }

    setTranslationRotation(translation, rotation)
    {
        mat4.setTranslationRotation(this.matrix, translation, rotation);
    }

    setScale(scale)
    {
        mat4.setScale(this.matrix, scale);
    }

    rotateVec3(inout)
    {
        vec3.rotateMat4(inout, inout, this.matrix);
    }

    //todo optimize
    getWorldMatrix(out)
    {
        var parent = this.parent;
        while(parent && !parent.has(Transform))
        {
            parent = parent.parent;
        }

        if (parent && parent.has(Transform))
        {
            parent.get(Transform).getWorldMatrix(out);
            mat4.multiply(out, out, this.matrix); 
        }
        else
        {
            mat4.copy(out, this.matrix);
        }
    }
}

Transform.selfAware = true;