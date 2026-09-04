/* ==========================================================================
   LIMINAL ENGINE — Solve et Coagula
   Graphics, sensing and installation logic (Three.js r128)

   One idea: the mirror only becomes still when you do.

   Structure
     StillnessSensor   webcam frame-differencing (fallback: pointer + motion)
     LiminalEngine3D   scene; the sphere's journey through the four stages
     Installation      attract -> intro -> work -> return -> reflect -> attract
     Curator           Shift+C settings panel, Shift+P wall text, kiosk lock

   Nothing from the camera is stored or transmitted. Frames are reduced to
   a 64x48 luminance grid, compared with the previous frame, and discarded.
   ========================================================================== */

'use strict';

const STAGES = [
    { key: 'corvus',    label: 'Caput Corvi',    from: 0.00 },
    { key: 'albedo',     label: 'Albedo',     from: 0.25 },
    { key: 'citrinitas', label: 'Citrinitas', from: 0.50 },
    { key: 'rubedo',     label: 'Rubedo',     from: 0.75 }
];

// The six tones a visitor can choose. Each carries a planet, its metal, and the colour the
// room takes: `room` tints the wall, fog and air; `glow` is the halo behind the sphere.
const TONES = [
    { key: '396', hz: 396, planet: 'Saturn',  metal: 'Lead',        room: 0x2c3150, glow: 0x5d64a6 },
    { key: '432', hz: 432, planet: 'Sol',     metal: 'Gold',        room: 0x4a3418, glow: 0xd9a34a },
    { key: '528', hz: 528, planet: 'Venus',   metal: 'Copper',      room: 0x1c4a40, glow: 0x3fae8c },
    { key: '639', hz: 639, planet: 'Jupiter', metal: 'Tin',         room: 0x1f3a6e, glow: 0x4f86e0 },
    { key: '741', hz: 741, planet: 'Mercury', metal: 'Quicksilver', room: 0x2a4a54, glow: 0x7cc0cf },
    { key: '852', hz: 852, planet: 'Luna',    metal: 'Silver',      room: 0x3a4150, glow: 0xb7c3d8 }
];
function toneFor(key) { return TONES.find(t => t.key === String(key)) || TONES[1]; }

function durationWords(seconds) {
    const map = { 60: 'one minute', 90: 'ninety seconds', 120: 'two minutes', 180: 'three minutes', 300: 'five minutes' };
    return map[seconds] || `${Math.round(seconds)} seconds`;
}

// The guide voice. Timed from the start of the work.
// Opens by answering the one question every visitor has: what does this want from me?
const VOICE = [
    { at: 0.3,  text: 'This wants one thing from you.', hold: 2.6 },
    { at: 3.2,  text: 'Your stillness.', hold: 2.4 },
    { at: 6.2,  text: 'Move.', command: true, hold: 2.0 },
    { at: 8.8,  text: 'Now stop.', command: true, hold: 2.2 },
    { at: 11.5, text: 'That is the whole method. Shatter. Gather.', hold: 3.2 },
    { at: 15.2, text: 'The sphere is quicksilver. The alchemists called it the mind.', hold: 3.6 },
    { at: 19.5, text: 'Everything you carried in here is in it.', hold: 3.0 },
    { at: 23.5, text: 'Let it burn. Do not move.', hold: 3.0, needStill: true },
    { at: 30.0, text: 'Dissolve.', command: true, hold: 2.0, needStill: true },
    { at: 34.0, text: 'You do not have to hold it together.', hold: 3.0 },
    { at: 39.0, text: 'Follow the drum.', hold: 2.8 },
    { at: 50.0, text: 'You are the only thing in this room that is still.', hold: 3.6, needStill: true },
    { at: 56.0, text: 'Go inward.', hold: 2.6 },
    { at: 70.0, text: 'Solve et coagula.', hold: 3.0, needStill: true },
    { at: 75.0, text: 'This is what is left when you stop.', hold: 4.0 }
];

function stageFor(p) {
    let s = STAGES[0];
    for (const st of STAGES) if (p >= st.from) s = st;
    return s;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Piecewise interpolation across the four stage values
function stageLerp(values, p) {
    const seg = Math.min(2.999, p * 3);
    const i = Math.floor(seg);
    return lerp(values[i], values[i + 1], seg - i);
}
// Colours are authored in sRGB and converted once to linear, because the renderer
// gamma-encodes on output (r128 treats hex colours as linear otherwise).
const _linearCache = new Map();
function linear(hex) {
    let c = _linearCache.get(hex);
    if (!c) { c = new THREE.Color(hex).convertSRGBToLinear(); _linearCache.set(hex, c); }
    return c;
}
function stageLerpColor(hexes, p, out) {
    const seg = Math.min(2.999, p * 3);
    const i = Math.floor(seg);
    out.copy(linear(hexes[i])).lerp(linear(hexes[i + 1]), seg - i);
    return out;
}

/* ==========================================================================
   STILLNESS SENSOR
   ========================================================================== */
class StillnessSensor {
    constructor() {
        this.enabled = true;
        this.source = 'none';      // 'camera' | 'pointer' | 'none'
        this.video = null;
        this.stream = null;
        this.grid = document.createElement('canvas');
        this.grid.width = 64;
        this.grid.height = 48;
        this.gctx = this.grid.getContext('2d', { willReadFrequently: true });
        this.prevLuma = null;
        this.noiseFloor = 1.2;

        this.cameraMotion = 0;   // 0..1
        this.pointerMotion = 0;  // 0..1
        this.motion = 0;         // combined 0..1
        this.stillness = 0;      // smoothed 0..1

        this.lastPointer = null;
        this.lastPointerTime = 0;
        this.lastAccel = null;

        this.bindFallbackInputs();
    }

    bindFallbackInputs() {
        const onMove = (x, y) => {
            const now = performance.now();
            if (this.lastPointer) {
                const dt = Math.max(1, now - this.lastPointerTime) / 1000;
                const d = Math.hypot(x - this.lastPointer.x, y - this.lastPointer.y);
                const speed = d / dt; // px/s
                this.pointerMotion = Math.max(this.pointerMotion, clamp01(speed / 600));
            }
            this.lastPointer = { x, y };
            this.lastPointerTime = now;
        };
        window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
        window.addEventListener('pointerdown', () => { this.pointerMotion = 1; }, { passive: true });
        window.addEventListener('keydown', () => { this.pointerMotion = Math.max(this.pointerMotion, 0.6); });

        if ('DeviceMotionEvent' in window) {
            window.addEventListener('devicemotion', (e) => {
                const a = e.accelerationIncludingGravity;
                if (!a || a.x === null) return;
                if (this.lastAccel) {
                    const d = Math.hypot(a.x - this.lastAccel.x, a.y - this.lastAccel.y, a.z - this.lastAccel.z);
                    this.pointerMotion = Math.max(this.pointerMotion, clamp01((d - 0.25) / 2.5));
                }
                this.lastAccel = { x: a.x, y: a.y, z: a.z };
            }, { passive: true });
        }
    }

    async startCamera() {
        if (!this.enabled) return false;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.source = 'pointer';
            return false;
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30 } },
                audio: false
            });
            const v = document.createElement('video');
            v.setAttribute('playsinline', '');
            v.muted = true;
            v.autoplay = true;
            v.srcObject = this.stream;
            await v.play().catch(() => {});
            this.video = v;
            this.source = 'camera';
            this.prevLuma = null;
            return true;
        } catch (err) {
            console.info('Camera unavailable, using pointer fallback:', err && err.name);
            this.source = 'pointer';
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        this.video = null;
        this.prevLuma = null;
        this.cameraMotion = 0;
        this.source = 'pointer';
    }

    get cameraReady() {
        return this.source === 'camera' && this.video && this.video.readyState >= 2 && this.video.videoWidth > 0;
    }

    // What the installation is actually sensing with right now
    get activeSource() {
        if (this.cameraReady && !this.cameraDark) return 'camera';
        return 'pointer';
    }

    sampleCamera() {
        if (!this.cameraReady) return;
        const w = this.grid.width, h = this.grid.height;
        this.gctx.drawImage(this.video, 0, 0, w, h);
        const data = this.gctx.getImageData(0, 0, w, h).data;
        const n = w * h;
        if (!this.prevLuma) this.prevLuma = new Float32Array(n);
        let sum = 0, bright = 0;
        for (let i = 0; i < n; i++) {
            const j = i * 4;
            const l = data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114;
            sum += Math.abs(l - this.prevLuma[i]);
            bright += l;
            this.prevLuma[i] = l;
        }
        const raw = sum / n; // mean absolute luma difference, 0..255
        this.meanLuma = lerp(this.meanLuma || 0, bright / n, 0.05);
        // A covered, black or failed feed must not read as perfect stillness
        this.cameraDark = this.meanLuma < 6;
        if (this.cameraDark) { this.cameraMotion = 0; return; }

        // Learn the sensor noise floor slowly, only when the scene looks quiet
        if (raw < this.noiseFloor * 3) {
            this.noiseFloor = lerp(this.noiseFloor, raw, 0.01);
        }
        this.noiseFloor = Math.max(0.3, Math.min(6, this.noiseFloor));

        const excess = Math.max(0, raw - this.noiseFloor * 1.8);
        const m = clamp01(excess / 7.0);
        // Fast attack, moderate release
        this.cameraMotion = m > this.cameraMotion ? lerp(this.cameraMotion, m, 0.6) : lerp(this.cameraMotion, m, 0.15);
    }

    update(dt) {
        this.sampleCamera();
        this.pointerMotion = Math.max(0, this.pointerMotion - dt * 1.4);
        this.motion = Math.max(this.cameraMotion, this.pointerMotion);

        const target = 1 - this.motion;
        if (target < this.stillness) {
            this.stillness = lerp(this.stillness, target, clamp01(dt * 5));
        } else {
            this.stillness = lerp(this.stillness, target, clamp01(dt * 0.7));
        }
    }
}

