import { GLTFManager } from "../assets/gltf.js";
import { ProgramManager } from "../assets/program.js";
import { TextureManager } from "../assets/texture.js";
import { BufferManager } from "../buff/buffer.js";
import { GPUContext } from "../buff/gpu.js";
//import { Rasterizer } from "../buff/rasterizer.js";
import { EntityPool, Entity } from "../ecso/ecso.js";

/**
 * @callback EntityCallback
 * @param {GameEntity}
 * @return {boolean} - return false to skip this entity's children 
 */

 /**
  * @class
  */
export class EntityComponent
{
    /**
     * @return {GameEntity}
     */
    get entity()
    {
        return this._entity;
    }

    /**
     * @return {GameContext}
     */
    get context()
    {
        return this._entity.context;
    }

    /**
     * @template ComponentType
     * @param {new ComponentType} ComponentType 
     * @return {ComponentType} component
     */
    get(ComponentType)
    {
        return this._entity.get(ComponentType);
    }
}


/**
 * @class
 */
export class GameEntity extends Entity
{
    constructor(context)
    {
        super(context);
        this._parent = null;
        this._children = new Set();
    }

    /**
     * @return {GameEntity}
     */
    get parent()
    {
        return this._parent;
    }

    /**
     * 
     * @param  {...any} Components 
     * @return {GameEntity}
     */
    createChild(...Components)
    {
        const e = this._context.create(...Components);
        e.parent = this;
        return e;   
    }

    set parent(entity)
    {
        if (this._parent)
        {
            this._parent._children.delete(this);
        }

        this._parent = entity;

        if (entity)
            entity._children.add(this);
    }

    /**
     * 
     * @param {EntityCallback} fn 
     * @param {boolean} recurse 
     */
    eachChild(fn, recurse = false)
    {
        for (let child of this._children)
        {
            if(fn(child) === false) continue;

            recurse && child.eachChild(fn, true);
        }
    }

    destroy()
    {
        this.parent = null;
        this.eachChild(child => child.destroy(), true);
        super.destroy();
    }
}


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
        
        this.updaters = new Map();
        this.systems = [];

        this.initPhysics();

        
        this.views = {
            static_moved : this.with('static', 'moved')
        }

        window.context = this;
    }

    initPhysics()
    {
        const PHYSICS = window.RAPIER;
        this.PHYSICS = PHYSICS;

        PHYSICS.vec3_0 = new PHYSICS.Vector3();
        PHYSICS.vec3_1 = new PHYSICS.Vector3();
        PHYSICS.vec3_2 = new PHYSICS.Vector3();

        PHYSICS.quat_0 = new PHYSICS.Quaternion();
        PHYSICS.quat_1 = new PHYSICS.Quaternion();
        PHYSICS.quat_2 = new PHYSICS.Quaternion();

        PHYSICS.ray_0 = new PHYSICS.Ray(new this.PHYSICS.Vector3(), new this.PHYSICS.Vector3());

        Object.assign(PHYSICS.Vector3.prototype, {
            set: function(x,y,z)
            {
                this.x = x;
                this.y = y;
                this.z = z;

                return this;
            },

            fromArray: function(v3)
            {
                this.x = v3[0];
                this.y = v3[1];
                this.z = v3[2];

                return this;
            }
        });

        Object.assign(PHYSICS.Quaternion.prototype, {
            set: function(x,y,z,w)
            {
                this.x = x;
                this.y = y;
                this.z = z;
                this.w = w;

                return this;
            },

            fromArray: function(q)
            {
                this.x = q[0];
                this.y = q[1];
                this.z = q[2];
                this.w = q[3];

                return this;
            }
        });

        PHYSICS.GROUP_STATIC = 0;
        PHYSICS.GROUP_DYNAMIC = 1;
        PHYSICS.GROUP_PLAYER = 2;
        PHYSICS.GROUP_CULL = 3;

        PHYSICS.getCollisionGroups = function(myGroups, interactGroups)
        {
            var result = 0;

            for (let g of myGroups)
            {
                result += (1 << g);
            }

            result = result << 16;
            
            for (let f of interactGroups)
            {
                result += (1 << f);
            }

            return result;
        }

        let gravity = new PHYSICS.Vector3(0.0, -9.81, 0.0);
        this.physicsWorld = new PHYSICS.World(gravity);
        this.cullWorld = new PHYSICS.World(gravity);     
        this.cullMap = new Map();
        this.dynamicMap = new Map();
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
            this.systems.push(Component);
        }

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
        return super.create(...Components);
    }

    update(dt, clock)
    {
        this.systems.forEach(sys => sys.update(dt, clock, this));

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

        this.clear("moved");
    }

    _add(entity, C)
    {
        super._add(entity, C)
        C.prototype && (entity.get(C)._entity = entity);
    }
}