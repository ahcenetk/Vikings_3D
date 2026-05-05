import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const HacheIvarGroup = new THREE.Group();
scene.add(HacheIvarGroup);
HacheIvarGroup.position.set(-8.2, -2.75, 1.52);;
HacheIvarGroup.rotation.y = Math.PI / 2;

loader.load('/hache_Ivar.glb', (gltf) => {
    const model = gltf.scene;
    HacheIvarGroup.scale.set(1, 1, 1);
    HacheIvarGroup.add(model);
});

