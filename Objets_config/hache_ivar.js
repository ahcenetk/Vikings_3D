import * as THREE from 'three';
import { scene, loader } from '../scene.js';

const HacheIvarGroup = new THREE.Group();
scene.add(HacheIvarGroup);

HacheIvarGroup.position.set(-8.2, -2.75, 1.52);
HacheIvarGroup.rotation.y = Math.PI / 2;

HacheIvarGroup.userData.id = "vikings_hache_ivar"; 
HacheIvarGroup.userData.isInteractable = true;
HacheIvarGroup.userData.axeRotation = "y"; 

loader.load('/hache_Ivar.glb', (gltf) => {
    const model = gltf.scene;
    
    HacheIvarGroup.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    HacheIvarGroup.add(model);
    console.log("Hache d'Ivar prête et cliquable !");
});