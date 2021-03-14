export class EditorLayer
{

    constructor()
    {
        this.catchEvents("mousedown", "mouseup", "mousemove", "mousewheel", "keydown", "keyup");
    }

    isUIEvent(e)
    {
       if (e.target.closest(".editor"))
       {
            return true;
       }

       return false;
    }


    catchEvents(...eventNames)
    {
        const thiz = this;
        for (let name of eventNames)
        {
            this["on_" + name] = function(e)
            {
                return (thiz.isUIEvent(e));
            }

        }
    }



}