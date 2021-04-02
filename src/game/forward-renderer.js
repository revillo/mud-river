import { BinType } from "../buff/gpu-types.js";
import { GPUContext } from "../buff/gpu.js";
import { ModelRender, PrimRender, Rig } from "../components/model-render.js";
import { Transform } from "../components/transform.js";
import { mat4 } from "../glm/index.js";
import { Quaternion, Vector3 } from "../math/index.js";
import { Collision } from "./collision.js";

const tempVec3 = new Vector3;
const tempQuat = new Quaternion;

let defaultGlobals = [
    ['viewProjection', BinType.MAT4]
]

export class ForwardRenderer
{
    /**
     * @type {Camera}
     */
    _mainCamera = null
    clearColor =  {r: 0.3, g: 0.3, b: 0.3, a: 1}


    /**
     * 
     * @param {GameContext} gameContext 
     * @param {BinSchema} globals 
     */
    constructor(gameContext, globals = defaultGlobals)
    {
        /**
         * @type {GPUContext}
         */
        this.gpu = gameContext.gpu;
        this.canvas = this.gpu.canvas;
        this.aspect = this.canvas.width / this.canvas.height;

        this.globalsBuffer = gameContext.bufferManager.allocUniformBlockBuffer("Globals", 1, globals);

        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();

        this.globalBlock = this.globalsBuffer.getBlock(0);
        
        mat4.identity(this.globalBlock.viewProjection);

        this.renderView = gameContext.with(PrimRender);

        this.cullWorld = gameContext.cullWorld;
        gameContext.renderer = this;

        this.context = gameContext;
        const P = gameContext.PHYSICS;
        this.interactionGroups = Collision.getCollisionGroups([Collision.GAZE],[Collision.CULL]);

        this.regionsToRender = [];
        this.regionsToRender.length = 10000;
        this.firstPrim = true;
    }

    bindGlobals(program)
    {
        this.globalBlock.bind(program);
    }

    renderPrim(primComponent)
    {
        const prim = primComponent.prim;

        const program = prim.program;
        if(program.use() || this.firstPrim)
        {
            this.bindGlobals(program);        
            this.firstPrim = false;
        }

        if (primComponent.entity.parent.has(Rig))
        {
            primComponent.entity.parent.get(Rig).bind(program);
        }

        prim.material && prim.material.bindTextures(program);
        prim.locals.bind(program);
        this.gpu.rasterizeMesh(prim.binding, prim.instanceConfig.instanceCount);
        prim.material && prim.material.unbindTextures(program);
    }

    /**
     * @param {Camera} cam
     */
    set mainCamera(cam)
    {
        this._mainCamera = cam;
        this.computeFrustumShape();
    }

    computeFrustumShape()
    {
        const fovY = this._mainCamera.fovY;
        const near = this._mainCamera.near;
        const far = this._mainCamera.far;

        let verts = this.frustumVerts || new Float32Array(3 * 8);
        let tanY = Math.tan(fovY/2);
        let tanX = Math.tan(fovY * this.aspect/2);

        this._mainCamera._tanX = tanX;
        this._mainCamera._tanY = tanY;

        let x0 = tanX * near;
        let x1 = tanX * far;
        let y0 = tanY * near;
        let y1 = tanY * far;

        verts[0] = -x0;
        verts[1] = -y0;
        verts[2] = -near;

        verts[3] = x0;
        verts[4] = -y0;
        verts[5] = -near;

        verts[6] = x0;
        verts[7] = y0;
        verts[8] = -near;

        verts[9] = -x1;
        verts[10] = y1;
        verts[11] = -near;

        verts[12] = -x1;
        verts[13] = -y1;
        verts[14] = -far;

        verts[15] = x1;
        verts[16] = -y1;
        verts[17] = -far;

        verts[18] = x1;
        verts[19] = y1;
        verts[20] = -far;

        verts[21] = -x1;
        verts[22] = y1;
        verts[23] = -far;

        this.frustumVerts = verts;
        this.frustumShape = new this.context.PHYSICS.ConvexPolyhedron(verts);
    }

    preRender()
    {
        this.gpu.clear(this.clearColor);
    }

    postRender()
    {

    }

    renderCullWorld()
    {
        this.context.frameTimers.start("cull");
        const thiz = this;

        this.cullWorld.step();

        let i = 0;

        if (this.cullWorld.colliders.len() > 0)
        {
            this.cullWorld.intersectionsWithShape(
                this.cullWorld.colliders, 
                tempVec3, tempQuat, this.frustumShape, 
                this.interactionGroups, 
                (handle) => {
                  
                    this.regionsToRender[i] = thiz.context.cullMap.get(handle);
                    i+=1;
                    return true;
                });
            
        }
        
        this.context.frameTimers.stop("cull");


        this.context.frameTimers.start("prim");
        this.firstPrim = true;

        let numRendered = 0;
        for (var p = 0; p < i; p++)
        {
            let region = this.regionsToRender[p];
            if (region.cullFunction(this._mainCamera))
            {            
                numRendered += 1;
                region.primRenders.forEach(primC => thiz.renderPrim(primC));
            }
        }    
        
        //console.log(numRendered);

        this.context.frameTimers.stop("prim");
    }

    render()
    { 
        if (!this._mainCamera)
        {
            return;
        }

        this.gpu.setViewport(0, 0, this.canvas.width, this.canvas.height);

        let newAspect = this.canvas.width / this.canvas.height;

        if (newAspect != this.aspect)
        {
            this.aspect = newAspect;
            this.computeFrustumShape();
        }


        mat4.perspective(this.projectionMatrix, this._mainCamera.fovY, this.aspect, this._mainCamera.near, this._mainCamera.far);
        
        const camTrans = this._mainCamera.get(Transform).worldMatrix;
        camTrans.decompose(tempVec3, tempQuat)

        this._mainCamera.getViewMatrix(this.viewMatrix);
        
        mat4.multiply(this.globalBlock.viewProjection, this.projectionMatrix, this.viewMatrix);


        this.preRender();
       
        this.renderCullWorld();
    
        //this.context.frameTimers.start("prim");
        //this.renderView((e) => thiz.renderPrim(e.get(PrimRender)));
        //this.context.frameTimers.stop("prim");

        this.postRender();
        
    }
    
}