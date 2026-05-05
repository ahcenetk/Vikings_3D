import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const pendentifAmlethGroup = new THREE.Group();
scene.add(pendentifAmlethGroup);
pendentifAmlethGroup.position.set(1.76, -3.41, 6.49);

loader.load('/pendentif_amleth.glb', (gltf) => {
    const model = gltf.scene;
    pendentifAmlethGroup.scale.set(0.8, 0.8, 0.8);
    model.rotation.z = Math.PI / 3;
    model.rotation.y = Math.PI / 2;
    pendentifAmlethGroup.add(model);
});

