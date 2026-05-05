import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const collierBjornGroup = new THREE.Group();
scene.add(collierBjornGroup);
collierBjornGroup.position.set(-1.8, -3.41, 5);
collierBjornGroup.rotation.x = Math.PI / 3;
collierBjornGroup.rotation.y = Math.PI / 2; 

loader.load('/collier_bjorn.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    collierBjornGroup.add(model);
});

