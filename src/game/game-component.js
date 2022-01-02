import { GameContext } from "./game-context.js";
import { GameEntity } from "./game-entity.js";

/**
 * @class
 */
 export class GameComponent {
    _entity = null;

    /**
     * @return {GameEntity}
     */
    get entity() {
        return this._entity;
    }

    /**
     * @return {GameContext}
     */
    get context() {
        return this._entity.context;
    }

    /**
     * @template ComponentType
     * @param {new ComponentType} ComponentType 
     * @return {ComponentType} component
     */
    get(ComponentType) {
        return this._entity.get(ComponentType);
    }
}
