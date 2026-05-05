import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const thorGroup = new THREE.Group();
scene.add(thorGroup);
thorGroup.position.set(-5.12, -3.3, 2.8);

loader.load('/marvel_thors_hammer_mjolnir.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);
    thorGroup.add(model);
});

gui.add(thorGroup.position, 'x', -20, 10).name('Marteau X');
gui.add(thorGroup.position, 'y', -15, 10).name('Marteau Y');
gui.add(thorGroup.position, 'z', -15, 10).name('Marteau Z');