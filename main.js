import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setAnimationLoop(animate);
document.body.appendChild( renderer.domElement );

const foods = ["/sushi.png", "/apple.png"];

const foodMeshes = [];
for (let i = 0; i < 3; i++) {
    const food = foods[Math.floor(Math.random() * foods.length)];

    const geometry = new THREE.PlaneGeometry( 1, 1 );
    const texture = new THREE.TextureLoader().load(food);
    const material = new THREE.MeshBasicMaterial( { map: texture } );
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const { v0, theta } = launchRandom();
    foodMeshes.push({ mesh: mesh, v0: v0, theta: theta });
}

camera.position.z = 5;

animate();

function animate(time) {
    time *= 0.001;

    foodMeshes.forEach((foodMesh, index) => {
        const mesh = foodMesh.mesh;
        const v0 = foodMesh.v0;
        const theta = foodMesh.theta;
        mesh.position.x = v0 * Math.cos(theta) * time;
        mesh.position.y = v0 * Math.sin(theta) * time - 4.9 * time ** 2;
        
    });

    renderer.render(scene, camera);

    if (time > 10) return; // to make sure it doesn't go forever
    requestAnimationFrame(animate);
}

function launchRandom() {
    const v0 = Math.random() * 10;
    const theta = Math.random() * Math.PI / 2;
    return { v0, theta };
}