import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const hacheGroup = new THREE.Group();
scene.add(hacheGroup);

hacheGroup.position.set(3.12, -3.6, 2.8);

hacheGroup.userData.id = "hache_kattegat"; 
hacheGroup.userData.isInteractable = true;
hacheGroup.userData.axeRotation = "y"; 

loader.load('/Hache_de_kattegat.glb', (gltf) => {
    const model = gltf.scene;
    
    model.scale.set(0.12, 0.12, 0.12);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    hacheGroup.add(model);
    console.log(" Hache de Kattegat prête pour le combat !");
});