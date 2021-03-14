import { UIComponent } from "../ui.js";

export class Grid extends UIComponent
{
    start()
    {
        this.entity.style.display = "grid";
    }

    configure()
    {
    }
}

