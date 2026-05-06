import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const drakkarGroup = new THREE.Group();
scene.add(drakkarGroup);

drakkarGroup.position.set(3.25, -2.54, 0.01);

drakkarGroup.userData.id = "how_to_train_your_dragon"; 
drakkarGroup.userData.isInteractable = true;
drakkarGroup.userData.axeRotation = "y"; 

loader.load('/drakkar_de_berk.glb', (gltf) => {
    const model = gltf.scene;
    
    model.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    drakkarGroup.add(model);
    console.log(" Drakkar de Berk prêt à naviguer !");
});