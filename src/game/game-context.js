import { AudioManager } from "../assets/audio.js";
import { GLTFManager } from "../assets/gltf.js";
import { ProgramManager } from "../assets/program.js";
import { TextureManager } from "../assets/texture.js";
import { BufferManager } from "../buff/buffer.js";
import { GPUContext } from "../buff/gpu.js";
//import { Rasterizer } from "../buff/rasterizer.js";
import { EntityPool } from "../ecso/ecso.js";
import { FrameMetrics } from "../util/timer.js";
import { GameEntity } from "./game-entity.js";
export * from "./game-entity.js"

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

/**
 * @class
 * @extends {EntityPool}
 */
export class GameContext extends EntityPool
{
    constructor(canvas, gravity)
    {
        super(GameEntity);
        this.root = this.create();
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
            this.audioManager = new AudioManager();
        }

        this.initPhysics(gravity);
        
        this.updaters = new Map();
        this.updateSystems = [];
        this.shiftSystems = [];


        
        this.views = {
            static_moved : this.with('static', 'moved')
        }

        window.context = this;

        this.frameTimers = new FrameMetrics();
    }

    initPhysics(gravity)
    {
        const PHYSICS = window.RAPIER;
        this.PHYSICS = PHYSICS;
        gravity = gravity || new PHYSICS.Vector3(0.0, -9.81, 0.0);
        this.physicsWorld = new PHYSICS.World(gravity);
        this.cullWorld = new PHYSICS.World(gravity);     
        this.cullMap = new Map();
        
        /**
         * @type {Map<number, Body>}
         */
         this.dynamicBodyMap = new Map();
        
         /**
         * @type {Map<number, GameEntity}
         */
        this.colliderMap = new Map();
    }

    addNewType(Component)
    {
        super.addNewType(Component);

        //System
        if (Component.views)
        {
            for (let name in Component.views)
            {
                Component.views[name] = this.with(...Component.views[name])
            }
        }

        if (Component.update)
        {
            this.updateSystems.push(Component);
        }

        if (Component.postShift)
        {
            this.shiftSystems.push(Component);
        }        

        if (!Component.prototype) return;

        if (Component.prototype.update)
        {
            this.updaters.set(Component, this.with(Component));
        }
    }

    set renderer(r)
    {
        this._renderer = r;
    }

    /**
     * 
     * @param  {...any} Components 
     * @return {GameEntity}
     */
    create(...Components)
    {
        let e = super.create(...Components);
        e.parent = this.root;
        return e;
    }

    shiftOrigin(v3)
    {
        for (let shiftSys of this.shiftSystems)
        {
            shiftSys.postShift(v3);
        }
    }

    update(dt, clock)
    {
        this.frameTimers.stop("nextframe");
        
        this.frameTimers.start("frame");

        this.frameTimers.start("sys")
        this.updateSystems.forEach(sys => sys.update(dt, clock, this));
        this.frameTimers.stop("sys");

        this.frameTimers.start("comp");
        for (let [Type, view] of this.updaters)
        {
            view(e => {
                e.get(Type).update(dt, clock);
            });
        }
        this.frameTimers.stop("comp");

        this.frameTimers.start("render");
        if (this._renderer)
        {
            this._renderer.render();
        }
        this.frameTimers.stop("render");

        this.clear("moved");
        this.frameTimers.stop("frame");

        
        this.frameTimers.start("nextframe");
    }

    _add(entity, C)
    {
        super._add(entity, C)
        C.prototype && (entity.get(C)._entity = entity);
    }
}