// Procedural sunset city that stands in for the GTA frame outside the game (seeded, so tests are stable).
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function palm(g, x, base, h, s) {
  g.strokeStyle = '#1a0f1f';
  g.lineWidth = 7 * s;
  g.beginPath();
  g.moveTo(x, base);
  g.quadraticCurveTo(x + 18 * s, base - h * 0.5, x + 8 * s, base - h);
  g.stroke();
  g.fillStyle = '#1a0f1f';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.beginPath();
    g.moveTo(x + 8 * s, base - h);
    g.quadraticCurveTo(
      x + 8 * s + Math.cos(a) * 60 * s, base - h + Math.sin(a) * 18 * s - 20 * s,
      x + 8 * s + Math.cos(a) * 95 * s, base - h + Math.abs(Math.sin(a)) * 45 * s,
    );
    g.lineTo(x + 8 * s + Math.cos(a) * 80 * s, base - h + Math.abs(Math.sin(a)) * 40 * s);
    g.closePath();
    g.fill();
  }
}

export function paintScene(canvas, w = window.innerWidth, h = window.innerHeight, seed = 7) {
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  const rand = rng(seed);
  const horizon = h * 0.62;

  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#1b1446');
  sky.addColorStop(0.45, '#7a2a6e');
  sky.addColorStop(0.8, '#f2674a');
  sky.addColorStop(1, '#ffc56b');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, horizon);

  const sun = g.createRadialGradient(w * 0.68, horizon - h * 0.06, 0, w * 0.68, horizon - h * 0.06, h * 0.35);
  sun.addColorStop(0, 'rgba(255, 236, 170, 1)');
  sun.addColorStop(0.18, 'rgba(255, 190, 110, 0.9)');
  sun.addColorStop(1, 'rgba(255, 120, 80, 0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, w, horizon);

  for (let layer = 0; layer < 3; layer++) {
    const shade = ['#3b2350', '#2a1838', '#170d22'][layer];
    let x = -20;
    while (x < w) {
      const bw = (40 + rand() * 90) * (1 + layer * 0.4);
      const bh = h * (0.08 + rand() * (0.2 + layer * 0.07));
      g.fillStyle = shade;
      g.fillRect(x, horizon - bh, bw, bh);
      if (layer > 0) {
        for (let wy = horizon - bh + 10; wy < horizon - 8; wy += 14) {
          for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
            if (rand() < 0.35) {
              g.fillStyle = rand() < 0.8 ? 'rgba(255, 214, 140, 0.85)' : 'rgba(140, 220, 255, 0.85)';
              g.fillRect(wx, wy, 5, 7);
            }
          }
        }
      }
      x += bw + rand() * 12;
    }
  }

  const neon = ['#ff3fa4', '#36f1ff', '#7dff6a', '#ffd23f', '#b44bff'];
  for (let i = 0; i < 14; i++) {
    const nx = rand() * w;
    const ny = horizon - h * (0.03 + rand() * 0.18);
    g.shadowColor = neon[i % neon.length];
    g.shadowBlur = 18;
    g.fillStyle = neon[i % neon.length];
    g.fillRect(nx, ny, 40 + rand() * 70, 6 + rand() * 6);
  }
  g.shadowBlur = 0;

  const road = g.createLinearGradient(0, horizon, 0, h);
  road.addColorStop(0, '#2b1a2c');
  road.addColorStop(1, '#0b0710');
  g.fillStyle = road;
  g.fillRect(0, horizon, w, h - horizon);

  for (let i = 0; i < 26; i++) {
    const y = horizon + 8 + rand() * (h - horizon - 10);
    const len = 120 + rand() * 360;
    const x = rand() * w;
    const warm = rand() < 0.55;
    const trail = g.createLinearGradient(x, y, x + len, y);
    trail.addColorStop(0, 'rgba(0,0,0,0)');
    trail.addColorStop(1, warm ? 'rgba(255, 70, 60, 0.9)' : 'rgba(255, 245, 220, 0.9)');
    g.fillStyle = trail;
    g.fillRect(x, y, len, 2 + (y - horizon) / 60);
  }

  g.fillStyle = 'rgba(255, 210, 120, 0.85)';
  for (let x = 0; x < w; x += 70) g.fillRect(x, horizon + (h - horizon) * 0.55, 34, 4);

  const s = h / 1080;
  palm(g, w * 0.08, h * 0.98, h * 0.55, s * 1.2);
  palm(g, w * 0.22, h * 0.96, h * 0.42, s);
  palm(g, w * 0.9, h * 0.99, h * 0.6, s * 1.3);
  return canvas;
}
