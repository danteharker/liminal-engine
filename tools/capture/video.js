// Liminal Engine — render a 90 s film of one scripted session.
// Run the piece first (node server.js in the project root), then in this folder:
//   npm install
//   npm run frames   -> out/frames/%05d.png  (virtual time, exactly 30 fps, DOM + WebGL; ~17 min)
//   npm run audio    -> out/audio.webm       (real time, live synth via MediaRecorder; 90 s)
//   npm run mux      -> out/liminal-engine-90s.mp4
// The stillness curve is in __schedule below; change it to change the film.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8080/?capture=1';
const OUT = path.join(__dirname, 'out');
const FPS = 30;
const SECONDS = 90;
const W = 1920, H = 1080;

const mode = process.argv[2] || 'frames';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// The session, in seconds from the start of the film. Shared by both passes.
const SCHEDULE_SRC = `
window.__schedule = {
    beginAt: 5, chooseAt: 8, introAt: 11, workAt: 16, duration: 60, tone: '528',
    // opus as a function of seconds into the work
    opus(s) {
        if (s < 0) return 0.25 + Math.sin(s * 0.7) * 0.03;      // attract: breathing around a quarter
        if (s < 14) return 0.08 + (s / 14) * 0.24;              // settling to 0.32
        if (s < 19) return 0.32 - ((s - 14) / 5) * 0.14;        // a movement: falls to 0.18, the nudge appears
        if (s < 48) return 0.18 + ((s - 19) / 29) * 0.82;       // the long climb to gold
        return 1.0;
    },
    motion(s) {
        if (s < 0) return 0.10 + Math.max(0, Math.sin(s * 1.3)) * 0.08;
        if (s >= 14 && s < 19) return 0.55;
        if (s < 6) return 0.12 - s * 0.018;
        return 0.02;
    }
};
window.__applyMoment = (filmT) => {
    const s = filmT - window.__schedule.workAt;
    const e = Liminal.engine, sn = Liminal.sensor;
    const inWork = Liminal.installation.state === 'work' || Liminal.installation.state === 'return' || Liminal.installation.state === 'reflect';
    const p = inWork ? window.__schedule.opus(s) : 0.25 + Math.sin(filmT * 0.6) * 0.03;
    e.opus = p;
    sn.motion = window.__schedule.motion(inWork ? s : -1);
    sn.stillness = 1 - sn.motion;
};
`;

