import gsap from 'gsap';

export function zoomVersObjet(camera, controls, objet) {
    const position = objet.position;
    
    // Bloque la souris pendant l'animation
    controls.enabled = false;

    // Anime la caméra vers l'objet au simple clic
    gsap.to(camera.position, {
        x: position.x,
        y: position.y + 2,  // Légèrement au dessus de l'objet
        z: position.z + 5,  // Devant l'objet
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
            // Réactive la souris une fois arrivé
            controls.enabled = true;
        }
    });
}