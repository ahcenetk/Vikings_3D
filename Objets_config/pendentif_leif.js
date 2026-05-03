import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const pendentifLeifGroup = new THREE.Group();
scene.add(pendentifLeifGroup);
pendentifLeifGroup.position.set(5.182, -3.3, 4.85);

loader.load('/Pendentif_leif_Erickson.glb', (gltf) => {
    const model = gltf.scene;
    pendentifLeifGroup.scale.set(1, 1, 1);
     model.rotation.y = Math.PI ;
    pendentifLeifGroup.add(model);
});

gui.add(pendentifLeifGroup.position, 'x', -12, 10).name('Pendentif Leif X');
gui.add(pendentifLeifGroup.position, 'y', -15, 10).name('Pendentif Leif Y');
gui.add(pendentifLeifGroup.position, 'z', -15, 10).name('Pendentif Leif Z');