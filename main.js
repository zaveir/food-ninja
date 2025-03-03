import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop(animate);
document.body.appendChild( renderer.domElement );

const geometry = new THREE.PlaneGeometry( 1, 1 );
const texture = new THREE.TextureLoader().load( "/sushi.png" );
const material = new THREE.MeshBasicMaterial( { map: texture } );
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

camera.position.z = 5;

const { v0, theta } = launchRandom();

function animate(time) {
    time *= 0.001;

    plane.position.x = v0 * Math.cos(theta) * time;
    plane.position.y = v0 * Math.sin(theta) * time - 4.9 * time ** 2;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function launchRandom() {
    const v0 = Math.random() * 10;
    const theta = Math.random() * Math.PI / 2;
    return { v0, theta };
}