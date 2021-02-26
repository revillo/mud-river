import { ShaderValueType } from "./gpu-types.js";

const DefaultAttributes = 
{
     Position : {id: "a_Position", type: ShaderValueType.VEC3}
    ,Normal : {id: "a_Normal", type: ShaderValueType.VEC3}
    ,UV0 : {id: "a_UV0", type: ShaderValueType.VEC2}
    ,UV1 : {id: "a_UV1", type: ShaderValueType.VEC2}
    ,BoneWeights : {id: "a_BoneWeights", type: ShaderValueType.VEC4}
    ,BoneIndices : {id: "a_BoneIndices", type: ShaderValueType.IVEC4}
    ,InstanceMatrix : {id : "a_InstanceMatrix", type : ShaderValueType.MAT4}
    ,InstanceColor : {id : "a_InstanceColor", type : ShaderValueType.VEC4}
}

function ComputeLocations()
{
    var location = 0;
    for (var a in DefaultAttributes)
    {
        DefaultAttributes[a].location = location;
        location += DefaultAttributes[a].type.attribLocs;
    }
}

console.log(DefaultAttributes);

ComputeLocations();

class AttributeLayoutGenerator 
{
    constructor(vertexAttribtues, instanceAttributes)
    {
        this.instanceAttributes = instanceAttributes;
        this.vertexAttribtues = vertexAttribtues;
        this.layout = {};
    }


    _generateAttributeHelper(layout, attributes, buffer, offset, instances, stride)
    {
        offset = offset || 0;

        if(stride == undefined)
        {
            stride = 0;
            for (let attributeName in attributes)
            {
                const attribute = attributes[attributeName];
                const type = attribute.type;
                stride += type.bytes;
            }
        }

        for (let attributeName in attributes)
        {
            const attribute = attributes[attributeName];
            const type = attribute.type;

            layout[attribute.id] = 
            {
                buffer : buffer,
                location : attribute.location,
                offset: offset,
                stride: stride,
                type: type,
                isNormalized : false,
                instanced : instances
            }
            
            offset += type.bytes;
        }
    }

    generateAttributeLayout(vertexBuffer, vertexBufferOffset, instanceBuffer, instanceBufferOffset)
    {
        this._generateAttributeHelper(this.layout, this.vertexAttribtues, vertexBuffer, vertexBufferOffset, 0);
        this._generateAttributeHelper(this.layout, this.instanceAttributes, instanceBuffer, instanceBufferOffset, 1);
        return this.layout;
    }

}


export {DefaultAttributes, AttributeLayoutGenerator}