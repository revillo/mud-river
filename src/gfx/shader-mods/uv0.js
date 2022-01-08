import { BinType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"

const mod = {

    id : "uv0",

    defines : [
        ['HAS_UV0',  1]
    ],

    vertexAttributes : [
        ['uv0', BinType.VEC2]
    ],

    varyingBlocks : {
        PerFragment : [
            ['uv0', BinType.VEC2]
        ]
    },

    vertexMain : [`
        v_PerFragment.uv0 = a_uv0;
    `]
};


const ShaderUV0 = new ShaderMod(mod);

export { ShaderUV0 }