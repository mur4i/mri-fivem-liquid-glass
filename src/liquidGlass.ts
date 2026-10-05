/**
 * Liquid glass for FiveM NUI: the live game frame, blurred (and refracted at the rim) behind
 * every element marked with `data-glass`.
 *
 * CSS `backdrop-filter` in the FiveM CEF only sees the page itself; the game is composited
 * underneath later. Here the game frame enters as a WebGL texture through the Cfx.re NUI hook
 * (the same one screenshot-basic uses), is blurred on a canvas behind the UI and stamped in the
 * shape of each element (border-radius, ancestor opacity, overflow clipping).
 *
 * Markup:
 * - `data-glass`: frosted glass (blur only).
 * - `data-glass="liquid"`: bevelled rim that refracts the sharp backdrop, with color split and
 *   specular highlight. Per element: `data-glass-bezel` (px), `data-glass-refraction` (px),
 *   `data-glass-dispersion` (0..1), `data-glass-specular` (0..1).
 * - Output: `data-glass-backdrop="bright|dark"` on each element, from the backdrop luminance.
 *
 * Outside the game it only runs with `fallbackImage` (dev, demos, screenshots).
 */

export interface GameGlassOptions {
  /** Selector of the glass elements. */
  selector?: string
  /** Blur buffer size relative to the screen. */
  scale?: number
  /** Gaussian sigma in screen px. */
  blur?: number
  saturation?: number
  darken?: number
  /** Weight of each new frame at 60 fps, scaled by the real frame time (1 disables smoothing). */
  temporal?: number
  /** Canvas z-index; the UI root must sit above it. */
  zIndex?: number
  /** Interval (ms) between `data-glass-backdrop` updates. */
  toneInterval?: number
  /** Specular light direction in screen coordinates (y down). */
  light?: [number, number]
  /** Image used instead of the game outside FiveM: URL or image source. */
  fallbackImage?: string | TexImageSource | null
}

export interface GameGlassHandle {
  /** Re-reads radius, clipping and attributes after an inline `style` change. */
  refresh: () => void
  stop: () => void
}

interface Target {
  tex: WebGLTexture
  fbo: WebGLFramebuffer
  w: number
  h: number
}

interface Program {
  p: WebGLProgram
  u: Record<string, WebGLUniformLocation | null>
}

interface Resources {
  quad: WebGLBuffer
  copy: Program
  down: Program
  blur: Program
  mix: Program
  compose: Program
  game: WebGLTexture
  thumb: Target
  pbo: WebGLBuffer
  pixels: Uint8Array
  sharp: Target | null
  sharpNext: Target | null
  src: Target | null
  ping: Target | null
  pong: Target | null
  histA: Target | null
  histB: Target | null
  hist: Target | null
}

interface Meta {
  radius: string
  shape: number
  lensMode: number
  facets: number | null
  liquid: boolean
  bezel: number | null
  refraction: number | null
  dispersion: number | null
  specular: number | null
  clip: Element | null
}

interface Item {
  el: HTMLElement
  rect: DOMRect
  alpha: number
  m: Meta
  clip: { left: number; top: number; right: number; bottom: number } | null
}

const DEFAULTS = {
  selector: '[data-glass]',
  scale: 0.25,
  blur: 14,
  saturation: 1.15,
  darken: 1,
  temporal: 0.45,
  zIndex: 0,
  toneInterval: 200,
  light: [-0.6, -0.8] as [number, number],
  fallbackImage: null as string | TexImageSource | null,
}

const THUMB_W = 32
const THUMB_H = 18
const DARK_CHANNEL = 10

// Timing is in ms, so it behaves the same at 30 or 144 fps.
const FRAME_REF_MS = 1000 / 60
const FENCE_TIMEOUT_MS = 4000 // GPU never answered the readback: rebuild everything
const BLACK_REHOOK_MS = 2500 // black this long means the hook dropped: bind it again
const REHOOK_GAP_MS = 4000
const FLASH_HOLD_MS = 800 // longest dark transition (loading fade, menu) hidden behind the last good frame
const FLASH_DARK_JUMP = 0.08 // share of dark pixels above its running average
const FLASH_MEAN_DROP = 0.55 // brightness below this fraction of its running average
const FLASH_MIN_MEAN = 26 // about 10%: below it the scene is simply dark, not flashing
const AVERAGE_HALF_LIFE_MS = 250
// Gamma luma ~0.46 (linear ~0.18) is where black and white text contrast equally; hysteresis around it.
const TONE_BRIGHT = 0.52
const TONE_DARK = 0.4
const NOOP: GameGlassHandle = { refresh() {}, stop() {} }

