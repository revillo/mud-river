import {ShaderStage} from "./gpu.js"


/**
 * @class ShaderBuilder
 */
export class ShaderBuilder
{
    /**
    * @param {Platform} platform - gl platform info (gl.getPlatform())
    * @param {string} stage - ShaderStage.VERTEX or ShaderStage.FRAGMENT
    * @param {array} [modules] - array of modules 
    */
    constructor(platform, stage, modules)
    {
        this.platform = platform;
        this.stage = stage;
        this.lines = [];
        this.modules = modules;
    }

    addModule(module)
    {
        this.modules.push(module);
    }

    setStageVertex()
    {
        this.stage = ShaderStage.VERTEX;
    }

    setStageFragment()
    {
        this.stage = ShaderStage.FRAGMENT;
    }
    
    _addUniforms()
    {
        this.lines.push("UNIFORM mat4 u_ViewProjection;");
        this.lines.push("UNIFORM mat4 u_Model;");
    }

    _buildVert()
    {
        this.lines.push(`
VERT_IN vec3 a_position;
VERT_OUT vec3 v_position;`);

        this.lines.push(`
void main()
{
    //gl_Position = vec4(a_position,1.0);
    vec4 worldPos = u_Model * vec4(a_position, 1.0);
    v_position = worldPos.xyz;
    gl_Position = u_ViewProjection * worldPos;
}`);

    }

    _buildFrag()
    {
        this.lines.push("FRAG_IN vec3 v_position;");

        if (this.platform.glVersion == 2)
        {
            this.lines.push("FRAG_OUT vec4 outColor;");
        }

        this.lines.push(`
void main()
{
    lowp vec4 finalColor = vec4(0.0, 1.0, 1.0, 1.0);
    vec3 xdiff = dFdx(v_position);
    vec3 Ydiff = dFdy(v_position);
    vec3 normal=-normalize(cross(xdiff,Ydiff));
    finalColor.rgb = vec3(0.0, 1.0, 1.0) * (dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5);
    //finalColor.rgb = vec3(0.0, 1.0, 1.0);

        `);

        if (this.platform.glVersion == 2)
        {
            this.lines.push('outColor = finalColor;');
        }
        else
        {
            this.lines.push('gl_FragColor = finalColor;');
        }

        this.lines.push("}");
    }

    build()
    {
        this.lines = [];

        if (this.platform.glVersion == 2)
        {
            this.lines.push("#version 300 es");
            this.lines.push("#define VERT_IN in");
            this.lines.push("#define VERT_OUT out");
            this.lines.push("#define FRAG_IN in");
            this.lines.push("#define FRAG_OUT out");
            this.lines.push("#define UNIFORM uniform");
        }
        else
        {
            this.lines.push("#define VERT_IN attribute");
            this.lines.push("#define VERT_OUT varying");
            this.lines.push("#define UNIFORM uniform");
            this.lines.push("#define FRAG_IN varying");
        }

        this.lines.push("precision highp float;")

        this._addUniforms();

        if (this.stage == ShaderStage.VERTEX)
        {
            this._buildVert();
        }
        else
        {
            this._buildFrag();
        }

        this._text = this.lines.join("\n");
    }

    get text()
    {
        if (!this._text)
        {
            this.build();
        }

        return this._text;
    }

}