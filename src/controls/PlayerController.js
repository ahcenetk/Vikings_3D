import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { ACTIONS, settingsStore } from '../ui/settingsStore.js';

// ── Temporary debug helpers (remove once verified) ──────────────────
const DEBUG_CONTROLS = true; // temporary: requested keyboard/control diagnostics

function debugLog(...args) {
    if (DEBUG_CONTROLS) console.log('[PlayerController]', ...args);
}

export class PlayerController {
    constructor(camera, domElement, collisionSystem, {
        moveSpeed = 2.4,
        flySpeed = 3.6,
        flyMode = true,
        acceleration = 18,
        damping = 16,
        pointerSpeed = 0.85,
        requirePointerLock = true,
        autoLockOnClick = true,
        gravityEnabled = false,
        gravity = -18,
        jumpSpeed = 5.2,
        terminalVelocity = -30
    } = {}) {
        this.camera = camera;
        this.domElement = domElement;
        this.collisionSystem = collisionSystem;
        this.pointerControls = new PointerLockControls(camera, domElement);
        this.pointerControls.pointerSpeed = pointerSpeed;
        this.pointerControls.minPolarAngle = 0.08;
        this.pointerControls.maxPolarAngle = Math.PI - 0.08;

        this.moveSpeed = moveSpeed;
        this.flySpeed = flySpeed;
        this.flyMode = flyMode;
        this.acceleration = acceleration;
        this.damping = damping;
        this.requirePointerLock = requirePointerLock;
        this.autoLockOnClick = autoLockOnClick;
        this.gravityEnabled = gravityEnabled;
        this.gravity = gravity;
        this.jumpSpeed = jumpSpeed;
        this.terminalVelocity = terminalVelocity;

        this.isFPSController = true;
        this.target = new THREE.Vector3();
        this.horizontalVelocity = new THREE.Vector3();
        this.verticalVelocity = 0;
        this.grounded = false;
        this.jumpQueued = false;

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            run: false
        };

        this._enabled = true;
        this._wishDirection = new THREE.Vector3();
        this._forward = new THREE.Vector3();
        this._right = new THREE.Vector3();
        this._targetVelocity = new THREE.Vector3();
        this._movement = new THREE.Vector3();

        this.onKeyDown = this.handleKeyDown.bind(this);
        this.onKeyUp = this.handleKeyUp.bind(this);
        this.onCanvasClick = this.handleCanvasClick.bind(this);
        this.onWindowBlur = this.resetInput.bind(this);

        document.addEventListener('keydown', this.onKeyDown, { capture: true });
        document.addEventListener('keyup', this.onKeyUp, { capture: true });
        window.addEventListener('blur', this.onWindowBlur);
        domElement.addEventListener('click', this.onCanvasClick);

        // Reset keys when settings open, but DON'T react to every state change
        this.unsubscribeSettings = settingsStore.subscribe((state) => {
            if (state.isSettingsOpen) this.resetInput();
        });

        debugLog('Initialized', { moveSpeed, flySpeed, flyMode, requirePointerLock });
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(value) {
        this._enabled = value;
        this.pointerControls.enabled = value;
        if (!value) this.resetInput();
        debugLog('enabled =', value);
    }

    get isLocked() {
        return this.pointerControls.isLocked;
    }

    lock() {
        if (this.enabled) this.pointerControls.lock();
    }

    unlock() {
        if (this.isLocked) this.pointerControls.unlock();
    }

    suspend({ unlock = true } = {}) {
        debugLog('suspend()', { unlock });
        this.enabled = false;
        if (unlock) this.unlock();
    }

    resume() {
        debugLog('resume()');
        this.enabled = true;
    }

