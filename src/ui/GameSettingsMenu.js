import { createSettingsButton } from './SettingsButton.js';
import { createSettingsPanel } from './SettingsPanel.js';
import { ACTIONS, SETTINGS_DEBUG, settingsStore } from './settingsStore.js';

export class GameSettingsMenu {
    constructor({
        audioManager,
        controls,
        collisionSystem,
        scene,
        camera
    }) {
        this.audioManager = audioManager;
        this.controls = controls;
        this.wasLockedBeforeOpen = false;
        this.pendingKeybindAction = null;
        this.visible = false;

        this.root = document.createElement('div');
        this.root.id = 'settings-menu-root';
        this.root.className = 'settings-menu-root';

        this.button = createSettingsButton({
            onClick: () => settingsStore.toggleSettings()
        });
        this.button.setVisible(false);

        this.panel = createSettingsPanel({
            audioManager,
            controls,
            collisionSystem,
            scene,
            camera,
            onClose: () => this.close(),
            onCaptureStart: (actionId) => this.startKeyCapture(actionId)
        });

        this.root.append(this.button.element, this.panel.element);
        document.body.append(this.root);

        this.onKeyDown = this.handleKeyDown.bind(this);
        this.unsubscribe = settingsStore.subscribe((state) => this.syncState(state));

        window.addEventListener('keydown', this.onKeyDown, { capture: true });
        window.addEventListener('settings:toggle', () => settingsStore.toggleSettings());
    }

    show() {
        this.visible = true;
        this.button.setVisible(true);
    }

    open() {
        settingsStore.setSettingsOpen(true);
    }

    close() {
        this.cancelKeyCapture();
        settingsStore.setSettingsOpen(false);
    }

    startKeyCapture(actionId) {
        this.pendingKeybindAction = actionId;
        this.panel.setCapturing(actionId);
        if (SETTINGS_DEBUG) {
            console.info('[GameSettingsMenu] remapping active', {
                actionId,
                controlsEnabled: this.controls.enabled,
                pointerLocked: this.controls.isLocked,
                keybinds: settingsStore.getState().keybinds
            });
        }
    }

    cancelKeyCapture() {
        this.pendingKeybindAction = null;
        this.panel.setCapturing(null);
    }

    /**
     * Called on every settingsStore change. Manages pointer lock and controls
     * enabled state based on whether the settings menu is open.
     */
    syncState(state) {
        this.button.setOpen(state.isSettingsOpen);
        this.panel.render(state);

        if (state.isSettingsOpen) {
            // Only suspend controls once when opening
            if (this.controls.enabled) {
                this.wasLockedBeforeOpen = this.controls.isLocked;
                this.controls.suspend({ unlock: true });
            }
            document.body.classList.add('settings-open');
            return;
        }

        // Settings just closed — resume gameplay
        document.body.classList.remove('settings-open');
        if (!this.controls.enabled) {
            this.controls.resume();
            // Re-lock is attempted only if the user had pointer lock before opening.
            // The browser will typically reject lock() outside a user-gesture, which
            // is fine — the user can click the canvas to re-lock.
            if (this.wasLockedBeforeOpen && this.visible) {
                try {
                    this.controls.lock();
                } catch (_error) {
                    // Le navigateur peut refuser le lock hors geste utilisateur.
                }
            }
            this.wasLockedBeforeOpen = false;
        }
    }

    handleKeyDown(event) {
        const state = settingsStore.getState();

        // ── Active key capture for remapping ─────────────────────────
        if (this.pendingKeybindAction) {
            event.preventDefault();
            event.stopPropagation();

            if (SETTINGS_DEBUG) {
                console.info('[GameSettingsMenu] remap key pressed', {
                    actionId: this.pendingKeybindAction,
                    code: event.code,
                    key: event.key
                });
            }

            if (event.code === 'Escape') {
                // Cancel capture without closing
                this.cancelKeyCapture();
                return;
            }

            settingsStore.setKeybind(this.pendingKeybindAction, event.code);
            this.cancelKeyCapture();
            return;
        }

        // ── Escape closes the settings menu ──────────────────────────
        if (state.isSettingsOpen && event.code === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.close();
            return;
        }

        // ── Open settings from gameplay ──────────────────────────────
        // Only react if settings are closed AND the key is the settings
        // toggle binding (default: Escape). We need a small guard: if the
        // browser just exited pointer-lock because of Escape, we do NOT
        // immediately re-interpret it as "open settings". We detect this
        // by checking whether pointer lock was active very recently.
        if (!state.isSettingsOpen) {
            const action = settingsStore.getActionForCode(event.code);
            if (action === ACTIONS.OPEN_SETTINGS) {
                // If the pointer was locked, Escape already exits pointer lock.
                // Don't also open the settings menu in the same keypress.
                if (this.controls.isLocked) {
                    // Let the browser's native pointer-lock exit handle it.
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                this.open();
            }
        }
    }

    destroy() {
        window.removeEventListener('keydown', this.onKeyDown, { capture: true });
        this.unsubscribe?.();
        this.panel.destroy();
        this.root.remove();
    }
}
