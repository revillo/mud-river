import { vec3 } from "../../math/index.js";

const DefaultBindings =
{
    mousedown : (event) => new Event('Use', {x : event.screenX, y: event.screenY}),
    mouseup : (event) => new Event('Use Release', {x : event.screenX, y: event.screenY}),
    mousemove : (event) => new Event('Aim', {dx : event.movementX, dy: event.movementY, x : event.screenX, y : event.screenY}),
    keys : 
    {
        w: "Forward",
        a : "Left",
        s : "Backward",
        d : "Right",
       " ": "Jump" 
    }
}

export class InputLayer
{
    constructor(eventManager, bindings = DefaultBindings)
    {
        this.bindings = bindings;
        this.buttonTracker = new Set();
        this.eventManager = eventManager;
    }

    isPressed(action)
    {
        return this.buttonTracker.has(action);
    }

    setBindings(bindings)
    {
        this.bindings = bindings;
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

    on_mousedown(e)
    {
        this.dispatchEvent(this.bindings.mousedown(e));
        return true;
    }

    on_mouseup(e)
    {
        this.dispatchEvent(this.bindings.mouseup(e));
        return true;
    }

    on_mousemove(e)
    {
        this.dispatchEvent(this.bindings.mousemove(e));
        return true;
    }
    
    on_keydown(e)
    {
        //this.dispatch(this.bindings.keydown(e));

        const action = this.bindings.keys[e.key];

        if (action)
        {
            this.buttonTracker.add(action);
            this.dispatchEvent(new Event("Press " + action));
        }
        //this.keyTracker[e.key] = 1;
        return true;
    }

    on_keyup(e)
    {
        const action = this.bindings.keys[e.key];
        if (action)
        {
            this.buttonTracker.delete(action);
            this.dispatchEvent(new Event("Release " + action));
        }
        //this.dispatch(this.bindings.keyup(e));
        //this.keyTracker[e.key] = 0;
        return true;
    }

}