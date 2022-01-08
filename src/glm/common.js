/**
 * Common utilities
 * @module glMatrix
 */

// Configuration Constants
export const EPSILON = 0.000001;
export let ARRAY_TYPE =
  typeof Float32Array !== "undefined" ? Float32Array : Array;
export let RANDOM = Math.random;
export let ANGLE_ORDER = "zyx";

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */
export function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}

const degree = Math.PI / 180;

/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */
export function toRadian(a) {
  return a * degree;
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
export function equals(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}

if (!Math.hypot)
  Math.hypot = function () {
    var y = 0,
      i = arguments.length;
    while (i--) y += arguments[i] * arguments[i];
    return Math.sqrt(y);
  };


Math.clamp = function(num, lo, hi)
{
  if (num < lo) return lo;
  if (num > hi) return hi;
  return num;
}

Math.lerp = function(a, b, t)
{
  return a * (1-t) + b * t;
}

Math.approach = function(a, b, amt)
{
  const diff = b - a;
  
  if (Math.abs(diff) < Math.abs(amt))
  {
    return b;
  }

  return a + Math.sign(diff) * amt;
}

Math.lerpDt = function(a, b, rate, dt)
{
  let t = Math.pow(2, -rate * dt);
  return Math.lerp(b, a, t);
}

export function saturate(x)
{
  return Math.clamp(x, 0.0, 1.0);
}

export function remap(x, lo, hi) {
  return saturate((x - lo) / (hi  - lo));
}