import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import Model from "./Model.js";

let scene, camera, renderer;
let raycaster, mouse;
let gtlfLoader;

const bgGroup = new THREE.Group();
const usrGroup = new THREE.Group();
const foodsGroup = new THREE.Group();

const MAX_SLICE_PTS = 10; // Max points in slice line
let sliceLineGeometry;
const mouseDragPositions = [];

let isSlicing = false;
let slicePoints = [];
let score = 0;

let rightX;
let topY;

const meshObjs = [];
const foodStrs = ["/sushi.png", "/apple.png"];

let models = new Map();

// Create a frustum object
const frustum = new THREE.Frustum();
const cameraViewProjectionMatrix = new THREE.Matrix4();

// Function to check if an object is visible
function isObjectVisible(object, camera) {
  camera.updateMatrixWorld(); // Ensure the camera is updated
  cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

  return frustum.intersectsObject(object); // Returns true if visible, false if not
}

init();
randomTick();
// spawnFood();
animate();

// const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// const material = new THREE.MeshStandardMaterial({
//   color: 0x0077ff,
//   side: THREE.DoubleSide,
//   clippingPlanes: [plane], // Apply clipping plane
//   clipShadows: true,
// });

// // const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 

// // Create mesh
// const geometry = new THREE.BoxGeometry(2, 2, 2);
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);


function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 5;
    renderer.localClippingEnabled = true;
    scene.background = new THREE.Color(0xFFFFFF);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    gtlfLoader = new GLTFLoader();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 4);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    bgGroup.add(ambientLight);
    bgGroup.add(light);
    scene.add(bgGroup);

    const coord = getHeight(camera);
    topY = coord.y;
    rightX = coord.x;

    // Create empty slice line
    const emptyPositions = new Float32Array(MAX_SLICE_PTS * 3).fill(0); // Flattened positiosn
    sliceLineGeometry = new LineGeometry();
    sliceLineGeometry.setPositions(emptyPositions);

    // Slice Line material
    const material = new LineMaterial({
        color: 0xff0000,
        linewidth: 4,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        transparent: true,
        opacity: 1.0,
      });
    const sliceLine = new Line2(sliceLineGeometry, material);
    usrGroup.add(sliceLine);
    scene.add(usrGroup);

    scene.add(foodsGroup);

    // Load Models
    const chocolateCake = new Model("/chocolate_cake/scene.gltf", "/chocolate_cake/textures/Cake_Baked_baseColor.jpeg", "/chocolate_cake/textures/Cake_Baked_metallicRoughness.png", "/chocolate_cake/textures/Cake_Baked_normal.jpeg", 10);
    const croissant = new Model("/starbucks_butter_croissant/scene.gltf", "/starbucks_butter_croissant/textures/ps_sbxCroissant_baseColor.jpeg", "/starbucks_butter_croissant/textures/ps_sbxCroissant_metallicRoughness.png", "/starbucks_butter_croissant/textures/ps_sbxCroissant_normal.jpeg", 10);
    models.set("chocolateCake", chocolateCake);
    // models.set("croissant", croissant);
}

function randomTick() {
    setTimeout(() => {
        spawnFood();
        randomTick();
    }, 2000
    // Math.floor(Math.random() * 2000 + 1)
    );
}

