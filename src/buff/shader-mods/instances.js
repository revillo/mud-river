import { BinType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"

const mod = {

    id : "instances",

    defines : [
        ['HAS_INSTANCES' , 1]
    ],

    instanceAttributes : [
        ['instanceMatrix', BinType.MAT4]
    ],

    vertexMain : [`
    worldMatrix = worldMatrix * a_instanceMatrix;
    `],

    rankBias : 10
};


const ShaderInstances = new ShaderMod(mod);

export { ShaderInstances }
