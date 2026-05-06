import * as THREE from 'three';
import { camera, scene, controls } from './scene.js';
import { zoomVersObjet } from './Objets_config/cameraAnimation.js';
import gsap from 'gsap';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- 1. VARIABLES ---
let isObjectSelected = false; 
let targetObject = null;      
let initialPosition = new THREE.Vector3();
let initialRotZ = 0;
let initialRotY = 0; 

// Logique Quiz
let lives = 3;
let errors = 0;
let objectsFound = 0; 
const TOTAL_OBJECTS = 18;

// --- 2. GESTION DES DONNÉES GLOBALES ---
let allMoviesData = [];       
let currentMovieData = null;  

async function loadGameData() {
    try {
        const response = await fetch('/movies_data.json'); 
        allMoviesData = await response.json(); 
        console.log("✅ Données chargées :", allMoviesData.length, "œuvres prêtes pour le quiz !");
        updateLivesDisplay();
    } catch (e) {
        console.error("❌ Erreur de lecture du JSON.", e);
    }
}

function updateLivesDisplay() {
    const livesDisplay = document.getElementById('lives');
    if (livesDisplay) {
        livesDisplay.innerText = "❤️".repeat(Math.max(0, lives)) + "🖤".repeat(3 - Math.max(0, lives));
    }
}

