# Liminal Engine — Live Art Strategy & AI Handover

**Last updated:** 9 November 2026  
**Artist:** Dante Harker  
**Workspace Path:** `c:\Users\dante\.gemini\antigravity\scratch\alchemical-engine-v2`  
**Live URL:** https://danteharker.github.io/liminal-engine/  
**Repository:** `danteharker/liminal-engine`

---

## 1. Purpose of This Document

This handover document is written for any AI assistant or collaborator picking up **Liminal Engine**. It covers:
1. What the artwork is and how its codebase works right now.
2. What was upgraded on 9 November 2026 to turn it from a screen-based web piece into a **hands-free live participatory art installation** (supporting both **Large Projection / Display** and **3D Holographic Fan** formats).
3. The **curatorial strategy**: why specific formats win specific art spaces.
4. The **prioritised schedule of open calls, prizes, festivals, and galleries** (December 2026 – Spring 2027) and how to tailor the work for each.
5. **Next actionable tasks** for the incoming AI.

---

## 2. The Artwork in One Paragraph

**Core premise:** *The mirror only becomes still when you do.*  
**Liminal Engine** is a sphere of liquid quicksilver suspended inside three engraved rings (`Three.js r128` + live procedural `Web Audio API`). A USB webcam watches the room using 64×48 frame-differencing (`StillnessSensor` in `engine.js`)—nothing is recorded or stored. When a visitor moves, the sphere shatters into droplets and stays black (*Caput Corvi*). When they sit still, a progress value (`opus`, `0.0 → 1.0`) rises over 90 seconds through the four alchemical stages—**Black**, **Silver** (*Albedo*, where the rings multiply into a 12-ring mandala), **Gold** (*Citrinitas*, pulling inward), and **Mirror** (*Rubedo*)—while a synthesised 240 BPM shamanic frame drum (`audio.js`) paces their attention and falls silent at gold. At completion, the golden sphere becomes a live mirror reflecting the visitor's face and the room behind them. One question appears: *"What did you notice in the space between thoughts?"* The visitor's spoken or typed sentence is engraved in italic *EB Garamond* onto the outer ring (`Ring 0`) for future visitors.

---

## 3. Exhibition Formats Strategy (Why We Built Dual-Mode)

Curators and open-call juries evaluate interactive installations on **conceptual clarity**, **spectator theatre**, and **invigilator/maintenance friction**:

| Format | Target Share of Applications | Why It Gets Selected | How *Liminal Engine* Runs It |
| :--- | :--- | :--- | :--- |
| **Mode 1: Dark-Room Projection / Large Screen (Hands-Free)** | **~70% of calls** (Festivals, Museums, Major Prizes) | Zero hardware friction (venues already own projectors, speakers, and webcams); high **spectator theatre** (passers-by watch a stranger sit still and transform black boiling metal into a golden mirror reflecting their face). | Default mode (`http://localhost:8080/`). Camera senses a visitor sitting down and holding still for 3.2 seconds to start automatically. |
| **Mode 2: 3D Holographic Fan (Sculptural Plinth Edition)** | **~30% of calls** (London/UK Group Shows, Libraries, Art Fairs, Canal/Light Trails) | Group shows rarely have spare walls or private black-box rooms. A 65–100 cm spinning LED holographic fan on a matte black stand needs only `1m × 1m` of floor space and makes the sphere and rings float in mid-air like a physical alchemical vessel. | Launch with `?fan=1` or toggle **3D Fan mode (circular rotor)** in `Shift + C`. Pure `#000000` background (transparent on LED blades), `1:1` circular rotor boundary (`#fan-boundary`), and +35% rim/specular contrast. |
| **Mode 3: WebXR (VR / Mixed Reality Passthrough)** | **Dedicated XR Calls Only** (NewImages, AWE) | Traditional galleries avoid VR headsets due to hygiene and staffing overhead, but dedicated XR festivals offer €6k+ prizes specifically for standalone headset works. | *Planned optional module* if applying to NewImages / AWE (see Section 6). |

---

## 4. Codebase Architecture & Recent Upgrades (9 Nov 2026)

All files live in `c:\Users\dante\.gemini\antigravity\scratch\alchemical-engine-v2`:

