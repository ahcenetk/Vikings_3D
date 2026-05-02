import * as THREE from 'three';
import { scene, camera, renderer, controls, loader, gui } from './scene.js';
import './Objets_config/dieu.js';
import './Objets_config/berserker.js';
import './Objets_config/ivar.js';
import './Objets_config/drakkar.js';
import './Objets_config/armure.js';
import './Objets_config/shield.js';
import './Objets_config/thor.js';
import './Objets_config/epee.js';
import './Objets_config/hache.js';
import './Objets_config/corne.js';
import './Objets_config/hache_ivar.js';
import './Objets_config/amleth.js';
import './Objets_config/corne_a_boire.js';
import './Objets_config/torche.js';
import './Objets_config/bouclier_berk.js';
import './Objets_config/collier_bjorn.js';
import './Objets_config/pendentif_cercle.js';

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


camera.position.set(0.3781410544625605, 1.3255026014798006e-15, 16.583501045766916);
controls.target.set(0, 0, -5);
controls.update();


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