import { DefaultAttributes } from "./attribute.js";
import { ShaderStage } from "./gpu-types.js";
import { RasterShaderBuilder } from "./shader-builder.js";

export class RasterProgram
{
    constructor (gpu, attributes = DefaultAttributes, shaderMods = [])
    {
        let vertBuilder = new RasterShaderBuilder(gpu.platform, ShaderStage.VERTEX, shaderMods);
        let fragBuilder = new RasterShaderBuilder(gpu.platform, ShaderStage.FRAGMENT, shaderMods);
        
        //console.log(vertBuilder.text);
        //console.log(fragBuilder.text);

        const vertShader = gpu.createShader(vertBuilder.text, vertBuilder.stage);
        const fragShader = gpu.createShader(fragBuilder.text, fragBuilder.stage);
    
        this.uniformBlocks = fragBuilder.uniformBlocks;
        this.vertexAttributes = fragBuilder.vertexAttributes;
        this.instanceAttributes = fragBuilder.instanceAttributes;
        
        this.gpuProgram = gpu.createProgram(vertShader, fragShader, attributes);
        this.gpu = gpu;
    }

    use()
    {
        this.gpu.bindProgram(this.gpuProgram);
    }
}
