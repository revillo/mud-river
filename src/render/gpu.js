/**
 * @typedef {Object} Platform
 * @property {number} glVersion - the version of webgl
 */

 /**
  * @typedef {AttributeLayout}
  * @property {number} location  
  * @property {string} type - FLOAT, INT
  * @property {number} count - count of elements per vertex, ie 3 for vec3
  * @property {number} offset 
  * @property {number} stride
  * @property {bool} [isNormalized]
  */

const ShaderStage = 
{
    VERTEX : "VERTEX_SHADER",
    FRAGMENT : "FRAGMENT_SHADER"
};

const BufferType =
{
    VERTEX : "ARRAY_BUFFER",
    ATTRIBUTE : "ARRAY_BUFFER",
    INDEX : "ELEMENT_ARRAY_BUFFER",
    ELEMENT: "ELEMENT_ARRAY_BUFFER",
    UNIFORM : "UNIFORM_BUFFER"
};

const BufferUsage =
{
    STATIC : "STATIC_DRAW",
    DYNAMIC : "DYNAMIC_DRAW"
}

export {ShaderStage, BufferType, BufferUsage}

 /**
  * @class GPUContextGL
  * @member {Platform} platform
  */
export class GPUContextGL
{
    /**
     * 
     * @param {canvas} canvas - a canvas DOM elment 
     */
    constructor(canvas)
    {
        var canvasOpts = {antialias : true};

        this.gl = canvas.getContext("webgl2", canvasOpts);
        this.platform = {};
        this.canvas = canvas;

        if (this.gl)
        {
            this.platform.glVersion = 2;
        }
        else
        {
            this.gl = canvas.getContext("webgl", canvasOpts);
            this.platform.glVersion = 1;
        }

        if (!this.gl)
        {
            this._reportError("Unsupported Browser", "Your browser is not supported. Please enable webgl or webgl2");
        }

    }

    /**
     * @return {Platform} 
     */
    getPlatform()
    {
        return this.platform;
    }

    /**
    * @param {Shader} vertexShader - vertex shader 
    * @param {Shader} fragmentShader - fragment shader 
    * @param {Object} attributeLocations - map of attribute name and location
    * @return {Program} compiled GLProgram or null, call getErrorTag() for more information
    */
   createProgram(vertexShader, fragmentShader, attributeLocations)
    {
        const gl = this.gl;

        var program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        for (let attributeName in attributeLocations)
        {
            gl.bindAttribLocation(program, attributeLocations[attributeName], attributeName);
        }

        gl.linkProgram(program);

        if ( !gl.getProgramParameter( program, gl.LINK_STATUS) ) 
        {
            var info = gl.getProgramInfoLog(program);
            this._reportError("Program Error", info);
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    /**
     * 
     * @param {string} source 
     * @param {string} stage - "VERTEX_SHADER" or "FRAGMENT_SHADER"
     * @return {Shader} shader
     */
    createShader(source, stage)
    {
        const gl = this.gl;

        var shader = gl.createShader(gl[stage]);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
          return shader;
        }
       
        this._reportError("Shader Error", stage + " " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    deleteShader(shader)
    {
        const gl = this.gl;

        gl.deleteShader(shader);
    }

    
    /**
     * 
     * @param {string} type - one of BufferType.VERTEX, BufferType.INDEX, BufferType.UNIFORM 
     * @param {string} [usage] - must specify is size is specified
     * @param {number} [size]
     * @return {GPUBuffer}
     */
    createBuffer(type, usage, size)
    {
        const gl = this.gl;
        usage = usage || "STATIC_DRAW";
        const buffer = gl.createBuffer();
        var inited = false;

        if (size)
        {
            gl.bufferData(gl[type], size, gl[usage]);
            inited = true;
        }

        return {
            glBuffer : buffer,
            target : gl[type],
            usage : gl[usage],
            inited: inited,
            size : size
        }
    }

    deleteBuffer(buffer)
    {
        this.gl.deleteBuffer(buffer.glBuffer);
    }

    /**
     * 
     * @param {GPUBuffer} gpuBuffer 
     * @param {ArrayBuffer} arrayBuffer 
     * @param {number} [dstOffset]
     * @param {number} [srcOffset]
     * @param {number} [length] - only avaialable for webgl2
     */
    uploadArrayBuffer(gpuBuffer, arrayBuffer, dstOffset, srcOffset, length)
    {
        dstOffset = dstOffset || 0;
        srcOffset = srcOffset || 0;

        const gl = this.gl;
        const target = gpuBuffer.target;
        gl.bindBuffer(target, gpuBuffer.glBuffer);
        if (gpuBuffer.inited)
        {
            gl.bufferSubData(target, dstOffset, arrayBuffer, srcOffset, length);
        }
        else
        {
            gl.bufferData(target, arrayBuffer, gpuBuffer.usage, srcOffset, length);
            gpuBuffer.inited = true;
        }

        gl.bindBuffer(target, null);

        //todo do something else for webgl1
    }


    /**
     * 
     * @param {GPUBuffer} vertexBuffer 
     * @param {Map<string, AttributeLayout>} vertexLayout 
     * @param {number} indexCount
     * @param {GPUBuffer} [indexBuffer] 
     * @param {number} [startIndex]
     * @return {GPUGeometryBinding}
     */
    createGeometryBinding(vertexBuffer, vertexLayout, indexCount, indexBuffer, startIndex)
    {
        const gl = this.gl;
        const vao = gl.createVertexArray();
        
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.glBuffer);

        for (var attributeName in vertexLayout)
        {
            const attribute = vertexLayout[attributeName];
            gl.enableVertexAttribArray(attribute.location);
            gl.vertexAttribPointer(attribute.location, attribute.count, gl[attribute.type], attribute.isNormalized, attribute.stride, attribute.offset);
        }
 
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer ? indexBuffer.glBuffer : 0);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return {
            glVAO : vao,
            startIndex : startIndex || 0,
            indexCount : indexCount,
            isIndexed : !!indexBuffer,
            //todo?
            mode : gl.TRIANGLES
        };

    }

    deleteMeshBinding(meshBinding)
    {
        this.gl.deleteVertexArray(meshBinding.glVAO);
    }

    /**
     * @return {string} the last error tag, if any 
     */
    getErrorTag()
    {
        return this.lastErrorTag;
    }

    _reportError(tag, error)
    {
        this.lastErrorTag = tag;
        console.error(tag, error);
    }
    
    setViewport(x, y, w, h, cmd)
    {
        const gl = this.gl;
        gl.viewport(x, y, w, h);
    }

    clear(color, cmd)
    {
        const gl = this.gl;
        gl.clearColor(color.r, color.g, color.b, color.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1);
    }

    bindProgram(program, cmd)
    {
        const gl = this.gl;
        gl.useProgram(program);
    }

    /**
     * 
     * @param {GPUGeometryBinding} meshBinding 
     * @param {*} [cmd] 
     */
    rasterizeMesh(geometryBinding, cmd)
    {
        const gl = this.gl;
        gl.bindVertexArray(geometryBinding.glVAO);
        if (geometryBinding.isIndexed)
        {
            //todo integer types
            gl.drawElements(geometryBinding.mode, geometryBinding.indexCount,  gl.UNSIGNED_SHORT, geometryBinding.startIndex);
        }
        else
        {
            gl.drawArrays(geometryBinding.mode, geometryBinding.startIndex, geometryBinding.indexCount);
        }
        gl.bindVertexArray(null);
    }

}
