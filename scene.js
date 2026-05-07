import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CollisionSystem } from './src/collision/CollisionSystem.js';
import { PlayerController } from './src/controls/PlayerController.js';
import { settingsStore } from './src/ui/settingsStore.js';
import {
    CAMERA_EYE_HEIGHT,
    ENABLE_FLY_MODE,
    FLY_SPEED,
    MOVE_SPEED,
    PLAYER_HEIGHT,
    PLAYER_RADIUS
} from './src/config/playerSettings.js';

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
const initialSettings = settingsStore.getState();

function createHiddenGuiStub() {
    const controller = {
        name() { return this; },
        onChange() { return this; },
        listen() { return this; },
        min() { return this; },
        max() { return this; },
        step() { return this; }
    };

    const folder = {
        add() { return controller; },
        addColor() { return controller; },
        addFolder() { return folder; },
        close() { return folder; },
        open() { return folder; },
        hide() { return folder; },
        destroy() {}
    };

    return folder;
}

// Compatibilite avec les anciens modules d'objets qui importent encore `gui`.
// Aucun panneau dat.GUI n'est cree ni affiche.
export const gui = createHiddenGuiStub();

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
// PlayerController FPS
// ──────────────────────────────────────────────
export const collisionSystem = new CollisionSystem({
    scene,
    player: {
        radius: PLAYER_RADIUS,
        height: initialSettings.playerHeight ?? PLAYER_HEIGHT,
        eyeHeight: initialSettings.cameraHeight ?? CAMERA_EYE_HEIGHT,
        skinWidth: 0.025
    }
});

export const controls = new PlayerController(camera, renderer.domElement, collisionSystem, {
    moveSpeed: initialSettings.moveSpeed ?? MOVE_SPEED,
    flySpeed: FLY_SPEED,
    flyMode: initialSettings.flyMode ?? ENABLE_FLY_MODE,
    pointerSpeed: 0.85,
    gravityEnabled: false
});

export const playerController = controls;
