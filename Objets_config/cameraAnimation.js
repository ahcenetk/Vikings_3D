import gsap from 'gsap';
import * as THREE from 'three';

export function zoomVersObjet(camera, controls, objet) {
    const cible = new THREE.Vector3();
    objet.getWorldPosition(cible);

    if (controls.suspend) {
        controls.suspend({ unlock: true });
    } else {
        controls.enabled = false;
    }

    gsap.to(camera.position, {
        x: cible.x,
        y: cible.y + 1,
        z: cible.z + 3,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
            if (controls.lookAt) {
                controls.lookAt(cible);
            } else {
                controls.update();
            }
        },
        onComplete: () => {
            if (controls.resume) {
                controls.resume();
            } else {
                controls.enabled = true;
            }
        }
    });

    if (controls.target) {
        gsap.to(controls.target, {
            x: cible.x,
            y: cible.y,
            z: cible.z,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => controls.lookAt?.(controls.target) ?? controls.update?.()
        });
    }
}
