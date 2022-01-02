import { DefaultAttributes } from "../buff/attribute.js";
import { BufferType, BufferUsage, BinType } from "../buff/gpu-types.js";
import { mat4 } from "../glm/index.js";
import { Vector3 } from "../math/index.js";
import { prune } from "../util/object.js";
import { Asset, AssetManager } from "./assets.js";

const GLTFEnum =
{
    TRANSLATION : 0,
    ROTATION : 1,
    SCALE : 2,
    LINEAR : 3,
    CUBIC_SPLINE: 4,
    STEP : 5
}

export {GLTFEnum}

const GLTFEnumMap =
{
    translation : GLTFEnum.TRANSLATION,
    rotation : GLTFEnum.ROTATION,
    scale : GLTFEnum.SCALE,
    LINEAR : GLTFEnum.LINEAR,
    CUBICSPLINE : GLTFEnum.CUBIC_SPLINE,
    STEP : GLTFEnum.STEP
}

const GLTFAttributeMap =
{
    POSITION : DefaultAttributes.POSITION,
    NORMAL : DefaultAttributes.NORMAL,
    TEXCOORD_0 : DefaultAttributes.UV0,
    TEXCOORD_1 : DefaultAttributes.UV1,
    WEIGHTS_0 : DefaultAttributes.JOINT_WEIGHTS,
    JOINTS_0 : DefaultAttributes.JOINT_INDICES
}

const GLTFTypeMap =
{
    VEC3_5126 : BinType.VEC3,
    VEC2_5126 : BinType.VEC2,
    VEC4_5126 : BinType.VEC4,
    VEC4_5121 : BinType.U8VEC4
}

const GLTFIndexInfo = 
{
    5123 : {size: 2}, //unsigned short
    5125 : {size: 4} //unsigned int
}

function safeEach(array, handler)
{
    if (array)
    {
        array.forEach(handler);
    }
}

/*
const GLTFMaterialBindTextures = function(gpu, program)
{
    var i = 0;
    for (let texName in this.textures)
    {
        this.textures[texName].bind(program, texName, i);
        i += 1;
    }
}
*/

export class GLTFMaterial
{
    bindTextures(program)
    {
        var i = 0;
        for (let texName in this.textures)
        {
            this.textures[texName].bind(program, texName, i);
            i += 1;
        }
    }

    unbindTextures()
    {
        var i = 0;
        for (let texName in this.textures)
        {
            this.textures[texName].unbind(i);
            i += 1;
        }
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
            .then(gltf => thiz.processAnimations(gltf))
            .then(gltf => {
                
                console.log(gltf);

                thiz.gltf = gltf;
                return Promise.resolve(thiz);
            })
            .catch(error => {
                console.error(error);
                return Promise.reject();
            })
        
        return this;
    }

    processAnimations(gltf)
    {
        gltf.animationMap = new Map();

        safeEach(gltf.animations, (anim) => {

            anim.duration = 0.0;

            if (anim.name)  
                gltf.animationMap.set(anim.name, anim);

            safeEach(anim.samplers, (sampler) => {
                sampler.input = gltf.accessors[sampler.input];
                sampler.output = gltf.accessors[sampler.output];
                
                let timeBuffer = sampler.input.bufferView.cpuBuffer;
                sampler.times = new Float32Array(timeBuffer.buffer, timeBuffer.byteOffset, 
                    timeBuffer.byteLength / 4);
                
                let lastTime = sampler.times[sampler.times.length-1];

                let keyframeBuffer = sampler.output.bufferView.cpuBuffer;
                sampler.values = new Float32Array(keyframeBuffer.buffer, keyframeBuffer.byteOffset, 
                    keyframeBuffer.byteLength / 4);

                sampler.interpolation = GLTFEnumMap[sampler.interpolation || "LINEAR"];
                anim.duration = Math.max(anim.duration, lastTime);
            });


            //anim.channels = anim.channels.filter(channel => channel.target.path == "rotation");

            safeEach(anim.channels, (channel) => {
                channel.target.node = gltf.nodes[channel.target.node];
                channel.target.path = GLTFEnumMap[channel.target.path];
                channel.sampler = anim.samplers[channel.sampler];
            });
            
        });

        safeEach(gltf.skins, skin => {

            let poseAccessor = gltf.accessors[skin.inverseBindMatrices];
            let poseBuffer = poseAccessor.bufferView.cpuBuffer;

            skin.invBinds = [];

            let numMatrices = poseAccessor.count;
            skin.invBinds.length = numMatrices;

            for (let i = 0; i < numMatrices; i++)
            {
                skin.invBinds[i] = new Float32Array(poseBuffer.buffer, poseBuffer.byteOffset + i * (16 * 4), 16);
            }

            safeEach(skin.joints, (nodeIndex, i) => {
                skin.joints[i] = gltf.nodes[nodeIndex]
                //skin.joints[i].jointIndex = i;
                //skin.joints[i].invBind = skin.invBinds[i]; 
            });
        });

        return Promise.resolve(gltf);
    }

