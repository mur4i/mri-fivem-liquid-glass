// Night city that plays "the game" behind the landing page: everything on top of it is real liquid glass.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export interface City {
  setScroll(t: number): void
  setPointer(x: number, y: number): void
  dispose(): void
}

const FOG = new THREE.Color('#160d26')
const BLOCK = 22
const STREET = 7
const GRID = 9

function rand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const fogChunk = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
vec3 applyFog(vec3 c, float depth) {
  float f = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);
  return mix(c, uFogColor, clamp(f, 0.0, 1.0));
}`

function sky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform float uTime;
      float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main() {
        float h = vDir.y;
        vec3 top = vec3(0.03, 0.03, 0.09);
        vec3 mid = vec3(0.20, 0.07, 0.30);
        vec3 low = vec3(0.95, 0.38, 0.30);
        vec3 c = mix(low, mid, smoothstep(-0.02, 0.18, h));
        c = mix(c, top, smoothstep(0.15, 0.6, h));
        // Sunset glow toward one side of the horizon.
        float glow = pow(max(dot(vDir, normalize(vec3(-0.4, 0.05, -1.0))), 0.0), 18.0);
        c += vec3(1.0, 0.55, 0.3) * glow * 1.4;
        // Stars, only high in the sky.
        vec3 cell = floor(vDir * 260.0);
        float star = step(0.9975, hash(cell)) * smoothstep(0.25, 0.6, h);
        c += vec3(star) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(cell) * 40.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  })
  return { mesh: new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), material), material }
}

function ground() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uFogColor: { value: FOG }, uFogDensity: { value: 0.0135 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying float vDepth;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vec4 mv = viewMatrix * w;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld;
      varying float vDepth;
      uniform float uTime;
      ${fogChunk}
      void main() {
        float period = ${(BLOCK + STREET).toFixed(1)};
        vec2 g = mod(vWorld.xz + period * 0.5, period);
        float street = step(${BLOCK.toFixed(1)}, g.x) + step(${BLOCK.toFixed(1)}, g.y);
        vec3 c = mix(vec3(0.05, 0.045, 0.07), vec3(0.025, 0.022, 0.035), clamp(street, 0.0, 1.0));
        // Lane dashes in the middle of each street.
        vec2 m = abs(g - vec2(${(BLOCK + STREET / 2).toFixed(1)}));
        float dashX = step(m.x, 0.08) * step(0.5, fract(vWorld.z * 0.25));
        float dashZ = step(m.y, 0.08) * step(0.5, fract(vWorld.x * 0.25));
        c += vec3(1.0, 0.8, 0.45) * (dashX + dashZ) * 0.6;
        // Wet asphalt: a soft colored sheen that fades with distance.
        c += vec3(0.35, 0.12, 0.45) * 0.08 * (1.0 - smoothstep(20.0, 160.0, vDepth));
        gl_FragColor = vec4(applyFog(c, vDepth), 1.0);
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), material)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

function buildings(r: () => number) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  geometry.translate(0, 0.5, 0)
  const matrices: THREE.Matrix4[] = []
  const seeds: number[] = []
  const tones: number[] = []
  const period = BLOCK + STREET
  const m = new THREE.Matrix4()
  for (let bx = -GRID; bx <= GRID; bx++) {
    for (let bz = -GRID * 2; bz <= 2; bz++) {
      if (bx === 0) continue // the main avenue stays open for the camera
      const split = 2 + Math.floor(r() * 2)
      const cell = BLOCK / split
      for (let i = 0; i < split; i++) {
        for (let j = 0; j < split; j++) {
          if (r() < 0.12) continue
          const dist = Math.hypot(bx, bz + 6)
          const h = 5 + r() * 20 + Math.max(0, 46 - dist * 2.6) * r() * (Math.abs(bx) === 1 ? 0.55 : 1)
          const w = cell * (0.62 + r() * 0.3)
          const d = cell * (0.62 + r() * 0.3)
          const x = bx * period - BLOCK / 2 + cell * (i + 0.5)
          const z = bz * period - BLOCK / 2 + cell * (j + 0.5)
          m.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d))
          matrices.push(m.clone())
          seeds.push(r() * 1000)
          tones.push(r())
        }
      }
    }
  }
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1))
  geometry.setAttribute('aTone', new THREE.InstancedBufferAttribute(new Float32Array(tones), 1))
  const material = new THREE.ShaderMaterial({
    uniforms: { uFogColor: { value: FOG }, uFogDensity: { value: 0.0135 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aTone;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vSeed;
      varying float vTone;
      varying float vDepth;
      void main() {
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        vSeed = aSeed;
        vTone = aTone;
        vec4 mv = viewMatrix * w;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vSeed;
      varying float vTone;
      varying float vDepth;
      uniform float uTime;
      ${fogChunk}
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 n = normalize(vNormal);
        vec3 base = mix(vec3(0.05, 0.05, 0.09), vec3(0.09, 0.06, 0.12), vTone);
        // Sky light from above, a warm bounce from the sunset side.
        vec3 c = base * (0.55 + 0.45 * max(n.y, 0.0)) + vec3(0.18, 0.07, 0.1) * max(dot(n, normalize(vec3(-0.4, 0.2, -1.0))), 0.0) * 0.35;
        if (abs(n.y) < 0.5) {
          float along = abs(n.x) > 0.5 ? vWorld.z : vWorld.x;
          vec2 grid = vec2(along / 1.1, vWorld.y / 1.45);
          vec2 cell = floor(grid);
          vec2 f = fract(grid);
          // Antialiased windows; far away the pattern fades to its average so it does not shimmer.
          vec2 fw = fwidth(grid);
          float wx = smoothstep(0.18 - fw.x, 0.18 + fw.x, f.x) * (1.0 - smoothstep(0.82 - fw.x, 0.82 + fw.x, f.x));
          float wy = smoothstep(0.22 - fw.y, 0.22 + fw.y, f.y) * (1.0 - smoothstep(0.78 - fw.y, 0.78 + fw.y, f.y));
          float far = smoothstep(0.25, 0.7, max(fw.x, fw.y));
          float window = mix(wx * wy, 0.36, far);
          float lit = mix(step(0.76, hash(cell + vSeed)), 0.24, far);
          vec3 warm = vec3(1.0, 0.6, 0.3);
          vec3 cool = vec3(0.45, 0.75, 1.0);
          vec3 wc = mix(warm, cool, step(0.82, hash(cell * 1.7 + vSeed)));
          float flick = 0.85 + 0.15 * sin(uTime * 0.7 + hash(cell) * 30.0);
          c += wc * window * lit * flick * 0.85 * step(1.0, vWorld.y);
        }
        gl_FragColor = vec4(applyFog(c, vDepth), 1.0);
      }`,
  })
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length)
  matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
  return { mesh, material }
}

