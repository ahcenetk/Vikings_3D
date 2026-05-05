import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const BouclierBerkGroup = new THREE.Group();
scene.add(BouclierBerkGroup);
BouclierBerkGroup.position.set(6.59, -2.6, 2.6);

loader.load('/Bouclier_berk.glb', (gltf) => {
    const model = gltf.scene;
    BouclierBerkGroup.scale.set(-3, -1.3, 1.925);
    BouclierBerkGroup.add(model);
});