    update(delta = 0) {
        this.updateLookTarget();
        if (delta <= 0) return;
        if (!this.enabled) return;
        if (this.requirePointerLock && !this.isLocked) return;

        this.updateMovementVelocity(delta);
        this._movement.set(
            this.horizontalVelocity.x * delta,
            this.flyMode ? this.horizontalVelocity.y * delta : 0,
            this.horizontalVelocity.z * delta
        );

        if (this.gravityEnabled) {
            this.applyGravity(delta);
            this._movement.y = this.verticalVelocity * delta;
        }

        const resolved = this.collisionSystem.resolveMovement(this.camera.position, this._movement, {
            includeY: this.flyMode || this.gravityEnabled,
            allowSteps: !this.flyMode && this.gravityEnabled && this.grounded
        });

        this.camera.position.copy(resolved.position);

        if (resolved.blockedAxes.x) this.horizontalVelocity.x = 0;
        if (resolved.blockedAxes.y) this.horizontalVelocity.y = 0;
        if (resolved.blockedAxes.z) this.horizontalVelocity.z = 0;

        if (this.gravityEnabled) {
            this.resolveFloorAfterMove(resolved);
        }

        this.updateLookTarget();
        this.collisionSystem.updatePlayerDebugHelper(this.camera.position);
    }

    lookAt(point) {
        this.camera.lookAt(point);
        this.updateLookTarget();
    }

    teleport(position, lookAtTarget = null) {
        this.camera.position.copy(position);
        if (lookAtTarget) this.lookAt(lookAtTarget);
        this.horizontalVelocity.set(0, 0, 0);
        this.verticalVelocity = 0;
        this.collisionSystem.updatePlayerDebugHelper(this.camera.position);
    }

    dispose() {
        document.removeEventListener('keydown', this.onKeyDown, { capture: true });
        document.removeEventListener('keyup', this.onKeyUp, { capture: true });
        window.removeEventListener('blur', this.onWindowBlur);
        this.domElement.removeEventListener('click', this.onCanvasClick);
        this.unsubscribeSettings?.();
        this.pointerControls.dispose();
    }

    setFlyMode(enabled) {
        if (this.flyMode === enabled) return; // guard against no-op resets
        debugLog('setFlyMode', enabled);
        this.flyMode = enabled;
        this.verticalVelocity = 0;
        this.horizontalVelocity.y = 0;
        this.keys.up = false;
        this.keys.down = false;
    }

    toggleFlyMode() {
        this.setFlyMode(!this.flyMode);
        return this.flyMode;
    }

    getCurrentSpeed() {
        return this.flyMode ? this.flySpeed : this.moveSpeed;
    }

    updateMovementVelocity(delta) {
        this._wishDirection.set(0, 0, 0);

        const forwardInput = Number(this.keys.forward) - Number(this.keys.backward);
        const rightInput = Number(this.keys.right) - Number(this.keys.left);
        const verticalInput = this.flyMode ? Number(this.keys.up) - Number(this.keys.down) : 0;

        if (forwardInput !== 0) {
            this.pointerControls.getDirection(this._forward);
            this._forward.y = 0;
            this._forward.normalize();
            this._wishDirection.addScaledVector(this._forward, forwardInput);
        }

        if (rightInput !== 0) {
            this._right.setFromMatrixColumn(this.camera.matrixWorld, 0);
            this._right.y = 0;
            this._right.normalize();
            this._wishDirection.addScaledVector(this._right, rightInput);
        }

        if (verticalInput !== 0) {
            this._wishDirection.y += verticalInput;
        }

        if (this._wishDirection.lengthSq() > 1) {
            this._wishDirection.normalize();
        }

        const speed = this.getCurrentSpeed();
        this._targetVelocity.copy(this._wishDirection).multiplyScalar(speed);

        const smoothing = this._wishDirection.lengthSq() > 0 ? this.acceleration : this.damping;
        this.horizontalVelocity.x = THREE.MathUtils.damp(this.horizontalVelocity.x, this._targetVelocity.x, smoothing, delta);
        this.horizontalVelocity.y = THREE.MathUtils.damp(this.horizontalVelocity.y, this._targetVelocity.y, smoothing, delta);
        this.horizontalVelocity.z = THREE.MathUtils.damp(this.horizontalVelocity.z, this._targetVelocity.z, smoothing, delta);
    }

    applyGravity(delta) {
        const floor = this.collisionSystem.detectFloor(this.camera.position);
        this.grounded = Boolean(floor && Math.abs(floor.eyeY - this.camera.position.y) <= this.collisionSystem.player.floorSnapDistance + 0.04);

        if (this.grounded && this.verticalVelocity < 0) {
            this.camera.position.y = floor.eyeY;
            this.verticalVelocity = 0;
        }

        if (this.jumpQueued && this.grounded) {
            this.verticalVelocity = this.jumpSpeed;
            this.grounded = false;
        }

        this.jumpQueued = false;
        this.verticalVelocity = Math.max(this.terminalVelocity, this.verticalVelocity + this.gravity * delta);
    }

