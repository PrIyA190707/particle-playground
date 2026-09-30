import { SimulationParams, ShapeType } from '../types/simulation';

interface Point3D {
  x: number;
  y: number;
  z: number;
  w?: number;
}

interface Edge {
  a: number;
  b: number;
}

export class ShapesSim {
  private width = 800;
  private height = 600;
  private rotX = 0.4;
  private rotY = 0.6;
  private rotZ = 0.2;
  private rot4D = 0.0;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private mouse = { x: -9999, y: -9999, down: false };
  private time = 0;
  private burstWave = 0;

  // Cached geometry
  private vertices: Point3D[] = [];
  private edges: Edge[] = [];
  private currentShapeType: ShapeType = 'tesseract';
  private currentDensity = 12;

  constructor(width: number, height: number, params: SimulationParams) {
    this.resize(width, height);
    this.rebuildGeometry(params);
  }

  public resize(width: number, height: number) {
    this.width = Math.max(width, 200);
    this.height = Math.max(height, 200);
  }

  public handleMouseDown(x: number, y: number) {
    this.isDragging = true;
    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  public handleMouseMove(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
    if (this.isDragging) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;
      this.rotY += dx * 0.008;
      this.rotX += dy * 0.008;
      this.lastMouseX = x;
      this.lastMouseY = y;
    }
  }

  public handleMouseUp() {
    this.isDragging = false;
  }

  public burst() {
    this.burstWave = 1.0;
  }

  public rebuildGeometry(params: SimulationParams) {
    this.currentShapeType = params.shapeType;
    this.currentDensity = params.wireframeDensity;
    this.vertices = [];
    this.edges = [];

    switch (params.shapeType) {
      case 'tesseract':
        this.buildTesseract();
        break;
      case 'icosahedron':
        this.buildIcosahedron();
        break;
      case 'torus_knot':
        this.buildTorusKnot(params.wireframeDensity);
        break;
      case 'geodesic':
        this.buildGeodesicSphere(params.wireframeDensity);
        break;
      case 'lissajous':
        this.buildLissajousLattice(params.wireframeDensity);
        break;
      default:
        this.buildTesseract();
        break;
    }
  }

  // 1. Tesseract 4D Hypercube
  private buildTesseract() {
    const s = 1.2;
    // 16 vertices in 4D
    for (let i = 0; i < 16; i++) {
      const x = (i & 1 ? 1 : -1) * s;
      const y = (i & 2 ? 1 : -1) * s;
      const z = (i & 4 ? 1 : -1) * s;
      const w = (i & 8 ? 1 : -1) * s;
      this.vertices.push({ x, y, z, w });
    }

    // 32 edges: connect vertices that differ by exactly 1 bit
    for (let i = 0; i < 16; i++) {
      for (let bit = 1; bit < 16; bit <<= 1) {
        if ((i & bit) === 0) {
          this.edges.push({ a: i, b: i | bit });
        }
      }
    }
  }

  // 2. Icosahedron (12 vertices, 30 edges)
  private buildIcosahedron() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const s = 1.5;
    const v: Point3D[] = [
      { x: -1, y: phi, z: 0 },
      { x: 1, y: phi, z: 0 },
      { x: -1, y: -phi, z: 0 },
      { x: 1, y: -phi, z: 0 },
      { x: 0, y: -1, z: phi },
      { x: 0, y: 1, z: phi },
      { x: 0, y: -1, z: -phi },
      { x: 0, y: 1, z: -phi },
      { x: phi, y: 0, z: -1 },
      { x: phi, y: 0, z: 1 },
      { x: -phi, y: 0, z: -1 },
      { x: -phi, y: 0, z: 1 },
    ];

    this.vertices = v.map((p) => {
      const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      return { x: (p.x / len) * s * 1.6, y: (p.y / len) * s * 1.6, z: (p.z / len) * s * 1.6 };
    });

    const edgeIndices: [number, number][] = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
      [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
      [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
      [4, 5], [5, 9], [9, 1], [1, 8], [8, 7],
      [7, 6], [6, 10], [10, 2], [2, 11], [11, 4],
    ];

    this.edges = edgeIndices.map(([a, b]) => ({ a, b }));
  }

  // 3. Torus Knot (p=2, q=3 trefoil knot tube)
  private buildTorusKnot(density: number) {
    const segments = Math.max(36, density * 6);
    const ringSegments = 6;
    const R = 1.4;
    const r = 0.45;
    const p = 2;
    const q = 3;

    for (let i = 0; i < segments; i++) {
      const u = (i / segments) * Math.PI * 2;
      const r_u = R + r * Math.cos(q * u);
      const cx = r_u * Math.cos(p * u);
      const cy = r_u * Math.sin(p * u);
      const cz = -Math.sin(q * u) * 0.9;

      // Circle cross section
      for (let j = 0; j < ringSegments; j++) {
        const theta = (j / ringSegments) * Math.PI * 2;
        const tubeR = 0.22;
        const ox = Math.cos(theta) * tubeR;
        const oy = Math.sin(theta) * tubeR;
        this.vertices.push({ x: cx + ox, y: cy + oy, z: cz });

        // Connect ring
        const currentIdx = i * ringSegments + j;
        const nextInRing = i * ringSegments + ((j + 1) % ringSegments);
        this.edges.push({ a: currentIdx, b: nextInRing });

        // Connect along tube
        const nextSegmentIdx = ((i + 1) % segments) * ringSegments + j;
        this.edges.push({ a: currentIdx, b: nextSegmentIdx });
      }
    }
  }

