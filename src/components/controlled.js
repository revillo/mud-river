import { GameComponent } from "../game/game-component.js";

export class Controlled extends GameComponent
{
    isPressed(action)
    {
        if (this.context.activeController != this)
            return false;

        return this.inputManager.isPressed(action);
    }

    get inputManager()
    {
        return this.context.inputManager;
    }

    activate()
    {
        if (this.context.activeController && this.context.activeController != this)
        {
            this.context.activeController.unbindInputs();
        }

        this.context.activeController = this;
    }
    
    bindInput(action, handler)
    {
        this._inputListeners = this._inputListeners || [];
        handler = handler.bind(this);
        this._inputListeners.push({action, handler});
        this.inputManager.addListener(action, handler);
    }

    unbindInputs()
    {
        for (let listener of (this._inputListeners || []))
        {
            this.inputManager.removeListener(listener.action, listener.handler);
        }

        this._inputListeners.length = 0;
    }

    onDetach()
    {
        this.unbindInputs();
    }

    /*
    Component.prototype.addInputListener = function(action, handler)
    {
        inputManager.addListener(action, handler);
    }

    Component.prototype.removeInputListener = function(action, handler)
    {
        inputManager.removeListener(action, handler);
    }*/

    getMovement(outV3)
    {
        outV3.zero();

        let moved = false;

        if (this.isPressed('Forward'))
        {
            moved = true;
            outV3[2] -= 1;
        }        

        if (this.isPressed('Backward'))
        {
            moved = true;
            outV3[2] += 1;
        }

        if (this.isPressed('Left'))
        {
            moved = true;
            outV3[0] -= 1;
        }

        if (this.isPressed('Right'))
        {
            moved = true;
            outV3[0] += 1;
        }

        if (moved)
        {
            outV3.normalize();
        }

        return moved;
    }
}
