import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const DieuGroup = new THREE.Group();
scene.add(DieuGroup);

DieuGroup.position.set(0, -2.775, -6.25);
DieuGroup.scale.set(-4, -2.3, 2.925);

DieuGroup.userData.id = "the_last_kingdom"; 
DieuGroup.userData.isInteractable = true;
DieuGroup.userData.axeRotation = "y"; // Tourne sur elle-même

loader.load('/Statuette_dieu.glb', (gltf) => {
    const model = gltf.scene;
    
    model.rotation.x = Math.PI;
    model.rotation.y = Math.PI / 2;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    DieuGroup.add(model);
    console.log(" Statuette The Last Kingdom centrée et prête !");
});