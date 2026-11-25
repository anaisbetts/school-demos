import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// =============================================================================
//  SOLAR SYSTEM SETTINGS — change these numbers and save to see it update!
// =============================================================================

const TIME_SPEED = 1          // 0 = pause, 5 = fast, -2 = go backwards!
const PLANET_SCALE = 1        // make all planets bigger or smaller
const SUN_SIZE = 4.5          // size of the Sun
const SUN_COLOR = '#ffb347'   // try 'cyan', 'hotpink', or '#ff4400'

const SHOW_ORBITS = true      // show the orbit circles
const SHOW_LABELS = true      // show planet names
const SHOW_TRAILS = true      // show glowing tails behind planets

const ASTEROID_COUNT = 600    // rocks floating between Mars and Jupiter
const STAR_COUNT = 2500       // stars in the background

const PLANETS: PlanetConfig[] = [
  { name: 'Mercury', color: '#a8a29e', size: 0.55, distance: 10, speed: 1.6,  moons: 0, rings: false },
  { name: 'Venus',   color: '#e8c27a', size: 0.9,  distance: 14, speed: 1.18, moons: 0, rings: false },
  { name: 'Earth',   color: '#3b82f6', size: 1.0,  distance: 19, speed: 0.92, moons: 1, rings: false },
  { name: 'Mars',    color: '#e06444', size: 0.72, distance: 24, speed: 0.72, moons: 2, rings: false },
  { name: 'Jupiter', color: '#d99b66', size: 2.35, distance: 35, speed: 0.44, moons: 4, rings: false },
  { name: 'Saturn',  color: '#e8d094', size: 1.95, distance: 46, speed: 0.32, moons: 3, rings: true  },
  { name: 'Uranus',  color: '#67e8f9', size: 1.4,  distance: 56, speed: 0.22, moons: 2, rings: false },
  { name: 'Neptune', color: '#4f6df5', size: 1.35, distance: 65, speed: 0.16, moons: 1, rings: false },
]

// =============================================================================
//  ENGINE CONSTANTS
// =============================================================================

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 56, 98)
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0)
const BASE_ORBIT_RATE = 0.28
const TRAIL_SEGMENTS = 64
const MAX_MOONS = 50
const MAX_ASTEROIDS = 5000
const MAX_STARS = 15000
const CLICK_DRAG_LIMIT_PX = 6

// =============================================================================
//  TYPES AND INTERFACES
// =============================================================================

interface PlanetConfig {
  name: string
  color: string
  size: number
  distance: number
  speed: number
  moons: number
  rings: boolean
}

type SurfaceKind = 'rocky' | 'earth' | 'gas'

interface MoonRuntime {
  pivot: THREE.Object3D
  speed: number
}

interface PlanetRuntime {
  config: PlanetConfig
  radius: number
  distance: number
  color: THREE.Color
  group: THREE.Group
  mesh: THREE.Mesh
  hitMesh: THREE.Mesh
  label: THREE.Sprite | null
  moons: MoonRuntime[]
  trailLine: THREE.Line | null
  trailPositions: Float32Array | null
  angle: number
  lastPosition: THREE.Vector3
}

interface SunRuntime {
  mesh: THREE.Mesh
  innerGlow: THREE.Sprite
  outerGlow: THREE.Sprite
  radius: number
}

interface CameraGlide {
  targetPosition: THREE.Vector3
  targetLookAt: THREE.Vector3
  progress: number
}

interface HmrState {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  focusedPlanetName: string | null
  isPaused: boolean
  simTime: number
  asteroidAngle: number
  planetAngles: Record<string, number>
}

// =============================================================================
//  MAIN — START THE 3D SOLAR SYSTEM
// =============================================================================

