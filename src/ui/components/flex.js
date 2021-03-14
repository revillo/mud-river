import { UIComponent } from "../ui.js";

export class Flex extends UIComponent
{
    start()
    {
        this.entity.style.display = "flex";
    }

    configure(flow = "column", flex)
    {
        this.entity.style.flexFlow = flow
        if (flex)
            this.entity.style.flex = flex;
    }
}

