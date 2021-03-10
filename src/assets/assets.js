export class Lifetime
{
    constructor()
    {
        var thiz = this;

        this._promise = new Promise((res, rej) => {
            thiz.end = rej;
        }).catch(() => {});
    }

    get promise()
    {
        return this._promise;
    }
}

export class Asset
{
    constructor(manager)
    {
        this.manager = manager;
        this.isLoaded = false;
        this.error = false;
        this.isOnGPU = false;
    }

    safePromise(lifetime)
    {
        return Promise.race([this.promise, lifetime.promise]);
    }

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

    /**
     * 
     * @param {*} index - get asset associated with index or name 
     */
    get(index)
    {
        return this.assets[index];
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
        this.assets = new Map();
    }

    fromUrl(url)
    {
        const assets = this.assets;

        if (assets.has(url))
        {
            return assets.get(url);
        }

        var asset = this.newAsset();
        assets.set(url, asset);
        asset.loadFromUrl(url);

        return asset;
    }
    
    loadBatch(batch)
    {
        return new BatchLoad(this, batch);
    }
}

