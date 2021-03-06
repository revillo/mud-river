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
 * @property {number} sizeBytes - size of one value in bytes
 * @property {number} attribLocs - number of locations required for attribute binding
 * @property {string} attribType - type to use for attribute pointers
 * @property {number} attribCount - count to use for attribute pointers
 * @property {number} typeCount - number of primitive types, eg 16 for mat4
 * @property {Object} BufferType (Float32Array, Int32Array, etc)
 */

 /**
 * @readonly
 * @enum {number}
 * 
 */
const PrimitiveType = {
    UNSIGNED_BYTE: 5121,
    UNSIGNED_SHORT : 5123,
    INT : 5124,
    FLOAT : 5126
}

/**
 * @readonly
 * @enum {ShaderValueTypeInfo}
 * 
 */
const ShaderValueType =
{
    FLOAT : {id : "FLOAT", sizeBytes: 4, attribLocs: 1, attribType: PrimitiveType.FLOAT, attribCount : 1, typeCount : 1, BufferType : Float32Array}
    ,MAT4 : {id : "MAT4", sizeBytes : 64, attribLocs: 4, attribType : PrimitiveType.FLOAT, attribCount : 4, typeCount : 16, BufferType : Float32Array}
    ,COLOR3 : {id: "COLOR3", sizeBytes : 3, attribLocs: 1, attribType: PrimitiveType.UNSIGNED_BYTE, attribCount : 3, typeCount : 3, BufferType: Uint8Array}
    ,COLOR4 :  {id: "COLOR4", sizeBytes : 4, attribLocs: 1, attribType: PrimitiveType.UNSIGNED_BYTE, attribCount : 4, typeCount : 4, BufferType: Uint8Array}
    ,VEC2 : {id: "VEC2", sizeBytes: 8, attribLocs: 1, attribType : PrimitiveType.FLOAT, attribCount : 2, typeCount : 2, BufferType : Float32Array}
    ,VEC3 : {id: "VEC3", sizeBytes: 12, attribLocs: 1, attribType : PrimitiveType.FLOAT, attribCount : 3, typeCount : 3, BufferType : Float32Array}
    ,VEC4 :  {id: "VEC4", sizeBytes : 16, attribLocs: 1, attribType : PrimitiveType.FLOAT, attribCount : 4, typeCount : 4, BufferType : Float32Array}
    ,IVEC4 : {id: "IVEC4", sizeBytes: 16, attribLocs: 1, attribType : PrimitiveType.INT, attribCount : 4, typeCount : 4, BufferType : Int32Array}
}


/**
 * @readonly
 * @enum {string}
 */
const ShaderStage = 
{
    VERTEX : 35633,
    FRAGMENT : 35632
};


/**
 * @readonly
 * @enum {string}
 */
const BufferType =
{
    VERTEX : 34962,
    ATTRIBUTE : 34962,
    INDEX : 34963,
    ELEMENT: 34963,
    UNIFORM : 35345
};


/**
 * @readonly
 * @enum {string}
 */
const BufferUsage =
{
    STATIC : 35044,
    DYNAMIC : 35048
}

/**
 * @readonly
 * @enum {Object}
 */
const TextureType =
{
    TEXTURE_2D : {id: "TEXTURE2D"}
}

export {ShaderStage, BufferType, BufferUsage, ShaderValueType, TextureType, PrimitiveType}
