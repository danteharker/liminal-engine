/* ==========================================================================
   THE HERMETIC ENGINE - GRAPHICS & INTERACTION SYSTEM (THREE.JS)
   ========================================================================== */

class AlchemicalEngine3D {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // 3D Objects
        this.engineGroup = null;
        this.coreMesh = null;
        this.rings = [];
        this.particles = null;
        
        // Dynamic Parameters
        this.gravity = 0.0;
        this.speed = 1.0;
        this.ratio = 0.5; // Blends Sol (1.0) and Mercury (0.0)
        this.state = 'zhenren';
        
        // Core displacement vertex variables
        this.corePositions = null;
        this.clock = new THREE.Clock();
        
        // Light sources
        this.shaftLight = null;
        this.coreLight = null;
        
        // Interactive Mouse Drag
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        
        // Secret states
        this.solarFlareActive = false;
        this.stabilized = false;
        this.floatingOffset = 0;
        
        // Touch Ripple Physics & Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.ripple = {
            active: false,
            center: new THREE.Vector3(),
            radius: 0.0,
            maxRadius: 4.5,
            speed: 3.5, // units per second
            intensity: 1.0
        };
        
        // Time-Locked Color schemes
        this.timeLockedColors = null;

        // Phase 2 State Variables
        this.trailParticles = null;
        this.ringCanvases = [];
        this.refractionBeams = null;
        this.gazerMesh = null;
        
        // Calligraphic particle states
        this.glyphActive = false;
        this.glyphTimer = 0.0;
        this.glyphBlend = 0.0;
        this.glyphTargetPoints = null; // Float32Array
        this.glyphHoldDuration = 3.5;
        this.glyphTransitionDuration = 1.2;
        this.lastGlyphTime = 0.0;
        this.beams = [];

        // Phase 3 State Variables
        this.mouseActive = false;
        this.mouse3DTarget = new THREE.Vector3();
        this.lastUserInteractionTime = 0.0;
        this.eclipseActive = false;
        this.eclipseIntensity = 0.0;
        
        // Ring revolution trackers for musical wind chimes
        this.ringRotationAccumulators = [0, 0, 0];
        this.ringLastChimeAngles = [0, 0, 0];
        
        // Astrolabe Shadow Play objects
        this.shadowWall = null;
        this.spotLight = null;

        // Phase 4: Celestial Gravity Bridges & Spatial Reach Dynamics
        this.auraReachActive = false;
        this.coreSpringVelocity = { x: 0, y: 0 };
        this.stillnessIndex = 0.0;
        
        // Meditation Mode Parameters
        this.meditationActive = false;
        this.meditationDuration = 180; // default 3 minutes (180s)
        this.meditationSecondsLeft = 0;
        this.holographicFanMode = false;
        this.meditationTimerInterval = null;
        this.whisperCycleInterval = null;
        
        this.alchemicalWhispers = [
            "Settle into the quiet void...",
            "Find the space between your thoughts...",
            "The gold is refined in the silence.",
            "Solve et Coagula: Dissolve the noise, coagulate the focus.",
            "Stillness is the ultimate transmutation.",
            "Receive the light of the cosmos in quietude...",
            "The mind is a mirror, polish it with stillness.",
            "Breathe in union with the Great Work..."
        ];

        // Celestial Bridge components
        this.bridgeLines = [];
        this.bridgeCurves = [];
        this.bridgePoints = null;
        this.bridgeParticlesData = [];
        this.bridgeOpacity = 0.0;

        // Phase 5 Additions
        this.solMesh = null;
        this.lunaMesh = null;
        this.conjunctionActive = false;
        this.conjunctionOrbitAngle = 0.0;
        this.isPhilosophersStone = false;
        this.conjunctionMorph = 0.0;
        
        // V2 Cognitive feedback variables
        this.cognitiveLoad = 100.0;
        this.stillnessDepth = 0.0;
        this.prevMouse = null;
    }

    init() {
        // 1. Setup Scene & Camera
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x07070a, 0.08); // Misty atmospheric fog
        
        const width = this.container.clientWidth || (window.innerWidth - 420);
        const height = this.container.clientHeight || window.innerHeight;
        
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0.0, 0.0, 5.0);
        
        // 2. Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        this.container.appendChild(this.renderer.domElement);


        
        // Main structural group that floats and rotates
        this.engineGroup = new THREE.Group();
        this.engineGroup.position.set(0.0, 0.0, 0.0);
        this.scene.add(this.engineGroup);
        this.camera.lookAt(0.0, 0.0, 0.0);
        
        // Add default breathing class to dashboard
        document.getElementById('alchemy-dashboard').classList.add('heartbeat-zhenren');
        
        // 3. Setup Lights
        this.setupLights();

        
        // 4. Create Engine Elements
        this.createCore();
        this.createRings();
        this.createParticleSystem();
        this.createTrailParticleSystem();
        this.createAlchemicalGazer();
        this.createShadowPlayWall();
        this.createCelestialBridges();
        
        // 5. Initialize Mouse Events
        this.setupEvents();
        
        // 6. Trigger Animation Loop
        this.tick();
    }

    setupLights() {
        // Astrological Time-locking atmospheric setup based on actual system clock hour
        const hour = new Date().getHours();
        let fogColor = 0x07070a;
        let ambientColor = 0x1a1230;
        let shaftColor = 0xffdf80;
        let timeLabel = "MERIDIAN ASTROLABE DAY";
        
        if (hour >= 6 && hour < 12) {
            fogColor = 0x120d08;         // Soft morning amber fog
            ambientColor = 0x241a10;     // Warm terracotta glow
            shaftColor = 0xffc480;       // Warm golden sunrise sunshafts
            timeLabel = "MORNING ASTRAL RISE";
        } else if (hour >= 12 && hour < 18) {
            fogColor = 0x07070a;         // Dusty classic stone
            ambientColor = 0x1a1230;     // Deep laboratory violet-ambient
            shaftColor = 0xfff2cc;       // Pure bright solar beams
            timeLabel = "MERIDIAN ASTROLABE DAY";
        } else if (hour >= 18 && hour < 21) {
            fogColor = 0x140714;         // sunset violet fog
            ambientColor = 0x261026;     // warm copper rose
            shaftColor = 0xff80aa;       // copper rose sunset shafts
            timeLabel = "VESPER COPPER SUNSET";
        } else {
            fogColor = 0x030308;         // Deep starry nocturne
            ambientColor = 0x08081c;     // Midnight velvet blue
            shaftColor = 0x6bb5ff;       // Ethereal silver moonbeams
            timeLabel = "NOC-LUMINOUS SKY PHASE";
        }
        
        this.timeLockedColors = { fogColor, ambientColor, shaftColor };
        
        // Deep ambient laboratory glow
        const ambientLight = new THREE.AmbientLight(ambientColor, 0.55);
        this.scene.add(ambientLight);
        
        // Directional "Dusty Window Shaft" light
        this.shaftLight = new THREE.DirectionalLight(shaftColor, 2.8);
        this.shaftLight.position.set(5, 8, -3);
        this.shaftLight.castShadow = true;
        this.shaftLight.shadow.mapSize.width = 1024;
        this.shaftLight.shadow.mapSize.height = 1024;
        this.shaftLight.shadow.bias = -0.001;
        this.scene.add(this.shaftLight);
        
        // Glowing light radiating outward from the floating alchemical core itself
        this.coreLight = new THREE.PointLight(0xffaa00, 3, 10);
        this.coreLight.position.set(0, 0, 0);
        this.engineGroup.add(this.coreLight);
        
        // Set dynamic time subtitle in UI
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            subtitle.textContent = `SOLVE ET COAGULA • ANNO 1642 • ${timeLabel}`;
        }
    }

    // Procedurally paint cabalistic text and geometry onto an offscreen canvas
    createCabalisticTexture(ringIndex) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        
        // Cache in memory
        this.ringCanvases[ringIndex] = { canvas, ctx, texture };
        
        // Initial drawing of texts & dynamic elements
        this.updateSingleRingTexture(ringIndex, this.state, false);
        
        return texture;
    }

    drawHexagram(ctx, x, y, size, linesArray, color) {
        const lineSpacing = size / 7;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 6; i++) {
            const ly = y + size/2 - (i + 1) * lineSpacing;
            const isYang = linesArray[i] === 1;
            
            if (isYang) {
                ctx.beginPath();
                ctx.moveTo(x - size/2, ly);
                ctx.lineTo(x + size/2, ly);
                ctx.stroke();
            } else {
                const segmentWidth = size * 0.4;
                ctx.beginPath();
                ctx.moveTo(x - size/2, ly);
                ctx.lineTo(x - size/2 + segmentWidth, ly);
                ctx.moveTo(x + size/2 - segmentWidth, ly);
                ctx.lineTo(x + size/2, ly);
                ctx.stroke();
            }
        }
    }

    updateSingleRingTexture(ringIndex, state, isTransitioning) {
        const cached = this.ringCanvases[ringIndex];
        if (!cached) return;
        
        const { canvas, ctx, texture } = cached;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isZhenren = state === 'zhenren';
        const color = isZhenren ? 'rgba(255, 215, 0, 0.95)' : 'rgba(138, 43, 226, 0.95)';
        const glowColor = isZhenren ? 'rgba(255, 215, 0, 0.4)' : 'rgba(138, 43, 226, 0.4)';
        
        // Draw delicate metallic geometric frame lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 22); ctx.lineTo(1024, 22);
        ctx.moveTo(0, 106); ctx.lineTo(1024, 106);
        ctx.stroke();
        
        // Inner dashed lining
        ctx.strokeStyle = isZhenren ? 'rgba(255, 215, 0, 0.35)' : 'rgba(138, 43, 226, 0.35)';
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.moveTo(0, 30); ctx.lineTo(1024, 30);
        ctx.moveTo(0, 98); ctx.lineTo(1024, 98);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Set fonts for Cabala text
        ctx.fillStyle = color;
        ctx.font = '28px "Cinzel Decorative"';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Distinct sacred letters for each nested ring
        const cabalaTexts = [
            ["כֶּתֶר", "🜔", "חָכְמָה", "🜍", "בִּינָה", "🜏", "גְּבוּרָה", "🜚"], // Outer Ring
            ["תִּפְאֶרֶת", "🜁", "נֶצַח", "🜄", "הוֹד", "🜃", "יְסוֹד", "🜓"],  // Middle Ring
            ["מַלְכוּת", "🜏", "שְׁכִינָה", "🜍", "אֵין סוֹף", "🜔", "דַּעַת", "🜚"] // Inner Ring
        ];
        
        const textSet = cabalaTexts[ringIndex] || cabalaTexts[0];
        const count = textSet.length;
        
        for (let i = 0; i < count; i++) {
            const x = (i / count) * canvas.width + (canvas.width / (count * 2));
            ctx.fillText(textSet[i], x, 64);
        }
        
        // I Ching Hexagram stacks to render
        let hexagram1 = [1, 1, 1, 1, 1, 1]; // Qián (The Creative)
        let hexagram2 = [1, 1, 1, 0, 0, 0]; // Tài (Peace)
        
        if (state === 'trickster') {
            hexagram1 = [0, 1, 0, 1, 0, 1]; // Wèijì (Before Completion)
            hexagram2 = [0, 1, 0, 0, 1, 0]; // Kǎn (The Abysmal Water)
        }
        
        if (isTransitioning) {
            hexagram1 = Array.from({length: 6}, () => Math.random() > 0.5 ? 1 : 0);
            hexagram2 = Array.from({length: 6}, () => Math.random() > 0.5 ? 1 : 0);
        }
        
        const gapCoords = [128, 384, 640, 896];
        gapCoords.forEach((x, idx) => {
            const activeHex = idx % 2 === 0 ? hexagram1 : hexagram2;
            this.drawHexagram(ctx, x, 64, 42, activeHex, color);
        });
        
        ctx.shadowBlur = 0;
        texture.needsUpdate = true;
    }

    updateAllRingTextures(isTransitioning = false) {
        for (let i = 0; i < 3; i++) {
            this.updateSingleRingTexture(i, this.state, isTransitioning);
        }
    }


    createCore() {
        // High fidelity subdivided sphere to allow fluid morphing vertex animations
        const geometry = new THREE.IcosahedronGeometry(0.7, 5);
        
        // Store original vertices for procedural displacement wave computations
        this.corePositions = geometry.attributes.position.clone();
        
        // Highly physical, reflective material simulating fluid gold & mercury
        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.08,
            envMapIntensity: 1.5,
            wireframe: false
        });
        
        this.coreMesh = new THREE.Mesh(geometry, material);
        this.coreMesh.castShadow = true;
        this.coreMesh.receiveShadow = true;
        this.engineGroup.add(this.coreMesh);

        // Phase 5 Dual Orbit Sol and Luna drops
        const subGeom = new THREE.IcosahedronGeometry(0.35, 4);
        
        const solMat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 1.5
        });
        this.solMesh = new THREE.Mesh(subGeom, solMat);
        this.solMesh.castShadow = true;
        this.solMesh.visible = false;
        this.engineGroup.add(this.solMesh);
        
        const lunaMat = new THREE.MeshStandardMaterial({
            color: 0xdde6ee,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 1.5
        });
        this.lunaMesh = new THREE.Mesh(subGeom, lunaMat);
        this.lunaMesh.castShadow = true;
        this.lunaMesh.visible = false;
        this.engineGroup.add(this.lunaMesh);
    }

    createRings() {
        const ringDimensions = [
            { radius: 1.6, tube: 0.08, segment: 48 }, // Outer Ring
            { radius: 1.2, tube: 0.07, segment: 48 }, // Middle Ring
            { radius: 0.85, tube: 0.06, segment: 48 } // Inner Ring
        ];
        
        ringDimensions.forEach((dim, index) => {
            const geom = new THREE.TorusGeometry(dim.radius, dim.tube, 16, dim.segment);
            
            // Build procedural canvas texture containing the cabalistic etchings
            const textTexture = this.createCabalisticTexture(index);
            
            const mat = new THREE.MeshStandardMaterial({
                color: 0xcbb76a,
                metalness: 0.95,
                roughness: 0.18,
                bumpMap: textTexture,
                bumpScale: 0.005,
                emissiveMap: textTexture,
                emissive: 0xff8c00,
                emissiveIntensity: 0.4
            });
            
            const mesh = new THREE.Mesh(geom, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Rotate rings in different initial angles
            if (index === 0) mesh.rotation.x = Math.PI / 2;
            if (index === 1) mesh.rotation.y = Math.PI / 4;
            if (index === 2) mesh.rotation.z = Math.PI / 6;
            
            this.engineGroup.add(mesh);
            this.rings.push({
                mesh: mesh,
                speedX: 0.3 * (index + 1),
                speedY: 0.2 * (3 - index),
                speedZ: 0.15 * (index + 0.5),
                // Lissajous frequency ratios for nested mechanical astrolabe orbits
                freqX: [1.5, 2.5, 3.5][index],
                freqY: [1.0, 2.0, 3.0][index],
                phaseOffset: index * Math.PI / 4
            });
        });
    }

    createParticleSystem() {
        const count = 4000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < count; i++) {
            // Positioned initially in a sphere radiating around the alchemical engine
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 0.5 + Math.random() * 2.5;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Radially outward initial velocity vector
            velocities[i * 3] = positions[i * 3] * 0.15;
            velocities[i * 3 + 1] = positions[i * 3 + 1] * 0.15;
            velocities[i * 3 + 2] = positions[i * 3 + 2] * 0.15;
            
            // Initial color blend
            color.setHex(0xffaa00); // Warm amber gold
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = 1.0 + Math.random() * 3.0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Procedurally draw a beautiful circular soft particle glow texture
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 16;
        pCanvas.height = 16;
        const pCtx = pCanvas.getContext('2d');
        const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 16, 16);
        const pTex = new THREE.CanvasTexture(pCanvas);
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: pTex
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.userData = { velocities: velocities, count: count };
        this.engineGroup.add(this.particles);
    }

    createTrailParticleSystem() {
        const count = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = -9999;
            
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 16;
        pCanvas.height = 16;
        const pCtx = pCanvas.getContext('2d');
        const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 16, 16);
        const pTex = new THREE.CanvasTexture(pCanvas);
        
        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: pTex
        });
        
        this.trailParticles = new THREE.Points(geometry, material);
        
        const velocities = new Float32Array(count * 3);
        const lifetimes = new Float32Array(count);
        const maxLifetimes = new Float32Array(count);
        const initialColors = [];
        
        for (let i = 0; i < count; i++) {
            lifetimes[i] = 9999;
            maxLifetimes[i] = 1.8 + Math.random() * 0.8;
            initialColors.push(new THREE.Color(0xffd700));
        }
        
        this.trailParticles.userData = {
            velocities: velocities,
            lifetimes: lifetimes,
            maxLifetimes: maxLifetimes,
            initialColors: initialColors,
            count: count,
            currentIndex: 0
        };
        
        this.scene.add(this.trailParticles);
    }

    createAlchemicalGazer() {
        // Gazer base stand, ring support, and mirror lens have been removed to eliminate distraction.
        this.gazerMesh = new THREE.Group(); // Keep group reference to avoid breaking empty references

        // Volumetric refraction beams group - centered on the quicksilver core
        this.refractionBeams = new THREE.Group();
        this.refractionBeams.position.set(0, 0, 0);
        this.engineGroup.add(this.refractionBeams);

        const beamVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const beamFragmentShader = `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uOpacity;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            // Fractional noise function to generate organic, wispy flowing smoke texture
            float getVolumetricNoise(vec2 uv, float time) {
                float n1 = sin(uv.y * 6.0 - time * 0.7) * cos(uv.x * 5.0 + time * 0.4);
                float n2 = sin(uv.y * 14.0 + time * 1.3) * cos(uv.x * 10.0 - time * 0.8) * 0.5;
                float n3 = sin(uv.y * 28.0 - time * 2.0) * cos(uv.x * 20.0 + time * 1.5) * 0.25;
                return (n1 + n2 + n3 + 1.75) / 3.5;
            }

            void main() {
                // 1. Vertical fade-out: soft smooth step at both ends of the cylinder
                float verticalFade = sin(vUv.y * 3.14159265);
                verticalFade = pow(verticalFade, 1.2); // make center slightly wider

                // 2. Radial fade-out silhouette edge smoothing (Fresnel look)
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float fresnel = dot(normal, viewDir);
                float edgeFade = clamp(1.0 - abs(fresnel), 0.0, 1.0);
                edgeFade = pow(edgeFade, 2.0); // Make edges softer

                // 3. Volumetric dynamic smoke noise
                float noise = getVolumetricNoise(vUv * vec2(1.5, 1.0), uTime);
                
                // 4. Combine and scale alpha
                float alpha = uOpacity * verticalFade * edgeFade * (0.35 + 0.65 * noise);
                
                // 5. Add dynamic color highlights in high-density regions
                vec3 finalColor = uColor * (1.0 + 0.3 * noise);

                gl_FragColor = vec4(finalColor, alpha);
            }
        `;

        // Create 3-4 individual refracting color shafts
        const colors = [0xff00ff, 0x00ffff, 0xffff00, 0x7b00ff];
        this.beams = [];
        
        colors.forEach((colorHex, idx) => {
            // Create a parent group for the symmetric double-cone beam
            const beamGroup = new THREE.Group();
            
            const beamMat = new THREE.ShaderMaterial({
                vertexShader: beamVertexShader,
                fragmentShader: beamFragmentShader,
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color(colorHex) },
                    uOpacity: { value: 0.0 }
                },
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            // Upper cylinder half: thin at top (0.05), thick at bottom (0.4)
            const upperGeom = new THREE.CylinderGeometry(0.05, 0.4, 3.0, 16, 1, true);
            upperGeom.translate(0, 1.5, 0);
            const upperMesh = new THREE.Mesh(upperGeom, beamMat);
            beamGroup.add(upperMesh);
            
            // Lower cylinder half: thick at top (0.4), thin at bottom (0.05)
            const lowerGeom = new THREE.CylinderGeometry(0.4, 0.05, 3.0, 16, 1, true);
            lowerGeom.translate(0, -1.5, 0);
            const lowerMesh = new THREE.Mesh(lowerGeom, beamMat);
            beamGroup.add(lowerMesh);
            
            // Slight initial tilt offsets
            beamGroup.rotation.x = (Math.random() - 0.5) * 0.15;
            beamGroup.rotation.z = (Math.random() - 0.5) * 0.15;
            
            this.refractionBeams.add(beamGroup);
            this.beams.push({
                mesh: beamGroup,
                material: beamMat, // Store material directly for safe opacity animations
                baseOpacity: 0.04 + (idx * 0.015), // Soft, mystical base opacity
                speedX: 0.3 * (idx + 1),
                speedZ: 0.25 * (4 - idx),
                angleOffset: idx * (Math.PI / 2)
            });
        });
    }

    createShadowPlayWall() {
        const geom = new THREE.PlaneGeometry(30, 20);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x060609, // Dark charcoal obsidian stone
            roughness: 0.95,
            metalness: 0.05,
            side: THREE.DoubleSide
        });
        this.shadowWall = new THREE.Mesh(geom, mat);
        this.shadowWall.position.set(0, 0, -3.2); // Just behind the engine and refraction beams
        this.shadowWall.receiveShadow = true;
        this.scene.add(this.shadowWall);
        
        // Spotlight for Casting Concentric Ring Shadows
        this.spotLight = new THREE.SpotLight(0xffdf80, 0.0, 35, Math.PI / 4, 0.5, 1.0);
        this.spotLight.position.set(0, 5, 5);
        this.spotLight.target = this.engineGroup;
        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 2048;
        this.spotLight.shadow.mapSize.height = 2048;
        this.spotLight.shadow.camera.near = 0.5;
        this.spotLight.shadow.camera.far = 25;
        this.spotLight.shadow.bias = -0.0005;
        this.scene.add(this.spotLight);
    }

    createCelestialBridges() {
        const corners = [
            new THREE.Vector3(-4.0, 2.5, -0.8),  // Top Left
            new THREE.Vector3(4.0, 2.5, -0.8),   // Top Right
            new THREE.Vector3(-4.0, -2.5, -0.8), // Bottom Left
            new THREE.Vector3(4.0, -2.5, -0.8)   // Bottom Right
        ];
        
        this.bridgeLines = [];
        this.bridgeCurves = [];
        
        const material = new THREE.LineBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            linewidth: 2.0
        });
        
        corners.forEach((corner) => {
            const points = [];
            points.push(corner.clone());
            // Midpoint control point that sags down elegantly
            points.push(new THREE.Vector3().addVectors(corner, new THREE.Vector3(0,0,0)).multiplyScalar(0.5).add(new THREE.Vector3(0, -0.5, 0)));
            points.push(new THREE.Vector3(0, 0, 0));
            
            const curve = new THREE.CatmullRomCurve3(points);
            const curvePoints = curve.getPoints(50);
            const geom = new THREE.BufferGeometry().setFromPoints(curvePoints);
            const line = new THREE.Line(geom, material.clone());
            
            this.scene.add(line);
            this.bridgeLines.push(line);
            this.bridgeCurves.push(curve);
        });
        
        // Flowing bridge stardust particles
        const pCount = 150;
        const pGeom = new THREE.BufferGeometry();
        const pPositions = new Float32Array(pCount * 3);
        const pColors = new Float32Array(pCount * 3);
        
        this.bridgeParticlesData = [];
        const color = new THREE.Color(0xffd700);
        
        for (let i = 0; i < pCount; i++) {
            const curveIdx = i % 4;
            const progress = Math.random();
            const curve = this.bridgeCurves[curveIdx];
            const point = curve.getPointAt(progress);
            
            pPositions[i * 3] = point.x;
            pPositions[i * 3 + 1] = point.y;
            pPositions[i * 3 + 2] = point.z;
            
            pColors[i * 3] = color.r;
            pColors[i * 3 + 1] = color.g;
            pColors[i * 3 + 2] = color.b;
            
            this.bridgeParticlesData.push({
                curveIdx: curveIdx,
                progress: progress,
                speed: 0.06 + Math.random() * 0.12
            });
        }
        
        pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
        
        // Circular soft particle glow texture
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 16;
        pCanvas.height = 16;
        const pCtx = pCanvas.getContext('2d');
        const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 16, 16);
        const pTex = new THREE.CanvasTexture(pCanvas);
        
        const pMat = new THREE.PointsMaterial({
            size: 0.06,
            vertexColors: true,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: pTex
        });
        
        this.bridgePoints = new THREE.Points(pGeom, pMat);
        this.scene.add(this.bridgePoints);
    }

    // Note: initWebcamCommune and processWebcamFrame were excised to establish a zero-camera footprint.

    startMeditationTimer(durationSeconds) {
        if (durationSeconds && typeof durationSeconds === 'number') {
            this.meditationDuration = durationSeconds;
        }
        this.startMeditation();
    }

    endMeditationSession(success = true) {
        this.completeMeditation(success);
    }

    startMeditation() {
        this.meditationActive = true;
        this.meditationSecondsLeft = this.meditationDuration;
        
        const startBtn = document.getElementById('meditation-start');
        if (startBtn) startBtn.innerHTML = '<span class="go-symbol">🜎</span><span class="go-text">GO</span>';
        
        // Hide top-right floating resonance button during meditation
        const floatToggle = document.getElementById('floating-audio-toggle');
        if (floatToggle) floatToggle.style.display = 'none';
        
        // Auto-collapse sidebar
        const dashboard = document.getElementById('alchemy-dashboard');
        const canvasContainer = document.getElementById('canvas-container');
        const dustOverlay = document.querySelector('.dust-overlay');
        
        if (dashboard) dashboard.classList.add('collapsed');
        if (canvasContainer) canvasContainer.classList.add('full-width');
        if (dustOverlay) dustOverlay.classList.add('full-width');
        
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
        
        // Show meditation overlay & timer display
        const medOverlay = document.getElementById('meditation-overlay');
        const medTimerDisplay = document.getElementById('meditation-timer-display');
        if (medOverlay) medOverlay.classList.remove('meditation-overlay-hidden');
        if (medTimerDisplay) medTimerDisplay.classList.remove('timer-display-hidden');
        
        // Activate Audio Meditation Mode
        if (window.AlchemicalAudio) {
            window.AlchemicalAudio.setMeditationVolumeState(true);
        }
        
        // Physical inactivity stillness begins now. Settle into the quicksilver mirror.
        this.lastUserInteractionTime = this.clock.getElapsedTime();
        
        // Reset progress ring
        const progressRing = document.querySelector('.ring-progress');
        if (progressRing) {
            progressRing.style.strokeDashoffset = 0;
        }
        
        // Set initial timer text
        this.updateMeditationTimerText();
        
        // Interval for seconds countdown
        this.meditationTimerInterval = setInterval(() => {
            this.meditationSecondsLeft--;
            this.updateMeditationTimerText();
            
            // Update progress ring
            const ratio = this.meditationSecondsLeft / this.meditationDuration;
            if (progressRing) {
                progressRing.style.strokeDashoffset = 163.4 - (ratio * 163.4);
            }
            
            if (this.meditationSecondsLeft <= 0) {
                this.completeMeditation(true);
            }
        }, 1000);
        
        // Inscribe a serene visual 'watch' cue which slowly fades away
        const whisperEl = document.getElementById('meditation-whisper');
        if (whisperEl) {
            whisperEl.textContent = 'watch';
            whisperEl.style.animation = 'none';
            whisperEl.style.opacity = '1.0';
            whisperEl.style.transition = 'opacity 1.5s ease-in-out';
            whisperEl.style.display = '';
            
            // Gracefully fade the cue to complete visual silent stillness
            setTimeout(() => {
                if (this.meditationActive) {
                    whisperEl.style.opacity = '0.0';
                    setTimeout(() => {
                        if (this.meditationActive) {
                            whisperEl.style.display = 'none';
                        }
                    }, 1500);
                }
            }, 2500);
        }
        
        this.whisperCycleInterval = null;
    }
    
    updateMeditationTimerText() {
        const mins = Math.floor(this.meditationSecondsLeft / 60);
        const secs = this.meditationSecondsLeft % 60;
        const text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const timerCountdown = document.getElementById('timer-countdown');
        if (timerCountdown) timerCountdown.textContent = text;
    }
    
    completeMeditation(success = false) {
        // Clear intervals
        if (this.meditationTimerInterval) {
            clearInterval(this.meditationTimerInterval);
            this.meditationTimerInterval = null;
        }
        if (this.whisperCycleInterval) {
            clearInterval(this.whisperCycleInterval);
            this.whisperCycleInterval = null;
        }
        
        this.meditationActive = false;
        
        const startBtn = document.getElementById('meditation-start');
        if (startBtn) startBtn.innerHTML = '<span class="go-symbol">🜎</span><span class="go-text">GO</span>';
        
        // Restore whisper elements to default
        const whisperEl = document.getElementById('meditation-whisper');
        if (whisperEl) {
            whisperEl.style.display = '';
            whisperEl.style.animation = '';
            whisperEl.style.opacity = '';
            whisperEl.style.transition = '';
            whisperEl.textContent = 'Still your hand. Still your mind. Let the quicksilver mirror settle...';
        }
        
        // Hide overlays and reset timer display HUD state
        const medOverlay = document.getElementById('meditation-overlay');
        const medTimerDisplay = document.getElementById('meditation-timer-display');
        if (medOverlay) medOverlay.classList.add('meditation-overlay-hidden');
        if (medTimerDisplay) {
            medTimerDisplay.classList.add('timer-display-hidden');
            medTimerDisplay.classList.remove('hud-hidden');
        }
        
        const timerVisBtn = document.getElementById('timer-visibility-btn');
        if (timerVisBtn) {
            timerVisBtn.textContent = 'HIDE';
            timerVisBtn.classList.remove('active');
        }
        
        // If completed successfully
        if (success) {
            if (window.AlchemicalAudio) {
                window.AlchemicalAudio.playCallbackChimeSequence(); // Gentle triple Solfeggio callback triad & choir swell
            }
            
            // Display gentle awakening return prompt on screen
            const whisperEl = document.getElementById('meditation-whisper');
            const medOverlay = document.getElementById('meditation-overlay');
            if (medOverlay && whisperEl) {
                medOverlay.classList.remove('meditation-overlay-hidden');
                whisperEl.style.display = 'block';
                whisperEl.style.opacity = '1.0';
                whisperEl.textContent = '🜔 Take a gentle deep breath... Feel your presence... Welcome back.';
            }

            // Warm golden sunrise fog sweep
            if (this.scene && this.scene.fog) {
                this.scene.fog.color.setHex(0x3a2504); // Warm gold twilight sunrise
            }

            // Give the visitor 3.8 seconds to gently open eyes and re-orient before opening reflection screen
            setTimeout(() => {
                if (medOverlay) medOverlay.classList.add('meditation-overlay-hidden');
                
                if (this.scene && this.scene.fog) {
                    const fogColor = this.timeLockedColors ? this.timeLockedColors.fogColor : 0x07070a;
                    this.scene.fog.color.setHex(fogColor);
                }

                const surveyOverlay = document.getElementById('survey-overlay');
                if (surveyOverlay) {
                    surveyOverlay.classList.remove('survey-overlay-hidden');
                    const input = document.getElementById('survey-reflection-input');
                    if (input) setTimeout(() => input.focus(), 800);
                } else {
                    this.finalizeMeditationCleanup();
                }

                if (window.TabletWizard) {
                    window.TabletWizard.onImmersionComplete();
                }
            }, 3800);
        } else {
            // Cancelled early, immediately restore everything
            this.finalizeMeditationCleanup();
        }
    }
    
    finalizeMeditationCleanup() {
        // Restore sidebar
        const dashboard = document.getElementById('alchemy-dashboard');
        const canvasContainer = document.getElementById('canvas-container');
        const dustOverlay = document.querySelector('.dust-overlay');
        
        if (dashboard) dashboard.classList.remove('collapsed');
        if (canvasContainer) canvasContainer.classList.remove('full-width');
        if (dustOverlay) dustOverlay.classList.remove('full-width');
        
        // Restore top-right floating resonance button display
        const floatToggle = document.getElementById('floating-audio-toggle');
        if (floatToggle) floatToggle.style.display = 'flex';
        
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
        
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
        
        // Reset Audio
        if (window.AlchemicalAudio) {
            window.AlchemicalAudio.setMeditationVolumeState(false);
        }
    }

    toggleHolographicFanMode() {
        this.holographicFanMode = !this.holographicFanMode;
        
        const body = document.body;
        const toast = document.getElementById('rune-toast');
        
        if (this.holographicFanMode) {
            body.classList.add('holographic-fan-mode');
            if (toast) {
                toast.textContent = "🜏 HOLOGRAPHIC FAN MODE: ACTIVE 🜏";
                toast.className = 'toast-visible';
                setTimeout(() => {
                    if (toast.className === 'toast-visible' && this.holographicFanMode) {
                        toast.className = 'toast-hidden';
                    }
                }, 3500);
            }
            
            // Auto-collapse sidebar and enter quiet state
            const dashboard = document.getElementById('alchemy-dashboard');
            if (dashboard) dashboard.classList.add('collapsed');
            
            // Force WebGL clear colors to pitch black
            if (this.renderer) this.renderer.setClearColor(0x000000);
            if (this.scene) {
                this.scene.fog.color.setHex(0x000000);
                this.scene.fog.density = 0.03; // Thinner fog for raw contrast
            }
        } else {
            body.classList.remove('holographic-fan-mode');
            if (toast) {
                toast.textContent = "🜎 STANDARD EXHIBITION MODE ACTIVE 🜎";
                toast.className = 'toast-visible';
                setTimeout(() => {
                    if (toast.className === 'toast-visible' && !this.holographicFanMode) {
                        toast.className = 'toast-hidden';
                    }
                }, 3500);
            }
            
            // Restore dashboard
            const dashboard = document.getElementById('alchemy-dashboard');
            if (dashboard) dashboard.classList.remove('collapsed');
            
            // Restore normal Three.js clear colors
            const fogColor = this.timeLockedColors ? this.timeLockedColors.fogColor : 0x07070a;
            if (this.renderer) this.renderer.setClearColor(this.state === 'zhenren' ? fogColor : 0x0c0418);
            if (this.scene) {
                this.scene.fog.color.setHex(this.state === 'zhenren' ? fogColor : 0x0c0418);
                this.scene.fog.density = 0.08;
            }
        }
        
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }
    
    recordCanvasLoop(durationSeconds = 15) {
        const canvas = document.querySelector('#canvas-container canvas');
        if (!canvas) return;
        
        console.log("Initializing alchemical canvas recording stream...");
        const stream = canvas.captureStream(60); // 60fps
        
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
        }
        
        const recorder = new MediaRecorder(stream, options);
        const chunks = [];
        
        recorder.ondataavailable = e => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `alchemical_liminal_hologram_${Date.now()}.webm`;
            a.click();
            console.log("Alchemical hologram capture completed successfully!");
            
            const toast = document.getElementById('rune-toast');
            if (toast) {
                toast.textContent = "🜎 HOLOGRAM RECORDING COMPLETE 🜎";
                toast.className = 'toast-visible';
                setTimeout(() => {
                    if (toast.className === 'toast-visible') {
                        toast.className = 'toast-hidden';
                    }
                }, 3000);
            }
        };
        
        // Trigger visual toast
        const toast = document.getElementById('rune-toast');
        if (toast) {
            toast.textContent = "🜶 CAPTURING 60FPS HOLOGRAM VIDEO...";
            toast.className = 'toast-visible';
            setTimeout(() => {
                if (toast.className === 'toast-visible' && recorder.state === 'recording') {
                    toast.className = 'toast-hidden';
                }
            }, 3000);
        }
        
        recorder.start();
        setTimeout(() => {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
        }, durationSeconds * 1000);
    }

    applyNeuralPreset(presetName) {
        let gravity = 0;
        let speed = 1.0;
        let ratio = 50;
        let cognitiveState = 'zhenren';
        let solfeggio = '432';
        let rhythmicLayer = false;
        let rhythmStyle = 'shamanic';
        let chimeStyle = 'gold';
        let presetTitle = '';
        
        switch (presetName) {
            case 'descent':
                gravity = 0.75;
                speed = 0.4;
                ratio = 80;
                cognitiveState = 'zhenren';
                solfeggio = '396';
                rhythmicLayer = true;
                rhythmStyle = 'dreamwalk';
                chimeStyle = 'gold';
                presetTitle = "THE DEEP DESCENT";
                break;
            case 'dissolution':
                gravity = -0.85;
                speed = 1.0;
                ratio = 100;
                cognitiveState = 'zhenren';
                solfeggio = '741';
                rhythmicLayer = false;
                rhythmStyle = 'shamanic';
                chimeStyle = 'silver';
                presetTitle = "EGO DISSOLUTION";
                break;
            case 'gateway':
                gravity = 0.00;
                speed = 2.2;
                ratio = 50;
                cognitiveState = 'zhenren';
                solfeggio = '852';
                rhythmicLayer = true;
                rhythmStyle = 'thetajourney';
                chimeStyle = 'gold';
                presetTitle = "THETA GATEWAY";
                break;
            case 'drift':
                gravity = 0.30;
                speed = 3.5;
                ratio = 25;
                cognitiveState = 'trickster';
                solfeggio = '639';
                rhythmicLayer = true;
                rhythmStyle = 'tranceflow';
                chimeStyle = 'silver';
                presetTitle = "COGNITIVE DRIFT";
                break;
        }
        
        // 1. Play soft transition bell chime
        if (window.AlchemicalAudio) {
            window.AlchemicalAudio.playChime(chimeStyle);
        }
        
        // 2. Animate and apply sliders
        const gravitySlider = document.getElementById('gravity-slider');
        const speedSlider = document.getElementById('speed-slider');
        const ratioSlider = document.getElementById('ratio-slider');
        
        if (gravitySlider) {
            gravitySlider.value = gravity;
            const event = new Event('input', { bubbles: true });
            gravitySlider.dispatchEvent(event);
        }
        
        if (speedSlider) {
            speedSlider.value = speed;
            const event = new Event('input', { bubbles: true });
            speedSlider.dispatchEvent(event);
        }
        
        if (ratioSlider) {
            ratioSlider.value = ratio;
            const event = new Event('input', { bubbles: true });
            ratioSlider.dispatchEvent(event);
        }
        
        // 3. Apply Cognitive State
        const stateBtn = document.getElementById(`state-${cognitiveState}`);
        if (stateBtn) {
            stateBtn.click();
        }
        
        // 4. Apply Sacred Tuning (Solfeggio)
        const solfeggioBtn = document.getElementById(`solf-${solfeggio}`);
        if (solfeggioBtn) {
            solfeggioBtn.click();
        }
        
        // 5. Apply Rhythmic Layer and Style
        const rhythmicToggle = document.getElementById('drumming-toggle');
        if (rhythmicToggle) {
            rhythmicToggle.checked = rhythmicLayer;
            const event = new Event('change', { bubbles: true });
            rhythmicToggle.dispatchEvent(event);
        }
        
        const rhythmBtn = document.querySelector(`.drumming-pattern-btn[data-pattern="${rhythmStyle}"]`);
        if (rhythmBtn) {
            rhythmBtn.click();
        }
        
        // 6. Trigger gold transition toast
        const toast = document.getElementById('rune-toast');
        if (toast) {
            toast.textContent = `🜎 PATHWAY EVOKED: ${presetTitle}`;
            toast.className = 'toast-visible';
            setTimeout(() => {
                toast.className = 'toast-hidden';
            }, 3500);
        }
    }

    generateGlyphPoints(symbol) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 128, 128);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '96px "Outfit", "Cinzel Decorative", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 64, 64);
        
        const imgData = ctx.getImageData(0, 0, 128, 128);
        const data = imgData.data;
        const points = [];
        
        for (let y = 0; y < 128; y += 2) {
            for (let x = 0; x < 128; x += 2) {
                const idx = (y * 128 + x) * 4;
                const r = data[idx];
                if (r > 128) {
                    // Map to -1.8 to 1.8 spatial coordinates
                    const px = ((x / 128) - 0.5) * 3.6;
                    const py = (0.5 - (y / 128)) * 3.6;
                    const pz = (Math.random() - 0.5) * 0.25;
                    points.push(new THREE.Vector3(px, py, pz));
                }
            }
        }
        
        if (points.length === 0) {
            for (let i = 0; i < 100; i++) {
                points.push(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0));
            }
        }
        
        return points;
    }

    triggerGlyphMorph(symbol) {
        this.glyphTargetPoints = this.generateGlyphPoints(symbol);
        this.glyphActive = true;
        this.glyphTimer = 0.0;
        this.glyphBlend = 0.0;
    }

    setupEvents() {
        // Drag events to rotate engine manually
        this.container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.container.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaMove = {
                x: e.clientX - this.previousMousePosition.x,
                y: e.clientY - this.previousMousePosition.y
            };
            
            // Rotate the core and rings relative to drag motion
            this.engineGroup.rotation.y += deltaMove.x * 0.005;
            this.engineGroup.rotation.x += deltaMove.y * 0.005;
            
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            
            // Randomly trigger ring chimes when dragging intensely (Trickster style)
            if (Math.abs(deltaMove.x) > 10 && Math.random() < 0.06) {
                window.AlchemicalAudio.playChime('silver');
            }
        });
        
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // Touch Ripple click raycaster on z=0 virtual plane
        this.container.addEventListener('click', (e) => {
            if (e.target !== this.renderer.domElement) return;
            
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            const intersection = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(planeZ, intersection);
            
            if (intersection) {
                // Initialize expanding ripple
                this.ripple.active = true;
                this.ripple.center.copy(intersection);
                this.ripple.radius = 0.0;
                this.ripple.intensity = 1.0;
                
                // Play metallic bell resonance chime
                if (window.AlchemicalAudio) {
                    window.AlchemicalAudio.playChime(Math.random() < 0.5 ? 'silver' : 'gold');
                }
            }
        });
        
        // Window resizing - 100% full screen
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.camera.lookAt(0.0, 0.0, 0.0);
        });

        // Viewport mouse hover events & 3D raycasting coordinates
        this.container.addEventListener('mouseenter', () => {
            this.mouseActive = true;
            this.lastUserInteractionTime = this.clock.getElapsedTime();
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.mouseActive = false;
            this.lastUserInteractionTime = this.clock.getElapsedTime();
        });
        
        this.container.addEventListener('mousemove', (e) => {
            this.lastUserInteractionTime = this.clock.getElapsedTime();
            
            // Track normalized coordinates
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Project mouse position to z=0 virtual plane
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            const intersection = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(planeZ, intersection);
            if (intersection) {
                this.mouse3DTarget.copy(intersection);
            }
        });
        
        // Track keyboard and click inputs globally to monitor meditation physical inactivity
        const resetInactivity = () => {
            this.lastUserInteractionTime = this.clock.getElapsedTime();
        };
        window.addEventListener('keydown', (e) => {
            // Do not trigger keyboard shortcuts if the visitor is typing reflections inside inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            resetInactivity();
            
            // P Key toggles Holographic Projection Fan Mode
            if (e.code === 'KeyP') {
                this.toggleHolographicFanMode();
                return;
            }
            
            // R Key records a high-definition 15s loop of the WebGL canvas
            if (e.code === 'KeyR') {
                this.recordCanvasLoop(15);
                return;
            }
            
            // Sympathetic Keyboard Resonance
            const keyResonance = {
                'KeyA': 396,
                'KeyS': 432,
                'KeyD': 528,
                'KeyF': 639,
                'KeyG': 741,
                'KeyH': 852,
                'KeyJ': 963
            };
            if (keyResonance[e.code]) {
                const freq = keyResonance[e.code];
                if (window.AlchemicalAudio) {
                    window.AlchemicalAudio.playChime(freq);
                }
                
                // Spawn spatial ripple on z=0 plane in sympathy
                this.ripple.active = true;
                this.ripple.center.set(
                    (Math.random() - 0.5) * 4.0,
                    (Math.random() - 0.5) * 3.0,
                    0
                );
                this.ripple.radius = 0.0;
                this.ripple.intensity = 1.0;
                
                // Nudge rings in sympathy
                this.rings.forEach(r => {
                    r.mesh.rotation.x += (Math.random() - 0.5) * 0.15;
                    r.mesh.rotation.y += (Math.random() - 0.5) * 0.15;
                });
            }
        });
        window.addEventListener('click', resetInactivity);
        
        // V2 Survey DOM event listeners
        const surveySubmitBtn = document.getElementById('survey-submit-btn');
        const surveySkipBtn = document.getElementById('survey-skip-btn');
        const surveyOverlay = document.getElementById('survey-overlay');
        const reflectionInput = document.getElementById('survey-reflection-input');
        
        if (surveySubmitBtn && surveyOverlay && reflectionInput) {
            surveySubmitBtn.addEventListener('click', () => {
                const text = reflectionInput.value.trim();
                if (text) {
                    // Log to localStorage database
                    const journal = JSON.parse(localStorage.getItem('liminal_journal') || '[]');
                    const entry = {
                        reflection: text,
                        timestamp: new Date().toISOString(),
                        duration: this.meditationDuration,
                        frequency: (window.AlchemicalAudio && window.AlchemicalAudio.activeSolfeggio) || '432',
                        somaticWeight: this.gravity,
                        thoughtVelocity: this.speed,
                        egoResonance: this.ratio
                    };
                    journal.push(entry);
                    localStorage.setItem('liminal_journal', JSON.stringify(journal));
                    
                    // Trigger a brief gold alchemical toast
                    const toast = document.getElementById('rune-toast');
                    if (toast) {
                        toast.textContent = "REFLECTION INSCRIBED IN THE VOID";
                        toast.className = 'toast-visible';
                        setTimeout(() => {
                            toast.className = 'toast-hidden';
                        }, 3000);
                    }
                }
                
                surveyOverlay.classList.add('survey-overlay-hidden');
                reflectionInput.value = '';
                this.finalizeMeditationCleanup();
            });
        }
        
        if (surveySkipBtn && surveyOverlay && reflectionInput) {
            surveySkipBtn.addEventListener('click', () => {
                surveyOverlay.classList.add('survey-overlay-hidden');
                reflectionInput.value = '';
                this.finalizeMeditationCleanup();
            });
        }
    }

    // Set parameters from UI controls
    setGravity(g) {
        this.gravity = g;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    setRatio(ratio) {
        this.ratio = ratio;
        
        // Blend Core Material Color between Sol (Gold) and Quicksilver (Silver)
        const solColor = new THREE.Color(0xffd700);
        const mercColor = new THREE.Color(0xc2cbd6);
        const finalColor = solColor.clone().lerp(mercColor, ratio);
        
        this.coreMesh.material.color.copy(finalColor);
        this.coreMesh.material.roughness = 0.05 + (ratio * 0.1);
        
        // Blend core light color to match alloy mix
        const lightGold = new THREE.Color(0xffb700);
        const lightQuicksilver = new THREE.Color(0x7ac1eb);
        this.coreLight.color.copy(lightGold.clone().lerp(lightQuicksilver, ratio));

        // Phase 5 Philosopher's Conjunction Check (Exactly 62%)
        if (Math.abs(ratio - 0.62) < 0.005) {
            if (!this.isPhilosophersStone) {
                this.isPhilosophersStone = true;
                
                const descEl = document.getElementById('state-description');
                if (descEl) {
                    descEl.textContent = "THE GRAND CONJUNCTION: Dial set to 62% Golden Ratio. Quicksilver crystallizes into the multi-faceted emerald-ruby Philosopher's Stone.";
                }
                
                if (window.AlchemicalAudio) {
                    window.AlchemicalAudio.playChoirSwell();
                }
                
                const toast = document.getElementById('rune-toast');
                if (toast) {
                    toast.textContent = "🜔 THE GRAND CONJUNCTION 🜔";
                    toast.className = 'toast-visible';
                    setTimeout(() => {
                        toast.className = 'toast-hidden';
                    }, 4000);
                }
            }
        } else {
            this.isPhilosophersStone = false;
        }
    }

    setPhilosophicalState(state) {
        this.state = state;
        
        const descEl = document.getElementById('state-description');
        const dashboard = document.getElementById('alchemy-dashboard');
        
        if (state === 'zhenren') {
            descEl.textContent = "ZHENREN: Harmonic levitation, golden-ratio alignment, and tranquil, breathing ambient drones.";
            
            // Smoothly align rings to peaceful horizontal breathing orbits
            this.stabilized = false;
            this.coreMesh.material.wireframe = false;
            
            // Restore time-locked fog color
            const fogColor = this.timeLockedColors ? this.timeLockedColors.fogColor : 0x07070a;
            this.scene.fog.color.setHex(fogColor);
            this.renderer.setClearColor(fogColor);
            
            // Trigger dynamic heartbeat border animations
            dashboard.classList.add('heartbeat-zhenren');
            dashboard.classList.remove('heartbeat-trickster');
            
            // Adjust ring emissives
            this.rings.forEach(r => r.mesh.material.emissive.setHex(0xff8c00));
        } else {
            descEl.textContent = "TRICKSTER: Turbulent precession, chaotic vector shifts, high entropy, and gritty electric modulations.";
            
            // Deep purple trickster atmospheric space
            const tricksterFogColor = 0x0c0418;
            this.scene.fog.color.setHex(tricksterFogColor);
            this.renderer.setClearColor(tricksterFogColor);
            
            // Trigger dynamic heartbeat border animations
            dashboard.classList.add('heartbeat-trickster');
            dashboard.classList.remove('heartbeat-zhenren');
            
            // Shifting emissive glows
            this.rings.forEach(r => r.mesh.material.emissive.setHex(0x8a2be2));
        }
        
        // Trigger flickering hexagram transitions
        this.updateAllRingTextures(true);
        let flickerCount = 0;
        const flickerInterval = setInterval(() => {
            this.updateAllRingTextures(true);
            flickerCount++;
            if (flickerCount >= 4) {
                clearInterval(flickerInterval);
                this.updateAllRingTextures(false);
            }
        }, 80);
    }

    // Inscribe a cabala rune and trigger its visual event
    inscribeRune(rune) {
        const toast = document.getElementById('rune-toast');
        toast.textContent = `🜏 RUNE ACTIVATED: ${rune} 🜏`;
        toast.className = 'toast-visible';
        
        setTimeout(() => {
            toast.className = 'toast-hidden';
        }, 3000);
        
        // Execute rune actions
        if (rune === 'HOLOFAN') {
            this.toggleHolographicFanMode();
            return;
        }
        
        if (rune === 'KETHER') {
            this.triggerGlyphMorph('🜍');
            this.lastGlyphTime = this.clock.getElapsedTime();
            
            // Solar core flare! Particles explode outwards
            this.solarFlareActive = true;
            this.coreLight.intensity = 15;
            this.coreLight.color.setHex(0xfff3a1);
            
            // Play gold bell sound
            window.AlchemicalAudio.playChime('gold');
            
            // Rings spin wildly
            this.rings.forEach(r => {
                r.mesh.material.emissiveIntensity = 3.5;
            });
            
            setTimeout(() => {
                this.solarFlareActive = false;
                this.coreLight.intensity = 3;
                this.setRatio(this.ratio); // Reset color
                this.rings.forEach(r => {
                    r.mesh.material.emissiveIntensity = 0.4;
                });
            }, 3000);
            
        } else if (rune === 'YESOD') {
            this.triggerGlyphMorph('🜔');
            this.lastGlyphTime = this.clock.getElapsedTime();
            
            // Anchor. Perfect levitation zero-G state, completely stable
            this.stabilized = true;
            this.setGravity(0);
            document.getElementById('gravity-slider').value = 0;
            document.getElementById('gravity-val').textContent = '0.00 G';
            window.AlchemicalAudio.setGravity(0);
            window.AlchemicalAudio.playChime('silver');
            
        } else if (rune === 'ZIRAN') {
            this.triggerGlyphMorph('气');
            this.lastGlyphTime = this.clock.getElapsedTime();
            
            // Phase 5 Resets
            this.conjunctionActive = false;
            this.solMesh.visible = false;
            this.lunaMesh.visible = false;
            this.isPhilosophersStone = false;
            this.conjunctionMorph = 0.0;
            
            // Organic alignment, resets properties to equilibrium
            this.stabilized = false;
            this.setGravity(0);
            document.getElementById('gravity-slider').value = 0;
            document.getElementById('gravity-val').textContent = '0.00 G';
            this.setSpeed(1.0);
            document.getElementById('speed-slider').value = 1.0;
            document.getElementById('speed-val').textContent = '1.0x';
            
            window.AlchemicalAudio.setGravity(0);
            window.AlchemicalAudio.setSpeed(1.0);
            this.setPhilosophicalState('zhenren');
            
            // Click state buttons back
            document.getElementById('state-zhenren').classList.add('active');
            document.getElementById('state-trickster').classList.remove('active');
            
            window.AlchemicalAudio.playChime('gold');
            
        } else if (rune === 'LEVITATE') {
            this.triggerGlyphMorph('🜏');
            this.lastGlyphTime = this.clock.getElapsedTime();
            
            // Zero gravity, launches core vertically into floating loops
            this.setGravity(0);
            document.getElementById('gravity-slider').value = 0;
            document.getElementById('gravity-val').textContent = '0.00 G';
            window.AlchemicalAudio.setGravity(0);
            window.AlchemicalAudio.playChime('silver');
            
        } else if (rune === 'CHAOS') {
            this.triggerGlyphMorph('☯');
            this.lastGlyphTime = this.clock.getElapsedTime();
            
            // Unleash trickster mode with max speeds and detunings
            this.setSpeed(4.0);
            document.getElementById('speed-slider').value = 4.0;
            document.getElementById('speed-val').textContent = '4.0x';
            window.AlchemicalAudio.setSpeed(4.0);
            
            this.setPhilosophicalState('trickster');
            
            document.getElementById('state-zhenren').classList.remove('active');
            document.getElementById('state-trickster').classList.add('active');
            
            window.AlchemicalAudio.playChime('silver');
            
            // Randomize ring orientations
            this.rings.forEach(r => {
                r.mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            });
        } else if (rune === 'ECLIPSE') {
            this.triggerGlyphMorph('🜏');
            this.lastGlyphTime = this.clock.getElapsedTime();
            
            this.eclipseActive = true;
            
            // Toggle UI active styling class
            const dashboard = document.getElementById('alchemy-dashboard');
            dashboard.classList.add('eclipse-active');
            
            // Update audio engine to muffled deep harmonics
            if (window.AlchemicalAudio) {
                window.AlchemicalAudio.setEclipseAudioMode(true);
            }
            
            // Set stats values for absolute cosmic eclipse
            document.getElementById('gravity-slider').value = -0.6;
            document.getElementById('gravity-val').textContent = '-0.60 G (Singularity)';
            
            // Auto restore environment after 12 seconds
            setTimeout(() => {
                this.eclipseActive = false;
                dashboard.classList.remove('eclipse-active');
                
                if (window.AlchemicalAudio) {
                    window.AlchemicalAudio.setEclipseAudioMode(false);
                }
                
                // Restore dashboard state styling and slider ticks
                const currentG = parseFloat(document.getElementById('gravity-slider').value);
                this.setGravity(currentG);
                window.AlchemicalAudio.setGravity(currentG);
                this.setPhilosophicalState(this.state);
            }, 12000);
        } else if (rune === 'CONJUNCTIO') {
            this.triggerGlyphMorph('🜍');
            this.lastGlyphTime = this.clock.getElapsedTime();
            
            this.conjunctionActive = true;
            this.conjunctionOrbitAngle = 0.0;
            this.solMesh.visible = true;
            this.lunaMesh.visible = true;
            
            if (window.AlchemicalAudio) {
                window.AlchemicalAudio.playChime('gold');
            }
        }
    }

    // Main 60FPS animation updates
    tick() {
        requestAnimationFrame(() => this.tick());
        
        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();
        
        // Physical inactivity stillness tracking
        if (this.meditationActive) {
            const timeSinceInteraction = time - this.lastUserInteractionTime;
            if (timeSinceInteraction > 1.2) {
                this.stillnessIndex = THREE.MathUtils.lerp(this.stillnessIndex, 1.0, 0.08);
            } else {
                this.stillnessIndex = 0.0; // Instantly disrupt on interaction
            }
        } else {
            this.stillnessIndex = THREE.MathUtils.lerp(this.stillnessIndex, 0.0, 0.1);
        }

        // V2 Dynamic Readouts updates
        if (!this.prevMouse) {
            this.prevMouse = new THREE.Vector2(this.mouse.x, this.mouse.y);
        }
        const mouseDelta = this.mouse.distanceTo(this.prevMouse);
        this.prevMouse.copy(this.mouse);
        
        // If mouse is active (hovering container) or user recently interacted, calculate velocity factor
        const interactionDelta = time - this.lastUserInteractionTime;
        const isInteracting = interactionDelta < 0.2 || mouseDelta > 0.001;
        
        if (isInteracting) {
            // Spikes cognitive load based on mouse delta, capped at 100%
            this.cognitiveLoad = Math.min(100.0, this.cognitiveLoad + mouseDelta * 600 + 1.5);
            // Drop stillness depth
            this.stillnessDepth = Math.max(0.0, this.stillnessDepth - mouseDelta * 800 - 2.0);
        } else {
            // Decay cognitive load back to 0%
            this.cognitiveLoad = THREE.MathUtils.lerp(this.cognitiveLoad, 0.0, 0.015);
            // Climb stillness depth back to 100%
            this.stillnessDepth = THREE.MathUtils.lerp(this.stillnessDepth, 100.0, 0.02);
        }
        
        // Update readouts DOM elements
        const weightReadout = document.getElementById('weight-readout');
        const entropyReadout = document.getElementById('entropy-readout');
        const mercuryReadout = document.getElementById('mercury-readout');
        
        if (weightReadout) {
            weightReadout.innerHTML = `${Math.round(this.cognitiveLoad)} <span class="unit">%</span>`;
        }
        
        if (mercuryReadout) {
            mercuryReadout.innerHTML = `${Math.round(this.stillnessDepth)} <span class="unit">%</span>`;
        }
        
        // Dynamic Brainwave frequency sync LFO display
        const activeFreq = (window.AlchemicalAudio && window.AlchemicalAudio.activeSolfeggio) || '432';
        const freqMap = {
            '432': 7.83,
            '528': 10.0,
            '396': 4.0,
            '639': 12.0,
            '741': 6.0,
            '852': 2.0
        };
        const baseBrainFreq = freqMap[activeFreq] || 7.83;
        const brainFreq = baseBrainFreq + Math.sin(time * 1.5) * 0.03;
        
        if (entropyReadout) {
            entropyReadout.innerHTML = `${brainFreq.toFixed(2)} <span class="unit">Hz</span>`;
        }



        // Spring physical drift following mouse hover is disabled.
        // The core remains perfectly, hypnotically centered at (0, 0, 0).
        this.coreMesh.position.set(0, 0, 0);
        this.coreSpringVelocity.x = 0;
        this.coreSpringVelocity.y = 0;
        
        // Continuous audio modulation by mouse hover is disabled.
        // Frequencies and volumes are set statically/dynamically driven exclusively by dashboard controls.
        if (window.AlchemicalAudio) {
            window.AlchemicalAudio.setAuraReachProximity(0.0);
            window.AlchemicalAudio.setCommuneModulation(0.5);
        }

        // Update Celestial Energy Bridges & flowing stardust
        const corners = [
            new THREE.Vector3(-4.0, 2.5, -0.8),  // Top Left
            new THREE.Vector3(4.0, 2.5, -0.8),   // Top Right
            new THREE.Vector3(-4.0, -2.5, -0.8), // Bottom Left
            new THREE.Vector3(4.0, -2.5, -0.8)   // Bottom Right
        ];
        
        this.bridgeCurves.forEach((curve, idx) => {
            const corner = corners[idx];
            const targetPos = (this.conjunctionActive) ? 
                (idx % 2 === 0 ? this.solMesh.position : this.lunaMesh.position) : 
                this.coreMesh.position;
                
            curve.points[0].copy(corner);
            
            // Calculate a beautiful twisted/spiral double helix control midpoint
            const mid = new THREE.Vector3().addVectors(corner, targetPos).multiplyScalar(0.5);
            if (this.conjunctionActive) {
                const twistStrength = 0.45;
                const twistAngle = time * 2.0 + idx * Math.PI / 2;
                mid.x += Math.cos(twistAngle) * twistStrength;
                mid.y += Math.sin(twistAngle) * twistStrength;
            } else {
                mid.add(new THREE.Vector3(0, -0.5, 0));
            }
            
            curve.points[1].copy(mid);
            curve.points[2].copy(targetPos);
            
            const curvePoints = curve.getPoints(50);
            this.bridgeLines[idx].geometry.setFromPoints(curvePoints);
        });
        
        const targetBBridgeOpacity = this.mouseActive ? 0.72 : 0.0;
        this.bridgeOpacity = THREE.MathUtils.lerp(this.bridgeOpacity, targetBBridgeOpacity, 0.08);
        
        this.bridgeLines.forEach((line) => {
            line.material.opacity = this.bridgeOpacity;
        });
        if (this.bridgePoints) {
            this.bridgePoints.material.opacity = this.bridgeOpacity;
            
            const bpPositions = this.bridgePoints.geometry.attributes.position.array;
            this.bridgeParticlesData.forEach((part, i) => {
                part.progress += part.speed * delta;
                if (part.progress > 1.0) {
                    part.progress = 0.0;
                    part.speed = 0.06 + Math.random() * 0.12;
                }
                const curve = this.bridgeCurves[part.curveIdx];
                const point = curve.getPointAt(part.progress);
                bpPositions[i * 3] = point.x;
                bpPositions[i * 3 + 1] = point.y;
                bpPositions[i * 3 + 2] = point.z;
            });
            this.bridgePoints.geometry.attributes.position.needsUpdate = true;
        }
        
        // Smoothly interpolate Eclipse state transitions
        const targetEclipseInt = this.eclipseActive ? 1.0 : 0.0;
        this.eclipseIntensity = THREE.MathUtils.lerp(this.eclipseIntensity, targetEclipseInt, 0.05);
        
        if (this.eclipseIntensity > 0.01) {
            const normalFogColor = this.timeLockedColors ? this.timeLockedColors.fogColor : 0x07070a;
            const eclipseFogColor = 0x000000;
            const currentFogColor = new THREE.Color(normalFogColor).lerp(new THREE.Color(eclipseFogColor), this.eclipseIntensity);
            
            this.scene.fog.color.copy(currentFogColor);
            this.renderer.setClearColor(currentFogColor);
            
            const normalFogDensity = 0.08;
            const eclipseFogDensity = 0.15;
            this.scene.fog.density = THREE.MathUtils.lerp(normalFogDensity, eclipseFogDensity, this.eclipseIntensity);
            
            const normalShaftIntensity = 2.8;
            this.shaftLight.intensity = THREE.MathUtils.lerp(normalShaftIntensity, 0.0, this.eclipseIntensity);
            
            this.spotLight.intensity = THREE.MathUtils.lerp(0.0, 12.0, this.eclipseIntensity);
            
            // Transform liquid core to black singularity
            const solColor = new THREE.Color(0xffd700);
            const mercColor = new THREE.Color(0xc2cbd6);
            const normalCoreColor = solColor.clone().lerp(mercColor, this.ratio);
            const obsidianColor = new THREE.Color(0x020204);
            const currentCoreColor = normalCoreColor.clone().lerp(obsidianColor, this.eclipseIntensity);
            
            this.coreMesh.material.color.copy(currentCoreColor);
            this.coreMesh.material.roughness = THREE.MathUtils.lerp(0.05 + (this.ratio * 0.1), 0.02, this.eclipseIntensity);
            this.coreMesh.material.metalness = THREE.MathUtils.lerp(1.0, 0.98, this.eclipseIntensity);
            
            // Resize points material size for visual coronal flare amplification
            this.particles.material.size = THREE.MathUtils.lerp(0.05, 0.08, this.eclipseIntensity);
        } else {
            // Restore default colors
            const fogColor = this.timeLockedColors ? this.timeLockedColors.fogColor : 0x07070a;
            this.scene.fog.color.setHex(this.state === 'zhenren' ? fogColor : 0x0c0418);
            this.renderer.setClearColor(this.state === 'zhenren' ? fogColor : 0x0c0418);
            this.scene.fog.density = 0.08;
            this.shaftLight.intensity = 2.8;
            this.spotLight.intensity = 0.0;
            this.setRatio(this.ratio); // Reset color
            this.particles.material.size = 0.05;
        }
        
        // Force absolute pitch black environment settings when outputting to a Holographic Fan
        if (this.holographicFanMode) {
            this.scene.fog.color.setHex(0x000000);
            this.renderer.setClearColor(0x000000);
            this.scene.fog.density = 0.03; // Thinner fog for raw particle contrast
            this.shaftLight.intensity = 0.0; // Hide ambient light shafts
            this.spotLight.intensity = 0.0;
        }
        
        // Update roughness and golden transmutation in meditation stillness mode
        if (this.meditationActive || this.stillnessDepth > 20) {
            const stillnessRatio = this.meditationActive ? this.stillnessIndex : (this.stillnessDepth / 100.0);
            const medRoughness = THREE.MathUtils.lerp(0.08, 0.005, stillnessRatio);
            this.coreMesh.material.roughness = medRoughness;
            
            // Transmute towards pure reflective liquid gold as stillness reaches peak
            if (this.coreMesh.material && !this.eclipseActive && this.conjunctionMorph < 0.05) {
                const pureGold = new THREE.Color(0xffd700);
                this.coreMesh.material.color.lerp(pureGold, stillnessRatio * 0.03);
            }
        }
        
        // Periodic ambient calligraphic scrolls (every 35 seconds)
        if (!this.lastGlyphTime) this.lastGlyphTime = 0.0;
        if (!this.glyphActive && (time - this.lastGlyphTime > 35.0)) {
            const glyphs = ['☯', '气', '🜔', '🜍', '🜏'];
            const randomGlyph = glyphs[Math.floor(Math.random() * glyphs.length)];
            this.triggerGlyphMorph(randomGlyph);
            this.lastGlyphTime = time;
        }
        
        // Update Calligraphic Morph transition states
        if (this.glyphActive) {
            this.glyphTimer += delta;
            
            const transitionIn = this.glyphTransitionDuration; // 1.2s
            const hold = this.glyphHoldDuration; // 3.5s
            const transitionOut = this.glyphTransitionDuration; // 1.2s
            const totalDuration = transitionIn + hold + transitionOut;
            
            if (this.glyphTimer < transitionIn) {
                // Morphing in
                this.glyphBlend = this.glyphTimer / transitionIn;
                this.glyphBlend = this.glyphBlend * this.glyphBlend * (3 - 2 * this.glyphBlend); // ease cubic
            } else if (this.glyphTimer < transitionIn + hold) {
                // Holding
                this.glyphBlend = 1.0;
            } else if (this.glyphTimer < totalDuration) {
                // Morphing out
                const outTime = this.glyphTimer - transitionIn - hold;
                this.glyphBlend = 1.0 - (outTime / transitionOut);
                this.glyphBlend = this.glyphBlend * this.glyphBlend * (3 - 2 * this.glyphBlend); // ease cubic
            } else {
                // Finished
                this.glyphActive = false;
                this.glyphBlend = 0.0;
            }
        }
        
        // Update Touch Ripple physics state
        if (this.ripple.active) {
            this.ripple.radius += delta * this.ripple.speed;
            this.ripple.intensity = Math.max(0.0, 1.0 - (this.ripple.radius / this.ripple.maxRadius));
            
            if (this.ripple.radius >= this.ripple.maxRadius) {
                this.ripple.active = false;
            }
        }
        
        // 1. Core Morphing (Liquid Metal Simulation)
        const geometry = this.coreMesh.geometry;
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Volatility of fluid core is driven by the speed control
        const speedFactor = this.speed * 1.5;
        const morphIntensity = this.state === 'trickster' ? 0.08 : 0.03;
        
        // Stillness factor: damp morphing waves by (1.0 - stillnessIndex)
        const stillnessFactor = 1.0 - this.stillnessIndex;
        
        // Lerp Philosopher's morph
        const targetMorph = this.isPhilosophersStone ? 1.0 : 0.0;
        this.conjunctionMorph = THREE.MathUtils.lerp(this.conjunctionMorph, targetMorph, 0.05);
        
        // Calculate direction vector to the cursor target for tendril projection
        let dirToCursor = new THREE.Vector3(0, 0, 0);
        let distToCursor = 0;
        if (this.mouseActive) {
            dirToCursor = new THREE.Vector3(this.mouse3DTarget.x - this.coreMesh.position.x, this.mouse3DTarget.y - this.coreMesh.position.y, 0).normalize();
            distToCursor = this.coreMesh.position.distanceTo(this.mouse3DTarget);
        }
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(this.corePositions, i);
            
            // Philosopher's stone octahedral crystallization projection
            const sumAbs = Math.abs(vertex.x) + Math.abs(vertex.y) + Math.abs(vertex.z);
            const scale = 0.7 / (sumAbs || 0.001);
            const octaX = vertex.x * scale;
            const octaY = vertex.y * scale;
            const octaZ = vertex.z * scale;
            
            vertex.x = THREE.MathUtils.lerp(vertex.x, octaX, this.conjunctionMorph);
            vertex.y = THREE.MathUtils.lerp(vertex.y, octaY, this.conjunctionMorph);
            vertex.z = THREE.MathUtils.lerp(vertex.z, octaZ, this.conjunctionMorph);
            
            // Calculate a wave displacement across normal vectors using trigonometric functions
            const wave = Math.sin(vertex.x * 6 + time * speedFactor) * 
                         Math.cos(vertex.y * 6 + time * speedFactor) * 
                         Math.sin(vertex.z * 6 + time * speedFactor);
                         
            let displacement = wave * morphIntensity * stillnessFactor;
            
            // Spatial mouse hover core warping is disabled for hypnotic still-gaze
                         
            vertex.addScaledVector(vertex.clone().normalize(), displacement);
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        positionAttribute.needsUpdate = true;
        
        // Heartbeat visual calculations (sync with 60 bpm Zhenren or 95 bpm Trickster)
        const heartRate = this.state === 'zhenren' ? 1.0 : 1.58;
        const heartCycle = time * Math.PI * 2 * heartRate;
        
        // The lub-dub double heartbeat scale pulse
        const pulse = 1.0 + (Math.max(0, Math.sin(heartCycle)) * 0.04) + 
                            (Math.max(0, Math.sin(heartCycle + Math.PI*0.3)) * 0.02);
                            
        // Deep golden-ratio breathing pulse
        const breathPulse = 1.0 + Math.sin(time * 0.785) * 0.06;
        const finalPulse = THREE.MathUtils.lerp(pulse, breathPulse, this.stillnessIndex);
        
        this.coreMesh.scale.set(finalPulse, finalPulse, finalPulse);
        
        // Blend materials for the Philosopher's stone conjunction
        if (this.conjunctionMorph > 0.01) {
            const baseColor = this.coreMesh.material.color.clone();
            const crimsonColor = new THREE.Color(0xd90429); // Rich crimson ruby red
            this.coreMesh.material.color.copy(baseColor.lerp(crimsonColor, this.conjunctionMorph));
            
            const emeraldEmissive = new THREE.Color(0x06d6a0); // Glowing emerald green
            const originalEmissive = new THREE.Color(0x000000);
            this.coreMesh.material.emissive.copy(originalEmissive.lerp(emeraldEmissive, this.conjunctionMorph));
            this.coreMesh.material.emissiveIntensity = this.conjunctionMorph * 1.8;
        } else {
            this.coreMesh.material.emissive.setHex(0x000000);
            this.coreMesh.material.emissiveIntensity = 0.0;
        }
        
        // Pulse core light intensity in sync with heartbeat
        const baseIntensity = this.state === 'zhenren' ? 2.5 : 4.0;
        const heartbeatLight = baseIntensity + (Math.max(0, Math.sin(heartCycle)) * 2.5);
        this.coreLight.intensity = THREE.MathUtils.lerp(heartbeatLight, heartbeatLight * (1.0 + this.conjunctionMorph * 1.5), this.conjunctionMorph);
        
        if (this.conjunctionMorph > 0.01) {
            this.coreLight.color.lerp(new THREE.Color(0x06d6a0), this.conjunctionMorph);
        }
        
        // Pulse ring emissives in sync with heartbeat
        this.rings.forEach(r => {
            r.mesh.material.emissiveIntensity = 0.35 + (Math.max(0, Math.sin(heartCycle)) * 0.4);
        });

        // 2. Bobbing floating animation when levitated (Gravity <= 0)
        if (this.gravity <= 0) {
            this.floatingOffset = Math.sin(time * 0.8) * 0.06;
            this.engineGroup.position.y = this.floatingOffset;
        } else {
            // Pulled down slowly by positive gravity
            this.engineGroup.position.y = -Math.min(this.gravity * 0.25, 0.4);
        }
        
        // 3. Ring Rotation Updates
        this.rings.forEach((r, idx) => {
            if (r.prevZRotation === undefined) {
                r.prevZRotation = r.mesh.rotation.z;
            }
            const oldZ = r.mesh.rotation.z;
            
            if (this.stabilized) {
                // Yesod stabilizing: pull rings slowly back to flat, neat alignments
                r.mesh.rotation.x = THREE.MathUtils.lerp(r.mesh.rotation.x, Math.PI / 2, 0.05);
                r.mesh.rotation.y = THREE.MathUtils.lerp(r.mesh.rotation.y, 0, 0.05);
                r.mesh.rotation.z += 0.005 * this.speed;
            } else if (this.state === 'zhenren') {
                // Zhenren: Elegant Lissajous precessions creating sacred geometric orbits
                const tScaled = time * 0.4 * this.speed;
                r.mesh.rotation.x = Math.sin(tScaled * r.freqX + r.phaseOffset) * 0.5 + (Math.PI / 2);
                r.mesh.rotation.y = Math.cos(tScaled * r.freqY + r.phaseOffset) * 0.5;
                r.mesh.rotation.z += 0.005 * this.speed;
            } else {
                // Trickster: multi-axis precession, slight erratic wiggles and wobbles
                const shake = Math.sin(time * 2 + idx) * 0.002;
                r.mesh.rotation.x += (r.speedX * 0.02 * this.speed) + shake;
                r.mesh.rotation.y += (r.speedY * 0.02 * this.speed) - shake;
                r.mesh.rotation.z += (r.speedZ * 0.02 * this.speed);
            }
            
            // Concentric Parallax Wobbles
            r.mesh.position.z = Math.sin(time * 0.5 + idx * Math.PI) * 0.15;
            
            // Astrolabe wind chimes: Accumulate rotation
            const deltaRot = Math.abs(r.mesh.rotation.z - r.prevZRotation);
            r.prevZRotation = r.mesh.rotation.z;
            
            this.ringRotationAccumulators[idx] += deltaRot;
            const currentThresholds = Math.floor(this.ringRotationAccumulators[idx] / (Math.PI / 2));
            if (currentThresholds > this.ringLastChimeAngles[idx]) {
                this.ringLastChimeAngles[idx] = currentThresholds;
                if (window.AlchemicalAudio && window.AlchemicalAudio.isActive) {
                    const solfeggioConfig = window.AlchemicalAudio.solfeggioFrequencies[window.AlchemicalAudio.activeSolfeggio];
                    if (solfeggioConfig) {
                        const chimeFreq = solfeggioConfig.chime;
                        let targetNote = chimeFreq;
                        
                        // Map each ring to a harmonic of the active Solfeggio scale:
                        // Outer Ring (idx=0) = Sub-octave (0.5x frequency)
                        // Middle Ring (idx=1) = Fundamental (1.0x frequency)
                        // Inner Ring (idx=2) = Fifth Harmonic (1.5x frequency)
                        if (idx === 0) targetNote *= 0.5;
                        if (idx === 2) targetNote *= 1.5;
                        
                        // Add a slight random detuning / humanized deviation
                        targetNote *= (0.99 + Math.random() * 0.02);
                        
                        window.AlchemicalAudio.playChime(targetNote);
                    }
                }
            }
        });
        
        // Constant gentle rotation of the core itself
        this.coreMesh.rotation.y += 0.005 * this.speed;
        this.coreMesh.rotation.x += 0.002 * this.speed;
        
        // 4. Vapor Trail (Particle System) Physics
        const pPositions = this.particles.geometry.attributes.position.array;
        const pColors = this.particles.geometry.attributes.color.array; // Keep color buffer aligned
        const v = this.particles.userData.velocities;
        
        // Shift particle color based on state
        const pColorAttr = this.particles.geometry.attributes.color;
        const targetColor = new THREE.Color();
        
        // Static color parameters defined outside loop to prevent Garbage Collection stutters
        const cWhite = new THREE.Color(0xffffff);
        const cSolarOrange = new THREE.Color(0xff8c00);
        const cGold = new THREE.Color(0xffd700);
        const cAmber = new THREE.Color(0xff9f1c);
        const cEmerald = new THREE.Color(0x06d6a0);
        const cViolet = new THREE.Color(0x8a2be2);
        const cPurple = new THREE.Color(0x2e0854);
        const cCyan = new THREE.Color(0x00f5ff);
        
        for (let i = 0; i < this.particles.userData.count; i++) {
            // Extract vectors
            const px = pPositions[i * 3];
            const py = pPositions[i * 3 + 1];
            const pz = pPositions[i * 3 + 2];
            const distance = Math.sqrt(px*px + py*py + pz*pz);
            
            // Dynamic acceleration factors
            // Gravity directly shapes vector forces
            let accY = -this.gravity * 0.004; // Gravity pulls particles down
            let accX = 0;
            let accZ = 0;
            
            if (this.gravity === 0) {
                // Perfect zero-G: Particles float outward in slow, elegant spheres
                accX = px * 0.0001;
                accY = py * 0.0001 + 0.0005; // Light thermal rise
                accZ = pz * 0.0001;
            } else if (this.gravity < 0) {
                // Anti-gravity: Accelerate particles upwards
                accY = Math.abs(this.gravity) * 0.008;
            }
            
            // Phase 5 Charybdis Vortex centripetal & tangential physics
            const deltaSec = delta * 60;
            v[i * 3] += (-py * 0.0075 - px * 0.002) * deltaSec;
            v[i * 3 + 1] += (px * 0.0075 - py * 0.002) * deltaSec;
            v[i * 3 + 2] += (Math.sin(time * 0.5 + px) * 0.001 - pz * 0.002) * deltaSec;
            
            // Add state-specific turbulence
            if (this.state === 'trickster') {
                // High entropy: Brownian movement/turbulent wiggles
                accX += (Math.random() - 0.5) * 0.006;
                accY += (Math.random() - 0.5) * 0.006;
                accZ += (Math.random() - 0.5) * 0.006;
            } else {
                // Zhenren: Smooth sine sweeps
                accX += Math.sin(time + px) * 0.0002;
                accZ += Math.cos(time + pz) * 0.0002;
            }
            
            // Mouse cursor spatial push physics for particles
            if (this.mouseActive) {
                const targetX = this.mouse3DTarget.x;
                const targetY = this.mouse3DTarget.y;
                const hdx = px - targetX;
                const hdy = py - targetY;
                const hdz = pz - 0.5;
                const distToCursor = Math.sqrt(hdx*hdx + hdy*hdy + hdz*hdz);
                
                if (distToCursor < 2.0) {
                    const pushForce = (1.0 - distToCursor / 2.0) * 0.18;
                    v[i * 3] += (hdx / (distToCursor || 1.0)) * pushForce;
                    v[i * 3 + 1] += (hdy / (distToCursor || 1.0)) * pushForce;
                    v[i * 3 + 2] += (hdz / (distToCursor || 1.0)) * pushForce;
                }
            }
            
            // Eclipse singularity gravity well pull
            if (this.eclipseActive) {
                const pullStrength = 0.06;
                accX -= (px / (distance || 1.0)) * pullStrength;
                accY -= (py / (distance || 1.0)) * pullStrength;
                accZ -= (pz / (distance || 1.0)) * pullStrength;
                
                // Outward high frequency solar coronal flares
                if (Math.random() < 0.15) {
                    v[i * 3] += (px / (distance || 1.0)) * 0.08;
                    v[i * 3 + 1] += (py / (distance || 1.0)) * 0.08;
                    v[i * 3 + 2] += (pz / (distance || 1.0)) * 0.08;
                }
            }
            
            // Apply Touch Ripple Deflection Forces
            if (this.ripple.active) {
                const dx = px - this.ripple.center.x;
                const dy = py - this.ripple.center.y;
                const dz = pz - this.ripple.center.z;
                const distToRipple = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                const thickness = 0.35; // Width of the shockwave ring
                const diff = Math.abs(distToRipple - this.ripple.radius);
                
                if (diff < thickness) {
                    // Deflect outward from expanding ripple center
                    const forceFactor = (1.0 - (diff / thickness)) * this.ripple.intensity * 0.12;
                    v[i * 3] += (dx / (distToRipple || 1.0)) * forceFactor;
                    v[i * 3 + 1] += (dy / (distToRipple || 1.0)) * forceFactor;
                    v[i * 3 + 2] += (dz / (distToRipple || 1.0)) * forceFactor;
                }
            }
            
            // Solar flare explosion! Forces particles violently outward
            if (this.solarFlareActive) {
                v[i * 3] *= 1.25;
                v[i * 3 + 1] *= 1.25;
                v[i * 3 + 2] *= 1.25;
            }
            
            // Apply velocity to position
            let nextX = pPositions[i * 3] + v[i * 3];
            let nextY = pPositions[i * 3 + 1] + v[i * 3 + 1] + accY;
            let nextZ = pPositions[i * 3 + 2] + v[i * 3 + 2];
            
            // Drag friction to keep velocities bounded
            v[i * 3] *= 0.98;
            v[i * 3 + 1] *= 0.98;
            v[i * 3 + 2] *= 0.98;
            
            // Respawn particles once they wander too far or pool excessively
            const nextDistance = Math.sqrt(nextX * nextX + nextY * nextY + nextZ * nextZ);
            
            const isOutOfLimits = nextDistance > 4.5 || nextDistance < 0.35 || (this.gravity > 0 && nextY < -2.5);
            
            if (isOutOfLimits || this.solarFlareActive && Math.random() < 0.05) {
                // Respawn at outer boundary 3.5 - 4.5
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const radius = 3.5 + Math.random() * 1.0;
                
                nextX = radius * Math.sin(phi) * Math.cos(theta);
                nextY = radius * Math.sin(phi) * Math.sin(theta);
                nextZ = radius * Math.cos(phi);
                
                // Spiral velocity injection
                v[i * 3] = (-nextY * 0.02 - nextX * 0.005);
                v[i * 3 + 1] = (nextX * 0.02 - nextY * 0.005);
                v[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
            }
            
            // Calligraphic Scroll morphing interpolation
            if (this.glyphBlend > 0.0 && this.glyphTargetPoints) {
                const targetIdx = i % this.glyphTargetPoints.length;
                const target = this.glyphTargetPoints[targetIdx];
                
                // Breath and float effect for target points to make it dynamic
                const breathe = Math.sin(time * 2.0 + target.x * 2.0) * 0.05;
                const tx = target.x + breathe * 0.3;
                const ty = target.y + breathe;
                const tz = target.z;
                
                nextX = THREE.MathUtils.lerp(nextX, tx, this.glyphBlend);
                nextY = THREE.MathUtils.lerp(nextY, ty, this.glyphBlend);
                nextZ = THREE.MathUtils.lerp(nextZ, tz, this.glyphBlend);
                
                // Dampen velocities while in glyph form
                v[i * 3] *= (1.0 - this.glyphBlend);
                v[i * 3 + 1] *= (1.0 - this.glyphBlend);
                v[i * 3 + 2] *= (1.0 - this.glyphBlend);
            }
            
            pPositions[i * 3] = nextX;
            pPositions[i * 3 + 1] = nextY;
            pPositions[i * 3 + 2] = nextZ;
            
            // Blend colors smoothly inside particle attribute based on distance
            const t = Math.min(1.0, Math.max(0.0, (nextDistance - 0.3) / 3.8));
            
            if (this.solarFlareActive) {
                targetColor.copy(cWhite).lerp(cSolarOrange, t);
            } else if (this.eclipseActive) {
                // White-hot solar coronal particles: glowing pure white / bright orange
                targetColor.setRGB(1.0, 1.0, 1.0);
                if (nextDistance > 0.8) {
                    const tCoronal = Math.min(1.0, (nextDistance - 0.8) / 3.0);
                    targetColor.lerp(new THREE.Color(0xff8c00), tCoronal);
                }
            } else if (this.state === 'zhenren') {
                // Beautiful peaceful transition: Gold -> Amber -> Emerald Green
                if (t < 0.5) {
                    targetColor.copy(cGold).lerp(cAmber, t * 2.0);
                } else {
                    targetColor.copy(cAmber).lerp(cEmerald, (t - 0.5) * 2.0);
                }
            } else {
                // Electric chaotic transition: Violet -> Deep Purple -> Neon Cyan
                if (t < 0.5) {
                    targetColor.copy(cViolet).lerp(cPurple, t * 2.0);
                } else {
                    targetColor.copy(cPurple).lerp(cCyan, (t - 0.5) * 2.0);
                }
            }
            
            pColorAttr.setXYZ(i, targetColor.r, targetColor.g, targetColor.b);
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        pColorAttr.needsUpdate = true;
        
        // 4b. Incense Trail Spawning & Physics
        if (this.trailParticles) {
            const trailData = this.trailParticles.userData;
            const tPositions = this.trailParticles.geometry.attributes.position.array;
            const tColors = this.trailParticles.geometry.attributes.color.array;
            const tColorAttr = this.trailParticles.geometry.attributes.color;
            const tPosAttr = this.trailParticles.geometry.attributes.position;
            
            const isZhenren = this.state === 'zhenren';
            const goldColor = new THREE.Color(0xffd700);
            const violetColor = new THREE.Color(0x9b51e0);
            const activeColor = isZhenren ? goldColor : violetColor;
            
            // Spawn new trail particles along ring perimeters
            this.rings.forEach((ring, ringIdx) => {
                ring.mesh.updateMatrixWorld(true);
                const radius = ring.mesh.geometry.parameters.radius;
                
                // Spawn from dual opposite nodes of each rotating torus
                const angles = [time * 2.5, time * 2.5 + Math.PI];
                
                angles.forEach((angleOffset) => {
                    const localPos = new THREE.Vector3(
                        Math.cos(angleOffset) * radius,
                        Math.sin(angleOffset) * radius,
                        0
                    );
                    localPos.applyMatrix4(ring.mesh.matrixWorld);
                    
                    const idx = trailData.currentIndex;
                    
                    tPositions[idx * 3] = localPos.x;
                    tPositions[idx * 3 + 1] = localPos.y;
                    tPositions[idx * 3 + 2] = localPos.z;
                    
                    // Upward thermal rise initial velocity
                    trailData.velocities[idx * 3] = (Math.random() - 0.5) * 0.03 * this.speed;
                    trailData.velocities[idx * 3 + 1] = 0.01 + Math.random() * 0.02; 
                    trailData.velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.03 * this.speed;
                    
                    trailData.lifetimes[idx] = 0.0;
                    
                    const c = activeColor.clone().addScalar((Math.random() - 0.5) * 0.1);
                    trailData.initialColors[idx].copy(c);
                    
                    tColors[idx * 3] = c.r;
                    tColors[idx * 3 + 1] = c.g;
                    tColors[idx * 3 + 2] = c.b;
                    
                    trailData.currentIndex = (trailData.currentIndex + 1) % trailData.count;
                });
            });
            
            // Update and drift existing trail particles
            const baseRise = isZhenren ? 0.012 : 0.022;
            for (let i = 0; i < trailData.count; i++) {
                if (trailData.lifetimes[i] < trailData.maxLifetimes[i]) {
                    trailData.lifetimes[i] += delta;
                    
                    tPositions[i * 3] += trailData.velocities[i * 3];
                    tPositions[i * 3 + 1] += trailData.velocities[i * 3 + 1] + baseRise * delta * 60;
                    tPositions[i * 3 + 2] += trailData.velocities[i * 3 + 2];
                    
                    // Brownian thermal noise
                    trailData.velocities[i * 3] += (Math.random() - 0.5) * 0.001 * this.speed;
                    trailData.velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.001 * this.speed;
                    
                    // Friction damping
                    trailData.velocities[i * 3] *= 0.96;
                    trailData.velocities[i * 3 + 2] *= 0.96;
                    
                    const lifeRatio = trailData.lifetimes[i] / trailData.maxLifetimes[i];
                    const fade = Math.max(0.0, 1.0 - lifeRatio);
                    
                    tColors[i * 3] = trailData.initialColors[i].r * fade;
                    tColors[i * 3 + 1] = trailData.initialColors[i].g * fade;
                    tColors[i * 3 + 2] = trailData.initialColors[i].b * fade;
                } else {
                    tPositions[i * 3 + 2] = -9999; // Retract to background
                }
            }
            
            tPosAttr.needsUpdate = true;
            tColorAttr.needsUpdate = true;
        }
        
        // 4c. Volumetric Optical Mirror Beams Sweep
        if (this.beams && this.refractionBeams) {
            const isZhenren = this.state === 'zhenren';
            
            this.beams.forEach((beam, idx) => {
                const dir = idx % 2 === 0 ? 1 : -1;
                const angle = (time * 1.2 * this.speed * dir) + (idx * Math.PI / 2);
                
                // Opposite orbital sweeps wrapping the core at radius 0.35
                beam.mesh.position.x = Math.cos(angle) * 0.35;
                beam.mesh.position.z = Math.sin(angle) * 0.35;
                beam.mesh.position.y = 0.0;
                
                // Twist and tilt inward
                beam.mesh.rotation.y = angle * dir;
                beam.mesh.rotation.x = Math.sin(angle * 1.5) * 0.15 * dir;
                beam.mesh.rotation.z = Math.cos(angle * 1.5) * 0.15 * dir;
                
                let targetOpacity = beam.baseOpacity;
                if (!isZhenren) {
                    targetOpacity *= 1.4 + Math.sin(time * 7.5 + beam.angleOffset) * 0.45;
                }
                
                // Update custom volumetric shader uniforms
                if (beam.material.uniforms) {
                    beam.material.uniforms.uTime.value = time;
                    beam.material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
                        beam.material.uniforms.uOpacity.value,
                        targetOpacity,
                        0.05
                    );
                    beam.material.opacity = beam.material.uniforms.uOpacity.value; // sync for safety
                } else {
                    beam.material.opacity = THREE.MathUtils.lerp(
                        beam.material.opacity,
                        targetOpacity,
                        0.05
                    );
                }
            });
        }

        // Phase 5 Sol & Luna Dual Orbit Update
        if (this.conjunctionActive) {
            this.coreMesh.visible = false;
            
            this.conjunctionOrbitAngle += delta * 1.5 * this.speed;
            
            // Orbit Sol and Luna around each other on the y-axis
            const orbitRadius = 0.85;
            this.solMesh.position.set(
                Math.cos(this.conjunctionOrbitAngle) * orbitRadius,
                0,
                Math.sin(this.conjunctionOrbitAngle) * orbitRadius
            );
            
            this.lunaMesh.position.set(
                -Math.cos(this.conjunctionOrbitAngle) * orbitRadius,
                0,
                -Math.sin(this.conjunctionOrbitAngle) * orbitRadius
            );
            
            // Rotate the drops individually
            this.solMesh.rotation.y += 0.02 * this.speed;
            this.lunaMesh.rotation.y += 0.02 * this.speed;
            
            // Blend light between Gold and Silver
            this.coreLight.color.setHex(0xffaa00).lerp(new THREE.Color(0xdde6ee), Math.sin(this.conjunctionOrbitAngle) * 0.5 + 0.5);
            this.coreLight.position.copy(this.solMesh.position);
        } else {
            this.coreMesh.visible = true;
            this.solMesh.visible = false;
            this.lunaMesh.visible = false;
        }
        
        // Attract Mode automated camera orbit
        if (this.isAttractMode) {
            const orbitSpeed = time * 0.12;
            const radius = 35;
            this.camera.position.x = Math.sin(orbitSpeed) * radius;
            this.camera.position.z = Math.cos(orbitSpeed) * radius;
            this.camera.position.y = Math.sin(orbitSpeed * 0.5) * 6;
            this.camera.lookAt(0, 0, 0);
        }

        // 5. Render Scene
        this.renderer.render(this.scene, this.camera);
    }

}

// Bind to window for global access
window.AlchemicalEngine = new AlchemicalEngine3D();
window.AlchemicalEngine.init();

// ==========================================================================
// BIND DOM CONTROLS TO 3D GRAPHICS & SOUNDS
// ==========================================================================

// Gravity Slider
const gravSlider = document.getElementById('gravity-slider');
const gravVal = document.getElementById('gravity-val');
gravSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    gravVal.textContent = `${val.toFixed(2)} G`;
    
    // Update WebGL gravity vector
    window.AlchemicalEngine.setGravity(val);
    
    // Update Synthesizer fundamental pitches
    window.AlchemicalAudio.setGravity(val);
});

