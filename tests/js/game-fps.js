import {WebApp} from "../../src/app/webapp.js"
import {GameContext, EntityComponent} from "../../src/game/game-context.js"
import {GameLayer} from "../../src/app/layers/game-layer.js"
import {CharacterController, FreeController} from "../../src/components/controller.js"
import {Camera} from "../../src/components/camera.js"
import { Transform } from "../../src/components/transform.js";
import { Body } from "../../src/components/body.js";
import {ForwardRenderer} from "../../src/game/forward-renderer.js"
import { ModelRender } from "../../src/components/model-render.js";
import { Vector3 } from "../../src/math/index.js"
import { Timer } from "../../src/util/timer.js"
import { vec3 } from "../../src/glm/index.js"
import { ShaderNormals } from "../../src/buff/shader-mods/normals.js"

let tempVec3 = Vector3.new();

class Expiration extends EntityComponent
{
    timeLeft = 10;

    configure(timeLeft)
    {
        this.timeLeft = timeLeft;
    }

    update(dt)
    {
        this.timeLeft -= dt;
        if (this.timeLeft < 0)
        {
            this.entity.destroy();
        }
    }
}


class ShootingPlayer extends CharacterController
{
    start()
    {
        super.start();
        this.bindInput("Use", this.shootBall)
        this._ballAsset = this.context.gltfManager.fromUrl("gltf/src/ball.gltf");
        const P = this.context.PHYSICS;
        this._ballCollider = P.ColliderDesc.ball(0.1)
            .setCollisionGroups(P.getCollisionGroups([P.GROUP_DYNAMIC], [P.GROUP_DYNAMIC, P.GROUP_STATIC]))
            .setRestitution(0.7)
            .setRestitutionCombineRule(P.CoefficientCombineRule.Max);
    }

    shootBall(button)
    {
        if (button.isPressed)
        {
            let ball = this.context.create(Body, Transform, ModelRender, Expiration);
    
            const camMat = this._camera.get(Transform).worldMatrix;

            tempVec3.set(0.1, -0.1, -.1);
            tempVec3.transformMat4(camMat);
            ball.get(Transform).setLocalTranslation(tempVec3);
            
            ball.get(Body).configure(Body.DYNAMIC);
            ball.get(Body).addCollider (this._ballCollider);
    
            tempVec3.set(0.0, 0.0, -1.0);
            tempVec3.rotateMat4(camMat);
            tempVec3.scale(0.05);
            ball.get(Body).applyImpulse(tempVec3);
    
            ball.get(ModelRender).configure(this._ballAsset, [ShaderNormals]);
        }
    }
}


let start = () => {
    //App
    let app = new WebApp("GameFPS", 1);
    let gameContext = new GameContext(app.mainCanvas);
    let gameLayer = new GameLayer(gameContext);
    app.addLayer(gameLayer, 1);

    const {gltfManager} = gameContext;

    //Scene
    let cube = gameContext.create(ModelRender, Transform, Body);
    
    let startAsset = gltfManager.fromUrl("gltf/scene/scene.gltf");

    cube.get(Transform).setLocalPosition(0, -1, -5);
    cube.get(ModelRender).configure(startAsset);

    cube.get(Body).configure(Body.STATIC)
    cube.get(Body).asset = startAsset;

    //let player = gameContext.create(FreeController, Camera, Transform);

    startAsset.getPromise().then(() => {
        let player = gameContext.create(ShootingPlayer);

        //Renderer
        let renderer = new ForwardRenderer(gameContext);
        renderer.mainCamera = player.get(ShootingPlayer)._camera.get(Camera);
    
    });

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