  // 4. Geodesic Sphere
  private buildGeodesicSphere(density: number) {
    const rings = Math.max(6, Math.min(18, density));
    const sectors = rings * 2;
    const radius = 1.6;

    for (let r = 0; r <= rings; r++) {
      const phi = (r / rings) * Math.PI;
      for (let s = 0; s < sectors; s++) {
        const theta = (s / sectors) * Math.PI * 2;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        this.vertices.push({ x, y, z });

        const curr = r * sectors + s;
        // Connect sector ring
        const nextS = r * sectors + ((s + 1) % sectors);
        this.edges.push({ a: curr, b: nextS });

        // Connect longitudinal ring
        if (r < rings) {
          const nextR = (r + 1) * sectors + s;
          this.edges.push({ a: curr, b: nextR });
          // Diagonal for triangulation
          const nextDiag = (r + 1) * sectors + ((s + 1) % sectors);
          this.edges.push({ a: curr, b: nextDiag });
        }
      }
    }
  }

  // 5. Lissajous 3D Harmonic Grid
  private buildLissajousLattice(density: number) {
    const count = Math.max(40, density * 8);
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const x = Math.sin(3 * t) * 1.6;
      const y = Math.sin(4 * t + 0.5) * 1.4;
      const z = Math.cos(5 * t) * 1.3;
      this.vertices.push({ x, y, z });

      if (i > 0) {
        this.edges.push({ a: i - 1, b: i });
      }
      // Cross-bridges for cyber lattice aesthetic
      if (i >= 8 && i % 4 === 0) {
        this.edges.push({ a: i, b: i - 8 });
      }
    }
    if (count > 0) {
      this.edges.push({ a: count - 1, b: 0 });
    }
  }

  public update(params: SimulationParams, dt: number) {
    this.time += dt * params.speed;

    // Check if shape type or density changed
    if (params.shapeType !== this.currentShapeType || params.wireframeDensity !== this.currentDensity) {
      this.rebuildGeometry(params);
    }

    // Auto-rotation from sliders
    if (!this.isDragging) {
      this.rotX += params.rotationSpeedX * 0.015 * params.speed * (dt * 60);
      this.rotY += params.rotationSpeedY * 0.02 * params.speed * (dt * 60);
      this.rotZ += params.rotationSpeedZ * 0.01 * params.speed * (dt * 60);
    }

    // 4D rotation for tesseract
    this.rot4D += 0.018 * params.speed * (dt * 60);

    // Decay burst wave
    if (this.burstWave > 0) {
      this.burstWave = Math.max(0, this.burstWave - 0.03 * (dt * 60));
    }
  }

  public render(ctx: CanvasRenderingContext2D, params: SimulationParams) {
    // Clear canvas with trail persistence
    const fadeAlpha = 1.0 - Math.min(Math.max(params.trailPersistence, 0.05), 0.92);
    ctx.fillStyle = `rgba(2, 7, 3, ${fadeAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Render coordinate grid and background radar circles
    this.renderTerminalHUD(ctx);

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const baseScale = Math.min(this.width, this.height) * 0.28 * params.shapeScale;

    // Rotation matrices
    const cosX = Math.cos(this.rotX);
    const sinX = Math.sin(this.rotX);
    const cosY = Math.cos(this.rotY);
    const sinY = Math.sin(this.rotY);
    const cosZ = Math.cos(this.rotZ);
    const sinZ = Math.sin(this.rotZ);

    // 4D rotation angle for tesseract
    const cos4D = Math.cos(this.rot4D);
    const sin4D = Math.sin(this.rot4D);

    const projected: { x: number; y: number; z: number; origIndex: number }[] = [];

    // Project each vertex
    for (let i = 0; i < this.vertices.length; i++) {
      let p = { ...this.vertices[i] };

      // Morphing / sine deformation
      if (params.morphIntensity > 0.01) {
        const deform = Math.sin(this.time * 2.5 + p.x * 2.0 + p.y * 2.0) * params.morphIntensity * 0.35;
        p.x += p.x * deform;
        p.y += p.y * deform;
        p.z += p.z * deform;
      }

      // Explode displacement along vertex vector
      if (params.explodeOffset > 0.01 || this.burstWave > 0) {
        const totalExplode = params.explodeOffset + this.burstWave * 0.8;
        p.x *= 1 + totalExplode * 0.9;
        p.y *= 1 + totalExplode * 0.9;
        p.z *= 1 + totalExplode * 0.9;
      }

      // 4D Rotation for Tesseract in X-W plane and Z-W plane
      if (p.w !== undefined) {
        const x1 = p.x * cos4D - p.w * sin4D;
        const w1 = p.x * sin4D + p.w * cos4D;
        p.x = x1;
        p.w = w1;

        // 4D to 3D stereographic projection
        const d4 = 2.8;
        const wFactor = 1 / (d4 - p.w * 0.45);
        p.x *= wFactor * 2.2;
        p.y *= wFactor * 2.2;
        p.z *= wFactor * 2.2;
      }

      // 3D Rotation: Y-axis
      let x1 = p.x * cosY + p.z * sinY;
      let z1 = -p.x * sinY + p.z * cosY;

      // 3D Rotation: X-axis
      let y2 = p.y * cosX - z1 * sinX;
      let z2 = p.y * sinX + z1 * cosX;

      // 3D Rotation: Z-axis
      let x3 = x1 * cosZ - y2 * sinZ;
      let y3 = x1 * sinZ + y2 * cosZ;

      // Perspective projection
      const cameraDistance = params.perspective / 150 + 2.5;
      const fov = params.perspective;
      const zDepth = z2 + cameraDistance;
      const safeDepth = Math.max(0.2, zDepth);
      const projX = centerX + (x3 * baseScale * fov) / (safeDepth * 350);
      const projY = centerY + (y3 * baseScale * fov) / (safeDepth * 350);

      projected.push({
        x: projX,
        y: projY,
        z: z2,
        origIndex: i,
      });
    }

    // Render wireframe edges
    ctx.lineWidth = 1.3;
    const hue = params.colorHue;

    for (const edge of this.edges) {
      if (edge.a >= projected.length || edge.b >= projected.length) continue;
      const p1 = projected[edge.a];
      const p2 = projected[edge.b];

      // Depth attenuation for neon depth feel
      const avgZ = (p1.z + p2.z) / 2;
      const depthAlpha = Math.max(0.15, Math.min(1.0, 0.65 + avgZ * 0.25));

      ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${depthAlpha * Math.min(1.5, params.glowIntensity)})`;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Render glowing vertices & cyber node markers
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const depthAlpha = Math.max(0.2, Math.min(1.0, 0.7 + p.z * 0.3));

      // Vertex point
      ctx.fillStyle = depthAlpha > 0.7 ? '#ffffff' : `hsla(${hue}, 100%, 75%, ${depthAlpha})`;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 6 * params.glowIntensity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw subtle terminal crosshair reticle on prominent vertices
      if (i % 4 === 0 && depthAlpha > 0.65) {
        ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${depthAlpha * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x - 4, p.y);
        ctx.lineTo(p.x + 4, p.y);
        ctx.moveTo(p.x, p.y - 4);
        ctx.lineTo(p.x, p.y + 4);
        ctx.stroke();
      }
    }

    // Draw active shape metadata watermark in canvas
    this.renderCanvasMeta(ctx, params);
  }

  private renderTerminalHUD(ctx: CanvasRenderingContext2D) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const r1 = Math.min(this.width, this.height) * 0.38;

    ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
    ctx.lineWidth = 1;

    // Outer radar ring
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.stroke();

    // Inner concentric ring
    ctx.beginPath();
    ctx.arc(cx, cy, r1 * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Center crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    // Four corner target reticles
    const pad = 24;
    const len = 12;
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.35)';

    // Top-left
    ctx.beginPath();
    ctx.moveTo(pad, pad + len);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + len, pad);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(this.width - pad - len, pad);
    ctx.lineTo(this.width - pad, pad);
    ctx.lineTo(this.width - pad, pad + len);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(pad, this.height - pad - len);
    ctx.lineTo(pad, this.height - pad);
    ctx.lineTo(pad + len, this.height - pad);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(this.width - pad - len, this.height - pad);
    ctx.lineTo(this.width - pad, this.height - pad);
    ctx.lineTo(this.width - pad, this.height - pad - len);
    ctx.stroke();
  }

  private renderCanvasMeta(ctx: CanvasRenderingContext2D, params: SimulationParams) {
    ctx.save();
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0, 255, 102, 0.65)';

    // Top right diagnostics
    ctx.textAlign = 'right';
    ctx.fillText(`GEOM: ${params.shapeType.toUpperCase()}`, this.width - 24, 38);
    ctx.fillText(`VERTICES: ${this.vertices.length} // EDGES: ${this.edges.length}`, this.width - 24, 52);
    ctx.fillText(`ROT_MATRIX: [${this.rotX.toFixed(2)}, ${this.rotY.toFixed(2)}, ${this.rotZ.toFixed(2)}]`, this.width - 24, 66);
    if (params.shapeType === 'tesseract') {
      ctx.fillText(`4D_PHASE: ${(this.rot4D % (Math.PI * 2)).toFixed(2)} rad`, this.width - 24, 80);
    }

    // Top left instructions
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0, 255, 102, 0.45)';
    ctx.fillText(`[CLICK + DRAG TO ORBIT 3D VIEWPORT]`, 24, 38);
    ctx.fillText(`[CLICK BURST FOR DISPERSION WAVE]`, 24, 52);

    ctx.restore();
  }
}
