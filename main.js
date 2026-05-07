import * as THREE from 'three';
import { scene, camera, renderer, controls, loader, textureLoader, collisionSystem } from './scene.js';
import { audioManager } from './src/audio/AudioManager.js';
import { createCollidersFromGLTF, createWallColliders } from './src/collision/ColliderFactory.js';
import { GameSettingsMenu } from './src/ui/GameSettingsMenu.js';
import { settingsStore } from './src/ui/settingsStore.js';
import {
    CAMERA_EYE_HEIGHT,
    PLAYER_START_POSITION
} from './src/config/playerSettings.js';
import './Objets_config/dieu.js';
import './Objets_config/berserker.js';
import './Objets_config/ivar.js';
import './Objets_config/drakkar.js';
import './Objets_config/armure.js';
import './Objets_config/shield.js';
import './Objets_config/thor.js';
import './Objets_config/epee.js';
import './Objets_config/hache.js';
import './Objets_config/corne.js';
import './Objets_config/hache_ivar.js';
import './Objets_config/amleth.js';
import './Objets_config/corne_a_boire.js';
import './Objets_config/torche.js';
import './Objets_config/bouclier_berk.js';
import './Objets_config/collier_bjorn.js';
import './Objets_config/pendentif_cercle.js';
import './Objets_config/pendentif_leif.js';
import { initGame, updateGameAnimations } from './gameManager.js';

// ──────────────────────────────────────────────
// FOND (texture suivie par le LoadingManager)
// ──────────────────────────────────────────────
const bgTexture = textureLoader.load('/Arriere_plan.webp');
bgTexture.colorSpace = THREE.SRGBColorSpace;
bgTexture.minFilter = THREE.LinearFilter;
bgTexture.generateMipmaps = false;
scene.background = bgTexture;

// ──────────────────────────────────────────────
// LUMIÈRES
// ──────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 2));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = false;
scene.add(directionalLight);

// Audio global non positionnel. La lecture reelle demarre apres le premier
// geste utilisateur pour rester compatible avec les navigateurs.
audioManager.initAudio(camera);
audioManager.loadAmbientMusic().catch((error) => {
    console.warn('Musique ambiante indisponible.', error);
});
window.addEventListener('beforeunload', () => audioManager.dispose(), { once: true });

const settingsMenu = new GameSettingsMenu({
    audioManager,
    controls,
    collisionSystem,
    scene,
    camera
});

// Colliders fixes, separes du mesh visuel. Ajuster VIKING_HALL_COLLIDER_LAYOUT
// dans ColliderFactory.js pour modifier la zone jouable.
createWallColliders({ collisionSystem });

// ──────────────────────────────────────────────
// SALLE VIKING
// ──────────────────────────────────────────────
loader.load('/viking_dining_hall.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.updateMatrixWorld(true);

    const generatedColliders = createCollidersFromGLTF(model, {
        collisionSystem,
        source: 'viking-dining-hall',
        shrink: settingsStore.getState().colliderShrink
    });

    if (generatedColliders.length > 0) {
        console.info(`${generatedColliders.length} colliders GLTF crees pour la salle viking.`);
    }
});

// ──────────────────────────────────────────────
// CAMÉRA
// ──────────────────────────────────────────────
const initialSettings = settingsStore.getState();
camera.position.set(
    PLAYER_START_POSITION.x,
    PLAYER_START_POSITION.y - CAMERA_EYE_HEIGHT + initialSettings.cameraHeight,
    PLAYER_START_POSITION.z
);
controls.lookAt(new THREE.Vector3(0, camera.position.y - 0.1, 0));

// ──────────────────────────────────────────────
// RESIZE
// ──────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });

// ──────────────────────────────────────────────
// BOUCLE D'ANIMATION (cap soft à ~60 FPS, zéro alloc)
// ──────────────────────────────────────────────
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastFrameTime = 0;
let started = false;

function animate(currentTime) {
    requestAnimationFrame(animate);

    const elapsed = currentTime - lastFrameTime;
    if (elapsed < FRAME_INTERVAL) return;
    lastFrameTime = currentTime - (elapsed % FRAME_INTERVAL);

    const delta = Math.min(elapsed / 1000, 0.05);
    controls.update(delta);
    updateGameAnimations();
    renderer.render(scene, camera);
}

// ──────────────────────────────────────────────
// API DE DÉMARRAGE — appelée par uiManager une fois TOUS les assets chargés
// ──────────────────────────────────────────────
export function startScene() {
    if (started) return;
    started = true;
    initGame();
    settingsMenu.show();
    audioManager.playAmbientMusic({ fade: true }).catch((error) => {
        console.warn('Demarrage audio reporte au prochain geste utilisateur.', error);
    });
    requestAnimationFrame(animate);
}
