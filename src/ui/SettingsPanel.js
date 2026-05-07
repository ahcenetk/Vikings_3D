import { createKeybindRow } from './KeybindRow.js';
import { createSliderControl } from './SliderControl.js';
import { createToggleControl } from './ToggleControl.js';
import { KEYBIND_ACTIONS, settingsStore } from './settingsStore.js';

// ── Helpers ──────────────────────────────────────────────────────────

function createSection(titleText) {
    const section = document.createElement('section');
    section.className = 'settings-section';

    const title = document.createElement('h3');
    title.textContent = titleText;

    section.append(title);
    return section;
}

// ── Tab bar ──────────────────────────────────────────────────────────

const TABS = [
    { id: 'audio',    label: '♫ Audio' },
    { id: 'controls', label: '⌨ Commandes' },
    { id: 'gameplay', label: '⚔ Gameplay' },
    { id: 'debug',    label: '⚙ Debug' }
];

function createTabBar(onTabChange) {
    const bar = document.createElement('nav');
    bar.className = 'settings-tabs';

    const buttons = TABS.map((tab) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'settings-tab';
        btn.dataset.tab = tab.id;
        btn.textContent = tab.label;
        btn.addEventListener('click', () => onTabChange(tab.id));
        bar.append(btn);
        return btn;
    });

    return {
        element: bar,
        setActive(tabId) {
            buttons.forEach((btn) => {
                btn.classList.toggle('is-active', btn.dataset.tab === tabId);
            });
        }
    };
}

// ── Main factory ─────────────────────────────────────────────────────