function startSolarSystem(): void {
  const container = document.getElementById('app')
  if (!container) return

  const saved = import.meta.hot?.data?.state as HmrState | undefined

  const renderer = saved?.renderer ?? createRenderer(container)
  const camera = saved?.camera ?? createCamera()
  const controls = saved?.controls ?? createControls(camera, renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#03050a')

  const sunColor = parseColor(SUN_COLOR, '#ffb347')
  const sunLight = new THREE.PointLight(sunColor.clone().lerp(new THREE.Color('#ffffff'), 0.45), 2.8, 0, 0)
  scene.add(sunLight)
  scene.add(new THREE.HemisphereLight('#b8d4ff', '#161b2e', 0.48))
  scene.add(new THREE.AmbientLight('#26324d', 0.35))

  const sun = buildSun(scene, sunColor)
  const stars = buildStarfield(scene)
  const asteroidBelt = buildAsteroidBelt(scene)
  if (saved) {
    asteroidBelt.rotation.y = saved.asteroidAngle
  }

  const planetAngles: Record<string, number> = { ...(saved?.planetAngles ?? {}) }
  const planets: PlanetRuntime[] = PLANETS.map((config, index) => {
    const startAngle = planetAngles[config.name] ?? (index * 2.15 + 0.5)
    planetAngles[config.name] = startAngle
    return buildPlanet(scene, config, startAngle)
  })

  let focusedPlanetName: string | null = saved?.focusedPlanetName ?? null
  if (focusedPlanetName && !planets.some((p) => p.config.name === focusedPlanetName)) {
    focusedPlanetName = null
  }
  let isPaused = saved?.isPaused ?? false
  let simTime = saved?.simTime ?? 0
  let cameraGlide: CameraGlide | null = null

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const hitMeshes = planets.map((p) => p.hitMesh)
  let pointerDownX = 0
  let pointerDownY = 0

  const onPointerDown = (event: PointerEvent): void => {
    pointerDownX = event.clientX
    pointerDownY = event.clientY
  }

  const onPointerUp = (event: PointerEvent): void => {
    const moved = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY)
    if (moved > CLICK_DRAG_LIMIT_PX) return

    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(hitMeshes, false)

    if (hits.length > 0) {
      const clickedName = hits[0].object.userData.planetName as string | undefined
      const clickedPlanet = planets.find((p) => p.config.name === clickedName)
      if (clickedPlanet) {
        focusedPlanetName = clickedPlanet.config.name
        cameraGlide = createFocusGlide(camera, clickedPlanet)
        return
      }
    }

    focusedPlanetName = null
    cameraGlide = null
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      event.preventDefault()
      isPaused = !isPaused
    } else if (event.key === 'r' || event.key === 'R') {
      focusedPlanetName = null
      cameraGlide = {
        targetPosition: DEFAULT_CAMERA_POS.clone(),
        targetLookAt: DEFAULT_TARGET.clone(),
        progress: 0,
      }
    }
  }

  const onResize = (): void => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)

  let lastFrameMs = performance.now()
  let rafId = 0

  const animate = (nowMs: number): void => {
    rafId = requestAnimationFrame(animate)

    const dt = Math.min((nowMs - lastFrameMs) / 1000, 0.05)
    lastFrameMs = nowMs

    const step = isPaused ? 0 : dt * TIME_SPEED
    simTime += step

    // Animate the Sun glow and surface rotation
    sun.mesh.rotation.y += dt * 0.08
    const pulse = 1 + Math.sin(nowMs * 0.0022) * 0.04
    sun.innerGlow.scale.setScalar(sun.radius * 3.3 * pulse)
    sun.outerGlow.scale.setScalar(sun.radius * 6.6 * (2 - pulse))

    // Slowly drift stars and spin the asteroid belt
    stars.rotation.y += dt * 0.003
    asteroidBelt.rotation.y += step * 0.045

    // Update each planet, its moons, and its glowing trail
    for (const planet of planets) {
      planet.lastPosition.copy(planet.group.position)
      planet.angle += step * planet.config.speed * BASE_ORBIT_RATE
      planetAngles[planet.config.name] = planet.angle

      const x = Math.cos(planet.angle) * planet.distance
      const z = Math.sin(planet.angle) * planet.distance
      planet.group.position.set(x, 0, z)
      planet.mesh.rotation.y += (isPaused ? 0 : dt) * 0.45

      for (const moon of planet.moons) {
        moon.pivot.rotation.y += step * moon.speed
      }

      if (planet.label) {
        const camDist = camera.position.distanceTo(planet.group.position)
        const labelW = clamp(camDist * 0.085, 2.2, 8.0)
        planet.label.scale.set(labelW, labelW * 0.25, 1)
        planet.label.position.y = planet.radius + labelW * 0.24 + 0.4
      }

      updateTrail(planet)
    }

    cameraGlide = updateCameraFocus(camera, controls, planets, focusedPlanetName, cameraGlide, dt)
    controls.update()
    renderer.render(scene, camera)
  }

  rafId = requestAnimationFrame(animate)

  if (import.meta.hot) {
    import.meta.hot.accept()
    import.meta.hot.dispose((data) => {
      cancelAnimationFrame(rafId)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)

      disposeScene(scene)

      data.state = {
        renderer,
        camera,
        controls,
        focusedPlanetName,
        isPaused,
        simTime,
        asteroidAngle: asteroidBelt.rotation.y,
        planetAngles,
      } satisfies HmrState
    })
  }
}