/* ==========================================================================
   3D ENGINE
   ========================================================================== */
class LiminalEngine3D {
    constructor(sensor) {
        this.sensor = sensor;
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();
        this.time = 0;

        this.opus = 0.0;            // 0..1 progress through the Great Work
        this.opusCap = 0.45;        // ceiling outside a session
        this.riseSeconds = 70;      // time from 0 to 1 when perfectly still
        this.fallSeconds = 14;      // time from 1 to 0 when moving
        this.inSession = false;

        this.rings = [];
        this.ringCanvases = [];
        this.inscriptions = [];

        this.ripple = { active: false, center: new THREE.Vector3(), radius: 0, maxRadius: 4.5, speed: 3.5, intensity: 1 };
        this.raycaster = new THREE.Raycaster();
        this.pointerNdc = new THREE.Vector2();

        this.cameraTargetZ = 5.0;

        this._tmpColor = new THREE.Color();
        this._tmpColor2 = new THREE.Color();

        // Room palette from the chosen tone. Current values ease toward the target.
        this.paletteRoom = linear(TONES[1].room).clone();
        this.paletteGlow = linear(TONES[1].glow).clone();
        this.paletteRoomTarget = this.paletteRoom.clone();
        this.paletteGlowTarget = this.paletteGlow.clone();
        this._roomColor = new THREE.Color();

        // Solve et coagula: 0 = gathered sphere, 1 = shattered into droplets
        this.shatter = 0;
        this.shatterTarget = 0;
        // Mandala opening through albedo/citrinitas (0..1)
        this.kaleido = 0;
        this.fanMode = false;
        this.beatScale = 1;
    }

    setTone(key) {
        const t = toneFor(key);
        this.paletteRoomTarget.copy(linear(t.room));
        this.paletteGlowTarget.copy(linear(t.glow));
    }