export function createSettingsPanel({
    audioManager,
    controls,
    collisionSystem,
    scene,
    camera,
    onClose,
    onCaptureStart
}) {
    // ── Overlay + Panel structure ─────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'settings-overlay';
    overlay.hidden = true;

    const panel = document.createElement('aside');
    panel.className = 'settings-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'settings-title');

    // ── Header ───────────────────────────────────────────────────────
    const header = document.createElement('header');
    header.className = 'settings-panel-header';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'settings-eyebrow';
    eyebrow.textContent = 'Hall viking';

    const title = document.createElement('h2');
    title.id = 'settings-title';
    title.textContent = 'Paramètres';

    const closeButton = document.createElement('button');
    closeButton.className = 'settings-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Fermer');
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', () => onClose?.());

    header.append(eyebrow, title, closeButton);

    // ── Tab system ───────────────────────────────────────────────────
    let activeTab = 'audio';
    const tabPanels = {};

    const tabBar = createTabBar((tabId) => {
        activeTab = tabId;
        tabBar.setActive(tabId);
        Object.entries(tabPanels).forEach(([id, el]) => {
            el.hidden = id !== tabId;
        });
    });

    // ── Body ─────────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'settings-panel-body';

    // ═══════════════════════════════════════════════════════════════════
    // TAB: Audio
    // ═══════════════════════════════════════════════════════════════════
    const audioPanel = document.createElement('div');
    audioPanel.className = 'settings-tab-panel';

    const audioSection = createSection('Audio');
    const audioStatus = document.createElement('p');
    audioStatus.className = 'settings-status';

    const musicToggle = createToggleControl({
        label: 'Musique',
        description: 'Musique activée',
        checked: settingsStore.getState().musicEnabled,
        onChange: (checked) => settingsStore.setState({ musicEnabled: checked })
    });

    const musicSlider = createSliderControl({
        label: 'Volume musique',
        value: settingsStore.getState().musicVolume,
        min: 0,
        max: 1,
        step: 0.01,
        format: (value) => `${Math.round(value * 100)}%`,
        onInput: (value) => settingsStore.setState({ musicVolume: value })
    });

    audioSection.append(audioStatus, musicToggle.element, musicSlider.element);
    audioPanel.append(audioSection);
    tabPanels.audio = audioPanel;

    // ═══════════════════════════════════════════════════════════════════
    // TAB: Commandes (keybinds)
    // ═══════════════════════════════════════════════════════════════════
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'settings-tab-panel';
    controlsPanel.hidden = true;

    const controlsSection = createSection('Commandes');
    const keybindList = document.createElement('div');
    keybindList.className = 'keybind-list';
    const keybindRows = KEYBIND_ACTIONS.map((action) => createKeybindRow({
        action,
        store: settingsStore,
        onCaptureStart
    }));
    keybindRows.forEach((row) => keybindList.append(row.element));

    const conflictNote = document.createElement('p');
    conflictNote.className = 'settings-conflict-note';
    conflictNote.hidden = true;
    conflictNote.textContent = 'Touche déjà utilisée';

    const resetButton = document.createElement('button');
    resetButton.className = 'settings-reset';
    resetButton.type = 'button';
    resetButton.textContent = 'Réinitialiser par défaut';
    resetButton.addEventListener('click', () => settingsStore.resetKeybinds());

    controlsSection.append(keybindList, conflictNote, resetButton);
    controlsPanel.append(controlsSection);
    tabPanels.controls = controlsPanel;

    // ═══════════════════════════════════════════════════════════════════
    // TAB: Gameplay
    // ═══════════════════════════════════════════════════════════════════
    const gameplayPanel = document.createElement('div');
    gameplayPanel.className = 'settings-tab-panel';
    gameplayPanel.hidden = true;

    const gameplaySection = createSection('Gameplay');
    const flyModeToggle = createToggleControl({
        label: 'Fly mode',
        checked: settingsStore.getState().flyMode,
        onChange: (checked) => settingsStore.setState({ flyMode: checked })
    });
    const moveSpeedSlider = createSliderControl({
        label: 'Vitesse',
        value: settingsStore.getState().moveSpeed,
        min: 0.5,
        max: 8,
        step: 0.1,
        format: (value) => value.toFixed(1),
        onInput: (value) => settingsStore.setState({ moveSpeed: value })
    });
    const playerHeightSlider = createSliderControl({
        label: 'Hauteur joueur',
        value: settingsStore.getState().playerHeight,
        min: 0.8,
        max: 2.4,
        step: 0.05,
        format: (value) => `${value.toFixed(2)} m`,
        onInput: (value) => {
            const maxEyeHeight = Math.max(0.5, value - 0.05);
            const cameraHeight = Math.min(settingsStore.getState().cameraHeight, maxEyeHeight);
            settingsStore.setState({ playerHeight: value, cameraHeight });
        }
    });
    const cameraHeightSlider = createSliderControl({
        label: 'Hauteur caméra',
        value: settingsStore.getState().cameraHeight,
        min: 0.6,
        max: 2.2,
        step: 0.05,
        format: (value) => `${value.toFixed(2)} m`,
        onInput: (value) => {
            const maxEyeHeight = Math.max(0.5, settingsStore.getState().playerHeight - 0.05);
            settingsStore.setState({ cameraHeight: Math.min(value, maxEyeHeight) });
        }
    });

    gameplaySection.append(
        flyModeToggle.element,
        moveSpeedSlider.element,
        playerHeightSlider.element,
        cameraHeightSlider.element
    );
    gameplayPanel.append(gameplaySection);
    tabPanels.gameplay = gameplayPanel;

    // ═══════════════════════════════════════════════════════════════════
    // TAB: Debug
    // ═══════════════════════════════════════════════════════════════════
    const debugPanel = document.createElement('div');
    debugPanel.className = 'settings-tab-panel';
    debugPanel.hidden = true;

    const debugSection = createSection('Debug avancé');
    const showCollidersToggle = createToggleControl({
        label: 'Afficher colliders',
        checked: settingsStore.getState().showColliders,
        onChange: (checked) => settingsStore.setState({ showColliders: checked })
    });
    const logCollisionsToggle = createToggleControl({
        label: 'Log collisions',
        checked: settingsStore.getState().logCollisions,
        onChange: (checked) => settingsStore.setState({ logCollisions: checked })
    });
    const colliderShrinkSlider = createSliderControl({
        label: 'Shrink colliders',
        value: settingsStore.getState().colliderShrink,
        min: 0,
        max: 0.35,
        step: 0.01,
        format: (value) => value.toFixed(2),
        onInput: (value) => settingsStore.setState({ colliderShrink: value })
    });

    debugSection.append(
        showCollidersToggle.element,
        logCollisionsToggle.element,
        colliderShrinkSlider.element
    );
    debugPanel.append(debugSection);
    tabPanels.debug = debugPanel;

    // ── Assemble ─────────────────────────────────────────────────────
    Object.values(tabPanels).forEach((p) => body.append(p));
    panel.append(header, tabBar.element, body);
    overlay.append(panel);
    tabBar.setActive(activeTab);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) onClose?.();
    });
    panel.addEventListener('click', (event) => event.stopPropagation());

    // ── State tracking (avoid redundant side-effects) ────────────────
    let previousEyeHeight = settingsStore.getState().cameraHeight;
    let previousMusicEnabled = null;
    let previousMusicVolume = null;
    let previousFlyMode = settingsStore.getState().flyMode;
    let previousMoveSpeed = settingsStore.getState().moveSpeed;
    let previousPlayerHeight = settingsStore.getState().playerHeight;
    let previousCameraHeight = settingsStore.getState().cameraHeight;
    let previousShowColliders = settingsStore.getState().showColliders;
    let previousLogCollisions = settingsStore.getState().logCollisions;
    let previousColliderShrink = settingsStore.getState().colliderShrink;

    function applyState(state) {
        // ── Audio UI sync ────────────────────────────────────────────
        audioStatus.textContent = state.musicEnabled ? 'Musique activée' : 'Musique coupée';
        musicToggle.setChecked(state.musicEnabled);
        musicToggle.setDescription(state.musicEnabled ? 'Musique activée' : 'Musique coupée');
        musicSlider.setValue(state.musicVolume);

        // Audio side-effects: only when values actually changed
        if (previousMusicVolume === null || Math.abs(previousMusicVolume - state.musicVolume) > 0.0001) {
            audioManager.setMusicVolume(state.musicVolume, { persist: true, updateSlider: false });
            previousMusicVolume = state.musicVolume;
        }

        if (previousMusicEnabled === null) {
            if (audioManager.muted !== !state.musicEnabled) {
                audioManager.setMuted(!state.musicEnabled);
            }
            previousMusicEnabled = state.musicEnabled;
        } else if (previousMusicEnabled !== state.musicEnabled) {
            audioManager.setMuted(!state.musicEnabled);
            previousMusicEnabled = state.musicEnabled;
        }

        // ── Gameplay side-effects: only when values changed ──────────
        // FLY MODE — critical fix: only call setFlyMode when it actually changes
        if (previousFlyMode !== state.flyMode) {
            controls.setFlyMode(state.flyMode);
            previousFlyMode = state.flyMode;
        }
        flyModeToggle.setChecked(state.flyMode);

        // Move speed
        if (Math.abs(previousMoveSpeed - state.moveSpeed) > 0.0001) {
            controls.moveSpeed = state.moveSpeed;
            controls.flySpeed = Math.max(state.moveSpeed, state.moveSpeed * 1.5);
            previousMoveSpeed = state.moveSpeed;
        }
        moveSpeedSlider.setValue(state.moveSpeed);

        // Camera height — adjust camera Y position
        if (Math.abs(previousCameraHeight - state.cameraHeight) > 0.0001) {
            const footY = camera.position.y - previousEyeHeight;
            camera.position.y = footY + state.cameraHeight;
            previousEyeHeight = state.cameraHeight;
            previousCameraHeight = state.cameraHeight;
        }
        cameraHeightSlider.setValue(state.cameraHeight);

        // Player height
        if (Math.abs(previousPlayerHeight - state.playerHeight) > 0.0001) {
            collisionSystem.player.height = state.playerHeight;
            previousPlayerHeight = state.playerHeight;
        }
        playerHeightSlider.setValue(state.playerHeight);

        // Collision system eye height
        collisionSystem.player.eyeHeight = state.cameraHeight;
        collisionSystem.updatePlayerDebugHelper(camera.position);

        // ── Debug side-effects ───────────────────────────────────────
        if (previousShowColliders !== state.showColliders) {
            collisionSystem.enableColliderDebug(state.showColliders, scene, camera);
            previousShowColliders = state.showColliders;
        }
        showCollidersToggle.setChecked(state.showColliders);

        if (previousLogCollisions !== state.logCollisions) {
            collisionSystem.logBlockedCollisions = state.logCollisions;
            previousLogCollisions = state.logCollisions;
        }
        logCollisionsToggle.setChecked(state.logCollisions);

        colliderShrinkSlider.setValue(state.colliderShrink);

        // ── Keybinds UI ──────────────────────────────────────────────
        keybindRows.forEach((row) => row.render(state));
        conflictNote.hidden = !KEYBIND_ACTIONS.some((action) => settingsStore.getKeybindIssue(action.id));
    }

    const unsubscribe = settingsStore.subscribe(applyState);

    return {
        element: overlay,
        render(state) {
            overlay.hidden = !state.isSettingsOpen;
            overlay.classList.toggle('is-open', state.isSettingsOpen);
            keybindRows.forEach((row) => row.render(state));
        },
        setCapturing(actionId) {
            keybindRows.forEach((row) => row.setCapturing(row.actionId === actionId));
        },
        destroy() {
            unsubscribe();
        }
    };
}
