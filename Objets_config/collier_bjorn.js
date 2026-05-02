import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const collierBjornGroup = new THREE.Group();
scene.add(collierBjornGroup);
collierBjornGroup.position.set(-3.84, -2.66, 5);

loader.load('/collier_bjorn.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    collierBjornGroup.add(model);
});

gui.add(collierBjornGroup.position, 'x', -30, 10).name('Collier Bjorn X');
gui.add(collierBjornGroup.position, 'y', -20, 10).name('Collier Bjorn Y');
gui.add(collierBjornGroup.position, 'z', -20, 10).name('Collier Bjorn Z');