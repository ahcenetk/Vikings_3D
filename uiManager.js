/**
 * uiManager.js
 * Pilote l'enchaînement des écrans : Landing → Tutoriel → Loader → Scène Three.js
 * La barre de progression suit le VRAI progrès du THREE.LoadingManager.
 */

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'];

function spawnRunesBackground(container, count = 14) {
    const wrapper = container.querySelector('.runes-bg');
    if (!wrapper) return;
    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.textContent = RUNES[Math.floor(Math.random() * RUNES.length)];
        span.style.left = `${Math.random() * 100}%`;
        span.style.animationDelay = `${Math.random() * 18}s`;
        span.style.animationDuration = `${14 + Math.random() * 12}s`;
        span.style.fontSize = `${2 + Math.random() * 4}rem`;
        wrapper.appendChild(span);
    }
}

function show(screen) { screen.classList.remove('hidden'); }
function hide(screen) { screen.classList.add('hidden'); }

function transition(from, to) {
    hide(from);
    setTimeout(() => show(to), 600);
}

/**
 * Loader réel : branché sur THREE.LoadingManager.
 * 1. Importe scene.js pour récupérer le manager (avant tout chargement)
 * 2. Attache onProgress/onLoad
 * 3. Importe main.js (déclenche tous les loader.load + textureLoader.load)
 * 4. Anime la barre lissée jusqu'à 100 % → appelle startScene()
 */
async function runLoader(loaderScreen) {
    const fill = loaderScreen.querySelector('.progress-fill');
    const percentEl = loaderScreen.querySelector('.progress-percent');

    // 1. scene.js d'abord (crée le manager, n'a pas encore lancé de chargement)
    const { loadingManager } = await import('./scene.js');

    // 2. Hooks AVANT le déclenchement des loads
    let realProgress = 0;
    let allLoaded = false;

    loadingManager.onProgress = (_url, loaded, total) => {
        realProgress = total > 0 ? (loaded / total) * 100 : 0;
    };
    loadingManager.onLoad = () => {
        realProgress = 100;
        allLoaded = true;
    };
    loadingManager.onError = (url) => {
        console.error('Erreur de chargement :', url);
    };

    // 3. main.js — déclenche tous les loads (GLB, texture). Les imports synchrones
    //    des Objets_config sont résolus avant la fin du await.
    const mainModule = await import('./main.js');

    // Cas extrême : si aucune ressource n'a été enregistrée, débloquer
    if (loadingManager.itemsTotal === 0) {
        allLoaded = true;
        realProgress = 100;
    }

    // 4. Animation lissée — ne dépasse pas 99 % tant que onLoad n'a pas tiré
    let displayedProgress = 0;
    await new Promise((resolve) => {
        const tick = () => {
            const target = allLoaded ? 100 : Math.min(99, realProgress);
            displayedProgress += (target - displayedProgress) * 0.18;

            const shown = Math.min(100, displayedProgress);
            fill.style.width = `${shown}%`;
            percentEl.textContent = `${Math.floor(shown)}%`;

            if (allLoaded && shown >= 99.5) {
                fill.style.width = '100%';
                percentEl.textContent = '100%';
                resolve();
            } else {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    });

    // Petit délai pour laisser respirer la barre pleine
    await new Promise((r) => setTimeout(r, 500));

    // 5. La scène ne démarre QU'ICI, après chargement complet
    mainModule.startScene();
}

function init() {
    const landing  = document.getElementById('landing-screen');
    const tutorial = document.getElementById('tutorial-screen');
    const loader   = document.getElementById('loader-screen');

    [landing, tutorial, loader].forEach((s) => spawnRunesBackground(s));

    document.getElementById('start-btn').addEventListener('click', () => {
        transition(landing, tutorial);
    });

    document.getElementById('begin-adventure-btn').addEventListener('click', () => {
        transition(tutorial, loader);
        // Laisse la transition d'apparition se faire avant de lancer la barre
        setTimeout(async () => {
            try {
                await runLoader(loader);
            } catch (err) {
                console.error('Erreur durant le chargement :', err);
            }
            hide(loader);
        }, 800);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
