export default class Model {
    constructor(gltfLoc, textureLoc, metallicRoughnessLoc, normalLoc, scale) {
        this.gltfLoc = gltfLoc;
        this.textureLoc = textureLoc;
        this.metallicRoughnessLoc = metallicRoughnessLoc;
        this.normalLoc = normalLoc;
        this.scale = scale;
    }
}