function traffic(r: () => number) {
  const count = 520
  const geometry = new THREE.BoxGeometry(0.16, 0.12, 2.6)
  const offsets = new Float32Array(count * 4) // x, z, phase, speed
  const colors = new Float32Array(count * 3)
  const axis = new Float32Array(count)
  const period = BLOCK + STREET
  for (let i = 0; i < count; i++) {
    const alongZ = r() < 0.7
    const line = Math.round((r() - 0.5) * GRID * 2)
    const lane = (r() < 0.5 ? -1 : 1) * (0.9 + r() * 1.2)
    const fixed = line * period + BLOCK / 2 + STREET / 2 - period / 2 + lane
    const head = lane > 0
    offsets.set([alongZ ? fixed : 0, alongZ ? 0 : fixed - period * GRID, r() * 600, (head ? 1 : -1) * (14 + r() * 16)], i * 4)
    axis[i] = alongZ ? 1 : 0
    const c = head ? [2.4, 2.2, 1.9] : [2.6, 0.25, 0.2]
    colors.set(c, i * 3)
  }
  geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 4))
  geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3))
  geometry.setAttribute('aAxis', new THREE.InstancedBufferAttribute(axis, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFogColor: { value: FOG }, uFogDensity: { value: 0.0135 } },
    vertexShader: /* glsl */ `
      attribute vec4 aOffset;
      attribute vec3 aColor;
      attribute float aAxis;
      uniform float uTime;
      varying vec3 vColor;
      varying float vDepth;
      varying float vTail;
      void main() {
        float travel = mod(aOffset.z + uTime * aOffset.w, 600.0) - 480.0;
        vec3 p = position;
        if (aAxis < 0.5) p = vec3(p.z, p.y, p.x);
        vec3 world = vec3(aOffset.x, 0.45, aOffset.y) + p;
        if (aAxis > 0.5) world.z += travel; else world.x += travel + 240.0;
        vTail = (aAxis > 0.5 ? position.z : position.z) / 2.6 + 0.5;
        vColor = aColor;
        vec4 mv = viewMatrix * vec4(world, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vDepth;
      varying float vTail;
      ${fogChunk}
      void main() {
        float fade = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
        gl_FragColor = vec4(vColor * (1.0 - clamp(fade, 0.0, 1.0)), 1.0);
      }`,
  })
  return { mesh: new THREE.InstancedMesh(geometry, material, count), material }
}

