import { ShaderValueType } from "./gpu-types.js";

 /**
  * @class
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

        /** @member {Platform} */
        this.platform = {};
        
        /** @member {HTMLCanvas} */
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
        else
        {
            this.initGL();
        }
    }

    initGL()
    {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
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
    * @param {Object} attributes - map of vertex attributes, usually DefaultAttributes
    * @return {Program} compiled GLProgram or null, call getErrorTag() for more information
    */
   createProgram(vertexShader, fragmentShader, attributes)
    {
        const gl = this.gl;

        var program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        for (let attributeName in attributes)
        {
            const attrib = attributes[attributeName];
            gl.bindAttribLocation(program, attrib.location, attrib.id);
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
     * @param {number} [length]
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
            gpuBuffer.size = arrayBuffer.buffer.byteLength;
        }

        gl.bindBuffer(target, null);

        //todo do something else for webgl1
    }

    /**
     * 
     * @param {Map<string, AttributeLayout>} attributeLayout 
     * @param {number} indexCount
     * @param {IndexLayout} [indexLayout] 
     * @return {GPUGeometryBinding}
     */
    createGeometryBinding(attributeLayout, indexLayout)
    {
        const gl = this.gl;
        const vao = gl.createVertexArray();
        
        gl.bindVertexArray(vao);

        for (let attributeName in attributeLayout)
        {
            /**
             * @type {AttributeLayout}
             */
            const attribute = attributeLayout[attributeName];
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer.glBuffer);
            let offset = attribute.offset;

            for (let i = 0; i < attribute.type.attribLocs; i++)
            {
                const loc = attribute.location + i;
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, attribute.type.attribCount, gl[attribute.type.attribType], attribute.isNormalized, attribute.stride, offset);
                if (attribute.instanced)
                {
                    gl.vertexAttribDivisor(loc, attribute.instanced);
                }
                offset += attribute.type.bytes / attribute.type.attribLocs;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        var indexType = indexLayout.type || gl.UNSIGNED_SHORT;

        if (indexLayout.buffer)
        {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexLayout.buffer.glBuffer);
        }

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return {
            glVAO : vao,
            startIndex : indexLayout.start || 0,
            indexCount : indexLayout.count,
            isIndexed : !!indexLayout.buffer,

            //todo?
            indexType : indexType,
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
    
    setViewport(x, y, w, h)
    {
        const gl = this.gl;
        gl.viewport(x, y, w, h);
    }

    clear(color)
    {
        const gl = this.gl;
        gl.clearColor(color.r, color.g, color.b, color.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1);
    }

    bindProgram(program)
    {
        const gl = this.gl;
        gl.useProgram(program);
    }

    /**
     * 
     * @param {GPUGeometryBinding} meshBinding 
     * @param {number} instanceCount 
     */
    rasterizeMesh(geometryBinding, instanceCount)
    {
        const gl = this.gl;
     
        gl.bindVertexArray(geometryBinding.glVAO);
        gl.drawArrays(geometryBinding.mode, geometryBinding.startIndex, geometryBinding.indexCount);

        if (geometryBinding.isIndexed)
        {
            if (instanceCount)
            {
                gl.drawElementsInstanced(geometryBinding.mode, geometryBinding.indexCount, geometryBinding.indexType, geometryBinding.startIndex, instanceCount);
            }
            else
            {
                gl.drawElements(geometryBinding.mode, geometryBinding.indexCount, geometryBinding.indexType, geometryBinding.startIndex);
            }
        }
        else
        {
            if (instanceCount)
            {
                gl.drawArraysInstanced(geometryBinding.mode, geometryBinding.startIndex, geometryBinding.indexCount, instanceCount);
            }
            else
            {
                gl.drawArrays(geometryBinding.mode, geometryBinding.startIndex, geometryBinding.indexCount);
            }
        }
        gl.bindVertexArray(null);
    }

}
