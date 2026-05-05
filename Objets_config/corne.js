import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const corneGroup = new THREE.Group();
scene.add(corneGroup);
corneGroup.position.set(-3.84, -2.75, 4.6);

loader.load('/la_corne_de_guerre.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.015, 0.015, 0.015);
    corneGroup.add(model);
});

