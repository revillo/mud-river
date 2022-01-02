
import { GameComponent, Vector3 } from "../index.js";
import { Body } from "./body.js";
import { Transform } from "./transform.js";

const tempMovement = Vector3.new();

/**
 * A component for running and gliding physics
 */
export class FlightMovement extends GameComponent {
    thrust = 30;
    drag = 3;

    /**
     * Update physics for flying
     * @param {Vector3} movement - movement vector in entity local coordinates
     * @param {Body?} body - body to apply force
     * @param {Matrix4?} basis - coordinate system basis
     */
    move(movement, body, basis) {

        if (movement.getLength() < 0.001) return;

        body = body || this.get(Body);
        basis = basis || Transform.getWorldMatrix(this.entity);
        tempMovement.copy(movement);
        tempMovement.rotateMat4(basis);
        tempMovement.scale(this.thrust);
        body.linearDamping = this.drag;
        body.applyForce(tempMovement);
    }
}