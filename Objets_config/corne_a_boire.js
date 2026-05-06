import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const corneAboireGroup = new THREE.Group();
scene.add(corneAboireGroup);

// Coordonnées d'origine basées sur ton fichier
corneAboireGroup.position.set(7.71, -2.775, -5.625);

// 🏷️ CONFIGURATION POUR LE GAME MANAGER
corneAboireGroup.userData.id = "corne_last_kingdom"; 
corneAboireGroup.userData.isInteractable = true;
corneAboireGroup.userData.axeRotation = "y"; 

loader.load('/corne_boire_bois.glb', (gltf) => {
    const model = gltf.scene;
    
    // On applique tes réglages de scale et rotation
    corneAboireGroup.scale.set(-4, -2.3, 2.925);
    model.rotation.x = Math.PI;

    // 🎯 CENTRAGE AUTOMATIQUE
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    corneAboireGroup.add(model);
    console.log("🍺 Corne à boire The Last Kingdom prête !");
});