// =============================================================================
//  3D SCENE BUILDERS & ANIMATION HELPERS
// =============================================================================

function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  container.replaceChildren(renderer.domElement)
  return renderer
}

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1200)
  camera.position.copy(DEFAULT_CAMERA_POS)
  return camera
}

function createControls(camera: THREE.PerspectiveCamera, domElement: HTMLElement): OrbitControls {
  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 4
  controls.maxDistance = 260
  controls.target.copy(DEFAULT_TARGET)
  controls.update()
  return controls
}

function buildSun(scene: THREE.Scene, sunColor: THREE.Color): SunRuntime {
  const radius = clamp(SUN_SIZE, 0.5, 25)
  const texture = createSunTexture(sunColor)
  const geometry = new THREE.SphereGeometry(radius, 48, 48)
  const material = new THREE.MeshBasicMaterial({ map: texture })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const innerTexture = createGlowTexture(sunColor, 0.95)
  const innerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: innerTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  innerGlow.scale.setScalar(radius * 3.3)
  scene.add(innerGlow)

  const outerTexture = createGlowTexture(sunColor, 0.42)
  const outerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: outerTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  outerGlow.scale.setScalar(radius * 6.6)
  scene.add(outerGlow)

  return { mesh, innerGlow, outerGlow, radius }
}

