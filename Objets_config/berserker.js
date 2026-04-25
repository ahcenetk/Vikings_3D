import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const BerserkerGroup = new THREE.Group();
scene.add(BerserkerGroup);
BerserkerGroup.scale.set(-2.54, -2.3, 2.925);
BerserkerGroup.rotation.x = Math.PI ;

loader.load('/masque_berserker.glb', (gltf) => {
    const model = gltf.scene;
    BerserkerGroup.add(model);
});

gui.add(BerserkerGroup.position, 'x', -15, 10).name('Berserker Masque X');
gui.add(BerserkerGroup.position, 'y', -15, 10).name('Berserker Masque Y');
gui.add(BerserkerGroup.position, 'z', -15, 10).name('Berserker Masque Z');