// Speed Slider
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
speedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    speedVal.textContent = `${val.toFixed(1)}x`;
    
    window.AlchemicalEngine.setSpeed(val);
    window.AlchemicalAudio.setSpeed(val);
});

// Alloy Conjunction Ratio Slider
const ratioSlider = document.getElementById('ratio-slider');
const ratioVal = document.getElementById('ratio-val');
ratioSlider.addEventListener('input', (e) => {
    const rawVal = parseInt(e.target.value);
    const goldPercent = 100 - rawVal;
    const mercPercent = rawVal;
    
    ratioVal.textContent = `Sol (${goldPercent}%) / Mercury (${mercPercent}%)`;
    
    // Map to 0-1 floating ratio
    window.AlchemicalEngine.setRatio(rawVal / 100);
    
    // Play sound chimes based on movement
    if (rawVal % 15 === 0) {
        window.AlchemicalAudio.playChime(rawVal > 50 ? 'silver' : 'gold');
    }
});

// State Buttons
const stateBtnZhenren = document.getElementById('state-zhenren');
const stateBtnTrickster = document.getElementById('state-trickster');

stateBtnZhenren.addEventListener('click', () => {
    stateBtnZhenren.classList.add('active');
    stateBtnTrickster.classList.remove('active');
    
    window.AlchemicalEngine.setPhilosophicalState('zhenren');
    window.AlchemicalAudio.setPhilosophicalState('zhenren');
    window.AlchemicalAudio.playChime('gold');
});

