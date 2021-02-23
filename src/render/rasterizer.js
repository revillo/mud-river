//import { GPUContextGL } from "./gpu.js";

/**
 * @class Rasterizer
 * */
export class Rasterizer
{
    /**
     * 
     * @param {GPUContextGL} canvas 
     */
    constructor(gpu)
    {
        this.canvas = gpu.canvas;
        this.gpu = gpu;
        
        if (gpu.getErrorTag())
        {
            console.error("Failed to initialize rasterizer");
        }
    }

    rasterizeScene(scene)
    {
        const gpu = this.gpu;

        scene.renderBins.forEach(function(renderBin) {
            gpu.bindProgram(renderBin.program);

            if (renderBin.bindUniforms){
                renderBin.bindUniforms(gpu);
            }

            renderBin.meshes.forEach(function(mesh)
            {
                if (mesh.bindUniforms) {
                    mesh.bindUniforms(gpu);
                }

                gpu.rasterizeMesh(mesh.binding);
            });
        });

        gpu.bindProgram(null);
    }

    clear(clearColor)
    {
        this.gpu.clear(clearColor);
        this.gpu.setViewport(0, 0, this.canvas.width, this.canvas.height);
    }

    rasterizeScenes(scenes)
    {
        const thiz = this;


        scenes.forEach(function(scene) {
            thiz.rasterizeScene(scene);
        });
    }
}
