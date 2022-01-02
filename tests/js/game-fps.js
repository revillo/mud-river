import {WebApp} from "../../src/app/webapp.js"
import {GameContext} from "../../src/game/game-context.js"
import {GameLayer} from "../../src/app/layers/game-layer.js"
import {Camera} from "../../src/components/camera.js"
import { Transform } from "../../src/components/transform.js";
import { Body } from "../../src/components/body.js";
import {ForwardRenderer} from "../../src/game/forward-renderer.js"
import { ModelRender } from "../../src/components/model-render.js";
import { Vector3 } from "../../src/math/index.js"
import { Timer } from "../../src/util/timer.js"
import { vec3 } from "../../src/glm/index.js"
import { ShaderNormals } from "../../src/buff/shader-mods/normals.js"
import { Collision, FirstPersonPlayer, GameComponent, ThirdPersonPlayer } from "../../src/index.js"
import {WyrlPlayer} from "../../../src/components/wyrl-player.js"

let tempVec3 = Vector3.new();

class Expiration extends GameComponent
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


class ShootingPlayer extends FirstPersonPlayer
{
    onAttach()
    {
        super.onAttach();
        this.bindInput("Use", this.shootBall)
        this._ballAsset = this.context.gltfManager.fromUrl("gltf/src/ball.gltf");
        const P = this.context.PHYSICS;
        this._ballCollider = P.ColliderDesc.ball(0.1)
            .setCollisionGroups(Collision.getCollisionGroups([Collision.DYNAMIC], [Collision.DYNAMIC, Collision.STATIC]))
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
    
            ball.get(ModelRender).configure(this._ballAsset, {shaderMods: [ShaderNormals]});
        }
    }
}

let app = new WebApp("GameFPS", 1);
app.ready(() => {
    //App
    let gameContext = new GameContext(app.mainCanvas);
    let gameLayer = new GameLayer(gameContext);
    app.addLayer(gameLayer, 1);

    const {gltfManager} = gameContext;

    //Scene
    let scene = gameContext.create(ModelRender, Transform, Body);
    let sceneAsset = gltfManager.fromUrl("gltf/scene/scene.gltf");
    scene.get(Transform).setLocalPosition(0, -1, -5);
    scene.get(ModelRender).configure(sceneAsset);
    scene.get(Body).configure(Body.STATIC)
    scene.get(Body).asset = sceneAsset;

    //let player = gameContext.create(FreeController, Camera, Transform);

    sceneAsset.getPromise().then(() => {
        let renderer = new ForwardRenderer(gameContext);
        
        let player = gameContext.create(ShootingPlayer);
        renderer.mainCamera = player.get(ShootingPlayer)._camera.get(Camera);
    
        // let player = gameContext.create(ThirdPersonPlayer);
        // player.get(ThirdPersonPlayer).setCharacterAsset(gltfManager.fromUrl("gltf/animated/debugman2.gltf"));
        // renderer.mainCamera = player.get(ThirdPersonPlayer).camera.get(Camera);
    
        // let player = gameContext.create(WyrlPlayer);
        // renderer.mainCamera = player.get(WyrlPlayer).camera.get(Camera);
    });
});