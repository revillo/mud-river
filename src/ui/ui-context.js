import { Entity, EntityPool } from "../ecso/ecso.js";
import { EntityComponent, GameEntity } from "../game/game-context.js";


export class UIEntity extends GameEntity
{
    /**
     * @type {HTMLDivElement}
     */
    div = document.createElement('div');

    constructor(context)
    {
        super(context);
    }

    get parent()
    {
        return this._parent;
    }

    get class()
    {
        return this.div.className;
    }

    get id()
    {
        return this.div.id;
    }

    set id(id)
    {
        this.div.id = id;
    }

    addClass(className)
    {
        this.div.className += " " + className;
    }

    set class(className)
    {
        this.div.className = className;
    }

    get style()
    {
        return this.div.style;
    }

    set parent(parent)
    {
        if (parent)
        {
            parent.div.appendChild(this.div);
        }
        else
        {
            this.div.remove();
        }

        super.parent = parent;

        /*
        this.each((C, comp) => {
            comp.onParent && comp.onParent(parent);
        });
        */
    }

    /**
     * 
     * @param  {...any} Components 
     * @return {UIEntity}
     */
    createChild(...Components)
    {
        let e = super.createChild(...Components);
        return e;
    }
}

export class UIComponent extends EntityComponent
{
    /**
     * @return {UIEntity}
     */
    get entity()
    {
        return this._entity;
    }

    /**
     * @return {HTMLDivElement}
     */
    get div()
    {
        return this.entity.div;
    }

    insertHTML(tag)
    {
        return this.div.appendChild(document.createElement(tag));
    }
}

export class UIContext extends EntityPool
{
    constructor(domElement)
    {
        super(UIEntity);
        this.div = domElement;
        this.div.style.width = "100%";
        this.div.style.height = "100%";
    }

    _onAttach(entity, c)
    {
        c._entity = entity;
        super._onAttach(entity, c);
    }

    /**
     * @param  {...any} Components
     * @return {UIEntity} 
     */
    create(...Components)
    {
        let e = super.create(...Components);
        this.div.appendChild(e.div);
        return e;
    }
}

