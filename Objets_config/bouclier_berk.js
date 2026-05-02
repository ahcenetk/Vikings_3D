import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const BouclierBerkGroup = new THREE.Group();
scene.add(BouclierBerkGroup);
BouclierBerkGroup.position.set(6.59, -2.6, 2.6);

loader.load('/Bouclier_berk.glb', (gltf) => {
    const model = gltf.scene;
    BouclierBerkGroup.scale.set(-4, -2.3, 2.925);
    BouclierBerkGroup.add(model);
});

gui.add(BouclierBerkGroup.position, 'x', -12, 10).name('Bouclier Berk X');
gui.add(BouclierBerkGroup.position, 'y', -15, 10).name('Bouclier Berk Y');
gui.add(BouclierBerkGroup.position, 'z', -15, 10).name('Bouclier Berk Z');