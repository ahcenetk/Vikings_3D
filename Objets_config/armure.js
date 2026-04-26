import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const armureGroup = new THREE.Group();
scene.add(armureGroup);
armureGroup.position.set(3.12, -2.18, 2.8);

loader.load('armure_chef_stoick.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    armureGroup.add(model);
});

// Rotation 
armureGroup.rotation.y = Math.PI;       // 180° → retourne l'objet face à toi -90° → tourne à droite

gui.add(armureGroup.position, 'x', -30, 10).name('Armure X');
gui.add(armureGroup.position, 'y', -20, 10).name('Armure Y');
gui.add(armureGroup.position, 'z', -20, 10).name('Armure Z');