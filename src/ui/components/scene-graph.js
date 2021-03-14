import { GameEntity } from "../../game/game-context.js";
import { UIComponent } from "../ui.js";
import { Flex } from "./flex.js";

/**
 * 
 * @param {GameEntity} gameEntity 
 */
const makeEntityName = function(gameEntity)
{
    let names = [];
    gameEntity.each(Component => {
        //if (Component.name == "Transform" || Component.name == "PrimRender") return;
        if (Component.icon)
        {
            names.push(`<button><img src="../src/ui/img/icon/${Component.icon}.png"></button>`);
        }
        else
        {
            names.push(`<button>${Component.name.substr(0, 6)}</button>`);
        }
    });

    if (gameEntity.name)
    {
        //names.push(gameEntity.name);
    }

    if (names.length == 0)
    {
        return "";
    }

    return names.join(" ");
}

export class SceneGraph extends UIComponent
{
    _gameEntity = null

    start()
    {
        this.entity.ensure(Flex);
        this.get(Flex).configure("column");

        this.entity.style.marginLeft = "0.25em";
        this.entity.style.borderLeft = "2px solid rgba(255,255,255,0.2)"
        let thiz = this;

        this.nameSpan = document.createElement("span");

        /*
        this.nameSpan.onclick = function()
        {
            document.querySelectorAll('.sg-selected').forEach(node => {
                node.classList.remove('.sg-selected');
            });

            thiz.nameSpan.class = "sg-selected";
            thiz.nameSpan.blur();
            SceneGraph.onSelected(thiz._gameEntity);
        }
        */

        this.entity.div.appendChild(this.nameSpan);
    }

    /**
     * @param {GameEntity} entity
     */
    set gameEntity(gameEntity)
    {
        if (this._gameEntity != gameEntity)
        {
            this.entity.eachChild(child => child.destroy());
            this._gameEntity = gameEntity;
        }

        let name = makeEntityName(this._gameEntity);
        
        if (name != this.name)
        {
            this.name = name;
            this.nameSpan.innerHTML = this.name;

            let buttons = this.nameSpan.children;
            for (let i = 0; i < buttons.length; i++)
            {
                let button = buttons[i];

                /*
                button.style.fontSize = "0.5rem";
                button.style.margin = "0px";
                
                button.style.background = "transparent";
                button.style.color = "white";
                */

                button.onclick = function()
                {
                    document.querySelectorAll('.sg-selected').forEach(node => {
                        node.classList.remove('.sg-selected');
                    });

                    button.class = "sg-selected";
                    button.blur();

                    SceneGraph._onSelected(gameEntity, i);
                }
            }
        }
        
        this.refresh();
    }

    refresh()
    {
        if (!this._gameEntity) return;
        let thiz = this;
    
        let myChildArray = Array.from(this.entity._children);

        let gameChildIndex = 0;

        this._gameEntity.eachChild(child => {
            
            if (!myChildArray[gameChildIndex])
            {
                let e = thiz.entity.createChild(SceneGraph);
                e.get(SceneGraph).gameEntity = child;
                gameChildIndex += 1;
                return false;
            }

            myChildArray[gameChildIndex].get(SceneGraph).gameEntity = child;
            gameChildIndex += 1;
            return false;
        });

        for (let i = gameChildIndex; i < myChildArray.length ; i++)
        {
            myChildArray[i].destroy();
        }

    }

    destroy()
    {
        this.nameSpan.remove();
    }
}

SceneGraph._onSelected = function(gameEntity, componentIndex)
{
    let childArr = Array.from(gameEntity.components.values());
    console.log(childArr[componentIndex]);
    SceneGraph.onSelected(gameEntity, childArr[componentIndex]);
}

SceneGraph.onSelected = () => {};