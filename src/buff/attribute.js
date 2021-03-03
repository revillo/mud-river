import { ShaderValueType } from "./gpu-types.js";

const DefaultAttributes = 
{
     position : {id: "a_position", type: ShaderValueType.VEC3}
    ,normal : {id: "a_normal", type: ShaderValueType.VEC3}
    ,uv0 : {id: "a_uv0", type: ShaderValueType.VEC2}
    ,uv1 : {id: "a_uv1", type: ShaderValueType.VEC2}
    ,boneWeights : {id: "a_boneWeights", type: ShaderValueType.VEC4}
    ,boneIndices : {id: "a_boneIndices", type: ShaderValueType.IVEC4}
    ,instanceMatrix : {id : "a_instanceMatrix", type : ShaderValueType.MAT4}
    ,instanceColor : {id : "a_instanceColor", type : ShaderValueType.VEC4}
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

            //Todo optimize for re-use
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

    /**
     * 
     * @return {import("./gpu-types.js").AttributeLayoutMap}
     */
    generateAttributeLayout(vertexBufferView, instanceBufferView)
    {
        this._generateAttributeHelper(this.layout, this.vertexAttribtues, vertexBufferView.buffer, vertexBufferView.offset, 0);
        if (instanceBufferView)
        {
            this._generateAttributeHelper(this.layout, this.instanceAttributes, instanceBufferView.buffer, instanceBufferView.offset, 1);
        }
        return this.layout;
    }

}


export {DefaultAttributes, AttributeLayoutGenerator}