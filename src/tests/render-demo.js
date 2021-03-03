import { ShaderStage, BufferType, BufferUsage, ShaderValueType } from '../buff/gpu-types.js';
import { Rasterizer } from '../buff/rasterizer.js';
import { GPUContext} from '../buff/gpu.js'
import { RasterShaderBuilder} from '../buff/shader-builder.js'
import { mat4, vec3, quat, glMatrix } from '../math/index.js'
import { AttributeLayoutGenerator, DefaultAttributes } from '../buff/attribute.js';
import {UniformBlockBuffer, BufferManager} from '../buff/buffer.js'
import { RasterProgram } from '../buff/program.js';
import { TextureManager } from '../assets/texture.js';
import { ShaderUV0 } from '../buff/shader-mods/uv0.js';
import { ShaderSimpleTexture } from '../buff/shader-mods/simple-texture.js';
import { GLTFManager } from '../assets/gltf.js';
import { Timer } from '../util/timer.js';


export class RenderDemo
{

    init()
    {

    }

    constructor()
    {
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
    
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    
        const gpu = new GPUContext(canvas);
        const renderer = new Rasterizer(gpu);
        const bufferManager = new BufferManager(gpu);
        const textureManager = new TextureManager(bufferManager);
        const gltfManager = new GLTFManager(bufferManager);

        const camera = {
            projection : mat4.create(),
            view : mat4.create()
        };
    
        mat4.perspective(camera.projection, glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 100);
        mat4.lookAt(camera.view, [0,3,10], [0, 3, 0.5], [0, 1, 0]);
    
        const timer = new Timer();

  
        var frame = ()=>
        {        
            let dt = timer.tick();
            renderer.clear({r: 0, g: 0, b: 0, a: 1});
            renderer.rasterizeScenes(this.scenes);
            this.update(dt, timer.now());
            requestAnimationFrame(frame);
        }
    
        window.onresize = function()
        {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            mat4.perspective(camera.projection, glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 100);
        }
        
        this.engine = {
            gpu, renderer, bufferManager, textureManager, gltfManager
        }

        this.camera = camera;
        this.scenes = [];

        this.init(this.camera, this.scenes);

        window.onload = () => frame();
    }

    update(dt, time)
    {

    }
}