stateBtnTrickster.addEventListener('click', () => {
    stateBtnTrickster.classList.add('active');
    stateBtnZhenren.classList.remove('active');
    
    window.AlchemicalEngine.setPhilosophicalState('trickster');
    window.AlchemicalAudio.setPhilosophicalState('trickster');
    window.AlchemicalAudio.playChime('silver');
});

// Cabala input field and button have been removed to prevent user confusion. All activations are handled via tag shortcuts below.

// Cabala Tag Shortcuts & Hover Translations
const runeTranslations = {
    'KETHER': '🜍 CROWN TRANSIT: Explodes the solar core, generating a temporary expansion wave of pure golden coronal energy, triggering high-resonance astrolabe orbit speed surges.',
    'YESOD': '🜔 THE ASTRAL BASE: Establishes a zero-gravity weightless equilibrium. Instantly anchors ring precession into perfectly horizontal, silent breathing orbits.',
    'ZIRAN': '气 NATURAL EQUILIBRIUM: Restores all astrolabe mechanics, dials, audio tunings, and philosophical states to pristine harmonic equilibrium.',
    'LEVITATE': '🜁 SACRED ASCENSION: Severs gravitational friction, launching the core into vertical floating Lissajous orbits.',
    'CHAOS': '🜶 DISSOLUTION SPREAD: Floods the system with turbulent precession, maximum astrolabe speeds, detuned LFOs, and sawtooth grits.',
    'ECLIPSE': '🜏 SUN CONJUNCTION: Induces an astrological syzygy, swallowing the light, collapsing the core, and shifting audio into deep sub-harmonic muffled echoes.',
    'CONJUNCTIO': '🜍 DUAL ECLIPSE ORBIT: Splits the quicksilver core into separate Gold Sol and Silver Luna drops orbiting in a twisted celestial bridge dance.',
    'HOLOFAN': '🜏 HOLOGRAPHIC FAN MODE: Toggles solid-black background and hides all UI widgets for direct output to 3D LED POV projection fans (Shortcut: P, Record loop: R).'
};

