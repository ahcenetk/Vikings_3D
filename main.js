import * as THREE from 'three';
import { scene, camera, renderer, controls, loader } from './scene.js';
import './Objets_config/ivar.js';
import './Objets_config/drakkar.js';
import './Objets_config/armure.js';
import './Objets_config/shield.js';
import './Objets_config/thor.js';
import './Objets_config/epee.js';
import './Objets_config/hache.js';
import './Objets_config/corne.js';

// FOND
const textureLoader = new THREE.TextureLoader();
scene.background = textureLoader.load('/Arriere_plan.png');

// LUMIÈRES
scene.add(new THREE.AmbientLight(0xffffff, 2));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// SALLE VIKING
loader.load('/viking_dining_hall.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    console.log("Salle Viking chargée !");
});

// RESIZE
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ANIMATION
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();