- **`index.html`**: DOM layers (`#attract`, `#story`, `#threshold`, `#choose`, `#intro`, `#hud`, `#return`, `#reflect`, `#thanks`, `#curator`, `#plaque`, plus `#fan-boundary`).
- **`style.css`**: Minimalist palette (`#050506` near-black, `#e9e2d3` parchment, `#cfa54a` gold), *EB Garamond* for visitors, *IBM Plex Mono* for curators, plus `body.fan-mode` circular 1:1 rotor framing.
- **`engine.js`**:
  - **`StillnessSensor`**: Webcam 64×48 luma frame-differencing with noise-floor learning, dark-camera guard (`cameraDark`), and pointer/accelerometer fallback.
  - **`LiminalEngine3D`**: Custom equirectangular-to-cubemap mirror shader (`setupEnvironment` / `updateEnvironment`), vertex-merged smooth-normal icosahedron displacement (`displaceCore`), 3 engraved torus rings + 12 kaleidoscopic mandala ghost rings (`createKaleidoRings`), shatter/dissolve/coagulate droplets (`updateDroplets`), and `setFanMode(on)`.
  - **`Installation`**:
    - **Always-Alive Resting State**: The 3D sphere is visible and breathing on `#attract` from startup, with rotating visitor sentences (`#attract-inscription`) seeded by `DEFAULT_REFLECTIONS` when `localStorage` is empty.
    - **Hands-Free "Sit Still to Begin" (`settings.handsFree = true`)**: On `#attract`, once a visitor enters (`sensor.motion > 0.10` sets `visitorArrived = true`) and holds still (`stillness > 0.68 && motion < 0.16`) for **3.2 seconds**, the gold dwell bar (`#attract-dwell`) fills and triggers `beginHandsFree()`. Between sessions, `visitorArrived` resets to `false` until new motion is seen so an empty gallery never loops on its own.
    - **Automatic Planetary Tone Cycling**: In hands-free mode, when `visitorChoice` is on, each sitting cycles to the next tuning in `TONES` (`396 Saturn`, `432 Sun`, `528 Venus`, `639 Jupiter`, `741 Mercury`, `852 Moon`).
    - **Touch / Desktop Flow**: Clicking `Touch to begin` opens `#choose` (where visitors can pick a tone or click `how it works & test camera` to open `#intro`).
    - **Spoken Reflection / Voice Inscription (`settings.voiceMic = true`)**: On `#reflect`, uses the browser's `SpeechRecognition` / `webkitSpeechRecognition` API to listen for the visitor's spoken sentence, transcribe it live into `#reflect-input`, and automatically engrave it onto the outer ring after 2.4 seconds.
    - **URL Query Parameters**:
      - `?fan=1` — boots directly in 3D Holographic Fan mode (circular rotor + hands-free).
      - `?handsfree=1` or `?handsfree=0` — forces hands-free sit-to-begin on or off.
      - `?duration=60` — overrides sitting duration in seconds (15–600s).
  - **`Curator` (`Shift + C`)**: Live sensor/opus monitor, inscription manager (JSON export/clear), kiosk lock, and toggles for `Hands-free`, `Voice inscription`, `3D Fan mode`, `Bellows`, and `Tuning`.
- **`audio.js`**: `AlchemicalAudioEngine` — pure Web Audio synthesis (binaural triangle drone, 4-voice chord-morphing pad, harmonic chimes, heartbeat thump, and 240 BPM shamanic frame drum on its own `drumBus`).

---

## 5. Target Open Calls, Prizes & Art Spaces (Dec 2026 – Spring 2027)

### Priority Tier 1: Immediate Deadlines (December 2026)

1. **Amsterdam Light Festival — Edition 16 (2027–2028)**
   - **Deadline:** 7 December 2026
   - **Format to Pitch:** **3D Holographic Fan Array in a Weatherproof Vitrine** (or rear-projected spherical vessel) along the canal walk.
   - **Curatorial Hook:** Passers-by walking along the canal agitate the quicksilver into black droplets; only when a pedestrian stops walking and stands completely still at the water's edge does the floating sphere calm, turn to gold, and reflect their face against the canal.
   - **Support:** Festival provides production budget and technical engineering support.

2. **CURRENTS New Media Festival 2027 (Santa Fe, New Mexico, USA)**
   - **Deadline:** 8 December 2026 (Festival runs 11–20 June 2027)
   - **Category:** Interactive Installations
   - **Format to Pitch:** **Dark-Room Projection + Bench + Subwoofer** (with **3D Holographic Fan** offered as an alternative footprint in the technical rider).
   - **Curatorial Hook:** A screen that rewards doing nothing, using shamanic auditory driving (4 beats/sec frame drum) and real-time computer vision that discards every frame.

