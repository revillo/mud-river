import {ShaderStage, ShaderValueType} from "./types.js"

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
        this.uniformBlocks = 
        {
            Globals : {
                viewProjection : ShaderValueType.MAT4 
            },

            Locals : {
                model : ShaderValueType.MAT4
            }
        }
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
        this.modules.forEach(mod => {
            mod.addUniforms(this);
        });

        for (let blockName in this.uniformBlocks)
        {
            this.$("struct " + blockName + "{");
            const block = this.uniformBlocks[blockName];

            for (let propertyName in block)
            {
                this.$(block[propertyName] + " " + propertyName + ";");
            }

            this.$("};\n" + "UNIFORM " + blockName +  " u_" + blockName + ";");
        }


        /*

        this.$(`
        
        struct Globals {
            mat4 viewProjection;
        };

        UNIFORM Globals u_Globals;
        `);

        this.modules.forEach(mod => {
            mod.addUniforms(this)
        });
        */
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
ATTRIBUTE vec3 a_Position;`);

this.modules.forEach(mod => {
    mod.addAttributes(this);
    mod.addVertexFunctions(this);
});

        this.$(`
void main()
{
    mat4 worldMatrix = u_Locals.model;
    `);

    this.modules.forEach(mod => {
        mod.addVertexMain(this)
    });

this.$(`
    vec4 worldPosition = worldMatrix * vec4(a_Position, 1.0);
    v_PerFragment.worldPosition = worldPosition.xyz;
    gl_Position = u_Globals.viewProjection * worldPosition;
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
            this.$("#version 300 es");
            this.$("#define UNIFORM uniform");
            this.$(`
                #define FLOAT float
                #define VEC2 vec2
                #define VEC3 vec3
                #define VEC4 vec4
                #define MAT4 mat4
                #define COLOR3 lowp vec3
                #define COLOR4 lowp vec4
            `);

            if (this.stage == ShaderStage.VERTEX)
            {
                this.$("#define ATTRIBUTE in");
                this.$("#define VARYING out");
            }
            else
            {
                this.$("#define VARYING in");
                this.$("#define FRAG_OUT out");
            }
        }
        else
        {
            /* TODO WEBGL1
            */
        }
        this.$("precision highp float;")

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
    

    create(gpu)
    {
        return gpu.createShader(this.text, this.stage);
    }
}