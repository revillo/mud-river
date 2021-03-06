import { Timer } from "../util/timer.js";
import { App } from "./app.js";


export class WebApp extends App
{
    constructor(title, version)
    {
        super(title, version);
        document.title = title;

        this.timer = new Timer();
        this._addEvents(['load', 'resize', 'mousewheel', 'mouseup', 'mousedown', 'mousemove', 'keydown', 'keyup']);
        this.gameClock = 0;
        this.docLoaded = false;

        this.startRequest = false;

        if (document.readyState === "complete")
        {
            //this.dispatch('on_load', {});
        }

                
        this.mainCanvas = document.createElement("canvas");
        document.body.appendChild(this.mainCanvas);

        this.on_resize();
    }

    _addEvents(eventList)
    {
        var thiz = this;

        eventList.forEach(name => {
            const methodName = `on_${name}`;
            window.addEventListener(name, (e) => thiz.dispatch(methodName, e));    
        });
    }

    frame()
    {
        let dt = this.timer.tick();
        dt = Math.clamp(dt, 0.005, 0.05);
        this.gameClock += dt;

        this.layers.forEach(layer => {
            if (layer.appLayer.on_frame)
            {
                layer.appLayer.on_frame(dt, this.gameClock);
            }
        })

        requestAnimationFrame(() => this.frame());
    }

    start()
    {
        if (this.docLoaded)
        {
            this.timer.tick();
            this.frame();
        }
        else
        {
            this.startRequest = true;
        }
    }

    on_resize()
    {
        this.mainCanvas.width = window.innerWidth;
        this.mainCanvas.height = window.innerHeight;
    }

    on_load()
    {
        this.docLoaded = true;
        if (this.startRequest)
        {
            this.start();
        }
    }
}