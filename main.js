import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
camera.position.z = 5;

const meshObjs = [];
const foodStrs = ["/sushi.png", "/apple.png"];

randomTick();
animate();

function getRandomLaunch() {
    const v0 = Math.random() * 10;
    const theta = Math.random() * Math.PI / 2;
    return { v0, theta };
}

function spawnFood() {
    const foodStr = foodStrs[Math.floor(Math.random() * foodStrs.length)];
    const geometry = new THREE.PlaneGeometry( 1, 1 );
    const texture = new THREE.TextureLoader().load(foodStr);
    const material = new THREE.MeshBasicMaterial( { map: texture } );
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    const { v0, theta } = getRandomLaunch();
    meshObjs.push({ mesh: mesh, v0: v0, theta: theta, start: Date.now()});
}

function randomTick() {
    setTimeout(() => {
        spawnFood();
        randomTick();
    }, Math.floor(Math.random() * 2000 + 1));
}

function animate() {
    requestAnimationFrame(animate);
    meshObjs.forEach((obj) => {
        const delta = (Date.now() - obj.start) / 1000;
        const mesh = obj.mesh;
        const v0 = obj.v0;
        const theta = obj.theta;
        mesh.position.x = v0 * Math.cos(theta) * delta;
        mesh.position.y = v0 * Math.sin(theta) * delta - 4.9 * delta ** 2;
    });
    renderer.render(scene, camera);
}
