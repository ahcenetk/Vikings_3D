import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const DieuGroup = new THREE.Group();
scene.add(DieuGroup);

loader.load('/Statuette_dieu.glb', (gltf) => {
    const model = gltf.scene;
    DieuGroup.scale.set(-4, -2.3, 2.925);
    model.rotation.x = Math.PI ;
    DieuGroup.add(model);
});

gui.add(DieuGroup.position, 'x', -12, 10).name('Dieu X');
gui.add(DieuGroup.position, 'y', -15, 10).name('Dieu  Y');
gui.add(DieuGroup.position, 'z', -15, 10).name('Dieu Z');