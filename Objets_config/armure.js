import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const armureGroup = new THREE.Group();
scene.add(armureGroup);

// ✅ On remet TES coordonnées exactes d'origine !
armureGroup.position.set(3.12, -3.02, -1.52);

armureGroup.userData.id = "how_to_train_your_dragon"; 
armureGroup.userData.isInteractable = true;
armureGroup.userData.axeRotation = "y"; 

loader.load('armure_chef_stoick.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);

    // On calcule le centre...
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    // ✅ LA MAGIE EST LÀ : On ne décale que X et Z pour le faire tourner droit.
    // On ne touche SURTOUT PAS au Y, comme ça il reste posé sur la table !
    model.position.x = -center.x;
    model.position.z = -center.z;

    armureGroup.add(model);
    console.log("🐉 Armure de Stoïck posée sur la table et prête à tourner !");
});

armureGroup.rotation.y = Math.PI;