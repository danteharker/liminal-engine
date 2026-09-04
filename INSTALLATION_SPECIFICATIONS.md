# Liminal Engine: Architectural & Technical Installation Specifications

A comprehensive technical rider and site-specific installation specification guide for curators, gallery preparators, and audiovisual technicians.

---

## 1. Spatial & Environmental Requirements

### Gallery Space & Light Isolation
- **Room Footprint**: Minimum 4.0m × 5.0m (optimal: 6.0m × 8.0m or larger black box gallery).
- **Ceiling Height**: Minimum 3.0m clearance for ceiling projection mounts.
- **Ambient Lighting**: **Darkened Room / Dim Sanctuary Atmosphere** (< 15 Lux).
  - Ambient illumination should be strictly indirect and warm (2200K–2700K amber wall grazers or concealed floor LED channels).
  - Avoid any direct spotlights washing out the projection surface.
- **Acoustic Treatment**: Soft finishes (carpeting, heavy acoustic drapes, or felt baffles) are strongly recommended to allow the low-frequency Solfeggio drones and delicate metallic wind chimes to resonate cleanly without harsh room flutter echoes.

---

## 2. Display & Projection Configurations

The installation supports two primary presentation configurations:

### Option A: Floor-to-Ceiling Immersion Projection (Recommended)
- **Projector**: Laser phosphor projector, minimum **4,000–6,000 ANSI Lumens**, Native 4K (3840 × 2160) or WUXGA (1920 × 1200).
- **Throw Ratio**: Ultra-short throw (UST) or short-throw lens to prevent participant shadows when approaching the projection wall.
- **Surface**: Seamless matte projection wall painted in high-contrast theatrical grey (0.8–0.9 gain) or dedicated tensioned projection screen.
- **Aspect Ratio**: 16:9 widescreen or 16:10. Ultra-wide (21:9) is fully supported natively by the engine's responsive canvas scaler.

### Option B: Large-Format Commercial Display
- **Display**: 75" to 98" commercial-grade 4K anti-glare display (e.g., Samsung / Sony Professional / LG OLED), rated for 24/7 continuous operation.
- **Mounting**: Flush architectural wall recess or custom floor easel mount at participant eye-level (centre at 1.45m from finished floor).

---

## 3. Interactive Pedestal & Touch Interface

- **Physical Pedestal**: Freestanding minimalist monolithic pedestal (charcoal or blackened matte steel/wood, dimensions: 35cm W × 35cm D × 105cm H).
- **Terminal Display**: 12.9" to 15.6" capacitive multi-touch tablet (e.g., Apple iPad Pro in a secure locking enclosure, or Microsoft Surface Pro / Elo Touch Monitor).
- **Ergonomics**: Tilted at a 25°–35° ergonomic viewing angle, inviting comfortable interaction for standing participants of all heights and ADA accessibility.
- **Alternative (Pure Gaze / Zero-Touch Installation)**:
  - If exhibited without an interactive pedestal, the installation runs autonomously in **Exhibition Mode**, looping through the generative diurnal cycle and inviting viewers to simply sit on a gallery bench and observe stillness.

---

## 4. Acoustic & Sound System Specifications

- **Speaker Configuration**: High-fidelity stereo spatial sound with dedicated sub-bass reinforcement (2.1 or 4.1 surround).
- **Monitors**: 2× Active near-field studio monitors (e.g., Genelec 8030C, Neumann KH 120, or equivalent), positioned flanking the projection surface at ear level.
- **Subwoofer**: 1× Active studio subwoofer (down to 25 Hz) positioned concealed near the centre base of the projection wall. This is critical for conveying the visceral somatic weight of the 64.22 Hz and 49.5 Hz Solfeggio sub-drones.
- **Audio Interface**: Professional low-noise external USB-C DAC (Focusrite Scarlett, MOTU, or Universal Audio) feeding balanced XLR cables to the active monitors.
- **Headphone Alternative**: In noisy group exhibitions, 2× high-grade closed-back over-ear headphones (e.g., Sennheiser HD 600 or Audio-Technica ATH-M50x) can be suspended from the pedestal.

---

## 5. Host Computer Hardware & OS Configuration

- **Form Factor**: Dedicated mini-PC or media server (e.g., Apple Mac Studio, Intel NUC 13 Pro, or custom compact PC) concealed within the pedestal or equipment rack.
- **Processor**: Intel Core i5/i7 (12th gen or higher), AMD Ryzen 7, or Apple Silicon (M2/M3/M4).
- **Graphics**: Dedicated GPU (NVIDIA RTX 3060 / 4060 or higher; Apple Silicon integrated 16+ core GPU).
- **RAM**: Minimum 16 GB.
- **Operating System**: Windows 11 Pro, macOS Sonoma/Sequoia, or Ubuntu LTS.
- **Browser**: Google Chrome or Chromium configured in Kiosk Mode:
  ```bash
  chrome.exe --kiosk --disable-pinch --overscroll-history-navigation=0 --autoplay-policy=no-user-gesture-required http://localhost:8080/
  ```

---

## 6. Zero-Network & Offline Reliability

- The installation is **100% self-contained**.
- All WebGL libraries (`three.min.js`), audio algorithms, and graphical styles reside on the local drive.
- No external internet access, Wi-Fi credentials, or cloud subscriptions are required for operation.
- Visitor reflections are safely preserved in the local storage database and can be archived anytime.
