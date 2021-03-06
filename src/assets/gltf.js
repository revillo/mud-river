import { DefaultAttributes } from "../buff/attribute.js";
import { BufferType, BufferUsage, ShaderValueType } from "../buff/gpu-types.js";
import { prune } from "../util/object.js";
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


const GLTFMaterialBindTextures = function(gpu, program)
{
    var i = 0;
    for (let texName in this.textures)
    {
        this.textures[texName].bind(program, texName, i);
        i += 1;
    }
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
            .then(gltf => thiz.processMaterials(gltf))
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

    processMaterials(gltf)
    {
        //const thiz = this;

        const resolveTextureAsset = (texture) => {
            if (!texture) return null;
            //return thiz.textureBatch.get(texture.index);
            return gltf.textures[texture.index].asset;
        }

        gltf.materials.forEach(material => {
            material.textures = {};
            material.factors = {};

            material.bindTextures = GLTFMaterialBindTextures;
            const pbr = material.pbrMetallicRoughness;
            if(pbr)
            {
                material.textures.t_baseColor = resolveTextureAsset(pbr.baseColorTexture);
                material.textures.t_metallicRoughness = resolveTextureAsset(pbr.metallicRoughnessTexture);
                material.factors.u_baseColor = new Float32Array(pbr.baseColorFactor || [1,1,1,1]);
                material.factors.u_metallic = pbr.metallicFactor || 0;
                material.factors.u_roughness = pbr.roughnessFactor || 1;
            }

            material.textures.t_normal = resolveTextureAsset(material.normalTexture);
            material.textures.t_occlusion = resolveTextureAsset(material.occlusionTexture);
            material.textures.t_emissive = resolveTextureAsset(material.emissiveTexture);

            material.factors.u_emissive = new Float32Array(material.emissiveFactor || [0,0,0]);

            prune(material.textures);
            prune(material.factors);
        });

        return Promise.resolve(gltf);
    }

    processMeshes(gltf)
    {
        const bufferManager = this.manager.bufferManager;

        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(primitive => {
        
                /**
                 * @type {Map<string, AttributeLayout>}
                 */
                primitive.vertexLayout = {};
                primitive.material = gltf.materials[primitive.material];

                for (var attribName in primitive.attributes)
                {
                    const accessor = gltf.accessors[primitive.attributes[attribName]];
                    const myAttribute = GLTFAttribute[attribName];

                    const bv = accessor.bufferView;

                    if (!bv.gpuView)
                    {
                        bv.gpuView = bufferManager.allocBufferView(BufferType.VERTEX, BufferUsage.STATIC, bv.cpuBuffer);
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
                    ibv.gpuView = bufferManager.allocBufferView(BufferType.INDEX, BufferUsage.STATIC, ibv.cpuBuffer);
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

            view.cpuBuffer = new Uint8Array(gltf.cpuBuffers[view.buffer], view.byteOffset, view.byteLength);

            if (view.target)
            {
                view.gpuView = bufferManager.allocBufferView(view.target, BufferUsage.STATIC, view.cpuBuffer);
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

        if (gltf.images)
        {
            ///*
            
            //const batch = {};
            gltf.images.forEach((image,i) => {
                gltf.images[i].asset = this.manager.textureManager.fromUrl(this.relativePath + image.uri);
                //batch[i] = {url : this.relativePath + image.uri}
            });

            gltf.textures.forEach((texture, i) => {
                gltf.textures[i] = {asset: gltf.images[texture.source].asset};
            })

            //this.textureBatch = this.manager.textureManager.loadBatch(batch);
            
        }

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