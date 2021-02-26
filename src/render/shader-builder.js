import {ShaderStage} from "./gpu.js"


/**
 * @class
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
        this.modules = modules || [];
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

    $(str)
    {
        this.lines.push(str);
    }
    
    _addUniforms()
    {
        this.$("UNIFORM mat4 u_ViewProjection;");
        this.$("UNIFORM mat4 u_Model;");

        this.modules.forEach(mod => {
            mod.addUniforms(this)
        });
    }

    _addVaryings()
    {
        
this.$(`
struct PerFragment
{
    vec3 worldPosition;`);

this.modules.forEach(mod => {
    mod.addPerFragment(this);
});

this.$(`
};
VARYING PerFragment v_PerFragment;`);

    }

    _buildVert()
    {
this.$(`
ATTRIBUTE vec3 a_position;`);

this.modules.forEach(mod => {
    mod.addAttributes(this);
    mod.addVertexFunctions(this);
});

        this.$(`
void main()
{
    mat4 worldMatrix = u_Model;
    `);

    this.modules.forEach(mod => {
        mod.addVertexMain(this)
    });

this.$(`
    vec4 worldPosition = worldMatrix * vec4(a_position, 1.0);
    v_PerFragment.worldPosition = worldPosition.xyz;
    gl_Position = u_ViewProjection * worldPosition;
}`);

    }

    _buildFrag()
    {
        if (this.platform.glVersion == 2)
        {
            this.lines.push("FRAG_OUT vec4 outColor;");
        }

        this.modules.forEach(mod => {
            mod.addFragmentFunctions(this);
        });

        this.lines.push(`
void main()
{
    lowp vec4 finalColor = vec4(mod(v_PerFragment.worldPosition, vec3(1.0)), 1.0);`);

        this.modules.forEach(mod => {
            mod.addFragmentMain(this);
        });

        if (this.platform.glVersion == 2)
        {
            this.lines.push(`outColor = finalColor;
}`);
        }
        else
        {
            this.lines.push(`gl_FragColor = finalColor;
}`);
        }

    }

    build()
    {
        this.lines = [];

        if (this.platform.glVersion == 2)
        {
            this.lines.push("#version 300 es");
            this.lines.push("#define UNIFORM uniform");

            if (this.stage == ShaderStage.VERTEX)
            {
                this.lines.push("#define ATTRIBUTE in");
                this.lines.push("#define VARYING out");
            }
            else
            {
                this.lines.push("#define VARYING in");
                this.lines.push("#define FRAG_OUT out");
            }
        }
        else
        {
            /* TODO WEBGL1
            */
        }
        this.lines.push("precision highp float;")

        this._addUniforms();
        this._addVaryings();

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