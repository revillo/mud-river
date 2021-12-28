import { UIComponent } from "../ui-context.js";
import { ComponentEditor } from "./component-editor.js";
import { Flex } from "./flex.js";
import { Metrics } from "./metrics.js";
import { SceneGraph } from "./scene-graph.js";

let UIColors = 
{
    PANEL_BG : "rgb(0, 0, 0, 0.7)",
    WINDOW_BG : "transparent",
    FONT : "white"
}

export class GameEditor extends UIComponent
{
    onAttach()
    {
        this.entity.ensure(Flex);
        this.get(Flex).configure("column");
        
        
        this.div.style.color = UIColors.FONT;
        this.div.style.width = "100%";
        this.div.style.height = "100%";
        this.div.style.background = UIColors.WINDOW_BG;
        this.div.style.fontSize = "0.75rem";
        this.div.style.fontFamily = "verdana";

        this.topBar = this.entity.createChild(Flex);
        this.topBar.get(Flex).configure("row", "0 1 auto");
        this.topBar.class = "editor top-menu";

        this.topBar.style.width = "100%";
        this.topBar.style.height = "1.3rem";
        this.topBar.style.background = UIColors.PANEL_BG;

        this.sideBar = this.entity.createChild(Flex);
        this.sideBar.get(Flex).configure("column", "1 1 auto");
        this.sideBar.class = "editor left-menu";

        this.sideBar.style.left = 0;
        this.sideBar.style.width = "16rem";
        this.sideBar.style.height = "100%";
        this.sideBar.style.overflow = "auto";
        this.sideBar.style.background = UIColors.PANEL_BG;
    }

    configure(gameContext, imgPath)
    {
        SceneGraph.imgPath = imgPath;
        this.gameContext = gameContext;
    }

    /**
     * 
     * @param {GameContext} gameContext 
     */
    set gameContext(gameContext)
    {
        this._gameContext = gameContext;
        //let refresh = this.sideBar.div.appendChild(document.createElement("button"));
        //refresh.innerHTML = "Refresh";

        this.graphContainer = this.sideBar.createChild(Flex);
        this.graphContainer.get(Flex).configure("column", "1");
        this.graphContainer.style.overflow = "auto";

        this.scenePanel = this.graphContainer.createChild(SceneGraph);
        
        this.scenePanel.get(SceneGraph).gameEntity = gameContext.root;
        this.scenePanel.get(SceneGraph).expand();

        const thiz = this;

        /*
        refresh.onclick = function() {
            thiz.scenePanel.get(SceneGraph).refresh();
            refresh.blur();
        }*/

        this.componentEditor = this.sideBar.createChild(ComponentEditor, Flex);
        this.componentEditor.get(Flex).configure("column", "1");
        this.componentEditor.style.overflow = "auto";

        SceneGraph.onSelected = function(entity, component)
        {
            thiz.componentEditor.get(ComponentEditor).gameComponent = component;
        }

        let metricsPanel = this.topBar.createChild(Metrics);
        let metrics = metricsPanel.get(Metrics);
        metrics.frameTimers = gameContext.frameTimers;

        window.setInterval(() => {
            thiz.scenePanel.get(SceneGraph).refresh();
        }, 1000);

        window.setInterval(() => {
            metrics.refresh();
        }, 200);
    }


}

