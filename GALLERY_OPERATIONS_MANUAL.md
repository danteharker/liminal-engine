# Liminal Engine — Operations

Daily procedure for invigilators and technical staff.

---

## 1. Morning

1. Power on the audio (monitors, then sub) and the projector or display.
2. Power on the computer and log in to the exhibition account.
3. Double-click `run.bat` (Windows) or run `node server.js`. The browser opens at `http://localhost:8080/`.
4. If the browser is not already in kiosk mode, press **Shift + F** for fullscreen.
5. If asked, allow the camera. The prompt appears once.
6. Press **Shift + C** and check the monitor line reads `sensor camera`. If it reads `pointer (camera dark)`, the camera is covered, unplugged, or the room is too dark for it. Close the panel with **Esc**.
7. Sit on the bench for a minute and confirm the sphere begins to settle and lighten.

---

## 2. What a visitor sees

- **Resting**: the sphere and rings, live, responding to movement in the room, in the colour of the curator's default tone. The title, one sentence, and a **Touch to begin** button. Above them, sentences left by previous visitors fade in and out.
- **Step 1, Choose your tone**: six tones, each named for a planet and its metal, each with a colour. Tapping one changes the sound and the colour of the room straight away. A **Frame drum: on/off** toggle. **Next**.
- **Step 2, How it works**: three numbered lines (sit, look, stay still for two minutes) and an **I'm ready** button. It begins on its own after 15 seconds.
- **The work**: two minutes by default. The stage name (Caput Corvi, Albedo, Citrinitas, Rubedo) appears quietly in the bottom-left as it changes. A hairline along the bottom edge shows time. If the visitor keeps moving, *Be still. The metal is listening.* fades in until they stop. A small *end* in the bottom-right stops early.
- **Return**: three bells, *Welcome back. The work is complete.*
- **The question**: *What did you notice in the space between thoughts?* One field. *Inscribe* or *Leave nothing*. After 45 seconds of no typing it moves on by itself.
- **Back to resting**. Anything inscribed is now engraved on the outer ring and joins the rotating line. The room returns to the curator's default tone.

Nobody has to do anything for the piece to run. It rests when nobody is there and it comes back to rest on its own.

---

## 3. Curator panel — Shift + C

| Setting | What it does |
| :--- | :--- |
| Session | Length of the work: 1, 1.5, 2, 3 or 5 minutes (default 2) |
| Idle return | How long an abandoned choice screen waits before returning to rest |
| Tuning | The default tone, heard and seen while the piece rests. Six choices, named by the planetary metals. Default 432 Hz · Sol |
| Visitor chooses the tone | On by default. Turn off to skip Step 1 and run every sitting on the default tone |
| Bellows | Frame drum on or off by default, and its pattern (Pulse, Heartbeat, Roll). Visitors can switch the drum on or off for their own sitting |
| Volume | Room level. Mute is separate and immediate |
| Camera sensor | Turn the camera off to run on touch and device motion only |
| Render scale | 1.0 on modest machines, 2.0 for 4K on a capable GPU |
| Kiosk lock | Blocks right-click, F5, Ctrl+R/W/U/S and drag. Leave on |
| Fullscreen | Same as Shift + F |
| Inscriptions | Every sentence visitors have left. *remove* deletes one. *export* saves them all as JSON. *clear* removes all of them |

The monitor line shows what the sensor is using, a live movement meter, and the current stage and progress.

Settings are remembered between restarts.

---

## 4. Wall text — Shift + P

Shows the wall text on screen. **Esc** or *close* dismisses it.

---

## 5. Keys

| Key | Action |
| :--- | :--- |
| Touch / click / Space / Enter | Begin a session (when resting) |
| Esc | End a session early; close any panel |
| Shift + C | Curator panel |
| Shift + P | Wall text |
| Shift + F | Fullscreen |

---

## 6. If something looks wrong

- **Sphere never lightens while someone sits still**: check Shift + C. If the sensor line reads `pointer`, the camera is not being used. Check it is connected and uncovered, and that there is a little light on the sitter.
- **Sphere goes gold while nobody is there**: normal in a quiet room. Outside a session it stops at silver; it only goes fully gold during a session.
- **No sound**: a browser needs one touch or click before it can make sound. Touch the screen once. Then check mute in Shift + C.
- **Page is blank**: the server is not running. Re-run `run.bat`.

---

## 7. Evening

1. **Shift + C**, then *export* if you want to keep the day's inscriptions.
2. Close the browser (Alt + F4) and the `run.bat` window.
3. Power down the sub, then the monitors, then the projector, then the computer.
