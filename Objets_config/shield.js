import * as THREE from 'three';
import { scene, loader, gui, camera, controls } from '../scene.js';
import { zoomVersObjet } from './cameraAnimation.js';

const shieldGroup = new THREE.Group();
scene.add(shieldGroup);
shieldGroup.position.set(-7.2, -4.1, -0.74);
shieldGroup.rotation.y = Math.PI / 2;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

loader.load('/viking_maiden_shield.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.8, 0.8, 0.8);
    model.traverse((child) => {
        if (child.isMesh) {
            child.userData.id = "bouclier";
            child.userData.isInteractable = true;
        }
    });


    shieldGroup.add(model);
    console.log("Bouclier prêt à être cliqué !");
});

// ← AJOUT : zoom sur le bouclier au clic
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(shieldGroup, true);
    if (intersects.length > 0) {
        zoomVersObjet(camera, controls, shieldGroup);
    }
});