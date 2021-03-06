import { BinType, TextureType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"
import { ShaderUV0 } from "./uv0.js";

const mod = {

    id : "simple-tex",


    requires : [ShaderUV0],

    textures : [
        ['baseColor', TextureType.TEXTURE_2D]
    ],

    fragmentMain : [`
        finalColor = SAMPLE_2D(t_baseColor, v_PerFragment.uv0);
    `]
};


const ShaderSimpleTexture = new ShaderMod(mod);

export { ShaderSimpleTexture }