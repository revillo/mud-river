import { mat4, quat, vec3 } from "../glm/index.js";

/**
 * @class
 */
export class Vector3 extends Float32Array
{
    constructor(x = 0, y = 0, z = 0)
    {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    get x(){return this[0];}
    set x(nx){this[0] = nx;}

    get y(){return this[1];}
    set y(ny){this[1] = ny;}
    
    get z(){return this[2];}
    set z(nz){this[2] = nz;}

    set(x,y,z)
    {
        vec3.set(this, x, y, z);
    }

    scale(s)
    {
        this[0] *= s;
        this[1] *= s;
        this[2] *= s;
    }

    rotateMat4(m4)
    {
        vec3.rotateMat4(this, this, m4);
    }

    transformMat4(m4)
    {
        vec3.transformMat4(this, this, m4);
    }

    normalize()
    {
        vec3.normalize(this, this);
    }
}

/**
 * @return {Vector3}
 */
Vector3.new = () => new Vector3;
Vector3.DOWN = new Vector3(0, -1, 0);
Vector3.UP = new Vector3(0, 1, 0);

/**
 * @class
 */
export class Quaternion extends Float32Array
{
    constructor(x, y, z, w)
    {
        super(4);

        if (w != undefined)
        {
            quat.set(this, x, y, z, w);
        }
        else
        {
            quat.identity(this);
        }
    }

    get x() { return this[0]; }
    set x(nx) { this[0] = nx; }
    
    get y(){return this[1];}
    set y(ny){this[1] = ny;}

    get z(){return this[2];}

    set z(nz){this[2] = nz;}

    get w(){return this[3];}

    set w(nw){this[3] = nw;}

    normalize()
    {
        quat.normalize(this, this);
    }

    set(x, y, z, w)
    {
        quat.set(this, x, y, z, w);
    }

    /**
     * 
     * @param {Quaternion} q - quat to slerp to
     * @param {number} t - interpolant 
     */
    slerpTo(q, t)
    {
        quat.slerp(this, this, q, t);
    }
}
/**
 * @return {Quaternion}
 */
Quaternion.new = () => new Quaternion;


/**
 * @class
 */
export class Matrix4 extends Float32Array
{
    constructor()
    {
        super(16);
        mat4.identity(this);
    }

    copyTranslation(posOut)
    {
        mat4.getTranslation(posOut, this);
    }

    getTranslation(posOut)
    {
        mat4.getTranslation(posOut, this);
    }

    copyForward(out)
    {
        out[0] = -this[8];
        out[1] = -this[9];
        out[2] = -this[10];
    }

    getRotation(rotOut)
    {
        mat4.getRotation(rotOut, this);
    }

    copyRotation(rotOut)
    {
        mat4.getRotation(rotOut, this);
    }

    getScale(scaleOut)
    {
        mat4.getScaling(scaleOut, this);
    }

    decompose(outTranslation, outRotation, outScale)
    {
        outTranslation && mat4.getTranslation(outTranslation, this);
        outRotation && mat4.getRotation(outRotation, this);
        outScale && mat4.getScaling(outScale, this);
    }

    compose(position, rotation, scale)
    {
        mat4.fromRotationTranslationScale(this, rotation, position, scale);
    }

    translate(translation)
    {
        mat4.translate(this, this, translation);
    }

    setTranslation(translation)
    {
        mat4.setTranslation(this, translation);
    }

    setPosition(x, y, z)
    {
        this[12] = x;
        this[13] = y;
        this[14] = z;
    }

    setRotation(rotation)
    {
        quat.normalize(rotation, rotation);
        mat4.setRotation(this, rotation);
    }

    setTranslationRotation(translation, rotation)
    {
        quat.normalize(rotation, rotation);
        mat4.setTranslationRotation(this, translation, rotation);
    }

    setScale(scale)
    {
        mat4.setScale(this, scale);
    }

    copy(m)
    {
        mat4.copy(this, m);
    }

    invert()
    {
        mat4.invert(this, this);
    }

    affineInvert()
    {
        mat4.affineInvert(this, this);
    }

    reset()
    {
        mat4.identity(this);
    }

}

/**
 * @return {Matrix4}
 */
Matrix4.new = () => new Matrix4