    setFanMode(on) {
        this.fanMode = !!on;
        document.body.classList.toggle('fan-mode', this.fanMode);
        if (this.wall) this.wall.visible = !this.fanMode;
        if (this.halo) this.halo.visible = !this.fanMode;
        if (this.fanMode) {
            this.renderer.setClearColor(0x000000);
            if (this.scene.fog) this.scene.fog.density = 0.02;
        }
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(linear(0x050506).getHex(), 0.075);

        const w = window.innerWidth, h = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
        this.camera.position.set(0, 0, 5.0);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.setClearColor(0x050506);
        this.container.appendChild(this.renderer.domElement);

        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.setupLights();
        this.setupEnvironment();
        this.createCore();
        this.createRings();
        this.createParticles();
        this.createDroplets();
        this.createTrails();
        this.createWall();
        this.createHalo();
        this.createKaleidoRings();
        this.setupEvents();

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => this.redrawRings());
        }

        this.tick();
    }

    /* ---------------- lights ---------------- */

    setupLights() {
        this.ambient = new THREE.AmbientLight(0x1a1612, 0.5);
        this.scene.add(this.ambient);

        // A single window-shaft key light, up and behind-right
        this.key = new THREE.DirectionalLight(0xfff0d6, 2.2);
        this.key.position.set(4, 7, -2);
        this.key.castShadow = true;
        this.key.shadow.mapSize.set(1024, 1024);
        this.key.shadow.bias = -0.001;
        this.scene.add(this.key);

        // Fill from the visitor's side so the metal reads
        this.fill = new THREE.DirectionalLight(0xd9d3c7, 0.7);
        this.fill.position.set(-3, 1.5, 6);
        this.scene.add(this.fill);

        // The furnace: a point light inside the core. Ember red at Caput Corvi, gold at rubedo.
        this.furnace = new THREE.PointLight(0x7a1e0a, 2.0, 9);
        this.group.add(this.furnace);
    }

    /* ---------------- environment / mirror ---------------- */

    setupEnvironment() {
        // Equirectangular canvas: a dark room with a soft light above and the
        // visitor's webcam frame drawn in the region the front of the sphere reflects.
        this.envCanvas = document.createElement('canvas');
        this.envCanvas.width = 512;
        this.envCanvas.height = 256;
        this.envCtx = this.envCanvas.getContext('2d');
        this.drawEnvRoom();

        this.envTexture = new THREE.CanvasTexture(this.envCanvas);
        this.envTexture.encoding = THREE.sRGBEncoding;
        this.envTexture.minFilter = THREE.LinearFilter;
        this.envTexture.magFilter = THREE.LinearFilter;
        this.envTexture.generateMipmaps = false;

        this.envRT = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter,
            encoding: THREE.sRGBEncoding
        });
        this.envCamera = new THREE.CubeCamera(0.1, 10, this.envRT);

        // Self-contained equirect-to-cube shader. (ShaderLib.equirect relies on
        // mapTexelToLinear, which this build only defines for materials with a map,
        // so it fails to compile here and the cube target stays black.)
        // The canvas is sRGB and the target is flagged sRGB, so texels pass straight through.
        const mat = new THREE.ShaderMaterial({
            uniforms: { tEquirect: { value: this.envTexture } },
            vertexShader: `
                varying vec3 vWorldDirection;
                void main() {
                    vWorldDirection = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }`,
            fragmentShader: `
                uniform sampler2D tEquirect;
                varying vec3 vWorldDirection;
                void main() {
                    vec3 d = normalize(vWorldDirection);
                    vec2 uv = vec2(atan(d.z, d.x) * 0.15915494309 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830988618 + 0.5);
                    gl_FragColor = texture2D(tEquirect, uv);
                }`,
            side: THREE.BackSide,
            depthTest: false,
            depthWrite: false
        });
        this.envScene = new THREE.Scene();
        this.envScene.add(new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), mat));

        this.envDirty = true;
        this.envFrame = 0;
    }

    drawEnvRoom() {
        const ctx = this.envCtx, w = this.envCanvas.width, h = this.envCanvas.height;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        // A lit gallery: warm ceiling, mid-grey walls, dark floor. A polished metal ball
        // only reads as metal if the room it reflects is mostly mid-tone, not black.
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0.00, '#a08d72');
        g.addColorStop(0.18, '#6a6058');
        g.addColorStop(0.40, '#5a534c');
        g.addColorStop(0.62, '#4a443e');
        g.addColorStop(0.66, '#1e1b18');
        g.addColorStop(0.85, '#0e0d0b');
        g.addColorStop(1.00, '#060605');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // Ceiling light strip running the length of the room: a clean specular line
        ctx.fillStyle = 'rgba(255,246,226,0.85)';
        ctx.fillRect(0, h * 0.06, w, h * 0.035);
        let rg = ctx.createLinearGradient(0, h * 0.02, 0, h * 0.2);
        rg.addColorStop(0, 'rgba(255,240,214,0.5)');
        rg.addColorStop(1, 'rgba(255,240,214,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h * 0.2);

        // A wide lit panel in front of the visitor (u = 0.75). This is what the centre
        // of the sphere reflects; the live camera frame is later screened onto it.
        const px = w * 0.75 - w * 0.19, py = h * 0.30, pw = w * 0.38, ph = h * 0.30;
        ctx.fillStyle = 'rgba(232,220,200,0.55)';
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(28,25,22,0.85)';
        ctx.fillRect(px + pw / 3 - 1.5, py, 3, ph);
        ctx.fillRect(px + (2 * pw) / 3 - 1.5, py, 3, ph);
        ctx.fillRect(px, py + ph / 2 - 1.5, pw, 3);
        rg = ctx.createRadialGradient(w * 0.75, h * 0.45, pw * 0.3, w * 0.75, h * 0.45, pw * 1.1);
        rg.addColorStop(0, 'rgba(255,238,206,0.30)');
        rg.addColorStop(1, 'rgba(255,238,206,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);

        // A tall window behind the sphere (u = 0.25) with two mullions: hard edges give
        // the mirror something to reflect when no camera is present.
        const wx = w * 0.25 - 40, wy = h * 0.14, ww = 80, wh = 96;
        ctx.fillStyle = 'rgba(255,242,214,0.95)';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = 'rgba(20,18,15,0.9)';
        ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
        ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
        rg = ctx.createRadialGradient(w * 0.25, wy + wh / 2, ww * 0.4, w * 0.25, wy + wh / 2, ww * 1.6);
        rg.addColorStop(0, 'rgba(255,236,200,0.35)');
        rg.addColorStop(1, 'rgba(255,236,200,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);

        // A doorway of light to the visitor's left (u = 0.5): a tall bright slot with a hard edge
        ctx.fillStyle = 'rgba(255,238,206,0.7)';
        ctx.fillRect(w * 0.5 - 9, h * 0.22, 18, h * 0.44);

        // Floor edge: a crisp dark line where wall meets floor
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, h * 0.66, w, 3);

        // Floor bounce, warm and faint
        rg = ctx.createRadialGradient(w * 0.75, h * 0.92, 10, w * 0.75, h * 0.92, 160);
        rg.addColorStop(0, 'rgba(180,140,90,0.35)');
        rg.addColorStop(1, 'rgba(180,140,90,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);

        // Horizon hairline
        ctx.fillStyle = 'rgba(230,210,170,0.18)';
        ctx.fillRect(0, h * 0.5, w, 1);
    }

    updateEnvironment() {
        const v = this.sensor.video;
        const ctx = this.envCtx, w = this.envCanvas.width, h = this.envCanvas.height;
        if (this.sensor.cameraReady) {
            // Redraw room then paint the live frame where the front of the sphere reflects (u = 0.75)
            this.drawEnvRoom();
            const fw = w * 0.42, fh = fw * (v.videoHeight / v.videoWidth);
            const fx = w * 0.75 - fw / 2, fy = h * 0.5 - fh / 2;
            ctx.save();
            // Screen blend: the visitor adds light to the room and can never darken it,
            // so a dim or covered camera degrades gracefully to the studio alone.
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.9;
            ctx.drawImage(v, fx, fy, fw, fh);
            ctx.restore();
            this.envTexture.needsUpdate = true;
            this.envDirty = true;
        }
        if (this.envDirty) {
            this.envCamera.update(this.renderer, this.envScene);
            this.envDirty = false;
        }
    }

    /* ---------------- geometry ---------------- */

    createCore() {
        const geometry = new THREE.IcosahedronGeometry(0.72, 14);

        // The icosahedron is non-indexed (every face owns its vertices). To keep the
        // surface smooth after displacement, merge coincident vertices once and compute
        // smooth normals on the merged set every frame.
        const pos = geometry.attributes.position;
        const map = new Uint32Array(pos.count);
        const keyToId = new Map();
        const unique = [];
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            const key = `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
            let id = keyToId.get(key);
            if (id === undefined) {
                id = unique.length / 3;
                keyToId.set(key, id);
                unique.push(x, y, z);
            }
            map[i] = id;
        }
        this.coreMap = map;
        this.coreBase = Float32Array.from(unique);
        this.coreUniqueCount = unique.length / 3;
        this.coreDisp = new Float32Array(unique.length);
        this.coreNrm = new Float32Array(unique.length);

        const material = new THREE.MeshStandardMaterial({
            color: 0x141416,
            metalness: 1.0,
            roughness: 0.55,
            envMap: this.envRT.texture,
            envMapIntensity: 0.5
        });
        this.core = new THREE.Mesh(geometry, material);
        this.core.castShadow = true;
        this.core.receiveShadow = true;
        this.group.add(this.core);
    }

    createRings() {
        const dims = [
            { radius: 1.62, tube: 0.075, segments: 64 },
            { radius: 1.22, tube: 0.065, segments: 64 },
            { radius: 0.88, tube: 0.055, segments: 64 }
        ];
        dims.forEach((d, i) => {
            const geom = new THREE.TorusGeometry(d.radius, d.tube, 18, d.segments);
            const tex = this.createRingTexture(i);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x5a5148,
                metalness: 0.95,
                roughness: 0.32,
                envMap: this.envRT.texture,
                envMapIntensity: 0.8,
                bumpMap: tex,
                bumpScale: 0.004,
                emissiveMap: tex,
                emissive: linear(0x6a4a1e).getHex(),
                emissiveIntensity: 0.35
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (i === 0) mesh.rotation.x = Math.PI / 2;
            if (i === 1) mesh.rotation.y = Math.PI / 4;
            if (i === 2) mesh.rotation.z = Math.PI / 6;
            this.group.add(mesh);
            this.rings.push({
                mesh,
                freqX: [1.5, 2.5, 3.5][i],
                freqY: [1.0, 2.0, 3.0][i],
                phase: i * Math.PI / 4,
                accum: 0,
                lastChime: 0,
                prevZ: mesh.rotation.z
            });
        });
    }

    createRingTexture(i) {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.anisotropy = 4;
        this.ringCanvases[i] = { canvas, ctx, texture };
        this.drawRing(i);
        return texture;
    }

    ringText(i) {
        if (i === 0) {
            if (this.inscriptions.length) {
                return this.inscriptions.slice(0, 3).map(s => s.length > 48 ? s.slice(0, 46).trim() + '…' : s);
            }
            return ['Solve et Coagula', 'Be still', 'Solve et Coagula', 'Be still'];
        }
        if (i === 1) return ['Caput Corvi', 'Albedo', 'Citrinitas', 'Rubedo'];
        return ['Visita Interiora Terrae', 'Rectificando Invenies', 'Occultum Lapidem'];
    }

    drawRing(i) {
        const c = this.ringCanvases[i];
        if (!c) return;
        const { canvas, ctx, texture } = c;
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const ink = 'rgba(235,220,190,0.95)';
        ctx.strokeStyle = 'rgba(235,220,190,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 18); ctx.lineTo(w, 18);
        ctx.moveTo(0, h - 18); ctx.lineTo(w, h - 18);
        ctx.stroke();

        const items = this.ringText(i);
        const italic = i === 0 && this.inscriptions.length > 0;
        ctx.fillStyle = ink;
        ctx.font = `${italic ? 'italic ' : ''}${i === 0 ? 44 : 50}px "EB Garamond", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const n = items.length;
        for (let k = 0; k < n; k++) {
            const x = (k / n) * w + w / (n * 2);
            let text = items[k];
            if (!italic) text = text.toUpperCase();
            // Letter-spacing by hand
            const spacing = italic ? 1 : 8;
            let total = 0;
            for (const ch of text) total += ctx.measureText(ch).width + spacing;
            let cx = x - total / 2;
            for (const ch of text) {
                const cw = ctx.measureText(ch).width;
                ctx.fillText(ch, cx + cw / 2, h / 2 + (italic ? 2 : 0));
                cx += cw + spacing;
            }
            // Stage marks between words: a small circle with a dot (Sol)
            const mx = (k / n) * w;
            ctx.beginPath();
            ctx.arc(mx, h / 2, 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(mx, h / 2, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
        texture.needsUpdate = true;
    }

    redrawRings() {
        for (let i = 0; i < 3; i++) this.drawRing(i);
    }

    setInscriptions(list) {
        this.inscriptions = list.slice();
        this.drawRing(0);
    }

    createParticles() {
        const count = 1000;
        const geom = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = 0.6 + Math.random() * 2.6;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
            vel[i * 3] = pos[i * 3] * 0.15;
            vel[i * 3 + 1] = pos[i * 3 + 1] * 0.15;
            vel[i * 3 + 2] = pos[i * 3 + 2] * 0.15;
            col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0.4;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(col, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.026,
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: this.softDot()
        });
        this.particles = new THREE.Points(geom, mat);
        this.particles.userData = { vel, count };
        this.group.add(this.particles);
    }

    // Quicksilver droplets for shatter / dissolve / coagulate
    createDroplets() {
        const count = 420;
        const geom = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const base = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = 0.55 + Math.random() * 0.25;
            base[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            base[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            base[i * 3 + 2] = r * Math.cos(phi);
            pos[i * 3] = base[i * 3];
            pos[i * 3 + 1] = base[i * 3 + 1];
            pos[i * 3 + 2] = base[i * 3 + 2];
            vel[i * 3] = base[i * 3] * (1.2 + Math.random());
            vel[i * 3 + 1] = base[i * 3 + 1] * (1.2 + Math.random());
            vel[i * 3 + 2] = base[i * 3 + 2] * (1.2 + Math.random());
            col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0.7;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.055, vertexColors: true, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false, map: this.softDot()
        });
        this.droplets = new THREE.Points(geom, mat);
        this.droplets.userData = { vel, base, count, pos };
        this.group.add(this.droplets);
    }

    // Extra ring copies that bloom into a mandala through Albedo / Citrinitas
    createKaleidoRings() {
        this.kaleidoRings = [];
        const offsets = [
            { y: Math.PI / 3, z: Math.PI / 5 },
            { y: -Math.PI / 3, z: -Math.PI / 4 },
            { y: Math.PI / 2.2, z: Math.PI / 7 },
            { x: Math.PI / 5, y: Math.PI / 6 },
            { x: -Math.PI / 4, z: Math.PI / 3 },
            { y: Math.PI / 1.7, z: -Math.PI / 5 }
        ];
        offsets.forEach((off, i) => {
            const src = this.rings[i % 3].mesh;
            const mesh = src.clone();
            mesh.material = src.material.clone();
            mesh.material.transparent = true;
            mesh.material.opacity = 0;
            mesh.material.depthWrite = false;
            if (off.x) mesh.rotation.x += off.x;
            if (off.y) mesh.rotation.y += off.y;
            if (off.z) mesh.rotation.z += off.z;
            this.group.add(mesh);
            this.kaleidoRings.push({ mesh, off, phase: i * 0.7 });
        });
    }

    createTrails() {
        const count = 900;
        const geom = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3).fill(0);
        const col = new Float32Array(count * 3).fill(0);
        for (let i = 0; i < count; i++) pos[i * 3 + 2] = -9999;
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.07, vertexColors: true, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending, depthWrite: false, map: this.softDot()
        });
        this.trails = new THREE.Points(geom, mat);
        this.trails.userData = {
            vel: new Float32Array(count * 3),
            life: new Float32Array(count).fill(9999),
            maxLife: Float32Array.from({ length: count }, () => 1.6 + Math.random() * 0.9),
            base: Array.from({ length: count }, () => new THREE.Color()),
            count, idx: 0
        };
        this.scene.add(this.trails);
    }

    softDot() {
        if (this._dot) return this._dot;
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.75)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 32, 32);
        this._dot = new THREE.CanvasTexture(c);
        return this._dot;
    }

    createWall() {
        const geom = new THREE.PlaneGeometry(30, 20);
        const mat = new THREE.MeshStandardMaterial({ color: linear(0x0a0a0c).getHex(), roughness: 0.98, metalness: 0.0 });
        this.wall = new THREE.Mesh(geom, mat);
        this.wall.position.set(0, 0, -3.4);
        this.wall.receiveShadow = true;
        this.scene.add(this.wall);
    }

    // A soft pool of the tone's colour on the wall behind the sphere, so the piece has a room
    // and not a void. Additive, so it lifts the wall without ever going muddy.
    createHalo() {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0.0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
        g.addColorStop(0.7, 'rgba(255,255,255,0.10)');
        g.addColorStop(1.0, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.MeshBasicMaterial({
            map: tex, color: this.paletteGlow.getHex(), transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false, fog: false
        });
        this.halo = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat);
        this.halo.position.set(0, -0.4, -3.3);
        this.scene.add(this.halo);
    }

    /* ---------------- events ---------------- */

    setupEvents() {
        window.addEventListener('resize', () => {
            const w = window.innerWidth, h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });

        // A touch on the sphere sends a ripple through the quicksilver
        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.pointerNdc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            this.raycaster.setFromCamera(this.pointerNdc, this.camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            const hit = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(plane, hit)) {
                this.ripple.active = true;
                this.ripple.center.copy(hit);
                this.ripple.radius = 0;
                this.ripple.intensity = 1;
                if (window.AlchemicalAudio) window.AlchemicalAudio.playChime(Math.random() < 0.5 ? 'silver' : 'gold');
            }
        });
    }

    /* ---------------- the opus ---------------- */

    updateOpus(dt) {
        const s = this.sensor.stillness;
        const motion = this.sensor.motion;

        // Shatter target: move and the metal dissolves; stop and it gathers
        if (motion > 0.35) this.shatterTarget = Math.min(1, this.shatterTarget + dt * 2.4);
        else if (s > 0.55) this.shatterTarget = Math.max(0, this.shatterTarget - dt * 1.1);
        else this.shatterTarget = Math.max(0, this.shatterTarget - dt * 0.35);
        this.shatter = lerp(this.shatter, this.shatterTarget, clamp01(dt * 4));

        // Mandala opens in albedo/citrinitas, folds back at rubedo
        const kaleidoTarget = p => {
            if (p < 0.25) return 0;
            if (p < 0.55) return (p - 0.25) / 0.3;
            if (p < 0.78) return 1;
            return Math.max(0, 1 - (p - 0.78) / 0.22);
        };
        this.kaleido = lerp(this.kaleido, kaleidoTarget(this.opus), clamp01(dt * 1.2));

        let rate;
        if (s > 0.6 && this.shatter < 0.35) rate = ((s - 0.6) / 0.4) / this.riseSeconds;
        else rate = -((0.6 - Math.min(s, 1 - this.shatter * 0.5)) / 0.6) / this.fallSeconds;
        // Caput Corvi: fidgeting holds you in the dark
        if (this.inSession && this.opus < 0.28 && motion > 0.4) rate = Math.min(rate, -0.04);
        this.opus = clamp01(this.opus + rate * dt);
        if (!this.inSession) this.opus = Math.min(this.opus, this.opusCap);
    }

    applyStageVisuals(p, dt) {
        const m = this.core.material;
        // Colour: pitch -> quicksilver -> pale gold -> gold
        stageLerpColor([0x101012, 0xc4c8cf, 0xdcb85c, 0xf7c744], p, m.color);
        m.roughness = stageLerp([0.55, 0.22, 0.10, 0.04], p);
        m.metalness = stageLerp([1.0, 1.0, 0.97, 0.93], p);
        m.envMapIntensity = stageLerp([0.4, 1.0, 1.3, 1.6], p);

        // Rings warm from iron to gold and stop glowing
        this.rings.forEach(r => {
            const rm = r.mesh.material;
            stageLerpColor([0x5a5148, 0x8d877c, 0xb59a5a, 0xd4b05a], p, rm.color);
            rm.roughness = stageLerp([0.34, 0.26, 0.18, 0.12], p);
            rm.envMapIntensity = stageLerp([0.6, 0.8, 0.95, 1.1], p);
            rm.emissiveIntensity = stageLerp([0.45, 0.3, 0.18, 0.08], p);
        });

        // Furnace light: ember red -> warm gold
        stageLerpColor([0x8a220c, 0x9a7a5a, 0xd9a34a, 0xffd27a], p, this.furnace.color);
        this.furnace.intensity = stageLerp([2.2, 2.0, 2.4, 2.8], p);

        // Fog lifts slightly as the work completes
        this.scene.fog.density = lerp(0.075, 0.05, p);

        // The room takes the colour of the chosen tone and brightens as the work completes.
        const k = clamp01((dt || 0.016) * 1.4);
        this.paletteRoom.lerp(this.paletteRoomTarget, k);
        this.paletteGlow.lerp(this.paletteGlowTarget, k);

        const roomLevel = stageLerp([0.55, 0.8, 1.0, 1.15], p);
        this._roomColor.copy(this.paletteRoom).multiplyScalar(roomLevel);
        if (this.fanMode) {
            this.renderer.setClearColor(0x000000);
            this.scene.fog.color.setHex(0x000000);
            this.scene.fog.density = lerp(0.04, 0.015, p);
            this.ambient.color.copy(this.paletteGlow).multiplyScalar(0.35);
        } else {
            this.wall.material.color.copy(this._roomColor);
            this.scene.fog.color.copy(this._roomColor).multiplyScalar(0.6);
            this.renderer.setClearColor(this.scene.fog.color);
            this.ambient.color.copy(this.paletteRoom).multiplyScalar(0.9);
            this.halo.material.color.copy(this.paletteGlow);
            this.halo.material.opacity = stageLerp([0.22, 0.32, 0.40, 0.48], p);
            const hs = 1 + 0.04 * Math.sin(this.time * 0.6);
            this.halo.scale.set(hs, hs, 1);
        }

        // Furnace takes the tone's glow as well as the stage colour
        this.furnace.color.lerp(this.paletteGlow, 0.25);
    }

    /* ---------------- quicksilver surface ---------------- */

    displaceCore(t, p, motion) {
        const base = this.coreBase, disp = this.coreDisp, nrm = this.coreNrm, map = this.coreMap;
        const n = this.coreUniqueCount;
        const amp = stageLerp([0.085, 0.045, 0.02, 0.005], p) + motion * 0.045;
        const speed = lerp(1.6, 0.7, p);
        const fineMix = 0.35 * (1 - p);

        // Displace the unique vertices along their radial direction
        for (let u = 0; u < n; u++) {
            const x = base[u * 3], y = base[u * 3 + 1], z = base[u * 3 + 2];
            const wave = Math.sin(x * 6 + t * speed) * Math.cos(y * 6 + t * speed * 0.9) * Math.sin(z * 6 + t * speed * 1.1);
            const fine = Math.sin(x * 14 - t * 2.2) * Math.sin(y * 13 + t * 1.7) * fineMix;
            const len = Math.sqrt(x * x + y * y + z * z) || 1;
            const d = (wave + fine) * amp / len;
            disp[u * 3] = x + x * d;
            disp[u * 3 + 1] = y + y * d;
            disp[u * 3 + 2] = z + z * d;
            nrm[u * 3] = nrm[u * 3 + 1] = nrm[u * 3 + 2] = 0;
        }

        // Accumulate face normals into the shared vertices
        const faces = map.length / 3;
        for (let f = 0; f < faces; f++) {
            const a = map[f * 3], b = map[f * 3 + 1], c = map[f * 3 + 2];
            const ax = disp[a * 3], ay = disp[a * 3 + 1], az = disp[a * 3 + 2];
            const e1x = disp[b * 3] - ax, e1y = disp[b * 3 + 1] - ay, e1z = disp[b * 3 + 2] - az;
            const e2x = disp[c * 3] - ax, e2y = disp[c * 3 + 1] - ay, e2z = disp[c * 3 + 2] - az;
            const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
            nrm[a * 3] += nx; nrm[a * 3 + 1] += ny; nrm[a * 3 + 2] += nz;
            nrm[b * 3] += nx; nrm[b * 3 + 1] += ny; nrm[b * 3 + 2] += nz;
            nrm[c * 3] += nx; nrm[c * 3 + 1] += ny; nrm[c * 3 + 2] += nz;
        }
        for (let u = 0; u < n; u++) {
            const x = nrm[u * 3], y = nrm[u * 3 + 1], z = nrm[u * 3 + 2];
            const l = Math.sqrt(x * x + y * y + z * z) || 1;
            nrm[u * 3] = x / l; nrm[u * 3 + 1] = y / l; nrm[u * 3 + 2] = z / l;
        }

        // Write back to the render geometry
        const posArr = this.core.geometry.attributes.position.array;
        const nrmArr = this.core.geometry.attributes.normal.array;
        for (let i = 0; i < map.length; i++) {
            const u = map[i] * 3, j = i * 3;
            posArr[j] = disp[u]; posArr[j + 1] = disp[u + 1]; posArr[j + 2] = disp[u + 2];
            nrmArr[j] = nrm[u]; nrmArr[j + 1] = nrm[u + 1]; nrmArr[j + 2] = nrm[u + 2];
        }
        this.core.geometry.attributes.position.needsUpdate = true;
        this.core.geometry.attributes.normal.needsUpdate = true;
    }

    /* ---------------- frame ---------------- */

    tick() {
        requestAnimationFrame(() => this.tick());
        const dt = Math.min(0.05, this.clock.getDelta());
        this.time += dt;
        const t = this.time;

        this.sensor.update(dt);
        this.updateOpus(dt);
        const p = this.opus;
        const motion = this.sensor.motion;
        const shatter = this.shatter;

        const A = window.AlchemicalAudio;
        if (A) A.tickBeat(dt);
        const beat = A ? A.beatPulse : 0;

        this.applyStageVisuals(p, dt);

        // Environment: refresh the mirror from the camera every other frame
        this.envFrame++;
        if (this.envFrame % 2 === 0 || this.envDirty) this.updateEnvironment();

        // Camera eases in during a session; citrinitas pulls slightly closer
        const zoom = this.cameraTargetZ - (p > 0.5 && p < 0.85 ? (p - 0.5) * 0.6 : 0);
        this.camera.position.z = lerp(this.camera.position.z, zoom, dt * 0.8);
        this.camera.lookAt(0, 0, 0);

        // Ripple physics
        if (this.ripple.active) {
            this.ripple.radius += dt * this.ripple.speed;
            this.ripple.intensity = Math.max(0, 1 - this.ripple.radius / this.ripple.maxRadius);
            if (this.ripple.radius >= this.ripple.maxRadius) this.ripple.active = false;
        }

        // 1. Quicksilver surface. Agitation + shatter
        this.displaceCore(t, p, Math.max(motion, shatter * 0.8));

        // Beat pulse on the sphere, stronger early when the drum is fast
        const beatAmp = lerp(0.08, 0.02, p) * beat;
        const heart = t * Math.PI * 2 * 1.0;
        const pulse = 1 + Math.max(0, Math.sin(heart)) * 0.02 + beatAmp;
        const breath = 1 + Math.sin(t * 0.785) * 0.04;
        const gather = 1 - shatter * 0.82;
        const s = lerp(pulse, breath, p) * gather;
        this.core.scale.setScalar(s);
        this.core.material.opacity = 1;
        this.core.visible = shatter < 0.92;
        this.core.rotation.y += dt * 0.25 * lerp(1, 0.4, p);
        this.core.rotation.x += dt * 0.08 * lerp(1, 0.4, p);
        this.group.position.y = Math.sin(t * 0.8) * 0.05;

        // 2. Rings: Lissajous precession + beat kick + kaleidoscope bloom
        const ringSpeed = lerp(1.15, 0.35, p);
        this.rings.forEach((r, i) => {
            const ts = t * 0.4 * ringSpeed;
            r.mesh.rotation.x = Math.sin(ts * r.freqX + r.phase) * 0.5 + Math.PI / 2;
            r.mesh.rotation.y = Math.cos(ts * r.freqY + r.phase) * 0.5;
            r.mesh.rotation.z += dt * 0.3 * ringSpeed;
            r.mesh.position.z = Math.sin(t * 0.5 + i * Math.PI) * 0.15;
            const kick = 1 + beat * lerp(0.12, 0.03, p);
            r.mesh.scale.setScalar(kick);

            const dz = Math.abs(r.mesh.rotation.z - r.prevZ);
            r.prevZ = r.mesh.rotation.z;
            r.accum += dz;
            const q = Math.floor(r.accum / (Math.PI / 2));
            if (q > r.lastChime) {
                r.lastChime = q;
                if (A && A.isActive && Math.random() < lerp(0.9, 0.25, p) && p < 0.85) {
                    const base = A.tunings[A.activeTuning].chime;
                    const f = base * [0.5, 1.0, 1.5][i] * (0.995 + Math.random() * 0.01);
                    A.playChime(f);
                }
            }
        });

        // Mandala copies bloom with kaleido, spin slower, pull inward in citrinitas
        const pull = p > 0.5 ? (p - 0.5) * 0.35 : 0;
        if (this.kaleidoRings) {
            this.kaleidoRings.forEach((k, i) => {
                const src = this.rings[i % 3].mesh;
                k.mesh.rotation.copy(src.rotation);
                k.mesh.rotation.x += k.off.x || 0;
                k.mesh.rotation.y += (k.off.y || 0) + t * 0.15 * (1 - p);
                k.mesh.rotation.z += (k.off.z || 0) + t * 0.08;
                const op = this.kaleido * (0.35 + 0.1 * Math.sin(t + k.phase));
                k.mesh.material.opacity = op;
                k.mesh.visible = op > 0.02;
                const sc = (1 - pull * 0.4) * (1 + beat * 0.06);
                k.mesh.scale.setScalar(sc);
            });
        }

        // 3. Droplets: shatter outward, dissolve into orbit at albedo, coagulate at rubedo
        this.updateDroplets(dt, t, p, shatter, beat);

        // 4. Particles: ash -> silver -> gold; burst on the beat
        this.updateParticles(dt, t, p, Math.max(motion, beat * 0.5));
        this.updateTrails(dt, t, p);

        this.renderer.render(this.scene, this.camera);
    }

    updateDroplets(dt, t, p, shatter, beat) {
        if (!this.droplets) return;
        const { vel, base, count } = this.droplets.userData;
        const pos = this.droplets.geometry.attributes.position.array;
        const col = this.droplets.geometry.attributes.color;
        const near = this._tmpColor, far = this._tmpColor2;
        stageLerpColor([0x8a8884, 0xd0d4da, 0xe0c070, 0xf0d070], p, near);
        stageLerpColor([0x2a2824, 0x6a7078, 0x8a6a30, 0xa08030], p, far);

        // Dissolve (albedo) adds orbital droplets even when gathered
        const dissolve = clamp01((p - 0.22) / 0.28) * (1 - clamp01((p - 0.72) / 0.2));
        const amount = Math.max(shatter, dissolve * 0.85);
        this.droplets.material.opacity = amount * 0.85;
        this.droplets.material.size = 0.04 + shatter * 0.04 + beat * 0.02;

        for (let i = 0; i < count; i++) {
            const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
            const orbitR = 1 + dissolve * (1.5 + 0.5 * Math.sin(t * 0.7 + i * 0.2));
            const ang = t * (0.35 + (i % 7) * 0.025) * (1 - p * 0.4);
            const ox = bx * Math.cos(ang) - bz * Math.sin(ang);
            const oz = bx * Math.sin(ang) + bz * Math.cos(ang);
            let x = ox * orbitR;
            let y = by * orbitR;
            let z = oz * orbitR;
            // Shatter: fly outward along the radial
            const fly = 1 + shatter * (2.8 + (i % 5) * 0.2);
            x = lerp(x, bx * fly, shatter);
            y = lerp(y, by * fly, shatter);
            z = lerp(z, bz * fly, shatter);
            // Coagulate: pull hard toward centre at rubedo
            if (p > 0.78) {
                const c = (p - 0.78) / 0.22;
                x *= (1 - c * 0.92);
                y *= (1 - c * 0.92);
                z *= (1 - c * 0.92);
            }
            pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
            const u = (i % 17) / 17;
            near.lerp(far, u);
            col.setXYZ(i, near.r, near.g, near.b);
        }
        this.droplets.geometry.attributes.position.needsUpdate = true;
        col.needsUpdate = true;
    }

    updateParticles(dt, t, p, motion) {
        const geo = this.particles.geometry;
        const pos = geo.attributes.position.array;
        const colAttr = geo.attributes.color;
        const vel = this.particles.userData.vel;
        const count = this.particles.userData.count;
        const step = dt * 60;
        const near = this._tmpColor, far = this._tmpColor2;
        stageLerpColor([0x5a4e3e, 0x9fa3a8, 0xc9a85e, 0xe0be6e], p, near);
        stageLerpColor([0x14110e, 0x2c2f33, 0x3a2c12, 0x4a3a18], p, far);
        this.particles.material.opacity = lerp(0.32, 0.18, p);
        const turbulence = lerp(0.004, 0.0006, p) + motion * 0.004;

        for (let i = 0; i < count; i++) {
            const px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2];
            // Vortex around the core
            vel[i * 3] += (-py * 0.0075 - px * 0.002) * step;
            vel[i * 3 + 1] += (px * 0.0075 - py * 0.002) * step;
            vel[i * 3 + 2] += (Math.sin(t * 0.5 + px) * 0.001 - pz * 0.002) * step;
            // Turbulence falls with stillness
            vel[i * 3] += (Math.random() - 0.5) * turbulence;
            vel[i * 3 + 1] += (Math.random() - 0.5) * turbulence;
            vel[i * 3 + 2] += (Math.random() - 0.5) * turbulence;

            if (this.ripple.active) {
                const dx = px - this.ripple.center.x, dy = py - this.ripple.center.y, dz = pz - this.ripple.center.z;
                const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const diff = Math.abs(d - this.ripple.radius);
                if (diff < 0.35) {
                    const f = (1 - diff / 0.35) * this.ripple.intensity * 0.12;
                    vel[i * 3] += (dx / (d || 1)) * f;
                    vel[i * 3 + 1] += (dy / (d || 1)) * f;
                    vel[i * 3 + 2] += (dz / (d || 1)) * f;
                }
            }

            let nx = px + vel[i * 3] * step, ny = py + vel[i * 3 + 1] * step, nz = pz + vel[i * 3 + 2] * step;
            vel[i * 3] *= 0.98; vel[i * 3 + 1] *= 0.98; vel[i * 3 + 2] *= 0.98;

            const dist = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (dist > 4.5 || dist < 0.4) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const r = 3.5 + Math.random();
                nx = r * Math.sin(phi) * Math.cos(theta);
                ny = r * Math.sin(phi) * Math.sin(theta);
                nz = r * Math.cos(phi);
                vel[i * 3] = -ny * 0.02 - nx * 0.005;
                vel[i * 3 + 1] = nx * 0.02 - ny * 0.005;
                vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
            }
            pos[i * 3] = nx; pos[i * 3 + 1] = ny; pos[i * 3 + 2] = nz;

            const k = clamp01((dist - 0.3) / 3.8);
            colAttr.setXYZ(i,
                lerp(near.r, far.r, k), lerp(near.g, far.g, k), lerp(near.b, far.b, k));
        }
        geo.attributes.position.needsUpdate = true;
        colAttr.needsUpdate = true;
    }

    updateTrails(dt, t, p) {
        const d = this.trails.userData;
        const pos = this.trails.geometry.attributes.position.array;
        const col = this.trails.geometry.attributes.color.array;
        const tint = stageLerpColor([0x8a8079, 0xe0e3e8, 0xe8c982, 0xffd68a], p, this._tmpColor);
        // Spawn from the rings, fewer as the work completes
        if (Math.random() < lerp(1.0, 0.35, p)) {
            this.rings.forEach(r => {
                r.mesh.updateMatrixWorld(true);
                const radius = r.mesh.geometry.parameters.radius;
                [t * 2.5, t * 2.5 + Math.PI].forEach(a => {
                    const lp = new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0).applyMatrix4(r.mesh.matrixWorld);
                    const i = d.idx;
                    pos[i * 3] = lp.x; pos[i * 3 + 1] = lp.y; pos[i * 3 + 2] = lp.z;
                    d.vel[i * 3] = (Math.random() - 0.5) * 0.02;
                    d.vel[i * 3 + 1] = 0.01 + Math.random() * 0.015;
                    d.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
                    d.life[i] = 0;
                    d.base[i].copy(tint);
                    d.idx = (d.idx + 1) % d.count;
                });
            });
        }
        const step = dt * 60;
        for (let i = 0; i < d.count; i++) {
            if (d.life[i] < d.maxLife[i]) {
                d.life[i] += dt;
                pos[i * 3] += d.vel[i * 3] * step;
                pos[i * 3 + 1] += (d.vel[i * 3 + 1] + 0.004) * step;
                pos[i * 3 + 2] += d.vel[i * 3 + 2] * step;
                d.vel[i * 3] *= 0.96; d.vel[i * 3 + 2] *= 0.96;
                const fade = Math.max(0, 1 - d.life[i] / d.maxLife[i]);
                col[i * 3] = d.base[i].r * fade; col[i * 3 + 1] = d.base[i].g * fade; col[i * 3 + 2] = d.base[i].b * fade;
            } else {
                pos[i * 3 + 2] = -9999;
            }
        }
        this.trails.geometry.attributes.position.needsUpdate = true;
        this.trails.geometry.attributes.color.needsUpdate = true;
    }
}

