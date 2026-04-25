import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const shieldGroup = new THREE.Group();
scene.add(shieldGroup);

loader.load('/viking_maiden_shield.glb', (gltf) => {
    const model = gltf.scene;
    shieldGroup.add(model);
});

gui.add(shieldGroup.position, 'x', -10, 10).name('Bouclier X');
gui.add(shieldGroup.position, 'y', -10, 10).name('Bouclier Y');
gui.add(shieldGroup.position, 'z', -10, 10).name('Bouclier Z');