3. **Barbican Library Exhibition Open Call (London, UK)**
   - **Deadline:** 31 December 2026 (for 2027–2028 slots)
   - **Format to Pitch:** **Sculptural Plinth Edition (3D Holographic Fan or 27" Vertical Monitor + Open-Back Headphones + Webcam)**.
   - **Curatorial Hook:** Located inside a public London library, *Liminal Engine* acts as a 90-second contemplative instrument where readers sit still to still the quicksilver and leave a single sentence engraved on the outer ring—building an evolving anthology of sentences over the exhibition run.

4. **European Media Art Platform (EMAP) Residency Network**
   - **Window:** Late 2026 / Winter 2026–27
   - **Format to Pitch:** Production residency proposal to expand *Liminal Engine* into a **multi-visitor spatial installation** (where the sphere only turns to gold when *everyone* in the room becomes still together—collective stillness).

### Priority Tier 2: Major Winter / Spring 2027 Calls (Jan – May 2027)

5. **Prix Ars Electronica 2027 (Linz, Austria)**
   - **Window:** January – March 2027 (Free entry; Golden Nica + up to €10,000)
   - **Category:** *Interactive Art +* (primary) / *Digital Musics & Sound Art* (secondary)
   - **Angle:** Emphasise the ethical/political inversion of surveillance and attention-economy loops: computer vision that keeps only a single scalar number (`motion`) and rewards non-action.

6. **The Lumen Prize for Art and Technology 2027 (UK / Global)**
   - **Window:** Late January – May 2027
   - **Category:** *Experiential* and *XR/Interactive*
   - **Angle:** Use the existing copy blocks in `submission/SUBMISSION_PACK.md` plus a new 90-second live-sitter video.

7. **arebyte Gallery — BYOB (Bring Your Own Beamer) & Open Screen (London, UK)**
   - **Window:** ~February 2027
   - **Format to Pitch:** Bring either a short-throw projector + bench OR a 65 cm 3D Holographic Fan on a black stand (`?fan=1`). High-visibility London new media crowd; ideal for capturing live audience reaction footage.

8. **Canary Wharf Winter Lights 2028 (London, UK)**
   - **Window:** March – May 2027
   - **Format to Pitch:** Weatherproof public pavilion or vitrine housing a large-format 3D holographic rotor display where commuters in London's financial district must stop moving to turn lead into gold.

9. **NewImages Festival 2027 (Paris) & AWE Art Festival 2027 (USA)**
   - **Window:** Early / Spring 2027
   - **Format to Pitch:** If Dante wants to enter these XR-specific competitions, add a `WebXR` Mixed Reality passthrough mode (see Section 6.3).

---

## 6. Roadmap & Next Tasks for the Incoming AI

When continuing work with Dante, prioritise the following tasks in order:

### Task 1: Live-Sitter Video Capture (Highest Impact for Juries)
- The current video (`submission/liminal-engine-90s.mp4`) was rendered headlessly via `tools/capture/video.js` without a webcam, so the mirror at *Rubedo* reflects only the synthetic studio room.
- **Action:** Help Dante record a 90-second sitting with a real person in a dim room (warm side-lamp on the sitter's face) so juries see a human face emerge inside the golden mirror at 01:10, followed by the visitor speaking their sentence aloud and watching it engrave onto the outer ring.

### Task 2: Tailor Proposals for the December 2026 Deadlines
- Base copy blocks, artist statement (250 words), short description (50 words), and image captions are ready in `submission/SUBMISSION_PACK.md` and `CURATORIAL_STATEMENT.md`.
- **Action:** Draft the specific budget/production sheet for **Amsterdam Light Festival** (before 7 Dec 2026), the technical space plan for **CURRENTS New Media** (before 8 Dec 2026), and the layout proposal for **Barbican Library** (before 31 Dec 2026).

### Task 3: Optional "Collective Stillness" / Multi-Person Mode (for EMAP & Public Commissions)
- Currently `StillnessSensor` computes mean luma difference across the whole 64×48 frame.
- **Action:** If pitching for public plazas (Canary Wharf / Amsterdam) or EMAP, we can split the 64×48 sensor grid into 3 horizontal zones (left, centre, right) so multiple sitters on a wide bench each control one of the 3 concentric rings, and the central sphere only turns to gold when all sitters are still together.

### Task 4: Optional WebXR (Quest 3 / Vision Pro Mixed Reality Mode)
- If applying to **NewImages** or **AWE**, add `THREE.WebXRManager` support to `LiminalEngine3D`:
  - Read 6DoF head-pose velocity instead of webcam luma diff to drive `sensor.stillness`.
  - Use Mixed Reality passthrough (`alpha: true` on `WebGLRenderer` in `immersive-ar` session) so the floating quicksilver sphere hangs inside the real room.
