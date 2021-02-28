import { merge } from "../../util/fuse.js";

export class ShaderMod
{
    constructor (mod)
    {
        this.mod = mod;
    }

    apply(builder)
    {
        merge(builder, this.mod);
    }
}