async function launch() {
    const browser = await puppeteer.launch({
        executablePath: CHROME,
        headless: 'new',
        args: [
            `--window-size=${W},${H}`,
            '--autoplay-policy=no-user-gesture-required',
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => {
        localStorage.setItem('liminal_settings', JSON.stringify({ camera: false, pixelRatio: 1, durationSeconds: 60, volume: 70 }));
        localStorage.removeItem('liminal_reflections');
    });
    page.on('pageerror', e => console.error('PAGE ERROR', e.message));
    page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
    return { browser, page };
}

async function ready(page) {
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForFunction(() => window.Liminal && Liminal.engine && Liminal.engine.time > 0.5, { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready.then(() => Liminal.engine.redrawRings()));
    await page.evaluate(SCHEDULE_SRC);
    await page.evaluate(() => {
        const n = Liminal.installation.el.sensorNote; if (n) n.style.display = 'none';
        Liminal.sensor.update = function () {};
        Liminal.engine.updateOpus = function () {};
        Liminal.installation.settings.durationSeconds = window.__schedule.duration;
    });
}

/* ---------------- frames: virtual time ---------------- */
async function frames() {
    const dir = path.join(OUT, 'frames');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const { browser, page } = await launch();
    await ready(page);

    // Take over time: rAF, performance.now, setTimeout, and CSS transitions.
    await page.evaluate((FPS) => {
        window.__vt = performance.now();
        const realNow = performance.now.bind(performance);
        performance.now = () => window.__vt;
        window.__raf = [];
        window.requestAnimationFrame = (cb) => { window.__raf.push(cb); return 1; };
        window.__timers = [];
        const realSetTimeout = window.setTimeout;
        window.setTimeout = (fn, ms = 0, ...args) => {
            const id = { at: window.__vt + ms, fn: () => fn(...args) };
            window.__timers.push(id);
            return id;
        };
        window.clearTimeout = (id) => { const i = window.__timers.indexOf(id); if (i >= 0) window.__timers.splice(i, 1); };
        Liminal.engine.clock.getDelta = () => 1 / FPS;

        window.__step = (filmT) => {
            window.__vt += 1000 / FPS;
            window.__applyMoment(filmT);
            // timers
            const due = window.__timers.filter(t => t.at <= window.__vt);
            window.__timers = window.__timers.filter(t => t.at > window.__vt);
            due.forEach(t => { try { t.fn(); } catch (e) { console.error(e); } });
            // one animation frame for every registered loop
            const cbs = window.__raf; window.__raf = [];
            cbs.forEach(cb => { try { cb(window.__vt); } catch (e) { console.error(e); } });
            // CSS transitions advance by exactly one frame
            document.getAnimations().forEach(a => {
                try { a.pause(); a.currentTime = (a.currentTime || 0) + 1000 / FPS; } catch (e) {}
            });
        };
    }, FPS);

    const total = SECONDS * FPS;
    const t0 = Date.now();
    for (let i = 0; i < total; i++) {
        const filmT = i / FPS;
        if (i === 5 * FPS) await page.evaluate(() => Liminal.installation.begin());
        if (i === 8 * FPS) await page.evaluate(() => Liminal.installation.chooseTone(window.__schedule.tone));
        if (i === 11 * FPS) await page.evaluate(() => Liminal.installation.startIntro());
        if (i === 16 * FPS) await page.evaluate(() => Liminal.installation.startWork());
        await page.evaluate((t) => window.__step(t), filmT);
        await page.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.png'), type: 'png' });
        if (i % 150 === 0) {
            const st = await page.evaluate(() => Liminal.installation.state + ' opus=' + Liminal.engine.opus.toFixed(2));
            console.log(`frame ${i}/${total}  t=${filmT.toFixed(1)}s  ${st}  (${((Date.now() - t0) / 1000).toFixed(0)}s real)`);
        }
    }
    await browser.close();
    console.log('frames done');
}

/* ---------------- audio: real time ---------------- */
async function audio() {
    const file = path.join(OUT, 'audio.webm');
    fs.rmSync(file, { force: true });
    const { browser, page } = await launch();
    await page.exposeFunction('__saveChunk', (b64) => fs.appendFileSync(file, Buffer.from(b64, 'base64')));
    await ready(page);

    const state = await page.evaluate(async () => {
        const A = AlchemicalAudio;
        A.resume();
        await new Promise(r => setTimeout(r, 300));
        return { state: A.ctx.state, t: A.ctx.currentTime, active: A.isActive };
    });
    console.log('audio context', state);

    await page.evaluate(() => {
        const A = AlchemicalAudio;
        const dest = A.ctx.createMediaStreamDestination();
        A.limiter.connect(dest);
        const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
        rec.ondataavailable = (e) => {
            if (!e.data.size) return;
            const fr = new FileReader();
            fr.onload = () => window.__saveChunk(String(fr.result).split(',')[1]);
            fr.readAsDataURL(e.data);
        };
        window.__rec = rec;
        rec.start(1000);
        // Real-time moment driver
        window.__t0 = performance.now();
        setInterval(() => window.__applyMoment((performance.now() - window.__t0) / 1000), 50);
    });

    await sleep(5000);
    await page.evaluate(() => Liminal.installation.begin());
    await sleep(3000);
    await page.evaluate(() => Liminal.installation.chooseTone(window.__schedule.tone));
    await sleep(3000);
    await page.evaluate(() => Liminal.installation.startIntro());
    await sleep(5000);
    await page.evaluate(() => Liminal.installation.startWork());
    await sleep((SECONDS - 16) * 1000);
    await page.evaluate(() => new Promise(r => { window.__rec.onstop = r; window.__rec.stop(); }));
    await sleep(800);
    await browser.close();
    console.log('audio done', fs.statSync(file).size, 'bytes');
}

(mode === 'audio' ? audio() : frames()).catch(e => { console.error(e); process.exit(1); });
