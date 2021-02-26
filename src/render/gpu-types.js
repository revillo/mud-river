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
    FLOAT : {id : "FLOAT", bytes: 4, attribLocs: 1, attribType: "FLOAT", attribCount : 1}
    ,MAT4 : {id : "MAT4", bytes : 64, attribLocs: 4, attribType : "FLOAT", attribCount : 4}
    ,COLOR3 : {id: "COLOR3", bytes : 3, attribLocs: 1}
    ,COLOR4 :  {id: "COLOR3", bytes : 4, attribLocs: 1}
    ,VEC2 : {id: "VEC2", bytes: 8, attribLocs: 1, attribType : "FLOAT", attribCount : 2}
    ,VEC3 : {id: "VEC3", bytes: 12, attribLocs: 1, attribType : "FLOAT", attribCount : 3}
    ,VEC4 :  {id: "VEC4", bytes : 16, attribLocs: 1, attribType : "FLOAT", attribCount : 4}
    ,IVEC4 : {id: "IVEC4", bytes: 16, attribLocs: 1, attribType : "INT", attribCount : 4}
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
