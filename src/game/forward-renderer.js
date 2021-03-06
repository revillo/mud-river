import { ShaderValueType } from "../buff/gpu-types.js";
import { Camera } from "../components/camera.js";
import { ModelRender } from "../components/model-render.js";
import { Transform } from "../components/transform.js";
import { mat4 } from "../math/index.js";

export class ForwardRenderer
{
    constructor(gameContext)
    {
        this.gpu = gameContext.gpu;
        this.canvas = this.gpu.canvas;
        this.aspect = this.canvas.width / this.canvas.height;
        this.clearColor = {r: 0, g: 0, b: 0, a: 1}

        this.globalsBuffer = gameContext.bufferManager.allocUniformBlockBuffer("Globals", 1, {
            viewProjection : ShaderValueType.MAT4
        });

        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();

        this.globalBlock = this.globalsBuffer.getBlock(0);
        
        mat4.identity(this.globalBlock.viewProjection);

        this.renderView = gameContext.with(ModelRender);
    }

    set mainCameraEntity (entity)
    {
        this._mainCameraEntity = entity;
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

        let camera = this._mainCameraEntity.get(Camera);
        let camTrans = this._mainCameraEntity.get(Transform);
        camTrans.updateLocal();

        mat4.perspective(this.projectionMatrix, camera.fovY, this.aspect, 0.1, 100);
        
        mat4.invert(this.viewMatrix, camTrans.localMatrix);
        
        mat4.multiply(this.globalBlock.viewProjection, this.projectionMatrix, this.viewMatrix);

        this.renderView(entity => {
            entity.get(ModelRender).render(this);
        })
    }
    
}