import * as THREE from 'three';

const STORAGE_KEYS = Object.freeze({
    volume: 'vikings.audio.musicVolume',
    muted: 'vikings.audio.muted'
});

const MUSIC_URL = '/audio/music/runar.mp3';
const FALLBACK_MUSIC_URL = '/audio/music/runar.ogg';
const DEFAULT_VOLUME = 0.3;
const FADE_IN_SECONDS = 3.5;
const FADE_OUT_SECONDS = 1.5;

class AudioManager {
    constructor() {
        this.listener = null;
        this.loader = new THREE.AudioLoader();
        this.music = null;
        this.musicBuffer = null;
        this.musicUrl = MUSIC_URL;
        this.fadeFrame = null;
        this.firstInteractionArmed = false;
        this.initialized = false;
        this.isMusicPlaying = false;
        this.loadPromise = null;

        this.volume = this.readStoredVolume();
        this.muted = this.readStoredMuted();
        this.ui = {
            button: null,
            slider: null,
            status: null
        };

        this.handleFirstInteraction = this.handleFirstInteraction.bind(this);
    }

    initAudio(camera) {
        if (!camera) throw new Error('AudioManager.initAudio requires a camera.');

        if (!this.listener) {
            this.listener = new THREE.AudioListener();
            camera.add(this.listener);
        } else if (this.listener.parent !== camera) {
            camera.add(this.listener);
        }

        if (!this.music) {
            this.music = new THREE.Audio(this.listener);
            this.music.setLoop(true);
            this.music.setVolume(0);
        }

        this.initialized = true;
        this.armFirstInteractionAutoplay();
        this.updateUI();
        return this;
    }

    async loadAmbientMusic(url = MUSIC_URL) {
        if (this.musicBuffer) return this.musicBuffer;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this.loadMusicBuffer(url)
            .catch((error) => {
                if (url === MUSIC_URL) {
                    console.warn(`Musique principale introuvable sur ${MUSIC_URL}, fallback OGG utilise.`, error);
                    return this.loadMusicBuffer(FALLBACK_MUSIC_URL);
                }
                throw error;
            })
            .then((buffer) => {
                this.musicBuffer = buffer;
                if (this.music && this.music.buffer !== buffer) {
                    this.music.setBuffer(buffer);
                }
                this.updateUI('Musique prete');
                return buffer;
            })
            .finally(() => {
                this.loadPromise = null;
            });

        return this.loadPromise;
    }

    async playAmbientMusic({ fade = true } = {}) {
        if (!this.initialized || !this.music || !this.listener) return false;

        if (this.muted) {
            this.updateUI('Audio coupe');
            return false;
        }

        await this.resumeAudioContext();
        if (!this.musicBuffer) await this.loadAmbientMusic();
        if (!this.music.buffer && this.musicBuffer) this.music.setBuffer(this.musicBuffer);

        if (!this.music.isPlaying) {
            this.music.setVolume(0);
            this.music.play();
        }

        this.isMusicPlaying = true;
        if (fade) {
            this.fadeInMusic(FADE_IN_SECONDS);
        } else {
            this.music.setVolume(this.volume);
        }

        this.updateUI('Audio actif');
        return true;
    }

    stopAmbientMusic({ fade = true } = {}) {
        if (!this.music) return;

        if (fade && this.music.isPlaying) {
            this.fadeOutMusic(FADE_OUT_SECONDS, () => this.stopMusicNow());
            return;
        }

        this.stopMusicNow();
    }

    stopMusicNow() {
        if (this.music?.isPlaying) this.music.stop();
        if (this.music) this.music.setVolume(0);
        this.isMusicPlaying = false;
        this.updateUI('Audio arrete');
    }

    setMusicVolume(value, { persist = true, updateSlider = true } = {}) {
        this.volume = THREE.MathUtils.clamp(Number(value), 0, 1);
        if (persist) this.setStoredValue(STORAGE_KEYS.volume, String(this.volume));

        if (this.music && !this.muted) {
            this.cancelFade();
            this.music.setVolume(this.volume);
        }

        if (updateSlider && this.ui.slider) {
            this.ui.slider.value = String(this.volume);
        }

        this.updateUI();
    }

