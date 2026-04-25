import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const shieldGroup = new THREE.Group();
scene.add(shieldGroup);
shieldGroup.position.set(-3.04, -3.28, 0);

loader.load('/viking_maiden_shield.glb', (gltf) => {
    const model = gltf.scene;
    shieldGroup.add(model);
});
