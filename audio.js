/* ==========================================================================
   THE HERMETIC ENGINE - SOUND SYSTEM (WEB AUDIO API)
   ========================================================================== */

class AlchemicalAudioEngine {
    constructor() {
        this.ctx = null;
        this.isActive = false;
        
        // Audio Nodes
        this.masterGain = null;
        this.droneOscLeft = null;
        this.droneOscRight = null;
        this.pannerLeft = null;
        this.pannerRight = null;
        this.droneLfo = null;
        this.droneLfoGain = null;
        this.filter = null;
        
        // Generative Chord Pad Nodes
        this.padOscs = [];
        this.padGains = [];
        this.padGainMaster = null;
        this.currentChordIndex = 0;
        this.chordInterval = null;
        
        // State variables
        this.baseDroneFreq = 64.22; // C2 Note aligned to Solfeggio A4=432Hz cosmic tuning
        this.state = 'zhenren';
        this.gravity = 0;
        this.speed = 1;
        this.communeY = 0.5; // Mouse cursor y-modulator
        this.eclipseActive = false; // Astrological eclipse status
        
        // Solfeggio Scale Map (Harmonics, descriptions, and visual properties)
        this.solfeggioFrequencies = {
            '432': { name: 'NEURAL SYNCHRONY', drone: 64.22, chime: 432, color: '#ffd700', desc: 'NEURAL SYNCHRONY: Induces theta-delta coherence (64.22Hz carrier, 432Hz peak resonance) to dissolve analytical chatter and quiet self-talk.' },
            '528': { name: 'CORTICAL CALMING', drone: 66.00, chime: 528, color: '#06d6a0', desc: 'CORTICAL CALMING: Dampens sympathetic arousal and stress feedback loops in prefrontal cortex networks to stabilize visceral relaxation.' },
            '396': { name: 'AMYGDALA DAMPENING', drone: 49.50, chime: 396, color: '#ff5e62', desc: 'AMYGDALA DAMPENING: De-escalates threat-detection cycles in the limbic system, grounding active consciousness in absolute safety.' },
            '639': { name: 'HEMISPHERIC BALANCE', drone: 79.88, chime: 639, color: '#ff9f1c', desc: 'HEMISPHERIC BALANCE: Encourages bilateral left-right cerebral integration, facilitating integrated, non-narrative cognitive processing.' },
            '741': { name: 'DEFAULT MODE QUIETING', drone: 46.31, chime: 741, color: '#00f5ff', desc: 'DEFAULT MODE QUIETING: Dampens default mode network activity, encouraging immediate dissolution of active logical narratives.' },
            '852': { name: 'THETA STATE INDUCTION', drone: 53.25, chime: 852, color: '#8a2be2', desc: 'THETA STATE INDUCTION: Shifts baseline awareness to deep hypnagogic dream-state frequencies, opening the profound void between thoughts.' }
        };
        this.activeSolfeggio = '432';
        
        // Heartbeat timer reference
        this.heartbeatTimer = null;
        
        // Cathedral Delay Echo Chamber Nodes
        this.delayNode = null;
        this.delayGain = null;
        
        // Waveform styling hooks
        this.waveContainer = document.getElementById('wave-container');
        this.audioIcon = document.getElementById('audio-icon');
        this.audioLabel = document.getElementById('audio-label');

        // Floating audio button elements
        this.floatingBtn = document.getElementById('floating-audio-toggle');
        this.floatingIcon = document.getElementById('floating-audio-icon');
        this.floatingLabel = document.getElementById('floating-audio-label');
        
        // Timer Quiet button element
        this.timerAudioBtn = document.getElementById('timer-audio-btn');

        // Journey Drumming States
        this.journeyDrummingActive = false;
        this.journeyDrummingPattern = 'shamanic';
        this.journeyDrummingTimer = null;
        this.drumBeatIndex = 0;
        this.drumTempo = 90; // Grounding 90BPM
        this.nextNoteTime = 0.0;
    }

    init() {
        // Create context
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        // Create master dynamics limiter to prevent digital clipping in gallery spaces
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-6.0, this.ctx.currentTime);
        this.limiter.knee.setValueAtTime(12, this.ctx.currentTime);
        this.limiter.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.limiter.release.setValueAtTime(0.25, this.ctx.currentTime);
        this.limiter.connect(this.ctx.destination);

