import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const HacheIvarGroup = new THREE.Group();
scene.add(HacheIvarGroup);
HacheIvarGroup.position.set(-3.32, -1.88, 2.8);

loader.load('/hache_Ivar.glb', (gltf) => {
    const model = gltf.scene;
    HacheIvarGroup.scale.set(1, 1, 1);
    HacheIvarGroup.add(model);
});

gui.add(HacheIvarGroup.position, 'x', -30, 10).name('Hache Ivar X');
gui.add(HacheIvarGroup.position, 'y', -20, 10).name('Hache Ivar Y');
gui.add(HacheIvarGroup.position, 'z', -20, 10).name('Hache Ivar Z');