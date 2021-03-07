import {WebApp} from "../../src/app/webapp.js"
//import { GameEntity } from "../../src/ecso/ecso.js";
import {GameContext} from "../../src/game/game-context.js"
import {GameLayer} from "../../src/app/layers/game-layer.js"
import {CharacterController, FreeController} from "../../src/components/controller.js"
import {Camera} from "../../src/components/camera.js"
import { Transform } from "../../src/components/transform.js";
import { Body } from "../../src/components/body.js";
import {ForwardRenderer} from "../../src/game/forward-renderer.js"
import { ModelRender } from "../../src/components/model-render.js";

let start = () => {
    //App
    let app = new WebApp("GameFPS", 1);
    let gameContext = new GameContext(app.mainCanvas);
    let gameLayer = new GameLayer(gameContext);
    app.addLayer(gameLayer, 1);

    const {gltfManager, PHYSICS} = gameContext;

    //Scene
    let cube = gameContext.create(ModelRender, Transform, Body);
    cube.get(ModelRender).setAsset(gltfManager.fromUrl("gltf/src/cube.gltf"));
    cube.get(Transform).setPosition(0.0, 0.0, -4.0);
    cube.get(Body).configure(Body.STATIC)
    cube.get(Body).addCollider(PHYSICS.ColliderDesc.cuboid(1, 1, 1));

    let floor = gameContext.create(Transform, Body);
    floor.get(Body).type = Body.STATIC;
    floor.get(Body).addCollider(PHYSICS.ColliderDesc.cuboid(100, 1.0, 100).setTranslation(0, -1.0, 0.0))

    //let player = gameContext.create(FreeController, Camera, Transform);
    let player = gameContext.create(CharacterController);
    player.get(Camera).transform.setPosition(0, 1, 0);

    //Renderer
    let renderer = new ForwardRenderer(gameContext);
    renderer.mainCamera = player.get(Camera);

    app.start();
}
           
if (window.RAPIER)
{
    start()
}
else
{
    window.addEventListener("RAPIER", () => start());
}
