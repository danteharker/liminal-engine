# LIMINAL ENGINE (SOLVE ET COAGULA) — AI HANDOVER & ARCHITECTURE BRIEF
### Context, System Architecture & Operational Guide for Cursor AI

---

## 1. PROJECT IDENTITY & ARTISTIC MISSION

**Liminal Engine (Solve et Coagula)** is an interactive generative new-media art installation and cybernetic meditation sanctuary designed for museum and gallery exhibition (e.g., Pace Gallery, ZKM, Tate Modern, Ars Electronica, Lumen Prize).

### Conceptual Core
- **Solve et Coagula** (*Dissolve and Coagulate*): Dissolving the discursive noise of the analytical self, coagulating pure presence in the **Space Between Thoughts**.
- **Visuals**: A Three.js WebGL astrolabe of concentric brass/silver rings engraved with Cabalistic runes and *I Ching* hexagrams, surrounding a central morphing **quicksilver** droplet.
- **The Core Poetic Payoff**: The quicksilver fluid ripples in response to human agitation and movement. As the participant sits in physical stillness, fluid waves dampen to zero, and the sphere transmutes into an unblemished, reflective **liquid golden mirror**.
- **Acoustics**: Real-time generative Web Audio API synthesis delivering **Solfeggio frequencies** (A4 = 432 Hz, 528 Hz, 741 Hz), binaural alpha/theta brainwave entrainment, shamanic/theta frame drumming, resonant chimes, and choir swells.
- **Collective Memory Wall**: Participants inscribe their reflections into a persistent collective memory ticker preserved across visitors.

---

## 2. FILE BREAKDOWN & ROLES

```
alchemical-engine-v2/
├── index.html                   # Master HTML5 layout, UI modals, canvas & bottom controls
├── engine.js                    # 3D Graphics, interaction, kiosk & curator logic (~3,740 lines)
├── audio.js                     # Generative Web Audio API synthesizer & sound engine (~875 lines)
├── style.css                    # Luxury dark alchemical glassmorphic styling (~2,620 lines)
├── three.min.js                 # Local Three.js r128 bundle (603 KB) for 100% offline museum reliability
├── server.js                    # Zero-dependency local Node.js HTTP server (port 8080)
├── run.bat                      # 1-click Windows startup script
├── CURATORIAL_STATEMENT.md      # Museum catalogue essay, artist statement & wall plaque copy
├── INSTALLATION_SPECIFICATIONS.md # Technical rider (projector lumens, acoustics, pedestal specs)
├── GALLERY_OPERATIONS_MANUAL.md # Daily docent handbook (boot, operations, reflection curation, shutdown)
└── CURSOR_HANDOVER.md           # This document
```

---

## 3. CORE ARCHITECTURE & JAVASCRIPT CLASSES

### A. `AlchemicalEngine3D` (in `engine.js`)
- **Three.js WebGL Scene**: Handles camera, misty atmospheric fog, directional shadow shafts, ambient lighting, and high-performance ACESFilmic tone mapping.
- **Astrolabe Concentric Rings**: Multi-layered rings with dynamic 2D canvas textures generated with hexagrams, planetary seals, and astrolabe shadows projected onto the void wall.
- **Quicksilver Fluid Dynamics**: Icosahedron geometry with real-time vertex displacement algorithms driven by trigonometric wave functions and harmonic speed factors.
- **Stillness Entrainment System**:
  - `this.stillnessDepth` (0% to 100%) tracks visitor stillness.
  - When stillness increases, `stillnessFactor` drops to 0, vertex displacement subsides to a glassy surface, `coreMesh.material.roughness` drops to `0.005`, and the material color smoothly lerps to pure reflective liquid gold (`#ffd700`).
- **Celestial Energy Bridges & Stardust Particles**: Bezier curves with moving stardust particles converging into the core.
- **Meditation Engine**: Methods `startMeditationTimer(durationSeconds)`, `startMeditation()`, `completeMeditation(success)`, and `endMeditationSession(success)`.

### B. `AlchemicalAudioEngine` (in `audio.js`)
- **Master Dynamics Limiter**: A `DynamicsCompressorNode` (`threshold: -6.0 dB, ratio: 8, attack: 0.003s, release: 0.25s`) directly precedes `ctx.destination` to prevent digital clipping on gallery PA speakers.
- **Stereo Binaural Drone**: Left and right stereo panners delivering Solfeggio fundamental tones (64.22 Hz C2 for 432 Hz) with a +10 Hz difference for alpha/theta entrainment.
- **LFO Filter Sweep**: Lowpass biquad filter modulated by a slow breathing sine LFO (0.1 Hz).
- **Generative Chord Pad Cloud**: Lush multi-oscillator ambient background chords that morph smoothly.
- **Journey Drumming**: Synthesized shamanic frame drum hits, heartbeats, and trance rhythms.
- **Master Volume & Hardware Mute**: `setMasterVolume(val)` and `toggleHardwareMute()` with anti-pop exponential gain ramping.

### C. `GalleryInstallationManager` (in `engine.js`)
- **Attract Mode / Idle State**: Automatically triggers after inactivity (`inactivityTimeoutMs = 45000` ms). Displays `#attract-overlay`, begins smooth camera orbiting, and softly fades audio volume to 0.08.
- **Wake / Interaction**: Wakes on touch, click, or keydown, fading `#attract-overlay` out, gently bringing audio up, and opening the visitor wizard.
- **Collective Memory Archive**: Loads reflections from `localStorage` (`liminal_reflections`) or uses default curated entries. Renders the continuous ticker.

