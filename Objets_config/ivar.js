import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const masqueIvarGroup = new THREE.Group();
scene.add(masqueIvarGroup);

masqueIvarGroup.position.set(-3.41, -2.625, 2.625);

masqueIvarGroup.userData.id = "vikings"; 
masqueIvarGroup.userData.isInteractable = true;
masqueIvarGroup.userData.axeRotation = "y"; // Il tournera de gauche à droite

loader.load('/masque_ceremonial_ivar.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    masqueIvarGroup.add(model);
    console.log(" Masque d'Ivar centré et prêt !");
});