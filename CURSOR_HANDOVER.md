# Liminal Engine — Developer Handover

Last updated: 4 September 2026 (Cursor rebuild)

Repository: `danteharker/liminal-engine` (public, `main`)
Live: https://danteharker.github.io/liminal-engine/
Local: `run.bat` → http://localhost:8080/

---

## 1. What the piece is

One idea: **the mirror only becomes still when you do.**

A sphere of liquid metal inside three engraved rings. A webcam measures how much the visitor is moving (frame differencing, nothing stored). As they become still, a progress value called the *opus* rises from 0 to 1 and the sphere passes through the four alchemical stages:

| opus | stage | material | sound |
| :--- | :--- | :--- | :--- |
| 0.00–0.25 | Nigredo | near-black, rough, agitated | filter closed, bellows 84 bpm |
| 0.25–0.50 | Albedo | quicksilver, settling | filter opening, bellows slowing |
| 0.50–0.75 | Citrinitas | pale gold | pad quieter, bellows fading |
| 0.75–1.00 | Rubedo | gold mirror reflecting the webcam feed | open, near silence, bellows off |

Moving makes the opus fall (14 s from 1 to 0). Being still makes it rise (≈55% of the session length from 0 to 1). Outside a session the opus is capped at 0.45 so the resting piece breathes with the room but only goes gold for someone who sits down.

---

## 2. Files

```
alchemical-engine-v2/
├── index.html                    Layers: attract, intro, hud, return, reflect, thanks; curator; plaque
├── style.css                     Near-black / parchment / one gold. Hairlines only. ~330 lines
├── engine.js                     Everything below. ~1,000 lines
├── audio.js                      Web Audio synth. Drone, pad, chimes, bellows. ~430 lines
├── fonts/                        EB Garamond (variable + italic), IBM Plex Mono 400/500, fonts.css
├── three.min.js                  Three.js r128, local
├── server.js                     Static server on 8080 (strips query strings, serves woff2)
├── run.bat                       Windows launcher
├── CURATORIAL_STATEMENT.md       Statement (250 words), short description, one line, wall text
├── INSTALLATION_SPECIFICATIONS.md  Technical rider incl. camera placement
├── GALLERY_OPERATIONS_MANUAL.md  Daily procedure, curator panel, keys, troubleshooting
└── CURSOR_HANDOVER.md            This file
```

### engine.js

- **`StillnessSensor`** — `startCamera()` uses `getUserMedia` (640×480, user-facing). Every frame the video is drawn to a 64×48 canvas, mean absolute luma difference against the previous frame is computed, a noise floor is learnt, and the result is mapped to `motion` (0–1) and smoothed into `stillness` (fast attack, slow release). Fallback inputs: pointer speed, `pointerdown`, `keydown`, `devicemotion`. `cameraDark` guards against a black or covered feed being read as perfect stillness. `activeSource` reports `camera` or `pointer`.
- **`LiminalEngine3D`** — scene, lights, environment, core, rings, motes, trails, wall.
  - **Environment / mirror**: a 512×256 equirectangular canvas of a lit studio (`drawEnvRoom`). When the camera is live, the video frame is screen-blended onto it at u = 0.75, which is the direction the front of the sphere reflects. The canvas is rendered to a `WebGLCubeRenderTarget` (256, mipmapped) via a `CubeCamera` every other frame; that cube texture is the `envMap` of the core and the rings. This is the fix for the black sphere: r128's `MeshStandardMaterial` at metalness 1 renders black without an environment.
  - **Core**: `IcosahedronGeometry(0.72, 14)`. Duplicate vertices are merged once at init; every frame `displaceCore()` displaces the unique vertices radially (agitation = stage amplitude + motion) and computes smooth normals on the merged set, then writes both back. Do not call `computeVertexNormals()` on this geometry; it is non-indexed and would go faceted.
  - **Stages**: `applyStageVisuals(p)` interpolates colour, roughness, metalness, envMapIntensity for core and rings, and the furnace light colour. `stageLerp` / `stageLerpColor` are piecewise over the four stage values.
  - **Colour**: `outputEncoding = sRGBEncoding`. All hex colours pass through `linear()` (cached `convertSRGBToLinear`) so they come out as authored. Fog and the wall are set the same way. This is why the background is black and the gold is gold; without it everything is lifted and olive.
  - **Rings**: three tori. Canvas textures (2048×128) drawn in EB Garamond with hand letter-spacing, used as `bumpMap` and `emissiveMap`. Ring 0 carries the three most recent visitor inscriptions (italic), or "Solve et Coagula · Be still" when there are none. Ring 1: the stage names. Ring 2: V.I.T.R.I.O.L. Redrawn after `document.fonts.ready`.
  - **Chimes**: each ring chimes once per quarter turn on 0.5×, 1×, 1.5× of the active tuning's frequency, less often as the opus rises.
