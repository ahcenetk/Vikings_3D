import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const corneGroup = new THREE.Group();
scene.add(corneGroup);
corneGroup.position.set(3.12, -2.18, 2.8);

loader.load('/la_corne_de_guerre.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.02, 0.02, 0.02);
    corneGroup.add(model);
});

gui.add(corneGroup.position, 'x', -30, 10).name('Corne X');
gui.add(corneGroup.position, 'y', -20, 10).name('Corne Y');
gui.add(corneGroup.position, 'z', -20, 10).name('Corne Z');