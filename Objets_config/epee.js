import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const uhtredGroup = new THREE.Group();
scene.add(uhtredGroup);

uhtredGroup.position.set(3.25, -3, 2.8);

uhtredGroup.userData.id = "epee_uhtred"; 
uhtredGroup.userData.isInteractable = true;
uhtredGroup.userData.axeRotation = "y"; 

loader.load('/Epee_uhtred.glb', (gltf) => {
    const model = gltf.scene;
    
    model.scale.set(0.4, 0.4, 0.4);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    uhtredGroup.add(model);
    console.log(" Épée d'Uhtred (Souffle-Serpent) prête !");
});