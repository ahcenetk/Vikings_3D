import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const hacheGroup = new THREE.Group();
scene.add(hacheGroup);
hacheGroup.position.set(3.12, -3.6, 2.8);

loader.load('/Hache_de_kattegat.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.12, 0.12, 0.12);
    hacheGroup.add(model);
});

gui.add(hacheGroup.position, 'x', -30, 10).name('Hache X');
gui.add(hacheGroup.position, 'y', -20, 10).name('Hache Y');
gui.add(hacheGroup.position, 'z', -20, 10).name('Hache Z');