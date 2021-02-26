import { ShaderValueType } from "./types.js";

const DefaultAttributes = 
{
     Position : {id: "a_Position", type: ShaderValueType.VEC3}
    ,Normal : {id: "a_Normal", type: ShaderValueType.VEC3}
    ,InstanceMatrix : {id : "a_InstanceMatrix", type : ShaderValueType.MAT4}
    
    /*
    ,UV0 : {id: "a_UV0", type: ShaderValueType.VEC2}
    ,UV1 : {id: "a_UV1", type: ShaderValueType.VEC2}
    ,BoneWeights : {id: "a_BoneWeights", type: ShaderValueType.VEC4}
    ,BoneIndices : {id: "a_BoneIndices", type: ShaderValueType.IVEC4}
    ,InstanceColor : {id : "a_InstanceColor", type : ShaderValueType.VEC4}
    */
}

function ComputeLocations()
{
    var location = 0;
    for (var a in DefaultAttributes)
    {
        DefaultAttributes[a].location = location;
        location += 1;
        
        if (DefaultAttributes[a].type == ShaderValueType.MAT4)
        {
            location += 3;
        }
    }
}

ComputeLocations();

/*
const DefaultAttributeLocations = {
    
    a_Position : 0,
    a_Normal: 1,
    a_UV0 : 2,
    a_UV1 : 3,
    a_BoneWeights: 4,
    a_BoneIndices: 5,

    //6,7??

    a_InstanceMatrix : 8, // 9 // 10 // 11
    a_InstanceColor : 12
};
*/

class AttributeLayoutGenerator 
{
    constructor(attributeList, instanceList)
    {
        this.instanceList = instanceList;
        this.attributeList = attributeList;
    }

    generateVertexLayout(buffer, offset)
    {
        const attributeLayout = {};
        var offset = 0;

        for (let attributeName in this.attributeList)
        {
            const attribute = this.attributeList[attributeName];
            const location = attribute.location;

            attributeLayout[attribute.id] = 
            {
                buffer : buffer,
                location : location,
                offset: offset,
                stride: 4 * 8,
                count: 3,
                type : ShaderValueType.FLOAT,
                isNormalized : false
            }
        }

        return attributeLayout;
    }

    generateInstanceLayout(buffer, offset)
    {
        
    }

}


export {DefaultAttributes, AttributeLayoutGenerator}