    processScene(gltf)
    {
        
        function nodeHelper(nodeIndex, i, array, parentMatrix)
        {
            const node = gltf.nodes[nodeIndex];
            array[i] = node;

            node.id = nodeIndex;

            
            node.localMatrix = mat4.create();
            node.matrix = mat4.create();

            if (node.translation)
            {
                mat4.setTranslation(node.localMatrix, node.translation);
            }

            if (node.rotation)
            {
                mat4.setRotation(node.localMatrix, node.rotation);
            }

            mat4.multiply(node.matrix, parentMatrix, node.localMatrix);

            if (node.mesh != undefined)
            {
                node.mesh = gltf.meshes[node.mesh];
            }

            if (node.children)
            {
                node.children.forEach((nodeIndex, index) => nodeHelper(nodeIndex, index, node.children, node.matrix));
            }

            if (node.skin != undefined)
            {
                node.skin = gltf.skins[node.skin];
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

        safeEach(gltf.materials, (material, i) => {

            let newMaterial = new GLTFMaterial();

            newMaterial.textures = {};
            newMaterial.factors = {};


            //material.bindTextures = GLTFMaterialBindTextures;
            const pbr = material.pbrMetallicRoughness;
            if(pbr)
            {
                newMaterial.textures.t_baseColor = resolveTextureAsset(pbr.baseColorTexture);
                newMaterial.textures.t_metallicRoughness = resolveTextureAsset(pbr.metallicRoughnessTexture);
                newMaterial.factors.u_baseColor = new Float32Array(pbr.baseColorFactor || [1,1,1,1]);
                newMaterial.factors.u_metallic = pbr.metallicFactor || 0;
                newMaterial.factors.u_roughness = pbr.roughnessFactor || 1;
            }

            newMaterial.textures.t_normal = resolveTextureAsset(material.normalTexture);
            newMaterial.textures.t_occlusion = resolveTextureAsset(material.occlusionTexture);
            newMaterial.textures.t_emissive = resolveTextureAsset(material.emissiveTexture);

            newMaterial.factors.u_emissive = new Float32Array(material.emissiveFactor || [0,0,0]);

            prune(newMaterial.textures);
            prune(newMaterial.factors);

            gltf.materials[i] = newMaterial;
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
                if (primitive.material != undefined)
                {
                    primitive.material = gltf.materials[primitive.material];
                }
                primitive.id = primId++;

                for (var attribName in primitive.attributes)
                {
                    const accessor = gltf.accessors[primitive.attributes[attribName]];
                    
                    const myAttribute = GLTFAttributeMap[attribName];

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
                        type : GLTFTypeMap[accessor.type + "_" + accessor.componentType],
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
                    start : ibv.gpuView.offset / GLTFIndexInfo[indexAccessor.componentType].size,
                }

                thiz.createPrimitiveCollisonData(gltf, primitive);

            })
        });

        gltf.primitiveCount = primId;

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

            prim.extents = new Vector3(positionAccessor.max[0] - positionAccessor.min[0], 
                positionAccessor.max[1] - positionAccessor.min[1],
                positionAccessor.max[2] - positionAccessor.min[2]);
            
            prim.extents.scale(0.5);

            prim.center = new Vector3(positionAccessor.max[0] + positionAccessor.min[0], 
                positionAccessor.max[1] + positionAccessor.min[1],
                positionAccessor.max[2] + positionAccessor.min[2]);
            prim.center.scale(0.5);

            if (prim.attributes.NORMAL)
            {
                let cpuBuff = gltf.accessors[prim.attributes.NORMAL].bufferView.cpuBuffer;
                prim.normals = new Float32Array(cpuBuff.buffer, cpuBuff.byteOffset, cpuBuff.byteLength / 4);
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