const explainerText = document.getElementById('rune-explainer');

document.querySelectorAll('.rune-tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const rune = tag.getAttribute('data-rune');
        window.AlchemicalEngine.inscribeRune(rune);
    });
    
    tag.addEventListener('mouseenter', () => {
        const rune = tag.getAttribute('data-rune');
        if (runeTranslations[rune] && explainerText) {
            explainerText.textContent = runeTranslations[rune];
            explainerText.classList.add('active-translation');
        }
    });
    
    tag.addEventListener('mouseleave', () => {
        if (explainerText) {
            explainerText.textContent = 'Hover over a sacred rune shortcut to translate its alchemical formula...';
            explainerText.classList.remove('active-translation');
        }
    });
});

// Alchemical Journal Toggle Buttons
const journalToggleBtn = document.getElementById('journal-toggle-btn');
const journalOverlay = document.getElementById('journal-overlay');
const journalCloseBtn = document.getElementById('journal-close-btn');

if (journalToggleBtn && journalOverlay) {
    journalToggleBtn.addEventListener('click', () => {
        journalOverlay.classList.remove('journal-overlay-hidden');
        if (window.AlchemicalAudio) {
            window.AlchemicalAudio.playChime('gold');
        }
    });
}

if (journalCloseBtn && journalOverlay) {
    journalCloseBtn.addEventListener('click', () => {
        journalOverlay.classList.add('journal-overlay-hidden');
        if (window.AlchemicalAudio) {
            window.AlchemicalAudio.playChime('silver');
        }
    });
}