- **`Installation`** — the visitor state machine: `attract → intro → work → return → reflect → thanks → attract`. Settings live in `localStorage.liminal_settings`; inscriptions in `localStorage.liminal_reflections` (`[{text, at}]`). `applySettings()` pushes to audio and engine. There is no inactivity timer during `work`; being still is the point. `intro` returns to attract after `idleSeconds` if abandoned; `reflect` auto-submits after 45 s (60 s once typing starts).
- **`Curator`** — Shift + C panel, Shift + P wall text, Shift + F fullscreen, kiosk lock (blocks F5, Ctrl+R/W/U/S, context menu, drag). Live monitor of sensor source, motion meter and opus.

### audio.js

`AlchemicalAudioEngine` on `window.AlchemicalAudio`. Everything is synthesised. `resume()` on first touch (browsers need a gesture). `setTuning(key)` for the six tones (`396 · Saturn`, `432 · Sol`, `528 · Venus`, `639 · Jupiter`, `741 · Mercury`, `852 · Luna`). `setOpus(p)` is called every frame and drives filter cutoff (160 → 1400 Hz), pad level, binaural spread (8 → 4 Hz) and the bellows tempo (84 → 48 bpm, fading out over the last quarter). `playCompletion()` is three rising bells and a swell. No DOM access anywhere in this file.

---

## 3. What was removed in the rebuild, and why

Everything below was in the previous build and is gone. Do not reintroduce it without a reason the piece needs.

- Theme / tuning / duration wizard, dashboard sliders, "Cognitive Modulator Dials", "Ego Resonance", "Somatic Weight", readouts, neural presets, rune shortcuts, trickster state, eclipse, conjunction, Sol/Luna orbs, glyph morphs, refraction beams, celestial bridges, holographic fan mode, canvas recording, time-of-day fog themes, the Codex modal, the "96% of participants" stat, all emoji, all neuroscience language, Cinzel and Outfit, gold-to-violet gradients, glass blur.
- The inactivity timer that put the piece to sleep during meditation. Stillness was being read as inactivity.
- Attract mode's 35-unit camera orbit, which flew the camera out into the fog so passers-by saw nothing.
- Hebrew / I Ching ring engravings. One lineage now: alchemy.

Time-of-day and the like are fine ideas but they made the piece's identity drift. If you want variation, vary the tuning.

---

## 4. Testing notes

- **Camera in an embedded browser** may return a black frame (the Cursor browser did). `sensor.cameraDark` handles it; the curator monitor shows `pointer (camera dark)`. Test the real mirror in normal Chrome with a webcam.
- **Force a stage** from the console: `Liminal.engine.updateOpus = function(){ this.opus = Math.min(1, this.opus + 0.03); }` then `Liminal.installation.begin(); Liminal.installation.startWork();`
- **Shorten a session**: `Liminal.installation.settings.durationSeconds = 20`.
- **View the environment canvas**: `document.body.appendChild(Object.assign(new Image(), { src: Liminal.engine.envCanvas.toDataURL(), style: 'position:fixed;top:0;left:0;z-index:99;width:512px' }))`.
- **Console handles**: `window.Liminal = { sensor, engine, installation, curator }`. `window.AlchemicalEngine` is an alias to the engine.

---

## 5. Open items

- Real-webcam pass: confirm the mirror orientation reads as a mirror (the frame is drawn un-flipped at u = 0.75; if it feels wrong when you raise your right hand, set `ctx.scale(-1, 1)` before `drawImage` in `updateEnvironment`).
- If a gallery machine struggles, set render scale to 1.0 in the curator panel and consider dropping `IcosahedronGeometry` detail from 14 to 10.
- Custom domain for Pages (`liminal-engine.art`) when there is a reason to.
