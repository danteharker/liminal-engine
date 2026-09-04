// Mux out/frames + out/audio.webm into out/liminal-engine-90s.mp4 using the bundled ffmpeg.
const { spawnSync } = require('child_process');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const out = path.join(__dirname, 'out');
const args = [
    '-y', '-framerate', '30', '-i', path.join(out, 'frames', '%05d.png'),
    '-i', path.join(out, 'audio.webm'),
    '-vf', 'fade=t=in:d=1.5,fade=t=out:st=87:d=3,format=yuv420p',
    '-af', 'afade=t=in:d=1.5,afade=t=out:st=86.5:d=3.5',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-c:a', 'aac', '-b:a', '192k', '-t', '90', '-movflags', '+faststart',
    path.join(out, 'liminal-engine-90s.mp4')
];
const r = spawnSync(ffmpeg, args, { stdio: 'inherit' });
process.exit(r.status);
