export class App
{
    constructor(title, version)
    {
        this.title = title;
        this.version = version;
        this.layers = [];
    }

    addLayer(appLayer, priority)
    {
        this.layers.push({appLayer, priority});
        this.sortLayers();
        if (appLayer.on_added)
            appLayer.on_added(this, priority);
    }

    removeLayer(appLayer)
    {
        this.layers = this.layers.filter(layer => layer.appLayer == appLayer);
        if (appLayer.on_removed)
            appLayer.on_removed();
    }

    sortLayers()
    {
        this.layers.sort((a,b) => a.priority - b.priority);
    }

    dispatch(fnName, event)
    {   
        if (this[fnName])
        {
            this[fnName](event);
        }

        this.layers.forEach(layerBundle => {

            let layer = layerBundle.appLayer;
            //console.log(fnName, layer[fnName]);

            if(layer[fnName] && layer[fnName](event))
            {
                return;
            }
        })
    }

}