import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import Model from "./Model.js";

/**
 * TODO
 * Intro 
 * End game screen
 * Game levels: beginner (no lost points), intermediate, difficult
 * Maybe 2 choices: difficulty level, and food mode (fruit vs dessert vs both)
 */

let scene, camera, renderer;
let raycaster, mouse;
let textureLoader, gtlfLoader;

const bgGroup = new THREE.Group();
const usrGroup = new THREE.Group();
const foodsGroup = new THREE.Group();
const splatterGroup = new THREE.Group();

let swordMesh;
let swordLen; // Length of sword
let swordRotate; // Angle of rotation to make sword point into screen
let swordTilt; // Angle of tilt of sword about x so it gleams
const MAX_SLICE_PTS = 10; // Max points in slice line
let sliceLineGeometry;
const mouseDragPositions = [];
let isSlicing = false;
let slicePoints = [];
let slicedMesh;
let score = 0;

let rightX, topY;

const meshObjs = [];
let models = new Map();

let seconds = 30;
let difficulty, mode;

window.onload = function(){
    const urlParams = new URLSearchParams(window.location.search);
    difficulty = urlParams.get("difficulty");
    mode = urlParams.get("mode");

    init();
    setInterval(updateTimer, 1000);
    randomTick();
    // spawnFood();
    animate();
};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: false, premultipliedAlpha: false, antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    renderer.getContext().clearColor(0, 0, 0, 1);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 5;
    renderer.localClippingEnabled = true;

    textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("/wood2.png");
    scene.background = texture;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    gtlfLoader = new GLTFLoader();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    const light = new THREE.DirectionalLight(0xffffff, 2);
    const light2 = new THREE.DirectionalLight(0xffffff, 2);
    const light3 = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 1, 0);
    light2.position.set(-0.5, 1, 0);
    light3.position.set(0.5, 1, 0);
    bgGroup.add(ambientLight);
    bgGroup.add(light);
    bgGroup.add(light2);
    bgGroup.add(light3);
    scene.add(bgGroup);

    const coord = getHeight(camera);
    topY = coord.y;
    rightX = coord.x;

    const swordModel = new Model("/knife_low-poly/scene.gltf", "/knife_low-poly/textures/Knife_baseColor.png", "/knife_low-poly/textures/Knife_metallicRoughness.png", "/knife_low-poly/textures/Knife_normal.png", 0.03);
    swordLen = 1.8;
    swordRotate = Math.PI / 2;
    swordTilt = Math.PI / 6;
    loadModel(swordModel, false);

    // Create empty slice line
    const emptyPositions = new Float32Array(MAX_SLICE_PTS * 3).fill(0); // Flattened positiosn
    sliceLineGeometry = new LineGeometry();
    sliceLineGeometry.setPositions(emptyPositions);

    // Slice Line material
    const material = new LineMaterial({
        color: 0xffffff,
        linewidth: 4,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        // transparent: true,
        opacity: 1.0,
      });
    const sliceLine = new Line2(sliceLineGeometry, material);
    usrGroup.add(sliceLine);
    scene.add(usrGroup);

    scene.add(foodsGroup);
    scene.add(splatterGroup);

    mode === "fruit" ? createFruits() : createDesserts();
}

function updateTimer() {
    document.getElementById("timer").innerHTML = seconds;
    
    if (seconds === 0) {
        window.location.href = "end.html";
    } 

    seconds--;
}

function randomTick() {
    setTimeout(() => {
        spawnFood();
        randomTick();
    }, Math.floor(Math.random() * 2000 + 1));
}

