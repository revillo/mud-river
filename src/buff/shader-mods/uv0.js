import { ShaderValueType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"

const mod = {
    defines : {
        HAS_UV0 : 1
    },

    vertexAttributes : {
        uv0 : ShaderValueType.VEC2
    },

    varyingBlocks : {
        PerFragment : {
            uv0 : ShaderValueType.VEC2
        }
    },

    vertexMain : [`
        v_PerFragment.uv0 = a_uv0;
    `]
};


const ShaderUV0 = new ShaderMod(mod);

export { ShaderUV0 }