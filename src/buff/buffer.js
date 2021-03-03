 /**
 * @typedef {import("./gpu-types").ShaderValueTypeInfo} ShaderValueTypeInfo
 */

import { GPUContext } from "./gpu.js";
import { BufferType, BufferUsage } from "./gpu-types.js";
import { AttributeLayoutGenerator } from "./attribute.js";

function setError()
{
    console.error("Error: Must not reassign block properties.");
}

class BlockBuffer
{
    constructor(count, schema, alignment)
    {
        var blockSize = 0;
        this.schema = {};
        this.blocks = [];
        this.blocks.length = count;

        this.blockClass = function(offset)
        {
            this.offset = offset;
        }

        var thiz = this;

        for (let propertyName in schema)
        {
            const blockOffset = blockSize;

            /**
             * @type {ShaderValueTypeInfo}
             */
            const type = schema[propertyName];

            this.schema[propertyName] = 
            {
                type: type,
                blockOffset : blockOffset            
            }

            Object.defineProperty(this.blockClass.prototype, propertyName, {
                get : function()
                {
                    return new type.BufferType(thiz.cpuBuffer, this.offset + blockOffset, type.typeCount);
                },
                set : setError
            });

            blockSize += type.bytes;
        }

        this.blockSize = blockSize;
        this.count = count;
        this._createArrayBuffer(count);



    }

    setBufferViewGPU(view, gpu)
    {
        this.bufferViewGPU = view;
        this.gpu = gpu;
    }

    uploadBlocks(start, count)
    {
        start = start || 0;
        count = count || this.count;

        if (this.bufferViewGPU)
        {
            let arrayBuffer = new Uint8Array(this.cpuBuffer, start * this.blockSize, count * this.blockSize);
            this.gpu.uploadArrayBuffer(this.bufferViewGPU.buffer, arrayBuffer, this.bufferViewGPU.offset);
        }
    }

    /**
     * 
     * @return {ArrayBuffer} 
     */
    _createArrayBuffer()
    {
        this.cpuBuffer = new ArrayBuffer(this.blockSize * this.count);
        return this.cpuBuffer;
    }

    getBlock(index) //todo optimize block creation
    {
        if (this.blocks[index])
        {
            return this.blocks[index]
        }

        var offset = index * this.blockSize;
        var block = new this.blockClass(offset);

        /*
        for (let propertyName in this.schema)
        {
            const property = this.schema[propertyName];

            const type = property.type;
            block[propertyName] = new type.BufferType(this.cpuBuffer, offset, type.typeCount);
            offset += property.blockOffset;
        }*/

        this.blocks[index] = block;
        return block;
    }

}

export class UniformBlockBuffer extends BlockBuffer
{
    constructor(name, count, schema)
    {
        super(count, schema);
        this.name = name;

        this.uniformPrefix = "u_" + this.name + ".";

        for (let propertyName in this.schema)
        {
            this.schema[propertyName].bindName = (this.uniformPrefix + propertyName);
        }
    }

    bindUniformBlock(index, program)
    {
        let block = this.getBlock(index);
        //WebGL1 version
        for (let propertyName in this.schema)
        {
            const property = this.schema[propertyName];
            const type = property.type;
            this.gpu.bindUniformValue(program.gpuProgram, type, property.bindName, block[propertyName]);
        }
    }
}

export class AttributeBlockBuffer extends BlockBuffer
{
    constructor(count, schema)
    {
        super(count, schema, 0);
    }

    getInstanceBufferView()
    {
        return this.bufferViewGPU;
    }
}


export class BufferManager
{
    /**
     * 
     * @param {GPUContext} gpu 
     */
    constructor(gpu)
    {
        this.gpu = gpu;
    }

    allocBufferView(bufferType, bufferUsage, arrayBufferView)
    {
        //TODO proper paging
        let offset = 0;
        let gpuBuffer = this.gpu.createBuffer(bufferType, bufferUsage);
        this.gpu.uploadArrayBuffer(gpuBuffer, arrayBufferView, offset);

        return {
            buffer : gpuBuffer,
            offset : offset
        }
    }


    allocVertexBufferView(arrayBufferView, usage)
    {
        usage = usage || BufferUsage.STATIC;
        return this.allocBufferView(BufferType.VERTEX, usage, arrayBufferView);
    }

    allocIndexBufferView(arrayBufferView, usage)
    {
        usage = usage || BufferUsage.STATIC;
        let bufferView = this.allocBufferView(BufferType.INDEX, usage, arrayBufferView);
        bufferView.count = arrayBufferView.length;
        
        if (arrayBufferView instanceof Uint16Array)
        {
            bufferView.start = bufferView.offset / 2;
            bufferView.type = this.gpu.gl.UNSIGNED_SHORT;
        }
        else if (arrayBufferView instanceof Uint32Array)
        {
            bufferView.start = bufferView.offset / 4;
            bufferView.type = this.gpu.gl.UNSIGNED_INT;
        }

        return bufferView;
    }

    allocInstanceBufferView(arrayBufferView, usage)
    {
        usage = usage || BufferUsage.STATIC;
        return this.allocBufferView(BufferType.ATTRIBUTE, usage, arrayBufferView);
    }

    allocEmptyBufferView(type, usage, sizeBytes)
    {
        return {
            buffer : this.gpu.createBuffer(type, usage, sizeBytes),
            offset: 0
        };
    }

    allocInstanceBlockBuffer(count, schema, bufferUsage)
    {
        bufferUsage = bufferUsage || BufferUsage.DYNAMIC;

        let abb = new AttributeBlockBuffer(count, schema);
        let bv = this.allocEmptyBufferView(BufferType.ATTRIBUTE, bufferUsage, abb.count * abb.blockSize);
        abb.setBufferViewGPU(bv, this.gpu);

        return abb;
    }

    allocUniformBlockBuffer(name, count, schema, bufferUsage)
    {
        let ubb = new UniformBlockBuffer(name, count, schema);
        ubb.gpu = this.gpu;

        /*
        if (this.gpu.platform.glVersion == 2)
        {
            bufferUsage = bufferUsage || BufferUsage.DYNAMIC;
            let bv = this.allocEmptyBufferView(BufferType.UNIFORM, bufferUsage, ubb.count * ubb.blockSize);
            ubb.setBufferViewGPU(bv);
        }*/

        return ubb;
    }

    createGeometryBinding(geometry, vertexAttribList, instanceAttribList, instanceBufferView)
    {
        const vertBufferView = this.allocVertexBufferView(geometry.vertices);
        const indexBufferView = this.allocIndexBufferView(geometry.indices);

        var attrGen = new AttributeLayoutGenerator(
            vertexAttribList, 
            instanceAttribList
        ); 

        const attributeLayout = attrGen.generateAttributeLayout(vertBufferView, instanceBufferView);
        
        return this.gpu.createGeometryBinding(attributeLayout, indexBufferView);
    }
}
