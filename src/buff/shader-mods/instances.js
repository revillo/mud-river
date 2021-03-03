import { ShaderValueType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"

const mod = {
    defines : {
        HAS_INSTANCES : 1
    },

    instanceAttributes : {
        instanceMatrix : ShaderValueType.MAT4
    },

    vertexMain : [`
    worldMatrix = worldMatrix * a_instanceMatrix;
    `],
};


const ShaderInstances = new ShaderMod(mod);

export { ShaderInstances }
