import { UIComponent } from "../ui-context.js";

export class Flex extends UIComponent
{
    onAttach()
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

