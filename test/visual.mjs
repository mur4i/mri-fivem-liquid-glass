// Visual smoke test: loads the demo in headless Chrome and checks the glass canvas pixel by pixel.
// Usage: npm run build && npm test   (CHROME=/path/to/chrome to override, SHOT=out.png to save)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serve } from '../scripts/serve.mjs';

const chromePath = process.env.CHROME || ({
  win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
}[process.platform] ?? 'google-chrome');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const httpPort = 5300 + Math.floor(Math.random() * 300);
const cdpPort = 9600 + Math.floor(Math.random() * 300);
const server = await serve(httpPort);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'liquid-glass-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`, 'about:blank',
]);

// Runs in the page: reads the WebGL glass canvas through a 2D copy.
const probe = `(() => {
  const gl = [...document.querySelectorAll('canvas')].find((c) => c.id !== 'scene');
  if (!gl) return { error: 'glass canvas missing' };
  const copy = document.createElement('canvas');
  copy.width = gl.width;
  copy.height = gl.height;
  const g = copy.getContext('2d');
  g.drawImage(gl, 0, 0);
  const alpha = (x, y) => g.getImageData(Math.round(x), Math.round(y), 1, 1).data[3];
  const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
  const hero = rect('.hero');
  const orb = rect('#orb');
  return {
    heroInside: alpha(hero.left + hero.width / 2, hero.top + hero.height / 2),
    orbInside: alpha(orb.left + orb.width / 2, orb.top + orb.height / 2),
    orbCorner: alpha(orb.left + 4, orb.top + 4),
    outside: alpha(hero.right + 40, hero.bottom + 120),
    tones: [...document.querySelectorAll('[data-glass]')].filter((e) => e.dataset.glassBackdrop).length,
    total: document.querySelectorAll('[data-glass]').length,
  };
})()`;

let failed = false;
try {
  let tabs;
  for (let i = 0; i < 60 && !tabs; i++) {
    await sleep(250);
    tabs = await fetch(`http://127.0.0.1:${cdpPort}/json`).then((r) => r.json()).catch(() => undefined);
  }
  if (!tabs) throw new Error('Chrome did not answer');
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = {};
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending[m.id]) {
      pending[m.id](m.result);
      delete pending[m.id];
    }
    if (m.method === 'Runtime.exceptionThrown') {
      failed = true;
      console.error('page error:', m.params.exceptionDetails.exception?.description);
    }
  };
  const send = (method, params = {}) => new Promise((r) => {
    const i = ++id;
    pending[i] = r;
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/` });

  let r = {};
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const res = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
    r = res.result?.value ?? {};
    if (r.heroInside > 0 && r.tones === r.total) break;
  }
  console.log(JSON.stringify(r));

  const checks = [
    ['glass drawn inside a frosted panel', r.heroInside === 255],
    ['glass drawn inside a liquid orb', r.orbInside === 255],
    ['nothing drawn outside the round orb corner', r.orbCorner === 0],
    ['nothing drawn outside elements', r.outside === 0],
    ['every element got data-glass-backdrop', r.total > 0 && r.tones === r.total],
  ];
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
    if (!ok) failed = true;
  }
  if (process.env.SHOT) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(process.env.SHOT, Buffer.from(shot.data, 'base64'));
  }
  ws.close();
} catch (err) {
  failed = true;
  console.error(err);
} finally {
  chrome.kill();
  server.close();
}
process.exit(failed ? 1 : 0);
