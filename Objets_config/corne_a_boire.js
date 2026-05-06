import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const corneAboireGroup = new THREE.Group();
scene.add(corneAboireGroup);

corneAboireGroup.position.set(7.71, -2.775, -5.625);

corneAboireGroup.userData.id = "corne_last_kingdom"; 
corneAboireGroup.userData.isInteractable = true;
corneAboireGroup.userData.axeRotation = "y"; 

loader.load('/corne_boire_bois.glb', (gltf) => {
    const model = gltf.scene;
    
    corneAboireGroup.scale.set(-4, -2.3, 2.925);
    model.rotation.x = Math.PI;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    corneAboireGroup.add(model);
    console.log("Corne à boire The Last Kingdom prête !");
});