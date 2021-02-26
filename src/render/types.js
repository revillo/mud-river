/**
 * @typedef {Object} Platform
 * @property {number} glVersion - the version of webgl
 */

 /**
  * @typedef {Object} AttributeLayout
  * @property {GPUBuffer} buffer
  * @property {number} location  
  * @property {string} type - FLOAT, INT
  * @property {number} count - count of elements per vertex, ie 3 for vec3
  * @property {number} offset 
  * @property {number} stride
  * @property {bool} [isNormalized]
*/

/**
 * @readonly
 * @enum {string}
 * 
 */
const ShaderValueType =
{
    FLOAT : "FLOAT",
    MAT4 :  "MAT4",
    COLOR3 : "COLOR3",
    COLOR4 : "COLOR4",
    VEC2 : "VEC2",
    VEC3 : "VEC3",
    VEC4 : "VEC4",
    IVEC4 : "IVEC4"
}


/**
 * @readonly
 * @enum {number}
 * 
 */
const ShaderValueSize =
{
    FLOAT : 4,
    MAT4 :  64,
    COLOR3 : 3,
    COLOR4 : 4,
    VEC2 : 8,
    VEC3 : 12,
    VEC4 : 16,
    IVEC4 : 16
}


/**
 * @readonly
 * @enum {string}
 */
const ShaderStage = 
{
    VERTEX : "VERTEX_SHADER",
    FRAGMENT : "FRAGMENT_SHADER"
};


/**
 * @readonly
 * @enum {string}
 */
const BufferType =
{
    VERTEX : "ARRAY_BUFFER",
    ATTRIBUTE : "ARRAY_BUFFER",
    INDEX : "ELEMENT_ARRAY_BUFFER",
    ELEMENT: "ELEMENT_ARRAY_BUFFER",
    UNIFORM : "UNIFORM_BUFFER"
};


/**
 * @readonly
 * @enum {string}
 */
const BufferUsage =
{
    STATIC : "STATIC_DRAW",
    DYNAMIC : "DYNAMIC_DRAW"
}

export {ShaderStage, BufferType, BufferUsage, ShaderValueType}
