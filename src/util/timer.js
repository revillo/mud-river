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