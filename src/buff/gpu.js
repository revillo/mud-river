 /**
 * @typedef {import("./gpu-types").BinTypeInfo} ShaderValueTypeInfo
 */

import { BinType, BufferUsage, PrimitiveType } from "./gpu-types.js";

const DefaultTexture2DSettings = {
    mipmap : true
}

/**
  * @class
  */
export class GPUContext
{
    /**
     * 
     * @param {canvas} canvas - a canvas DOM elment 
     */
    constructor(canvas)
    {
        //DEBUGGING
        window.gpu = this;

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

        this._makeBindFuncs();
    }

    initGL()
    {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        
        //1 && 2
        this.extensions = {
            anisotropic : gl.getExtension('EXT_texture_filter_anisotropic')||
            gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'),
        }

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
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
    * @return {GPUProgram} compiled GLProgram or null, call getErrorTag() for more information
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

        // for (let attributeName in attributes)
        // {
        //     const attrib = attributes[attributeName];
        //     let loc = gl.getAttribLocation(program, attrib.id);
        //     console.log("Bound to", loc, attrib.id);
        // }

        return {
            glProgram : program
        }
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

        var shader = gl.createShader(stage);
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
     * @param {string} bufferType - one of BufferType.VERTEX, BufferType.INDEX, BufferType.UNIFORM 
     * @param {string} [usage] - must specify is size is specified
     * @param {number} [size] - size in bytes
     * @return {import("./gpu-types.js").GPUBuffer}
     */
    createBuffer(bufferType, usage = BufferUsage.STATIC, size = 0)
    {
        const gl = this.gl;

        let inited = false;

        const buffer = gl.createBuffer();
        
        if (size)
        {
            gl.bindBuffer(bufferType, buffer);
            gl.bufferData(bufferType, size, usage);
            gl.bindBuffer(bufferType, null);
            
            gl.bindBuffer
            inited = true;
        }

        return {
            glBuffer : buffer,
            target : bufferType,
            usage : usage,
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
     * @param {ArrayBufferView} arrayBuffer 
     * @param {number} [dstOffset]
     */
    uploadArrayBuffer(gpuBuffer, arrayBuffer, dstOffset = 0)
    {
        const gl = this.gl;
        const target = gpuBuffer.target;
        gl.bindBuffer(target, gpuBuffer.glBuffer);
        if (gpuBuffer.inited)
        {
            gl.bufferSubData(target, dstOffset, arrayBuffer, 0);
        }
        else
        {
            if (dstOffset > 0)
            {
                this._reportError("Bad Allocation", "Dest offset must be zero when filling empty buffer");
            }

            gl.bufferData(target, arrayBuffer, gpuBuffer.usage, 0);
            gpuBuffer.inited = true;
            gpuBuffer.size = arrayBuffer.buffer.byteLength;
        }

        gl.bindBuffer(target, null);
    }

    /**
     * 
     * @param {Map<string, AttributeLayout>} attributeLayout 
     * @param {IndexLayout} indexLayout 
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
            const type = attribute.type;

            for (let i = 0; i < type.attribLocs; i++)
            {
                const loc = attribute.location + i;
  
                gl.enableVertexAttribArray(loc);
                
                if (type.attribType == PrimitiveType.INT || type == BinType.U8VEC4)
                {
                    gl.vertexAttribIPointer(loc, type.attribCount, type.attribType, attribute.stride, offset);
                }
                else
                {
                    gl.vertexAttribPointer(loc, type.attribCount, type.attribType, attribute.isNormalized, attribute.stride, offset);
                }
                if (attribute.instanced)
                {
                    gl.vertexAttribDivisor(loc, attribute.instanced);
                }
                offset += type.sizeBytes / type.attribLocs;
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

    deleteGeometryBinding(meshBinding)
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

    _makeBindFuncs()
    {
        BinType.MAT4._bindFunc = (gl, loc, data) =>
        {
            gl.uniformMatrix4fv(loc, false, data);
        } 
    }

    createTexture2D(image, settings = DefaultTexture2DSettings)
    {
        const gl = this.gl;
        var glTex = gl.createTexture();
        const target = gl.TEXTURE_2D;

        gl.bindTexture(target, glTex);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  
        if (settings.mipmap)
        {
            gl.generateMipmap(target);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.REPEAT);

        const {anisotropic} = this.extensions;

        if (anisotropic)
        {
            var max = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }

        return {
            glTexture : glTex,
            target : target
        }
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

    unbindProgram()
    {
        this.boundProgram = null;
        this.gl.useProgram(null);
    }

    bindProgram(program)
    {
        var changed = program != this.boundProgram;
        if (!changed)
        {
            return false;
        }

        this.boundProgram = program;
        this.gl.useProgram(program.glProgram);
        return true;
    }

    bindUniformValue(program, valueTypeInfo, name, arrayBuffer)
    {
        const gl = this.gl;
        var loc = gl.getUniformLocation(program.glProgram, name);
        valueTypeInfo._bindFunc(gl, loc, arrayBuffer);
    }

    bindTexture(program, name, texture, channel = 0)
    {
        const gl = this.gl;
        var loc = gl.getUniformLocation(program.glProgram, name);

        gl.activeTexture(gl.TEXTURE0 + channel);
        gl.bindTexture(texture.target, texture.glTexture);
        gl.uniform1i(loc, channel);     
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
