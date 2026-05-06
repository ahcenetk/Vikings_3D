import * as THREE from 'three';
import { scene, loader, gui, camera, controls } from '../scene.js';
// Plus besoin d'importer zoomVersObjet ni de créer un raycaster ici, 
// le GameManager s'occupe de tout pour nous !

const shieldGroup = new THREE.Group();
scene.add(shieldGroup);
shieldGroup.position.set(-7.2, -4.1, -0.74);
shieldGroup.rotation.y = Math.PI / 2;

loader.load('/viking_maiden_shield.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.8, 0.8, 0.8);
    
    model.traverse((child) => {
        if (child.isMesh) {
            // C'est ICI qu'on fait le lien direct avec ton JSON !
            child.userData.id = "vikings"; 
            child.userData.isInteractable = true;
        }
    });

    shieldGroup.add(model);
    console.log("🛡️ Bouclier Vikings prêt !");
});

// ⚠️ TOUT LE BLOC DE CLIC A ÉTÉ SUPPRIMÉ ! ⚠️
// On laisse le GameManager.js faire son travail de détection.