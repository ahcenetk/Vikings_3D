import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const armureGroup = new THREE.Group();
scene.add(armureGroup);
armureGroup.position.set(3.12, -3.02, -1.52);

loader.load('armure_chef_stoick.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    armureGroup.add(model);
});

// Rotation 
armureGroup.rotation.y = Math.PI;       // 180° → retourne l'objet face à toi -90° → tourne à droite

