import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const masqueIvarGroup = new THREE.Group();
scene.add(masqueIvarGroup);

// Tes coordonnées d'origine
masqueIvarGroup.position.set(-3.41, -2.625, 2.625);

// Le bon ID pour faire le lien avec le JSON !
masqueIvarGroup.userData.id = "vikings"; 
masqueIvarGroup.userData.isInteractable = true;
masqueIvarGroup.userData.axeRotation = "y"; // Il tournera de gauche à droite

loader.load('/masque_ceremonial_ivar.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);

    // CENTRAGE AUTOMATIQUE
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    // On centre sur X et Z pour un pivot parfait
    model.position.x = -center.x;
    model.position.z = -center.z;

    masqueIvarGroup.add(model);
    console.log(" Masque d'Ivar centré et prêt !");
});