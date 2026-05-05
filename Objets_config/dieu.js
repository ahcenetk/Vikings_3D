import * as THREE from 'three';
import { scene, loader, gui, camera, controls } from '../scene.js';
import { zoomVersObjet } from './cameraAnimation.js';

const DieuGroup = new THREE.Group();
scene.add(DieuGroup);
DieuGroup.position.set(0, -2.775, -6.25);

loader.load('/Statuette_dieu.glb', (gltf) => {
    const model = gltf.scene;
    DieuGroup.scale.set(-4, -2.3, 2.925);
    model.rotation.x = Math.PI;
    model.rotation.y = Math.PI / 2;
    DieuGroup.add(model);
});

gui.add(DieuGroup.position, 'x', -12, 10).name('Dieu X');
gui.add(DieuGroup.position, 'y', -15, 10).name('Dieu  Y');
gui.add(DieuGroup.position, 'z', -15, 10).name('Dieu Z');
