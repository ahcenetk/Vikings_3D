import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const pendentifLeifGroup = new THREE.Group();
scene.add(pendentifLeifGroup);

pendentifLeifGroup.position.set(5.182, -3.3, 4.85);

pendentifLeifGroup.userData.id = "pendentif_leif"; 
pendentifLeifGroup.userData.isInteractable = true;
pendentifLeifGroup.userData.axeRotation = "y"; 

loader.load('/Pendentif_leif_Erickson.glb', (gltf) => {
    const model = gltf.scene;
    
    pendentifLeifGroup.scale.set(1, 1, 1);
    model.rotation.y = Math.PI;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    pendentifLeifGroup.add(model);
    console.log("Pendentif de Leif Erickson prêt");
});