const VERT_FULL = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`

const VERT_RECT = `
attribute vec2 a_pos;
uniform vec4 u_rect;
uniform vec2 u_res;
void main() {
  vec2 px = u_rect.xy + (a_pos * 0.5 + 0.5) * u_rect.zw;
  gl_Position = vec4(px / u_res * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAG_COPY = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
void main() { gl_FragColor = texture2D(u_tex, v_uv); }`

// 4 bilinear fetches per output texel, so halving the frame does not shimmer
const FRAG_DOWN = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_texel;
void main() {
  vec2 o = u_texel * 0.25;
  gl_FragColor = 0.25 * (texture2D(u_tex, v_uv + vec2(-o.x, -o.y)) + texture2D(u_tex, v_uv + vec2(o.x, -o.y))
    + texture2D(u_tex, v_uv + vec2(-o.x, o.y)) + texture2D(u_tex, v_uv + vec2(o.x, o.y)));
}`

// 9-tap gaussian folded into 5 linear fetches
const FRAG_BLUR = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_step;
void main() {
  vec4 c = texture2D(u_tex, v_uv) * 0.2270270270;
  c += texture2D(u_tex, v_uv + u_step * 1.3846153846) * 0.3162162162;
  c += texture2D(u_tex, v_uv - u_step * 1.3846153846) * 0.3162162162;
  c += texture2D(u_tex, v_uv + u_step * 3.2307692308) * 0.0702702703;
  c += texture2D(u_tex, v_uv - u_step * 3.2307692308) * 0.0702702703;
  gl_FragColor = c;
}`

const FRAG_MIX = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform sampler2D u_prev;
uniform float u_mix;
void main() { gl_FragColor = mix(texture2D(u_prev, v_uv), texture2D(u_tex, v_uv), u_mix); }`

const FRAG_COMPOSE = `
precision highp float;
uniform sampler2D u_blur;
uniform sampler2D u_sharp;
uniform vec2 u_res;
uniform vec4 u_rect;
uniform float u_radius;
uniform float u_alpha;
uniform float u_sat;
uniform float u_darken;
uniform float u_bezel;
uniform float u_refract;
uniform float u_dispersion;
uniform float u_specular;
uniform vec2 u_light;
uniform float u_shape;
uniform float u_lens;
uniform float u_facets;
float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
float ndot(vec2 a, vec2 b) { return a.x * b.x - a.y * b.y; }
float rhombus(vec2 p, vec2 b, float r) {
  vec2 k = max(b - r * vec2(length(b) / b.y, length(b) / b.x), vec2(1.0));
  p = abs(p);
  float h = clamp(ndot(k - 2.0 * p, k) / dot(k, k), -1.0, 1.0);
  float d = length(p - 0.5 * k * vec2(1.0 - h, 1.0 + h));
  return d * sign(p.x * k.y + p.y * k.x - k.x * k.y) - r;
}
float shape(vec2 p, vec2 b, float r) { return u_shape > 0.5 ? rhombus(p, b, r) : box(p, b, r); }
vec3 sharpAt(vec2 px, vec2 spread) {
  return vec3(texture2D(u_sharp, (px + spread) / u_res).r, texture2D(u_sharp, px / u_res).g,
    texture2D(u_sharp, (px - spread) / u_res).b);
}
vec3 grade(vec3 c) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), c, u_sat) * u_darken;
}
void main() {
  vec2 hs = u_rect.zw * 0.5;
  vec2 center = u_rect.xy + hs;
  vec2 p = gl_FragCoord.xy - center;
  float d = shape(p, hs, u_radius);
  float a = clamp(0.5 - d, 0.0, 1.0) * u_alpha;
  if (a <= 0.0) discard;
  vec2 frag = gl_FragCoord.xy;
  vec2 n = normalize(vec2(shape(p + vec2(1.0, 0.0), hs, u_radius) - d, shape(p + vec2(0.0, 1.0), hs, u_radius) - d) + 1e-5);
  float rim = u_bezel > 0.0 ? 1.0 - clamp(-d / u_bezel, 0.0, 1.0) : 0.0;
  float size = min(hs.x, hs.y);
  float seg = 6.2831853 / max(u_facets, 2.0);
  float ang = atan(p.y, p.x);
  float r = length(p);
  vec3 c;
  if (u_lens > 1.5) {
    // Kaleidoscope: fold the angle into one mirrored wedge and read the backdrop behind it.
    float w = abs(mod(ang, seg) - 0.5 * seg);
    // The wedge points up and reaches past the element, so each slice carries more of the scene.
    vec2 q = vec2(sin(w), cos(w)) * r * 1.8;
    c = grade(sharpAt(center + q, vec2(u_dispersion * 3.0, 0.0)));
  } else if (u_lens > 0.5) {
    // Gem: a flat table in the middle and angled facets around it, each bending the backdrop its own way.
    float k = floor(ang / seg + 0.5);
    vec2 fn = vec2(cos(k * seg), sin(k * seg));
    float table = 0.42 * size;
    bool crown = r > table;
    vec2 off = crown ? fn * u_refract * (0.5 + r / size) : -p * 0.3;
    c = grade(sharpAt(frag + off, off * u_dispersion * 0.6));
    c *= crown ? 0.82 + 0.3 * dot(fn, u_light) : 1.06;
    float edge = crown ? min(abs(fract(ang / seg + 0.5) - 0.5) * seg * r, abs(r - table)) : abs(r - table);
    c += u_specular * (1.0 - smoothstep(0.0, 1.6, edge)) * 0.9;
  } else if (u_bezel > 0.0) {
    // Convex bezel: the surface tilts harder toward the rim, so it pulls the backdrop from outside.
    vec2 off = n * pow(rim, 2.2) * u_refract;
    vec3 blur = texture2D(u_blur, (frag + off * 0.5) / u_res).rgb;
    c = grade(mix(blur, sharpAt(frag + off, off * u_dispersion * 0.3), smoothstep(0.15, 0.85, rim) * 0.9));
  } else {
    c = grade(texture2D(u_blur, frag / u_res).rgb);
  }
  if (u_bezel > 0.0) {
    float lit = max(dot(n, u_light), 0.0) + 0.35 * max(-dot(n, u_light), 0.0);
    c += u_specular * lit * pow(rim, 7.0);
  }
  gl_FragColor = vec4(min(c, 1.0) * a, a);
}`

function isInGame(): boolean {
  return typeof (window as unknown as { GetParentResourceName?: unknown }).GetParentResourceName === 'function'
    && !location.search.includes('mode=dui')
}

function num(v: string | undefined): number | null {
  if (v === undefined || v === '') return null
  const n = parseFloat(v)
  return Number.isNaN(n) ? null : n
}

export function startGameGlass(options: GameGlassOptions = {}): GameGlassHandle {
  const o = { ...DEFAULTS, ...options }
  const inGame = isInGame()
  if (!inGame && !o.fallbackImage) return NOOP

  const lightLen = Math.hypot(o.light[0], o.light[1]) || 1
  const light: [number, number] = [o.light[0] / lightLen, -o.light[1] / lightLen]

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed', left: '0', top: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: String(o.zIndex),
  })
  document.body.insertBefore(canvas, document.body.firstChild)

  let gl: WebGL2RenderingContext | null = null
  let r: Resources | null = null
  let lost = false
  let running = false
  let raf = 0
  let elements: HTMLElement[] = []
  let meta = new WeakMap<Element, Meta>()
  let fallbackSource: TexImageSource | null = null

  let fence: WebGLSync | null = null
  let fenceStart = 0
  let blurReady = false
  let blurChanged = false
  let lastKey = ''
  let cleared = true
  let blackSince = 0
  let flashSince = 0
  let lastAccept = 0
  let lastBlur = 0
  let meanAvg = 0
  let darkAvg = 0
  let lastRehook = 0
  let lastTone = 0
  const tones = new WeakMap<Element, string>()

  function compile(g: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const s = g.createShader(type)
    if (!s) throw new Error('[liquid-glass] createShader failed')
    g.shaderSource(s, src)
    g.compileShader(s)
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(`[liquid-glass] ${g.getShaderInfoLog(s)}`)
    return s
  }

  function program(g: WebGL2RenderingContext, vert: string, frag: string, uniforms: string[], samplers: Record<string, number> = {}): Program {
    const p = g.createProgram()
    if (!p) throw new Error('[liquid-glass] createProgram failed')
    g.attachShader(p, compile(g, g.VERTEX_SHADER, vert))
    g.attachShader(p, compile(g, g.FRAGMENT_SHADER, frag))
    g.bindAttribLocation(p, 0, 'a_pos')
    g.linkProgram(p)
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(`[liquid-glass] ${g.getProgramInfoLog(p)}`)
    const u: Program['u'] = {}
    for (const name of uniforms) u[name] = g.getUniformLocation(p, name)
    g.useProgram(p)
    for (const [name, unit] of Object.entries(samplers)) g.uniform1i(u[name], unit)
    return { p, u }
  }

  function target(g: WebGL2RenderingContext, w: number, h: number): Target {
    const tex = g.createTexture()
    const fbo = g.createFramebuffer()
    if (!tex || !fbo) throw new Error('[liquid-glass] target allocation failed')
    g.bindTexture(g.TEXTURE_2D, tex)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    g.bindFramebuffer(g.FRAMEBUFFER, fbo)
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0)
    g.bindFramebuffer(g.FRAMEBUFFER, null)
    return { tex, fbo, w, h }
  }

  function freeTarget(g: WebGL2RenderingContext, t: Target | null) {
    if (!t) return
    g.deleteFramebuffer(t.fbo)
    g.deleteTexture(t.tex)
  }

  // CEF swaps this texture for the game frame; the exact call order is what the hook matches.
  function gameTexture(g: WebGL2RenderingContext): WebGLTexture {
    const tex = g.createTexture()
    if (!tex) throw new Error('[liquid-glass] createTexture failed')
    g.bindTexture(g.TEXTURE_2D, tex)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]))
    g.texParameterf(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
    g.texParameterf(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR)
    g.texParameterf(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
    g.texParameterf(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    g.texParameterf(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.MIRRORED_REPEAT)
    g.texParameterf(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.REPEAT)
    g.texParameterf(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    return tex
  }

  function uploadFallback() {
    if (!gl || !r || !fallbackSource) return
    gl.bindTexture(gl.TEXTURE_2D, r.game)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fallbackSource)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  }

  function init(): boolean {
    const g = canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
      preserveDrawingBuffer: true, failIfMajorPerformanceCaveat: false,
    })
    if (!g) {
      console.error('[liquid-glass] WebGL2 unavailable')
      return false
    }
    gl = g
    const quad = g.createBuffer()
    const pbo = g.createBuffer()
    if (!quad || !pbo) return false
    g.bindBuffer(g.ARRAY_BUFFER, quad)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0)
    g.enableVertexAttribArray(0)
    const pixels = new Uint8Array(THUMB_W * THUMB_H * 4)
    g.bindBuffer(g.PIXEL_PACK_BUFFER, pbo)
    g.bufferData(g.PIXEL_PACK_BUFFER, pixels.byteLength, g.STREAM_READ)
    g.bindBuffer(g.PIXEL_PACK_BUFFER, null)
    r = {
      quad,
      copy: program(g, VERT_FULL, FRAG_COPY, ['u_tex'], { u_tex: 0 }),
      down: program(g, VERT_FULL, FRAG_DOWN, ['u_tex', 'u_texel'], { u_tex: 0 }),
      blur: program(g, VERT_FULL, FRAG_BLUR, ['u_tex', 'u_step'], { u_tex: 0 }),
      mix: program(g, VERT_FULL, FRAG_MIX, ['u_tex', 'u_prev', 'u_mix'], { u_tex: 0, u_prev: 1 }),
      compose: program(g, VERT_RECT, FRAG_COMPOSE, [
        'u_blur', 'u_sharp', 'u_res', 'u_rect', 'u_radius', 'u_alpha', 'u_sat', 'u_darken',
        'u_bezel', 'u_refract', 'u_dispersion', 'u_specular', 'u_light', 'u_shape', 'u_lens', 'u_facets',
      ], { u_blur: 0, u_sharp: 1 }),
      game: gameTexture(g),
      thumb: target(g, THUMB_W, THUMB_H),
      pbo,
      pixels,
      sharp: null, sharpNext: null, src: null, ping: null, pong: null, histA: null, histB: null, hist: null,
    }
    uploadFallback()
    resize()
    return true
  }

  function dispose() {
    if (!gl || !r) return
    const g = gl
    if (fence) g.deleteSync(fence)
    fence = null
    for (const t of [r.sharp, r.sharpNext, r.src, r.ping, r.pong, r.histA, r.histB, r.thumb]) freeTarget(g, t)
    for (const p of [r.copy, r.down, r.blur, r.mix, r.compose]) g.deleteProgram(p.p)
    g.deleteTexture(r.game)
    g.deleteBuffer(r.pbo)
    g.deleteBuffer(r.quad)
    r = null
  }

  function resize() {
    if (!gl || !r) return
    const g = gl
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(window.innerWidth * dpr))
    canvas.height = Math.max(1, Math.round(window.innerHeight * dpr))
    const size = (s: number): [number, number] =>
      [Math.max(1, Math.round(canvas.width * s)), Math.max(1, Math.round(canvas.height * s))]
    const [sw, sh] = size(Math.min(1, o.scale * 2))
    const [bw, bh] = size(o.scale)
    for (const t of [r.sharp, r.sharpNext, r.src, r.ping, r.pong, r.histA, r.histB]) freeTarget(g, t)
    r.sharp = target(g, sw, sh)
    r.sharpNext = target(g, sw, sh)
    r.src = target(g, bw, bh)
    r.ping = target(g, bw, bh)
    r.pong = target(g, bw, bh)
    r.histA = target(g, bw, bh)
    r.histB = target(g, bw, bh)
    r.hist = null
    blurReady = false
    lastKey = ''
  }

  function pass(g: WebGL2RenderingContext, prog: Program, tex: WebGLTexture, dst: Target | null) {
    g.bindFramebuffer(g.FRAMEBUFFER, dst ? dst.fbo : null)
    g.viewport(0, 0, dst ? dst.w : canvas.width, dst ? dst.h : canvas.height)
    g.useProgram(prog.p)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, tex)
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4)
  }

  function down(g: WebGL2RenderingContext, res: Resources, tex: WebGLTexture, dst: Target) {
    g.useProgram(res.down.p)
    g.uniform2f(res.down.u.u_texel, 1 / dst.w, 1 / dst.h)
    pass(g, res.down, tex, dst)
  }

  // Frame goes to sharpNext; it only becomes the visible sharp frame once the readback approves it.
  function capture(g: WebGL2RenderingContext, res: Resources, now: number) {
    if (!res.sharpNext || !res.src) return
    down(g, res, res.game, res.sharpNext)
    down(g, res, res.sharpNext.tex, res.src)
    pass(g, res.copy, res.src.tex, res.thumb)
    g.bindBuffer(g.PIXEL_PACK_BUFFER, res.pbo)
    g.readPixels(0, 0, THUMB_W, THUMB_H, g.RGBA, g.UNSIGNED_BYTE, 0)
    g.bindBuffer(g.PIXEL_PACK_BUFFER, null)
    g.bindFramebuffer(g.FRAMEBUFFER, null)
    fence = g.fenceSync(g.SYNC_GPU_COMMANDS_COMPLETE, 0)
    g.flush()
    fenceStart = now
  }

  // Async readback of the 32x18 thumbnail; false while pending or when the frame looks broken.
  function readback(g: WebGL2RenderingContext, res: Resources, now: number): boolean {
    if (!fence) return false
    const st = g.clientWaitSync(fence, 0, 0)
    if (st === g.TIMEOUT_EXPIRED) {
      if (now - fenceStart > FENCE_TIMEOUT_MS) rebuild()
      return false
    }
    g.deleteSync(fence)
    fence = null
    if (st === g.WAIT_FAILED) return false
    g.bindBuffer(g.PIXEL_PACK_BUFFER, res.pbo)
    g.getBufferSubData(g.PIXEL_PACK_BUFFER, 0, res.pixels)
    g.bindBuffer(g.PIXEL_PACK_BUFFER, null)

    const px = res.pixels
    const count = THUMB_W * THUMB_H
    let sum = 0
    let dark = 0
    for (let i = 0; i < px.length; i += 4) {
      const m = Math.max(px[i], px[i + 1], px[i + 2])
      sum += m
      if (m < DARK_CHANNEL) dark++
    }
    const mean = sum / count
    const darkRatio = dark / count

    if (dark === count) {
      if (!blackSince) blackSince = now
      if (inGame && now - blackSince > BLACK_REHOOK_MS && now - lastRehook > REHOOK_GAP_MS) {
        g.deleteTexture(res.game)
        res.game = gameTexture(g)
        lastRehook = now
        blackSince = now
      }
      return false
    }
    blackSince = 0
    // Loading screens and transitions flash dark for a moment; keep the last good blur meanwhile.
    const first = lastAccept === 0
    const flash = !first && (darkRatio > darkAvg + FLASH_DARK_JUMP
      || (meanAvg > FLASH_MIN_MEAN && mean < meanAvg * FLASH_MEAN_DROP))
    if (flash) {
      if (!flashSince) flashSince = now
      if (now - flashSince < FLASH_HOLD_MS) return false
    }
    flashSince = 0
    const k = first ? 1 : 1 - 0.5 ** ((now - lastAccept) / AVERAGE_HALF_LIFE_MS)
    meanAvg += (mean - meanAvg) * k
    darkAvg += (darkRatio - darkAvg) * k
    lastAccept = now
    return true
  }

  function blurSource(g: WebGL2RenderingContext, res: Resources, now: number) {
    const { src, ping, pong, histA, histB } = res
    if (!src || !ping || !pong || !histA || !histB) return
    const swap = res.sharp
    res.sharp = res.sharpNext
    res.sharpNext = swap

    // Short taps (<= 1.5 texels) avoid ringing on thin details; strength comes from the pass count.
    const sigma = o.blur * o.scale
    const passes = Math.min(8, Math.max(1, Math.ceil((sigma / 2.4) ** 2)))
    const step = sigma / (1.6 * Math.sqrt(passes))
    let input = src
    for (let i = 0; i < passes; i++) {
      g.useProgram(res.blur.p)
      g.uniform2f(res.blur.u.u_step, step / src.w, 0)
      pass(g, res.blur, input.tex, ping)
      g.uniform2f(res.blur.u.u_step, 0, step / src.h)
      pass(g, res.blur, ping.tex, pong)
      input = pong
    }
    if (res.hist && o.temporal < 1) {
      const next = res.hist === histA ? histB : histA
      g.useProgram(res.mix.p)
      // Same smoothing at any frame rate: the 60 fps weight scaled by the real gap since the last blur.
      const gap = lastBlur ? Math.min(now - lastBlur, 250) : FRAME_REF_MS
      g.uniform1f(res.mix.u.u_mix, 1 - (1 - o.temporal) ** (gap / FRAME_REF_MS))
      g.activeTexture(g.TEXTURE1)
      g.bindTexture(g.TEXTURE_2D, res.hist.tex)
      pass(g, res.mix, pong.tex, next)
      res.hist = next
    } else {
      pass(g, res.copy, pong.tex, histA)
      res.hist = histA
    }
    lastBlur = now
    blurReady = true
    blurChanged = true
  }

  function info(el: HTMLElement): Meta {
    const cached = meta.get(el)
    if (cached) return cached
    let clip: Element | null = null
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p)
      if (ps.overflowX !== 'visible' || ps.overflowY !== 'visible') {
        clip = p
        break
      }
    }
    const d = el.dataset
    const m: Meta = {
      radius: getComputedStyle(el).borderTopLeftRadius,
      shape: d.glassShape === 'diamond' ? 1 : 0,
      lensMode: d.glassLens === 'gem' ? 1 : d.glassLens === 'kaleidoscope' ? 2 : 0,
      facets: num(d.glassFacets),
      liquid: d.glass === 'liquid',
      bezel: num(d.glassBezel),
      refraction: num(d.glassRefraction),
      dispersion: num(d.glassDispersion),
      specular: num(d.glassSpecular),
      clip,
    }
    meta.set(el, m)
    return m
  }

  function opacity(el: Element, memo: Map<Element, number>): number {
    const chain: Element[] = []
    let acc = 1
    for (let p: Element | null = el; p && p !== document.documentElement; p = p.parentElement) {
      const known = memo.get(p)
      if (known !== undefined) {
        acc = known
        break
      }
      chain.push(p)
    }
    for (let i = chain.length - 1; i >= 0; i--) {
      const v = parseFloat(getComputedStyle(chain[i]).opacity)
      if (!Number.isNaN(v)) acc *= v
      memo.set(chain[i], acc)
    }
    return acc
  }

  function visibleItems(): Item[] {
    const memo = new Map<Element, number>()
    const items: Item[] = []
    for (const el of elements) {
      if (!el.isConnected) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) continue
      if (getComputedStyle(el).visibility === 'hidden') continue
      const alpha = opacity(el, memo)
      if (alpha < 0.01) continue
      const m = info(el)
      let clip: Item['clip'] = null
      if (m.clip) {
        const c = m.clip.getBoundingClientRect()
        const left = Math.max(rect.left, c.left)
        const top = Math.max(rect.top, c.top)
        const right = Math.min(rect.right, c.right)
        const bottom = Math.min(rect.bottom, c.bottom)
        if (right <= left || bottom <= top) continue
        clip = { left, top, right, bottom }
      }
      items.push({ el, rect, alpha, m, clip })
    }
    return items
  }

  function updateTones(res: Resources, items: Item[]) {
    const px = res.pixels
    const W = window.innerWidth
    const H = window.innerHeight
    for (const { el, rect } of items) {
      const x0 = Math.max(0, Math.floor((rect.left / W) * THUMB_W))
      const x1 = Math.min(THUMB_W - 1, Math.floor((rect.right / W) * THUMB_W))
      const y0 = Math.max(0, Math.floor((1 - rect.bottom / H) * THUMB_H))
      const y1 = Math.min(THUMB_H - 1, Math.floor((1 - rect.top / H) * THUMB_H))
      let sum = 0
      let n = 0
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = (y * THUMB_W + x) * 4
          sum += (px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722) / 255
          n++
        }
      }
      if (!n) continue
      const luma = sum / n
      const prev = tones.get(el) ?? 'dark'
      const tone = prev === 'dark' ? (luma > TONE_BRIGHT ? 'bright' : 'dark') : (luma < TONE_DARK ? 'dark' : 'bright')
      if (tone !== prev || el.dataset.glassBackdrop !== tone) {
        tones.set(el, tone)
        el.dataset.glassBackdrop = tone
      }
    }
  }

  function radiusPx(m: Meta, rect: DOMRect, dpr: number): number {
    let v = parseFloat(m.radius) || 0
    if (m.radius.includes('%')) v = (v / 100) * Math.min(rect.width, rect.height)
    return Math.min(v, rect.width / 2, rect.height / 2) * dpr
  }

  // Liquid look per element; explicit attributes win over the "liquid" preset.
  function lens(m: Meta, rect: DOMRect) {
    const facets = m.facets ?? (m.lensMode === 1 ? 8 : 6)
    const on = m.liquid || m.lensMode > 0 || m.bezel !== null || m.refraction !== null
    if (!on) return { bezel: 0, refract: 0, dispersion: 0, specular: 0, facets }
    const fancy = m.liquid || m.lensMode > 0
    const bezel = m.bezel ?? Math.min(28, Math.max(8, Math.min(rect.width, rect.height) * 0.22))
    return {
      bezel,
      refract: m.refraction ?? bezel * 0.8,
      dispersion: m.dispersion ?? (fancy ? 0.5 : 0),
      specular: m.specular ?? (fancy ? 0.45 : 0),
      facets,
    }
  }

  function compose(g: WebGL2RenderingContext, res: Resources, items: Item[]) {
    if (!res.hist || !res.sharp) return
    const dpr = canvas.width / window.innerWidth
    let key = ''
    for (const it of items) {
      const c = it.clip
      key += `${it.rect.left},${it.rect.top},${it.rect.width},${it.rect.height},${it.alpha.toFixed(3)},${it.m.radius},${it.m.shape},${it.m.lensMode}`
      if (c) key += `,${c.left},${c.top},${c.right},${c.bottom}`
      key += ';'
    }
    if (!blurChanged && key === lastKey) return
    lastKey = key
    blurChanged = false

    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.viewport(0, 0, canvas.width, canvas.height)
    g.clearColor(0, 0, 0, 0)
    g.clear(g.COLOR_BUFFER_BIT)
    const u = res.compose.u
    g.useProgram(res.compose.p)
    g.uniform2f(u.u_res, canvas.width, canvas.height)
    g.uniform1f(u.u_sat, o.saturation)
    g.uniform1f(u.u_darken, o.darken)
    g.uniform2f(u.u_light, light[0], light[1])
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, res.sharp.tex)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, res.hist.tex)
    g.enable(g.BLEND)
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA)
    for (const { rect, alpha, m, clip } of items) {
      if (clip) {
        g.enable(g.SCISSOR_TEST)
        g.scissor(
          Math.floor(clip.left * dpr), Math.floor(canvas.height - clip.bottom * dpr),
          Math.ceil((clip.right - clip.left) * dpr), Math.ceil((clip.bottom - clip.top) * dpr))
      } else {
        g.disable(g.SCISSOR_TEST)
      }
      const l = lens(m, rect)
      g.uniform4f(u.u_rect, rect.left * dpr, canvas.height - rect.bottom * dpr, rect.width * dpr, rect.height * dpr)
      g.uniform1f(u.u_radius, radiusPx(m, rect, dpr))
      g.uniform1f(u.u_alpha, alpha)
      g.uniform1f(u.u_bezel, l.bezel * dpr)
      g.uniform1f(u.u_refract, l.refract * dpr)
      g.uniform1f(u.u_dispersion, l.dispersion)
      g.uniform1f(u.u_specular, l.specular)
      g.uniform1f(u.u_shape, m.shape)
      g.uniform1f(u.u_lens, m.lensMode)
      g.uniform1f(u.u_facets, l.facets)
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4)
    }
    g.disable(g.SCISSOR_TEST)
    g.disable(g.BLEND)
  }

  function clearCanvas(g: WebGL2RenderingContext) {
    if (cleared) return
    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.viewport(0, 0, canvas.width, canvas.height)
    g.clearColor(0, 0, 0, 0)
    g.clear(g.COLOR_BUFFER_BIT)
    lastKey = ''
    cleared = true
  }

  function frame(now: number) {
    raf = 0
    const g = gl
    const res = r
    if (!running || lost || !g || !res) return
    if (!elements.length) {
      clearCanvas(g)
      running = false
      return
    }
    raf = requestAnimationFrame(frame)
    const items = visibleItems()
    if (!items.length) {
      clearCanvas(g)
      return
    }
    cleared = false
    if (fence && readback(g, res, now)) {
      blurSource(g, res, now)
      if (now - lastTone >= o.toneInterval) {
        lastTone = now
        updateTones(res, items)
      }
    }
    // readback may have rebuilt the context resources
    if (r !== res) return
    if (!fence && (inGame || fallbackSource)) capture(g, res, now)
    if (blurReady) compose(g, res, items)
  }

  function start() {
    if (running || lost || !r) return
    running = true
    raf = requestAnimationFrame(frame)
  }

  function rebuild() {
    running = false
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    dispose()
    if (init()) start()
  }

  function scan() {
    meta = new WeakMap()
    elements = Array.from(document.querySelectorAll<HTMLElement>(o.selector))
    if (elements.length) start()
  }

  let scanQueued = false
  const observer = new MutationObserver(() => {
    if (scanQueued) return
    scanQueued = true
    queueMicrotask(() => {
      scanQueued = false
      scan()
    })
  })

  const onResize = () => {
    resize()
    start()
  }
  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
    running = false
    r = null
    fence = null
  }
  const onRestored = () => {
    lost = false
    if (init()) scan()
  }

  if (!init()) {
    canvas.remove()
    return NOOP
  }
  if (!inGame && o.fallbackImage) {
    if (typeof o.fallbackImage === 'string') {
      const img = new Image()
      img.onload = () => {
        fallbackSource = img
        uploadFallback()
      }
      img.src = o.fallbackImage
    } else {
      fallbackSource = o.fallbackImage
      uploadFallback()
    }
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)
  window.addEventListener('resize', onResize)
  observer.observe(document.body, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'data-glass', 'data-glass-bezel', 'data-glass-refraction', 'data-glass-dispersion', 'data-glass-specular',
      'data-glass-shape', 'data-glass-lens', 'data-glass-facets'],
  })
  scan()

  return {
    refresh: scan,
    stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      dispose()
      canvas.remove()
    },
  }
}