    setMuted(muted) {
        this.muted = Boolean(muted);
        this.setStoredValue(STORAGE_KEYS.muted, this.muted ? '1' : '0');

        if (this.muted) {
            this.cancelFade();
            if (this.music) this.music.setVolume(0);
            this.updateUI('Audio coupe');
            return;
        }

        this.updateUI('Audio actif');
        this.playAmbientMusic({ fade: true }).catch((error) => {
            console.warn('Impossible de relancer la musique principale.', error);
            this.updateUI('Audio indisponible');
        });
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    fadeInMusic(duration = FADE_IN_SECONDS) {
        if (!this.music) return;
        this.fadeAudio(this.music, this.music.getVolume(), this.volume, duration);
    }

    fadeOutMusic(duration = FADE_OUT_SECONDS, onComplete = null) {
        if (!this.music) return;
        this.fadeAudio(this.music, this.music.getVolume(), 0, duration, onComplete);
    }

    bindAudioUI({ button, slider, status } = {}) {
        this.ui.button = typeof button === 'string' ? document.getElementById(button) : button;
        this.ui.slider = typeof slider === 'string' ? document.getElementById(slider) : slider;
        this.ui.status = typeof status === 'string' ? document.getElementById(status) : status;

        this.ui.button?.addEventListener('click', () => this.toggleMute());
        this.ui.slider?.addEventListener('input', (event) => {
            this.setMusicVolume(event.target.value);
            if (this.muted && Number(event.target.value) > 0) this.setMuted(false);
        });

        this.updateUI();
    }

    armFirstInteractionAutoplay() {
        if (this.firstInteractionArmed) return;
        this.firstInteractionArmed = true;

        const options = { once: true, passive: true, capture: true };
        window.addEventListener('pointerdown', this.handleFirstInteraction, options);
        window.addEventListener('keydown', this.handleFirstInteraction, options);
        window.addEventListener('touchstart', this.handleFirstInteraction, options);
    }

    async handleFirstInteraction() {
        try {
            await this.playAmbientMusic({ fade: true });
            this.disarmFirstInteractionAutoplay();
        } catch (error) {
            console.warn('Impossible de demarrer la musique principale.', error);
            this.updateUI('Audio indisponible');
        }
    }

    disarmFirstInteractionAutoplay() {
        if (!this.firstInteractionArmed) return;
        this.firstInteractionArmed = false;
        window.removeEventListener('pointerdown', this.handleFirstInteraction, true);
        window.removeEventListener('keydown', this.handleFirstInteraction, true);
        window.removeEventListener('touchstart', this.handleFirstInteraction, true);
    }

    async resumeAudioContext() {
        const context = this.listener?.context;
        if (context?.state === 'suspended') await context.resume();
    }

    async loadMusicBuffer(url) {
        const buffer = await new Promise((resolve, reject) => {
            this.loader.load(url, resolve, undefined, reject);
        });
        this.musicUrl = url;
        return buffer;
    }

    fadeAudio(audio, from, to, duration, onComplete = null) {
        this.cancelFade();

        const startTime = performance.now();
        const durationMs = Math.max(0.001, duration) * 1000;

        const tick = (now) => {
            const progress = Math.min(1, (now - startTime) / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            audio.setVolume(THREE.MathUtils.lerp(from, to, eased));

            if (progress < 1) {
                this.fadeFrame = requestAnimationFrame(tick);
            } else {
                this.fadeFrame = null;
                audio.setVolume(to);
                onComplete?.();
                this.updateUI();
            }
        };

        this.fadeFrame = requestAnimationFrame(tick);
    }

    cancelFade() {
        if (!this.fadeFrame) return;
        cancelAnimationFrame(this.fadeFrame);
        this.fadeFrame = null;
    }

    dispose() {
        this.disarmFirstInteractionAutoplay();
        this.cancelFade();
        this.stopAmbientMusic({ fade: false });

        if (this.music) {
            this.music.disconnect();
            this.music = null;
        }

        if (this.listener?.parent) {
            this.listener.parent.remove(this.listener);
        }
        this.listener = null;
        this.musicBuffer = null;
        this.initialized = false;
    }

    readStoredVolume() {
        const storedValue = this.getStoredValue(STORAGE_KEYS.volume);
        if (storedValue === null) return DEFAULT_VOLUME;
        const stored = Number(storedValue);
        return Number.isFinite(stored) ? THREE.MathUtils.clamp(stored, 0, 1) : DEFAULT_VOLUME;
    }

    readStoredMuted() {
        return this.getStoredValue(STORAGE_KEYS.muted) === '1';
    }

    getStoredValue(key) {
        try {
            if (typeof window === 'undefined') return null;
            return window.localStorage?.getItem(key);
        } catch (_error) {
            return null;
        }
    }

    setStoredValue(key, value) {
        try {
            if (typeof window === 'undefined') return;
            window.localStorage?.setItem(key, value);
        } catch (_error) {
            // Le jeu continue sans persistance si le navigateur bloque le stockage.
        }
    }

    updateUI(statusText = null) {
        if (this.ui.slider) this.ui.slider.value = String(this.volume);

        if (this.ui.button) {
            this.ui.button.textContent = this.muted ? 'Audio Off' : 'Audio On';
            this.ui.button.setAttribute('aria-pressed', this.muted ? 'true' : 'false');
        }

        if (this.ui.status) {
            const percent = Math.round(this.volume * 100);
            this.ui.status.textContent = statusText ?? `${this.muted ? 'Coupe' : 'Actif'} - ${percent}%`;
        }
    }
}

export const audioManager = new AudioManager();