function buildPlanet(scene: THREE.Scene, config: PlanetConfig, startAngle: number): PlanetRuntime {
  const color = parseColor(config.color, '#7dd3fc')
  const radius = clamp(config.size * PLANET_SCALE, 0.12, 18)
  const distance = clamp(config.distance, 1, 300)
  const surfaceKind = inferSurfaceKind(config)

  const group = new THREE.Group()
  const startX = Math.cos(startAngle) * distance
  const startZ = Math.sin(startAngle) * distance
  group.position.set(startX, 0, startZ)
  scene.add(group)

  // Textured planet sphere
  const texture = createPlanetTexture(config.name, color, surfaceKind)
  const geometry = new THREE.SphereGeometry(radius, 40, 32)
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: surfaceKind === 'gas' ? 0.65 : 0.78,
    metalness: 0.04,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.z = surfaceKind === 'earth' ? 0.41 : 0.14
  group.add(mesh)

  // Soft atmospheric glow behind the planet
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(color, 0.32),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  halo.scale.setScalar(radius * 2.8)
  group.add(halo)

  // Invisible larger sphere so fast/small planets are easy to click
  const hitMesh = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(radius * 1.9, 1.45), 12, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  )
  hitMesh.userData.planetName = config.name
  group.add(hitMesh)

  // Optional planetary rings
  if (config.rings) {
    const innerR = radius * 1.4
    const outerR = radius * 2.55
    const ringGeo = createRadialRingGeometry(innerR, outerR, 96)
    const ringMat = new THREE.MeshBasicMaterial({
      map: createRingTexture(color, config.name),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = Math.PI / 2 + 0.34
    ringMesh.rotation.y = 0.18
    group.add(ringMesh)
  }

  // Orbiting moons
  const moonCount = clamp(Math.round(config.moons), 0, MAX_MOONS)
  const moons: MoonRuntime[] = []
  const moonRng = mulberry32(hashString(config.name + ':moons'))
  const moonGeo = new THREE.SphereGeometry(1, 14, 14)

  for (let i = 0; i < moonCount; i++) {
    const pivot = new THREE.Object3D()
    pivot.rotation.y = (i / Math.max(moonCount, 1)) * Math.PI * 2 + moonRng() * 0.4
    pivot.rotation.x = (moonRng() - 0.5) * 0.45
    pivot.rotation.z = (moonRng() - 0.5) * 0.35

    const moonRadius = clamp(radius * (0.11 + moonRng() * 0.08), 0.08, 0.28)
    const ringGap = config.rings ? radius * 2.75 : radius * 1.65
    const orbitR = ringGap + (i % 4) * (radius * 0.42 + 0.35) + moonRng() * 0.35
    const shade = 0.72 + moonRng() * 0.28
    const moonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shade, shade * 0.98, shade * 0.95),
      roughness: 0.9,
      metalness: 0.02,
    })

    const moonMesh = new THREE.Mesh(moonGeo, moonMat)
    moonMesh.scale.setScalar(moonRadius)
    moonMesh.position.set(orbitR, 0, 0)
    pivot.add(moonMesh)
    group.add(pivot)

    moons.push({
      pivot,
      speed: (1.4 + moonRng() * 2.2) * (i % 2 === 0 ? 1 : -1),
    })
  }

  // Floating 3D name label
  let label: THREE.Sprite | null = null
  if (SHOW_LABELS && config.name.trim().length > 0) {
    label = createLabelSprite(config.name)
    label.position.set(0, radius + 1.65, 0)
    group.add(label)
  }

  // Crisp orbit ring
  if (SHOW_ORBITS) {
    const orbitPoints: THREE.Vector3[] = []
    const segments = 160
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2
      orbitPoints.push(new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance))
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints)
    const orbitMat = new THREE.LineBasicMaterial({
      color: '#5b74a8',
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
    scene.add(new THREE.LineLoop(orbitGeo, orbitMat))
  }

  // Glowing orbital motion trail
  let trailLine: THREE.Line | null = null
  let trailPositions: Float32Array | null = null
  if (SHOW_TRAILS) {
    trailPositions = new Float32Array(TRAIL_SEGMENTS * 3)
    const trailColors = new Float32Array(TRAIL_SEGMENTS * 3)
    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      const fade = Math.pow(1 - i / (TRAIL_SEGMENTS - 1), 1.7)
      trailColors[i * 3] = color.r * fade
      trailColors[i * 3 + 1] = color.g * fade
      trailColors[i * 3 + 2] = color.b * fade
    }
    const trailGeo = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))
    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    trailLine = new THREE.Line(trailGeo, trailMat)
    scene.add(trailLine)
  }

  const runtime: PlanetRuntime = {
    config,
    radius,
    distance,
    color,
    group,
    mesh,
    hitMesh,
    label,
    moons,
    trailLine,
    trailPositions,
    angle: startAngle,
    lastPosition: new THREE.Vector3(startX, 0, startZ),
  }
  updateTrail(runtime)
  return runtime
}

function buildAsteroidBelt(scene: THREE.Scene): THREE.Group {
  const belt = new THREE.Group()
  const count = clamp(Math.round(ASTEROID_COUNT), 0, MAX_ASTEROIDS)
  if (count === 0) {
    scene.add(belt)
    return belt
  }

  const geometry = new THREE.DodecahedronGeometry(0.18, 0)
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.92,
    metalness: 0.08,
  })
  const instanced = new THREE.InstancedMesh(geometry, material, count)

  const rng = mulberry32(4242)
  const dummy = new THREE.Object3D()
  const tint = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2
    const radius = 27.5 + rng() * 3.8
    const y = (rng() - 0.5) * 1.6

    dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
    dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI)
    const scale = 0.45 + rng() * 1.15
    dummy.scale.set(scale, scale * (0.65 + rng() * 0.5), scale * (0.7 + rng() * 0.45))
    dummy.updateMatrix()
    instanced.setMatrixAt(i, dummy.matrix)

    const lightness = 0.42 + rng() * 0.28
    tint.setHSL(0.08 + rng() * 0.04, 0.14, lightness)
    instanced.setColorAt(i, tint)
  }

  instanced.instanceMatrix.needsUpdate = true
  if (instanced.instanceColor) {
    instanced.instanceColor.needsUpdate = true
  }
  belt.add(instanced)
  scene.add(belt)
  return belt
}

