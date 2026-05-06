import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const BouclierBerkGroup = new THREE.Group();
scene.add(BouclierBerkGroup);

BouclierBerkGroup.position.set(6.59, -2.6, 2.6);

BouclierBerkGroup.userData.id = "how_to_train_your_dragon"; 
BouclierBerkGroup.userData.isInteractable = true;
BouclierBerkGroup.userData.axeRotation = "y"; 

loader.load('/Bouclier_berk.glb', (gltf) => {
    const model = gltf.scene;
    
    model.scale.set(-3, -1.3, 1.925);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    BouclierBerkGroup.add(model);
    console.log(" Bouclier de Berk chargé avec succès !");
}, undefined, (error) => {
    console.error("Erreur de chargement du bouclier :", error);
});