import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const TorcheGroup = new THREE.Group();
scene.add(TorcheGroup);
TorcheGroup.position.set(-7.9, -1.88, 3.43);

loader.load('/Torche_murale.glb', (gltf) => {
    const model = gltf.scene;
    TorcheGroup.scale.set(1, 1, 1);
    TorcheGroup.add(model);
});

gui.add(TorcheGroup.position, 'x', -30, 10).name('Torche X');
gui.add(TorcheGroup.position, 'y', -20, 10).name('Torche Y');
gui.add(TorcheGroup.position, 'z', -20, 10).name('Torche Z');