function createFruits() {
    const orange = new Model("/cara_cara_orange/scene.gltf", "/cara_cara_orange/textures/fr_caraOrange_diffuse.jpeg", "/cara_cara_orange/textures/fr_caraOrange_diffuse.jpeg","/cara_cara_orange/textures/fr_caraOrange_normal.jpeg", 10);
    const watermelon = new Model("/watermelon/scene.gltf", "/watermelon/textures/WaterMelon_Baked_baseColor.png", "/watermelon/textures/WaterMelon_Baked_metallicRoughness.png", "/watermelon/textures/WaterMelon_Baked_normal.png", 1.4);
    const apple = new Model("/red_apple/scene.gltf", "/red_apple/textures/Apple_Baked_baseColor.png", "/red_apple/textures/Apple_Baked_metallicRoughness.png", "/red_apple/textures/Apple_Baked_normal.png", 0.6, 3 * Math.PI / 2);
    const pear = new Model("/lowpoly_pear/scene.gltf", "/lowpoly_pear/textures/Material.001_baseColor.png", "/lowpoly_pear/textures/Material.001_metallicRoughness.png", "/lowpoly_pear/textures/Material.001_normal.png", 0.4, 3 * Math.PI / 2);
    const lemon = new Model("/lemon/scene.gltf", "/lemon/textures/Lemon_baseColor.png", "/lemon/textures/Lemon_metallicRoughness.png", "/lemon/textures/Lemon_normal.png", 0.1);
    const lime = new Model("/persian_lime/scene.gltf", "/persian_lime/textures/fr_persianLime_diffuse.jpeg", "/persian_lime/textures/fr_persianLime_specularGlossiness.png", "/persian_lime/textures/fr_persianLime_normal.jpeg", 12);
    const carrot = new Model("/carrot_free/scene.gltf", "/carrot_free/textures/Material_baseColor.png", "/carrot_free/textures/Material_metallicRoughness.png", "/carrot_free/textures/Material_normal.png", 0.18, Math.PI / 2);
    const broccoli = new Model("/broccoli/broccoli_v3.gltf", "/broccoli/broccoli_brobody_Mat_BaseColor.png", "/broccoli/broccoli_brobody_Mat_AO-broccoli_brobody_Mat_Roughness-broccoli_brobody_Mat_Metallic.png", "/broccoli/broccoli_brobody_Mat_Normal.png", 5);
    const balloon = new Model("/balloon/shar.gltf", "/balloon/textures/shar_DefaultMaterial_BaseColor.png", "/balloon/textures/shar_DefaultMaterial_OcclusionRoughnessMetallic.png", "/balloon/textures/shar_DefaultMaterial_Normal.png", 0.03);
    const banana = new Model("/banana_3d_scanned/scene.gltf", "/banana_3d_scanned/textures/banana_baseColor.png", null, null, 5);
    const strawberry = new Model("/strawberry/scene.gltf", "/strawberry/textures/Strawberry_baseColor.jpeg", "/strawberry/textures/Strawberry_metallicRoughness.png", "/strawberry/textures/Strawberry_normal.png", 0.12);
    const pineapple = new Model("/pineapple_fruit_1/scene.gltf", "/pineapple_fruit_1/textures/default_baseColor.jpeg", null, null, 1.5);
    models.set("orange", orange); 
    // models.set("watermelon", watermelon);
    // models.set("apple", apple); 
    // models.set("pear", pear);
    // models.set("lemon", lemon);
    // models.set("lime", lime); 
    // models.set("carrot", carrot); 
    // models.set("broccoli", broccoli); 
    // models.set("cakepop", cakepop);
    // models.set("banana", banana);
    // models.set("strawberry", strawberry);
    // models.set("pineapple", pineapple);
    if (difficulty !== "beginner") {
        models.set("balloon", balloon); 
    }
}