let count = 0;
function animate() {
    requestAnimationFrame(animate);

    // FIXME: trying to remove mesh when it leaves screen
    // console.log(meshObjs);
    // for (let i = meshObjs.length - 1; i >= 0; i--) {
    //     const mesh = meshObjs[i].mesh;

    //     if (count < 1) {
    //         console.log(mesh);
    //         count++;
    //     }

    //     if (mesh && mesh.geometry && count < 1) {
    //         console.log("object exists");
    //         if (isObjectVisible(mesh, camera)) continue;

    //     console.log("Mesh left the screen, removing...");
    //     // meshObjs.splice(i, 1);
    //     // foodsGroup.remove(mesh);
    //     }
    //     count++;        
    // }

    meshObjs.forEach((obj) => {
        const delta = (Date.now() - obj.start) / 1000;
        const mesh = obj.mesh;
        const v0 = obj.v0;
        const theta = obj.theta;
        // mesh.position.x = -1 * rightX + v0 * Math.cos(theta) * delta;
        // mesh.position.y = -1 * topY + v0 * Math.sin(theta) * delta - 4.9 * delta ** 2;
        
        // mesh.rotation.z += 0.01;
        // mesh.rotation.x += 0.01;
        // mesh.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}

function spawnFood() {
    const keys = Array.from(models.keys());
    const index = Math.floor(Math.random() * keys.length);
    const model = models.get(keys[index]);
    // const model = models.get("chocolateCake");
    loadModel(model);
    // gtlfLoader.load(
    //     '/chocolate_cake/scene.gltf', 
    //     function (gltf) {
    //         const textureLoader = new THREE.TextureLoader();
    //         const texture = textureLoader.load('/chocolate_cake/textures/Cake_Baked_baseColor.jpeg');
    //         const metallicRoughnessTexture = textureLoader.load("/chocolate_cake/textures/Cake_Baked_metallicRoughness.png");
    //         const normalTexture = textureLoader.load("/chocolate_cake/textures/Cake_Baked_normal.jpeg");
    //         texture.colorSpace = THREE.SRGBColorSpace
    //         gltf.scene.traverse((child) => {
    //             if (child.isMesh && child.material) {
    //                 child.material.map = texture;
    //                 child.material.normalMap = normalTexture;
    //                 child.material.metalnessMap = metallicRoughnessTexture;
    //                 child.material.roughnessMap = metallicRoughnessTexture;
        
    //                 // Optional: Adjust metalness/roughness values
    //                 child.material.metalness = 0.5; // Adjust for brightness
    //                 child.material.roughness = 0.3; // Lower for shinier surface
                    
    //                 child.material.needsUpdate = true;
    //             }
    //         });
    //         gltf.scene.position.set(0, 0, 0);
    //         gltf.scene.scale.set(10, 10, 10);
    //         foodsGroup.add(gltf.scene);
    //         // scene.add(foodsGroup);

    //         const { v0, theta } = getRandomLaunch();
    //         meshObjs.push({ mesh: gltf.scene, v0: v0, theta: theta, start: Date.now()});
    //     },
    //     function (xhr) {
    //         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    //     },
    //     function (error) {
    //         console.error('An error happened', error);
    //     }
    // );
}

function loadModel(model) {
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
                }
            });
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.scale.set(model.scale, model.scale, model.scale);
            foodsGroup.add(gltf.scene);

            const { v0, theta } = getRandomLaunch();
            meshObjs.push({ mesh: gltf.scene, v0: v0, theta: theta, start: Date.now()});
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );
}

function spawnFood2D() {
    const foodStr = foodStrs[Math.floor(Math.random() * foodStrs.length)];
    const geometry = new THREE.PlaneGeometry( 1, 1 );
    const texture = new THREE.TextureLoader().load(foodStr);
    const material = new THREE.MeshBasicMaterial( { map: texture } );
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    const { v0, theta } = getRandomLaunch();
    meshObjs.push({ mesh: mesh, v0: v0, theta: theta, start: Date.now()});
}

function getRandomLaunch() {
    // TODO: add random launch point from -width to 0
    const v0 = Math.random() * 10 + 5; // Speed 5 to 15
    const thetaDeg = Math.random() * 50 + 30; // 30 to 80 degrees
    const theta = THREE.MathUtils.degToRad(thetaDeg);
    return { v0, theta };
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

    if (slicePoints.length > 0) updateScore();

    // if (slicePoints.length >= 2) {
    //     updateScore();
    // }
});

window.addEventListener("mousemove", (event) => {
    if (!isSlicing) return;

    // Normalize mouse position from -1 to 1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Check for intersections between mouse and scene objects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(foodsGroup.children);

    if (intersects.length > 0) {
        console.log("intersects");
        const topMesh = intersects[0];
        slicePoints.push(topMesh.point);
    }

    // Calculate mouse position based on screen size
    const x = rightX * mouse.x;
    const y = topY * mouse.y;

    mouseDragPositions.push(new THREE.Vector3(x, y, 0));
    if (mouseDragPositions.length > MAX_SLICE_PTS) mouseDragPositions.shift();
    const flattenedPositions = mouseDragPositions.flatMap(vec => [vec.x, vec.y, vec.z]);

    sliceLineGeometry.setPositions(flattenedPositions);
    sliceLineGeometry.computeBoundingSphere(); 
});

function updateScore() {
    score++;
    document.getElementById("score").innerHTML = score;
}
  