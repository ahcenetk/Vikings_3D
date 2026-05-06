import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const pendentifCercleGroup = new THREE.Group();
scene.add(pendentifCercleGroup);

pendentifCercleGroup.position.set(5.182, -3.175, 2.6);

pendentifCercleGroup.userData.id = "pendentif_leif"; 
pendentifCercleGroup.userData.isInteractable = true;
pendentifCercleGroup.userData.axeRotation = "y"; 

loader.load('/pendentif_cercle.glb', (gltf) => {
    const model = gltf.scene;
    
    pendentifCercleGroup.scale.set(1, 1, 1);
    model.rotation.y = Math.PI / 2;
    model.rotation.x = Math.PI / 2;
    model.rotation.z = Math.PI;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    pendentifCercleGroup.add(model);
    console.log("Pendentif Cercle prêt");
});