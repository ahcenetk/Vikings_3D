import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

export const scene = new THREE.Scene();

// DRACO — loader déclaré AVANT d'y attacher le draco ✅
export const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

export const gui = new GUI();

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 10, 15);

export const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

export const controls = new OrbitControls(camera, renderer.domElement);

controls.enablePan = false; //AJOUT: désactive le déplacement latéral

//AJOUT: Zoom min/max — reste dans la salle
controls.minDistance = 2;
controls.maxDistance = 15; // ← ajuste selon ta salle

//AJOUT: Rotation verticale — pas sous le sol ni au plafond
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 1.8;

//AJOUT: Rotation horizontale — reste dans la salle
controls.minAzimuthAngle = -Math.PI / 2;
controls.maxAzimuthAngle = Math.PI / 2;

controls.update(); //AJOUT: obligatoire pour appliquer tout ça