function createDesserts() {
    const chocolateCake = new Model("/chocolate_cake/scene.gltf", "/chocolate_cake/textures/Cake_Baked_baseColor.jpeg", "/chocolate_cake/textures/Cake_Baked_metallicRoughness.png", "/chocolate_cake/textures/Cake_Baked_normal.jpeg", 0.5);
    const croissant = new Model("/starbucks_butter_croissant/scene.gltf", "/starbucks_butter_croissant/textures/ps_sbxCroissant_baseColor.jpeg", "/starbucks_butter_croissant/textures/ps_sbxCroissant_metallicRoughness.png", "/starbucks_butter_croissant/textures/ps_sbxCroissant_normal.jpeg", 9);
    const iceCream = new Model("/ice_cream/scene.gltf", "/ice_cream/textures/ice_cream_baseColor.jpeg", "/ice_cream/textures/ice_cream_metallicRoughness.png", "/ice_cream/textures/ice_cream_normal.png", 3, 3 * Math.PI / 2);
    const donutSprinkled = new Model("/realistic_sprinkled_doughnut_scan/scene.gltf", "/realistic_sprinkled_doughnut_scan/textures/poly_0_baseColor.jpeg", null, null, 3, Math.PI);
    const donut = new Model("/donut/scene.gltf", "/donut/textures/Donut_baseColor.png", null, "/donut/textures/Donut_normal.png", 0.4);
    const yeast = new Model("/3d_scanned_yeast_plait/scene.gltf", "/3d_scanned_yeast_plait/textures/yeast-dough_baseColor.png", null, null, 20);
    const yogurt = new Model("/yogurt/scene.gltf", "/yogurt/textures/yaourt_baseColor.png", "/yogurt/textures/yaourt_metallicRoughness.png", "/yogurt/textures/yaourt_normal.png", 1.5);
    const cake = new Model("/amandas_chocolate_birthday_cake_scan/scene.gltf", "/amandas_chocolate_birthday_cake_scan/textures/birthdaycake_u1_v1_baseColor.png", null, null, 0.08, Math.PI);
    const cakepop = new Model("/cakepop/Cake_ Pop.gltf", "/cakepop/Cake_Pop_bcolor.png", "/cakepop/Cake_Pop_ao-Cake_Pop_rough-Cake_Pop_metal.png", "/cakepop/Cake_Pop_norm.png", 0.1);
    const balloon = new Model("/balloon/shar.gltf", "/balloon/textures/shar_DefaultMaterial_BaseColor.png", "/balloon/textures/shar_DefaultMaterial_OcclusionRoughnessMetallic.png", "/balloon/textures/shar_DefaultMaterial_Normal.png", 0.03);
    const oatCake = new Model("/oatCake/Oat_Cake_FBX.gltf", "/oatCake/Oat_Cake_Texture4K/Oat_Cakes_Base_Color.png", "/oatCake/Oat_Cake_Texture4K/Oat_Cakes_Metallic.png", "/oatCake/Oat_Cake_Texture4K/Oat_Cakes_Normal_DirectX.png", 0.08);
    const poundCake = new Model("/poundCake/Pound_Cake_FBX.gltf", "/poundCake/Pound_Cake_Texture4k/PoundCake__Base_Color.png", "/poundCake/Pound_Cake_Texture4k/PoundCake__Metallic.png", "/poundCake/Pound_Cake_Texture4k/PoundCake__Normal_DirectX.png", 0.07);
    const cornishPastry = new Model("/cornish_pasty/scene.gltf", "/cornish_pasty/textures/Default_Material_baseColor.png", "/cornish_pasty/textures/Default_Material_metallicRoughness.png", "/cornish_pasty/textures/Default_Material_normal.png", 0.006);
    // models.set("chocolateCake", chocolateCake);
    models.set("croissant", croissant);
    // models.set("iceCream", iceCream); 
    // models.set("donutSprinkled", donutSprinkled);
    // models.set("donut", donut);
    // models.set("yeast", yeast);
    // models.set("yogurt", yogurt); 
    // models.set("cake", cake);
    // models.set("cakepop", cakepop);
    // models.set("oatCake", oatCake);
    // models.set("poundCake", poundCake);
    // models.set("cornishPastry", cornishPastry);
    if (difficulty !== "beginner") {
        models.set("balloon", balloon); 
    }
}

function animate() {
    requestAnimationFrame(animate);

    meshObjs.forEach((obj) => {
        const delta = (Date.now() - obj.start) / 1000;
        const mesh = obj.mesh;
        const v0 = obj.v0;
        const theta = obj.theta;
        mesh.position.x = obj.x0 + v0 * Math.cos(theta) * delta;
        mesh.position.y = -1 * topY + v0 * Math.sin(theta) * delta - 4.9 * delta ** 2;
        
        mesh.rotation.x = obj.xRot0 + delta * obj.xRot;
        mesh.rotation.y += obj.yRot;
        mesh.rotation.z += obj.zRot;
    });

    renderer.render(scene, camera);
}

function spawnFood() {
    const keys = Array.from(models.keys());
    const index = Math.floor(Math.random() * keys.length);
    const model = models.get(keys[index]);
    loadModel(model, true);
}

function loadModel(model, isFood = true) {
    gtlfLoader.load(
        model.gltfLoc, 
        function (gltf) {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(model.textureLoc);
            const metallicRoughnessTexture = model.metallicRoughnessLoc ? textureLoader.load(model.metallicRoughnessLoc) : null;
            const normalTexture = model.normalLoc? textureLoader.load(model.normalLoc) : null;
            texture.colorSpace = THREE.SRGBColorSpace
            gltf.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.map = texture;
                    child.material.normalMap = normalTexture;
                    child.material.metalnessMap = metallicRoughnessTexture || null;
                    child.material.roughnessMap = metallicRoughnessTexture || null;
                    child.material.needsUpdate = true;

                    child.position.set(0, 0, 0);
                    child.scale.set(model.scale, model.scale, model.scale);

                    if (isFood) {
                        foodsGroup.add(child);
                        const { v0, theta, x0, xRot, yRot, zRot } = getRandomLaunch();
                        meshObjs.push({ mesh: child, v0: v0, theta: theta, x0: x0, xRot0: model.xRot0, xRot: xRot, yRot: yRot, zRot: zRot, start: Date.now()});
                    } else {
                        swordMesh = child;
                        usrGroup.add(swordMesh);
                        swordMesh.position.z = swordLen / 2 * Math.cos(swordTilt); // Tilting sword decreases distance in z
                        swordMesh.rotation.x = swordRotate + swordTilt; // Rotate sword to point in screen, then tilt a bit so it gleams
                    }
                }
            });
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );
}

