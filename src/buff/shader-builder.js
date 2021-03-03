import {ShaderStage, ShaderValueType} from "./gpu-types.js"

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
        {
             
        }

        this.uniformBlocks = 
        {
            Globals : {
                viewProjection : ShaderValueType.MAT4 
            },

            Locals : {
                model : ShaderValueType.MAT4
            }
        }

        this.vertexAttributes = 
        {
            position : ShaderValueType.VEC3
        }

        this.instanceAttributes = {};

        this.varyingBlocks =
        {
            PerFragment: {
                worldPosition : ShaderValueType.VEC3
            }
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
        {
            FLOAT : "float",
            VEC2 : "vec2",
            VEC3 : "vec3",
            VEC4 : "vec4",
            MAT4 : "mat4",
            COLOR3 : "lowp vec3",
            COLOR4 : "lowp vec4",
            TEXTURE2D : "sampler2D"
        }

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

            for (let propertyName in block)
            {
                let typeInfo = block[propertyName];

                this.$(`${typeInfo.id}  ${propertyName};`);
            }

            this.$(`};\n${typeName}  ${blockName}  ${prefix}${blockName};\n`);
        }
    }
    
    _writeTextures()
    {
        for (let texName in this.textures)
        {
            this.$(`UNIFORM ${this.textures[texName].id} t_${texName};`)
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
        for (let propertyName in this.vertexAttributes)
        {
            let typeInfo = this.vertexAttributes[propertyName];
            this.$(`ATTRIBUTE ${typeInfo.id} a_${propertyName};`)
        }

        for (let propertyName in this.instanceAttributes)
        {
            let typeInfo = this.instanceAttributes[propertyName];
            this.$(`ATTRIBUTE ${typeInfo.id} a_${propertyName};`)
        }
    }

    _writeDefines()
    {
        for (let propertyName in this.defines)
        {
            this.$(`#define ${propertyName} ${this.defines[propertyName]}`)
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