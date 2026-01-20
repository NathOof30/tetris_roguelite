/**
 * @fileoverview Audio manager for Tetris game
 * Handles music and sound effects with Web Audio API
 */

import config from '../utils/Config.js';
import { globalEvents } from '../utils/EventEmitter.js';

/**
 * AudioManager class
 * Uses synthesized sounds for a complete experience without external files
 */
export class AudioManager {
    constructor() {
        this.context = null;
        this.enabled = config.get('audio.enabled');
        this.musicVolume = config.get('audio.musicVolume');
        this.sfxVolume = config.get('audio.sfxVolume');
        this.muted = false;

        // Music state
        this.musicPlaying = false;
        this.musicOscillators = [];
        this.musicGain = null;

        // Initialize on first interaction
        this.initialized = false;

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);

            this.sfxGain = this.context.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxVolume;

            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    /**
     * Set up event listeners for audio triggers
     */
    setupEventListeners() {
        globalEvents.on('pieceMoved', () => this.play('move'));
        globalEvents.on('pieceRotated', () => this.play('rotate'));
        globalEvents.on('pieceLocked', () => this.play('lock'));
        globalEvents.on('softDrop', () => this.play('softDrop'));
        globalEvents.on('hardDrop', () => this.play('hardDrop'));
        globalEvents.on('hold', () => this.play('hold'));
        globalEvents.on('linesCleared', (data) => {
            if (data.count === 4) {
                this.play('tetris');
            } else {
                this.play('lineClear');
            }
        });
        globalEvents.on('levelUp', () => this.play('levelUp'));
        globalEvents.on('gameOver', () => {
            this.stopMusic();
            this.play('gameOver');
        });
        globalEvents.on('gameStart', () => this.startMusic());
        globalEvents.on('paused', () => this.pauseMusic());
        globalEvents.on('resumed', () => this.resumeMusic());
        globalEvents.on('toggleMute', () => this.toggleMute());
        globalEvents.on('musicVolumeChange', (vol) => this.setMusicVolume(vol));
        globalEvents.on('sfxVolumeChange', (vol) => this.setSfxVolume(vol));
        globalEvents.on('audioToggle', (enabled) => {
            this.enabled = enabled;
            if (!enabled) this.stopMusic();
        });

        // Handle tab visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseMusic();
            } else if (this.musicPlaying) {
                this.resumeMusic();
            }
        });
    }

    /**
     * Play a sound effect
     * @param {string} sound - Sound name
     */
    play(sound) {
        if (!this.enabled || this.muted || !this.initialized) return;

        // Resume context if needed
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        switch (sound) {
            case 'move':
                this.playTone(200, 0.05, 'square', 0.1);
                break;
            case 'rotate':
                this.playTone(400, 0.08, 'sine', 0.15);
                break;
            case 'lock':
                this.playTone(150, 0.15, 'triangle', 0.2);
                break;
            case 'softDrop':
                this.playTone(180, 0.03, 'square', 0.05);
                break;
            case 'hardDrop':
                this.playNoise(0.15, 0.3);
                this.playTone(100, 0.1, 'sawtooth', 0.2);
                break;
            case 'hold':
                this.playTone(300, 0.1, 'sine', 0.1);
                this.playTone(450, 0.1, 'sine', 0.1, 0.05);
                break;
            case 'lineClear':
                this.playArpeggio([523, 659, 784], 0.1, 0.15);
                break;
            case 'tetris':
                this.playArpeggio([523, 659, 784, 1047], 0.15, 0.2);
                this.playNoise(0.3, 0.1);
                break;
            case 'levelUp':
                this.playArpeggio([262, 330, 392, 523, 659, 784], 0.1, 0.2);
                break;
            case 'gameOver':
                this.playTone(200, 0.3, 'sawtooth', 0.3);
                this.playTone(150, 0.3, 'sawtooth', 0.3, 0.15);
                this.playTone(100, 0.5, 'sawtooth', 0.3, 0.3);
                break;
        }
    }

    /**
     * Play a simple tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type
     * @param {number} volume - Volume (0-1)
     * @param {number} delay - Delay before playing
     */
    playTone(frequency, duration, type = 'sine', volume = 0.1, delay = 0) {
        if (!this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0, this.context.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(
            volume * this.sfxVolume,
            this.context.currentTime + delay + 0.01
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            this.context.currentTime + delay + duration
        );

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

        oscillator.start(this.context.currentTime + delay);
        oscillator.stop(this.context.currentTime + delay + duration + 0.01);
    }

    /**
     * Play an arpeggio (sequence of tones)
     * @param {number[]} frequencies - Array of frequencies
     * @param {number} noteDuration - Duration per note
     * @param {number} volume - Volume
     */
    playArpeggio(frequencies, noteDuration, volume) {
        frequencies.forEach((freq, i) => {
            this.playTone(freq, noteDuration, 'sine', volume, i * noteDuration * 0.5);
        });
    }

    /**
     * Play noise (for impact sounds)
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume
     */
    playNoise(duration, volume) {
        if (!this.context) return;

        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();

        source.buffer = buffer;

        gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

        source.connect(gainNode);
        gainNode.connect(this.sfxGain);

        source.start();
        source.stop(this.context.currentTime + duration);
    }

    /**
     * Start background music
     */
    startMusic() {
        if (!this.enabled || !this.initialized) return;

        this.stopMusic();
        this.musicPlaying = true;
        this.playBackgroundLoop();
    }

    /**
     * Play a simple background music loop
     */
    playBackgroundLoop() {
        if (!this.musicPlaying || !this.context) return;

        // Simple Tetris-inspired melody pattern
        const melody = [
            { note: 659, duration: 0.25 },  // E5
            { note: 494, duration: 0.125 }, // B4
            { note: 523, duration: 0.125 }, // C5
            { note: 587, duration: 0.25 },  // D5
            { note: 523, duration: 0.125 }, // C5
            { note: 494, duration: 0.125 }, // B4
            { note: 440, duration: 0.25 },  // A4
            { note: 440, duration: 0.125 }, // A4
            { note: 523, duration: 0.125 }, // C5
            { note: 659, duration: 0.25 },  // E5
            { note: 587, duration: 0.125 }, // D5
            { note: 523, duration: 0.125 }, // C5
            { note: 494, duration: 0.375 }, // B4
            { note: 523, duration: 0.125 }, // C5
            { note: 587, duration: 0.25 },  // D5
            { note: 659, duration: 0.25 },  // E5
            { note: 523, duration: 0.25 },  // C5
            { note: 440, duration: 0.25 },  // A4
            { note: 440, duration: 0.5 },   // A4
        ];

        const tempo = 0.5; // Time multiplier
        let time = this.context.currentTime;

        melody.forEach(({ note, duration }) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'square';
            osc.frequency.value = note;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1 * this.musicVolume, time + 0.01);
            gain.gain.setValueAtTime(0.1 * this.musicVolume, time + duration * tempo - 0.02);
            gain.gain.linearRampToValueAtTime(0, time + duration * tempo);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + duration * tempo);

            this.musicOscillators.push(osc);

            time += duration * tempo;
        });

        // Loop
        const loopDuration = melody.reduce((sum, n) => sum + n.duration * tempo, 0);
        setTimeout(() => {
            if (this.musicPlaying) {
                this.playBackgroundLoop();
            }
        }, loopDuration * 1000);
    }

    /**
     * Stop background music
     */
    stopMusic() {
        this.musicPlaying = false;
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Already stopped
            }
        });
        this.musicOscillators = [];
    }

    /**
     * Pause music
     */
    pauseMusic() {
        if (this.context && this.context.state === 'running') {
            this.context.suspend();
        }
    }

    /**
     * Resume music
     */
    resumeMusic() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.muted = !this.muted;

        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 1;
        }

        globalEvents.emit('muteChanged', this.muted);
    }

    /**
     * Set music volume
     * @param {number} volume - Volume (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.musicGain) {
            this.musicGain.gain.value = volume;
        }
    }

    /**
     * Set SFX volume
     * @param {number} volume - Volume (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = volume;
        if (this.sfxGain) {
            this.sfxGain.gain.value = volume;
        }
    }

    /**
     * Clean up
     */
    destroy() {
        this.stopMusic();
        if (this.context) {
            this.context.close();
        }
    }
}

export default AudioManager;
