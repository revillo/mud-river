import { FrameMetrics } from "../../util/timer.js";
import { UIComponent } from "../ui.js";

export class Metrics extends UIComponent
{
    /**
     * @param {FrameMetrics} - frameTimers
     */
    set frameTimers(frameTimers)
    {
        this._frameTimers = frameTimers;
        this.refresh();
    }

    refresh()
    {
        let fields = [];
        for (let [name, metric] of this._frameTimers.metrics)
        {
            let color = "lime";
            
            if (metric.fps < 100)
            {
                color = 'red';
            } else if (metric.fps < 200)
            {
                color = 'yellow'
            }
            //fields.push(name + ": " + " <b>" + metric.fps.toFixed(0) + "</b>");
            fields.push(`${name}: <b style="color:${color};"> ${metric.fps.toFixed(0)} </b>`);
        }

        this.entity.div.innerHTML = fields.join(" ");
    }
}