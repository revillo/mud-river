import { mat4, quat, vec2, vec3 } from "../glm/index.js";

export class Vector2 extends Float32Array
{
    constructor(x = 0, y = 0)
    {
        super(2);
        this[0] = x;
        this[1] = y;
    }

    get x(){return this[0];}
    set x(nx){this[0] = nx;}

    get y(){return this[1];}
    set y(ny){this[1] = ny;}

    set(x, y)
    {
        this[0] = x;
        this[1] = y;
    }
}

let tempVec2 = new Vector2();
let temp2Vec2 = new Vector2();
let temp3Vec2 = new Vector2();

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

    copy(v)
    {
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2];
    }

    getManhattan()
    {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }

    getLength()
    {
        return vec3.length(this);
    }

    setLength(s)
    {
        vec3.setLength(this, s);
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

    sub(v)
    {
        vec3.subtract(this, this, v);
    }

    add(v)
    {
        vec3.add(this, this, v);
    }

    print(name)
    {
        console.log(`${name}[${this[0].toFixed(3)}, ${this[1].toFixed(3)}, ${this[2].toFixed(2)}]`)
    }

    reset()
    {
        this.set(0,0,0);
    }

    zero()
    {
        this.reset();
    }

    packOctahedral(outVec2)
    {  
        let xy = tempVec2;
        let yx = temp2Vec2;
        let snz = temp3Vec2;

        xy.set(this[0], this[1]);
        vec2.scale(xy, xy, 1/this.getManhattan());
        yx.set(1 - Math.abs(xy.y), 1 - Math.abs(xy.x));
        vec2.sign(snz, xy);
        vec2.mul(yx, yx, snz);
        vec2.copy(outVec2,  this[2] > 0 ? xy : yx);  
        
        outVec2[0] = Math.clamp(0.5 * outVec2[0] + 0.5, 0.0, 0.9999);
        outVec2[1] = Math.clamp(0.5 * outVec2[1] + 0.5, 0.0, 0.9999);
    }

    unpackOctahedral(v2)
    {
        tempVec2.set(v2[0] * 2 - 1, v2[1] * 2 - 1);
        
        this[0] = tempVec2.x;
        this[1] = tempVec2.y;
        this[2] = 1.0 - Math.abs(tempVec2.x) - Math.abs(tempVec2.y);
      
        let t = Math.clamp(-this[2], 0, 1);
        this[0] += this[0] > 0 ? -t : t;
        this[1] += this[1] > 0 ? -t : t;

        this.normalize();
    }
}

window.Vector3 = Vector3;

/**
 * @return {Vector3}
 */
Vector3.new = () => new Vector3;
Vector3.DOWN = new Vector3(0, -1, 0);
Vector3.UP = new Vector3(0, 1, 0);
Vector3.ZERO = new Vector3(0, 0, 0);

let tempVec3 = new Vector3();
let temp2Vec3 = new Vector3();
let temp3Vec3 = new Vector3();

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

    reset()
    {
        this.set(0,0,0,1);
    }

    identity()
    {
        this.reset();
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

let tempQuat = new Quaternion();

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

    getTranslation(out)
    {
        out[0] = this[12];
        out[1] = this[13];
        out[2] = this[14];
    }

    getForward(out)
    {
        out[0] = -this[8];
        out[1] = -this[9];
        out[2] = -this[10];
    }

    getUp(out)
    {
        out[0] = this[4];
        out[1] = this[5];
        out[2] = this[6];
    }

    getRight(out)
    {
        out[0] = this[0];
        out[1] = this[1];
        out[2] = this[2];
    }

    setUpForward(up, forward)
    {
        vec3.cross(tempVec3, forward, up);
        tempVec3.normalize();
        vec3.cross(temp2Vec3, up, tempVec3);
        this.setRightUpForward(tempVec3, up, temp2Vec3);
    }

    rotateUp(rad)
    {
        this.getUp(tempVec3);
        quat.setAxisAngle(tempQuat, tempVec3, rad);
        quat.normalize(tempQuat, tempQuat);

        this.getForward(temp2Vec3);
        this.getRight(temp3Vec3);
        
        vec3.transformQuat(temp2Vec3, temp2Vec3, tempQuat);
        vec3.transformQuat(temp3Vec3, temp3Vec3, tempQuat);

        this.setRightUpForward(temp3Vec3, tempVec3, temp2Vec3);
    }

    setRightUpForward(right, up, forward)
    {
        this[0] = right[0];
        this[1] = right[1];
        this[2] = right[2];
        
        this[4] = up[0];
        this[5] = up[1];
        this[6] = up[2];

        this[8] = -forward[0];
        this[9] = -forward[1];
        this[10] = -forward[2];
    }

    getRotation(rotOut)
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