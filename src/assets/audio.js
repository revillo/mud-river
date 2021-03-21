import { Asset, AssetManager } from "./assets.js";

export class AudioAsset extends Asset
{
    constructor(manager)
    {
        super(manager);
    }

    getSource(audioContext)
    {
        if (!this.source)
        {
            this.source = audioContext.createMediaElementSource(this.audio);
        }

        return this.source;
    }


    loadFromUrl(url)
    {
        var thiz = this;
        this.audio = document.createElement("Audio");

        this.promise = new Promise((resolve, reject) => {
            
            thiz.audio.oncanplay = () => {
                thiz.isLoaded = true;
                resolve(thiz);
            }

            thiz.audio.onerror = (e) => {
                thiz.error = true;
                console.error(e);
                reject(e);
            }

            this.audio.src = url;
        });
    }

}

export class AudioManager extends AssetManager
{
    constructor()
    {
        super();

    }

    newAsset()
    {
        return new AudioAsset(this);
    }

    playSpatialAsset(audioAsset, volume = 1, loop = false)
    {

        if (!this.audioContext)
        {
            this.audioContext = new AudioContext();
        }

        if (this.audioContext.state == "suspended")
        {
            this.audioContext.resume();
            return;
        }

        //if (audioAsset.isLoaded)
        {
            //audioAsset.audio.play();
            //console.log("playin");
            let source = audioAsset.getSource(this.audioContext);
            source.connect(this.audioContext.destination);
            audioAsset.audio.play();
            //source.play();

        }
    }



    setListenerPosition()
    {

    }
}

