export class Asset
{
    constructor(manager)
    {
        this.manager = manager;
        this.isLoaded = false;
        this.error = false;
        this.isOnGPU = false;
    }

    /*
    getGPUBinding(gpu, options)
    {
        if (!this.isLoaded)
        {
            console.error("Can't bind unloaded asset");
            return this.gpuFallback || null;
        }

        if (this.onGPU)
        {
            return this.onGPU;
        }

        this.onGPU = this.loadGPU(gpu, options);
        return this.onGPU;
    }*/

    getPromise()
    {
        return this.promise;
    }

}

class BatchLoad
{
    constructor(manager, batch)
    {
        this.batch = batch;
        this.assets = {};
        this.promises = [];

        for (let name in batch)
        {
            const asset = manager.fromUrl(batch[name].url);
            this.assets[name] = asset
            this.promises.push(asset.getPromise());
        }

        this.promise = Promise.all(this.promises);
    }

    getPromise()
    {
        return this.promise;
    }

    then(fn)
    {
        return this.promise.then(fn);
    }

    catch(fn)
    {
        return this.promise.catch(fn);
    }
}

export class AssetManager //Abstract
{
    constructor()
    {
        this.assets = {};
    }

    fromUrl(url)
    {
        const assets = this.assets;

        if (assets[url])
        {
            return assets[url];
        }

        var asset = this.newAsset();
        assets[url] = asset;
        asset.loadFromUrl(url);

        return asset;
    }
    
    loadBatch(batch)
    {
        return new BatchLoad(this, batch);
    }
}

