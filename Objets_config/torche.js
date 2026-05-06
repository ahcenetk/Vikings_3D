import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const TorcheGroup = new THREE.Group();
scene.add(TorcheGroup);

// Tes coordonnées d'origine
TorcheGroup.position.set(-7.9, -1.88, 3.43);

// 🏷️ LES ÉTIQUETTES POUR LE JEU (C'est ça qui manquait !)
TorcheGroup.userData.id = "vikings_torche";
TorcheGroup.userData.isInteractable = true;
TorcheGroup.userData.axeRotation = "y"; 

loader.load('/Torche_murale.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);

    // 🎯 CENTRAGE AUTOMATIQUE
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x = -center.x;
    model.position.z = -center.z;

    TorcheGroup.add(model);
    console.log("🔥 Torche Vikings prête et cliquable !");
});