/* ==========================================================================
   INSTALLATION — visitor flow
   ========================================================================== */
class Installation {
    constructor(engine, sensor) {
        this.engine = engine;
        this.sensor = sensor;
        this.state = 'attract';

        this.settings = Object.assign({
            durationSeconds: 90,
            idleSeconds: 60,
            tuning: '432',
            bellows: true,
            bellowsPattern: 'shamanic',
            volume: 60,
            camera: true,
            visitorChoice: true,
            fanMode: false,
            pixelRatio: 2,
            settingsVersion: 2
        }, this.loadSettings());
        // Migrate older installs onto the narrative defaults once
        if ((this.settings.settingsVersion || 0) < 2) {
            this.settings.bellowsPattern = 'shamanic';
            this.settings.durationSeconds = 90;
            this.settings.settingsVersion = 2;
        }

        // The visitor's choices for this sitting. They start from the curator's defaults
        // and go back to them when the piece returns to attract.
        this.sessionTuning = this.settings.tuning;
        this.sessionBellows = this.settings.bellows;

        this.el = {
            attract: document.getElementById('attract'),
            attractLine: document.getElementById('attract-inscription'),
            attractBegin: document.getElementById('attract-begin'),
            choose: document.getElementById('choose'),
            toneGrid: document.getElementById('tone-grid'),
            chooseBellows: document.getElementById('choose-bellows'),
            chooseNext: document.getElementById('choose-next'),
            intro: document.getElementById('intro'),
            introBegin: document.getElementById('intro-begin'),
            introCount: document.getElementById('intro-count'),
            introDuration: document.getElementById('intro-duration'),
            hud: document.getElementById('hud'),
            hint: document.getElementById('hud-hint'),
            voice: document.getElementById('voice-line'),
            stage: document.getElementById('hud-stage'),
            progress: document.getElementById('hud-progress'),
            end: document.getElementById('hud-end'),
            ret: document.getElementById('return'),
            reflect: document.getElementById('reflect'),
            reflectInput: document.getElementById('reflect-input'),
            reflectSave: document.getElementById('reflect-save'),
            reflectSkip: document.getElementById('reflect-skip'),
            thanks: document.getElementById('thanks'),
            sensorNote: document.getElementById('sensor-note'),
            toast: document.getElementById('toast')
        };

        this.sessionStart = 0;
        this.sessionElapsed = 0;
        this.lastActivity = performance.now();
        this.reflectTimer = null;
        this.currentStageKey = null;
        this.inscriptionIndex = 0;

        this.reflections = this.loadReflections();
        this.engine.setInscriptions(this.reflections.map(r => r.text));

        this.buildToneGrid();
        this.applySettings();
        this.bind();
        this.rotateAttractInscription();
        this.startSensor();
        this.loop();
    }