if (journalOverlay) {
    journalOverlay.addEventListener('click', (e) => {
        if (e.target === journalOverlay) {
            journalOverlay.classList.add('journal-overlay-hidden');
            if (window.AlchemicalAudio) {
                window.AlchemicalAudio.playChime('silver');
            }
        }
    });
}

// Sidebar Collapse Toggle Button
const collapseBtn = document.getElementById('sidebar-collapse-btn');
const dashboard = document.getElementById('alchemy-dashboard');
const canvasContainer = document.getElementById('canvas-container');
const dustOverlay = document.querySelector('.dust-overlay');

if (collapseBtn && dashboard && canvasContainer && dustOverlay) {
    collapseBtn.addEventListener('click', () => {
        dashboard.classList.toggle('collapsed');
        canvasContainer.classList.toggle('full-width');
        dustOverlay.classList.toggle('full-width');
        
        // Trigger window resize to recalculate canvas size
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
        
        if (dashboard.classList.contains('collapsed')) {
            collapseBtn.innerHTML = '🜄';
        } else {
            collapseBtn.innerHTML = '🜂';
        }
    });
}

// Meditation Duration Selection Buttons
document.querySelectorAll('.meditation-time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.meditation-time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const timeVal = btn.getAttribute('data-time');
        const customContainer = document.getElementById('custom-time-container');
        
        if (timeVal === 'custom') {
            if (customContainer) {
                customContainer.classList.remove('custom-time-hidden');
            }
            const customInput = document.getElementById('custom-time-input');
            if (customInput) {
                const mins = parseInt(customInput.value, 10) || 10;
                window.AlchemicalEngine.meditationDuration = mins * 60;
            }
        } else {
            if (customContainer) {
                customContainer.classList.add('custom-time-hidden');
            }
            window.AlchemicalEngine.meditationDuration = parseInt(timeVal, 10);
        }
    });
});

