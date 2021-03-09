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

    _destroyComponents()
    {
        for (let component of this.components.values())
        {
            component.destroy && component.destroy();
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
            res &= C.prototype ? (this.components.has(C)) : this._context.has(this, C);
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

export class EntityPool
{
    constructor(EntityType = Entity)
    {
        this.EntityType = EntityType;
        this.sets = new Map();
        this.discarded = [];
        this.size = 0;
    }

    addNewType(Component)
    {
        this.sets.set(Component, new Set());

        //todo make this a mixin
        if (Component.selfAware)
        {
            Component.prototype.get = function(Component)
            {
                return this._entity.get(Component);
            }

            Component.prototype.ensure = function(...Components)
            {
                for (let C of Components)
                {
                    if (!this._entity.has(C))
                    {
                        this._entity.add(C);
                    }
                }
            }

            Component.prototype.has = function(Component)
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

    _add(entity, C)
    {
        this.sets.get(C).add(entity);
        if (C.prototype)
        {
            entity.components.set(C, new C());
            C.selfAware && (entity.get(C)._entity = entity);
        }
    }

    add(entity, Component)
    {
        this.ensure(Component);
        this.sets.get(Component).add(entity);
        this._add(entity, Component);
    }

    remove(entity, Component)
    {
        const set = this.sets.get(Component);
        if (set)
        {
            set.delete(entity);
        }

        let c = entity.get(Component);
        c && c.destroy && c.destroy();

        entity.components.delete(Component);
    }

    create(...Components)
    {
        this.ensure(...Components);
        let entity = this.discarded.pop() || new this.EntityType(this);
        for (let C of Components)
        {
            this._add(entity, C);
        }

        entity._startComponents();

        this.size++;

        return entity;
    }

    free(entity)
    {
        const sets = this.sets;
        for (let C of entity.components.keys())
        {
            sets.get(C).delete(entity);
        }
        entity._destroyComponents();
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