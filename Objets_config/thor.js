import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const thorGroup = new THREE.Group();
scene.add(thorGroup);

loader.load('/marvel_thors_hammer_mjolnir.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(2, 2, 2);
    thorGroup.add(model);
});

gui.add(thorGroup.position, 'x', -20, 10).name('Marteau X');
gui.add(thorGroup.position, 'y', -15, 10).name('Marteau Y');
gui.add(thorGroup.position, 'z', -15, 10).name('Marteau Z');