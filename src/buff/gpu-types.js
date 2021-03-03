/**
 * @typedef {Object} Platform
 * @property {number} glVersion - the version of webgl
 */

 /**
  * @typedef {Object} AttributeLayout
  * @property {GPUBuffer} buffer
  * @property {number} location  
  * @property {ShaderValueTypeInfo} type
  * @property {number} offset 
  * @property {number} stride
  * @property {bool} [isNormalized]
*/

/**
 * @typedef {Map<string, AttributeLayout>} AttributeLayoutMap
 */

/**
 * @typedef {Object} GPUBuffer
 * @property {Object} glBuffer
 * @property {bool} inited
 */

/**
 * @typedef {Object} ShaderValueTypeInfo
 * @property {number} bytes - size of one value in bytes
 * @property {number} attribLocs - number of locations required for attribute binding
 * @property {string} attribType - type to use for attribute pointers
 * @property {number} attribCount - count to use for attribute pointers
 * @property {number} typeCount - number of primitive types, eg 16 for mat4
 * @property {Object} BufferType (Float32Array, Int32Array, etc)
 */

/**
 * @readonly
 * @enum {ShaderValueTypeInfo}
 * 
 */
const ShaderValueType =
{
    FLOAT : {id : "FLOAT", bytes: 4, attribLocs: 1, attribType: "FLOAT", attribCount : 1, typeCount : 1, BufferType : Float32Array}
    ,MAT4 : {id : "MAT4", bytes : 64, attribLocs: 4, attribType : "FLOAT", attribCount : 4, typeCount : 16, BufferType : Float32Array}
    ,COLOR3 : {id: "COLOR3", bytes : 3, attribLocs: 1, attribType: "UNSIGNED_BYTE", attribCount : 3, typeCount : 3, BufferType: Uint8Array}
    ,COLOR4 :  {id: "COLOR4", bytes : 4, attribLocs: 1, attribType: "UNSIGNED_BYTE", attribCount : 4, typeCount : 4, BufferType: Uint8Array}
    ,VEC2 : {id: "VEC2", bytes: 8, attribLocs: 1, attribType : "FLOAT", attribCount : 2, typeCount : 2, BufferType : Float32Array}
    ,VEC3 : {id: "VEC3", bytes: 12, attribLocs: 1, attribType : "FLOAT", attribCount : 3, typeCount : 3, BufferType : Float32Array}
    ,VEC4 :  {id: "VEC4", bytes : 16, attribLocs: 1, attribType : "FLOAT", attribCount : 4, typeCount : 4, BufferType : Float32Array}
    ,IVEC4 : {id: "IVEC4", bytes: 16, attribLocs: 1, attribType : "INT", attribCount : 4, typeCount : 4, BufferType : Int32Array}
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

/**
 * @readonly
 * @enum {Object}
 */
const TextureType =
{
    TEXTURE_2D : {id: "TEXTURE2D"}
}

export {ShaderStage, BufferType, BufferUsage, ShaderValueType, TextureType}
