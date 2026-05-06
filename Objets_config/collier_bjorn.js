import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const collierBjornGroup = new THREE.Group();
scene.add(collierBjornGroup);

// Position initiale de ton objet
collierBjornGroup.position.set(-1.8, -3.41, 5);
collierBjornGroup.rotation.x = Math.PI / 3;
collierBjornGroup.rotation.y = Math.PI / 2;

collierBjornGroup.userData = {
    id: "vikings", 
    axeRotation: "y"
};

loader.load('/collier_bjorn.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    
    model.traverse((child) => {
        if (child.isMesh) {
            child.userData = collierBjornGroup.userData;
        }
    });

    collierBjornGroup.add(model);
});

export { collierBjornGroup };