function buildStarfield(scene: THREE.Scene): THREE.Points {
  const count = clamp(Math.round(STAR_COUNT), 0, MAX_STARS)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const rng = mulberry32(1337)
  const starColor = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const u = rng()
    const v = rng()
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * v - 1)
    const r = 210 + rng() * 230

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    const pick = rng()
    if (pick < 0.2) {
      starColor.set('#bcd7ff')
    } else if (pick < 0.35) {
      starColor.set('#ffe4b8')
    } else {
      starColor.set('#f1f5ff')
    }
    const brightness = 0.55 + rng() * 0.45
    colors[i * 3] = starColor.r * brightness
    colors[i * 3 + 1] = starColor.g * brightness
    colors[i * 3 + 2] = starColor.b * brightness
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 1.85,
    map: createStarDotTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)
  return points
}

function updateTrail(planet: PlanetRuntime): void {
  if (!planet.trailLine || !planet.trailPositions) return

  const direction = Math.sign(planet.config.speed * TIME_SPEED) || 1
  const speedFactor = clamp(Math.abs(planet.config.speed * TIME_SPEED), 0.15, 2.5)
  const arcLength = clamp(0.42 + speedFactor * 0.38, 0.35, 1.45)

  for (let i = 0; i < TRAIL_SEGMENTS; i++) {
    const t = i / (TRAIL_SEGMENTS - 1)
    const a = planet.angle - direction * t * arcLength
    planet.trailPositions[i * 3] = Math.cos(a) * planet.distance
    planet.trailPositions[i * 3 + 1] = 0
    planet.trailPositions[i * 3 + 2] = Math.sin(a) * planet.distance
  }

  planet.trailLine.geometry.attributes.position.needsUpdate = true
}

function createFocusGlide(camera: THREE.PerspectiveCamera, planet: PlanetRuntime): CameraGlide {
  const planetPos = planet.group.position.clone()
  const viewDir = camera.position.clone().sub(planetPos)
  if (viewDir.lengthSq() < 0.01) {
    viewDir.set(0, 0.5, 1)
  }
  viewDir.normalize()
  viewDir.y = Math.max(viewDir.y, 0.32)
  viewDir.normalize()

  const viewDist = Math.max(planet.radius * 5.2, 6.5)
  return {
    targetPosition: planetPos.clone().addScaledVector(viewDir, viewDist),
    targetLookAt: planetPos,
    progress: 0,
  }
}

function updateCameraFocus(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  planets: PlanetRuntime[],
  focusedPlanetName: string | null,
  glide: CameraGlide | null,
  dt: number,
): CameraGlide | null {
  const focused = focusedPlanetName
    ? planets.find((p) => p.config.name === focusedPlanetName) ?? null
    : null

  if (focused) {
    const delta = focused.group.position.clone().sub(focused.lastPosition)
    camera.position.add(delta)
    controls.target.add(delta)
    if (glide) {
      glide.targetPosition.add(delta)
      glide.targetLookAt.copy(focused.group.position)
    }
  }

  if (glide) {
    const alpha = 1 - Math.exp(-dt * 6.5)
    camera.position.lerp(glide.targetPosition, alpha)
    controls.target.lerp(glide.targetLookAt, alpha)
    glide.progress += dt
    if (
      glide.progress > 1.2 ||
      (camera.position.distanceTo(glide.targetPosition) < 0.08 &&
        controls.target.distanceTo(glide.targetLookAt) < 0.08)
    ) {
      return null
    }
  }

  return glide
}

// =============================================================================
//  PROCEDURAL TEXTURE & UTILITY HELPERS
// =============================================================================

function inferSurfaceKind(config: PlanetConfig): SurfaceKind {
  if (config.name.trim().toLowerCase() === 'earth') return 'earth'
  if (config.size >= 1.3) return 'gas'
  return 'rocky'
}

