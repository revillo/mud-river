import { ShaderValueType } from "./gpu-types.js";

const DefaultAttributes = 
{
     POSITION : {id: "a_position", type: ShaderValueType.VEC3}
    ,NORMAL : {id: "a_normal", type: ShaderValueType.VEC3}
    ,UV0 : {id: "a_uv0", type: ShaderValueType.VEC2}
    ,UV1 : {id: "a_uv1", type: ShaderValueType.VEC2}
    ,TANGENT : {id: "a_tangent", type: ShaderValueType.VEC3}
    ,BONE_WEIGHTS : {id: "a_boneWeights", type: ShaderValueType.VEC4}
    ,BONE_INDICES : {id: "a_boneIndices", type: ShaderValueType.IVEC4}
    ,INSTANCE_MATRIX : {id : "a_instanceMatrix", type : ShaderValueType.MAT4}
    ,INSTANCE_COLOR : {id : "a_instanceColor", type : ShaderValueType.VEC4}
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

        /**
         * @type {Map<string, AttributeLayout>}
         */
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
                stride += type.sizeBytes;
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
            
            offset += type.sizeBytes;
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