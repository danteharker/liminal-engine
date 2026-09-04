// Liminal Engine — capture six stills at 2560x1440 from the local server.
// Run the piece first (node server.js in the project root), then: npm install && npm run stills
// Needs Chrome at the path below. Camera is off, so the sphere reflects the built-in room.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8080/?capture=1';
const OUT = process.argv[2] || path.join(__dirname, 'out', 'stills');
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({
        executablePath: CHROME,
        headless: 'new',
        args: [
            '--window-size=2560,1440',
            '--autoplay-policy=no-user-gesture-required',
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist', '--mute-audio'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 1 });

    // Camera off for stills (headless has no real camera); no stored inscriptions.
    await page.evaluateOnNewDocument(() => {
        localStorage.setItem('liminal_settings', JSON.stringify({ camera: false, pixelRatio: 1 }));
        localStorage.removeItem('liminal_reflections');
    });

    page.on('pageerror', e => console.error('PAGE ERROR', e.message));
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForFunction(() => window.Liminal && Liminal.engine && Liminal.engine.time > 0.5, { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready.then(() => Liminal.engine.redrawRings()));
    await page.evaluate(() => { const n = Liminal.installation.el.sensorNote; if (n) n.style.display = 'none'; });

    // Take over the sensor and the opus so each still is a chosen moment.
    await page.evaluate(() => {
        Liminal.sensor.update = function () {};
        Liminal.engine.updateOpus = function () { this.opus = window.__p ?? this.opus; };
        Liminal.engine.inSession = true;
        window.__setMoment = (p, motion) => {
            window.__p = p;
            Liminal.sensor.motion = motion;
            Liminal.sensor.stillness = 1 - motion;
        };
    });

    const shot = async (name) => {
        const file = path.join(OUT, name + '.png');
        await page.screenshot({ path: file, type: 'png' });
        console.log('wrote', file);
    };

    // Helpers to show/hide layers
    const showOnly = async (ids) => page.evaluate((ids) => {
        document.querySelectorAll('.layer').forEach(el => {
            const on = ids.includes(el.id);
            el.classList.toggle('is-visible', on);
        });
        document.querySelectorAll('.modal').forEach(el => el.classList.remove('is-visible'));
    }, ids);
    const setStage = async (label, frac) => page.evaluate((label, frac) => {
        const s = document.getElementById('hud-stage');
        s.textContent = label; s.classList.add('is-visible');
        document.getElementById('hud-progress').style.transition = 'none';
        document.getElementById('hud-progress').style.transform = `scaleX(${frac})`;
    }, label, frac);

    // 1. Attract — resting state, black quicksilver, "Be still."
    await page.evaluate(() => { window.__setMoment(0.22, 0.15); Liminal.engine.cameraTargetZ = 5.0; Liminal.engine.camera.position.z = 5.0; });
    await showOnly(['attract']);
    await sleep(2500);
    await shot('01-attract-be-still');

    // Sessions: camera in
    await page.evaluate(() => { Liminal.engine.cameraTargetZ = 4.3; Liminal.engine.camera.position.z = 4.3; });

    // 2. Nigredo — agitated
    await page.evaluate(() => window.__setMoment(0.06, 0.55));
    await showOnly(['hud']); await setStage('Nigredo', 0.08);
    await sleep(1800);
    await shot('02-nigredo');

    // 3. Albedo — quicksilver settling
    await page.evaluate(() => window.__setMoment(0.38, 0.05));
    await setStage('Albedo', 0.34);
    await sleep(1800);
    await shot('03-albedo');

    // 4. Citrinitas
    await page.evaluate(() => window.__setMoment(0.64, 0.0));
    await setStage('Citrinitas', 0.58);
    await sleep(1800);
    await shot('04-citrinitas');

    // 5. Rubedo — gold mirror
    await page.evaluate(() => window.__setMoment(1.0, 0.0));
    await setStage('Rubedo', 0.92);
    await sleep(2200);
    await shot('05-rubedo');

    // 6. The question
    await showOnly(['reflect']);
    await page.evaluate(() => { document.getElementById('reflect-input').blur(); });
    await sleep(1500);
    await shot('06-the-question');

    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