export function initGame() {
    loadGameData();

    const gameUI = document.getElementById('game-ui');
    const closeBtn = document.getElementById('close-btn');
    const submitBtn = document.getElementById('submit-btn');
    const answerInput = document.getElementById('answer-input');
    const feedbackMessage = document.getElementById('feedback-message');
    const hintText = document.getElementById('hint-text');

    window.addEventListener('click', (event) => {
        if (isObjectSelected || allMoviesData.length === 0) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            let clickedObject = null;
            let objectId = null;

            if (obj.userData && obj.userData.id) {
                clickedObject = obj;
                objectId = obj.userData.id;
            } else {
                obj.traverseAncestors((ancestor) => {
                    if (ancestor.userData && ancestor.userData.id) {
                        clickedObject = ancestor;
                        objectId = ancestor.userData.id;
                    }
                });
            }

            if (clickedObject && objectId) {
                currentMovieData = allMoviesData.find(m => m.id === objectId || m.model3D_ref === objectId);

                if (currentMovieData) {
                    targetObject = clickedObject;
                    isObjectSelected = true;
                    
                    initialPosition.copy(targetObject.position);
                    initialRotZ = targetObject.rotation.z;
                    initialRotY = targetObject.rotation.y; 

                    let destinationX = initialPosition.x + 1.5; 
                    let destinationY = initialPosition.y + 1;   

                    if (objectId === "how_to_train_your_dragon") {
                        destinationX = initialPosition.x - 3; // Gauche pour l'armure de Stoïck
                    } else if (objectId === "vikings" || objectId === "the_last_kingdom" || objectId === "thor" || objectId === "corne_guerre" || objectId === "hache_kattegat" || objectId === "pendentif_amleth") {
                        destinationX = initialPosition.x; 
                    }
                    else if (objectId === "corne_last_kingdom" || objectId === "pendentif_leif") {
                        destinationX = initialPosition.x - 3; 
                        console.log(" Corne à gauche");
                    }
                    else if (objectId === "vikings_torche" || objectId === "vikings_hache_ivar" ) {
                        destinationX = initialPosition.x + 3; 
                        console.log(" Corne à droite !");
                    }

                    targetObject.position.set(destinationX, destinationY, initialPosition.z);
                    targetObject.updateMatrixWorld(); 

                    zoomVersObjet(camera, controls, targetObject);

                    // 🔙 5. On remet instantanément l'objet à sa place d'origine
                    targetObject.position.copy(initialPosition);
                    targetObject.updateMatrixWorld();

                    // 🎬 6. ANIMATION FLUIDE : L'objet rejoint la caméra !
                    gsap.to(targetObject.position, {
                        x: destinationX, 
                        y: destinationY,   
                        duration: 1,
                        ease: "power2.out"
                    });

                    // ✅ CORRECTION LUMIÈRE JAUNE (Appliquée à tous)
                    targetObject.traverse((child) => {
                        if (child.isMesh && child.material) {
                            if (child.material.emissive !== undefined) {
                                child.material.emissive.setHex(0x664400);
                                child.material.emissiveIntensity = 2;
                            } else if (child.material.color) {
                                child.userData.oldColor = child.material.color.getHex();
                                child.material.color.setHex(0xffcc00);
                            }
                            child.material.needsUpdate = true; 
                        }
                    });

                    gameUI.classList.remove('hidden');
                    feedbackMessage.innerText = "";
                    hintText.innerText = "De quelle œuvre provient cet objet ?";
                }
            }
        }
    });

    submitBtn.onclick = () => {
        if (!currentMovieData) return;
        const userAnswer = answerInput.value.toLowerCase().trim();

        if (currentMovieData.accepted_answers.includes(userAnswer)) {
            objectsFound++;

            feedbackMessage.style.color = "#4ade80";
            feedbackMessage.innerText = "Félicitations ! ";
            hintText.innerText = currentMovieData.funFact;
            submitBtn.disabled = true;

            gsap.to(targetObject.rotation, {
                y: targetObject.rotation.y + Math.PI * 4, 
                duration: 4,
                ease: "power2.inOut"
            });
            
            gsap.to(targetObject.scale, {
                x: 0, y: 0, z: 0,
                duration: 1.5, delay: 1.5, 
                ease: "back.in(1.5)"
            });

            setTimeout(() => {
                targetObject.visible = false; 
                gameUI.classList.add('hidden'); 
                isObjectSelected = false; 
                currentMovieData = null; 
                answerInput.value = ""; 
                submitBtn.disabled = false; 

                if (objectsFound >= TOTAL_OBJECTS) {
                    const gameWinUI = document.getElementById('game-win-ui');
                    if (gameWinUI) {
                        gameWinUI.style.display = 'flex';
                    }
                }
            }, 3500);

        } else {
            errors++;
            lives--;
            updateLivesDisplay();
            
            feedbackMessage.style.color = "#f87171";
            feedbackMessage.innerText = "Ce n'est pas ça...";

            if (errors === 1) {
                hintText.innerText = `Indice 1 : C'est un(e) ${currentMovieData.type} sorti en ${currentMovieData.release_year}.`;
            } else if (errors === 2) {
                hintText.innerText = "Indice 2 : Rapproche-toi et regarde bien les détails de l'objet...";
            }

            if (lives <= 0) {
                gameUI.classList.add('hidden');
                const gameOverUI = document.getElementById('game-over-ui');
                const gameOverMessage = document.getElementById('game-over-message');
                gameOverMessage.innerText = `C'était : ${currentMovieData.title}`;
                gameOverUI.classList.remove('hidden');
            }
        }
    }; 

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.onclick = () => { location.reload(); };
    }

    const restartWinBtn = document.getElementById('restart-win-btn'); 
    if (restartWinBtn) {
        restartWinBtn.addEventListener('click', (event) => {
            event.stopPropagation(); 
            window.location.reload(); 
        });
    }

    closeBtn.onclick = () => {
        isObjectSelected = false;
        gameUI.classList.add('hidden');
        currentMovieData = null; 
        answerInput.value = ""; 
        submitBtn.disabled = false;
        
        if (targetObject) {
            targetObject.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (child.material.emissive !== undefined) {
                        child.material.emissive.setHex(0x000000);
                    } else if (child.material.color && child.userData.oldColor) {
                        child.material.color.setHex(child.userData.oldColor);
                    }
                    child.material.needsUpdate = true;
                }
            });

            gsap.to(targetObject.position, {
                x: initialPosition.x,
                y: initialPosition.y,
                z: initialPosition.z,
                duration: 1,
                ease: "power2.inOut"
            });

            gsap.to(targetObject.rotation, {
                z: initialRotZ,
                y: initialRotY, 
                duration: 1
            });
        }
    };
} 

export function updateGameAnimations() {
    if (!targetObject || !isObjectSelected) return;
    
    if (targetObject.userData.axeRotation === "y") {
        targetObject.rotation.y += 0.01; 
    } else {
        targetObject.rotation.z += 0.01; 
    }
}