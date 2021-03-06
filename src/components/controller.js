import { vec2 } from "../math/index.js";
import { Camera } from "./camera.js";
import { Transform } from "./transform.js";

export class FreeController
{
    cameraAngles = vec2.create();
    transform = null;
    camera = null;

    start()
    {
        this.transform = this.my(Transform);
        this.camera = this.my(Camera);
    }

    update(dt, clock)
    {
         if (this.isPressed('Forward'))
        {
            this.transform.position[2] -= dt;
        }        

        if (this.isPressed('Backward'))
        {
            this.transform.position[2] += dt;
        }
    }
}

//FreeController.updateInterval = 0;
FreeController.selfAware = true;
FreeController.inputAware = true;