import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const pendentifAmlethGroup = new THREE.Group();
scene.add(pendentifAmlethGroup);

// Tes coordonnées d'origine
pendentifAmlethGroup.position.set(1.76, -3.41, 6.49);

pendentifAmlethGroup.userData.id = "pendentif_amleth"; 
pendentifAmlethGroup.userData.isInteractable = true;
pendentifAmlethGroup.userData.axeRotation = "y"; 

loader.load('/pendentif_amleth.glb', (gltf) => {
    const model = gltf.scene;
    
    pendentifAmlethGroup.scale.set(0.8, 0.8, 0.8);
    model.rotation.z = Math.PI / 3;
    model.rotation.y = Math.PI / 2;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    pendentifAmlethGroup.add(model);
    console.log(" Pendentif d'Amleth prêt à l'action !");
});