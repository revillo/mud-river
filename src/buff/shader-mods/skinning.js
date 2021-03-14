import { BinType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"

const mod = {
    defines : [
        ['HAS_SKIN',  1],
        ['MAX_JOINTS', 120]
    ],

    vertexAttributes : [
        ['jointWeights', BinType.VEC4],
        ['jointIndices', BinType.U8VEC4]
    ],

    uniformBlocks : {
       Animation : [
           ['joint[MAX_JOINTS]', BinType.MAT4]
       ]
    },

    vertexFunctions : [`
    mat4 computeSkinnedMatrix() {
        return  a_jointWeights.x * u_Animation.joint[int(a_jointIndices.x)] +
                a_jointWeights.y * u_Animation.joint[int(a_jointIndices.y)] +
                a_jointWeights.z * u_Animation.joint[int(a_jointIndices.z)] +
                a_jointWeights.w * u_Animation.joint[int(a_jointIndices.w)];
    }`
    ],

    vertexMain : [`
        worldMatrix = worldMatrix * computeSkinnedMatrix();
    `],

    rankBias : 20
};


const ShaderSkinning = new ShaderMod(mod);

export { ShaderSkinning }