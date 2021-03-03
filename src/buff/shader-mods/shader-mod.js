import { merge } from "../../util/merge.js";

export class ShaderMod
{
    constructor (mod)
    {
        this.mod = mod;
        this.requires = this.mod.requires || [];
        delete this.mod.requires;
    }

    apply(builder)
    {
        merge(builder, this.mod);
    }

    getDependencies()
    {
        if (!this.allDependencies)
        {
            var all = [];

            this.requires.forEach((mod) =>
            {
                all.push(mod, ...mod.getDependencies())
            });

            this.allDependencies = all;
        }

        return this.allDependencies;
    }

    getRank()
    {
        if (!this.rank)
        {
            this.rank = this.requires.reduce((r,m)=>Math.max(r,m.getRank()), 0) + 1;           
        }

        return this.rank
    }
}