    /* ---------------- persistence ---------------- */

    loadSettings() {
        try { return JSON.parse(localStorage.getItem('liminal_settings') || '{}'); } catch (e) { return {}; }
    }
    saveSettings() {
        try { localStorage.setItem('liminal_settings', JSON.stringify(this.settings)); } catch (e) {}
    }
    loadReflections() {
        try {
            const raw = localStorage.getItem('liminal_reflections');
            const list = raw ? JSON.parse(raw) : [];
            return list.filter(r => r && r.text);
        } catch (e) { return []; }
    }
    saveReflections() {
        try { localStorage.setItem('liminal_reflections', JSON.stringify(this.reflections)); } catch (e) {}
    }

    applySettings() {
        const s = this.settings;
        // Outside a sitting the curator's defaults are what plays and colours the room
        if (this.state === 'attract') {
            this.sessionTuning = s.tuning;
            this.sessionBellows = s.bellows;
        }
        const A = window.AlchemicalAudio;
        if (A) {
            A.setTuning(this.sessionTuning);
            A.setBellowsEnabled(this.sessionBellows);
            A.setBellowsPattern(s.bellowsPattern);
            A.setMasterVolume(s.volume / 100);
        }
        this.engine.setTone(this.sessionTuning);
        this.engine.setFanMode(!!s.fanMode);
        this.engine.riseSeconds = Math.max(28, s.durationSeconds * 0.55);
        this.engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.pixelRatio));
        this.sensor.enabled = !!s.camera;
        if (this.el.introDuration) this.el.introDuration.textContent = durationWords(s.durationSeconds);
        this.saveSettings();
        this.syncChoiceUI();
    }

    /* ---------------- the choice screen ---------------- */

    buildToneGrid() {
        const grid = this.el.toneGrid;
        if (!grid) return;
        grid.innerHTML = '';
        TONES.forEach(t => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'tone';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', 'false');
            b.dataset.key = t.key;
            b.innerHTML = `<span class="swatch" style="background:#${t.glow.toString(16).padStart(6, '0')}"></span>` +
                `<span class="tone-hz">${t.hz} Hz</span>` +
                `<span class="tone-name">${t.planet} · ${t.metal}</span>`;
            b.addEventListener('click', () => this.chooseTone(t.key));
            grid.appendChild(b);
        });
    }

    chooseTone(key) {
        this.sessionTuning = String(key);
        const A = window.AlchemicalAudio;
        if (A) { A.setTuning(this.sessionTuning); A.playChime('gold'); }
        this.engine.setTone(this.sessionTuning);
        this.syncChoiceUI();
    }

    toggleBellows() {
        this.sessionBellows = !this.sessionBellows;
        const A = window.AlchemicalAudio;
        if (A) A.setBellowsEnabled(this.sessionBellows);
        this.syncChoiceUI();
    }

    syncChoiceUI() {
        if (this.el.toneGrid) {
            this.el.toneGrid.querySelectorAll('.tone').forEach(b =>
                b.setAttribute('aria-checked', b.dataset.key === this.sessionTuning ? 'true' : 'false'));
        }
        const cb = this.el.chooseBellows;
        if (cb) {
            cb.setAttribute('aria-pressed', this.sessionBellows ? 'true' : 'false');
            cb.lastChild.textContent = this.sessionBellows ? 'Frame drum: on' : 'Frame drum: off';
        }
    }

    async startSensor() {
        if (this.settings.camera) {
            const ok = await this.sensor.startCamera();
            this.noteSensor(ok ? 'camera' : 'pointer');
        } else {
            this.sensor.stopCamera();
            this.noteSensor('pointer');
        }
    }

    noteSensor(source) {
        if (!this.el.sensorNote) return;
        this.el.sensorNote.textContent = source === 'camera'
            ? 'Camera on. Nothing is recorded or sent. Frames are compared and discarded.'
            : 'No camera. Stillness is read from touch and movement of this device.';
    }

    /* ---------------- events ---------------- */

    bind() {
        const activity = () => { this.lastActivity = performance.now(); };
        ['pointerdown', 'pointermove', 'keydown', 'touchstart'].forEach(ev =>
            window.addEventListener(ev, activity, { passive: true }));

        // Touch anywhere on the attract screen to begin; the button is the visible invitation
        const begin = (e) => {
            if (this.state !== 'attract') return;
            if (e.target && e.target.closest && e.target.closest('.panel, .modal')) return;
            this.begin();
        };
        window.addEventListener('pointerdown', begin);
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'Escape') { if (this.state === 'work' || this.state === 'intro' || this.state === 'choose') this.endSession(false); return; }
            if (this.state === 'attract' && (e.key === ' ' || e.key === 'Enter')) this.begin();
            if (this.state === 'choose' && e.key === 'Enter') this.startIntro();
            if (this.state === 'intro' && (e.key === ' ' || e.key === 'Enter')) this.startWork();
        });
        if (this.el.chooseBellows) this.el.chooseBellows.addEventListener('click', () => this.toggleBellows());
        if (this.el.chooseNext) this.el.chooseNext.addEventListener('click', () => { if (this.state === 'choose') this.startIntro(); });
        if (this.el.introBegin) this.el.introBegin.addEventListener('click', () => { if (this.state === 'intro') this.startWork(); });
        if (this.el.end) this.el.end.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (this.state === 'work') this.endSession(false); });

        if (this.el.reflectSave) this.el.reflectSave.addEventListener('click', () => this.saveReflection());
        if (this.el.reflectSkip) this.el.reflectSkip.addEventListener('click', () => this.finishReflection(false));
        if (this.el.reflectInput) this.el.reflectInput.addEventListener('input', () => { this.reflectDeadline = performance.now() + 60000; });
    }

    show(el, on) {
        if (!el) return;
        el.classList.toggle('is-visible', !!on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
    }

    toast(msg) {
        const t = this.el.toast;
        if (!t) return;
        t.textContent = msg;
        t.classList.add('is-visible');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2800);
    }

    /* ---------------- states ---------------- */

    begin() {
        const A = window.AlchemicalAudio;
        if (A) { A.resume(); A.playChime('gold'); }
        this.show(this.el.attract, false);
        this.engine.cameraTargetZ = 4.3;
        this.sessionTuning = this.settings.tuning;
        this.sessionBellows = this.settings.bellows;
        this.syncChoiceUI();
        if (this.settings.visitorChoice) {
            this.state = 'choose';
            this.show(this.el.choose, true);
        } else {
            this.startIntro();
        }
    }

    startIntro() {
        this.state = 'intro';
        this.show(this.el.choose, false);
        this.show(this.el.intro, true);
        clearTimeout(this._introTimer);
        clearInterval(this._introCountdown);
        let left = 15;
        if (this.el.introCount) this.el.introCount.textContent = String(left);
        this._introCountdown = setInterval(() => {
            left -= 1;
            if (this.el.introCount) this.el.introCount.textContent = String(Math.max(0, left));
            if (left <= 0) clearInterval(this._introCountdown);
        }, 1000);
        this._introTimer = setTimeout(() => { if (this.state === 'intro') this.startWork(); }, 15000);
    }

    startWork() {
        clearTimeout(this._introTimer);
        clearInterval(this._introCountdown);
        this.state = 'work';
        this.show(this.el.choose, false);
        this.show(this.el.intro, false);
        this.show(this.el.hud, true);
        this.hintSince = 0;
        if (this.el.hint) this.el.hint.classList.remove('is-visible');
        this.sessionStart = performance.now();
        this.sessionElapsed = 0;
        this.engine.inSession = true;
        this.engine.opus = 0.02;
        this.engine.shatter = 0;
        this.engine.shatterTarget = 0;
        this.voiceIndex = 0;
        this.againUntil = 0;
        this.clearVoice();
        const A = window.AlchemicalAudio;
        if (A) A.setSessionActive(true);
        this.currentStageKey = null;
    }

    speak(text, hold = 3, command = false) {
        const el = this.el.voice;
        if (!el) return;
        el.textContent = text;
        el.classList.toggle('is-command', !!command);
        el.classList.add('is-visible');
        this.voiceUntil = performance.now() / 1000 + hold;
        // store absolute-ish end using session clock in loop
        this._voiceHold = hold;
        this._voiceStartedAt = this.sessionElapsed;
    }

    clearVoice() {
        const el = this.el.voice;
        if (!el) return;
        el.classList.remove('is-visible', 'is-command');
        el.textContent = '';
        this.voiceUntil = 0;
    }

    updateVoice(elapsed, motion, stillness) {
        const el = this.el.voice;
        if (!el) return;

        // Fractionation: if they move during Caput Corvi after the lesson, say Again.
        if (elapsed > 12 && elapsed < 28 && motion > 0.45 && this.engine.opus < 0.28) {
            if (this.sessionElapsed > this.againUntil) {
                this.speak('Again.', 1.6, true);
                this.againUntil = this.sessionElapsed + 3.5;
            }
            return;
        }

        // Fade out current line when its hold is done
        if (this._voiceStartedAt != null && elapsed - this._voiceStartedAt > (this._voiceHold || 3)) {
            if (el.classList.contains('is-visible') && !el.classList.contains('is-command')) {
                el.classList.remove('is-visible');
            } else if (el.classList.contains('is-command') && elapsed - this._voiceStartedAt > (this._voiceHold || 2)) {
                el.classList.remove('is-visible', 'is-command');
            }
        }

        // Advance script
        while (this.voiceIndex < VOICE.length && elapsed >= VOICE[this.voiceIndex].at) {
            const line = VOICE[this.voiceIndex];
            if (line.needStill && stillness < 0.55) break;
            // Lesson: force a shatter when "Move." is showing
            if (line.text === 'Move.') {
                this.engine.shatterTarget = 1;
                setTimeout(() => {
                    if (this.state === 'work' && this.sessionElapsed < 10) this.engine.shatterTarget = 1;
                }, 1200);
            }
            if (line.text === 'Now stop.') {
                this.engine.shatterTarget = 0;
            }
            this.speak(line.text, line.hold || 3, !!line.command);
            this.voiceIndex++;
            break;
        }

        // Rubedo silence: clear voice after the last line and leave the mirror
        if (elapsed > 80 && this.engine.opus > 0.85) {
            el.classList.remove('is-visible', 'is-command');
        }
    }

    endSession(completed) {
        this.state = completed ? 'return' : 'attract';
        this.engine.inSession = false;
        this.show(this.el.hud, false);
        const A = window.AlchemicalAudio;
        if (A) {
            A.setSessionActive(false);
            if (completed) A.playCompletion();
        }
        if (completed) {
            this.show(this.el.ret, true);
            clearTimeout(this._returnTimer);
            this._returnTimer = setTimeout(() => this.openReflection(), 5200);
        } else {
            this.toAttract();
        }
    }

    openReflection() {
        this.show(this.el.ret, false);
        this.state = 'reflect';
        this.show(this.el.reflect, true);
        this.reflectDeadline = performance.now() + 45000;
        if (this.el.reflectInput) {
            this.el.reflectInput.value = '';
            setTimeout(() => this.el.reflectInput.focus({ preventScroll: true }), 600);
        }
    }

    saveReflection() {
        const text = (this.el.reflectInput ? this.el.reflectInput.value : '').trim().replace(/\s+/g, ' ');
        if (text) {
            this.reflections.unshift({ text: text.slice(0, 240), at: new Date().toISOString() });
            if (this.reflections.length > 200) this.reflections.length = 200;
            this.saveReflections();
            this.engine.setInscriptions(this.reflections.map(r => r.text));
            if (window.Curator) window.Curator.renderReflections();
        }
        this.finishReflection(!!text);
    }

    finishReflection(saved) {
        this.show(this.el.reflect, false);
        if (this.el.reflectInput) this.el.reflectInput.blur();
        if (saved) {
            this.state = 'thanks';
            this.show(this.el.thanks, true);
            clearTimeout(this._thanksTimer);
            this._thanksTimer = setTimeout(() => { this.show(this.el.thanks, false); this.toAttract(); }, 4200);
        } else {
            this.toAttract();
        }
    }

    toAttract() {
        clearTimeout(this._introTimer);
        clearInterval(this._introCountdown);
        this.state = 'attract';
        this.engine.inSession = false;
        this.engine.cameraTargetZ = 5.0;
        this.show(this.el.hud, false);
        this.show(this.el.choose, false);
        this.show(this.el.intro, false);
        this.show(this.el.ret, false);
        this.show(this.el.reflect, false);
        this.show(this.el.attract, true);
        if (this.el.hint) this.el.hint.classList.remove('is-visible');
        this.clearVoice();
        const A = window.AlchemicalAudio;
        if (A) A.setSessionActive(false);
        // Back to the curator's defaults for the next person
        this.applySettings();
    }

    rotateAttractInscription() {
        const el = this.el.attractLine;
        const next = () => {
            if (!el) return;
            if (this.reflections.length === 0) { el.textContent = ''; return; }
            el.classList.remove('is-visible');
            setTimeout(() => {
                const r = this.reflections[this.inscriptionIndex % this.reflections.length];
                this.inscriptionIndex++;
                el.textContent = `“${r.text}”`;
                el.classList.add('is-visible');
            }, 900);
        };
        next();
        setInterval(next, 11000);
    }

    /* ---------------- per-frame ---------------- */

    loop() {
        requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const A = window.AlchemicalAudio;

        if (A && A.isActive) A.setOpus(this.engine.opus);

        if (this.state === 'work') {
            this.sessionElapsed = (now - this.sessionStart) / 1000;
            const frac = clamp01(this.sessionElapsed / this.settings.durationSeconds);
            if (this.el.progress) this.el.progress.style.transform = `scaleX(${frac})`;

            const st = stageFor(this.engine.opus);
            if (st.key !== this.currentStageKey) {
                this.currentStageKey = st.key;
                if (this.el.stage) {
                    this.el.stage.textContent = st.label;
                    this.el.stage.classList.remove('is-visible');
                    void this.el.stage.offsetWidth;
                    this.el.stage.classList.add('is-visible');
                }
            }
            // A gentle nudge if the visitor has been moving for a few seconds
            if (this.el.hint) {
                if (this.sensor.motion > 0.3 && this.sessionElapsed > 12) {
                    if (!this.hintSince) this.hintSince = now;
                    if (now - this.hintSince > 2800) this.el.hint.classList.add('is-visible');
                } else {
                    this.hintSince = 0;
                    this.el.hint.classList.remove('is-visible');
                }
            }
            this.updateVoice(this.sessionElapsed, this.sensor.motion, this.sensor.stillness);
            if (this.sessionElapsed >= this.settings.durationSeconds) this.endSession(true);
        } else if (this.state === 'reflect') {
            if (now > this.reflectDeadline) this.saveReflection();
        }

        // Idle guard: if a visitor walks away from the choice screen, return to attract
        if (this.state === 'choose' && now - this.lastActivity > this.settings.idleSeconds * 1000) this.toAttract();
    }
}

