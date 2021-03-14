import { UIComponent } from "../ui.js";

export class InputNumber extends UIComponent
{
    configure(object, name)
    {
        this.object = object;
        this.name = name;
        this.input = this.insertHTML("input");
        this.input.type = "number";
        let thiz = this;

        this.input.value = object[name];
        this.input.style.width = "100%";

        this.input.oninput = function() {
            object[name] = Number(thiz.input.value);
        }
    }
    

}