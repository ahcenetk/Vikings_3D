import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const pendentifCercleGroup = new THREE.Group();
scene.add(pendentifCercleGroup);
pendentifCercleGroup.position.set(5.182, -3.175, 2.6);

loader.load('/pendentif_cercle.glb', (gltf) => {
    const model = gltf.scene;
    pendentifCercleGroup.scale.set(1, 1, 1);
     model.rotation.y = Math.PI / 2;
     model.rotation.x = Math.PI / 2;
     model.rotation.z = Math.PI;
    pendentifCercleGroup.add(model);
});

gui.add(pendentifCercleGroup.position, 'x', -12, 10).name('Pendentif Cercle X');
gui.add(pendentifCercleGroup.position, 'y', -15, 10).name('Pendentif Cercle Y');
gui.add(pendentifCercleGroup.position, 'z', -15, 10).name('Pendentif Cercle Z');