/* ==========================================================================
   CURATOR — Shift+C settings, Shift+P wall text, kiosk lock
   ========================================================================== */
class Curator {
    constructor(installation, engine, sensor) {
        this.inst = installation;
        this.engine = engine;
        this.sensor = sensor;
        this.panel = document.getElementById('curator');
        this.plaque = document.getElementById('plaque');
        this.locked = true;
        this.open = false;

        this.f = {
            duration: document.getElementById('c-duration'),
            idle: document.getElementById('c-idle'),
            tuning: document.getElementById('c-tuning'),
            bellows: document.getElementById('c-bellows'),
            pattern: document.getElementById('c-pattern'),
            volume: document.getElementById('c-volume'),
            volumeVal: document.getElementById('c-volume-val'),
            mute: document.getElementById('c-mute'),
            camera: document.getElementById('c-camera'),
            choice: document.getElementById('c-choice'),
            fan: document.getElementById('c-fan'),
            pixel: document.getElementById('c-pixel'),
            lock: document.getElementById('c-lock'),
            fullscreen: document.getElementById('c-fullscreen'),
            sensorSource: document.getElementById('c-sensor-source'),
            sensorLevel: document.getElementById('c-sensor-level'),
            opus: document.getElementById('c-opus'),
            list: document.getElementById('c-reflections'),
            exportBtn: document.getElementById('c-export'),
            clearBtn: document.getElementById('c-clear'),
            close: document.getElementById('c-close'),
            plaqueClose: document.getElementById('plaque-close')
        };

        this.bind();
        this.populate();
        this.renderReflections();
        this.applyLock(true);
        this.monitor();
    }

