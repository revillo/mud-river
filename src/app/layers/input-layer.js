import { vec3 } from "../../glm/index.js";

const DefaultBindings =
{
    /*
    mousedown : (event) => {
        if (event.button == 0) return new Event('Use', {x : event.screenX, y: event.screenY}) 
        event.button == 0 ? 
    },

    mouseup : (event) => new Event('Use Release', {x : event.screenX, y: event.screenY}),
    */

    //mousemove : (event) => new Event('Aim', {dx : event.movementX, dy: event.movementY, x : event.screenX, y : event.screenY}),
    
    mouse_move : "Aim",

    mouse_buttons:
    {
        0 : "Use",
        2 : "Look"
    },

    mouse_wheel : "Scroll",

    keys : 
    {
        KeyW : "Forward",
        KeyA : "Left",
        KeyS : "Backward",
        KeyD : "Right",
        KeyE : "StrafeRight",
        KeyQ : "StrafeLeft",
        KeyF : "Fly",
        KeyT : "Debug",
        Space: "Jump",
        ShiftLeft : "Sprint"
    }
}

export class InputLayer
{
    constructor(context, bindings = DefaultBindings)
    {
        this.bindings = bindings;
        this.buttonTracker = new Set();
        this.gameContext = context;
        this.eventManager = context.eventManager;
        this.canvas = context.canvas;

        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    }

    isPressed(action)
    {
        return this.buttonTracker.has(action);
    }

    setBindings(bindings)
    {
        this.bindings = bindings;
    }

    setPointerLock(toggle)
    {
        const canvas = this.canvas;

        if (toggle)
        {
            canvas.requestPointerLock()
        }
        else
        {
            document.exitPointerLock();
        }
    }

    addListener(eventName, listener)
    {
        this.eventManager.addListener(eventName, listener);
    }

    removeListener(eventName, listener)
    {
        this.eventManager.removeListener(eventName, listener);
    }

    dispatchEvent(event)
    {
        this.eventManager.dispatchEvent(event);
    }

    dispatchAction(name, data)
    {
        let e = new Event(name);
        Object.assign(e, data);
        this.dispatchEvent(e);
    }

    on_mousedown(e)
    {
        const action = this.bindings.mouse_buttons[e.button]
        if (action)
        {
            this.buttonTracker.add(action);
            this.dispatchAction(action, {
                x : e.offsetX / this.canvas.width,
                y : e.offsetY / this.canvas.height,
                isPressed : true
            });

            //e.preventDefault();
        }
        return !!action;
    }

    on_mouseup(e)
    {
        const action = this.bindings.mouse_buttons[e.button]
        if (action)
        {
            this.buttonTracker.delete(action);
            this.dispatchAction(action, {
                x : e.offsetX / this.canvas.width,
                y : e.offsetY / this.canvas.height,
                isPressed : false
            });
            e.preventDefault();
        }

        return !!action;
    }

    on_mousemove(e)
    {
        const action = this.bindings.mouse_move;

        if (action)
        {
            this.dispatchAction(action, {
                dx : e.movementX / this.canvas.width,
                dy : e.movementY / this.canvas.height,
                x : e.offsetX / this.canvas.width,
                y : e.offsetY / this.canvas.height
            });
        }

        return true;
    }

    on_mousewheel(e)
    {
        const action = this.bindings.mouse_wheel;
        if (action)
        {
            this.dispatchAction(action, { 
                dx: e.wheelDeltaX,
                dy: e.wheelDeltaY
            });
        }
    }
    
    on_keydown(e)
    {
        const action = this.bindings.keys[e.code];

        if (action)
        {
            this.buttonTracker.add(action);
            this.dispatchAction(action, {
                isPressed : true
            });
        }
        return true;
    }

    on_keyup(e)
    {
        const action = this.bindings.keys[e.code];
        if (action)
        {
            this.buttonTracker.delete(action);
            this.dispatchAction(action, {
                isPressed : false
            });
        }
        return true;
    }

    on_blur()
    {
        this.buttonTracker.clear();
    }

}