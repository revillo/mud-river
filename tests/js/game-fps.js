import {WebApp} from "../../src/app/webapp.js"
//import { GameEntity } from "../../src/ecso/ecso.js";
import {GameContext} from "../../src/game/game-context.js"
import {GameLayer} from "../../src/app/layers/game-layer.js"
import {FreeController} from "../../src/components/controller.js"
import {Camera} from "../../src/components/camera.js"
import { Transform } from "../../src/components/transform.js";
import {ForwardRenderer} from "../../src/game/forward-renderer.js"
import { ModelRender } from "../../src/components/model-render.js";

//App
let app = new WebApp("GameFPS", 1);
let gameContext = new GameContext(app.mainCanvas);
let gameLayer = new GameLayer(gameContext);
app.addLayer(gameLayer, 1);

//Scene
let cube = gameContext.create(ModelRender, Transform);
let camera = gameContext.create(FreeController, Camera, Transform);
cube.get(ModelRender).setAsset(gameContext.gltfManager.fromUrl("gltf/src/cube.gltf"));

//Renderer
let renderer = new ForwardRenderer(gameContext);
gameContext.renderer = renderer;
renderer.mainCameraEntity = camera;

app.start();
