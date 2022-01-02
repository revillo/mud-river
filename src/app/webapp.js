import { Timer } from "../util/timer.js";
import { App } from "./app.js";


export class WebApp extends App
{
    constructor(title, version)
    {
        super(title, version);
        document.title = title;

        this.timer = new Timer();
                  
        this.mainCanvas = document.createElement("canvas");
        document.body.appendChild(this.mainCanvas);
        this.mainCanvas.style.zIndex = "-1";
        this.mainCanvas.style.position = "fixed";
        this.mainCanvas.style.top = 0;
        this.mainCanvas.style.left = 0;
        this.mainCanvas.style.width = "100%"
        this.mainCanvas.style.height = "100%"

        
        this._addEvents(['load', 'resize', 'mousewheel', 'mouseup', 'mousedown', 'mousemove', 'keydown', 'keyup', 'blur']);
        this.gameClock = 0;
        this.domLoaded = false;

        this.startRequest = false;

        if (document.readyState === "complete")
        {
            this.domLoaded = true;
        }

        window.app = this;
      
        this.on_resize();
    }

    ready(startFn)
    {
        let self = this;
        this.load().then(() => {
            startFn(); 
            self.start();
        });
    }

    load()
    {
        return Promise.all([this.loadPhysics(), this.loadDom()]);
    }

    loadDom()
    {
        let self = this;
        return new Promise((resolve) => {
            if (self.domLoaded) {
                resolve()
            }
            else {
                self.onDomLoad = resolve;
            }
        });
    }

    loadPhysics()
    {
        return new Promise((resolve) => {
            if (window.RAPIER) {
                resolve()
            }
            else {
                window.addEventListener("RAPIER", resolve);
            }
        });
    }

    _addEvents(eventList)
    {
        let self = this;
        eventList.forEach(name => {
            const methodName = `on_${name}`;
            window.addEventListener(name, (e) => self.dispatch(methodName, e));    
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
        let self = this;
        this.load().then(() => {
            self.timer.tick();
            self.frame();
        });
    }

    on_resize()
    {
        this.mainCanvas.width = window.innerWidth;
        this.mainCanvas.height = window.innerHeight;
    }

    on_load()
    {     
        this.domLoaded = true;
        if (this.onDomLoad) {
            this.onDomLoad();
        }
    }
}