export class Entity
{
    constructor(context)
    {
        this._context = context;
        this.components = new Map();
    }

    _startComponents()
    {
        for (let component of this.components.values())
        {
            component.start && component.start();
        }
    }

    get(Component)
    {
        return this.components.get(Component);
    }

    has(...Components)
    {
        var res = true;
        for (let C of Components)
        {
            res &= C.prototype ? (!!this.get(C)) : this._context.has(this, C);
        }
        return res;
    }

    add(Component)
    {
        this._context.add(this, Component);
    }

    remove(Component)
    {
        this._context.remove(this, Component);
    }

    destroy()
    {
        this._context.free(this);
    }

    get context()
    {
        return this._context;
    }
}


export class GameEntity extends Entity
{
    constructor(context)
    {
        super(context);
        this._parent = null;
        this._children = new Set();
    }

    get parent()
    {
        return this._parent;
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

    eachChild(fn, recurse = false)
    {
        for (let child of this._children)
        {
            fn(child)
            recurse && child.eachChild(fn, true);
        }
    }

    on(eventName, listener)
    {
        this._inputListeners = this._inputListeners || new Map();
        this._inputListeners.set(eventName, listener);
        this.context.eventManager.addListener(eventName, listener);
    }

    destroy()
    {
        super.destroy();

        //todo destroy children, update parent

        if (this._inputListeners)
        {
            for (let [name,listener] of this._inputListeners)
            {
                this.context.eventManager.removeListener(name, listener);
            }
        }

        delete this._inputListeners;
    }
}


export class EntityPool
{
    constructor(EntityType = GameEntity)
    {
        this.EntityType = EntityType;
        this.sets = new Map();
        this.discarded = [];
        this.size = 0;
    }

    addNewType(Component)
    {
        this.sets.set(Component, new Set());

        if (Component.selfAware)
        {
            Component.prototype.my = function(Component)
            {
                return this._entity.get(Component);
            }

            Object.defineProperty(Component.prototype, "context", {
                get : function() {return this._entity.context}
            });

            Object.defineProperty(Component.prototype, "entity", {
                get : function() {return this._entity}
            });
        }        
    }

    has(entity, Component)
    {
        const set = this.sets.get(Component);
        return !!(set && set.has(entity)) 
    }

    ensure(...Components)
    {
        const sets = this.sets;
        for (let C of Components)
        {
            let cm = sets.get(C);
            if (cm === undefined)
            {
                this.addNewType(C);
            }
        }
    }

    add(entity, Component)
    {
        this.ensure(Component);
        this.sets.get(Component).add(entity);
        //todo match create
        entity.components.set(Component, Component.prototype ? new Component() : Component)
    }

    remove(entity, Component)
    {
        const set = this.sets.get(Component);
        if (set)
        {
            set.delete(entity);
        }
        entity.components.delete(Component);
    }

    create(...Components)
    {
        this.ensure(...Components);
        let entity = this.discarded.pop() || new this.EntityType(this);
        const sets = this.sets;
        for (let C of Components)
        {
            sets.get(C).add(entity);
            if (C.prototype)
            {
                entity.components.set(C, new C());
                C.selfAware && (entity.get(C)._entity = entity);
            }
        }

        entity._startComponents();

        this.size++;

        return entity;
    }

    free(entity)
    {
        //todo destroy components
        const sets = this.sets;
        for (let C of entity.components.keys())
        {
            sets.get(C).delete(entity);
        }
        entity.components.clear();
        this.discarded.push(entity);
        this.size--;
    }


    clear(...Components)
    {
        for (let C of Components)
        {
            const set = this.sets.get(C);
            if (!set) continue;

            if (C.prototype)
            {
                for (let entity of set)
                {
                    entity.components.delete(C);
                }
            }
            else
            {
                set.clear();
            }
        }
    }

    with(...Components)
    {
        //todo exclude first type
        return function(callback)
        {
            let smallest = this.size + 1;
            let firstSet = null;

            for (let C of Components)
            {
                let set = this.sets.get(C);
                if (!set) return;

                if (set.size < smallest)
                {
                    smallest = set.size;
                    firstSet = set;
                }
            }

            for (let entity of firstSet)
            {
                if (entity.has(...Components))
                {
                    if(callback(entity) === false) return;
                }
            }
            
        }.bind(this);
    }
}