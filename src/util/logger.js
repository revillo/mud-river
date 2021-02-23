export class Logger
{

    /**
     * 
     * @typedef {LoggerConfig}
     * @property {bool} [silence]
     * @property {array} [includes]
     * @property {array} [excludes]
     */

    /**
     *
     * @param {LoggerConfig} config 
     */
    constructor(config)
    {
        this.config = config || {};
        this.isSilenced = config.silence;

        if (config.includes)
        {
            this.includes = {};
            for (let key in config.includes)
            {
                this.includes[key] = 1;
            }
        }

        if (config.excludes)
        {
            this.excludes = {};
            for (let key in config.excludes)
            {
                this.excludes[key] = 1;
            }
        }
    }

    checkTag(tag)
    {
        var good = true;

        if (this.isSilenced)
        {
            return false;
        }

        if (this.includes)
        {
            good = (this.includes[tag]);
        }

        if (this.excludes)
        {
            good = good && (!this.excludes[tag]);
        }

        return good;
    }

    log(tag, message)
    {
        if (this.checkTag(tag))
        {
            console.log(tag, message);
        }
    }

    debug(tag, message)
    {
        if (this.config.debug && this.checkTag(tag))
        {
            this.log(tag, message);
        }
    }

    error(tag, message)
    {        
        if (this.checkTag(tag))
        {
            console.error(tag, message);
        }
    }
}