function createSunTexture(sunColor: THREE.Color): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const bright = sunColor.clone().lerp(new THREE.Color('#ffffff'), 0.55)
  const deep = sunColor.clone().multiplyScalar(0.68)

  const grad = ctx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, '#' + deep.getHexString())
  grad.addColorStop(0.5, '#' + sunColor.getHexString())
  grad.addColorStop(1, '#' + deep.getHexString())
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  const rng = mulberry32(9001)
  for (let i = 0; i < 420; i++) {
    const x = rng() * width
    const y = rng() * height
    const r = 6 + rng() * 24
    const isHot = rng() > 0.35
    const spotColor = isHot ? bright : deep
    const radial = ctx.createRadialGradient(x, y, 0, x, y, r)
    radial.addColorStop(0, rgbaString(spotColor, isHot ? 0.42 : 0.32))
    radial.addColorStop(1, rgbaString(spotColor, 0))
    ctx.fillStyle = radial
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

function createPlanetTexture(
  name: string,
  baseColor: THREE.Color,
  kind: SurfaceKind,
): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const rng = mulberry32(hashString(name))

  const light = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.38)
  const dark = baseColor.clone().multiplyScalar(0.55)

  switch (kind) {
    case 'gas': {
      ctx.fillStyle = '#' + baseColor.getHexString()
      ctx.fillRect(0, 0, width, height)

      // Smooth turbulent horizontal bands
      for (let y = 0; y < height; y += 3) {
        const wave = Math.sin(y * 0.11 + rng() * 0.3) * 0.5 + 0.5
        const bandColor = baseColor.clone().lerp(wave > 0.5 ? light : dark, Math.abs(wave - 0.5) * 0.9)
        ctx.fillStyle = rgbaString(bandColor, 0.72)
        ctx.fillRect(0, y, width, 4 + rng() * 5)
      }

      // Wavy cloud streaks
      for (let i = 0; i < 28; i++) {
        const y = rng() * height
        const amp = 2 + rng() * 5
        const freq = 0.02 + rng() * 0.03
        ctx.strokeStyle = rgbaString(rng() > 0.5 ? light : dark, 0.35)
        ctx.lineWidth = 2 + rng() * 5
        ctx.beginPath()
        for (let x = 0; x <= width; x += 8) {
          const py = y + Math.sin(x * freq + i) * amp
          if (x === 0) ctx.moveTo(x, py)
          else ctx.lineTo(x, py)
        }
        ctx.stroke()
      }

      // Signature swirling storm oval
      const stormX = width * (0.3 + rng() * 0.4)
      const stormY = height * (0.45 + rng() * 0.25)
      const stormColor = baseColor.clone().offsetHSL(-0.04, 0.18, -0.1)
      ctx.save()
      ctx.translate(stormX, stormY)
      ctx.scale(1.8, 1)
      const stormGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18)
      stormGrad.addColorStop(0, rgbaString(light, 0.7))
      stormGrad.addColorStop(0.5, rgbaString(stormColor, 0.85))
      stormGrad.addColorStop(1, rgbaString(stormColor, 0))
      ctx.fillStyle = stormGrad
      ctx.beginPath()
      ctx.arc(0, 0, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      break
    }

    case 'earth': {
      // Deep ocean gradient derived from the planet color
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height)
      oceanGrad.addColorStop(0, '#' + dark.getHexString())
      oceanGrad.addColorStop(0.5, '#' + baseColor.getHexString())
      oceanGrad.addColorStop(1, '#' + dark.getHexString())
      ctx.fillStyle = oceanGrad
      ctx.fillRect(0, 0, width, height)

      // Continents: lush emerald on default blue Earth, harmonized shift if recolored live
      const landColor = baseColor.clone().offsetHSL(-0.22, -0.05, 0.04)
      const highlandColor = landColor.clone().lerp(new THREE.Color('#e2d4a8'), 0.3)
      for (let i = 0; i < 42; i++) {
        const cx = rng() * width
        const cy = 28 + rng() * (height - 56)
        const rx = 16 + rng() * 44
        const ry = 10 + rng() * 26
        ctx.fillStyle = rgbaString(i % 3 === 0 ? highlandColor : landColor, 0.78)
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }

      // Polar ice caps
      ctx.fillStyle = 'rgba(240, 248, 255, 0.82)'
      ctx.fillRect(0, 0, width, 16)
      ctx.fillRect(0, height - 16, width, 16)

      // Soft swirling white clouds
      for (let i = 0; i < 48; i++) {
        const cx = rng() * width
        const cy = rng() * height
        const rx = 18 + rng() * 52
        const ry = 4 + rng() * 10
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, (rng() - 0.5) * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'rocky': {
      ctx.fillStyle = '#' + baseColor.getHexString()
      ctx.fillRect(0, 0, width, height)

      // Soft terrain mottling
      for (let i = 0; i < 160; i++) {
        const x = rng() * width
        const y = rng() * height
        const r = 10 + rng() * 34
        const patch = rng() > 0.5 ? light : dark
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
        grad.addColorStop(0, rgbaString(patch, 0.28))
        grad.addColorStop(1, rgbaString(patch, 0))
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Impact craters
      for (let i = 0; i < 45; i++) {
        const x = rng() * width
        const y = rng() * height
        const r = 3 + rng() * 11
        ctx.fillStyle = rgbaString(dark, 0.35)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = rgbaString(light, 0.3)
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(x - 1, y - 1, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }

    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

function createRadialRingGeometry(
  innerRadius: number,
  outerRadius: number,
  segments: number,
): THREE.RingGeometry {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments)
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = v.length()
    const u = (r - innerRadius) / (outerRadius - innerRadius)
    uv.setXY(i, clamp(u, 0, 1), 0.5)
  }
  uv.needsUpdate = true
  return geometry
}

function createRingTexture(baseColor: THREE.Color, name: string): THREE.CanvasTexture {
  const width = 256
  const height = 8
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const rng = mulberry32(hashString(name + ':ring'))

  const bright = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.45)
  const dark = baseColor.clone().multiplyScalar(0.6)

  for (let x = 0; x < width; x++) {
    const t = x / (width - 1)
    const edgeFade = Math.pow(Math.sin(t * Math.PI), 0.6)
    const cassiniGap = t > 0.56 && t < 0.64 ? 0.14 : 1
    const bandWave = 0.65 + 0.35 * Math.sin(t * 42 + rng() * 0.3)
    const alpha = clamp(edgeFade * cassiniGap * bandWave * 0.96, 0, 0.98)
    const c = baseColor.clone().lerp(bandWave > 0.75 ? bright : dark, 0.38)
    ctx.fillStyle = rgbaString(c, alpha)
    ctx.fillRect(x, 0, 1, height)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createGlowTexture(color: THREE.Color, peakAlpha: number): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const half = size / 2

  const hotCore = color.clone().lerp(new THREE.Color('#ffffff'), 0.5)
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, rgbaString(hotCore, peakAlpha))
  grad.addColorStop(0.28, rgbaString(color, peakAlpha * 0.6))
  grad.addColorStop(0.65, rgbaString(color, peakAlpha * 0.16))
  grad.addColorStop(1, rgbaString(color, 0))

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createStarDotTexture(): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const half = size / 2

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.75)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  ctx.font = '600 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const metrics = ctx.measureText(text)
  const pillW = Math.min(246, Math.max(96, metrics.width + 30))
  const pillH = 44
  const pillX = (canvas.width - pillW) / 2
  const pillY = (canvas.height - pillH) / 2

  ctx.fillStyle = 'rgba(8, 12, 24, 0.68)'
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, 14)
  ctx.fill()

  ctx.strokeStyle = 'rgba(180, 205, 255, 0.34)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#f8fafc'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  )
  sprite.scale.set(6.4, 1.6, 1)
  sprite.renderOrder = 10
  return sprite
}

