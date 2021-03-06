import { GLTFManager } from "../assets/gltf.js";
import { ProgramManager } from "../assets/program.js";
import { TextureManager } from "../assets/texture.js";
import { BufferManager } from "../buff/buffer.js";
import { GPUContext } from "../buff/gpu.js";
//import { Rasterizer } from "../buff/rasterizer.js";
import { EntityPool, GameEntity } from "../ecso/ecso.js";

export class EventManager
{
    constructor()
    {
        this.eventTarget = new EventTarget();
    }

    addListener(name, listener)
    {
        this.eventTarget.addEventListener(name, listener);
    }

    removeListener(name, listener)
    {
        this.eventTarget.removeEventListener(name, listener);
    }

    dispatchEvent(event)
    {
        this.eventTarget.dispatchEvent(event);
    }

    dispatch(eventName, data)
    {
        this.eventTarget.dispatchEvent(new Event(eventName, data));
    }
}

export class GameContext extends EntityPool
{
    constructor(canvas)
    {
        super(GameEntity);

        this.eventManager = new EventManager;
        this.canvas = canvas;

        if (this.canvas)
        {
            this.gpu = new GPUContext(canvas);
            //this.renderer = new Rasterizer(this.gpu);
            this.bufferManager = new BufferManager(this.gpu);
            this.textureManager = new TextureManager(this.bufferManager);
            this.gltfManager = new GLTFManager(this.bufferManager, this.textureManager);
            this.programManager = new ProgramManager(this.gpu);
        }

        this.updaters = new Map();
    }

    addNewType(Component)
    {
        super.addNewType(Component);

        if (Component.prototype.update)
        {
            this.updaters.set(Component, this.with(Component));
        }

        const inputManager = this.inputManager;

        if (Component.inputAware)
        {
            Component.prototype.isPressed = function(action)
            {
                return inputManager.isPressed(action);
            }
        }
    }

    set renderer(r)
    {
        this._renderer = r;
    }

    update(dt, clock)
    {
        for (let [Type, view] of this.updaters)
        {
            view(e => {
                e.get(Type).update(dt, clock);
            });
        }

        if (this._renderer)
        {
            this._renderer.render();
        }
    }
}