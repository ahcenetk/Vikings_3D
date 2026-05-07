import {
    CAMERA_EYE_HEIGHT,
    COLLIDER_SHRINK,
    COLLISION_LOG_BLOCKS,
    ENABLE_FLY_MODE,
    MOVE_SPEED,
    PLAYER_HEIGHT
} from '../config/playerSettings.js';

const SETTINGS_STORAGE_KEY = 'vikings.settings.v3';
const LEGACY_SETTINGS_STORAGE_KEYS = ['vikings.settings.v2', 'vikings.settings.v1'];
const AUDIO_VOLUME_KEY = 'vikings.audio.musicVolume';
const AUDIO_MUTED_KEY = 'vikings.audio.muted';

export const SETTINGS_DEBUG = true;

export const ACTIONS = Object.freeze({
    FORWARD: 'forward',
    BACKWARD: 'backward',
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down',
    FLY_MODE: 'flyMode',
    INTERACT: 'interact',
    OPEN_SETTINGS: 'openSettings'
});

export const KEYBIND_ACTIONS = Object.freeze([
    { id: ACTIONS.FORWARD, label: 'Avancer' },
    { id: ACTIONS.BACKWARD, label: 'Reculer' },
    { id: ACTIONS.LEFT, label: 'Aller a gauche' },
    { id: ACTIONS.RIGHT, label: 'Aller a droite' },
    { id: ACTIONS.UP, label: 'Monter' },
    { id: ACTIONS.DOWN, label: 'Descendre' },
    { id: ACTIONS.FLY_MODE, label: 'Fly mode' },
    { id: ACTIONS.INTERACT, label: 'Interagir' },
    { id: ACTIONS.OPEN_SETTINGS, label: 'Ouvrir parametres' }
]);

export const DEFAULT_KEYBINDS = Object.freeze({
    // AZERTY naturel avec event.code:
    // touche marquee Z => KeyW, touche marquee Q => KeyA.
    [ACTIONS.FORWARD]: 'KeyW',
    [ACTIONS.BACKWARD]: 'KeyS',
    [ACTIONS.LEFT]: 'KeyA',
    [ACTIONS.RIGHT]: 'KeyD',
    [ACTIONS.UP]: 'Space',
    [ACTIONS.DOWN]: 'ShiftLeft',
    [ACTIONS.FLY_MODE]: 'KeyF',
    [ACTIONS.INTERACT]: 'KeyE',
    [ACTIONS.OPEN_SETTINGS]: 'Escape'
});

const DEFAULT_KEYBIND_PRIORITY = Object.freeze(
    Object.fromEntries(KEYBIND_ACTIONS.map((action, index) => [action.id, index + 1]))
);

function readStorageValue(key) {
    try {
        if (typeof window === 'undefined') return null;
        return window.localStorage?.getItem(key) ?? null;
    } catch (_error) {
        return null;
    }
}

function writeStorageValue(key, value) {
    try {
        if (typeof window === 'undefined') return;
        window.localStorage?.setItem(key, value);
    } catch (_error) {
        // Le jeu reste jouable si le stockage navigateur est indisponible.
    }
}

function parseSettings(raw) {
    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_error) {
        return {};
    }
}

function readStoredSettings() {
    return parseSettings(readStorageValue(SETTINGS_STORAGE_KEY));
}

function readLegacyNonKeybindSettings() {
    for (const legacyKey of LEGACY_SETTINGS_STORAGE_KEYS) {
        const legacy = parseSettings(readStorageValue(legacyKey));
        if (!legacy || Object.keys(legacy).length === 0) continue;

        const { keybinds: _keybinds, keybindPriority: _priority, nextKeybindPriority: _next, ...rest } = legacy;
        if (SETTINGS_DEBUG) {
            console.info(`[settingsStore] Migrated non-keybind settings from ${legacyKey} to v3.`);
        }
        return rest;
    }

    return {};
}

function clampNumber(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
}

function sanitizeKeybinds(value) {
    return {
        ...DEFAULT_KEYBINDS,
        ...(value && typeof value === 'object' ? value : {})
    };
}

function sanitizePriority(value) {
    return {
        ...DEFAULT_KEYBIND_PRIORITY,
        ...(value && typeof value === 'object' ? value : {})
    };
}

function createInitialState() {
    let stored = readStoredSettings();
    if (!stored || Object.keys(stored).length === 0) {
        stored = readLegacyNonKeybindSettings();
    }

    const storedVolume = readStorageValue(AUDIO_VOLUME_KEY);
    const storedMuted = readStorageValue(AUDIO_MUTED_KEY);
    const playerHeight = clampNumber(stored.playerHeight, PLAYER_HEIGHT, 0.8, 2.4);
    const cameraHeight = Math.min(
        clampNumber(stored.cameraHeight, CAMERA_EYE_HEIGHT, 0.6, 2.2),
        Math.max(0.5, playerHeight - 0.05)
    );

    return {
        isSettingsOpen: false,
        activeSettingsTab: 'audio',
        musicEnabled: stored.musicEnabled ?? storedMuted !== '1',
        musicVolume: clampNumber(stored.musicVolume ?? storedVolume, 0.3, 0, 1),
        keybinds: sanitizeKeybinds(stored.keybinds),
        keybindPriority: sanitizePriority(stored.keybindPriority),
        nextKeybindPriority: clampNumber(stored.nextKeybindPriority, KEYBIND_ACTIONS.length + 1, 1, 100000),
        showColliders: Boolean(stored.showColliders ?? false),
        logCollisions: Boolean(stored.logCollisions ?? COLLISION_LOG_BLOCKS),
        flyMode: Boolean(stored.flyMode ?? ENABLE_FLY_MODE),
        moveSpeed: clampNumber(stored.moveSpeed, MOVE_SPEED, 0.5, 12),
        playerHeight,
        cameraHeight,
        colliderShrink: clampNumber(stored.colliderShrink, COLLIDER_SHRINK, 0, 0.35)
    };
}

