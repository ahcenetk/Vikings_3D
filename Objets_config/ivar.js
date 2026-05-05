import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const masqueIvarGroup = new THREE.Group();
scene.add(masqueIvarGroup);
masqueIvarGroup.position.set(-3.41, -2.625, 2.625);

loader.load('/masque_ceremonial_ivar.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    masqueIvarGroup.add(model);
});

