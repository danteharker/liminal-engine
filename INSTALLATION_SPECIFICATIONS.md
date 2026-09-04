# Liminal Engine — Technical Rider

For curators, preparators and AV technicians. Everything here can be scaled to the room; the minimum viable version is a laptop, a webcam, a projector and a bench.

---

## 1. Room

- **Footprint**: minimum 4 m × 5 m. A black-box gallery of 6 m × 8 m or larger is ideal.
- **Light**: dark. Under 15 lux ambient. Any light there is should be warm (2200–2700 K) and indirect, and should not fall on the projection surface.
- **Seating**: one bench or chair, 2.5–3.5 m from the projection, facing it. The piece is meant to be sat with. The camera should see the person on the bench.
- **Acoustics**: soft finishes if possible (drapes, carpet, felt). The drone sits between 46 and 80 Hz and the frame drum has a slow, low body; hard rooms smear both.

---

## 2. Camera

The camera is the sensor. It is what the piece measures stillness with, and what the sphere reflects at the end.

- **Type**: any USB UVC webcam, 720p or better, 30 fps. A wide field of view (90°+) helps in small rooms. Low-light performance matters more than resolution.
- **Position**: at or just above the projection surface, centred, pointed at the bench. The visitor's head and shoulders should fill roughly a third of the frame.
- **Light on the visitor**: a very dim, warm, indirect light (a shaded 2200 K lamp behind and to one side of the bench, or a floor-level LED strip) so the camera can see the sitter and the mirror has something to reflect. Nothing that reaches the projection surface.
- **Privacy**: frames are reduced to a 64 × 48 luminance grid, compared with the previous frame, and discarded. Nothing is stored or transmitted. The browser will show its own camera permission prompt on first launch; accept it once and it is remembered.
- **Without a camera**: the piece runs. Stillness is read from the touchscreen and device motion, and the mirror reflects a built-in room. The camera can also be switched off in the curator panel.

---

## 3. Display

### Option A: Projection (preferred)
- Laser projector, 4,000–6,000 ANSI lumens, WUXGA (1920 × 1200) or 4K.
- Short-throw or ultra-short-throw lens so the sitter does not shadow the image.
- Matte grey surface (0.8–0.9 gain), or a tensioned screen. 16:9 or 16:10. Ultra-wide is supported.

### Option B: Display
- 75"–98" commercial 4K display rated for continuous operation, anti-glare, centre at 1.45 m from the floor.

### Optional touch surface
- If the room design wants a touch point for beginning a session and leaving a sentence, a 12.9"–15.6" tablet or touch monitor on a plain plinth (35 × 35 × 105 cm, charcoal or blackened wood) within reach of the bench. The projection and the tablet can run the same page; the tablet is simply the touch surface. Without a tablet, a visitor begins by touching or clicking anywhere on the machine's own input device, or a docent starts sessions.

---

## 4. Sound

- **Stereo**: two active near-field monitors (Genelec 8030, Neumann KH 120 or similar) flanking the projection at ear height for a seated visitor.
- **Sub**: one active subwoofer reaching 25 Hz, concealed near the projection wall. The drone lives below 80 Hz; without a sub the piece loses its floor.
- **Interface**: a low-noise USB audio interface with balanced outputs (Focusrite, MOTU, RME or similar).
- **Alternative**: in a shared or noisy space, a pair of closed-back headphones hung from the plinth (Sennheiser HD 600 or similar).
- **Level**: set in the curator panel (Shift + C). Start at 60% and adjust to the room.

---

## 5. Computer

- **Form**: a small dedicated machine concealed in the plinth or rack (Mac mini / Mac Studio, Intel NUC, or a compact PC).
- **GPU**: any current integrated GPU is enough; a discrete GPU (RTX 3060 or above) gives headroom for 4K at 60 fps with the render scale at 2.0.
- **RAM**: 8 GB minimum, 16 GB comfortable.
- **OS**: Windows 11, macOS 14+, or Ubuntu LTS.
- **Browser**: Chrome or Chromium in kiosk mode, allowed to use the camera and to autoplay audio:

  ```
  chrome --kiosk --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream http://localhost:8080/
  ```

  `--use-fake-ui-for-media-stream` auto-accepts the camera permission so the prompt never appears on the projection. Remove it if the venue prefers to accept the prompt once by hand.

- **Serving**: `run.bat` (Windows) or `node server.js` starts a zero-dependency local server on port 8080. Node.js 18 or later. Alternatively the folder can be served by any static server, or opened from `https://danteharker.github.io/liminal-engine/` if the venue has internet (camera access requires HTTPS or localhost).

---

## 6. Offline

- Fully self-contained. Three.js, the typefaces (EB Garamond, IBM Plex Mono) and all code are on the local drive. No internet, accounts or subscriptions are needed.
- Visitor sentences are stored in the browser's local storage on the exhibition machine only. They can be exported as JSON or cleared in the curator panel.

---

## 7. Checklist for install day

- [ ] Room dark, bench placed, camera sees the sitter
- [ ] Dim warm light on the sitter, none on the screen
- [ ] Browser launched in kiosk mode, camera permission accepted
- [ ] Curator panel (Shift + C): session length, tuning, bellows, volume set; camera sensor shows `camera`
- [ ] Sit on the bench for two minutes and watch it go gold
