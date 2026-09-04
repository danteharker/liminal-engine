/* ==========================================================================
   LIMINAL ENGINE — SOUND (Web Audio API)

   Everything is synthesised live. Nothing is sampled or looped.

   The tunings are the six tones the piece can be set to by the curator.
   They are labelled by the planetary metals of the alchemical tradition
   (Saturn/lead, Sol/gold, Venus/copper, Jupiter/tin, Mercury/quicksilver,
   Luna/silver). These are artistic associations, not claims.

   setOpus(progress) is the one control the installation drives during a
   session. progress runs 0 -> 1 as the visitor becomes still:
     0.00 - 0.25  Caput Corvi  dark, closed filter, drum at shamanic pace
     0.25 - 0.50  Albedo       filter opens, drum slows
     0.50 - 0.75  Citrinitas   pad warms, drum near a resting heart
     0.75 - 1.00  Rubedo       open, quiet, drum silent

   Beat sync: every frame-drum hit sets beatPulse = 1 and lastBeatAt.
   The 3D engine reads these to pulse the rings and sphere on the beat.
   ========================================================================== */

class AlchemicalAudioEngine {
    constructor() {
        this.ctx = null;
        this.isActive = false;
        this.isHardwareMuted = false;
        this.curatorVolume = 0.6;

        this.masterGain = null;
        this.limiter = null;
        this.filter = null;
        this.pannerLeft = null;
        this.pannerRight = null;
        this.droneOscLeft = null;
        this.droneOscRight = null;
        this.droneLfo = null;
        this.droneLfoGain = null;
        this.delayNode = null;
        this.delayGain = null;

        this.padOscs = [];
        this.padGains = [];
        this.padGainMaster = null;
        this.currentChordIndex = 0;
        this.chordTimer = null;

        this.tunings = {
            '396': { metal: 'Saturn · Lead',        drone: 49.50, chime: 396 },
            '432': { metal: 'Sol · Gold',           drone: 64.22, chime: 432 },
            '528': { metal: 'Venus · Copper',       drone: 66.00, chime: 528 },
            '639': { metal: 'Jupiter · Tin',        drone: 79.88, chime: 639 },
            '741': { metal: 'Mercury · Quicksilver', drone: 46.31, chime: 741 },
            '852': { metal: 'Luna · Silver',        drone: 53.25, chime: 852 }
        };
        this.activeTuning = '432';
        this.baseDroneFreq = this.tunings[this.activeTuning].drone;
        this.binauralOffset = 8; // Hz between left and right drones

        // Bellows (frame drum)
        this.bellowsEnabled = true;
        this.bellowsPattern = 'shamanic'; // shamanic | pulse | heartbeat | roll
        this.bellowsTimer = null;
        this.bellowsStep = 0;
        // Hits per minute. Shamanic journey drumming is ~220–250 (about 4 per second).
        this.bellowsTempo = 220;
        this.bellowsGainValue = 1.0;
        this.nextNoteTime = 0;
        this.drumBus = null; // louder dedicated bus for the frame drum


        // Visual sync: the engine reads these every frame
        this.beatPulse = 0;
        this.lastBeatAt = 0;
        this.beatCount = 0;

        this.heartbeatTimer = null;
        this.opus = 0.0;
        this.inSession = false;
    }

    /* ---------------- lifecycle ---------------- */

