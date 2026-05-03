import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const shieldGroup = new THREE.Group();
scene.add(shieldGroup);
shieldGroup.position.set(-3.04, -3.28, 0);

loader.load('/viking_maiden_shield.glb', (gltf) => {
    const model = gltf.scene;
    
    // --- DÉBUT DE LA NOUVEAUTÉ ---
    // On parcourt les morceaux 3D du bouclier pour leur coller une étiquette invisible
    model.traverse((child) => {
        if (child.isMesh) {
            child.userData.id = "bouclier";
            child.userData.isInteractable = true;
        }
    });
    // --- FIN DE LA NOUVEAUTÉ ---

    shieldGroup.add(model);
    console.log("Bouclier prêt à être cliqué !");
});