function landmark() {
  const group = new THREE.Group()
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 4.4, 92, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#0c0a16') }),
  )
  tower.position.y = 46
  group.add(tower)
  const rings: THREE.Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.5 + i * 0.3, 0.09, 8, 80),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 2 ? '#7cc4ff' : '#00e699').multiplyScalar(3), toneMapped: false }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 28 + i * 12
    group.add(ring)
    rings.push(ring)
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff4fa3').multiplyScalar(4), toneMapped: false }))
  beacon.position.y = 94
  group.add(beacon)
  group.position.set(0, 0, -(BLOCK + STREET) * 13)
  return { group, rings }
}

function signs(r: () => number) {
  const group = new THREE.Group()
  const palette = ['#ff3fa4', '#36f1ff', '#00e699', '#ffd23f', '#b44bff']
  const period = BLOCK + STREET
  for (let i = 0; i < 46; i++) {
    const side = r() < 0.5 ? -1 : 1
    const w = 2 + r() * 5
    const h = 0.6 + r() * 1.4
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(palette[i % palette.length]).multiplyScalar(1.7), toneMapped: false, side: THREE.DoubleSide }),
    )
    sign.position.set(side * (STREET / 2 + BLOCK * 0.18 + r() * 2), 4 + r() * 16, -r() * period * GRID * 1.6)
    sign.rotation.y = side * Math.PI / 2
    group.add(sign)
  }
  return group
}

export function createCity(canvas: HTMLCanvasElement): City | null {
  let renderer: THREE.WebGLRenderer
  try {
    // preserveDrawingBuffer: the glass reads this canvas as its "game frame" at its own pace.
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  let dpr = Math.min(devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(dpr)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.88

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(56, 1, 0.5, 900)
  const r = rand(20261005)
  const s = sky()
  const b = buildings(r)
  const t = traffic(r)
  const l = landmark()
  scene.add(s.mesh, ground(), b.mesh, t.mesh, l.group, signs(r))

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.86)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  function resize() {
    const w = canvas.clientWidth || innerWidth
    const h = canvas.clientHeight || innerHeight
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    bloom.resolution.set(w / 2, h / 2)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  addEventListener('resize', resize)

  let scroll = 0
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  const timer = new THREE.Timer()
  let raf = 0
  let slow = 0

  function frame() {
    raf = requestAnimationFrame(frame)
    timer.update()
    const dt = Math.min(timer.getDelta(), 0.1)
    const time = timer.getElapsed()
    // Adaptive quality: long frames lower the resolution once or twice.
    slow = dt > 1 / 40 ? slow + 1 : Math.max(0, slow - 1)
    if (slow > 90 && dpr > 0.75) {
      dpr = Math.max(0.75, dpr - 0.25)
      renderer.setPixelRatio(dpr)
      resize()
      slow = 0
    }
    pointer.sx += (pointer.x - pointer.sx) * 0.04
    pointer.sy += (pointer.y - pointer.sy) * 0.04
    // Slow glide back and forth along the avenue; scroll pushes the camera deeper into the city.
    const drift = reduced ? 0 : 45 * (1 - Math.cos(time * 0.05))
    const z = 40 - scroll * 240 - drift
    camera.position.set(Math.sin(time * 0.08) * 2.5 + pointer.sx * 3, 22 - scroll * 12 + pointer.sy * 2, z)
    camera.lookAt(pointer.sx * 10, 14 - scroll * 6 - pointer.sy * 3, z - 90)
    s.material.uniforms.uTime.value = time
    b.material.uniforms.uTime.value = time
    t.material.uniforms.uTime.value = reduced ? 30 : time
    l.rings.forEach((ring, i) => {
      ring.rotation.z = time * (0.2 + i * 0.05) * (i % 2 ? -1 : 1)
      ring.position.y = 28 + i * 12 + Math.sin(time * 0.8 + i) * 0.6
    })
    composer.render()
  }
  frame()

  return {
    setScroll(v) { scroll = Math.max(0, Math.min(1, v)) },
    setPointer(x, y) { pointer.x = x; pointer.y = y },
    dispose() {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
      composer.dispose()
      renderer.dispose()
    },
  }
}
