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
     * @param {Map<string, AttributeLayout>} vertexLayout 
     * @param {number} indexCount
     * @param {GPUBuffer} [indexBuffer] 
     * @param {number} [startIndex]
     * @return {GPUGeometryBinding}
     */
    createGeometryBinding(vertexLayout, indexLayout, instanceLayout)
    {
        const gl = this.gl;
        const vao = gl.createVertexArray();
        
        gl.bindVertexArray(vao);

        for (let attributeName in vertexLayout)
        {
            /**
             * @type {AttributeLayout}
             */
            const attribute = vertexLayout[attributeName];
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer.glBuffer);
            gl.enableVertexAttribArray(attribute.location);
            gl.vertexAttribPointer(attribute.location, attribute.count, gl[attribute.type], attribute.isNormalized, attribute.stride, attribute.offset);
        }
 
        for (let attributeName in (instanceLayout || []))
        {
            const attribute = instanceLayout[attributeName];
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer.glBuffer);

            if (attribute.type == "MAT4" && attribute.count == 1)
            {
                const startLocation = attribute.location;

                for (let i = 0; i < 4; ++i) 
                {
                    const loc = startLocation + i;
                    gl.enableVertexAttribArray(loc);
                    
                    const offset = i * 16 + attribute.offset;  
                    gl.vertexAttribPointer(
                        loc,              
                        4,                //vec4                
                        gl.FLOAT, 
                        false,            //normalized
                        attribute.stride, 
                        offset           
                    );

                    // this line says this attribute only changes for each 1 instance
                    gl.vertexAttribDivisor(loc, 1);
                }
            }
            else
            {
                this._reportError("Bad Attribute", attribute.count + " " + attribute.type);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        var indexType = gl.UNSIGNED_SHORT;

        if (indexLayout.buffer)
        {
            if (indexType instanceof Uint16Array)
            {
                indexType = gl.UNSIGNED_SHORT;
            }
            else if (indexType instanceof Uint32Array)
            {
                indexType = gl.UNSIGNED_INT;
            }

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
     * @param {*} [cmd] 
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
                //todo integer types
                gl.drawElements(geometryBinding.mode, geometryBinding.indexCount, gl.UNSIGNED_SHORT, geometryBinding.startIndex);
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
