import { AudioManager } from "../assets/audio.js";
import { GLTFManager } from "../assets/gltf.js";
import { ProgramManager } from "../assets/program.js";
import { TextureManager } from "../assets/texture.js";
import { BufferManager } from "../gfx/buffer.js";
import { GPUContext } from "../gfx/gpu.js";
//import { Rasterizer } from "../buff/rasterizer.js";
import { EntityPool } from "../ecso/ecso.js";
import { FrameMetrics } from "../util/timer.js";
import { GameComponent } from "./game-component.js";
import { GameEntity } from "./game-entity.js";

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
    /**
     * @type {GLTFManager}
     */
    gltfManager = null;

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
        this.autoclearTags = new Set();

        /**
         * @type {GameComponent}
         */
        this.activeController = null;

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
         this.bodyMap = new Map();
        
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

        if (Component.autoclearTags) {
            Component.autoclearTags.forEach(this.autoclearTags.add, this.autoclearTags);
        }
    }

    set renderer(r)
    {
        this._renderer = r;
    }

    get renderer()
    {
        return this._renderer;
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

    postShiftOrigin(v3)
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

        //Component updates
        this.frameTimers.start("comp");
        for (let [Type, view] of this.updaters)
        {
            view(e => {
                e.get(Type).update(dt, clock);
            });
        }
        this.frameTimers.stop("comp");

        //System updates
        this.frameTimers.start("sys")
        this.updateSystems.forEach(sys => sys.update(dt, clock, this));
        this.frameTimers.stop("sys");

        //Draw calls
        this.frameTimers.start("render");
        if (this._renderer)
        {
            this._renderer.render();
        }
        this.frameTimers.stop("render");

        //Wrap up
        for (let tag of this.autoclearTags) {
            this.clear(tag);
        }

        this.frameTimers.stop("frame");
        this.frameTimers.start("nextframe");
    }

    _onAttach(entity, c)
    {
        c._entity = entity;
        super._onAttach(entity, c);
    }
}