### D. `GalleryTabletWizardManager` (in `engine.js`)
- Manages the visitor induction on `#gallery-tablet-modal`:
  - **Step 0**: Landing hero & memory wall teaser.
  - **Step 1**: Personal Calibration (Atmosphere, Solfeggio frequency, duration: 1m, 2m, 3m).
  - **Step 2**: Preparation & breathwork guidance -> *"BEGIN IMMERSION"*.
  - **Step 3**: Phenomenological Reflection & Feedback (Rating + text input with generous 45s countdown that pauses while typing).
  - **Step 4**: Thank you notice -> auto-resets for next visitor.

### E. `CuratorAdminManager` (in `engine.js`)
- **Secret Administrative Panel (`Shift + C`)**:
  - Unlocked via hotkey `Shift + C` or bottom-left `⚙ CURATOR` button.
  - Controls room volume slider, hardware mute, resolution scaling (0.75x to 2.0x Retina/4K), ambient void fog theme, and idle timeout length.
  - **Kiosk Tamper Lock**: Adds `body.kiosk-locked`, blocking right-click context menus, image dragging, browser reloads (`F5`, `Ctrl+R`), and window closes (`Ctrl+W`).
  - **Reflection Moderation**: View all submitted visitor notes, delete individual entries, export the full archive as JSON, or reset to pristine defaults.
- **Museum Wall Plaque (`Shift + P`)**:
  - Modal displaying curatorial essay, artwork medium, year (2026), and 3-step participation instructions.

---

## 4. RECENT CRITICAL FIXES COMPLETED

Before this handover, the following major fixes were implemented and verified:
1. **Fixed `startMeditationTimer` Crash**: Added `startMeditationTimer(durationSeconds)` to `AlchemicalEngine3D` so the wizard's *"BEGIN IMMERSION"* button works without throwing `TypeError`.
2. **Fixed Meditation Completion Hook**: Overrode `completeMeditation(success)` so that when the countdown hits zero, `TabletWizard.onImmersionComplete()` is reliably invoked.
3. **Restored Missing Attract Mode Elements**: Restored `#attract-overlay`, `.attract-card`, `.attract-glyph`, and `#attract-wake-btn` in `index.html`.
4. **Master Limiter Installed**: Routed `masterGain` through `DynamicsCompressorNode` in `audio.js` to safeguard gallery sound systems against distortion.
5. **Stillness Depth Transmutation**: Explicitly wired `stillnessDepth` to `coreMesh.material.roughness` and golden color interpolation in `engine.js`.
6. **100% Offline Readiness**: Bundled local `three.min.js` (r128) with zero CDN dependencies for offline exhibition.
7. **100% DOM ID Integrity**: Verified that all `getElementById` calls in JavaScript exist in `index.html`.

---

## 5. OPERATIONAL SHORTCUTS & COMMANDS

| Action | Command / Shortcut |
| :--- | :--- |
| **Launch Local Server** | Double-click `run.bat` or run `node server.js` (serves at `http://localhost:8080/`) |
| **Edge-to-Edge Fullscreen** | **F11** or click `⛶ FULLSCREEN` (bottom-left) |
| **Curator Admin Panel** | **Shift + C** or click `⚙ CURATOR` (bottom-left) |
| **Museum Wall Plaque** | **Shift + P** or click `🕮 WALL PLAQUE` (bottom-left) |
| **Mute / Unmute Audio** | **M** key or speaker icon in UI |
| **Dismiss Modals** | **Escape** key |
| **Kiosk Command Line** | `chrome.exe --kiosk --disable-pinch --autoplay-policy=no-user-gesture-required http://localhost:8080/` |

---

## 6. ROADMAP & RECOMMENDED NEXT TASKS IN CURSOR

When continuing development in Cursor, here are the recommended areas of focus:

1. **Online Demo Hosting (For Gallery Submissions)**:
   - Deploy this directory to **Vercel**, **Netlify**, or **GitHub Pages**.
   - Because it's pure HTML/CSS/JS with local Three.js, it deploys instantly with zero build step.
   - Recommended URL: `https://liminal-engine.art` or `https://[your-name].vercel.app`.
2. **Video Trailer & Pitch Capture**:
   - Capture a 60-second 4K video showing Attract Mode -> Calibration -> Stillness Golden Mirror -> Reflection Inscription for curators.
3. **Pitch Deck Assembly**:
   - Compile `CURATORIAL_STATEMENT.md` and `INSTALLATION_SPECIFICATIONS.md` into a polished 3-page PDF dossier with screenshots.
4. **Visual Shader Enhancements (Optional)**:
   - Introduce an HDR equirectangular environment map (cubemap) to the quicksilver core for gallery reflections.
   - Optional post-processing UnrealBloomPass if running on dedicated high-end GPU hardware.
5. **Hardware Sensors (Optional)**:
   - If deploying a physical pedestal with proximity or micro-movement sensors (e.g. Leap Motion, ultrasonic distance sensor, or webcam eye-tracking), hook the sensor's delta into `window.AlchemicalEngine.stillnessDepth`.

---

## 7. VERIFICATION PROTOCOL

To ensure the build remains clean after any edits in Cursor:
```bash
# Validate JavaScript syntax
node -c engine.js
node -c audio.js
node -c server.js

# Launch local server
node server.js
```
Open `http://localhost:8080/`, verify that Attract Mode awakens on touch, complete a 1-minute immersion journey, verify the quicksilver mirror transmutation, and test `Shift + C` for the Curator panel.
