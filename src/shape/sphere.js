/**
 * @class Sphere
 */
export class Sphere
{
    constructor(radius)
    {
        Object.assign(this, {
            radius: radius || 1.0,
        });
    }

    createGeometry(rings, slices, offset)
    {
        rings = (rings || 16) - 1;
        slices = (slices || 16) - 1;
        offset = offset || [0,0,0];
        const radius = this.radius;
        const vertSize = 3 + 3 + 2;
        const numVerts = (rings + 1) * (slices + 1);
        const numElements = (rings * slices) * 6;

        const cos = Math.cos;
        const sin = Math.sin;

        const vertBuffer = new Float32Array(numVerts * vertSize);
        const elementBuffer = new Uint16Array(numElements);

        var vertIndex = 0;
        var elementIndex = 0;

        const addVert = (vals) =>
        {
            var o = vertIndex * vertSize;
            for (var i = 0; i < vertSize; ++i)
            {
                vertBuffer[o + i] = vals[i];
            }

            vertIndex += 1;
        }

        const addFace = (a,b,c,d) =>
        {
            elementBuffer[elementIndex++] = a;
            elementBuffer[elementIndex++] = c;
            elementBuffer[elementIndex++] = b;

            elementBuffer[elementIndex++] = a;
            elementBuffer[elementIndex++] = d;
            elementBuffer[elementIndex++] = c;
        }

        for (let r = 0; r <= rings; r++)
        {
            for (let s = 0; s <= slices; s++)
            {
                let v = r / rings;
                let u = s / slices;

                let phi = (v) * Math.PI;
                let theta = (u) * Math.PI * 2;

                let px, py, pz, nx, ny, nz;
                nx = cos(theta) * sin(phi);
                ny = sin(theta) * sin(phi);
                nz = cos(phi);

                px = nx * radius + offset[0];
                py = ny * radius + offset[1];
                pz = nz * radius + offset[2];

                addVert([px, py, pz, nx, ny, nz, u, v]);
            }
        }

        const getElement = (r, s)=>
        {
            return r * (slices+1) + s;
        }


        for (let r = 0; r < rings; r++)
        {
            for (let s = 0; s < slices; s++)
            {
                addFace(
                    getElement(r, s),
                    getElement(r, s + 1),
                    getElement(r + 1, s + 1),
                    getElement(r + 1, s)
                );
            }
        }

        return {
            vertices : vertBuffer,
            indices : elementBuffer,
            count : numElements
        }

    }



}