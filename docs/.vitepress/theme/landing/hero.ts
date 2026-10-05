// Hero backdrop: a real GTA V frame graded like a trailer shot, with fake depth parallax, horizon heat haze,
// grain and edge aberration. The glass library reads this canvas live as its "game frame".
import * as THREE from 'three'

export interface Hero {
  setPointer(x: number, y: number): void
  setActive(active: boolean): void
  dispose(): void
}

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uView;
uniform vec2 uImage;
uniform vec2 uPointer;
uniform float uTime;
uniform vec2 uFocus;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec2 cover(vec2 uv) {
  float view = uView.x / uView.y;
  float image = uImage.x / uImage.y;
  vec2 scale = view > image ? vec2(1.0, image / view) : vec2(view / image, 1.0);
  // Crop around a focal point instead of the center, kept inside the image.
  vec2 focus = clamp(uFocus, scale * 0.5, 1.0 - scale * 0.5);
  return (uv - 0.5) * scale + focus;
}

vec3 sampleScene(vec2 uv) {
  // Slow push in, like a camera on a dolly.
  float zoom = 1.06 + 0.018 * sin(uTime * 0.045);
  uv = (uv - 0.5) / zoom + 0.5;
  // Fake depth: the sky sits far, the ground near, so the pointer moves the ground more.
  float depth = smoothstep(0.42, 0.1, uv.y);
  uv += uPointer * (0.004 + depth * 0.014);
  // Heat haze rising over the horizon.
  float band = smoothstep(0.30, 0.42, uv.y) * smoothstep(0.58, 0.44, uv.y);
  uv.x += sin(uv.y * 140.0 + uTime * 1.6) * 0.0009 * band;
  return texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb;
}

void main() {
  vec2 uv = cover(vUv);
  vec2 fromCenter = vUv - 0.5;
  // Lens aberration grows toward the frame edges.
  vec2 ca = fromCenter * 0.0035 * dot(fromCenter, fromCenter) * 4.0;
  vec3 c = vec3(sampleScene(uv + ca).r, sampleScene(uv).g, sampleScene(uv - ca).b);
  // Grade: cool lifted shadows, warm highlights, a touch more contrast.
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(c, c * vec3(0.86, 0.92, 1.12), smoothstep(0.5, 0.0, l) * 0.55);
  c = mix(c, c * vec3(1.08, 1.0, 0.9), smoothstep(0.45, 0.95, l) * 0.5);
  c = (c - 0.5) * 1.08 + 0.5;
  // Vignette and film grain.
  c *= 1.0 - smoothstep(0.35, 0.95, length(fromCenter * vec2(1.1, 1.25))) * 0.55;
  c += (hash(vUv * uView + fract(uTime) * 91.0) - 0.5) * 0.035;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`

export function createHero(canvas: HTMLCanvasElement, imageUrl: string): Hero | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true })
  } catch {
    return null
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const uniforms = {
    uTex: { value: null as THREE.Texture | null },
    uView: { value: new THREE.Vector2(1, 1) },
    uImage: { value: new THREE.Vector2(16, 9) },
    uPointer: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uFocus: { value: new THREE.Vector2(0.6, 0.5) },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: fragment,
  })
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

  new THREE.TextureLoader().load(imageUrl, (tex) => {
    tex.colorSpace = THREE.NoColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    uniforms.uTex.value = tex
    uniforms.uImage.value.set(tex.image.width, tex.image.height)
  })

  function resize() {
    const w = canvas.clientWidth || innerWidth
    const h = canvas.clientHeight || innerHeight
    renderer.setSize(w, h, false)
    uniforms.uView.value.set(w, h)
  }
  resize()
  addEventListener('resize', resize)

  const target = new THREE.Vector2()
  const timer = new THREE.Timer()
  let raf = 0
  let active = true

  function frame() {
    raf = requestAnimationFrame(frame)
    if (!active || !uniforms.uTex.value) return
    timer.update()
    if (!reduced) {
      uniforms.uTime.value = timer.getElapsed()
      uniforms.uPointer.value.lerp(target, 0.05)
    }
    renderer.render(scene, camera)
  }
  frame()

  return {
    setPointer(x, y) { target.set(x, -y) },
    setActive(v) { active = v },
    dispose() {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
      uniforms.uTex.value?.dispose()
      material.dispose()
      renderer.dispose()
    },
  }
}
