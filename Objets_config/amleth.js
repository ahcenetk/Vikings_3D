import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const pendentifAmlethGroup = new THREE.Group();
scene.add(pendentifAmlethGroup);
pendentifAmlethGroup.position.set(-3.84, -2.66, 6.49);

loader.load('/pendentif_amleth.glb', (gltf) => {
    const model = gltf.scene;
    pendentifAmlethGroup.scale.set(0.8, 0.8, 0.8);
    pendentifAmlethGroup.add(model);
});

gui.add(pendentifAmlethGroup.position, 'x', -30, 10).name('Pendentif Amleth X');
gui.add(pendentifAmlethGroup.position, 'y', -20, 10).name('Pendentif Amleth Y');
gui.add(pendentifAmlethGroup.position, 'z', -20, 10).name('Pendentif Amleth Z');