import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  FormationType,
  VisualStyle,
  SimulationParams,
  NeonPaletteId,
  NEON_PALETTES,
  PresetMotionType,
} from '../types/simulation';

export const MAX_PARTICLES = 20000;

export class ParticleFormationSystem {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  // Precomputed formation target position tables (Float32Array(MAX_PARTICLES * 3))
  private formationTables: Record<FormationType, Float32Array>;

  // Runtime buffers (zero per-frame allocations)
  private currentPositions: Float32Array;
  private startPositions: Float32Array;
  private targetPositions: Float32Array;
  private colors: Float32Array;
  private staggerOffsets: Float32Array;
  private curlOffsets: Float32Array;
  private velocities: Float32Array;

  // Morphing state
  private activeFormation: FormationType = 'cloud';
  private targetFormation: FormationType = 'cloud';
  private isMorphing = false;
  private morphTime = 0.0;
  private readonly morphDuration = 1.5; // ~1.5s as requested
  private currentPalette: NeonPaletteId = 'toxic_green';
  private currentTrailPersistence = 0.25;

  // Generative choreography state
  private activeChoreography: PresetMotionType | null = null;
  private choreographyTime = 0.0;
  private readonly choreographyDuration = 3.2; // ~3.2s duration

  // Visual style textures cache
  private styleTextures: Record<VisualStyle, THREE.CanvasTexture>;

  // Camera Orbit controls
  private cameraDistance = 380;
  private cameraTheta = Math.PI * 0.25;
  private cameraPhi = Math.PI * 0.38;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Animation time
  private time = 0;
  private width = 800;
  private height = 600;

  // Post-processing UnrealBloomPass pipeline
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;

  // 3D Neon Wireframe System
  private wireframeGroup: THREE.Group;
  private wireframeMesh: THREE.LineSegments | null = null;
  private wireframeMaterial: THREE.LineBasicMaterial;

