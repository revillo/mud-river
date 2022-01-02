import { GameEntity } from "../../game/game-entity.js";
import { UIComponent } from "../ui-context.js";
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
            names.push(`<button><img src="${SceneGraph.imgPath}/icon/${Component.icon}.png"></button>`);
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
    _expanded = false;

    onAttach()
    {
        this.entity.ensure(Flex);
        this.get(Flex).configure("column");

        this.entity.style.marginLeft = "0.25em";
        this.entity.style.borderLeft = "2px solid rgba(255,255,255,0.2)"
        let thiz = this;

        this.nameSpan = document.createElement("span");
        this.nameSpan.onclick = function(e) 
        {
            if (e.target == thiz.nameSpan)
                thiz.expanded = !thiz.expanded;
        }

        this.entity.div.appendChild(this.nameSpan);
    }


    get expanded()
    {
        return this._expanded;
    }

    set expanded(expanded)
    {
        if (expanded)
        {
            this.expand();
        }
        else
        {
            this.collapse();
        }
    }

    expand()
    {
        if (!this._expanded)
        {
            this._expanded = true;
            this.refresh();    
        }
    }

    collapse()
    {
        if (this._expanded)
        {
            this._expanded = false;
            this.entity.eachChild(e => e.destroy());
        }
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
        if (!this._expanded)
        {
            return;
        }

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

    onDetach()
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
SceneGraph.imgPath = "../src/ui/img";