// Copies the on-device face-check engine (MediaPipe WASM) into the built site
// at /face/wasm, so the seller selfie step doesn't depend on an outside CDN.
// Runs after `vite build`; the files are too big to keep in git.
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const from = 'node_modules/@mediapipe/tasks-vision/wasm';
const to = 'dist/face/wasm';
if (!existsSync(from)) {
  console.error(`[copy-face-wasm] ${from} not found — run npm install`);
  process.exit(1);
}
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log(`[copy-face-wasm] copied to ${to}`);
