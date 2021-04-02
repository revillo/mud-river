/**
 * @class
 */
export class Entity
{
    _context = null;
    components = new Map();

    constructor(context)
    {
        this._context = context;
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

    /**
     * @template T
     * @param {new T} Component 
     * @returns {T}
     */
    get(Component)
    {
        return this.components.get(Component);
    }

    /**
     * 
     * @param  {...any} Components 
     * @return {boolean} - Whether the entity has this component or tag
     */
    has(...Components)
    {        
        for (let C of Components)
        {
            let has = C.prototype ? (this.components.has(C)) : this._context.has(this, C);
            if (!has) return false;
        }
        return true;
    }

    each(callback)
    {
        for (let [C, instance] of this.components)
        {
            callback(C, this.components.get(C, instance))
        }
    }

    ensure(...Components)
    {
        for (let C of Components)
        {
            if (!this.has(C))
            {
                this.add(C);
            }
        }
    }

    add(Component)
    {
        this._context.add(this, Component);
    }

    remove(...Components)
    {
        this._context.remove(this, ...Components);
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

        /**
         * @type {Map<any, Set<Entity>>}
         */
        this.sets = new Map();
        this.discarded = [];
        this.size = 0;
    }

    addNewType(Component)
    {
        this.sets.set(Component, new Set());
    }

    has(entity, Component)
    {
        const set = this.sets.get(Component);
        return Boolean(set && set.has(entity)) 
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
        }
    }

    add(entity, Component)
    {
        this.ensure(Component);
        this.sets.get(Component).add(entity);
        this._add(entity, Component);
    }

    remove(entity, ...Components)
    {
        for (let Component of Components)
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
    }

    create(...Components)
    {
        this.ensure(...Components);
        let entity = /*this.discarded.pop() ||*/ new this.EntityType(this);
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
        entity._destroyComponents();
        for (let C of entity.components.keys())
        {
            sets.get(C).delete(entity);
        }
        entity.components.clear();
        //this.discarded.push(entity);
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
                
                let destroy = Boolean(C.prototype.destroy);
            
                if (destroy)
                {
                    for (let entity of set)
                    {
                        entity.get(C).destroy();
                        entity.components.delete(C);
                    }
                }
                else
                {
                    for (let entity of set)
                    {
                        entity.components.delete(C);
                    } 
                }

            }
           
            set.clear();
            
        }
    }

    with(...Components)
    {
        //todo exclude first type

        let notFirst = new Array(Components.length - 1);

        return function(callback)
        {
            let smallest = this.size + 1;
            let firstSet = null;
            let firstComp = null;

            for (let C of Components)
            {
                let set = this.sets.get(C);
                if (!set) return;

                if (set.size < smallest)
                {
                    smallest = set.size;
                    firstSet = set;
                    firstComp = C;
                }
            }

            let notFirst = Components.filter(C => C != firstComp);

            for (let entity of firstSet)
            {
                if (entity.has(...notFirst))
                {
                    if(callback(entity) === false) return;
                }
            }
            
        }.bind(this);
    }
}