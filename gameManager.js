import * as THREE from 'three';
import { camera, scene } from './scene.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// États du jeu
let isShieldSelected = false;
let targetShield = null;
let initialPosition = new THREE.Vector3();
let initialRotZ = 0;

// Logique Quiz
let lives = 3;
let errors = 0;
let movieData = null;

// 1. CHARGEMENT DE L'API (Générée par scraper.py)
async function loadGameData() {
    try {
        const response = await fetch('/movies_data.json'); 
        const data = await response.json();
        
        // On cherche l'ID exact généré par ton scraper pour Vikings
        movieData = data.find(m => m.id === "vikings");
        
        if (movieData) {
            console.log("✅ Données Vikings chargées :", movieData.title);
            updateLivesDisplay();
        }
    } catch (e) {
        console.error("❌ Erreur de lecture du JSON. Vérifie que le scraper a bien tourné !", e);
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

    // DÉTECTION DU CLIC
    window.addEventListener('click', (event) => {
        if (isShieldSelected || !movieData) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            let shieldObj = null;

            // On vérifie si l'objet ou un parent a l'ID "bouclier"
            if (obj.userData.id === "bouclier") shieldObj = obj;
            else {
                obj.traverseAncestors((ancestor) => {
                    if (ancestor.userData.id === "bouclier") shieldObj = ancestor;
                });
            }

            if (shieldObj) {
                targetShield = shieldObj;
                isShieldSelected = true;
                initialPosition.copy(targetShield.position);
                initialRotZ = targetShield.rotation.z;

                // On fait briller l'objet
                targetShield.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissive = new THREE.Color(0x443300);
                        child.material.emissiveIntensity = 1;
                    }
                });

                gameUI.classList.remove('hidden');
                feedbackMessage.innerText = "";
                hintText.innerText = "De quelle œuvre provient ce bouclier ?";
            }
        }
    });

 // 2. LOGIQUE DE VALIDATION
    submitBtn.onclick = () => {
        if (!movieData) return;

        const userAnswer = answerInput.value.toLowerCase().trim();

        // --- SI BONNE RÉPONSE ---
        if (movieData.accepted_answers.includes(userAnswer)) {
            feedbackMessage.style.color = "#4ade80";
            feedbackMessage.innerText = "Félicitations ! ✨";
            hintText.innerText = movieData.funFact;
            submitBtn.disabled = true;

            // NOUVEAU : On fait disparaître l'objet après 3,5 secondes (le temps de lire l'anecdote)
            setTimeout(() => {
                targetShield.visible = false; // L'objet devient invisible
                gameUI.classList.add('hidden'); // On ferme l'interface de quiz
                isShieldSelected = false; // On libère la caméra et les clics
            }, 3500);

        } 
        // --- SI MAUVAISE RÉPONSE ---
        else {
            errors++;
            lives--;
            updateLivesDisplay();
            
            feedbackMessage.style.color = "#f87171";
            feedbackMessage.innerText = "Ce n'est pas ça...";

            if (errors === 1) {
                hintText.innerText = `Indice 1 : C'est un(e) ${movieData.type} sorti en ${movieData.release_year}.`;
            } else if (errors === 2) {
                hintText.innerText = "Indice 2 : On y suit les aventures de Ragnar Lothbrok et Lagertha.";
            }

            // NOUVEAU : LOGIQUE DE GAME OVER
            if (lives <= 0) {
                // On cache l'interface de quiz
                gameUI.classList.add('hidden');
                
                // On prépare et on affiche l'écran Game Over
                const gameOverUI = document.getElementById('game-over-ui');
                const gameOverMessage = document.getElementById('game-over-message');
                gameOverMessage.innerText = `C'était : ${movieData.title}`;
                gameOverUI.classList.remove('hidden');
            }
        }
    };

    // NOUVEAU : Écouteur pour le bouton Rejouer
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.onclick = () => {
            location.reload(); // Recharge la page proprement pour relancer la partie
        };
    }
    closeBtn.onclick = () => {
        isShieldSelected = false;
        gameUI.classList.add('hidden');
        if (targetShield) {
            targetShield.traverse((child) => {
                if (child.isMesh) child.material.emissive = new THREE.Color(0x000000);
            });
        }
    };
}

export function updateGameAnimations() {
    if (!targetShield || !isShieldSelected) return;

    // Animation de lévitation
    const hoverY = initialPosition.y + 0.5;
    targetShield.position.y = THREE.MathUtils.lerp(targetShield.position.y, hoverY, 0.05);
    
    // Rotation "à plat" (Z)
    targetShield.rotation.z += 0.02;
}