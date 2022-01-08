/**
 * @class
 */
export class Entity
{
    /**
     * @type {EntityPool}
     */
    _context = null;
    components = new Map();

    constructor(context)
    {
        this._context = context;
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
            if (!this.components.has(C)) return false;
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
                this.attach(C);
            }
        }
    }

    attach(...Components)
    {
        this._context.attach(this, ...Components);
    }

    detach(...Components)
    {
        this._context.detach(this, ...Components);
    }

    destroy()
    {
        this._context.destroy(this);
    }

    get context()
    {
        return this._context;
    }

    /**
     * @deprecated
     */
    remove(...Components)
    {
        this.detach(...Components);
    }

    /**
     * @deprecated 
     */
    add(Component)
    {
        this.attach(Component);
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
        return (set != undefined) && set.has(entity);
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

    // _add(entity, C)
    // {
    //     this.sets.get(C).add(entity);
    //     if (C.prototype)
    //     {
    //         entity.components.set(C, new C());
    //     }
    // }

    _onAttach(entity, componentInstance)
    {
        componentInstance.onAttach && componentInstance.onAttach(entity);
    }

    attach(entity, ...Components)
    {
        this.ensure(...Components);
        for (let C of Components) {
            this.sets.get(C).add(entity);
            if (C.prototype)
            {
                let c = new C();
                entity.components.set(C, c);
                this._onAttach(entity, c);
            } 
            else 
            {
                entity.components.set(C, C);
            }
        }
    }

    /**
     *@deprecated 
     */
    remove(entity, ...Components) {
        this.detach(entity, ...Components);
    }

    detach(entity, ...Components)
    {
        for (let Component of Components)
        {    
            let c = entity.get(Component);
            c && c.onDetach && c.onDetach();
            entity.components.delete(Component);
            const set = this.sets.get(Component);
            set && set.delete(entity);
        }
    }

    create(...Components)
    {
        const entity = /*this.discarded.pop() ||*/ new this.EntityType(this);
        //this.attach(entity, ...Components);
        entity.ensure(...Components);
        this.size++;
        return entity;
    }

    /**
     * @deprecated 
     */
    free(entity)
    {
        this.destroy(entity);
    }

    /**
     * 
     * @param {Entity} entity 
     */
    destroy(entity) 
    {
        const sets = this.sets;
        for (let C of entity.components.keys())
        {
            let c = entity.get(C);
            c && c.onDetach && c.onDetach();
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
                
                let destroy = Boolean(C.prototype.onDetach);
            
                if (destroy)
                {
                    for (let entity of set)
                    {
                        entity.get(C).onDetach();
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