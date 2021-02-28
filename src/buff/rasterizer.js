//import { GPUContextGL } from "./gpu.js";

/**
 * @class
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
            renderBin.program.use();

            if (renderBin.bindBuffers) {
                renderBin.bindBuffers(gpu);
            }

            renderBin.meshes.forEach(function(mesh)
            {
                if (mesh.bindBuffers) {
                    mesh.bindBuffers(gpu, renderBin);
                }

                gpu.rasterizeMesh(mesh.binding, mesh.numInstances);
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
