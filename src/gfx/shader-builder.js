import {ShaderStage, BinType} from "./gpu-types.js"

/**
 * @class
 */
export class RasterShaderBuilder
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
        
        this.textures =
        [
             
        ]

        this.uniformBlocks = 
        {
            Globals : [
                ['viewProjection', BinType.MAT4] 
            ],

            Locals : [
                ['model', BinType.MAT4]
            ]
        }

        this.vertexAttributes = 
        [
            ['position', BinType.VEC3]
        ]

        this.instanceAttributes = [];

        this.varyingBlocks =
        {
            PerFragment: [
                ['worldPosition', BinType.VEC3]
            ]
        };

        this.fragmentMain = [
            "    lowp vec4 finalColor = vec4(mod(v_PerFragment.worldPosition, vec3(1.0)), 1.0);"
        ];

        this.vertexMain = [
            "    mat4 worldMatrix = u_Locals.model;"
        ];

        this.fragmentFunctions = [];

        this.vertexFunctions = [];

        this.defines = 
        [
            ['TEXTURE2D' , "sampler2D"]
        ]

    }

    addModule(module)
    {
        this.modules.push(module);
    }

    $(str)
    {
        this.lines.push(str);
    }


    _writeBlocks(blocks, typeName, prefix)
    {
        for (let blockName in blocks)
        {
            this.$(`\nstruct  ${blockName}  {`);
            const block = blocks[blockName];

            for (let prop of block)
            {
                this.$(`${prop[1].glsl}  ${prop[0]};`);
            }

            this.$(`};\n${typeName}  ${blockName}  ${prefix}${blockName};\n`);
        }
    }
    
    _writeTextures()
    {
        for (let tex of this.textures)
        {
            this.$(`UNIFORM ${tex[1].id} t_${tex[0]};`)
        }
    }

    _writeUniforms()
    {
        this._writeBlocks(this.uniformBlocks, "UNIFORM", "u_");
    }

    _writeVaryings()
    {
        this._writeBlocks(this.varyingBlocks, "VARYING", "v_");
    }

    _writeAttributes()
    {        
        for (let prop of this.vertexAttributes)
        {
            this.$(`ATTRIBUTE ${prop[1].glsl} a_${prop[0]};`)
        }

        for (let prop of this.instanceAttributes)
        {
            this.$(`ATTRIBUTE ${prop[1].glsl} a_${prop[0]};`)
        }
    }

    _writeDefines()
    {
        for (let prop of this.defines)
        {
            this.$(`#define ${prop[0]} ${prop[1]}`)
        }
    }

    _buildVert()
    {
        this._writeAttributes();

        this.lines.push(...this.vertexFunctions);

        this.$(`
void main()
{
    `);

        this.lines.push(...this.vertexMain);

        this.$(`
    vec4 worldPosition = worldMatrix * vec4(a_position, 1.0);
    v_PerFragment.worldPosition = worldPosition.xyz;
    gl_Position = u_Globals.viewProjection * worldPosition;
}`);

    }

    _buildFrag()
    {
        this._writeTextures();

        if (this.platform.glVersion == 2)
        {
            this.$("FRAG_OUT vec4 outColor;");
        }

        this.lines.push(...this.fragmentFunctions);

        this.$(`\nvoid main(){\n`);

        this.lines.push(...this.fragmentMain);

        if (this.platform.glVersion == 2)
        {
            this.$(`outColor = finalColor;\n}`);
        }
        else
        {
            this.$(`gl_FragColor = finalColor;\n}`);
        }
    }

    build()
    {
        var dependencies = [];

        //Gather all dependencies recursively
        this.modules.forEach((mod) => {
            dependencies.push(...mod.getDependencies());
        });

        this.modules.push(...dependencies);

        //Remove duplicates
        this.modules = [...new Set(this.modules)];

        //Sort by rank
        this.modules.sort((a, b) => a.getRank() - b.getRank());

        //Finally apply
        this.modules.forEach((mod) => {
            mod.apply(this);
        });

        this.lines = [];

        if (this.platform.glVersion == 2)
        {
            this.$("#version 300 es");
            this.$("#define UNIFORM uniform");
            this.$("#define SAMPLE_2D texture");

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

        this._writeDefines();
        this._writeUniforms();
        this._writeVaryings();

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