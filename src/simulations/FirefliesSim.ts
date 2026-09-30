import { SimulationParams } from '../types/simulation';

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetVx: number;
  targetVy: number;
  phase: number;
  frequency: number;
  baseRadius: number;
  hueOffset: number;
  brightness: number;
  trail: { x: number; y: number; alpha: number }[];
}

export class FirefliesSim {
  private fireflies: Firefly[] = [];
  private ambientMist: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number }[] = [];
  private width = 800;
  private height = 600;
  private mouse = { x: -9999, y: -9999, down: false };
  private time = 0;

  constructor(width: number, height: number, params: SimulationParams) {
    this.resize(width, height);
    this.initFireflies(params);
    this.initMist();
  }

  public resize(width: number, height: number) {
    this.width = Math.max(width, 200);
    this.height = Math.max(height, 200);
  }

  public setMouse(x: number, y: number, down: boolean) {
    this.mouse = { x, y, down };
  }

  public burst(count = 20) {
    const originX = this.mouse.x > 0 ? this.mouse.x : this.width / 2;
    const originY = this.mouse.y > 0 ? this.mouse.y : this.height / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.fireflies.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        targetVx: (Math.random() - 0.5) * 1.5,
        targetVy: (Math.random() - 0.5) * 1.5,
        phase: Math.random() * Math.PI * 2,
        frequency: 0.8 + Math.random() * 0.6,
        baseRadius: 2.5 + Math.random() * 2.5,
        hueOffset: (Math.random() - 0.5) * 30,
        brightness: 1.0,
        trail: [],
      });
    }
  }

  public initFireflies(params: SimulationParams) {
    this.fireflies = [];
    const count = Math.min(params.particleCount, 300);
    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        targetVx: (Math.random() - 0.5) * 1.5,
        targetVy: (Math.random() - 0.5) * 1.5,
        phase: Math.random() * Math.PI * 2,
        frequency: 0.6 + Math.random() * 0.8,
        baseRadius: 2.2 + Math.random() * 2.5,
        hueOffset: (Math.random() - 0.5) * 25,
        brightness: 0.5,
        trail: [],
      });
    }
  }

  private initMist() {
    this.ambientMist = [];
    for (let i = 0; i < 40; i++) {
      this.ambientMist.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 40 + Math.random() * 80,
        alpha: 0.02 + Math.random() * 0.04,
      });
    }
  }

  public update(params: SimulationParams, dt: number) {
    this.time += dt * params.speed;

    const targetCount = Math.round(params.particleCount);
    if (this.fireflies.length < targetCount) {
      const needed = Math.min(targetCount - this.fireflies.length, 6);
      for (let i = 0; i < needed; i++) {
        this.fireflies.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          targetVx: (Math.random() - 0.5) * 1.5,
          targetVy: (Math.random() - 0.5) * 1.5,
          phase: Math.random() * Math.PI * 2,
          frequency: 0.6 + Math.random() * 0.8,
          baseRadius: 2.2 + Math.random() * 2.5,
          hueOffset: (Math.random() - 0.5) * 25,
          brightness: 0.5,
          trail: [],
        });
      }
    } else if (this.fireflies.length > targetCount) {
      this.fireflies.splice(targetCount);
    }

    const mouseActive = this.mouse.x > 0 && this.mouse.y > 0 && this.mouse.x < this.width && this.mouse.y < this.height;

    // Kuramoto sync coupling: calculate mean field phase
    let meanSin = 0;
    let meanCos = 0;
    if (params.syncTendency > 0.05 && this.fireflies.length > 0) {
      for (const f of this.fireflies) {
        meanSin += Math.sin(f.phase);
        meanCos += Math.cos(f.phase);
      }
      meanSin /= this.fireflies.length;
      meanCos /= this.fireflies.length;
    }
    const globalPhase = Math.atan2(meanSin, meanCos);

    for (let i = 0; i < this.fireflies.length; i++) {
      const f = this.fireflies[i];

      // Kuramoto phase advance with coupling
      const coupling = params.syncTendency * Math.sin(globalPhase - f.phase) * 0.08;
      f.phase += (f.frequency * params.pulseFrequency * 0.07 + coupling) * (dt * 60);

      // Brightness pulse (smooth bell curve peaked at 1.0)
      const rawPulse = Math.sin(f.phase);
      // Sharp glowing flash
      f.brightness = Math.pow(Math.max(0, rawPulse), 2.2);

      // Random target velocity changes (erratic organic float)
      if (Math.random() < 0.03 * params.driftJitter) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (0.5 + Math.random() * 1.8) * params.speed;
        f.targetVx = Math.cos(ang) * spd;
        f.targetVy = Math.sin(ang) * spd;
      }

      // Smooth steering toward target velocity
      f.vx += (f.targetVx - f.vx) * 0.04 * params.driftJitter;
      f.vy += (f.targetVy - f.vy) * 0.04 * params.driftJitter;

      // Mouse attraction or repulsion
      if (mouseActive) {
        const dx = this.mouse.x - f.x;
        const dy = this.mouse.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const forceFactor = this.mouse.down ? -2.0 : 1.2;
        if (dist < 350) {
          const strength = (1 - dist / 350) * params.attraction * forceFactor * 1.8;
          f.vx += (dx / dist) * strength;
          f.vy += (dy / dist) * strength;
        }
      }

      // Move
      f.x += f.vx * dt * 60;
      f.y += f.vy * dt * 60;

      // Damping
      f.vx *= 0.98;
      f.vy *= 0.98;

      // Wrap edges
      const margin = 20;
      if (f.x < -margin) f.x = this.width + margin;
      if (f.x > this.width + margin) f.x = -margin;
      if (f.y < -margin) f.y = this.height + margin;
      if (f.y > this.height + margin) f.y = -margin;

      // Trail recording for bright fireflies
      if (f.brightness > 0.35 && Math.random() < 0.5) {
        f.trail.push({ x: f.x, y: f.y, alpha: f.brightness });
        if (f.trail.length > 6) f.trail.shift();
      } else if (f.trail.length > 0) {
        f.trail.shift();
      }
    }

    // Mist drift
    for (const m of this.ambientMist) {
      m.x += m.vx;
      m.y += m.vy;
      if (m.x < -100) m.x = this.width + 100;
      if (m.x > this.width + 100) m.x = -100;
      if (m.y < -100) m.y = this.height + 100;
      if (m.y > this.height + 100) m.y = -100;
    }
  }

  public render(ctx: CanvasRenderingContext2D, params: SimulationParams) {
    const fadeAlpha = 1.0 - Math.min(Math.max(params.trailPersistence, 0.05), 0.92);
    ctx.fillStyle = `rgba(2, 8, 4, ${fadeAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle ambient mist
    for (const m of this.ambientMist) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
      grad.addColorStop(0, `rgba(0, 255, 102, ${m.alpha * 0.5 * params.glowIntensity})`);
      grad.addColorStop(1, 'rgba(0, 255, 102, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw firefly trails
    for (const f of this.fireflies) {
      if (f.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(f.trail[0].x, f.trail[0].y);
        for (let i = 1; i < f.trail.length; i++) {
          ctx.lineTo(f.trail[i].x, f.trail[i].y);
        }
        ctx.strokeStyle = `rgba(0, 255, 120, 0.18)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw fireflies
    for (const f of this.fireflies) {
      const hue = Math.round(params.colorHue + f.hueOffset);
      const intensity = f.brightness * params.glowIntensity;
      const glowR = Math.max(4, params.glowRadius * (0.3 + f.brightness * 0.7));

      // Outer radial aura
      if (intensity > 0.05) {
        const radial = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR);
        radial.addColorStop(0, `hsla(${hue}, 100%, 75%, ${0.65 * intensity})`);
        radial.addColorStop(0.3, `hsla(${hue}, 100%, 55%, ${0.28 * intensity})`);
        radial.addColorStop(0.7, `hsla(${hue}, 100%, 40%, ${0.08 * intensity})`);
        radial.addColorStop(1, `hsla(${hue}, 100%, 30%, 0)`);

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner dense glowing core
      const coreRadius = Math.max(1, f.baseRadius * (0.6 + f.brightness * 0.5));
      ctx.fillStyle = f.brightness > 0.5 ? '#ffffff' : `hsl(${hue}, 100%, 80%)`;
      ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
      ctx.shadowBlur = 8 * intensity;
      ctx.beginPath();
      ctx.arc(f.x, f.y, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
