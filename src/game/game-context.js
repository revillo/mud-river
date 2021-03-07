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

        //todo share between contexts
        if (this.canvas)
        {
            this.gpu = new GPUContext(canvas);
            //this.renderer = new Rasterizer(this.gpu);
            this.bufferManager = new BufferManager(this.gpu);
            this.textureManager = new TextureManager(this.bufferManager);
            this.gltfManager = new GLTFManager(this.bufferManager, this.textureManager);
            this.programManager = new ProgramManager(this.gpu);
        }

        this.PHYSICS = window.RAPIER;

        this.PHYSICS.tempVec3 = new this.PHYSICS.Vector3(0.0, 0.0, 0.0);

        this.updaters = new Map();
        let gravity = new this.PHYSICS.Vector3(0.0, -9.81, 0.0);
        this.physicsWorld = new this.PHYSICS.World(gravity);         
    }

    addNewType(Component)
    {
        super.addNewType(Component);

        if (!Component.prototype) return;

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

            Object.defineProperty(Component.prototype, "inputManager", {
                get : function() {return inputManager}
            });

            
            Component.prototype.bindInput = function(action, handler)
            {
                this._inputListeners = this._inputListeners || [];
                handler = handler.bind(this);

                this._inputListeners.push({action, handler});
                inputManager.addListener(action, handler);
            }

            Component.prototype.unbindInputs = function()
            {
                for (let listener of (this._inputListeners || []))
                {
                    inputManager.removeListener(listener.action, listener.handler);
                }
            }

            Component.prototype.addInputListener = function(action, handler)
            {
                inputManager.addListener(action, handler);
            }

            Component.prototype.removeInputListener = function(action, handler)
            {
                inputManager.removeListener(action, handler);
            }
        }

        const PHYSICS = this.PHYSICS;
        const physicsWorld = this.physicsWorld;

        if (Component.physicsAware)
        {
            Object.defineProperty(Component.prototype, "PHYSICS", {
                get : function() {return PHYSICS}
            })
            
            Object.defineProperty(Component.prototype, "physicsWorld", {
                get : function() {return physicsWorld}
            })
        }
    }

    set renderer(r)
    {
        this._renderer = r;
    }

    update(dt, clock)
    {
        this.physicsWorld.timestep = dt;
        this.physicsWorld.step();

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