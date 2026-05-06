import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const corneGroup = new THREE.Group();
scene.add(corneGroup);

// Tes coordonnées d'origine
corneGroup.position.set(-3.84, -2.75, 4.6);

// 🏷️ CONFIGURATION POUR LE GAME MANAGER
corneGroup.userData.id = "corne_guerre"; 
corneGroup.userData.isInteractable = true;
corneGroup.userData.axeRotation = "y"; 

loader.load('/la_corne_de_guerre.glb', (gltf) => {
    const model = gltf.scene;
    
    // Ton scale d'origine
    model.scale.set(0.015, 0.015, 0.015);

    // 🎯 CENTRAGE AUTOMATIQUE
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    corneGroup.add(model);
    console.log(" Corne de guerre prête");
});