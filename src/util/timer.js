export class Timer
{
    constructor()
    {
        this.firstTick = performance.now();
        this.lastTick = 0;
    }

    /**
     * @return {number} - Delta time in seconds since last tick() call
     */
    tick()
    {
        return this.tickMS() * 0.001;
    }

    lastTickTime()
    {
        return this.lastTick * 0.001;
    }

    /**
     * @return {number} - Delta time in milliseconds since last tick() call
     */
    tickMS()
    {
        let now = this.nowMS();
        let delta = now - this.lastTick;
        this.lastTick = now;
        return delta;
    }

    /**
     * @return {number} - Time in milliseconds since timer was created
     */
    nowMS()
    {
        return performance.now() - this.firstTick;
    }

    
    /**
     * @return {number} - Time in seconds since timer was created
     */
    now()
    {
        return this.nowMS() * 0.001;
    }
}

class TimeTracker
{
    constructor()
    {
        this.metrics = new Map();
    }

    start(name)
    {
        if (!this.metrics.has(name))
        {
            this.metrics.set(name, {
                totalTime : 0.0,
                count: 0,
                timer : new Timer
            })
        }

        this.metrics.get(name).timer.tickMS();
    }

    stop(name)
    {
        const metric = this.metrics.get(name);
        metric.count += 1;
        metric.totalTime += metric.timer.tickMS();
    }
}