function parseColor(value: string, fallback: string): THREE.Color {
  const color = new THREE.Color()
  const trimmed = value.trim()
  if (trimmed.length === 0 || (typeof CSS !== 'undefined' && !CSS.supports('color', trimmed))) {
    return color.set(fallback)
  }
  try {
    return color.set(trimmed)
  } catch {
    return color.set(fallback)
  }
}

function rgbaString(color: THREE.Color, alpha: number): string {
  const srgb = { r: 0, g: 0, b: 0 }
  color.getRGB(srgb, THREE.SRGBColorSpace)
  const r = Math.round(clamp(srgb.r, 0, 1) * 255)
  const g = Math.round(clamp(srgb.g, 0, 1) * 255)
  const b = Math.round(clamp(srgb.b, 0, 1) * 255)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function hashString(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function disposeScene(scene: THREE.Scene): void {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
      geometries.add(obj.geometry)
      const list = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of list) {
        materials.add(mat)
      }
    } else if (obj instanceof THREE.Sprite) {
      materials.add(obj.material)
    }
  })

  for (const mat of materials) {
    if ('map' in mat && mat.map instanceof THREE.Texture) {
      textures.add(mat.map)
    }
    mat.dispose()
  }
  for (const tex of textures) {
    tex.dispose()
  }
  for (const geo of geometries) {
    geo.dispose()
  }
}

startSolarSystem()