        // Create master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.limiter);
        
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.Q.setValueAtTime(4, this.ctx.currentTime);
        this.filter.frequency.setValueAtTime(250, this.ctx.currentTime);
        this.filter.connect(this.masterGain);
        
        // Initialize Left and Right Stereo Panners for Binaural Separation
        this.pannerLeft = this.ctx.createStereoPanner();
        this.pannerLeft.pan.setValueAtTime(-1, this.ctx.currentTime);
        this.pannerLeft.connect(this.filter);
        
        this.pannerRight = this.ctx.createStereoPanner();
        this.pannerRight.pan.setValueAtTime(1, this.ctx.currentTime);
        this.pannerRight.connect(this.filter);
        
        // Initialize Core Left Drone Oscillator (Solfeggio C2 base)
        this.droneOscLeft = this.ctx.createOscillator();
        this.droneOscLeft.type = 'triangle';
        this.droneOscLeft.frequency.setValueAtTime(this.baseDroneFreq, this.ctx.currentTime);
        this.droneOscLeft.connect(this.pannerLeft);
        this.droneOscLeft.start();
        
        // Initialize Core Right Drone Oscillator (+10Hz offset for Binaural Alpha wave)
        this.droneOscRight = this.ctx.createOscillator();
        this.droneOscRight.type = 'triangle';
        this.droneOscRight.frequency.setValueAtTime(this.baseDroneFreq + 10, this.ctx.currentTime);
        this.droneOscRight.connect(this.pannerRight);
        this.droneOscRight.start();
        
        // Initialize Drone LFO (Creates the breathing, oscillating filter sweep)
        this.droneLfo = this.ctx.createOscillator();
        this.droneLfo.type = 'sine';
        this.droneLfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // Slow, breathing rate by default
        
        this.droneLfoGain = this.ctx.createGain();
        this.droneLfoGain.gain.setValueAtTime(100, this.ctx.currentTime);
        
        this.droneLfo.connect(this.droneLfoGain);
        this.droneLfoGain.connect(this.filter.frequency);
        this.droneLfo.start();
        
        // Initialize Cathedral Delay / Echo Chamber
        this.delayNode = this.ctx.createDelay(2.0);
        this.delayGain = this.ctx.createGain();
        
        this.delayNode.delayTime.setValueAtTime(0.6, this.ctx.currentTime); // 0.6s echo delay time
        this.delayGain.gain.setValueAtTime(0.4, this.ctx.currentTime);      // 0.4 feedback gain loop
        
        this.delayNode.connect(this.delayGain);
        this.delayGain.connect(this.delayNode);
        this.delayNode.connect(this.masterGain);
        
        // Initialize Generative Chord Pad Synth (Lush ambient background cloud)
        this.padGainMaster = this.ctx.createGain();
        this.padGainMaster.gain.setValueAtTime(0.06, this.ctx.currentTime); // Subtle background presence
        this.padGainMaster.connect(this.filter); // Route through dynamic filter
        
        this.padOscs = [];
        this.padGains = [];
        const padRatios = [1.0, 1.25, 1.5, 1.875]; // Initial Major 7th
        const chimeFreq = this.solfeggioFrequencies[this.activeSolfeggio].chime;
        
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            
            osc.type = 'triangle'; // Smooth, warm, harmonic-rich
            osc.frequency.setValueAtTime((chimeFreq * 0.5) * padRatios[i], this.ctx.currentTime);
            oscGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            
            osc.connect(oscGain);
            oscGain.connect(this.padGainMaster);
            osc.start();
            
