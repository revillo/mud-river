import { DefaultAttributes } from "../buff/attribute.js";
import { BufferType, BufferUsage, ShaderValueType } from "../buff/gpu-types.js";
import { Asset, AssetManager } from "./assets.js";

const GLTFAttribute =
{
    POSITION : DefaultAttributes.position,
    NORMAL : DefaultAttributes.normal,
    TEXCOORD_0 : DefaultAttributes.uv0,
    TEXCOORD_1 : DefaultAttributes.uv1
}

const GLTFType =
{
    VEC3_5126 : ShaderValueType.VEC3,
    VEC2_5126 : ShaderValueType.VEC2
}

const GLTFIndexType = 
{
    5123 : {size: 2}, //unsigned short
    5125 : {size: 4} //unsigned int
}

export class GLTFAsset extends Asset
{
    loadFromUrl(url)
    {
        var thiz = this;

        this.relativePath = url.substring(0, url.lastIndexOf('/') + 1);

        this.promise = fetch(url)
            .then(response => response.json())
            .then(gltf => thiz.loadBuffers(gltf))
            .then(gltf => thiz.createBufferViews(gltf))
            .then(gltf => thiz.processAccessors(gltf))
            .then(gltf => thiz.processMeshes(gltf))
            .then(gltf => {
                thiz.gltf = gltf;
                return Promise.resolve(thiz);
            })
            .catch(error => {
                console.error(error);
            })
        
        return this;
    }

    processMeshes(gltf)
    {
        const bufferManager = this.manager.bufferManager;

        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(primitive => {
                primitive.vertexLayout = {};

                for (var attribName in primitive.attributes)
                {
                    const accessor = gltf.accessors[primitive.attributes[attribName]];
                    const myAttribute = GLTFAttribute[attribName];

                    const bv = accessor.bufferView;

                    if (!bv.gpuView)
                    {
                        bv.gpuView = bufferManager.allocBufferView(BufferType.VERTEX, BufferUsage.STATIC, bv.cpuView);
                    }

                    primitive.vertexLayout[myAttribute.id] = {
                        buffer : bv.gpuView.buffer,
                        offset : bv.gpuView.offset + (accessor.byteOffset || 0),
                        stride : bv.byteStride || 0,
                        location : myAttribute.location,
                        isNormalized : accessor.isNormalized || false,
                        type : GLTFType[accessor.type + "_" + accessor.componentType],
                        instanced : 0
                    }
                }


                const indexAccessor = gltf.accessors[primitive.indices];
                const ibv = indexAccessor.bufferView;

                if (!ibv.gpuView)
                {
                    ibv.gpuView = bufferManager.allocBufferView(BufferType.INDEX, BufferUsage.STATIC, ibv.cpuView);
                }

                primitive.indexLayout = {
                    buffer : ibv.gpuView.buffer,
                    count : indexAccessor.count,
                    type : indexAccessor.componentType,
                    start : ibv.gpuView.offset / GLTFIndexType[indexAccessor.componentType].size,
                }

            })
        });

        return Promise.resolve(gltf);
    }


    createBufferViews(gltf)
    {
        const bufferManager = this.manager.bufferManager;

        gltf.bufferViews.forEach(view => {

            view.cpuView = new Uint8Array(gltf.cpuBuffers[view.buffer], view.byteOffset, view.byteLength);

            if (view.target == 34963)
            {
                view.gpuView = bufferManager.allocBufferView(BufferType.INDEX, BufferUsage.STATIC, view.cpuView);
            }
            else if (view.target == 34962)
            {
                view.gpuView = bufferManager.allocBufferView(BufferType.VERTEX, BufferUsage.STATIC, view.cpuView);
            }
           
            
        });

        return Promise.resolve(gltf);
    }

    processAccessors(gltf)
    {
        gltf.accessors.forEach((accessor) => {
            accessor.bufferView = gltf.bufferViews[accessor.bufferView];
        });
        return Promise.resolve(gltf);
    }
    
    loadBuffers(gltf)
    {
        var thiz = this;

        console.log(gltf);

        return new Promise((resolve, reject) => {
            
            var sem = gltf.buffers.length;

            gltf.cpuBuffers = [];

            gltf.buffers.forEach((buffer, i) => {
                fetch(thiz.relativePath + buffer.uri)
                    .then(response => response.arrayBuffer())
                    .then(response => {
                        gltf.cpuBuffers[i] = response;
                        sem -= 1;
                        if (sem == 0)
                        {
                            resolve(gltf)
                        }
                    })
                    .catch((e) => {
                        reject(e);
                    })
                })
        })

    }
}

export class GLTFManager extends AssetManager
{
    constructor(bufferManager, textureManager)
    {
        super();
        this.bufferManager = bufferManager;
        this.textureManager = textureManager;
    }

    newAsset()
    {
        return new GLTFAsset(this);
    }
}