function getRandomLaunch() {
    const v0 = Math.random() * 10 + 5; // Speed 5 to 15
    const thetaDeg = Math.random() * 50 + 40; // Launch angle 40 to 90 degrees
    const theta = THREE.MathUtils.degToRad(thetaDeg);
    const x0 = -1 * Math.random() * rightX;
    const xRot = Math.random() * 2 - 1; // -1 to 1 (since x rotation calculated specially)
    const yRot = Math.random() * 0.02 - 0.01; // -0.01 to 0.01
    const zRot = Math.random() * 0.02 - 0.01; // -0.01 to 0.01
    return { v0, theta, x0, xRot, yRot, zRot };
}

function getHeight(camera) {
    const fov = camera.fov;
    const z = camera.position.z;
    const fovRad = THREE.MathUtils.degToRad(fov);
    const frustumHeight = 2 * z * Math.tan(fovRad / 2);
    const topY = frustumHeight / 2;

    const frustumWidth = frustumHeight * camera.aspect;
    const rightX = frustumWidth / 2;
    return { x: rightX, y: topY };
}

window.addEventListener("mousedown", (event) => {
    isSlicing = true;
    slicePoints.length = 0;
});

window.addEventListener("mouseup", () => {
    isSlicing = false;

    mouseDragPositions.length = 0;
  
    const emptyPositions = new Float32Array(MAX_SLICE_PTS * 3).fill(0);
    sliceLineGeometry.setPositions(emptyPositions);
    sliceLineGeometry.computeBoundingSphere();

    if (slicePoints.length > 0) {
        if (slicedMesh) disappear(slicedMesh);

        let planeGeo;
        let splatterTexture;

        if (slicedMesh.name === "shar") {
            updateScore(-1);
            planeGeo = new THREE.PlaneGeometry(1.5, 1.5);
            splatterTexture = new THREE.TextureLoader().load("/pop.png");
        } else {
            updateScore(1);
            planeGeo = new THREE.PlaneGeometry(1.5, 1.5);
            splatterTexture = new THREE.TextureLoader().load("/splatter.png");
        }

        const planeMaterial = new THREE.MeshBasicMaterial( { map: splatterTexture, transparent: true, alphaTest: 0.5 } );
        const plane = new THREE.Mesh(planeGeo, planeMaterial);
        plane.position.set(...slicedMesh.position);
        splatterGroup.add(plane);
    }

    slicedMesh = null;
});

function disappear(mesh) {
    foodsGroup.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh = null;
}

window.addEventListener("mousemove", (event) => {
    // Normalize mouse position from -1 to 1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Calculate mouse position based on screen size
    const x = rightX * mouse.x;
    const y = topY * mouse.y;

    swordMesh.position.x = x;
    swordMesh.position.y = y - Math.sin(swordTilt); // Tilting sword means sword center Y below mouse Y (when Y is negative on bottom half of screen)
    
    if (!isSlicing) return;

    // Check for intersections between mouse and scene objects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(foodsGroup.children);

    if (intersects.length > 0) {
        const topMesh = intersects[0];
        slicedMesh = topMesh.object;
        slicePoints.push(topMesh.point);
    }

    mouseDragPositions.push(new THREE.Vector3(x, y, 0));
    if (mouseDragPositions.length > MAX_SLICE_PTS) mouseDragPositions.shift();
    const flattenedPositions = mouseDragPositions.flatMap(vec => [vec.x, vec.y, vec.z]);

    sliceLineGeometry.setPositions(flattenedPositions);
    sliceLineGeometry.computeBoundingSphere(); 
});

function updateScore(value) {
    score += value;
    document.getElementById("score").innerHTML = `Score: ${score}`;
}
  