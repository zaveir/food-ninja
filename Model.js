export default class Model {
    constructor(gltfLoc, textureLoc, metallicRoughnessLoc, normalLoc, scale = 1, xRot0 = 0) {
        this.gltfLoc = gltfLoc;
        this.textureLoc = textureLoc;
        this.metallicRoughnessLoc = metallicRoughnessLoc;
        this.normalLoc = normalLoc;
        this.scale = scale;
        this.xRot0 = xRot0;
    }
}