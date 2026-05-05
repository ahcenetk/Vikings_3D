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