  // Trail persistence quad
  private trailScene: THREE.Scene;
  private trailCamera: THREE.OrthographicCamera;
  private trailMaterial: THREE.MeshBasicMaterial;
  private trailMesh: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement, params: SimulationParams) {
    this.width = canvas.clientWidth || 800;
    this.height = canvas.clientHeight || 600;

    // 1. Initialize Three.js Renderer (Cap pixel ratio at 2)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.autoClear = false;

    // 2. Initialize Scenes & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020704);
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 2000);
    this.updateCameraPosition();

    // Trail overlay for CRT persistence
    this.trailScene = new THREE.Scene();
    this.trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.trailMaterial = new THREE.MeshBasicMaterial({
      color: 0x020704,
      transparent: true,
      opacity: 0.25,
      depthTest: false,
      depthWrite: false,
    });
    const trailGeom = new THREE.PlaneGeometry(2, 2);
    this.trailMesh = new THREE.Mesh(trailGeom, this.trailMaterial);
    this.trailScene.add(this.trailMesh);

    // 3. Generate Visual Style Textures
    this.styleTextures = this.generateStyleTextures();

    // 4. Allocate Particle Buffers
    this.currentPositions = new Float32Array(MAX_PARTICLES * 3);
    this.startPositions = new Float32Array(MAX_PARTICLES * 3);
    this.targetPositions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.staggerOffsets = new Float32Array(MAX_PARTICLES);
    this.curlOffsets = new Float32Array(MAX_PARTICLES * 3);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.staggerOffsets[i] = Math.random() * 0.35; // 0 to 0.35 stagger delay
      this.curlOffsets[i * 3] = (Math.random() - 0.5) * 45;
      this.curlOffsets[i * 3 + 1] = (Math.random() - 0.5) * 45;
      this.curlOffsets[i * 3 + 2] = (Math.random() - 0.5) * 45;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    // 5. Precompute all 8 formation tables
    this.formationTables = this.precomputeFormations();

    // Initial setup: start with default formation ('cloud')
    this.activeFormation = params.formation || 'cloud';
    this.targetFormation = this.activeFormation;
    const initialTable = this.formationTables[this.activeFormation];

    for (let i = 0; i < MAX_PARTICLES * 3; i++) {
      this.currentPositions[i] = initialTable[i];
      this.startPositions[i] = initialTable[i];
      this.targetPositions[i] = initialTable[i];
    }

    // 6. Setup BufferGeometry & Points
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setDrawRange(0, Math.min(params.particleCount, MAX_PARTICLES));

    // Set base colors
    this.updateColors(params.palette || 'toxic_green', this.activeFormation);

    this.material = new THREE.PointsMaterial({
      size: 5.5 * params.glowIntensity,
      map: this.styleTextures[params.visualStyle || 'sparkle'],
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    // 7. Setup 3D Neon Wireframe System
    this.wireframeGroup = new THREE.Group();
    const initialPalette = NEON_PALETTES.find((p) => p.id === params.palette) || NEON_PALETTES[0];
    this.wireframeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(initialPalette.primary),
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const initialWireGeom = this.createWireframeForFormation(this.activeFormation);
    this.wireframeMesh = new THREE.LineSegments(initialWireGeom, this.wireframeMaterial);
    this.wireframeMesh.visible = params.showWireframe ?? true;
    this.wireframeGroup.add(this.wireframeMesh);
    this.scene.add(this.wireframeGroup);

    // 8. Setup UnrealBloomPass & EffectComposer
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderPass = new RenderPass(this.scene, this.camera);
    const bloomRes = new THREE.Vector2(this.width, this.height);
    this.bloomPass = new UnrealBloomPass(
      bloomRes,
      (params.bloomStrength ?? 1.5) * Math.max(0.4, params.glowIntensity),
      params.bloomRadius ?? 0.45,
      params.bloomThreshold ?? 0.12
    );
    this.bloomPass.enabled = params.bloomEnabled ?? true;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
  }

  // -------------------------------------------------------------
  // Wireframe Geometry Factory for Formations
  // -------------------------------------------------------------
  private createWireframeForFormation(formation: FormationType): THREE.BufferGeometry {
    switch (formation) {
      case 'sphere':
        return new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(110, 2));
      case 'helix': {
        const pts: THREE.Vector3[] = [];
        const turns = 4;
        const total = 90;
        for (let i = 0; i < total; i++) {
          const t = (i / total) * Math.PI * 2 * turns;
          const y = (i / total - 0.5) * 220;
          const x1 = Math.cos(t) * 75;
          const z1 = Math.sin(t) * 75;
          const x2 = Math.cos(t + Math.PI) * 75;
          const z2 = Math.sin(t + Math.PI) * 75;
          if (i > 0) {
            const ptPrev = ((i - 1) / total) * Math.PI * 2 * turns;
            const yPrev = ((i - 1) / total - 0.5) * 220;
            pts.push(new THREE.Vector3(Math.cos(ptPrev) * 75, yPrev, Math.sin(ptPrev) * 75));
            pts.push(new THREE.Vector3(x1, y, z1));
            pts.push(new THREE.Vector3(Math.cos(ptPrev + Math.PI) * 75, yPrev, Math.sin(ptPrev + Math.PI) * 75));
            pts.push(new THREE.Vector3(x2, y, z2));
          }
          if (i % 6 === 0) {
            pts.push(new THREE.Vector3(x1, y, z1));
            pts.push(new THREE.Vector3(x2, y, z2));
          }
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }
      case 'torus':
        return new THREE.WireframeGeometry(new THREE.TorusGeometry(95, 32, 10, 28));
      case 'galaxy': {
        const pts: THREE.Vector3[] = [];
        const radii = [45, 80, 115, 150];
        for (const r of radii) {
          const segs = 36;
          for (let s = 0; s < segs; s++) {
            const a1 = (s / segs) * Math.PI * 2;
            const a2 = ((s + 1) / segs) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(a1) * r, 0, Math.sin(a1) * r));
            pts.push(new THREE.Vector3(Math.cos(a2) * r, 0, Math.sin(a2) * r));
          }
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }
      case 'butterfly':
        return new THREE.WireframeGeometry(new THREE.OctahedronGeometry(95, 1));
      case 'heart':
        return new THREE.WireframeGeometry(new THREE.DodecahedronGeometry(85, 1));
      case 'aurora':
        return new THREE.WireframeGeometry(new THREE.PlaneGeometry(240, 140, 8, 5));
      case 'vortex': {
        // Conical stacked rings with connecting struts
        const pts: THREE.Vector3[] = [];
        const ringCount = 7;
        for (let r = 0; r < ringCount; r++) {
          const frac = r / (ringCount - 1);
          const y = -110 + frac * 220;
          const rad = 20 + Math.pow(frac, 1.4) * 120;
          const segs = 24;
          for (let s = 0; s < segs; s++) {
            const a1 = (s / segs) * Math.PI * 2;
            const a2 = ((s + 1) / segs) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(a1) * rad, y, Math.sin(a1) * rad));
            pts.push(new THREE.Vector3(Math.cos(a2) * rad, y, Math.sin(a2) * rad));
            if (r < ringCount - 1 && s % 3 === 0) {
              const nextFrac = (r + 1) / (ringCount - 1);
              const nextY = -110 + nextFrac * 220;
              const nextRad = 20 + Math.pow(nextFrac, 1.4) * 120;
              pts.push(new THREE.Vector3(Math.cos(a1) * rad, y, Math.sin(a1) * rad));
              pts.push(new THREE.Vector3(Math.cos(a1) * nextRad, nextY, Math.sin(a1) * nextRad));
            }
          }
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }
      case 'black_hole': {
        // Event horizon sphere + accretion concentric disk rings
        const pts: THREE.Vector3[] = [];
        const diskRadii = [32, 55, 80, 110, 145];
        for (const dr of diskRadii) {
          const segs = 32;
          for (let s = 0; s < segs; s++) {
            const a1 = (s / segs) * Math.PI * 2;
            const a2 = ((s + 1) / segs) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(a1) * dr, 0, Math.sin(a1) * dr));
            pts.push(new THREE.Vector3(Math.cos(a2) * dr, 0, Math.sin(a2) * dr));
          }
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }
      case 'torus_knot': {
        // Trefoil knot path line
        const pts: THREE.Vector3[] = [];
        const steps = 140;
        for (let i = 0; i < steps; i++) {
          const u1 = (i / steps) * Math.PI * 2;
          const u2 = ((i + 1) / steps) * Math.PI * 2;
          const r1 = 95 + 38 * Math.cos(3 * u1);
          const r2 = 95 + 38 * Math.cos(3 * u2);
          pts.push(new THREE.Vector3(r1 * Math.cos(2 * u1), 46 * Math.sin(3 * u1), r1 * Math.sin(2 * u1)));
          pts.push(new THREE.Vector3(r2 * Math.cos(2 * u2), 46 * Math.sin(3 * u2), r2 * Math.sin(2 * u2)));
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }
      case 'wave_grid':
        return new THREE.WireframeGeometry(new THREE.PlaneGeometry(280, 280, 14, 14));
      case 'supernova':
        return new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(130, 2));
      case 'jellyfish': {
        // Bell dome + hanging tentacle line strands
        const pts: THREE.Vector3[] = [];
        const ribs = 12;
        for (let rib = 0; rib < ribs; rib++) {
          const ang = (rib / ribs) * Math.PI * 2;
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          // Bell arch
          const bellPts = 10;
          for (let b = 0; b < bellPts; b++) {
            const phi1 = (b / bellPts) * (Math.PI * 0.45);
            const phi2 = ((b + 1) / bellPts) * (Math.PI * 0.45);
            pts.push(new THREE.Vector3(90 * Math.sin(phi1) * cosA, 60 + 90 * Math.cos(phi1) * 0.65, 90 * Math.sin(phi1) * sinA));
            pts.push(new THREE.Vector3(90 * Math.sin(phi2) * cosA, 60 + 90 * Math.cos(phi2) * 0.65, 90 * Math.sin(phi2) * sinA));
          }
          // Hanging tentacle line
          pts.push(new THREE.Vector3(65 * cosA, 45, 65 * sinA));
          pts.push(new THREE.Vector3(45 * cosA, -140, 45 * sinA));
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }
      case 'cloud':
      default:
        return new THREE.WireframeGeometry(new THREE.BoxGeometry(190, 190, 190));
    }
  }

  private updateWireframe(formation: FormationType) {
    if (!this.wireframeMesh) return;
    this.wireframeMesh.geometry.dispose();
    this.wireframeMesh.geometry = this.createWireframeForFormation(formation);
  }

  // -------------------------------------------------------------
  // Precomputing Target Positions for all 8 Formations
  // -------------------------------------------------------------
  private precomputeFormations(): Record<FormationType, Float32Array> {
    const N = MAX_PARTICLES;
    const tables: Record<FormationType, Float32Array> = {
      sphere: new Float32Array(N * 3),
      helix: new Float32Array(N * 3),
      torus: new Float32Array(N * 3),
      butterfly: new Float32Array(N * 3),
      aurora: new Float32Array(N * 3),
      galaxy: new Float32Array(N * 3),
      heart: new Float32Array(N * 3),
      cloud: new Float32Array(N * 3),
      vortex: new Float32Array(N * 3),
      black_hole: new Float32Array(N * 3),
      torus_knot: new Float32Array(N * 3),
      wave_grid: new Float32Array(N * 3),
      supernova: new Float32Array(N * 3),
      jellyfish: new Float32Array(N * 3),
    };

    // 1. SPHERE — Fibonacci sphere lattice
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const r = 135 + (Math.random() - 0.5) * 6; // subtle shell depth
      tables.sphere[i * 3] = Math.cos(theta) * radiusAtY * r;
      tables.sphere[i * 3 + 1] = y * r;
      tables.sphere[i * 3 + 2] = Math.sin(theta) * radiusAtY * r;
    }

    // 2. HELIX — double DNA-style spiral with ladder rungs
    for (let i = 0; i < N; i++) {
      const isRung = i % 8 === 0;
      const frac = i / N;
      const y = (frac - 0.5) * 320;
      const turns = 5.5;
      const strand = i % 2;
      const theta = frac * Math.PI * 2 * turns + (strand === 0 ? 0 : Math.PI);
      const r = 68;

      if (isRung) {
        // Linear interpolation across rung
        const rungFrac = ((i % 16) / 16) * 2 - 1;
        tables.helix[i * 3] = Math.cos(theta) * r * rungFrac;
        tables.helix[i * 3 + 1] = y;
        tables.helix[i * 3 + 2] = Math.sin(theta) * r * rungFrac;
      } else {
        const jitter = (Math.random() - 0.5) * 4;
        tables.helix[i * 3] = Math.cos(theta) * (r + jitter);
        tables.helix[i * 3 + 1] = y + jitter;
        tables.helix[i * 3 + 2] = Math.sin(theta) * (r + jitter);
      }
    }

    // 3. TORUS — 3D donut ring
    const R = 115;
    const tubeR = 45;
    for (let i = 0; i < N; i++) {
      const u = (i * 2.3999632) % (Math.PI * 2);
      const v = (i * 1.6180339 * Math.PI * 2) % (Math.PI * 2);
      const rJitter = tubeR + (Math.random() - 0.5) * 8;
      tables.torus[i * 3] = (R + rJitter * Math.cos(v)) * Math.cos(u);
      tables.torus[i * 3 + 1] = rJitter * Math.sin(v);
      tables.torus[i * 3 + 2] = (R + rJitter * Math.cos(v)) * Math.sin(u);
    }

    // 4. BUTTERFLY — 3D flapping butterfly wings silhouette
    for (let i = 0; i < N; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const t = (i / N) * Math.PI * 2;
      // Parametric butterfly wing equation
      const rCurve =
        Math.exp(Math.cos(t)) -
        2 * Math.cos(4 * t) -
        Math.pow(Math.sin(t / 12), 5);
      const span = 26;
      const rawX = Math.sin(t) * rCurve * span;
      const rawY = Math.cos(t) * rCurve * span;

      // Spread along wing plane with depth
      const thickness = (Math.random() - 0.5) * 8;
      const wingX = side * (Math.abs(rawX) + 8 + Math.random() * 6);
      const wingY = rawY + (Math.random() - 0.5) * 6;
      // Slight V-shape angle
      const wingZ = Math.abs(wingX) * 0.22 + thickness;

      tables.butterfly[i * 3] = wingX;
      tables.butterfly[i * 3 + 1] = wingY;
      tables.butterfly[i * 3 + 2] = wingZ;
    }

    // 5. AURORA — vertical flowing curtain waves
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 360;
      const y = (Math.random() - 0.5) * 260;
      // Base wave shape
      const zWave = Math.sin(x * 0.02) * 60 + Math.cos(x * 0.05) * 25;
      const thickness = (Math.random() - 0.5) * 16;

      tables.aurora[i * 3] = x;
      tables.aurora[i * 3 + 1] = y;
      tables.aurora[i * 3 + 2] = zWave + thickness;
    }

    // 6. GALAXY — spiral galaxy with rotating arms and bright core
    for (let i = 0; i < N; i++) {
      const isCore = i < N * 0.22;
      if (isCore) {
        const rad = Math.pow(Math.random(), 2) * 35;
        const theta = Math.random() * Math.PI * 2;
        const zSph = (Math.random() - 0.5) * 20 * (1 - rad / 40);
        tables.galaxy[i * 3] = Math.cos(theta) * rad;
        tables.galaxy[i * 3 + 1] = zSph;
        tables.galaxy[i * 3 + 2] = Math.sin(theta) * rad;
      } else {
        const armIndex = i % 3;
        const rDist = 35 + Math.pow(Math.random(), 0.85) * 160;
        const spiralAngle = armIndex * ((Math.PI * 2) / 3) + 2.5 * Math.log(rDist / 30);
        const scatter = (Math.random() - 0.5) * 0.28;
        const finalTheta = spiralAngle + scatter;
        const diskHeight = (Math.random() - 0.5) * 18 * (1 - rDist / 200);

        tables.galaxy[i * 3] = Math.cos(finalTheta) * rDist;
        tables.galaxy[i * 3 + 1] = diskHeight;
        tables.galaxy[i * 3 + 2] = Math.sin(finalTheta) * rDist;
      }
    }

    // 7. HEART — 3D heart shape
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const s = 6.8;
      const x = 16 * Math.pow(Math.sin(t), 3) * s;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
      const z = (Math.random() - 0.5) * 55 * Math.pow(Math.sin(t), 2);

      tables.heart[i * 3] = x + (Math.random() - 0.5) * 4;
      tables.heart[i * 3 + 1] = y + (Math.random() - 0.5) * 4;
      tables.heart[i * 3 + 2] = z;
    }

    // 8. CLOUD — free-floating organic scatter
    for (let i = 0; i < N; i++) {
      const radius = 20 + Math.cbrt(Math.random()) * 160;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const sinPhi = Math.sin(phi);

      tables.cloud[i * 3] = radius * sinPhi * Math.cos(theta);
      tables.cloud[i * 3 + 1] = radius * sinPhi * Math.sin(theta) * 0.75; // slightly squashed
      tables.cloud[i * 3 + 2] = radius * Math.cos(phi);
    }

    // 9. VORTEX — tornado funnel spiral
    for (let i = 0; i < N; i++) {
      const frac = i / N;
      const y = -120 + frac * 240;
      const hNorm = (y + 120) / 240;
      const r = 18 + Math.pow(hNorm, 1.45) * 130;
      const theta = Math.sqrt(i) * 14.5;
      const dr = (Math.random() - 0.5) * 12;
      tables.vortex[i * 3] = Math.cos(theta) * (r + dr);
      tables.vortex[i * 3 + 1] = y;
      tables.vortex[i * 3 + 2] = Math.sin(theta) * (r + dr);
    }

    // 10. BLACK HOLE — accretion disk with inner event horizon
    const nHorizon = Math.floor(N * 0.22);
    for (let i = 0; i < N; i++) {
      if (i < nHorizon) {
        // Event horizon dense boundary sphere/ring
        const u = i / nHorizon;
        const theta = u * Math.PI * 2 * 12;
        const phi = (u - 0.5) * Math.PI;
        const r = 26 + (Math.random() - 0.5) * 4;
        tables.black_hole[i * 3] = Math.cos(theta) * Math.cos(phi) * r;
        tables.black_hole[i * 3 + 1] = Math.sin(phi) * (r * 0.6);
        tables.black_hole[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r;
      } else {
        // Accretion disk
        const u = (i - nHorizon) / (N - nHorizon);
        const r = 28 + 135 * Math.pow(u, 0.7);
        const theta = i * 2.399963;
        const h = (1.0 - r / 165) * 12.0 * Math.sin(theta * 3) + (Math.random() - 0.5) * 3;
        tables.black_hole[i * 3] = Math.cos(theta) * r;
        tables.black_hole[i * 3 + 1] = h;
        tables.black_hole[i * 3 + 2] = Math.sin(theta) * r;
      }
    }

    // 11. TORUS KNOT — woven 3D trefoil knot (p=2, q=3) with volumetric tube
    for (let i = 0; i < N; i++) {
      const u = (i / N) * Math.PI * 2;
      const knotR = 95 + 38 * Math.cos(3 * u);
      const cx = knotR * Math.cos(2 * u);
      const cz = knotR * Math.sin(2 * u);
      const cy = 46 * Math.sin(3 * u);
      const v = (i * 7.391) % (Math.PI * 2);
      const tubeR = 14 * Math.sqrt(Math.random());
      tables.torus_knot[i * 3] = cx + Math.cos(v) * tubeR;
      tables.torus_knot[i * 3 + 1] = cy + Math.sin(v) * tubeR;
      tables.torus_knot[i * 3 + 2] = cz + Math.sin(v + 1.0) * tubeR * 0.5;
    }

    // 12. WAVE GRID — flat grid in X/Z plane rolling like ocean waves
    const gridDim = Math.floor(Math.sqrt(N));
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / gridDim);
      const col = i % gridDim;
      const x = (col / gridDim - 0.5) * 320;
      const z = (row / gridDim - 0.5) * 320;
      const y = Math.sin(x * 0.035) * 14 + Math.cos(z * 0.035) * 14;
      tables.wave_grid[i * 3] = x;
      tables.wave_grid[i * 3 + 1] = y;
      tables.wave_grid[i * 3 + 2] = z;
    }

    // 13. SUPERNOVA — star core and explosive ejecta shell
    for (let i = 0; i < N; i++) {
      const isCore = i < N * 0.18;
      const r = isCore
        ? 15 + Math.cbrt(Math.random()) * 20
        : 65 + Math.pow(Math.random(), 0.7) * 90;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const sinPhi = Math.sin(phi);
      // Directional ejecta filaments
      const filament = Math.sin(theta * 6) * Math.cos(phi * 6) * 15;
      const finalR = r + (isCore ? 0 : filament);
      tables.supernova[i * 3] = finalR * sinPhi * Math.cos(theta);
      tables.supernova[i * 3 + 1] = finalR * sinPhi * Math.sin(theta);
      tables.supernova[i * 3 + 2] = finalR * Math.cos(phi);
    }

    // 14. JELLYFISH — hemispherical umbrella bell + trailing tentacles
    const nBell = Math.floor(N * 0.45);
    for (let i = 0; i < N; i++) {
      if (i < nBell) {
        // Umbrella bell hemisphere
        const frac = i / nBell;
        const phi = Math.sqrt(frac) * (Math.PI * 0.46);
        const theta = i * 2.399963;
        const r = 92 + (Math.random() - 0.5) * 4;
        tables.jellyfish[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        tables.jellyfish[i * 3 + 1] = 55 + r * Math.cos(phi) * 0.65;
        tables.jellyfish[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      } else {
        // Tentacle strands hanging down
        const tIdx = i - nBell;
        const nTentacles = N - nBell;
        const strand = tIdx % 14;
        const strandAngle = (strand / 14) * Math.PI * 2;
        const tProg = tIdx / nTentacles;
        const y = 50 - tProg * 220;
        const rad = 68 - tProg * 25;
        const ripple = Math.sin(tProg * 14.0) * 8.0;
        tables.jellyfish[i * 3] = Math.cos(strandAngle) * rad + ripple + (Math.random() - 0.5) * 4;
        tables.jellyfish[i * 3 + 1] = y;
        tables.jellyfish[i * 3 + 2] = Math.sin(strandAngle) * rad + ripple + (Math.random() - 0.5) * 4;
      }
    }

    return tables;
  }

  // -------------------------------------------------------------
  // Visual Style Sprites Generation (64x64 Canvas Textures)
  // -------------------------------------------------------------
  private generateStyleTextures(): Record<VisualStyle, THREE.CanvasTexture> {
    const styles: VisualStyle[] = [
      'sparkle',
      'circle',
      'drop',
      'filled_circle',
      'ring',
      'triangle',
      'arrow',
      'square',
    ];

    const textures: Partial<Record<VisualStyle, THREE.CanvasTexture>> = {};

    styles.forEach((st) => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;

      const cx = 32;
      const cy = 32;

      switch (st) {
        case 'sparkle': {
          // 4-point star with soft radial glow
          const rad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
          rad.addColorStop(0, 'rgba(255,255,255,1)');
          rad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
          rad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = rad;
          ctx.fillRect(0, 0, 64, 64);

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx, 4);
          ctx.quadraticCurveTo(cx, cy, 60, cy);
          ctx.quadraticCurveTo(cx, cy, cx, 60);
          ctx.quadraticCurveTo(cx, cy, 4, cy);
          ctx.quadraticCurveTo(cx, cy, cx, 4);
          ctx.fill();
          break;
        }

        case 'circle': {
          // Hollow crisp circle
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case 'drop': {
          // Teardrop shape
          ctx.beginPath();
          ctx.moveTo(cx, 10);
          ctx.bezierCurveTo(46, 26, 46, 48, cx, 52);
          ctx.bezierCurveTo(18, 48, 18, 26, cx, 10);
          ctx.fill();
          break;
        }

        case 'filled_circle': {
          // Solid antialiased disc with subtle soft edge
          const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
          rad.addColorStop(0, 'rgba(255,255,255,1)');
          rad.addColorStop(0.85, 'rgba(255,255,255,0.95)');
          rad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'ring': {
          // Double concentric ring
          ctx.beginPath();
          ctx.arc(cx, cy, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case 'triangle': {
          // Equilateral triangle
          ctx.beginPath();
          ctx.moveTo(cx, 10);
          ctx.lineTo(54, 50);
          ctx.lineTo(10, 50);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'arrow': {
          // Upward retro chevron / arrow
          ctx.beginPath();
          ctx.moveTo(cx, 10);
          ctx.lineTo(52, 48);
          ctx.lineTo(cx, 38);
          ctx.lineTo(12, 48);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'square': {
          // Crisp monospace square
          ctx.fillRect(14, 14, 36, 36);
          break;
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      textures[st] = tex;
    });

    return textures as Record<VisualStyle, THREE.CanvasTexture>;
  }

  // -------------------------------------------------------------
  // Formation Trigger & Smooth Morphing Transition (~1.5s)
  // -------------------------------------------------------------
  public setFormation(newFormation: FormationType) {
    if (this.targetFormation === newFormation && !this.isMorphing) return;

    // Capture current in-flight positions as start positions for seamless redirection (no teleporting)
    for (let i = 0; i < MAX_PARTICLES * 3; i++) {
      this.startPositions[i] = this.currentPositions[i];
    }

    this.targetFormation = newFormation;
    this.updateWireframe(newFormation);
    const targetTable = this.formationTables[newFormation];
    for (let i = 0; i < MAX_PARTICLES * 3; i++) {
      this.targetPositions[i] = targetTable[i];
    }

    this.isMorphing = true;
    this.morphTime = 0.0;
  }

  public setVisualStyle(style: VisualStyle) {
    if (this.styleTextures[style]) {
      this.material.map = this.styleTextures[style];
      this.material.needsUpdate = true;
    }
  }

  public triggerChoreography(type: PresetMotionType) {
    this.activeChoreography = type;
    this.choreographyTime = 0.0;
  }

  public getChoreographyState(): { active: PresetMotionType | null; progress: number; remaining: number } {
    if (!this.activeChoreography) return { active: null, progress: 0, remaining: 0 };
    const prog = Math.min(1.0, this.choreographyTime / this.choreographyDuration);
    const rem = Math.max(0, this.choreographyDuration - this.choreographyTime);
    return { active: this.activeChoreography, progress: prog, remaining: rem };
  }

  // -------------------------------------------------------------
  // Camera Orbit Dragging
  // -------------------------------------------------------------
  public handlePointerDown(x: number, y: number) {
    this.isDragging = true;
    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  public handlePointerMove(x: number, y: number) {
    if (this.isDragging) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;

      this.cameraTheta -= dx * 0.007;
      this.cameraPhi = Math.max(0.12, Math.min(Math.PI - 0.12, this.cameraPhi - dy * 0.007));

      this.lastMouseX = x;
      this.lastMouseY = y;
      this.updateCameraPosition();
    }
  }

  public handlePointerUp() {
    this.isDragging = false;
  }

  public handleWheel(deltaY: number) {
    this.cameraDistance = Math.max(160, Math.min(750, this.cameraDistance + deltaY * 0.45));
    this.updateCameraPosition();
  }

  private updateCameraPosition() {
    this.camera.position.x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.y = this.cameraDistance * Math.cos(this.cameraPhi);
    this.camera.position.z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    this.camera.lookAt(0, 0, 0);
  }

  public resize(width: number, height: number) {
    this.width = Math.max(width, 200);
    this.height = Math.max(height, 200);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
    this.composer.setSize(this.width, this.height);
    this.bloomPass.resolution.set(this.width, this.height);
  }

  public burst(intensity = 1.0) {
    // Inject energetic displacement pulse
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const idx = i * 3;
      const len = Math.sqrt(
        this.currentPositions[idx] ** 2 +
        this.currentPositions[idx + 1] ** 2 +
        this.currentPositions[idx + 2] ** 2
      ) + 0.1;
      const factor = (30 * intensity) / len;
      this.currentPositions[idx] += this.currentPositions[idx] * factor;
      this.currentPositions[idx + 1] += this.currentPositions[idx + 1] * factor;
      this.currentPositions[idx + 2] += this.currentPositions[idx + 2] * factor;
    }
  }

  // -------------------------------------------------------------
  // Colors Setup (Preset Neon Theme Gradients, Aurora & Galaxy)
  // -------------------------------------------------------------
  public updateColors(paletteId: NeonPaletteId, formation: FormationType) {
    this.currentPalette = paletteId;
    const isAurora = formation === 'aurora';
    const isGalaxy = formation === 'galaxy';

    const pal = NEON_PALETTES.find((p) => p.id === paletteId) || NEON_PALETTES[0];
    const colorPrimary = new THREE.Color(pal.primary);
    const colorSecondary = new THREE.Color(pal.secondary);
    const colorAccent = new THREE.Color(pal.accent);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const idx = i * 3;
      if (isAurora) {
        // Vertical flowing gradient: primary at bottom (y < 0) to accent/secondary at top (y > 0)
        const yNorm = Math.max(0, Math.min(1, (this.currentPositions[idx + 1] + 130) / 260));
        const col = colorPrimary.clone().lerp(colorAccent, yNorm);
        this.colors[idx] = col.r;
        this.colors[idx + 1] = col.g;
        this.colors[idx + 2] = col.b;
      } else if (isGalaxy && i < MAX_PARTICLES * 0.18) {
        // Bright stellar core with accent tint
        const col = white.clone().lerp(colorAccent, 0.25);
        this.colors[idx] = col.r;
        this.colors[idx + 1] = col.g;
        this.colors[idx + 2] = col.b;
      } else {
        // Dual-tone harmonic shading: interpolate primary <-> secondary with periodic accent highlights
        const t = (i % 24) / 24;
        let col = colorPrimary.clone().lerp(colorSecondary, t);
        if (i % 31 === 0) {
          col = colorAccent;
        }
        this.colors[idx] = col.r;
        this.colors[idx + 1] = col.g;
        this.colors[idx + 2] = col.b;
      }
    }
    if (this.geometry) {
      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      if (colorAttr) colorAttr.needsUpdate = true;
    }
  }

  // -------------------------------------------------------------
  // Update & Render Loop
  // -------------------------------------------------------------
  public update(params: SimulationParams, dt: number) {
    this.time += dt * params.speed;

    // Automated Camera Orbiting (Hands-free 360 viewing)
    if (params.autoOrbit && !this.isDragging) {
      const orbitSpeed = params.autoOrbitSpeed ?? 0.8;
      this.cameraTheta += dt * 0.32 * orbitSpeed;
      const targetPhi = Math.PI * 0.38 + Math.sin(this.time * 0.25 * orbitSpeed) * 0.06;
      this.cameraPhi += (targetPhi - this.cameraPhi) * 0.04;
      this.updateCameraPosition();
    }

    // Check if formation or style changed from props
    if (params.formation !== this.targetFormation) {
      this.setFormation(params.formation);
    }

    // Update draw range based on Particle Count slider
    const visibleCount = Math.min(params.particleCount, MAX_PARTICLES);
    this.geometry.setDrawRange(0, visibleCount);

    // Update material properties
    this.material.size = 5.2 * params.glowIntensity;
    this.currentTrailPersistence = params.trailPersistence;
    const fadeOpacity = Math.max(0.015, Math.min(1.0, Math.pow(1.0 - params.trailPersistence, 1.4)));
    this.trailMaterial.opacity = fadeOpacity;

    // Update UnrealBloomPass
    const bloomEnabled = params.bloomEnabled ?? true;
    this.bloomPass.enabled = bloomEnabled;
    this.bloomPass.strength = (params.bloomStrength ?? 1.5) * Math.max(0.4, params.glowIntensity);
    this.bloomPass.radius = params.bloomRadius ?? 0.45;
    this.bloomPass.threshold = params.bloomThreshold ?? 0.12;

    // Update 3D Neon Wireframe System
    if (this.wireframeMesh) {
      this.wireframeMesh.visible = params.showWireframe ?? true;
      const pal = NEON_PALETTES.find((p) => p.id === params.palette) || NEON_PALETTES[0];
      this.wireframeMaterial.color.set(pal.primary);
      this.wireframeMaterial.opacity = 0.55 * Math.min(1.5, params.glowIntensity);
      this.wireframeGroup.rotation.y += dt * 0.25 * params.speed;
      this.wireframeGroup.rotation.x += dt * 0.12 * params.speed;
    }

    // Morphing progress update
    let morphDone = false;
    let globalT = 1.0;
    if (this.isMorphing) {
      this.morphTime += dt * params.speed;
      globalT = Math.min(1.0, this.morphTime / this.morphDuration);
      if (globalT >= 1.0) {
        this.isMorphing = false;
        this.activeFormation = this.targetFormation;
        morphDone = true;
      }
    }

    const currentF = this.isMorphing ? this.targetFormation : this.activeFormation;
    const targetTable = this.formationTables[currentF];

    // Generative Choreography Progress (Pulse, Wave, Swirl, Chaos)
    if (params.activeMotion && params.activeMotion !== this.activeChoreography) {
      this.triggerChoreography(params.activeMotion);
    }

    let choreoEnvelope = 0.0;
    if (this.activeChoreography) {
      this.choreographyTime += dt * Math.max(0.6, params.speed * 0.85);
      const prog = this.choreographyTime / this.choreographyDuration;
      if (prog >= 1.0) {
        this.activeChoreography = null;
        this.choreographyTime = 0.0;
        if (params.activeMotion) {
          params.activeMotion = null;
        }
      } else {
        // Bell-curve ease in and out: peaks at midpoint (1.0) and eases back to 0.0
        choreoEnvelope = Math.sin(prog * Math.PI);
      }
    }

    // Morph or animate particles
    const simTime = this.time;
    const simSpeed = params.speed;

    for (let i = 0; i < visibleCount; i++) {
      const idx = i * 3;
      const targetX = targetTable[idx];
      const targetY = targetTable[idx + 1];
      const targetZ = targetTable[idx + 2];

      if (this.isMorphing) {
        // Eased interpolation with stagger offset
        const stag = this.staggerOffsets[i];
        const pT = Math.max(0, Math.min(1, (globalT - stag) / (1.0 - stag)));

        // Smooth cubic ease-in-out
        const ease = pT < 0.5 ? 4 * pT * pT * pT : 1 - Math.pow(-2 * pT + 2, 3) / 2;

        // Swarm curl during transit (no per-frame allocation)
        const curlScale = Math.sin(Math.PI * pT) * 32.0;
        const cx = this.curlOffsets[idx] * curlScale * 0.02;
        const cy = this.curlOffsets[idx + 1] * curlScale * 0.02;
        const cz = this.curlOffsets[idx + 2] * curlScale * 0.02;

        this.currentPositions[idx] = this.startPositions[idx] + (targetX - this.startPositions[idx]) * ease + cx;
        this.currentPositions[idx + 1] = this.startPositions[idx + 1] + (targetY - this.startPositions[idx + 1]) * ease + cy;
        this.currentPositions[idx + 2] = this.startPositions[idx + 2] + (targetZ - this.startPositions[idx + 2]) * ease + cz;
      } else {
        // Dynamic Formation Behavior (Each shape has organic life)
        switch (currentF) {
          case 'sphere': {
            // Slowly rotating sphere
            const ang = simTime * 0.35 * simSpeed;
            const cosA = Math.cos(ang);
            const sinA = Math.sin(ang);
            const x0 = targetX;
            const z0 = targetZ;
            this.currentPositions[idx] = x0 * cosA - z0 * sinA;
            this.currentPositions[idx + 1] = targetY;
            this.currentPositions[idx + 2] = x0 * sinA + z0 * cosA;
            break;
          }

          case 'helix': {
            // DNA-style rotating spiral + flow along strands
            const ang = simTime * 0.6 * simSpeed;
            const cosA = Math.cos(ang);
            const sinA = Math.sin(ang);
            const x0 = targetX;
            const z0 = targetZ;
            this.currentPositions[idx] = x0 * cosA - z0 * sinA;
            this.currentPositions[idx + 1] = targetY;
            this.currentPositions[idx + 2] = x0 * sinA + z0 * cosA;
            break;
          }

          case 'torus': {
            // Rotating 3D donut ring
            const ang = simTime * 0.45 * simSpeed;
            const cosA = Math.cos(ang);
            const sinA = Math.sin(ang);
            const x0 = targetX;
            const z0 = targetZ;
            this.currentPositions[idx] = x0 * cosA - z0 * sinA;
            this.currentPositions[idx + 1] = targetY;
            this.currentPositions[idx + 2] = x0 * sinA + z0 * cosA;
            break;
          }

          case 'butterfly': {
            // Butterfly silhouette with gentle wing FLAP (wave deformation)
            const flapSpeed = simTime * 3.8 * simSpeed;
            const distFromCenter = Math.abs(targetX);
            const flapWave = Math.sin(flapSpeed - distFromCenter * 0.025) * 26.0 * (distFromCenter / 140.0);
            this.currentPositions[idx] = targetX;
            this.currentPositions[idx + 1] = targetY;
            this.currentPositions[idx + 2] = targetZ + flapWave;
            break;
          }

          case 'aurora': {
            // Vertical flowing curtain waves drifting and rippling
            const rip =
              Math.sin(targetX * 0.02 + simTime * 1.5 * simSpeed) * 38.0 +
              Math.cos(targetX * 0.05 + simTime * 1.0 * simSpeed) * 18.0;
            this.currentPositions[idx] = targetX;
            this.currentPositions[idx + 1] = targetY;
            this.currentPositions[idx + 2] = targetZ + rip;
            break;
          }

          case 'galaxy': {
            // Spiral galaxy with rotating arms and bright core
            const dist = Math.sqrt(targetX * targetX + targetZ * targetZ) + 0.1;
            const rotSpeed = (simTime * 45.0 * simSpeed) / (dist + 35.0);
            const cosA = Math.cos(rotSpeed);
            const sinA = Math.sin(rotSpeed);
            this.currentPositions[idx] = targetX * cosA - targetZ * sinA;
            this.currentPositions[idx + 1] = targetY;
            this.currentPositions[idx + 2] = targetX * sinA + targetZ * cosA;
            break;
          }

          case 'heart': {
            // 3D heart with subtle heartbeat pulse (lub-dub rhythm)
            const beat = Math.sin(simTime * 3.2 * simSpeed);
            const pulse = 1.0 + Math.pow(Math.max(0, beat), 4) * 0.08 + Math.pow(Math.max(0, Math.sin(simTime * 3.2 * simSpeed + 0.45)), 4) * 0.04;
            this.currentPositions[idx] = targetX * pulse;
            this.currentPositions[idx + 1] = targetY * pulse;
            this.currentPositions[idx + 2] = targetZ * pulse;
            break;
          }

          case 'vortex': {
            // Particles spiral into a tornado funnel, rotating faster near the top
            const hNorm = Math.max(0, Math.min(1, (targetY + 120) / 240));
            const angSpeed = (0.7 + hNorm * 2.8) * simSpeed;
            const ang = simTime * angSpeed;
            const cosA = Math.cos(ang);
            const sinA = Math.sin(ang);
            const rx = targetX * cosA - targetZ * sinA;
            const rz = targetX * sinA + targetZ * cosA;
            const lift = Math.sin(simTime * 2.5 * simSpeed + targetY * 0.05) * 5.0;
            this.currentPositions[idx] = rx;
            this.currentPositions[idx + 1] = targetY + lift;
            this.currentPositions[idx + 2] = rz;
            break;
          }

          case 'black_hole': {
            // Glowing accretion disk, particles slowly spiral inward and respawn at the rim
            const baseR = Math.sqrt(targetX * targetX + targetZ * targetZ) + 0.1;
            const keplerOmega = (80.0 / Math.sqrt(Math.max(26, baseR))) * simSpeed;
            const inwardShift = (simTime * 24.0 * simSpeed) % 135.0;
            let rLive = baseR - inwardShift;
            if (rLive < 26.0) {
              rLive = 160.0 - (26.0 - rLive); // respawn at the rim
            }
            const ang = Math.atan2(targetZ, targetX) + simTime * keplerOmega;
            const dip = rLive < 50 ? -Math.pow((50 - rLive) / 24, 1.8) * 16 : 0;
            this.currentPositions[idx] = Math.cos(ang) * rLive;
            this.currentPositions[idx + 1] = targetY * (rLive / baseR) + dip;
            this.currentPositions[idx + 2] = Math.sin(ang) * rLive;
            break;
          }

          case 'torus_knot': {
            // Particles trace a woven 3D knot, flowing along the path
            const baseU = (i / visibleCount) * Math.PI * 2;
            const liveU = baseU + simTime * 0.35 * simSpeed;
            const knotR = 95 + 38 * Math.cos(3 * liveU);
            const kx = knotR * Math.cos(2 * liveU);
            const kz = knotR * Math.sin(2 * liveU);
            const ky = 46 * Math.sin(3 * liveU);
            const jx = targetX - (95 + 38 * Math.cos(3 * baseU)) * Math.cos(2 * baseU);
            const jy = targetY - 46 * Math.sin(3 * baseU);
            const jz = targetZ - (95 + 38 * Math.cos(3 * baseU)) * Math.sin(2 * baseU);
            this.currentPositions[idx] = kx + jx;
            this.currentPositions[idx + 1] = ky + jy;
            this.currentPositions[idx + 2] = kz + jz;
            break;
          }

          case 'wave_grid': {
            // Flat grid of particles rolling like ocean waves
            const oceanW1 = Math.sin(targetX * 0.035 + simTime * 3.2 * simSpeed) * 24.0;
            const oceanW2 = Math.cos(targetZ * 0.038 + simTime * 2.4 * simSpeed) * 18.0;
            const oceanW3 = Math.sin((targetX + targetZ) * 0.02 + simTime * 4.0 * simSpeed) * 12.0;
            this.currentPositions[idx] = targetX;
            this.currentPositions[idx + 1] = oceanW1 + oceanW2 + oceanW3;
            this.currentPositions[idx + 2] = targetZ;
            break;
          }

          case 'supernova': {
            // Loop: collapse inward → pause → burst outward → reform
            const cycle = (simTime * simSpeed * 0.5) % 4.0;
            let scale = 1.0;
            if (cycle < 1.4) {
              // 1. Collapse inward (1.4s)
              const t = cycle / 1.4;
              scale = 1.0 - Math.pow(t, 2) * 0.88;
            } else if (cycle < 1.8) {
              // 2. Pause & quantum core compression (0.4s)
              const t = (cycle - 1.4) / 0.4;
              scale = 0.12 + Math.sin(t * Math.PI * 6) * 0.025;
            } else if (cycle < 3.0) {
              // 3. Supersonic outward burst (1.2s)
              const t = (cycle - 1.8) / 1.2;
              const blastEase = 1 - Math.pow(1 - t, 3);
              scale = 0.12 + blastEase * 1.68;
            } else {
              // 4. Reform back to 1.0 (1.0s)
              const t = (cycle - 3.0) / 1.0;
              scale = 1.8 - t * 0.8;
            }
            this.currentPositions[idx] = targetX * scale;
            this.currentPositions[idx + 1] = targetY * scale;
            this.currentPositions[idx + 2] = targetZ * scale;
            break;
          }

          case 'jellyfish': {
            // Pulsing bell shape with tentacle trails of particles
            const swimCycle = (simTime * 2.6 * simSpeed) % (Math.PI * 2);
            const contract = Math.sin(swimCycle);
            const bellPulse = 1.0 + (contract > 0 ? Math.pow(contract, 2) * 0.22 : contract * 0.08);

            if (targetY > 30) {
              // Umbrella bell
              this.currentPositions[idx] = targetX * bellPulse;
              this.currentPositions[idx + 1] = targetY + Math.sin(simTime * 2.6 * simSpeed) * 12.0;
              this.currentPositions[idx + 2] = targetZ * bellPulse;
            } else {
              // Tentacle trails undulating with phase delay based on depth
              const depthLag = (30 - targetY) * 0.04;
              const waveX = Math.sin(simTime * 3.0 * simSpeed - depthLag) * (14.0 * (1.0 - targetY / -180));
              const waveZ = Math.cos(simTime * 2.5 * simSpeed - depthLag) * (14.0 * (1.0 - targetY / -180));
              this.currentPositions[idx] = targetX + waveX;
              this.currentPositions[idx + 1] = targetY + Math.sin(simTime * 2.6 * simSpeed) * 12.0;
              this.currentPositions[idx + 2] = targetZ + waveZ;
            }
            break;
          }

          case 'cloud':
          default: {
            // Free-floating scatter with subtle Brownian wander
            const wanderX = Math.sin(simTime * 0.8 + i) * 6.0;
            const wanderY = Math.cos(simTime * 0.7 + i * 1.5) * 6.0;
            const wanderZ = Math.sin(simTime * 0.9 + i * 2.0) * 6.0;
            this.currentPositions[idx] = targetX + wanderX;
            this.currentPositions[idx + 1] = targetY + wanderY;
            this.currentPositions[idx + 2] = targetZ + wanderZ;
            break;
          }
        }
      }

      // Apply Generative Choreography if active (Pulse, Wave, Swirl, Chaos)
      if (choreoEnvelope > 0.001 && this.activeChoreography) {
        const px = this.currentPositions[idx];
        const py = this.currentPositions[idx + 1];
        const pz = this.currentPositions[idx + 2];
        const r = Math.sqrt(px * px + py * py + pz * pz) + 0.1;

        switch (this.activeChoreography) {
          case 'pulse': {
            // Concentric harmonic breathing / shockwave expansion
            const pulsePhase = r * 0.038 - simTime * 9.0;
            const amp = Math.sin(pulsePhase) * 65.0 * choreoEnvelope;
            this.currentPositions[idx] += (px / r) * amp;
            this.currentPositions[idx + 1] += (py / r) * amp;
            this.currentPositions[idx + 2] += (pz / r) * amp;
            break;
          }

          case 'wave': {
            // Transverse wave ripples propagating across coordinates
            const waveY = Math.sin(px * 0.025 + simTime * 6.0) * Math.cos(pz * 0.025 + simTime * 4.0) * 58.0 * choreoEnvelope;
            const waveZ = Math.cos(py * 0.025 + simTime * 5.0) * 42.0 * choreoEnvelope;
            const waveX = Math.sin(pz * 0.028 + simTime * 5.2) * 36.0 * choreoEnvelope;
            this.currentPositions[idx] += waveX;
            this.currentPositions[idx + 1] += waveY;
            this.currentPositions[idx + 2] += waveZ;
            break;
          }

          case 'swirl': {
            // High-velocity vortex twist / whirlpool
            const rXZ = Math.sqrt(px * px + pz * pz) + 0.1;
            const vortexAngle = (1.0 - Math.min(1.0, rXZ / 250.0)) * 5.0 * Math.sin(simTime * 3.5) * choreoEnvelope;
            const cosV = Math.cos(vortexAngle);
            const sinV = Math.sin(vortexAngle);
            const rx = px * cosV - pz * sinV;
            const rz = px * sinV + pz * cosV;
            this.currentPositions[idx] = rx;
            this.currentPositions[idx + 2] = rz;
            this.currentPositions[idx + 1] += Math.sin(rXZ * 0.04 + simTime * 5.5) * 38.0 * choreoEnvelope;
            break;
          }

          case 'chaos': {
            // Turbulent Brownian quantum dispersion
            const cx = Math.sin(py * 0.07 + simTime * 8.0) * Math.cos(pz * 0.07) * 52.0 * choreoEnvelope;
            const cy = Math.cos(px * 0.07 + simTime * 8.0) * Math.sin(pz * 0.07) * 52.0 * choreoEnvelope;
            const cz = Math.sin(px * 0.07) * Math.cos(py * 0.07 + simTime * 8.0) * 52.0 * choreoEnvelope;
            this.currentPositions[idx] += cx;
            this.currentPositions[idx + 1] += cy;
            this.currentPositions[idx + 2] += cz;
            break;
          }
        }
      }
    }

    const paletteChanged = params.palette !== this.currentPalette;
    if (paletteChanged || morphDone || currentF === 'aurora') {
      this.updateColors(params.palette, currentF);
    }

    if (this.geometry) {
      const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (posAttr) posAttr.needsUpdate = true;
    }
  }

  public render() {
    if (this.bloomPass.enabled) {
      this.composer.render();
    } else {
      if (this.currentTrailPersistence <= 0.01) {
        this.renderer.clear();
      } else {
        this.renderer.render(this.trailScene, this.trailCamera);
      }
      this.renderer.render(this.scene, this.camera);
    }
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
    if (this.wireframeMesh) {
      this.wireframeMesh.geometry.dispose();
      this.wireframeMaterial.dispose();
    }
    Object.values(this.styleTextures).forEach((t) => t.dispose());
    this.composer.dispose();
    this.renderer.dispose();
  }
}
