import gsap from 'gsap';
import * as THREE from 'three';

export function zoomVersObjet(camera, controls, objet) {
    // 1. On trouve la vraie position de l'objet dans le monde
    const cible = new THREE.Vector3();
    objet.getWorldPosition(cible);

    // Bloque la souris pendant l'animation
    controls.enabled = false;

    // 2. On déplace la caméra
    gsap.to(camera.position, {
        x: cible.x,
        y: cible.y + 1,
        z: cible.z + 3, // On s'approche
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => controls.update(), // CRUCIAL : Force la maj visuelle
        onComplete: () => { controls.enabled = true; }
    });

    // 3. NOUVEAU : On force OrbitControls à regarder le bouclier
    gsap.to(controls.target, {
        x: cible.x,
        y: cible.y,
        z: cible.z,
        duration: 1.5,
        ease: "power2.inOut"
    });
}