    init() {
        if (this.ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        const now = this.ctx.currentTime;

        // Master limiter protects gallery amplification from clipping
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-6.0, now);
        this.limiter.knee.setValueAtTime(12, now);
        this.limiter.ratio.setValueAtTime(8, now);
        this.limiter.attack.setValueAtTime(0.003, now);
        this.limiter.release.setValueAtTime(0.25, now);
        this.limiter.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.connect(this.limiter);

        // Frame drum rides its own bus so it can sit in front of the drone
        this.drumBus = this.ctx.createGain();
        this.drumBus.gain.setValueAtTime(1.35, now);
        this.drumBus.connect(this.limiter);

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.Q.setValueAtTime(3, now);
        this.filter.frequency.setValueAtTime(220, now);
        this.filter.connect(this.masterGain);

        // Binaural drone: two panned triangles a few Hz apart
        this.pannerLeft = this.ctx.createStereoPanner();
        this.pannerLeft.pan.setValueAtTime(-1, now);
        this.pannerLeft.connect(this.filter);
        this.pannerRight = this.ctx.createStereoPanner();
        this.pannerRight.pan.setValueAtTime(1, now);
        this.pannerRight.connect(this.filter);

        this.droneOscLeft = this.ctx.createOscillator();
        this.droneOscLeft.type = 'triangle';
        this.droneOscLeft.frequency.setValueAtTime(this.baseDroneFreq, now);
        this.droneOscLeft.connect(this.pannerLeft);
        this.droneOscLeft.start();

        this.droneOscRight = this.ctx.createOscillator();
        this.droneOscRight.type = 'triangle';
        this.droneOscRight.frequency.setValueAtTime(this.baseDroneFreq + this.binauralOffset, now);
        this.droneOscRight.connect(this.pannerRight);
        this.droneOscRight.start();

        // Breathing LFO on the filter
        this.droneLfo = this.ctx.createOscillator();
        this.droneLfo.type = 'sine';
        this.droneLfo.frequency.setValueAtTime(0.08, now);
        this.droneLfoGain = this.ctx.createGain();
        this.droneLfoGain.gain.setValueAtTime(90, now);
        this.droneLfo.connect(this.droneLfoGain);
        this.droneLfoGain.connect(this.filter.frequency);
        this.droneLfo.start();

        // Long room echo
        this.delayNode = this.ctx.createDelay(2.0);
        this.delayGain = this.ctx.createGain();
        this.delayNode.delayTime.setValueAtTime(0.6, now);
        this.delayGain.gain.setValueAtTime(0.4, now);
        this.delayNode.connect(this.delayGain);
        this.delayGain.connect(this.delayNode);
        this.delayNode.connect(this.masterGain);

        // Pad cloud
        this.padGainMaster = this.ctx.createGain();
        this.padGainMaster.gain.setValueAtTime(0.05, now);
        this.padGainMaster.connect(this.filter);
        const chime = this.tunings[this.activeTuning].chime;
        const ratios = [1.0, 1.25, 1.5, 1.875];
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(chime * 0.5 * ratios[i], now);
            g.gain.setValueAtTime(0.25, now);
            osc.connect(g);
            g.connect(this.padGainMaster);
            osc.start();
            this.padOscs.push(osc);
            this.padGains.push(g);
        }

