import {UIContext} from "../../src/ui/ui-context.js"
import {GameEditor} from "../../src/ui/components/game-editor.js"
import {WebApp} from "../../src/app/webapp.js"
import {GameContext} from "../../src/game/game-context.js"
import {GameLayer} from "../../src/app/layers/game-layer.js"
import {Camera} from "../../src/components/camera.js"
import { Transform } from "../../src/components/transform.js";
import { Body } from "../../src/components/body.js";
import {ForwardRenderer} from "../../src/game/forward-renderer.js"
import { ModelRender } from "../../src/components/model-render.js";
import {EditorLayer} from "../../src/app/layers/editor-layer.js"
import { ShaderNormals } from "../../src/gfx/shader-mods/normals.js"
import { FreePlayer } from "../../src/index.js"

let app = new WebApp("GameFPS", 1);

app.ready(() => {
    //App
    let gameContext = new GameContext(app.mainCanvas);
    let gameLayer = new GameLayer(gameContext);
    app.addLayer(gameLayer, 2);

    ModelRender.defaultShaderMods = [ShaderNormals];

    const {gltfManager} = gameContext;

    //Scene
    let cube = gameContext.create(ModelRender, Transform, Body);
    
    let startAsset = gltfManager.fromUrl("gltf/scene/scene.gltf");

    cube.get(Transform).setLocalPosition(0, -1, -5);
    cube.get(ModelRender).configure(startAsset);
    cube.get(Body).configure(Body.STATIC);
    cube.get(Body).asset = startAsset;

    let animatedAsset = gltfManager.fromUrl("gltf/animated/testanim.gltf");
    let anim = gameContext.create(Transform, ModelRender);
    anim.get(ModelRender).configure(animatedAsset);
    anim.get(ModelRender).doLoaded(function() {
        this.playAnimation(0);
    });

    anim.get(Transform).setLocalPosition(0, 5.5, -8);

    //startAsset.getPromise().then(() => {
        let player = gameContext.create(FreePlayer);
        player.name = "Player"
        //Renderer
        let renderer = new ForwardRenderer(gameContext);
        renderer.mainCamera = player.get(FreePlayer)._camera.get(Camera);
    
    //});

    const initUI = function()
    {
        let root = document.querySelector('#ui');
        let uiCtx = new UIContext(root);
        let uiLayer = new EditorLayer();
        app.addLayer(uiLayer, 1);

        let editor = uiCtx.create(GameEditor);
        editor.get(GameEditor).gameContext = gameContext;
        window.uiCtx = uiCtx;
    }

    initUI();
});
