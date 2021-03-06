import { DefaultAttributes } from "../buff/attribute.js";
import { RasterProgram } from "../buff/program.js";
import { Asset, AssetManager } from "./assets.js";

export class ProgramAsset extends Asset
{
    constructor(manager)
    {
        super(manager);
    }

    setProgram(program)
    {
        this.program = program;
        this.isLoaded = true;
        this.isOnGPU = true;
        this.promise = Promise.resolve(this);
    }
}

export class ProgramManager extends AssetManager
{
    constructor(gpu)
    {
        super();
        this.gpu = gpu;
    }

    fromMods(...mods)
    {
        mods = mods.flat();
        let id = mods.map(Mod => Mod.name).join(',');
        
        if (this.assets.has(id))
        {
            return this.assets.get(id);
        } 
        else
        {
            const asset = new ProgramAsset(this);
            asset.setProgram(new RasterProgram(this.gpu, DefaultAttributes, mods));
            this.assets.set(id, asset);
            return asset;
        }
    }

    fromUrl()
    {
        console.error("todo");
    }
}