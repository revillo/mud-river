import {InputLayer} from "./input-layer.js"

export class GameLayer
{
    constructor(gameContext)
    {
        this.inputLayer = new InputLayer(gameContext.eventManager);
        this.context = gameContext;
        this.canvas = gameContext.canvas;
        gameContext.inputManager = this.inputLayer;
    }

    on_added(app, priority)
    {
        this.app = app;
        app.addLayer(this.inputLayer, priority + 1);
    }

    on_removed()
    {
        this.app.removeLayer(this.inputLayer);
        this.app = null;
    }

    on_frame(dt, clock)
    {
        this.context.update(dt, clock);
    }

}