            this.padOscs.push(osc);
            this.padGains.push(oscGain);
        }
        
        this.isActive = true;
        this.applyPhilosophicalState();
        
        // Start synchronized alchemical heartbeat loop
        this.scheduleNextHeartbeat();
        
        // Start generative chord morph progression loop
        this.scheduleNextChordMorph();
        
        // Smoothly fade in audio
        this.masterGain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 1.5);
        
        // Start drumming if active
        if (this.journeyDrummingActive) {
            this.startJourneyDrummingLoop();
        }
    }

    toggle() {
        if (!this.isActive) {
            // Start context or resume it
            if (!this.ctx) {
                this.init();
            } else {
                this.ctx.resume().catch(err => console.warn("Error resuming context:", err));
                const now = this.ctx.currentTime;
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
                this.masterGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
                this.scheduleNextHeartbeat();
                this.scheduleNextChordMorph();
                if (this.journeyDrummingActive) {
                    this.startJourneyDrummingLoop();
                }
            }
            this.isActive = true;
            this.audioIcon.textContent = '🔊';
            this.audioLabel.textContent = 'DEACTIVATE AURAL RESONANCE';
            this.waveContainer.classList.add('playing');

            if (this.floatingIcon) this.floatingIcon.textContent = '🔊';
            if (this.floatingLabel) this.floatingLabel.textContent = 'DEACTIVATE RESONANCE';
            if (this.floatingBtn) this.floatingBtn.classList.add('playing');
            if (this.timerAudioBtn) this.timerAudioBtn.textContent = '🔊';
        } else {
            // Mute
            this.isActive = false;
            if (this.heartbeatTimer) {
                clearTimeout(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
            if (this.chordInterval) {
                clearTimeout(this.chordInterval);
                this.chordInterval = null;
            }
            this.stopJourneyDrummingLoop();
            
            // Clean up UI toggle state
            const drummingToggle = document.getElementById('drumming-toggle');
            if (drummingToggle) {
                drummingToggle.checked = false;
            }
            this.journeyDrummingActive = false;

            if (this.ctx) {
                try {
                    const now = this.ctx.currentTime;
                    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
                    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.15);
                } catch (e) {
                    if (this.masterGain) this.masterGain.gain.value = 0;
                }
                
                // Suspend context after ramp completes to freeze the audio clock and ensure absolute silence
                setTimeout(() => {
                    if (this.ctx && !this.isActive) {
                        this.ctx.suspend().catch(err => console.log("Context suspend error:", err));
                    }
                }, 200);
            }

            this.audioIcon.textContent = '🔇';
            this.audioLabel.textContent = 'ACTIVATE AURAL RESONANCE';
            this.waveContainer.classList.remove('playing');

            if (this.floatingIcon) this.floatingIcon.textContent = '🔇';
            if (this.floatingLabel) this.floatingLabel.textContent = 'ACTIVATE AURAL RESONANCE';
            if (this.floatingBtn) this.floatingBtn.classList.remove('playing');
            if (this.timerAudioBtn) this.timerAudioBtn.textContent = '🔇';
        }
    }

    // Curator & Room Volume Calibration
    setMasterVolume(val) {
        this.curatorVolume = Math.max(0, Math.min(1, val));
        if (this.isActive && this.ctx && this.masterGain && !this.isHardwareMuted) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setTargetAtTime(this.curatorVolume * 0.35, now, 0.1);
        }
    }

    toggleHardwareMute() {
        this.isHardwareMuted = !this.isHardwareMuted;
        if (this.isActive && this.ctx && this.masterGain) {
            const now = this.ctx.currentTime;
            const target = this.isHardwareMuted ? 0 : (this.curatorVolume !== undefined ? this.curatorVolume : 0.5) * 0.35;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setTargetAtTime(target, now, 0.08);
        }
        return this.isHardwareMuted;
    }

    // Set parameters on the fly based on user input
    setGravity(gravity) {
        this.gravity = gravity;
        if (!this.isActive || !this.ctx) return;
        
        // As gravity decreases, lower the fundamental drone pitch (feels deep, floating, infinite)
        // Standard (1G) = 65.4Hz (C2). Zero G = 55.0Hz (A1). Negative G = 41.2Hz (E1).
        let targetFreq = this.baseDroneFreq;
        if (gravity < 0) {
            targetFreq = this.baseDroneFreq * (1.0 + gravity * 0.35); // Lower pitch for negative gravity
        } else if (gravity > 0) {
            targetFreq = this.baseDroneFreq * (1.0 + gravity * 0.15); // Slightly higher pitch for standard
        } else {
            targetFreq = this.baseDroneFreq * 0.85; // Pure float
        }
        
        if (this.eclipseActive) {
            targetFreq = 54.0; // Enforce deep 54Hz gravity well under Eclipse
        }
        
        this.droneOscLeft.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.8);
        this.droneOscRight.frequency.exponentialRampToValueAtTime(targetFreq + 10, this.ctx.currentTime + 0.8);
        
        // Alter LFO depth based on gravity
        const lfoDepth = 100 + (Math.abs(gravity) * 80);
        this.droneLfoGain.gain.linearRampToValueAtTime(lfoDepth, this.ctx.currentTime + 0.5);
    }

    setSpeed(speed) {
        this.speed = speed;
        if (!this.isActive || !this.ctx) return;
        
        // Map speed to filter cutoff multiplier
        const targetCutoff = 250 + (speed * 150) + (this.communeY * 500);
        this.filter.frequency.linearRampToValueAtTime(targetCutoff, this.ctx.currentTime + 0.5);
    }

    // Magnetic cursor conjunction Theremin frequency sweeps
    setCommuneModulation(yPercent) {
        // Disabled: all sound parameter values are set statically/dynamically driven exclusively by dashboard controls.
        return;
    }

    // Generative chord progression schedule
    scheduleNextChordMorph() {
        if (!this.isActive || !this.ctx) return;
        
        this.chordInterval = setTimeout(() => {
            this.morphToNextChord();
            this.scheduleNextChordMorph();
        }, 8000); // Transitions chords every 8 seconds
    }

    morphToNextChord() {
        if (!this.isActive || !this.ctx) return;
        
        this.currentChordIndex = (this.currentChordIndex + 1) % 4;
        
        const isZhenren = this.state === 'zhenren';
        const chordsZhenren = [
            [1.0, 1.25, 1.5, 1.875],     // Major 7th
            [1.0, 1.35, 1.5, 1.875],     // Lydian (#4) 7th
            [1.125, 1.35, 1.5, 2.0],     // Sus2 Lydian 9th
            [0.875, 1.0, 1.25, 1.5]      // Subdominant peaceful lift
        ];
        const chordsTrickster = [
            [1.0, 1.2, 1.4, 1.8],        // Mystic Minor / Tritone
            [0.9, 1.2, 1.5, 1.75],       // Unstable Suspended
            [1.0, 1.35, 1.414, 1.8],     // Diminished tension
            [0.8, 1.2, 1.5, 2.0]         // Dark unresolved
        ];
        
        // Deep sub-harmonic frequencies under Eclipse mode
        const chordsEclipse = [
            [1.0, 1.5, 2.0, 3.0],        // Pure octave/fifths singularity chord
            [0.75, 1.0, 1.5, 2.25],      // Muffled fifths
            [1.0, 1.333, 2.0, 2.666],    // Sub-octave resonance
            [0.5, 1.0, 1.5, 2.0]         // Absolute bottom well chord
        ];
        
        let chordSet = isZhenren ? chordsZhenren : chordsTrickster;
        if (this.eclipseActive) {
            chordSet = chordsEclipse;
        }
        
        const ratios = chordSet[this.currentChordIndex];
        const chimeFreq = this.solfeggioFrequencies[this.activeSolfeggio].chime;
        const baseFreq = this.eclipseActive ? 108.0 : (chimeFreq * 0.5); // Deep 108Hz base chord root for Eclipse
        
        const now = this.ctx.currentTime;
        this.padOscs.forEach((osc, i) => {
            const targetFreq = baseFreq * ratios[i];
            // Slow, gorgeous 4.5-second pitch glides simulating orbital shifts
            osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 4.5);
        });
    }

    setEclipseAudioMode(active) {
        this.eclipseActive = active;
        if (!this.isActive || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        if (active) {
            // Sweep filter down to muffled, light-swallowing cutoff
            this.filter.frequency.exponentialRampToValueAtTime(95, now + 3.0);
            this.filter.Q.exponentialRampToValueAtTime(1.5, now + 3.0);
            
            // Boost Cathedral delay feedback for enormous cave-like echo space
            this.delayGain.gain.linearRampToValueAtTime(0.72, now + 2.5);
            this.delayNode.delayTime.linearRampToValueAtTime(0.85, now + 2.5);
            
            // Enforce deep sub-octave drone roots
            this.setGravity(this.gravity);
            this.morphToNextChord(); // Instantly trigger eclipse progression morph
        } else {
            // Restore normal parameters
            this.filter.Q.linearRampToValueAtTime(this.state === 'zhenren' ? 3 : 8, now + 2.0);
            this.delayGain.gain.linearRampToValueAtTime(0.4, now + 2.0);
            this.delayNode.delayTime.linearRampToValueAtTime(0.6, now + 2.0);
            
            this.setSpeed(this.speed);
            this.setGravity(this.gravity);
            this.morphToNextChord();
        }
    }

    setPhilosophicalState(state) {
        this.state = state;
        this.applyPhilosophicalState();
        if (this.isActive && this.ctx) {
            this.morphToNextChord(); // Glide chord pad into the new set immediately
        }
    }

    applyPhilosophicalState() {
        if (!this.isActive || !this.ctx) return;
        
        if (this.state === 'zhenren') {
            // Zhenren: slow, meditative LFO, clean low pass filter
            this.droneLfo.frequency.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1.0); // Ultra slow breathing
            this.droneOscLeft.type = 'triangle'; // Clean, hollow
            this.droneOscRight.type = 'triangle';
            this.filter.Q.linearRampToValueAtTime(3, this.ctx.currentTime + 1.0);
        } else {
            // Trickster: faster, slightly chaotic/unstable LFO, sawtooth-like gritty texture
            this.droneLfo.frequency.linearRampToValueAtTime(1.8, this.ctx.currentTime + 1.0); // Vibrating rate
            this.droneOscLeft.type = 'sawtooth'; // Gritty, rich harmonics
            this.droneOscRight.type = 'sawtooth';
            this.filter.Q.linearRampToValueAtTime(8, this.ctx.currentTime + 1.0); // High resonance for squeals
        }
    }

    setSolfeggioFrequency(freqStr) {
        if (!this.solfeggioFrequencies[freqStr]) return;
        this.activeSolfeggio = freqStr;
        
        const config = this.solfeggioFrequencies[freqStr];
        this.baseDroneFreq = config.drone;
        
        // Update DOM description and border color highlight if they exist
        const descEl = document.getElementById('solfeggio-description');
        if (descEl) {
            descEl.textContent = config.desc;
            descEl.style.borderLeftColor = config.color;
        }
        
        if (!this.isActive || !this.ctx) return;
        
        // Smoothly glide left and right drone frequencies
        const now = this.ctx.currentTime;
        this.droneOscLeft.frequency.exponentialRampToValueAtTime(config.drone, now + 1.2);
        this.droneOscRight.frequency.exponentialRampToValueAtTime(config.drone + 10, now + 1.2);
        
        // Smoothly shift the pad base notes to the new tuning center
        this.morphToNextChord();
        
        // Play an alignment bell chime in the exact sacred frequency!
        this.playChime(config.chime);
    }

    // Phase 4: Magnetic Reach theremin proximity modulation
    setAuraReachProximity(distance) {
        // Disabled: all sound parameter values are set statically/dynamically driven exclusively by dashboard controls.
        return;
    }

    // Phase 4: Meditation quiet void ambient volume and filter states
    setMeditationVolumeState(active) {
        if (!this.isActive || !this.ctx) return;
        const now = this.ctx.currentTime;
        this.meditationModeActive = active;
        
        if (active) {
            // Silence chord pad cloud down to an ultra-subtle ethereal whisper
            this.padGainMaster.gain.linearRampToValueAtTime(0.008, now + 4.0);
            // Steep lowpass filter sweep down to deep, warm sub-sonics
            this.filter.frequency.exponentialRampToValueAtTime(90.0, now + 4.0);
            this.filter.Q.linearRampToValueAtTime(1.0, now + 4.0);
        } else {
            // Smoothly restore normal dynamic controls
            const baseCutoff = 250 + (this.speed * 150) + (this.communeY * 500);
            this.filter.frequency.exponentialRampToValueAtTime(baseCutoff, now + 2.0);
            this.filter.Q.linearRampToValueAtTime(this.state === 'zhenren' ? 3 : 8, now + 2.0);
            this.padGainMaster.gain.linearRampToValueAtTime(0.06, now + 2.0);
        }
    }

    // Synthesize a metallic chime / bell when a ring is spun or a rune is inscribed
    playChime(type = 'silver') {
        if (!this.isActive || !this.ctx) return;

        const now = this.ctx.currentTime;
        const mainGain = this.ctx.createGain();
        mainGain.connect(this.masterGain);
        
        const isGold = type === 'gold' || type === 432 || type === 528 || type === 639;
        
        // Route wet signal output portion to the Cathedral Delay echo chamber
        if (this.delayNode) {
            const sendGain = this.ctx.createGain();
            sendGain.gain.setValueAtTime(isGold ? 0.35 : 0.5, now);
            mainGain.connect(sendGain);
            sendGain.connect(this.delayNode);
        }
        
        // Bell metallic frequency ratios
        let baseFreq = 520;
        if (typeof type === 'number') {
            baseFreq = type;
        } else {
            baseFreq = type === 'gold' ? 330 : 520;
        }
        
        if (this.state === 'trickster') {
            baseFreq *= (0.95 + Math.random() * 0.1); // Slightly detuned/erratic for Trickster
        }
        
        // Add a soft bandpass filter to shape the chime body and pure metallic acoustics
        const chimeFilter = this.ctx.createBiquadFilter();
        chimeFilter.type = 'bandpass';
        chimeFilter.frequency.setValueAtTime(baseFreq * 2, now);
        chimeFilter.Q.setValueAtTime(1.5, now);
        chimeFilter.connect(mainGain);
        
        const ratios = [1.0, 1.5, 2.0, 2.63, 3.12, 4.0];
        const oscs = [];
        
        ratios.forEach((ratio, index) => {
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = baseFreq * ratio;
            
            // High harmonics decay faster than lower base frequencies
            const oscVolume = 0.15 / (index + 1);
            const decayTime = (isGold ? 2.5 : 1.5) / ratio;
            
            oscGain.gain.setValueAtTime(oscVolume, now);
            oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);
            
            osc.connect(oscGain);
            oscGain.connect(chimeFilter);
            osc.start(now);
            osc.stop(now + decayTime + 0.1);
            
            oscs.push(osc);
        });
        
        mainGain.gain.setValueAtTime(isGold ? 0.35 : 0.25, now);
        mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    }
    
    // Synthesize a majestic celestial choir swell sweep
    playChoirSwell() {
        if (!this.isActive || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const mainGain = this.ctx.createGain();
        mainGain.connect(this.masterGain);
        
        // Choir frequencies (Golden Ratio harmonics)
        const baseFreq = 270; // Root C#4
        const ratios = [1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
        
        // Lowpass filter with sweeping resonance for vocal "aah" sound
        const choirFilter = this.ctx.createBiquadFilter();
        choirFilter.type = 'lowpass';
        choirFilter.frequency.setValueAtTime(150, now);
        choirFilter.frequency.exponentialRampToValueAtTime(1200, now + 1.8);
        choirFilter.frequency.exponentialRampToValueAtTime(250, now + 5.0);
        choirFilter.Q.setValueAtTime(5, now);
        choirFilter.connect(mainGain);
        
        ratios.forEach((ratio, i) => {
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            
            // Blend triangle and sawtooth for warmth & reediness
            osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(baseFreq * ratio + (Math.random() - 0.5) * 2.5, now);
            
            oscGain.gain.setValueAtTime(0, now);
            oscGain.gain.linearRampToValueAtTime(0.07, now + 1.5); // slow swell
            oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);
            
            osc.connect(oscGain);
            oscGain.connect(choirFilter);
            osc.start(now);
            osc.stop(now + 5.5);
        });
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.4, now + 1.0);
        mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);
        
        // Wet send to delays
        if (this.delayNode) {
            const sendGain = this.ctx.createGain();
            sendGain.gain.setValueAtTime(0.4, now);
            mainGain.connect(sendGain);
            sendGain.connect(this.delayNode);
        }
    }
    
    // Synthesize a gentle, alchemical triple-chime callback sequence
    playCallbackChimeSequence() {
        if (!this.isActive || !this.ctx) return;
        
        // 1. Play first gentle bell chime (528Hz - Transformation & DNA Repair)
        this.playChime(528);
        
        // 2. Play second chime (639Hz - Harmonizing Connection) after 1.2s
        setTimeout(() => {
            if (this.isActive && this.ctx) {
                this.playChime(639);
            }
        }, 1200);
        
        // 3. Play third chime (852Hz - Spiritual awareness) after 2.4s
        setTimeout(() => {
            if (this.isActive && this.ctx) {
                this.playChime(852);
                // Also overlay a soft celestial choir swell to anchor the transition
                this.playChoirSwell();
            }
        }, 2400);
    }
    
    // Heartbeat loop scheduler (synchronized to states)
    scheduleNextHeartbeat() {
        if (!this.isActive || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        this.playHeartbeatAt(now);
        
        let interval = this.state === 'zhenren' ? 1000 : 630; // 1.0s (60 bpm) for Zhenren, 0.63s (95 bpm) for Trickster
        if (this.meditationModeActive) {
            interval = 1450; // Deep meditation breathing state (41 bpm)
        }
        
        this.heartbeatTimer = setTimeout(() => {
            this.scheduleNextHeartbeat();
        }, interval);
    }
    
    // Double-thump "lub-dub" procedural alchemical heart thuds
    playHeartbeatAt(time) {
        if (!this.isActive || !this.ctx) return;
        
        // 1. "Lub" Thump (80Hz down to 10Hz sweep)
        this.synthThump(time, 80, 10, 0.08, 0.55);
        
        // 2. "Dub" Thump (60Hz down to 10Hz sweep, 0.15s later)
        this.synthThump(time + 0.15, 60, 10, 0.12, 0.45);
    }
    
    // Low frequency pitch swept thump oscillator synthesis
    synthThump(startTime, startFreq, endFreq, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
        
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(100, startTime);
        
        osc.connect(gainNode);
        gainNode.connect(lowpass);
        lowpass.connect(this.masterGain);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
    }

    toggleJourneyDrumming(active) {
        this.journeyDrummingActive = active;
        if (active && (!this.isActive || !this.ctx)) {
            // Automatically initialize the master audio context
            this.toggle();
        } else {
            if (active) {
                this.startJourneyDrummingLoop();
            } else {
                this.stopJourneyDrummingLoop();
            }
        }
    }

    startJourneyDrummingLoop() {
        this.stopJourneyDrummingLoop();
        this.drumBeatIndex = 0;
        const scheduleAheadTime = 0.12;
        const lookAheadInterval = 25.0;
        this.nextNoteTime = this.ctx.currentTime + 0.02;
        
        const scheduler = () => {
            while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
                this.scheduleDrumNote(this.drumBeatIndex, this.nextNoteTime);
                this.advanceDrumNote();
            }
            this.journeyDrummingTimer = setTimeout(scheduler, lookAheadInterval);
        };
        scheduler();
    }

    stopJourneyDrummingLoop() {
        if (this.journeyDrummingTimer) {
            clearTimeout(this.journeyDrummingTimer);
            this.journeyDrummingTimer = null;
        }
    }

    advanceDrumNote() {
        const secondsPerBeat = 60.0 / this.drumTempo;
        const stepDuration = secondsPerBeat / 4; // 16th note steps
        this.nextNoteTime += stepDuration;
        this.drumBeatIndex = (this.drumBeatIndex + 1) % 8;
    }

    scheduleDrumNote(step, time) {
        if (!this.isActive || !this.ctx) return;
        
        let shouldPlay = false;
        let velocity = 1.0;
        
        if (this.journeyDrummingPattern === 'shamanic') {
            if (step === 0 || step === 4) {
                shouldPlay = true;
                velocity = step === 0 ? 1.0 : 0.75;
            }
        } else if (this.journeyDrummingPattern === 'dreamwalk') {
            if (step === 0 || step === 3 || step === 4 || step === 7) {
                shouldPlay = true;
                velocity = (step === 0 || step === 4) ? 1.0 : 0.6;
            }
        } else if (this.journeyDrummingPattern === 'tranceflow') {
            if (step === 0 || step === 2 || step === 3 || step === 4 || step === 6 || step === 7) {
                shouldPlay = true;
                velocity = (step === 0 || step === 4) ? 0.9 : 0.5;
            }
        } else if (this.journeyDrummingPattern === 'thetajourney') {
            // Rapid double-strike heartbeat: 0 (heavy), 1 (soft), 4 (medium), 5 (soft)
            if (step === 0 || step === 1 || step === 4 || step === 5) {
                shouldPlay = true;
                if (step === 0) velocity = 1.0;
                else if (step === 1) velocity = 0.45;
                else if (step === 4) velocity = 0.8;
                else if (step === 5) velocity = 0.35;
            }
        }
        
        if (shouldPlay) {
            let playTime = time;
            if (this.state === 'trickster') {
                playTime += (Math.random() - 0.5) * 0.015;
            }
            
            const pitchFactor = 0.85 + (this.speed * 0.15);
            this.playJourneyDrumHit(playTime, velocity, pitchFactor);
        }
    }

    playJourneyDrumHit(time, velocity = 1.0, pitchFactor = 1.0) {
        if (!this.ctx || !this.isActive) return;
        const now = time || this.ctx.currentTime;
        const drumGain = this.ctx.createGain();
        drumGain.connect(this.masterGain);
        
        const drumFilter = this.ctx.createBiquadFilter();
        drumFilter.type = 'lowpass';
        drumFilter.frequency.setValueAtTime(240 * pitchFactor, now); // Raised from 140 to 240 to let transients pass
        drumFilter.Q.setValueAtTime(1.5, now);
        drumFilter.connect(drumGain);

        // 1. Deep Bass Body Sweep
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(100 * pitchFactor, now);
        bassOsc.frequency.exponentialRampToValueAtTime(25 * pitchFactor, now + 0.42);
        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(1.5 * velocity, now + 0.003); // Raised from 0.7 to 1.5
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        bassOsc.connect(bassGain);
        bassGain.connect(drumFilter);
        bassOsc.start(now);
        bassOsc.stop(now + 0.45);

        // 2. Transient Click (Skin Strike)
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(320 * pitchFactor, now); // Raised from 280 to 320 for snap
        clickOsc.frequency.exponentialRampToValueAtTime(90 * pitchFactor, now + 0.015);
        clickGain.gain.setValueAtTime(0, now);
        clickGain.gain.linearRampToValueAtTime(0.9 * velocity, now + 0.001); // Raised from 0.35 to 0.9
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        clickOsc.connect(clickGain);
        clickGain.connect(drumFilter);
        clickOsc.start(now);
        clickOsc.stop(now + 0.02);

        if (this.delayNode) {
            const sendGain = this.ctx.createGain();
            sendGain.gain.setValueAtTime(0.24 * velocity, now); // Raised from 0.18
            drumGain.connect(sendGain);
            sendGain.connect(this.delayNode);
        }
        
        drumGain.gain.setValueAtTime(1.2, now); // Raised overall drum gain slightly
        drumGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        // Visual feedback on drum hit
        setTimeout(() => {
            const card = document.getElementById('drumming-card');
            if (card) {
                card.classList.add('drum-flash');
                setTimeout(() => card.classList.remove('drum-flash'), 100);
            }
            
            // Also flash the active pattern button in sympathy!
            const activeBtn = document.querySelector('.drumming-pattern-btn.active');
            if (activeBtn) {
                activeBtn.classList.add('btn-flash');
                setTimeout(() => activeBtn.classList.remove('btn-flash'), 100);
            }
        }, Math.max(0, (now - this.ctx.currentTime) * 1000));
    }

    setJourneyDrummingPattern(pattern) {
        this.journeyDrummingPattern = pattern;
        const descEl = document.getElementById('drumming-description');
        if (descEl) {
            if (pattern === 'shamanic') {
                this.drumTempo = 90;
                descEl.textContent = 'SHAMANIC PULSE: Steady, organic frame drum hits designed to ground the nervous system and induce a trance state.';
                descEl.style.borderLeftColor = 'var(--color-amber)';
            } else if (pattern === 'dreamwalk') {
                this.drumTempo = 85;
                descEl.textContent = 'DREAM WALK HEARTBEAT: Syncopated, slow double-beats that emulate the spiritual rhythmic heartbeat of the deep psyche.';
                descEl.style.borderLeftColor = 'var(--color-gold)';
            } else if (pattern === 'tranceflow') {
                this.drumTempo = 95;
                descEl.textContent = 'TRANCE FLOW ROLLS: Continuous, gentle polyrhythmic thuds that swirl the auditory cortex and induce deep focus.';
                descEl.style.borderLeftColor = 'var(--color-emerald)';
            } else if (pattern === 'thetajourney') {
                this.drumTempo = 210;
                descEl.textContent = 'THETA GATEWAY DRUM: A rapid, driving double-beat thud (210 BPM) aligned to the Theta brainwave frequency (4-7Hz) to induce deep astral journeys and trance states.';
                descEl.style.borderLeftColor = 'var(--color-violet)';
            }
        }
        
        // Automatically check and activate the drumming layer toggle
        const drummingToggle = document.getElementById('drumming-toggle');
        if (drummingToggle && !drummingToggle.checked) {
            drummingToggle.checked = true;
        }
        this.journeyDrummingActive = true;
        
        if (!this.isActive || !this.ctx) {
            // Automatically initialize the master audio context
            this.toggle();
        } else {
            // Ensure loop is running and play a preview hit
            this.startJourneyDrummingLoop();
            this.playJourneyDrumHit(this.ctx.currentTime, 0.8, 1.0);
        }
    }
}

// Bind to window for global access
window.AlchemicalAudio = new AlchemicalAudioEngine();

document.getElementById('audio-toggle').addEventListener('click', () => {
    window.AlchemicalAudio.toggle();
});

const floatToggle = document.getElementById('floating-audio-toggle');
if (floatToggle) {
    floatToggle.addEventListener('click', () => {
        window.AlchemicalAudio.toggle();
    });
}
