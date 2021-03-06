import { Entity } from "../ecso/ecso.js";
import { GameContext } from "./game-context.js";

/**
 * @callback EntityCallback
 * @param {GameEntity}
 * @return {boolean} - return false to skip this entity's children 
 */

/**
 * @class
 */
export class GameEntity extends Entity {
    constructor(context) {
        super(context);
        this._parent = null;

        /**
         * @type {Set<GameEntity>}
         */
        this._children = new Set();
    }

    /**
     * @return {GameEntity}
     */
    get parent() {
        return this._parent;
    }

    /**
     * @param  {...any} Components 
     * @return {GameEntity}
     */
    createChild(...Components) {
        const e = this._context.create(...Components);
        e.parent = this;
        return e;
    }

    set parent(entity) {
        if (this._parent) {
            this._parent._children.delete(this);
        }

        this._parent = entity;

        if (entity)
            entity._children.add(this);
    }

    /**
     * @param {EntityCallback} fn 
     */
    eachChild(fn, ...args) {
        for (let child of this._children) {
            if (fn(child, ...args) === true) {
                child.eachChild(fn, ...args);
            }
        }
    }

    destroy() {
        this.parent = null;
        this.eachChild(child => child.destroy());
        super.destroy();
    }

    /**
     * @return {GameContext}
     */
    get context()
    {
        return this._context;
    }
}