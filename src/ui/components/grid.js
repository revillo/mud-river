import { UIComponent } from "../ui-context.js";

export class Grid extends UIComponent
{
    onAttach()
    {
        this.entity.style.display = "grid";
    }

    configure()
    {
    }
}

