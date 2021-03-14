import { UIComponent } from "../ui.js";
import { Flex } from "./flex.js";
import { Form } from "./form.js";

export class ComponentEditor extends UIComponent
{

    _gameComponent = null;

    start()
    {
        //this.entity.ensure(Flex);
        //this.get(Flex).configure("column");

        this.nameSpan = this.div.appendChild(document.createElement("div"));

        this.form = this.entity.createChild(Form);
    }

    /**
     * @param {EntityComponent} component
     */
    set gameComponent(component)
    {
        if (this._gameComponent != component)
        {
            this._gameComponent = component;
            this.form.get(Form).clear()
            this.refresh();
        }
    }

    refresh()
    {
        this.nameSpan.innerHTML = `<b>${this._gameComponent.__proto__.constructor.name}</b>`;

        for (let prop in this._gameComponent)
        {
            if (prop[0] == "_") continue;
            this.form.get(Form).addField(this._gameComponent, prop);
        }
    }

    destroy()
    {
        this.nameSpan.remove();
    }

}