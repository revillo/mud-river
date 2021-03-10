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
import { Vector3 } from "../../src/math/index.js"

let tempVec3 = Vector3.new();

class Expiration
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

Expiration.selfAware = true;

class ShootingPlayer extends CharacterController
{
    start()
    {
        super.start();
        this.bindInput("Use", this.shootBall)
    }

    shootBall(button)
    {
        if (button.isPressed)
        {
            const P = this.PHYSICS;

            let ball = this.context.create(Body, Transform, ModelRender, Expiration);
    
            this.camera.get(Transform).worldMatrix.copyTranslation(tempVec3);
            tempVec3.y -= 0.1;
            ball.get(Transform).setTranslation(tempVec3);
        
            ball.get(Body).configure(Body.DYNAMIC);

            ball.get(Body).addCollider (
                P.ColliderDesc.ball(0.1)
                .setCollisionGroups(P.getCollisionGroups([P.GROUP_DYNAMIC], [P.GROUP_DYNAMIC, P.GROUP_STATIC]))
                .setRestitution(0.7)
                .setRestitutionCombineRule(P.CoefficientCombineRule.Max)
            );
    
            this.camera.get(Transform).worldMatrix.copyForward(tempVec3);
            tempVec3.scale(0.05);
            ball.get(Body).applyImpulse(tempVec3);
    
            ball.get(ModelRender).setAsset(this.context.gltfManager.fromUrl("gltf/src/ball.gltf"));
        }
    }
}


let start = () => {
    //App
    let app = new WebApp("GameFPS", 1);
    let gameContext = new GameContext(app.mainCanvas);
    let gameLayer = new GameLayer(gameContext);
    app.addLayer(gameLayer, 1);

    const {gltfManager, PHYSICS} = gameContext;

    //Scene
    let cube = gameContext.create(ModelRender, Transform, Body);

    let startAsset = gltfManager.fromUrl("gltf/scene/scene.gltf");

    cube.get(Transform).setPosition(0, -1, -5);
    cube.get(ModelRender).setAsset(startAsset);
    cube.get(Body).configure(Body.STATIC)
    cube.get(Body).setAsset(startAsset);

    

    /*
    cube.get(Body).addCollider(PHYSICS.ColliderDesc.cuboid(1, 1, 1)
        .setCollisionGroups(PHYSICS.getCollisionGroups([PHYSICS.GROUP_STATIC], [PHYSICS.GROUP_DYNAMIC, PHYSICS.GROUP_PLAYER])));
    */

    /*
    let floor = gameContext.create(Transform, Body);
    floor.get(Body).configure(Body.STATIC);
    floor.get(Body).addCollider(PHYSICS.ColliderDesc.cuboid(100, 1.0, 100).setTranslation(0, -1.0, 0.0)
        .setCollisionGroups(PHYSICS.getCollisionGroups([PHYSICS.GROUP_STATIC], [PHYSICS.GROUP_DYNAMIC, PHYSICS.GROUP_PLAYER])));
    */

    //let player = gameContext.create(FreeController, Camera, Transform);

    startAsset.getPromise().then(() => {
        let player = gameContext.create(ShootingPlayer);

        //Renderer
        let renderer = new ForwardRenderer(gameContext);
        renderer.mainCamera = player.get(ShootingPlayer).camera.get(Camera);
    
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