// Listener for custom time input changes
const customTimeInput = document.getElementById('custom-time-input');
if (customTimeInput) {
    customTimeInput.addEventListener('input', () => {
        const customBtn = document.getElementById('custom-time-btn');
        if (customBtn && customBtn.classList.contains('active')) {
            const mins = parseInt(customTimeInput.value, 10) || 1;
            window.AlchemicalEngine.meditationDuration = mins * 60;
        }
    });
}

// Meditation Start Button
const medStartBtn = document.getElementById('meditation-start');
if (medStartBtn) {
    medStartBtn.addEventListener('click', () => {
        if (window.AlchemicalEngine.meditationActive) {
            window.AlchemicalEngine.completeMeditation(false);
        } else {
            window.AlchemicalEngine.startMeditation();
        }
    });
}
// Timer Visibility Toggle Button (HIDE / SHOW)
const timerVisBtn = document.getElementById('timer-visibility-btn');
const timerDisplay = document.getElementById('meditation-timer-display');
if (timerVisBtn && timerDisplay) {
    timerVisBtn.addEventListener('click', () => {
        timerDisplay.classList.toggle('hud-hidden');
        if (timerDisplay.classList.contains('hud-hidden')) {
            timerVisBtn.textContent = 'SHOW';
            timerVisBtn.classList.add('active');
        } else {
            timerVisBtn.textContent = 'HIDE';
            timerVisBtn.classList.remove('active');
        }
    });
}

