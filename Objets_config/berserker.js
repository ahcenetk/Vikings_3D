import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const BerserkerGroup = new THREE.Group();
scene.add(BerserkerGroup);

// Tes coordonnées et rotations d'origine
BerserkerGroup.position.set(1.61, -3.075, 3.575);
BerserkerGroup.rotation.x = Math.PI * 2;
BerserkerGroup.rotation.y = Math.PI / 2;

BerserkerGroup.userData.id = "berserker_northman"; 
BerserkerGroup.userData.isInteractable = true;
BerserkerGroup.userData.axeRotation = "y"; 

loader.load('/masque_berserker.glb', (gltf) => {
    const model = gltf.scene;
    
    BerserkerGroup.scale.set(-1, 1, -1);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.z = -center.z;

    BerserkerGroup.add(model);
    console.log(" Masque de Berserker prêt !");
});