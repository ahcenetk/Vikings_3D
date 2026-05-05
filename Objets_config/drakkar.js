import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const drakkarGroup = new THREE.Group();
scene.add(drakkarGroup);
drakkarGroup.position.set(3.25, -2.54, 0.00999999999999801);

loader.load('/drakkar_de_berk.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    drakkarGroup.add(model);
});

