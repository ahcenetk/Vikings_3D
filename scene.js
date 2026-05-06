import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

export const scene = new THREE.Scene();

// ──────────────────────────────────────────────
// LoadingManager partagé : tous les loaders y rapportent leur progrès
// ──────────────────────────────────────────────
export const loadingManager = new THREE.LoadingManager();

// GLTFLoader + DRACO branchés sur le manager
export const loader = new GLTFLoader(loadingManager);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

// TextureLoader partagé (fond, etc.) — également suivi par le manager
export const textureLoader = new THREE.TextureLoader(loadingManager);

export const gui = new GUI();

// ──────────────────────────────────────────────
// Caméra
// ──────────────────────────────────────────────
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 10, 15);

// ──────────────────────────────────────────────
// Renderer optimisé
// ──────────────────────────────────────────────
export const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three-canvas'),
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false; // pas d'ombres → moins de calculs par frame

// ──────────────────────────────────────────────
// OrbitControls
// ──────────────────────────────────────────────
export const controls = new OrbitControls(camera, renderer.domElement);

controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 15;
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 1.8;
controls.minAzimuthAngle = -Math.PI / 2;
controls.maxAzimuthAngle = Math.PI / 2;

controls.update();