    bind() {
        window.addEventListener('keydown', (e) => {
            if (e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); this.toggle(); }
            if (e.shiftKey && (e.key === 'P' || e.key === 'p')) { e.preventDefault(); this.togglePlaque(); }
            if (e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); this.toggleFullscreen(); }
            if (e.key === 'Escape' && this.open) this.close();
            if (e.key === 'Escape' && this.plaqueOpen) this.togglePlaque();
            if (this.locked && !this.open) {
                if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && ['r', 'R', 'w', 'W', 'u', 'U', 's', 'S'].includes(e.key))) e.preventDefault();
            }
        });
        window.addEventListener('contextmenu', (e) => { if (this.locked && !this.open) e.preventDefault(); });
        window.addEventListener('dragstart', (e) => { if (this.locked) e.preventDefault(); });

        const s = this.inst.settings;
        const f = this.f;
        const A = window.AlchemicalAudio;

        if (f.close) f.close.addEventListener('click', () => this.close());
        if (f.plaqueClose) f.plaqueClose.addEventListener('click', () => this.togglePlaque());
        if (this.panel) this.panel.addEventListener('click', (e) => { if (e.target === this.panel) this.close(); });
        if (this.plaque) this.plaque.addEventListener('click', (e) => { if (e.target === this.plaque) this.togglePlaque(); });

        if (f.duration) f.duration.addEventListener('change', (e) => { s.durationSeconds = parseInt(e.target.value, 10); this.inst.applySettings(); });
        if (f.idle) f.idle.addEventListener('change', (e) => { s.idleSeconds = parseInt(e.target.value, 10); this.inst.applySettings(); });
        if (f.tuning) f.tuning.addEventListener('change', (e) => { s.tuning = e.target.value; this.inst.applySettings(); });
        if (f.bellows) f.bellows.addEventListener('change', (e) => { s.bellows = e.target.checked; this.inst.applySettings(); });
        if (f.pattern) f.pattern.addEventListener('change', (e) => { s.bellowsPattern = e.target.value; this.inst.applySettings(); });
        if (f.volume) f.volume.addEventListener('input', (e) => {
            s.volume = parseInt(e.target.value, 10);
            if (f.volumeVal) f.volumeVal.textContent = `${s.volume}%`;
            this.inst.applySettings();
        });
        if (f.mute) f.mute.addEventListener('click', () => {
            if (!A) return;
            const m = A.toggleHardwareMute();
            f.mute.textContent = m ? 'Unmute' : 'Mute';
            f.mute.classList.toggle('is-on', m);
        });
        if (f.camera) f.camera.addEventListener('change', (e) => {
            s.camera = e.target.checked;
            this.inst.applySettings();
            this.inst.startSensor();
        });
        if (f.choice) f.choice.addEventListener('change', (e) => { s.visitorChoice = e.target.checked; this.inst.applySettings(); });
        if (f.fan) f.fan.addEventListener('change', (e) => { s.fanMode = e.target.checked; this.inst.applySettings(); });
        if (f.pixel) f.pixel.addEventListener('change', (e) => { s.pixelRatio = parseFloat(e.target.value); this.inst.applySettings(); window.dispatchEvent(new Event('resize')); });
        if (f.lock) f.lock.addEventListener('click', () => this.applyLock(!this.locked));
        if (f.fullscreen) f.fullscreen.addEventListener('click', () => this.toggleFullscreen());
        if (f.exportBtn) f.exportBtn.addEventListener('click', () => this.exportReflections());
        if (f.clearBtn) f.clearBtn.addEventListener('click', () => {
            if (confirm('Remove every inscription from this installation?')) {
                this.inst.reflections = [];
                this.inst.saveReflections();
                this.engine.setInscriptions([]);
                this.renderReflections();
            }
        });
    }

    populate() {
        const s = this.inst.settings, f = this.f;
        if (f.duration) f.duration.value = String(s.durationSeconds);
        if (f.idle) f.idle.value = String(s.idleSeconds);
        if (f.tuning) f.tuning.value = s.tuning;
        if (f.bellows) f.bellows.checked = !!s.bellows;
        if (f.pattern) f.pattern.value = s.bellowsPattern;
        if (f.volume) f.volume.value = String(s.volume);
        if (f.volumeVal) f.volumeVal.textContent = `${s.volume}%`;
        if (f.camera) f.camera.checked = !!s.camera;
        if (f.choice) f.choice.checked = !!s.visitorChoice;
        if (f.fan) f.fan.checked = !!s.fanMode;
        if (f.pixel) f.pixel.value = String(s.pixelRatio);
    }

    monitor() {
        const f = this.f;
        setInterval(() => {
            if (!this.open) return;
            if (f.sensorSource) f.sensorSource.textContent = this.sensor.activeSource + (this.sensor.cameraDark ? ' (camera dark)' : '');
            if (f.sensorLevel) f.sensorLevel.style.transform = `scaleX(${this.sensor.motion.toFixed(3)})`;
            if (f.opus) f.opus.textContent = `${stageFor(this.engine.opus).label} · ${(this.engine.opus * 100).toFixed(0)}%`;
        }, 120);
    }

    toggle() { this.open ? this.close() : this.openPanel(); }
    openPanel() {
        if (!this.panel) return;
        this.open = true;
        this.panel.classList.add('is-visible');
        this.panel.setAttribute('aria-hidden', 'false');
        this.renderReflections();
    }
    close() {
        if (!this.panel) return;
        this.open = false;
        this.panel.classList.remove('is-visible');
        this.panel.setAttribute('aria-hidden', 'true');
    }
    togglePlaque() {
        if (!this.plaque) return;
        this.plaqueOpen = !this.plaqueOpen;
        this.plaque.classList.toggle('is-visible', this.plaqueOpen);
        this.plaque.setAttribute('aria-hidden', this.plaqueOpen ? 'false' : 'true');
    }
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            const d = document.documentElement;
            (d.requestFullscreen || d.webkitRequestFullscreen || function () {}).call(d);
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
        }
    }

    applyLock(on) {
        this.locked = on;
        document.body.classList.toggle('kiosk-locked', on);
        if (this.f.lock) {
            this.f.lock.textContent = on ? 'Kiosk lock on' : 'Kiosk lock off';
            this.f.lock.classList.toggle('is-on', on);
        }
    }

    renderReflections() {
        const list = this.f.list;
        if (!list) return;
        list.innerHTML = '';
        const items = this.inst.reflections;
        if (!items.length) {
            list.innerHTML = '<div class="c-empty">No inscriptions yet.</div>';
            return;
        }
        items.forEach((r, i) => {
            const row = document.createElement('div');
            row.className = 'c-row';
            const span = document.createElement('span');
            span.textContent = r.text;
            const del = document.createElement('button');
            del.type = 'button';
            del.textContent = 'remove';
            del.addEventListener('click', () => {
                this.inst.reflections.splice(i, 1);
                this.inst.saveReflections();
                this.engine.setInscriptions(this.inst.reflections.map(x => x.text));
                this.renderReflections();
            });
            row.appendChild(span);
            row.appendChild(del);
            list.appendChild(row);
        });
    }

    exportReflections() {
        const blob = new Blob([JSON.stringify(this.inst.reflections, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `liminal-engine-inscriptions-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/* ==========================================================================
   BOOT
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    const sensor = new StillnessSensor();
    const engine = new LiminalEngine3D(sensor);
    engine.init();
    const installation = new Installation(engine, sensor);
    const curator = new Curator(installation, engine, sensor);

    window.Liminal = { sensor, engine, installation, curator };
    window.AlchemicalEngine = engine; // legacy alias
    window.Curator = curator;
});