// Timer Fullscreen Button
const timerFullscreenBtn = document.getElementById('timer-fullscreen-btn');
if (timerFullscreenBtn) {
    timerFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('timer-fullscreen-btn');
    if (btn) {
        if (document.fullscreenElement) {
            btn.textContent = '⛶ EXIT';
            btn.classList.add('active');
        } else {
            btn.textContent = '⛶ FULLSCREEN';
            btn.classList.remove('active');
        }
    }
    // Sequential delayed resize triggers to guarantee Three.js snaps to the exact fullscreen viewport resolution
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 600);
});

// Timer Quiet (Mute/Unmute) Button
const timerAudioBtn = document.getElementById('timer-audio-btn');
if (timerAudioBtn) {
    timerAudioBtn.addEventListener('click', () => {
        window.AlchemicalAudio.toggle();
    });
}

// Timer End Meditation Button
const timerEndBtn = document.getElementById('timer-end-btn');
if (timerEndBtn) {
    timerEndBtn.addEventListener('click', () => {
        window.AlchemicalEngine.completeMeditation(false);
    });
}

// Solfeggio Harmonic Tuning Click Bindings
document.querySelectorAll('.solfeggio-btn:not(.meditation-time-btn):not(.drumming-pattern-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all non-meditation solfeggio buttons
        document.querySelectorAll('.solfeggio-btn:not(.meditation-time-btn):not(.drumming-pattern-btn)').forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Retrieve target frequency and trigger audio transition
        const freq = btn.getAttribute('data-freq');
        window.AlchemicalAudio.setSolfeggioFrequency(freq);
        
        // Visually nudge/wobble the concentric rings as a cosmic reaction
        window.AlchemicalEngine.rings.forEach((r, idx) => {
            r.mesh.rotation.x += (Math.random() - 0.5) * 0.2;
            r.mesh.rotation.y += (Math.random() - 0.5) * 0.2;
        });
    });
});

// Journey Drumming DOM Bindings
const drummingToggle = document.getElementById('drumming-toggle');
if (drummingToggle) {
    drummingToggle.addEventListener('change', (e) => {
        const active = e.target.checked;
        window.AlchemicalAudio.toggleJourneyDrumming(active);
    });
}

document.querySelectorAll('.drumming-pattern-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.drumming-pattern-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pattern = btn.getAttribute('data-pattern');
        window.AlchemicalAudio.setJourneyDrummingPattern(pattern);
    });
});

// Celestial Beams (Colored Lights) Toggle Binding
const lightsToggle = document.getElementById('lights-toggle');
if (lightsToggle) {
    lightsToggle.addEventListener('change', (e) => {
        const active = e.target.checked;
        if (window.AlchemicalEngine && window.AlchemicalEngine.refractionBeams) {
            window.AlchemicalEngine.refractionBeams.visible = active;
        }
    });
}

// Curated Presets DOM Click Bindings
const presets = [
    { id: 'pathway-descent', name: 'descent' },
    { id: 'pathway-dissolution', name: 'dissolution' },
    { id: 'pathway-gateway', name: 'gateway' },
    { id: 'pathway-drift', name: 'drift' }
];

presets.forEach(p => {
    const btn = document.getElementById(p.id);
    if (btn) {
        btn.addEventListener('click', () => {
            window.AlchemicalEngine.applyNeuralPreset(p.name);
        });
    }
});

/* ==========================================================================
   GALLERY INSTALLATION & KIOSK MANAGEMENT SYSTEM
   ========================================================================== */
class GalleryInstallationManager {
    constructor() {
        this.inactivityTimeoutMs = 45000; // 45 seconds before idle Attract Mode
        this.idleTimer = null;
        this.isAttractMode = false;
        this.isExhibitionMode = false;
        
        this.attractOverlay = document.getElementById('attract-overlay');
        this.attractWakeBtn = document.getElementById('attract-wake-btn');
        this.exhibitionToggleBtn = document.getElementById('exhibition-toggle-btn');
        this.memoryTicker = document.getElementById('memory-ticker');
        this.surveySubmitBtn = document.getElementById('survey-submit-btn');
        this.surveyInput = document.getElementById('survey-reflection-input');

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCollectiveReflections();
        this.resetInactivityTimer();
    }

    bindEvents() {
        // User input events reset the inactivity timer
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        activityEvents.forEach(evt => {
            window.addEventListener(evt, () => this.handleUserActivity(), { passive: true });
        });

        // Wake button on Attract Mode overlay
        if (this.attractWakeBtn) {
            this.attractWakeBtn.addEventListener('click', () => {
                this.exitAttractMode();
            });
        }

        // Exhibition Kiosk Mode Toggle
        if (this.exhibitionToggleBtn) {
            this.exhibitionToggleBtn.addEventListener('click', () => {
                this.toggleExhibitionMode();
            });
        }

        // Phenomenological Reflection Submission
        if (this.surveySubmitBtn) {
            this.surveySubmitBtn.addEventListener('click', () => {
                this.submitReflection();
            });
        }
    }

    handleUserActivity() {
        if (this.isAttractMode) {
            this.exitAttractMode();
        }
        this.resetInactivityTimer();
    }

    resetInactivityTimer() {
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            this.enterAttractMode();
        }, this.inactivityTimeoutMs);
    }

    enterAttractMode() {
        if (this.isAttractMode) return;
        this.isAttractMode = true;

        if (this.attractOverlay) {
            this.attractOverlay.classList.add('attract-visible');
        }

        // Trigger visual attract rotation in Three.js Engine
        if (window.AlchemicalEngine) {
            window.AlchemicalEngine.isAttractMode = true;
            window.AlchemicalEngine.setPhilosophicalState('zhenren');
        }

        // Ensure audio soft fade
        if (window.AlchemicalAudio && window.AlchemicalAudio.isActive) {
            window.AlchemicalAudio.masterGain.gain.setTargetAtTime(0.08, window.AlchemicalAudio.ctx.currentTime, 2.0);
        }
    }

    exitAttractMode() {
        if (!this.isAttractMode) return;
        this.isAttractMode = false;

        if (this.attractOverlay) {
            this.attractOverlay.classList.remove('attract-visible');
        }

        if (window.AlchemicalEngine) {
            window.AlchemicalEngine.isAttractMode = false;
        }

        // Restore audio volume gently if active
        if (window.AlchemicalAudio && window.AlchemicalAudio.isActive) {
            window.AlchemicalAudio.masterGain.gain.setTargetAtTime(0.35, window.AlchemicalAudio.ctx.currentTime, 1.0);
        } else if (window.AlchemicalAudio && !window.AlchemicalAudio.isActive) {
            // Auto-start sound on first interaction
            window.AlchemicalAudio.init();
            window.AlchemicalAudio.toggle();
        }

        // Open Tablet Installation Experience Wizard
        if (window.TabletWizard) {
            window.TabletWizard.openWizard();
        }
    }

    toggleExhibitionMode() {
        this.isExhibitionMode = !this.isExhibitionMode;
        document.body.classList.toggle('exhibition-mode', this.isExhibitionMode);

        if (this.exhibitionToggleBtn) {
            this.exhibitionToggleBtn.textContent = this.isExhibitionMode ? 'EXHIBITION ON' : 'EXHIBITION';
            this.exhibitionToggleBtn.style.borderColor = this.isExhibitionMode ? 'var(--color-emerald)' : 'rgba(255, 215, 0, 0.25)';
            this.exhibitionToggleBtn.style.color = this.isExhibitionMode ? 'var(--color-emerald)' : 'var(--color-gold)';
        }
    }

    loadCollectiveReflections() {
        const defaultReflections = [
            { author: "Adept #104", text: "An absolute stillness... Sinking into a deep golden void." },
            { author: "Visitor", text: "Like floating in warm oil while watching the stars orbit." },
            { author: "Participant", text: "Felt the chatter in my mind completely subside after 2 minutes." },
            { author: "Seeker", text: "The chimes synchronized with my breathing. Unbelievably peaceful." },
            { author: "Gallery Guest", text: "A rare moment of true weightlessness in the middle of a noisy day." }
        ];

        let stored = [];
        try {
            const raw = localStorage.getItem('liminal_reflections');
            if (raw) stored = JSON.parse(raw);
        } catch (e) {
            console.warn('Could not read gallery reflections:', e);
        }

        const reflections = stored.length > 0 ? stored : defaultReflections;
        this.renderTicker(reflections);
    }

    renderTicker(reflections) {
        if (!this.memoryTicker) return;
        this.memoryTicker.innerHTML = '';
        
        // Double array to create seamless loop
        const list = [...reflections, ...reflections];
        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'memory-item';
            div.innerHTML = `<span class="author">${this.escapeHtml(item.author)}:</span> "${this.escapeHtml(item.text)}"`;
            this.memoryTicker.appendChild(div);
        });
    }

    submitReflection() {
        if (!this.surveyInput) return;
        const text = this.surveyInput.value.trim();
        if (!text) return;

        const newReflection = {
            author: `Visitor #${Math.floor(100 + Math.random() * 900)}`,
            text: text
        };

        try {
            let stored = [];
            const raw = localStorage.getItem('liminal_reflections');
            if (raw) stored = JSON.parse(raw);
            stored.unshift(newReflection); // Add to front
            if (stored.length > 30) stored.pop(); // Keep last 30
            localStorage.setItem('liminal_reflections', JSON.stringify(stored));
            this.renderTicker(stored);
        } catch (e) {
            console.warn('Could not save reflection:', e);
        }

        this.surveyInput.value = '';
        
        // Toast alert & hide survey overlay
        const toast = document.getElementById('rune-toast');
        if (toast) {
            toast.textContent = 'REFLECTION INSCRIBED IN GALLERY MEMORY';
            toast.classList.remove('toast-hidden');
            setTimeout(() => toast.classList.add('toast-hidden'), 3500);
        }

        const surveyOverlay = document.getElementById('survey-overlay');
        if (surveyOverlay) {
            surveyOverlay.classList.add('survey-overlay-hidden');
        }

        // Do not force Attract Mode; TabletWizard manages transition to Step 4 (Thank You) and Step 0 (Start)
    }

    escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}

/* ==========================================================================
   TABLET EXPERIENCE WIZARD MANAGER
   ========================================================================== */
class GalleryTabletWizardManager {
    constructor() {
        this.modal = document.getElementById('gallery-tablet-modal');
        this.mindState = 'busy';
        this.frequencyGoal = 'stillness';
        this.durationSeconds = 120; // 2 minutes default
        this.selectedRating = 'Calmer';
        this.resetTimer = null;

        this.init();
    }

    init() {
        this.bindOptionButtons();
        this.bindNavigationButtons();
        // Immediately open wizard on page load
        setTimeout(() => this.openWizard(), 100);
    }

    bindOptionButtons() {
        // Step 1: Option selections
        this.setupButtonGroup('#q1-options .tab-opt-btn', (val) => { this.mindState = val; });
        this.setupButtonGroup('#q2-options .tab-opt-btn', (val) => { this.frequencyGoal = val; });
        this.setupButtonGroup('#q3-options .tab-opt-btn', (val) => { this.durationSeconds = parseInt(val, 10); });

        // Step 3: Rating selections
        this.setupButtonGroup('.tab-feedback-ratings .tab-rating-btn', (val) => { this.selectedRating = val; }, 'data-rating');
    }

