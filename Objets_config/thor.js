import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const thorGroup = new THREE.Group();
scene.add(thorGroup);

thorGroup.position.set(-5.12, -3.3, 2.8);

thorGroup.userData.id = "thor"; 
thorGroup.userData.isInteractable = true;
thorGroup.userData.axeRotation = "y"; 

loader.load('/marvel_thors_hammer_mjolnir.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    // On centre pour que le pivot soit au milieu du marteau
    model.position.x = -center.x;
    model.position.z = -center.z;

    thorGroup.add(model);
    console.log("Mjölnir est en place et prêt à tonner !");
});