        this.isActive = true;
        this.scheduleNextHeartbeat();
        this.scheduleNextChordMorph();
        this.masterGain.gain.linearRampToValueAtTime(this.targetMasterLevel(), now + 2.0);
        if (this.bellowsEnabled) this.startBellows();
    }

    resume() {
        if (!this.ctx) { this.init(); return; }
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        if (!this.isActive) {
            this.isActive = true;
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(this.targetMasterLevel(), now + 1.0);
            this.scheduleNextHeartbeat();
            this.scheduleNextChordMorph();
            if (this.bellowsEnabled) this.startBellows();
        }
    }

    targetMasterLevel() {
        if (this.isHardwareMuted) return 0;
        return this.curatorVolume * 0.35;
    }

    /* ---------------- curator controls ---------------- */

    setMasterVolume(v) {
        this.curatorVolume = Math.max(0, Math.min(1, v));
        if (this.isActive && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setTargetAtTime(this.targetMasterLevel(), now, 0.1);
        }
    }

    toggleHardwareMute() {
        this.isHardwareMuted = !this.isHardwareMuted;
        if (this.isActive && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setTargetAtTime(this.targetMasterLevel(), now, 0.08);
        }
        return this.isHardwareMuted;
    }

    setTuning(key) {
        if (!this.tunings[key]) return;
        this.activeTuning = key;
        const t = this.tunings[key];
        this.baseDroneFreq = t.drone;
        if (!this.isActive || !this.ctx) return;
        const now = this.ctx.currentTime;
        this.droneOscLeft.frequency.exponentialRampToValueAtTime(t.drone, now + 1.5);
        this.droneOscRight.frequency.exponentialRampToValueAtTime(t.drone + this.binauralOffset, now + 1.5);
        this.morphToNextChord();
        this.playChime(t.chime);
    }

    setBellowsEnabled(on) {
        this.bellowsEnabled = !!on;
        if (!this.ctx || !this.isActive) return;
        if (this.bellowsEnabled) this.startBellows(); else this.stopBellows();
    }

    setBellowsPattern(p) {
        if (!['shamanic', 'pulse', 'heartbeat', 'roll'].includes(p)) return;
        this.bellowsPattern = p;
    }

    /* ---------------- the opus ---------------- */

    // Called every frame by the installation with the smoothed 0..1 progress.
    setOpus(progress) {
        this.opus = Math.max(0, Math.min(1, progress));
        if (!this.isActive || !this.ctx) return;
        const p = this.opus;
        const now = this.ctx.currentTime;

        // Filter opens as the work completes: 160 Hz (Caput Corvi) -> 1400 Hz (rubedo)
        const cutoff = 160 * Math.pow(1400 / 160, p);
        this.filter.frequency.setTargetAtTime(cutoff, now, 0.6);
        this.filter.Q.setTargetAtTime(3.0 - p * 2.0, now, 0.6);

        // Pad grows quieter and purer
        this.padGainMaster.gain.setTargetAtTime(0.05 - p * 0.03, now, 0.8);

        // Frame drum: Harner-style ~220 bpm (~3.7 Hz) down to a resting heart, then silent
        this.bellowsTempo = 220 - p * 155; // 220 -> 65
        this.bellowsGainValue = p < 0.82 ? 1.0 : Math.max(0, 1.0 - (p - 0.82) / 0.18);

        // Binaural spread narrows towards unison at rubedo (8 Hz -> 4 Hz)
        const spread = 8 - p * 4;
        this.droneOscRight.frequency.setTargetAtTime(this.baseDroneFreq + spread, now, 1.0);
    }

    setSessionActive(active) {
        this.inSession = !!active;
        if (!this.isActive || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (!active) {
            // Return to the ambient attract state
            this.filter.frequency.setTargetAtTime(220, now, 1.5);
            this.filter.Q.setTargetAtTime(3, now, 1.5);
            this.padGainMaster.gain.setTargetAtTime(0.05, now, 1.5);
            this.bellowsTempo = 220;
            this.bellowsGainValue = 1.0;
        }
    }

    // Soft decay of the visual beat pulse (called from the render loop)
    tickBeat(dt) {
        if (this.beatPulse > 0) this.beatPulse = Math.max(0, this.beatPulse - dt * 6);
    }

    /* ---------------- pad progression ---------------- */

    scheduleNextChordMorph() {
        if (!this.isActive || !this.ctx) return;
        if (this.chordTimer) clearTimeout(this.chordTimer);
        this.chordTimer = setTimeout(() => {
            this.morphToNextChord();
            this.scheduleNextChordMorph();
        }, 9000);
    }

    morphToNextChord() {
        if (!this.isActive || !this.ctx) return;
        this.currentChordIndex = (this.currentChordIndex + 1) % 4;
        const chords = [
            [1.0, 1.25, 1.5, 1.875],
            [1.0, 1.35, 1.5, 1.875],
            [1.125, 1.35, 1.5, 2.0],
            [0.875, 1.0, 1.25, 1.5]
        ];
        const ratios = chords[this.currentChordIndex];
        const base = this.tunings[this.activeTuning].chime * 0.5;
        const now = this.ctx.currentTime;
        this.padOscs.forEach((osc, i) => {
            osc.frequency.exponentialRampToValueAtTime(base * ratios[i], now + 5.0);
        });
    }

    /* ---------------- chimes ---------------- */

    playChime(freqOrKind = 520) {
        if (!this.isActive || !this.ctx) return;
        const now = this.ctx.currentTime;
        let base = typeof freqOrKind === 'number' ? freqOrKind : (freqOrKind === 'gold' ? 330 : 520);
        const warm = base < 500;

        const main = this.ctx.createGain();
        main.connect(this.masterGain);
        if (this.delayNode) {
            const send = this.ctx.createGain();
            send.gain.setValueAtTime(warm ? 0.35 : 0.5, now);
            main.connect(send);
            send.connect(this.delayNode);
        }
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(base * 2, now);
        bp.Q.setValueAtTime(1.5, now);
        bp.connect(main);

        [1.0, 1.5, 2.0, 2.63, 3.12, 4.0].forEach((ratio, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = base * ratio;
            const vol = 0.15 / (i + 1);
            const decay = (warm ? 2.5 : 1.5) / ratio;
            g.gain.setValueAtTime(vol, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
            osc.connect(g);
            g.connect(bp);
            osc.start(now);
            osc.stop(now + decay + 0.1);
        });
        main.gain.setValueAtTime(warm ? 0.35 : 0.25, now);
        main.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    }

    playChoirSwell() {
        if (!this.isActive || !this.ctx) return;
        const now = this.ctx.currentTime;
        const main = this.ctx.createGain();
        main.connect(this.masterGain);
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(150, now);
        f.frequency.exponentialRampToValueAtTime(1200, now + 1.8);
        f.frequency.exponentialRampToValueAtTime(250, now + 5.0);
        f.Q.setValueAtTime(5, now);
        f.connect(main);
        const base = 270;
        [1.0, 1.25, 1.5, 2.0, 2.5, 3.0].forEach((r, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(base * r + (Math.random() - 0.5) * 2.5, now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.07, now + 1.5);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);
            osc.connect(g);
            g.connect(f);
            osc.start(now);
            osc.stop(now + 5.5);
        });
        main.gain.setValueAtTime(0, now);
        main.gain.linearRampToValueAtTime(0.4, now + 1.0);
        main.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);
        if (this.delayNode) {
            const send = this.ctx.createGain();
            send.gain.setValueAtTime(0.4, now);
            main.connect(send);
            send.connect(this.delayNode);
        }
    }

    // Three rising bells and a swell, played when the work completes
    playCompletion() {
        if (!this.isActive || !this.ctx) return;
        const t = this.tunings[this.activeTuning].chime;
        this.playChime(t);
        setTimeout(() => { if (this.isActive) this.playChime(t * 1.25); }, 1200);
        setTimeout(() => { if (this.isActive) { this.playChime(t * 1.5); this.playChoirSwell(); } }, 2400);
    }

    /* ---------------- heartbeat ---------------- */

    scheduleNextHeartbeat() {
        if (!this.isActive || !this.ctx) return;
        if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
        this.playHeartbeatAt(this.ctx.currentTime);
        // 60 bpm ambient, slowing to 41 bpm as the opus completes
        const interval = 1000 + this.opus * 450;
        this.heartbeatTimer = setTimeout(() => this.scheduleNextHeartbeat(), interval);
    }

    playHeartbeatAt(time) {
        if (!this.isActive || !this.ctx) return;
        const v = 0.55 * (1.0 - this.opus * 0.5);
        this.synthThump(time, 80, 10, 0.08, v);
        this.synthThump(time + 0.15, 60, 10, 0.12, v * 0.8);
    }

    synthThump(start, f0, f1, dur, vol) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f0, start);
        osc.frequency.exponentialRampToValueAtTime(f1, start + dur);
        g.gain.setValueAtTime(0.001, start);
        g.gain.linearRampToValueAtTime(vol, start + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(100, start);
        osc.connect(g);
        g.connect(lp);
        lp.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + dur + 0.05);
    }

    /* ---------------- bellows (frame drum) ---------------- */

    startBellows() {
        this.stopBellows();
        if (!this.ctx) return;
        this.bellowsStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;
        const ahead = 0.12;
        const tick = () => {
            while (this.nextNoteTime < this.ctx.currentTime + ahead) {
                this.scheduleBellowsStep(this.bellowsStep, this.nextNoteTime);
                // Shamanic: bellowsTempo is hits-per-minute (isochronous).
                // Other patterns keep 16th-grid subdivision of a quarter-note tempo.
                const stepDur = this.bellowsPattern === 'shamanic'
                    ? (60.0 / Math.max(40, this.bellowsTempo))
                    : (60.0 / this.bellowsTempo) / 4;
                this.nextNoteTime += stepDur;
                this.bellowsStep = (this.bellowsStep + 1) % 8;
            }
            this.bellowsTimer = setTimeout(tick, 25);
        };
        tick();
    }

    stopBellows() {
        if (this.bellowsTimer) { clearTimeout(this.bellowsTimer); this.bellowsTimer = null; }
    }

    scheduleBellowsStep(step, time) {
        if (!this.isActive || !this.ctx || this.bellowsGainValue <= 0.001) return;
        let play = false, vel = 1.0;
        if (this.bellowsPattern === 'shamanic') {
            // Steady isochronous pulse — the regularity is the hook. Tiny accent every 4th.
            play = true;
            vel = (this.bellowsStep % 4 === 0) ? 1.0 : 0.88;
        } else if (this.bellowsPattern === 'pulse') {
            if (step === 0 || step === 4) { play = true; vel = step === 0 ? 1.0 : 0.75; }
        } else if (this.bellowsPattern === 'heartbeat') {
            if ([0, 3, 4, 7].includes(step)) { play = true; vel = (step === 0 || step === 4) ? 1.0 : 0.6; }
        } else if (this.bellowsPattern === 'roll') {
            if ([0, 2, 3, 4, 6, 7].includes(step)) { play = true; vel = (step === 0 || step === 4) ? 0.9 : 0.5; }
        }
        if (play) this.playDrumHit(time, vel * this.bellowsGainValue);
    }

    playDrumHit(time, velocity = 1.0) {
        if (!this.ctx || !this.isActive) return;
        const now = time || this.ctx.currentTime;
        const delayMs = Math.max(0, (now - this.ctx.currentTime) * 1000);
        setTimeout(() => {
            this.beatPulse = Math.min(1, 0.55 + velocity * 0.45);
            this.lastBeatAt = performance.now();
            this.beatCount++;
        }, delayMs);

        const dest = this.drumBus || this.masterGain;
        const out = this.ctx.createGain();
        out.connect(dest);
        out.gain.setValueAtTime(1.15 * velocity, now);
        out.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        // Deep skin body (the thump you feel in the chest)
        const body = this.ctx.createOscillator();
        const bodyG = this.ctx.createGain();
        const bodyLp = this.ctx.createBiquadFilter();
        body.type = 'sine';
        body.frequency.setValueAtTime(85, now);
        body.frequency.exponentialRampToValueAtTime(38, now + 0.28);
        bodyLp.type = 'lowpass';
        bodyLp.frequency.setValueAtTime(180, now);
        bodyG.gain.setValueAtTime(0, now);
        bodyG.gain.linearRampToValueAtTime(1.8 * velocity, now + 0.004);
        bodyG.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        body.connect(bodyG);
        bodyG.connect(bodyLp);
        bodyLp.connect(out);
        body.start(now);
        body.stop(now + 0.42);

        // Mid tone of the hoop / skin
        const mid = this.ctx.createOscillator();
        const midG = this.ctx.createGain();
        mid.type = 'triangle';
        mid.frequency.setValueAtTime(180, now);
        mid.frequency.exponentialRampToValueAtTime(70, now + 0.12);
        midG.gain.setValueAtTime(0, now);
        midG.gain.linearRampToValueAtTime(0.55 * velocity, now + 0.002);
        midG.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        mid.connect(midG);
        midG.connect(out);
        mid.start(now);
        mid.stop(now + 0.16);

        // Stick slap: short noise burst through a bandpass (the "crack" of hide)
        const noiseDur = 0.045;
        const noiseBuf = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * noiseDur), this.ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const noiseG = this.ctx.createGain();
        const noiseBp = this.ctx.createBiquadFilter();
        noiseBp.type = 'bandpass';
        noiseBp.frequency.setValueAtTime(900, now);
        noiseBp.Q.setValueAtTime(1.2, now);
        noiseG.gain.setValueAtTime(0, now);
        noiseG.gain.linearRampToValueAtTime(0.7 * velocity, now + 0.001);
        noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        noise.connect(noiseBp);
        noiseBp.connect(noiseG);
        noiseG.connect(out);
        noise.start(now);
        noise.stop(now + noiseDur);

        if (this.delayNode) {
            const send = this.ctx.createGain();
            send.gain.setValueAtTime(0.18 * velocity, now);
            out.connect(send);
            send.connect(this.delayNode);
        }
    }
}

window.AlchemicalAudio = new AlchemicalAudioEngine();
