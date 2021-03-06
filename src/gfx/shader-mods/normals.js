import { BinType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"

const mod = {
    defines : [
        ['HAS_NORMALS', 1]
    ],

    vertexAttributes : [
        ['normal', BinType.VEC3]
    ],

    varyingBlocks : {
        PerFragment : [
            ['worldNormal' , BinType.VEC3]
        ]
    },

    vertexMain : [`
        v_PerFragment.worldNormal = (worldMatrix * vec4(a_normal, 0.0)).xyz;
    `],

    fragmentMain : [`
        finalColor.rgb = normalize(v_PerFragment.worldNormal) * 0.5 + vec3(0.5);
    `],

    rankBias : 30
};


const ShaderNormals = new ShaderMod(mod);

export { ShaderNormals }