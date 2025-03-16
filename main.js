import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

let scene, camera, renderer;
let raycaster, mouse;
let gtlfLoader;

const MAX_SLICE_PTS = 100; // Max points in slice line
let sliceLineGeometry;
const mouseDragPositions = [];

let sliceLine;
let isSlicing = false;
let slicePoints = [];
let score = 0;

let rightX;
let topY;

const meshObjs = [];
const foodStrs = ["/sushi.png", "/apple.png"];

// TODO: remove mesh when it leaves screen (maybe also remove the line)
// TODO: check scene.children to see if line is in scene

init();
randomTick();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 5;
    scene.background = new THREE.Color(0xFFFFFF);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    gtlfLoader = new GLTFLoader();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 4); // Color: White, Intensity: 1.5
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(ambientLight);
    scene.add(light);

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
    scene.add(sliceLine);
}

function randomTick() {
    setTimeout(() => {
        spawnFood();
        randomTick();
    }, 5000)
    // Math.floor(Math.random() * 2000 + 1)); // FIXME: was 2000
}

function animate() {
    requestAnimationFrame(animate);
    meshObjs.forEach((obj) => {
        const delta = (Date.now() - obj.start) / 1000;
        const mesh = obj.mesh;
        const v0 = obj.v0;
        const theta = obj.theta;
        mesh.position.x = -1 * rightX + v0 * Math.cos(theta) * delta;
        mesh.position.y = -1 * topY + v0 * Math.sin(theta) * delta - 4.9 * delta ** 2;
        
        // mesh.rotation.z += 0.01;
        // mesh.rotation.x += 0.01;
        // mesh.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}

function spawnFood() {
    gtlfLoader.load(
        '/chocolate_cake/scene.gltf', 
        function (gltf) {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load('/chocolate_cake/textures/Cake_Baked_baseColor.jpeg');
            const metallicRoughnessTexture = textureLoader.load("/chocolate_cake/textures/Cake_Baked_metallicRoughness.png");
            const normalTexture = textureLoader.load("/chocolate_cake/textures/Cake_Baked_normal.jpeg");
            texture.colorSpace = THREE.SRGBColorSpace
            gltf.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.map = texture;
                    child.material.normalMap = normalTexture;
                    child.material.metalnessMap = metallicRoughnessTexture;
                    child.material.roughnessMap = metallicRoughnessTexture;
        
                    // Optional: Adjust metalness/roughness values
                    child.material.metalness = 0.5; // Adjust for brightness
                    child.material.roughness = 0.3; // Lower for shinier surface
                    
                    child.material.needsUpdate = true;
                }
            });
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.scale.set(10, 10, 10);
            scene.add(gltf.scene);

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
    slicePoints = []; // FIXME: maybe slicePoints.length = 0? Because registering point when didn't slice
});

window.addEventListener("mouseup", () => {
    isSlicing = false;

    mouseDragPositions.length = 0;
  
    const emptyPositions = new Float32Array(MAX_SLICE_PTS * 3).fill(0);
    sliceLineGeometry.setPositions(emptyPositions);
    sliceLineGeometry.computeBoundingSphere();

    if (slicePoints.length >= 2) {
        updateScore();
    }
});

window.addEventListener("mousemove", (event) => {
    if (!isSlicing) return;

    // Normalize mouse position from -1 to 1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Check for intersections between mouse and scene objects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
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
  