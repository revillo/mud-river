import { Asset, AssetManager } from "./assets.js";

export class TextureAsset extends Asset
{
    constructor(manager)
    {
        super(manager);
    }

    loadFromUrl(url)
    {
        var thiz = this;

        this.image = new Image;

        this.promise = new Promise((resolve, reject) => {
            thiz.image.onload = () => {
                thiz.isLoaded = true;
                thiz.loadGPU();
                resolve(thiz);
            }

            thiz.image.onerror = (e) => {
                thiz.error = true;
                reject(e);
            }

            thiz.image.src = url;
        });
    }

    loadGPU(options)
    {
        this.gpu = this.manager.bufferManager.gpu;
        this.texture = this.texture || this.gpu.createTexture2D(this.image, options);
        this.isOnGPU = true;
        return this.texture;
    }

    bind(program, name, channel = 0)
    {
        if (this.isOnGPU)
            this.gpu.bindTexture(program.gpuProgram, name, this.texture, channel);
    }

    unbind(channel)
    {
        if (this.isOnGPU)
            this.gpu.unbindTexture(this.texture, channel);
    }

    getLoadedImage()
    {
        return this.image;
    }

}

export class TextureManager extends AssetManager
{
    constructor(bufferManager)
    {
        super();
        this.bufferManager = bufferManager;
    }

    newAsset()
    {
        return new TextureAsset(this);
    }
}

