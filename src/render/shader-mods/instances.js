import {ShaderMod} from "./shader-mod.js"

class ShaderModeInstances extends ShaderMod
{
    addDeclares(sb)
    {
        sb.$(`
#define HAS_INSTANCES 1`);
    }

    addAttributes(sb)
    {
        sb.$(`
ATTRIBUTE mat4 a_InstanceMatrix;
        `)
    }

    addVertexMain(sb)
    {
        sb.$(`
        worldMatrix = worldMatrix * a_InstanceMatrix;
        `);
    }

}

const ShaderInstances = new ShaderModeInstances();

export { ShaderInstances }