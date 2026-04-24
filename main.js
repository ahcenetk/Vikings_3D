import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import gsap from 'gsap'; 


const gui = new GUI();

// 1. SCÈNE ET CAMÉRA
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('BackGround/Arriere_plan.png');
scene.background = backgroundTexture; // Fond sombre ambiance Viking

// On place la caméra assez loin car le modèle est grand
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 10, 15); 

// 2. RENDU (Le moteur graphique)
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. LUMIÈRES (Obligatoires pour voir les textures)
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Lumière globale
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// 4. CONTRÔLES SOURIS (Pour tourner autour de la salle)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 30;


// 5. CHARGEMENT DU MODÈLE (.glb)
const loader = new GLTFLoader();

loader.load(
    '/viking_dining_hall.glb', 
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        
        // Centrer le modèle au cas où
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        console.log("Succès : La salle Viking est affichée !");
    },
    (xhr) => {
        // Affiche la progression dans la console (F12) car 76Mo c'est lourd
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(percent + '% chargé');
    },
    (error) => {
        console.error('Erreur de chargement :', error);
    }
);

// 6. REDIMENSIONNEMENT
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. BOUCLE D'ANIMATION
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Nécessaire pour le damping
    renderer.render(scene, camera);
}


const shieldGroup = new THREE.Group();
scene.add(shieldGroup);

loader.load('public/viking_maiden_shield.glb',
    (gltf) => {
        const model = gltf.scene;
        console.log(model);
        shieldGroup.add(model);
    }
);

gui.add(shieldGroup.position, 'x', -10, 10).name('Position X');
gui.add(shieldGroup.position, 'y', -10, 10).name('Position Y');
gui.add(shieldGroup.position, 'z', -10, 10).name('Position Z');
animate();


const thorGroup = new THREE.Group();
scene.add(thorGroup);;

loader.load('public/marvel_thors_hammer_mjolnir.glb',
    (gltf) => {
        const model = gltf.scene;

        model.scale.set(3, 3, 3); // Agrandir le marteau pour qu'il soit visible dans la salle
        console.log(model);
        thorGroup.add(model);
    }
);

gui.add(thorGroup.position, 'x', -20, 10).name('Position X');
gui.add(thorGroup.position, 'y', -15, 10).name('Position Y');
gui.add(thorGroup.position, 'z', -15, 10).name('Position Z');
animate();
