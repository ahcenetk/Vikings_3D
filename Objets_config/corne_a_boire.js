import * as THREE from 'three';
import { scene, loader, gui } from '../scene.js';

const corneAboireGroup = new THREE.Group();
scene.add(corneAboireGroup);
corneAboireGroup.position.set(7.71, -2.775, -5.625);

loader.load('/corne_boire_bois.glb', (gltf) => {
    const model = gltf.scene;
    corneAboireGroup.scale.set(-4, -2.3, 2.925);
    model.rotation.x = Math.PI ;
    corneAboireGroup.add(model);
});

gui.add(corneAboireGroup.position, 'x', -12, 10).name('Corne à boire X');
gui.add(corneAboireGroup.position, 'y', -15, 10).name('Corne à boire  Y');
gui.add(corneAboireGroup.position, 'z', -15, 10).name('Corne à boire Z');