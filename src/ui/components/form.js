import { UIComponent } from "../ui-context.js";
import { InputNumber } from "./input-number.js";

export class Form extends UIComponent
{
    onAttach()
    {
        this.div.style.display = "grid";
        this.div.style.gridTemplateColumns = "50% 50%";
        this.div.style.padding = "0.5em";
        this.div.style.gridRowGap = "0.5em";
    }

    clear()
    {
        this.entity.eachChild(child => child.destroy());
        this.div.innerHTML = "";
    }

    addField(object, name)
    {
        let nameSpan = this.entity.createChild();
        let valueSpan = this.entity.createChild();

        let value = object[name];

        if (typeof value == "number")
        {
            let input = valueSpan.createChild(InputNumber);
            input.get(InputNumber).configure(object, name);
        }

        //nameSpan.style.gridArea = "name";
        //valueSpan.style.gridArea = "input";

        nameSpan.div.innerHTML = name;
        
    }
}