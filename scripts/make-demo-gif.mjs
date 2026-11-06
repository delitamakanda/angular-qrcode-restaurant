#!/usr/bin/env node
// Converts the video recorded by `playwright.demo.config.ts` into docs/demo/demo.gif.
// Requires `ffmpeg` (with palettegen/paletteuse); the GIF is committed, so only
// people regenerating it need ffmpeg.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const VIDEO_DIR = 'test-results/demo';
const OUT_FILE = 'docs/demo/demo.gif';
const WIDTH = 360;
const FPS = 10;

function findVideo(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findVideo(path);
      if (found) return found;
    } else if (entry.name.endsWith('.webm')) {
      return path;
    }
  }
  return null;
}

function ffmpegArgs(input, output) {
  const scale = `fps=${FPS},scale=${WIDTH}:-1:flags=lanczos`;
  const palette = 'palettegen=max_colors=96:stats_mode=diff';
  const use = 'paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle';
  return [
    '-y',
    '-i',
    input,
    '-vf',
    `${scale},split[a][b];[a]${palette}[p];[b][p]${use}`,
    '-loop',
    '0',
    output,
  ];
}

if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error(
    'ffmpeg is required to build the demo GIF (e.g. `apt install ffmpeg` or `brew install ffmpeg`).',
  );
  process.exit(1);
}
const video = findVideo(VIDEO_DIR);
if (!video) {
  console.error(`No .webm video found in ${VIDEO_DIR}. Did the Playwright demo run?`);
  process.exit(1);
}
mkdirSync('docs/demo', { recursive: true });
const result = spawnSync('ffmpeg', ffmpegArgs(video, OUT_FILE), { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`${OUT_FILE}: ${(statSync(OUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
