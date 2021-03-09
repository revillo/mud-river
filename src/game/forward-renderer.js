import { ShaderValueType } from "../buff/gpu-types.js";
import { ModelRender, PrimRender } from "../components/model-render.js";
import { mat4 } from "../math/index.js";

export class ForwardRenderer
{
    constructor(gameContext)
    {
        this.gpu = gameContext.gpu;
        this.canvas = this.gpu.canvas;
        this.aspect = this.canvas.width / this.canvas.height;
        this.clearColor = {r: 0.3, g: 0.3, b: 0.3, a: 1}

        this.globalsBuffer = gameContext.bufferManager.allocUniformBlockBuffer("Globals", 1, {
            viewProjection : ShaderValueType.MAT4
        });

        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();

        this.globalBlock = this.globalsBuffer.getBlock(0);
        
        mat4.identity(this.globalBlock.viewProjection);

        this.renderView = gameContext.with(PrimRender);

        gameContext.renderer = this;
    }

    bindGlobals(program)
    {
        this.globalBlock.bind(program);
    }

    render()
    { 
        this.aspect = this.canvas.width / this.canvas.height;
        this.gpu.clear(this.clearColor);
        this.gpu.setViewport(0, 0, this.canvas.width, this.canvas.height);

        mat4.perspective(this.projectionMatrix, this.mainCamera.fovY, this.aspect, 0.1, 100);
        
        this.mainCamera.getViewMatrix(this.viewMatrix);
        
        mat4.multiply(this.globalBlock.viewProjection, this.projectionMatrix, this.viewMatrix);

        this.renderView(entity => {
            entity.get(PrimRender).render(this);
        })
    }
    
}