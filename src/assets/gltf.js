import { DefaultAttributes } from "../buff/attribute.js";
import { BufferType, BufferUsage, ShaderValueType } from "../buff/gpu-types.js";
import { mat4 } from "../math/index.js";
import { prune } from "../util/object.js";
import { Asset, AssetManager } from "./assets.js";

const GLTFAttribute =
{
    POSITION : DefaultAttributes.POSITION,
    NORMAL : DefaultAttributes.NORMAL,
    TEXCOORD_0 : DefaultAttributes.UV0,
    TEXCOORD_1 : DefaultAttributes.UV1
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
            .then(gltf => thiz.processScene(gltf))
            .then(gltf => {
                thiz.gltf = gltf;
                return Promise.resolve(thiz);
            })
            .catch(error => {
                console.error(error);
            })
        
        return this;
    }

    processScene(gltf)
    {
        
        function nodeHelper(nodeIndex, i, array, parentMatrix)
        {
            const node = gltf.nodes[nodeIndex];
            array[i] = node;

            if (node.mesh == undefined && !node.children) return;

            node.matrix = mat4.create();

            if (node.translation)
            {
                mat4.setTranslation(node.matrix, node.translation);
            }

            if (node.rotation)
            {
                mat4.setRotation(node.matrix, node.rotation);
            }

            mat4.multiply(node.matrix, parentMatrix, node.matrix);

            if (node.mesh != undefined)
            {
                node.mesh = gltf.meshes[node.mesh];
            }

            if (node.translation);

            if (node.children)
            {
                node.children.forEach((nodeIndex, index) => nodeHelper(nodeIndex, index, node.children, node.matrix));
            }
        }

        gltf.scenes[0].nodes.forEach((nodeIndex, index) => nodeHelper(nodeIndex, index, gltf.scenes[0].nodes, mat4.create()));

        return Promise.resolve(gltf);
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
        const thiz = this;
        let primId = 0;

        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(primitive => {
        
                /**
                 * @type {Map<string, AttributeLayout>}
                 */
                primitive.vertexLayout = {};
                primitive.material = gltf.materials[primitive.material];
                primitive.id = primId++;

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

                thiz.createPrimitiveCollisonData(gltf, primitive);

            })
        });

        return Promise.resolve(gltf);
    }

    createPrimitiveCollisonData(gltf, prim)
    {
        if(prim.attributes.POSITION != undefined)
        {
            //Positions
            const positionAccessor = gltf.accessors[prim.attributes.POSITION];
            let u8Buffer = positionAccessor.bufferView.cpuBuffer;

            prim.verticesPhys = new Float32Array(u8Buffer.buffer, u8Buffer.byteOffset, u8Buffer.byteLength/4);
            //todo handle non-float vertices
            
            //Indices
            const indexAccessor = gltf.accessors[prim.indices];
            u8Buffer = indexAccessor.bufferView.cpuBuffer;
            if(indexAccessor.componentType != 5125)
            {
                prim.indicesPhys = new Uint32Array(u8Buffer);
            }
            else
            {
                prim.indicesPhys = new Uint32Array(u8Buffer.buffer, u8Buffer.byteOffset, u8Buffer.byteLength/4);
            }
        }

    }

    createBufferViews(gltf)
    {
        const bufferManager = this.manager.bufferManager;

        gltf.bufferViews.forEach(view => {

            view.cpuBuffer = new Uint16Array(gltf.cpuBuffers[view.buffer], view.byteOffset, view.byteLength/2);

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