import { ShaderValueType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"

const mod = {
    defines : {
        HAS_INSTANCES : 1
    },

    instanceAttributes : {
        InstanceMatrix : ShaderValueType.MAT4
    },

    vertexMain : [`
    worldMatrix = worldMatrix * a_InstanceMatrix;
    `],
};


const ShaderInstances = new ShaderMod(mod);

export { ShaderInstances }
