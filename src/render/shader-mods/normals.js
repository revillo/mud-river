import {ShaderMod} from "./shader-mod.js"

class ShaderModNormals extends ShaderMod
{
    addDeclares(sb)
    {
        sb.$(`
#define HAS_NORMALS 1`);
    }

    addAttributes(sb)
    {
        sb.$(`
ATTRIBUTE vec3 a_Normal;
        `)
    }

    addPerFragment(sb)
    {
        sb.$(`
    vec3 worldNormal;`)
    }

    addVertexMain(sb)
    {
        sb.$(`
        v_PerFragment.worldNormal = (worldMatrix * vec4(a_Normal, 0.0)).xyz;
        `);
    }

    addFragmentMain(sb)
    {
        sb.$(`
            finalColor.rgb = normalize(v_PerFragment.worldNormal) * 0.5 + vec3(0.5);
        `)
    }

}

const ShaderNormals = new ShaderModNormals();

export { ShaderNormals }