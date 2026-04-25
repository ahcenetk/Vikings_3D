import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const masqueIvarGroup = new THREE.Group();
scene.add(masqueIvarGroup);

loader.load('/masque_ceremonial_ivar.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    masqueIvarGroup.add(model);
});

gui.add(masqueIvarGroup.position, 'x', -20, 10).name('Masque Ivar X');
gui.add(masqueIvarGroup.position, 'y', -15, 10).name('Masque Ivar Y');
gui.add(masqueIvarGroup.position, 'z', -15, 10).name('Masque Ivar Z');