    resolveFloorAfterMove(resolved) {
        if (resolved.blockedAxes.y && this.verticalVelocity < 0) {
            this.verticalVelocity = 0;
            this.grounded = true;
        }

        const floor = this.collisionSystem.detectFloor(this.camera.position);
        if (floor && this.verticalVelocity <= 0) {
            this.camera.position.y = floor.eyeY;
            this.verticalVelocity = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    }

    updateLookTarget(distance = 5) {
        this.pointerControls.getDirection(this._forward);
        this.target.copy(this.camera.position).addScaledVector(this._forward, distance);
        return this.target;
    }

    handleCanvasClick(event) {
        console.log('[FPS] canvas clicked — click target:', event.target?.tagName, event.target?.id || '');

        if (!this.autoLockOnClick || !this.enabled || this.isLocked) return;
        if (event.target !== this.domElement) return;
        if (settingsStore.getState().isSettingsOpen) return;

        console.log('[FPS] pointer lock requested');
        this.lock();

        // PointerLockControls fires 'lock' event when the lock is granted
        if (!this._lockLoggerAttached) {
            this._lockLoggerAttached = true;
            this.pointerControls.addEventListener('lock', () => {
                console.log('[FPS] pointer lock active ✅');
            });
            this.pointerControls.addEventListener('unlock', () => {
                console.log('[FPS] pointer lock released');
            });
        }
    }

    handleKeyDown(event) {
        if (this.shouldIgnoreKeyboardEvent(event)) return;

        const state = settingsStore.getState();

        // When settings open or remapping active, don't process game keys
        if (state.isSettingsOpen) return;

        const action = settingsStore.getActionForCode(event.code);
        if (!action) return;

        debugLog('keydown', event.code, event.key, '->', action, {
            enabled: this.enabled,
            locked: this.isLocked,
            keybinds: state.keybinds
        });

        // Settings toggle is handled by GameSettingsMenu, not here
        if (action === ACTIONS.OPEN_SETTINGS) return;
        if (action === ACTIONS.INTERACT) return;
        if (action === ACTIONS.FLY_MODE && event.repeat) return;

        event.preventDefault();
        event.stopPropagation();
        this.setKey(action, true);
    }

    handleKeyUp(event) {
        if (settingsStore.getState().isSettingsOpen) return;

        const action = settingsStore.getActionForCode(event.code);
        if (!action) return;
        if (action === ACTIONS.OPEN_SETTINGS || action === ACTIONS.INTERACT) return;

        debugLog('keyup', event.code, event.key, '->', action, {
            enabled: this.enabled,
            locked: this.isLocked
        });

        event.preventDefault();
        event.stopPropagation();
        this.setKey(action, false);
    }

    setKey(action, pressed) {
        switch (action) {
            case ACTIONS.FORWARD:
                this.keys.forward = pressed;
                break;
            case ACTIONS.BACKWARD:
                this.keys.backward = pressed;
                break;
            case ACTIONS.LEFT:
                this.keys.left = pressed;
                break;
            case ACTIONS.RIGHT:
                this.keys.right = pressed;
                break;
            case ACTIONS.DOWN:
                if (this.flyMode) {
                    this.keys.down = pressed;
                } else {
                    this.keys.run = pressed;
                }
                break;
            case ACTIONS.UP:
                if (this.flyMode) {
                    this.keys.up = pressed;
                } else if (pressed) {
                    this.jumpQueued = true;
                }
                break;
            case ACTIONS.FLY_MODE:
                if (pressed) {
                    const enabled = this.toggleFlyMode();
                    settingsStore.setState({ flyMode: enabled });
                }
                break;
            default:
                break;
        }
    }

    resetInput() {
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
        this.keys.up = false;
        this.keys.down = false;
        this.keys.run = false;
        this.jumpQueued = false;
        this.horizontalVelocity.set(0, 0, 0);
    }

    shouldIgnoreKeyboardEvent(event) {
        const element = event.target;
        if (!element) return false;

        const tagName = element.tagName?.toLowerCase();
        return tagName === 'input'
            || tagName === 'textarea'
            || tagName === 'select'
            || element.isContentEditable;
    }
}
