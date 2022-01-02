import {EntityPool, GameEntity} from "../../src/ecso/ecso.js"
import { Timer } from "../../src/util/timer.js";

/*
import {World} from "../../lib/uecs/index.esm.js"
const world = new World();
window.world = world;

function testUECS()
{
    timer.tick();
    for (let i = 0; i < numIters; i++)
    {
        world.create(new Position, new Velocity);
    }
    for (let i = 0; i < numIters; i++)
    {
        world.create(new Position);
    }
    console.log("UECS Insertion", timer.tickMS());

    //
    let view = world.view(Position, Velocity);
    timer.tick();

    view.each((entity, position, velocity) =>
    {
        position.x += velocity.x;
        position.y += velocity.y;
    })
    console.log("UECS Iteration", timer.tickMS());
}


testUECS();
testUECS();
*/

const pool = new EntityPool(GameEntity)

const numIters = 10000;

let timer = new Timer();

class Position
{
    x = 0;
    y = 0;
    z = 0;
}

class Velocity
{
    x = 10;
    y = 10;
    z = 10;
}

function testECSO()
{
    timer.tick();
    for (let i = 0; i < numIters; i++)
    {
        pool.create(Position, Velocity);
    }
    for (let i = 0; i < numIters; i++)
    {
        pool.create(Position);
    }
    console.log("ECSO Insertion", timer.tickMS());

    //
    let view = pool.with(Position, Velocity);
    timer.tick();

    view(entity =>
    {
        let position = entity.get(Position);
        let velocity = entity.get(Velocity);

        position.x += velocity.x;
        position.y += velocity.y;
    });

    console.log("ECSO Iteration", timer.tickMS());
}

testECSO();
testECSO();