import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const BouclierBerkGroup = new THREE.Group();
scene.add(BouclierBerkGroup);

// Tes coordonnées d'origine
BouclierBerkGroup.position.set(6.59, -2.6, 2.6);

// 🏷️ CONFIGURATION POUR LE GAME MANAGER
BouclierBerkGroup.userData.id = "how_to_train_your_dragon"; 
BouclierBerkGroup.userData.isInteractable = true;
BouclierBerkGroup.userData.axeRotation = "y"; 

// ✅ Correction du chemin : on évite les espaces
loader.load('/Bouclier_berk.glb', (gltf) => {
    const model = gltf.scene;
    
    // Ton scale
    model.scale.set(-3, -1.3, 1.925);

    // 🎯 CENTRAGE AUTOMATIQUE
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    BouclierBerkGroup.add(model);
    console.log("🛡️ Bouclier de Berk chargé avec succès !");
}, undefined, (error) => {
    console.error("❌ Erreur de chargement du bouclier :", error);
});