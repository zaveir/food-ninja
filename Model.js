export default class Model {
    constructor(gltfLoc, textureLoc, metallicRoughnessLoc, normalLoc, scale = 1, xRot0 = 0) {
        const baseUrl = import.meta.env.BASE_URL;

        this.gltfLoc = `${baseUrl}${gltfLoc}`;
        this.textureLoc = `${baseUrl}${textureLoc}`;
        this.metallicRoughnessLoc = `${baseUrl}${metallicRoughnessLoc}`;
        this.normalLoc = `${baseUrl}${normalLoc}`;
        this.scale = scale;
        this.xRot0 = xRot0;
    }
}