function persistableState(state) {
    return {
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
        keybinds: state.keybinds,
        keybindPriority: state.keybindPriority,
        nextKeybindPriority: state.nextKeybindPriority,
        showColliders: state.showColliders,
        logCollisions: state.logCollisions,
        flyMode: state.flyMode,
        moveSpeed: state.moveSpeed,
        playerHeight: state.playerHeight,
        cameraHeight: state.cameraHeight,
        colliderShrink: state.colliderShrink
    };
}

class SettingsStore {
    constructor() {
        this.state = createInitialState();
        this.listeners = new Set();
        this.persist();

        if (SETTINGS_DEBUG) {
            console.info('[settingsStore] Active keybinds', this.state.keybinds);
        }
    }

    getState() {
        return this.state;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    setState(patch, { persist = true } = {}) {
        this.state = {
            ...this.state,
            ...patch
        };

        if (persist) this.persist();
        this.emit();
    }

    setSettingsOpen(isSettingsOpen) {
        this.setState({ isSettingsOpen }, { persist: false });
    }

    toggleSettings() {
        this.setSettingsOpen(!this.state.isSettingsOpen);
    }

    setActiveTab(activeSettingsTab) {
        this.setState({ activeSettingsTab }, { persist: false });
    }

    setKeybind(actionId, code) {
        if (!DEFAULT_KEYBINDS[actionId] || !code) return;

        const nextPriority = this.state.nextKeybindPriority + 1;
        const keybinds = {
            ...this.state.keybinds,
            [actionId]: code
        };

        this.setState({
            keybinds,
            keybindPriority: {
                ...this.state.keybindPriority,
                [actionId]: this.state.nextKeybindPriority
            },
            nextKeybindPriority: nextPriority
        });

        if (SETTINGS_DEBUG) {
            console.info('[settingsStore] Keybind changed', { actionId, code, keybinds });
        }
    }

    resetKeybinds() {
        this.setState({
            keybinds: { ...DEFAULT_KEYBINDS },
            keybindPriority: { ...DEFAULT_KEYBIND_PRIORITY },
            nextKeybindPriority: KEYBIND_ACTIONS.length + 1
        });
    }

    getConflictGroups() {
        const groups = new Map();

        for (const action of KEYBIND_ACTIONS) {
            const code = this.state.keybinds[action.id];
            if (!code) continue;
            if (!groups.has(code)) groups.set(code, []);
            groups.get(code).push(action.id);
        }

        groups.forEach((actions) => {
            actions.sort((a, b) => (this.state.keybindPriority[a] ?? 0) - (this.state.keybindPriority[b] ?? 0));
        });

        return groups;
    }

    getKeybindIssue(actionId) {
        const code = this.state.keybinds[actionId];
        if (!code) return null;

        const group = this.getConflictGroups().get(code);
        if (!group || group.length <= 1) return null;

        return group[0] === actionId ? null : 'Touche deja utilisee';
    }

    isActionValid(actionId) {
        return this.getKeybindIssue(actionId) === null;
    }

    getActionForCode(code) {
        if (!code) return null;

        const group = this.getConflictGroups().get(code);
        if (!group || group.length === 0) return null;

        return group[0];
    }

    persist() {
        writeStorageValue(SETTINGS_STORAGE_KEY, JSON.stringify(persistableState(this.state)));
    }

    emit() {
        this.listeners.forEach((listener) => listener(this.state));
    }
}

export function formatKeyCode(code) {
    if (!code) return '-';

    const labels = {
        KeyW: 'Z',
        KeyA: 'Q',
        KeyQ: 'A',
        KeyZ: 'W',
        Space: 'Espace',
        ShiftLeft: 'Shift',
        ShiftRight: 'Shift',
        ControlLeft: 'Ctrl',
        ControlRight: 'Ctrl',
        AltLeft: 'Alt',
        AltRight: 'Alt',
        Escape: 'Echap',
        Enter: 'Entree',
        Tab: 'Tab',
        Backspace: 'Retour',
        ArrowUp: 'Fleche haut',
        ArrowDown: 'Fleche bas',
        ArrowLeft: 'Fleche gauche',
        ArrowRight: 'Fleche droite'
    };

    if (labels[code]) return labels[code];
    if (code.startsWith('Key')) return code.slice(3).toUpperCase();
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
    return code;
}

export const settingsStore = new SettingsStore();
