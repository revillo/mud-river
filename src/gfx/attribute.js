import { BinType } from "./gpu-types.js";

const DefaultAttributes = 
{
     POSITION : {id: "a_position", type: BinType.VEC3}
    ,NORMAL : {id: "a_normal", type: BinType.VEC3}
    ,UV0 : {id: "a_uv0", type: BinType.VEC2}
    ,UV1 : {id: "a_uv1", type: BinType.VEC2}
    ,TANGENT : {id: "a_tangent", type: BinType.VEC3}
    ,JOINT_WEIGHTS : {id: "a_jointWeights", type: BinType.VEC4}
    ,JOINT_INDICES : {id: "a_jointIndices", type: BinType.U8VEC4}
    ,INSTANCE_MATRIX : {id : "a_instanceMatrix", type : BinType.MAT4}
    ,INSTANCE_COLOR : {id : "a_instanceColor", type : BinType.VEC4}
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
    constructor(vertexAttributes, instanceAttributes, vertsInterleaved = false, instancesInterleaved = true)
    {
        this.instanceAttributes = instanceAttributes;
        this.vertexAttributes = vertexAttributes;
        this.vertsInterleaved = vertsInterleaved;
        this.instancesInterleaved = instancesInterleaved;

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
                stride: stride == 0 ? type.sizeBytes : stride,
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
        if (this.vertexAttributes)
        {
            this._generateAttributeHelper(this.layout, this.vertexAttributes, vertexBufferView.buffer, vertexBufferView.offset, 0, this.vertsInterleaved ? undefined : 0);
        }

        if (this.instanceAttributes)
        {
            this._generateAttributeHelper(this.layout, this.instanceAttributes, instanceBufferView.buffer, instanceBufferView.offset, 1, this.instancesInterleaved ? undefined : 0);
        }

        return this.layout;
    }

}


export {DefaultAttributes, AttributeLayoutGenerator}