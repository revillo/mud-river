import { ShaderValueType, TextureType } from "../gpu-types.js";
import {ShaderMod} from "./shader-mod.js"
import { ShaderUV0 } from "./uv0.js";

const mod = {

    requires : [ShaderUV0],

    textures : {
        baseColor : TextureType.TEXTURE_2D
    },

    fragmentMain : [`
        finalColor = SAMPLE_2D(t_baseColor, v_PerFragment.uv0);
        //finalColor = vec4(v_PerFragment.uv0, 1.0, 1.0);
    `]
};


const ShaderSimpleTexture = new ShaderMod(mod);

export { ShaderSimpleTexture }