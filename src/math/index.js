import { toRadian } from "../glm/common.js";
import { mat4, quat, vec2, vec3 } from "../glm/index.js";

const radToDeg = 180 / Math.PI;
const PI2 = Math.PI * 2;
const PI = Math.PI;

export class Angle {
    rads = 0;

    constructor(radians = 0)
    {
        this.rads = radians;
    }

    copy(otherAngle)
    {
        this.radians = otherAngle.radians;
    }
    
    static newRadians(radians)
    {
        return new Angle(radians);
    }

    static newDegrees(degrees)
    {
        return new Angle(degrees / radToDeg);
    }

    set radians(radians)
    {
        this.rads = radians;
    }

    set degrees(degrees)
    {
        this.rads = degrees / radToDeg;
    }

    get degrees() 
    {
        return this.rads * radToDeg;
    }

    get radians() 
    {
        return this.rads;
    }

    /**
     * 
     * @param {number} rad 
     * @returns {number}
     */
    static _normalize(rad)
    {
        let r = rad % PI2;
        return r >= 0? r : (r + PI2); 
    }

    delta(angleTarget)
    {
        let to = Angle._normalize(angleTarget.radians);
        let from = Angle._normalize(this.radians);

        let sub = to - from;

        if (sub > PI) return sub - PI2;
        if (sub < -PI) return PI2 + sub;
        return sub;
    }

    lerpTo(angleTarget, t)
    {
        let delta = this.delta(angleTarget);
        this.radians = this.radians + delta * t;
    }

    /**
     * 
     * @param {Angle} angleTarget 
     * @param {number} rate 
     * @param {number} dt 
     */
    lerpToDt(angleTarget, rate, dt)
    {
        let t = 1-Math.pow(2, -rate * dt);
        this.lerpTo(angleTarget, t);
    }
}


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

    invert()
    {
        this[0] = -this[0];
        this[1] = -this[1];
        this[2] = -this[2];
    }

    toString()
    {
        return `[${this.x}, ${this.y}, ${this.z}]`;
    }

    getSign(array)
    {
        vec3.sign(array, this);
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

    getDistance(s)
    {
        return vec3.dist(this, s);
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

    dot(v)
    {
        return vec3.dot(this, v);
    }

    lerpTo(v, t)
    {
        vec3.lerp(this, this, v, t);
    }

    smoothLerpTo(v, rate, dt)
    {
        let t = Math.pow(2, -rate * dt);
        vec3.lerp(this, v, this, t);       
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
Vector3.RIGHT = new Vector3(1, 0, 0);
Vector3.FORWARD = new Vector3(0, 0, -1);

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

    setAxisAngle(v, rads)
    {
        quat.setAxisAngle(this, v, rads);
    }

    multiply(q)
    {
        quat.multiply(this, q, this);
    }

    preMultiply(q)
    {
        quat.multiply(this, this, q);
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

    smoothSlerpTo(q, rate, dt)
    {
        let t = 1.0 - Math.pow(2, -rate * dt);
        quat.slerp(this, this, q, t);
    }
}
/**
 * @return {Quaternion}
 */
Quaternion.new = () => new Quaternion;

let tempQuat = new Quaternion();
let tempM4 = mat4.create();

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

    rotate(q)
    {
        mat4.fromQuat(tempM4, q);
        mat4.multiply(this, tempM4, this);
    }

    preRotate(q)
    {
        mat4.fromQuat(tempM4, q);
        mat4.multiply(this, this, tempM4);    
    }

    multiply(m4)
    {
        mat4.multiply(this, m4, this);
    }

    preMultiply(m4)
    {
        mat4.multiply(this, this, m4);
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

    rotateUpDegrees(deg)
    {
        this.rotateUp(toRadian(deg));
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

    getRotation(qOut)
    {
        mat4.getRotation(qOut, this);
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