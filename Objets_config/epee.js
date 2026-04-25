import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const uhtredGroup = new THREE.Group();
scene.add(uhtredGroup);
uhtredGroup.position.set(3.25, -3, 2.8);

loader.load('/Epee_uhtred.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.4, 0.4, 0.4);
    uhtredGroup.add(model);
});

gui.add(uhtredGroup.position, 'x', -30, 10).name('Epee X');
gui.add(uhtredGroup.position, 'y', -20, 10).name('Epee Y');
gui.add(uhtredGroup.position, 'z', -20, 10).name('Epee Z');