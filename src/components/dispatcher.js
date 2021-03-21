import { EntityComponent } from "../game/game-context.js";

export class Dispatcher extends EntityComponent
{
    listenMap = new Map();

    addListener(action, handler)
    {
        let set = this.listenMap.get(action);

        if (!set)
        {
            set = new Set();
            this.listenMap.set(action, set);
        }

        set.add(handler);
    }

    removeListener(action, handler)
    {
        this.listenMap.get(action).delete(handler);
    }

    dispatch(action, ...args)
    {
        let set = this.listenMap.get(action);
        if (set)
        {
            for (let handler of set)
            {
                handler(...args);
            } 
        }
    }
}