    setupButtonGroup(selector, callback, attrName = 'data-val') {
        const btns = document.querySelectorAll(selector);
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                callback(btn.getAttribute(attrName));
            });
        });
    }

    bindNavigationButtons() {
        // Step 0 -> Step 1 (Start Experience Button)
        const btnStartHero = document.getElementById('tab-btn-start-checkin');
        if (btnStartHero) {
            btnStartHero.addEventListener('click', () => this.showStep(1));
        }

        // Step 1 -> Step 0 (Back to Start Landing)
        const btnBackToStep0 = document.getElementById('tab-btn-back-to-step0');
        if (btnBackToStep0) {
            btnBackToStep0.addEventListener('click', () => this.showStep(0));
        }

        // Step 1 -> Step 2
        const btnToStep2 = document.getElementById('tab-btn-to-step2');
        if (btnToStep2) {
            btnToStep2.addEventListener('click', () => this.showStep(2));
        }

        // Step 2 -> Step 1
        const btnBackToStep1 = document.getElementById('tab-btn-back-to-step1');
        if (btnBackToStep1) {
            btnBackToStep1.addEventListener('click', () => this.showStep(1));
        }

        // Step 2 -> Start Journey Immersion
        const btnStartJourney = document.getElementById('tab-btn-start-journey');
        if (btnStartJourney) {
            btnStartJourney.addEventListener('click', () => this.startImmersionJourney());
        }

        // Step 3 -> Submit & Step 4 (Thank You)
        const btnFinish = document.getElementById('tab-btn-finish');
        if (btnFinish) {
            btnFinish.addEventListener('click', () => this.submitFeedbackAndFinish());
        }

        // Bottom-Left Control: Exit to Start Screen
        const btnExit = document.getElementById('gallery-exit-btn');
        if (btnExit) {
            btnExit.addEventListener('click', () => {
                if (window.AlchemicalEngine) {
                    window.AlchemicalEngine.completeMeditation(false);
                }
                if (this.resetTimer) clearInterval(this.resetTimer);
                this.openWizard();
            });
        }

        // Bottom-Left Control: Fullscreen Toggle (F11 function)
        const btnFullscreen = document.getElementById('gallery-fullscreen-btn');
        const fsLabel = document.getElementById('fs-label');
        const fsIcon = document.getElementById('fs-icon');

        const updateFsUI = () => {
            const isFs = !!document.fullscreenElement;
            if (fsLabel) fsLabel.textContent = isFs ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
            if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
        };

        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    const docEl = document.documentElement;
                    if (docEl.requestFullscreen) docEl.requestFullscreen();
                    else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
                    else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                }
            });

            document.addEventListener('fullscreenchange', updateFsUI);
            document.addEventListener('webkitfullscreenchange', updateFsUI);
        }
    }

    openWizard() {
        if (!this.modal) return;
        this.showStep(0);
        this.modal.classList.remove('tablet-modal-hidden');
    }

    closeWizard() {
        if (!this.modal) return;
        this.modal.classList.add('tablet-modal-hidden');
    }

    showStep(stepNumber) {
        document.querySelectorAll('.tab-step').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`tab-step-${stepNumber}`);
        if (target) target.classList.add('active');
    }

    startImmersionJourney() {
        this.closeWizard();

        // Tune Audio based on Visitor Selections
        if (window.AlchemicalAudio) {
            const freq = (this.frequencyGoal && this.frequencyGoal.match(/432|528|741/)) ? this.frequencyGoal : '432';
            window.AlchemicalAudio.setSolfeggioFrequency(freq);
            window.AlchemicalAudio.setPhilosophicalState('zhenren');
        }

        // Tune Visual Engine based on Visitor Selections
        if (window.AlchemicalEngine) {
            if (this.mindState === 'gateway') {
                window.AlchemicalEngine.setPhilosophicalState('trickster');
                window.AlchemicalEngine.applyNeuralPreset('gateway');
            } else if (this.mindState === 'dissolution') {
                window.AlchemicalEngine.setPhilosophicalState('zhenren');
                window.AlchemicalEngine.applyNeuralPreset('dissolution');
            } else {
                window.AlchemicalEngine.setPhilosophicalState('zhenren');
                window.AlchemicalEngine.applyNeuralPreset('descent');
            }

            // Start meditation focus session timer!
            window.AlchemicalEngine.startMeditationTimer(this.durationSeconds);
        }
    }

    onImmersionComplete() {
        // Triggered when meditation countdown finishes
        this.openWizard();
        this.showStep(3); // Step 3: Reflection & Feedback Screen

        // 45-second countdown timer on Feedback screen before auto-resetting to Step 0
        let countdown = 45;
        const countdownEl = document.getElementById('tab-feedback-countdown');
        if (countdownEl) countdownEl.textContent = countdown;

        const textInput = document.getElementById('tab-reflection-text');
        let userIsTyping = false;
        if (textInput) {
            textInput.addEventListener('focus', () => { userIsTyping = true; });
            textInput.addEventListener('input', () => { userIsTyping = true; countdown = 60; });
        }

        if (this.resetTimer) clearInterval(this.resetTimer);
        this.resetTimer = setInterval(() => {
            if (!userIsTyping) {
                countdown--;
                if (countdownEl) countdownEl.textContent = countdown;

                if (countdown <= 0) {
                    clearInterval(this.resetTimer);
                    this.submitFeedbackAndFinish(); // Auto-saves feedback & jumps directly to Step 0 (Start Screen)
                }
            }
        }, 1000);
    }

    submitFeedbackAndFinish() {
        if (this.resetTimer) clearInterval(this.resetTimer);

        const textInput = document.getElementById('tab-reflection-text');
        const text = textInput ? textInput.value.trim() : '';

        const fullNote = text ? `[${this.selectedRating}] ${text}` : `Feeling ${this.selectedRating}`;

        // Save reflection to collective memory & update start screen stats
        if (window.GalleryInstallation) {
            window.GalleryInstallation.surveyInput = { value: fullNote, trim: () => fullNote };
            window.GalleryInstallation.submitReflection();
        }

        if (textInput) textInput.value = '';

        // Reset directly to Step 0 (Start Screen) for next visitor
        this.showStep(0);
    }
}

/* ==========================================================================
   CURATOR & EXHIBITION ADMINISTRATION MANAGER (SHIFT + C)
   ========================================================================== */
class CuratorAdminManager {
    constructor() {
        this.modal = document.getElementById('curator-admin-modal');
        this.plaqueModal = document.getElementById('gallery-wall-plaque');
        
        // Buttons
        this.curatorTriggerBtn = document.getElementById('gallery-curator-btn');
        this.plaqueTriggerBtn = document.getElementById('gallery-plaque-btn');
        this.curatorCloseBtn = document.getElementById('curator-close-btn');
        this.curatorDoneBtn = document.getElementById('curator-done-btn');
        this.plaqueCloseBtn = document.getElementById('plaque-close-btn');
        
        // Controls
        this.volumeSlider = document.getElementById('curator-volume');
        this.volumeVal = document.getElementById('curator-volume-val');
        this.muteBtn = document.getElementById('curator-mute-btn');
        this.resSelect = document.getElementById('curator-resolution-scale');
        this.fogSelect = document.getElementById('curator-fog-color');
        this.timeoutSelect = document.getElementById('curator-idle-timeout');
        this.tamperBtn = document.getElementById('curator-tamper-btn');
        
        // Reflections controls
        this.exportReflectionsBtn = document.getElementById('curator-export-reflections-btn');
        this.resetReflectionsBtn = document.getElementById('curator-reset-reflections-btn');
        this.reflectionsListEl = document.getElementById('curator-reflections-list');
        
        this.isTamperLocked = true;
        this.isCuratorOpen = false;
        this.isPlaqueOpen = false;

        this.init();
    }

    init() {
        this.bindHotkeys();
        this.bindUI();
        this.applyTamperLock(true);
        this.populateReflectionsList();
    }

    bindHotkeys() {
        window.addEventListener('keydown', (e) => {
            // Shift + C triggers Curator Panel
            if (e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                e.preventDefault();
                this.toggleCuratorModal();
            }
            // Shift + P triggers Museum Plaque
            if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
                e.preventDefault();
                this.togglePlaqueModal();
            }
            // Escape closes modals
            if (e.key === 'Escape') {
                if (this.isCuratorOpen) this.closeCuratorModal();
                if (this.isPlaqueOpen) this.closePlaqueModal();
            }

            // Tamper Lock: prevent browser shortcuts that disrupt exhibition kiosk
            if (this.isTamperLocked && !this.isCuratorOpen) {
                // Prevent F5, Ctrl+R, Ctrl+W, Ctrl+U, Ctrl+S
                if (e.key === 'F5' || 
                   ((e.ctrlKey || e.metaKey) && ['r', 'R', 'w', 'W', 'u', 'U', 's', 'S'].includes(e.key))) {
                    e.preventDefault();
                }
            }
        });

        // Block right-click context menu when tamper lock is on
        window.addEventListener('contextmenu', (e) => {
            if (this.isTamperLocked && !this.isCuratorOpen) {
                e.preventDefault();
            }
        });

        // Block image dragging
        window.addEventListener('dragstart', (e) => {
            if (this.isTamperLocked) e.preventDefault();
        });
    }

    bindUI() {
        if (this.curatorTriggerBtn) {
            this.curatorTriggerBtn.addEventListener('click', () => this.toggleCuratorModal());
        }
        if (this.plaqueTriggerBtn) {
            this.plaqueTriggerBtn.addEventListener('click', () => this.togglePlaqueModal());
        }
        if (this.curatorCloseBtn) {
            this.curatorCloseBtn.addEventListener('click', () => this.closeCuratorModal());
        }
        if (this.curatorDoneBtn) {
            this.curatorDoneBtn.addEventListener('click', () => this.closeCuratorModal());
        }
        if (this.plaqueCloseBtn) {
            this.plaqueCloseBtn.addEventListener('click', () => this.closePlaqueModal());
        }

        // Close on background click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeCuratorModal();
            });
        }
        if (this.plaqueModal) {
            this.plaqueModal.addEventListener('click', (e) => {
                if (e.target === this.plaqueModal) this.closePlaqueModal();
            });
        }

        // Volume slider
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (this.volumeVal) this.volumeVal.textContent = `${val}%`;
                if (window.AlchemicalAudio) {
                    window.AlchemicalAudio.setMasterVolume(val / 100);
                }
            });
        }

        // Hardware Mute
        if (this.muteBtn) {
            this.muteBtn.addEventListener('click', () => {
                if (window.AlchemicalAudio) {
                    const isMuted = window.AlchemicalAudio.toggleHardwareMute();
                    this.muteBtn.textContent = isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO';
                    this.muteBtn.classList.toggle('active', isMuted);
                }
            });
        }

        // Resolution Scaling
        if (this.resSelect) {
            this.resSelect.addEventListener('change', (e) => {
                const scale = parseFloat(e.target.value);
                if (window.AlchemicalEngine && window.AlchemicalEngine.renderer) {
                    window.AlchemicalEngine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, scale));
                    window.dispatchEvent(new Event('resize'));
                }
            });
        }

        // Fog Theme
        if (this.fogSelect) {
            this.fogSelect.addEventListener('change', (e) => {
                const colorHex = parseInt(e.target.value, 16);
                if (window.AlchemicalEngine && window.AlchemicalEngine.scene && window.AlchemicalEngine.scene.fog) {
                    window.AlchemicalEngine.scene.fog.color.setHex(colorHex);
                }
            });
        }

        // Inactivity Timeout
        if (this.timeoutSelect) {
            this.timeoutSelect.addEventListener('change', (e) => {
                const ms = parseInt(e.target.value, 10);
                if (window.GalleryInstallation) {
                    window.GalleryInstallation.inactivityTimeoutMs = ms > 0 ? ms : 99999999;
                    window.GalleryInstallation.resetInactivityTimer();
                }
            });
        }

        // Tamper Lock Button
        if (this.tamperBtn) {
            this.tamperBtn.addEventListener('click', () => {
                this.applyTamperLock(!this.isTamperLocked);
            });
        }

        // Reflections Export
        if (this.exportReflectionsBtn) {
            this.exportReflectionsBtn.addEventListener('click', () => this.exportReflections());
        }

        // Reflections Reset
        if (this.resetReflectionsBtn) {
            this.resetReflectionsBtn.addEventListener('click', () => this.resetReflections());
        }
    }

    applyTamperLock(locked) {
        this.isTamperLocked = locked;
        document.body.classList.toggle('kiosk-locked', locked);
        if (this.tamperBtn) {
            this.tamperBtn.textContent = locked ? 'TAMPER LOCK ON' : 'TAMPER LOCK OFF';
            this.tamperBtn.classList.toggle('active', locked);
        }
    }

    toggleCuratorModal() {
        if (this.isCuratorOpen) {
            this.closeCuratorModal();
        } else {
            this.openCuratorModal();
        }
    }

    openCuratorModal() {
        if (!this.modal) return;
        this.isCuratorOpen = true;
        this.modal.classList.remove('curator-modal-hidden');
        this.populateReflectionsList();
    }

    closeCuratorModal() {
        if (!this.modal) return;
        this.isCuratorOpen = false;
        this.modal.classList.add('curator-modal-hidden');
    }

    togglePlaqueModal() {
        if (this.isPlaqueOpen) {
            this.closePlaqueModal();
        } else {
            this.openPlaqueModal();
        }
    }

    openPlaqueModal() {
        if (!this.plaqueModal) return;
        this.isPlaqueOpen = true;
        this.plaqueModal.classList.remove('plaque-modal-hidden');
    }

    closePlaqueModal() {
        if (!this.plaqueModal) return;
        this.isPlaqueOpen = false;
        this.plaqueModal.classList.add('plaque-modal-hidden');
    }

    populateReflectionsList() {
        if (!this.reflectionsListEl) return;
        this.reflectionsListEl.innerHTML = '';

        let stored = [];
        try {
            const raw = localStorage.getItem('liminal_reflections');
            if (raw) stored = JSON.parse(raw);
        } catch (e) {}

        if (stored.length === 0) {
            this.reflectionsListEl.innerHTML = '<div style="font-size:0.7rem; color:#94a3b8; font-style:italic; padding:6px;">Default curated archive is currently active.</div>';
            return;
        }

        stored.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'curator-ref-row';
            row.innerHTML = `
                <span class="curator-ref-text"><strong>${this.escapeHtml(item.author)}:</strong> ${this.escapeHtml(item.text)}</span>
                <button class="curator-del-btn" title="Delete entry" data-idx="${index}">✕</button>
            `;
            const delBtn = row.querySelector('.curator-del-btn');
            delBtn.addEventListener('click', () => {
                this.deleteReflection(index);
            });
            this.reflectionsListEl.appendChild(row);
        });
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    deleteReflection(index) {
        try {
            let stored = JSON.parse(localStorage.getItem('liminal_reflections') || '[]');
            stored.splice(index, 1);
            localStorage.setItem('liminal_reflections', JSON.stringify(stored));
            if (window.GalleryInstallation) window.GalleryInstallation.loadCollectiveReflections();
            this.populateReflectionsList();
        } catch (e) {
            console.warn('Could not delete reflection:', e);
        }
    }

    exportReflections() {
        try {
            const raw = localStorage.getItem('liminal_reflections') || '[]';
            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `liminal_engine_reflections_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Export failed: ' + e.message);
        }
    }

    resetReflections() {
        if (confirm('Reset collective reflections to the initial museum archive?')) {
            localStorage.removeItem('liminal_reflections');
            if (window.GalleryInstallation) window.GalleryInstallation.loadCollectiveReflections();
            this.populateReflectionsList();
        }
    }
}

// Initialize Gallery Systems once DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    window.GalleryInstallation = new GalleryInstallationManager();
    window.TabletWizard = new GalleryTabletWizardManager();
    window.CuratorAdmin = new CuratorAdminManager();

    // Hook into meditation completion to open reflection screen reliably
    if (window.AlchemicalEngine) {
        const originalComplete = window.AlchemicalEngine.completeMeditation;
        window.AlchemicalEngine.completeMeditation = function(success = false) {
            if (originalComplete) originalComplete.apply(this, arguments);
            if (success && window.TabletWizard) {
                window.TabletWizard.onImmersionComplete();
            }
        };
        window.AlchemicalEngine.endMeditationSession = function(success = true) {
            window.AlchemicalEngine.completeMeditation(success);
        };
    }
});


