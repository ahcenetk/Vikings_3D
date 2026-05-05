import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const BerserkerGroup = new THREE.Group();
scene.add(BerserkerGroup);
BerserkerGroup.position.set(1.61, -3.075, 3.575);
BerserkerGroup.rotation.x = Math.PI * 2;
BerserkerGroup.rotation.y = Math.PI / 2;

loader.load('/masque_berserker.glb', (gltf) => {
    const model = gltf.scene;
    BerserkerGroup.scale.set(-1, 1, -1);
    BerserkerGroup.add(model);
});

