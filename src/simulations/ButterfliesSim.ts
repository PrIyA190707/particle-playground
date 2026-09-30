import { SimulationParams } from '../types/simulation';

interface Butterfly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  wanderAngle: number;
  flapPhase: number;
  flapSpeed: number;
  size: number;
  hueOffset: number;
  trail: { x: number; y: number; alpha: number }[];
}

export class ButterfliesSim {
  private butterflies: Butterfly[] = [];
  private dustParticles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];
  private width = 800;
  private height = 600;
  private mouse = { x: -9999, y: -9999, down: false };

  constructor(width: number, height: number, params: SimulationParams) {
    this.resize(width, height);
    this.initButterflies(params);
  }

  public resize(width: number, height: number) {
    this.width = Math.max(width, 200);
    this.height = Math.max(height, 200);
  }

  public setMouse(x: number, y: number, down: boolean) {
    this.mouse = { x, y, down };
  }

  public burst(count = 15) {
    const originX = this.mouse.x > 0 ? this.mouse.x : this.width / 2;
    const originY = this.mouse.y > 0 ? this.mouse.y : this.height / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.butterflies.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        heading: angle,
        wanderAngle: angle,
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: 0.15 + Math.random() * 0.1,
        size: 0.8 + Math.random() * 0.5,
        hueOffset: (Math.random() - 0.5) * 20,
        trail: [],
      });
    }
  }

  public initButterflies(params: SimulationParams) {
    this.butterflies = [];
    const count = Math.min(params.particleCount, 250);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.8 + Math.random() * 1.5) * params.speed;
      this.butterflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        heading: angle,
        wanderAngle: angle,
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: 0.12 + Math.random() * 0.08,
        size: 0.7 + Math.random() * 0.6,
        hueOffset: (Math.random() - 0.5) * 25,
        trail: [],
      });
    }
  }

  public update(params: SimulationParams, dt: number) {
    // Adjust population if parameter changed
    const targetCount = Math.round(params.particleCount);
    if (this.butterflies.length < targetCount) {
      const needed = Math.min(targetCount - this.butterflies.length, 5);
      for (let i = 0; i < needed; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.butterflies.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: Math.cos(angle) * params.speed,
          vy: Math.sin(angle) * params.speed,
          heading: angle,
          wanderAngle: angle,
          flapPhase: Math.random() * Math.PI * 2,
          flapSpeed: 0.12 + Math.random() * 0.08,
          size: 0.7 + Math.random() * 0.6,
          hueOffset: (Math.random() - 0.5) * 25,
          trail: [],
        });
      }
    } else if (this.butterflies.length > targetCount) {
      this.butterflies.splice(targetCount);
    }

    const mouseActive = this.mouse.x > 0 && this.mouse.y > 0 && this.mouse.x < this.width && this.mouse.y < this.height;

    // Update each butterfly
    for (const b of this.butterflies) {
      // Natural wandering via smoothed angular noise
      b.wanderAngle += (Math.random() - 0.5) * 0.6 * params.turbulence;
      let targetAx = Math.cos(b.wanderAngle) * 0.35 * params.turbulence;
      let targetAy = Math.sin(b.wanderAngle) * 0.35 * params.turbulence;

      // Mouse attraction or repulsion
      if (mouseActive) {
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const forceFactor = this.mouse.down ? -1.8 : 1.0; // Click repels, hover attracts
        if (dist < 400) {
          const strength = (1 - dist / 400) * params.attraction * forceFactor * 1.5;
          targetAx += (dx / dist) * strength;
          targetAy += (dy / dist) * strength;
        }
      }

      // Apply acceleration with speed scaling
      b.vx += targetAx * params.speed * dt * 60;
      b.vy += targetAy * params.speed * dt * 60;

      // Drag / damping
      b.vx *= 0.96;
      b.vy *= 0.96;

      // Speed clamp
      const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const minSpeed = 0.8 * params.speed;
      const maxSpeed = 4.5 * params.speed;
      if (currentSpeed < minSpeed && currentSpeed > 0.001) {
        b.vx = (b.vx / currentSpeed) * minSpeed;
        b.vy = (b.vy / currentSpeed) * minSpeed;
      } else if (currentSpeed > maxSpeed) {
        b.vx = (b.vx / currentSpeed) * maxSpeed;
        b.vy = (b.vy / currentSpeed) * maxSpeed;
      }

      // Move
      b.x += b.vx * dt * 60;
      b.y += b.vy * dt * 60;

      // Smooth heading direction
      const moveAngle = Math.atan2(b.vy, b.vx);
      let angleDiff = moveAngle - b.heading;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      b.heading += angleDiff * 0.15;

      // Flapping phase tied to velocity and flapRate
      b.flapPhase += (b.flapSpeed * params.flapRate + (currentSpeed * 0.04)) * (dt * 60);

      // Boundary wrapping with margin
      const margin = 40;
      if (b.x < -margin) b.x = this.width + margin;
      if (b.x > this.width + margin) b.x = -margin;
      if (b.y < -margin) b.y = this.height + margin;
      if (b.y > this.height + margin) b.y = -margin;

      // Trail recording
      if (Math.random() < 0.4) {
        b.trail.push({ x: b.x, y: b.y, alpha: 0.65 });
        if (b.trail.length > 8) b.trail.shift();
      }

      // Spawn dust spore occasionally
      if (Math.random() < 0.08 && this.dustParticles.length < 150) {
        this.dustParticles.push({
          x: b.x,
          y: b.y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          life: 1.0,
          maxLife: 30 + Math.random() * 40,
          size: 1 + Math.random() * 2,
        });
      }
    }

    // Update dust particles
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, params: SimulationParams) {
    const fadeAlpha = 1.0 - Math.min(Math.max(params.trailPersistence, 0.05), 0.92);
    ctx.fillStyle = `rgba(3, 10, 5, ${fadeAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle background terminal grid
    this.renderGrid(ctx);

    // Render luminous dust spores
    for (const p of this.dustParticles) {
      const alpha = p.life * 0.45 * params.glowIntensity;
      ctx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render butterfly trails
    for (const b of this.butterflies) {
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.strokeStyle = `rgba(0, 255, 102, 0.15)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Render butterflies
    for (const b of this.butterflies) {
      this.drawButterfly(ctx, b, params);
    }
  }

  private drawButterfly(ctx: CanvasRenderingContext2D, b: Butterfly, params: SimulationParams) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.heading + Math.PI / 2);

    const baseScale = b.size * params.wingScale * 12;
    // Wing flapping width multiplier (oscillates between -0.9 and 0.9)
    const wingFlap = Math.cos(b.flapPhase);
    const flapWidth = Math.abs(wingFlap) * 0.85 + 0.15;
    const hue = Math.round(params.colorHue + b.hueOffset);

    // Glow aura around butterfly
    if (params.glowIntensity > 0.4) {
      const radial = ctx.createRadialGradient(0, 0, 1, 0, 0, baseScale * 2.2);
      radial.addColorStop(0, `hsla(${hue}, 100%, 65%, ${0.25 * params.glowIntensity})`);
      radial.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(0, 0, baseScale * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Left and right wings
    ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
    ctx.lineWidth = 1.2;

    const wingGradient = ctx.createLinearGradient(0, -baseScale, 0, baseScale);
    wingGradient.addColorStop(0, `hsla(${hue}, 100%, 75%, 0.35)`);
    wingGradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 0.2)`);
    wingGradient.addColorStop(1, `hsla(${hue}, 100%, 30%, 0.05)`);

    // Draw Left Forewing & Hindwing
    ctx.save();
    ctx.scale(-flapWidth, 1);
    this.drawSingleWingPair(ctx, baseScale, wingGradient, hue);
    ctx.restore();

    // Draw Right Forewing & Hindwing
    ctx.save();
    ctx.scale(flapWidth, 1);
    this.drawSingleWingPair(ctx, baseScale, wingGradient, hue);
    ctx.restore();

    // Central Thorax / Body
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 6 * params.glowIntensity;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseScale * 0.12, baseScale * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -baseScale * 0.7, baseScale * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `hsl(${hue}, 100%, 80%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -baseScale * 0.7);
    ctx.quadraticCurveTo(-baseScale * 0.3, -baseScale * 1.1, -baseScale * 0.45, -baseScale * 1.3);
    ctx.moveTo(0, -baseScale * 0.7);
    ctx.quadraticCurveTo(baseScale * 0.3, -baseScale * 1.1, baseScale * 0.45, -baseScale * 1.3);
    ctx.stroke();

    ctx.restore();
  }

  private drawSingleWingPair(ctx: CanvasRenderingContext2D, s: number, fillGrad: CanvasGradient, hue: number) {
    // Upper / Forewing
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.2);
    ctx.bezierCurveTo(s * 0.7, -s * 1.3, s * 1.6, -s * 0.9, s * 1.5, -s * 0.2);
    ctx.bezierCurveTo(s * 1.3, s * 0.3, s * 0.7, s * 0.3, 0, s * 0.1);
    ctx.fillStyle = fillGrad;
    ctx.fill();
    ctx.stroke();

    // Forewing internal veins (cyber-wireframe look)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 1.0, -s * 0.7);
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 1.3, -s * 0.3);
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.9, s * 0.1);
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.45)`;
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Lower / Hindwing
    ctx.beginPath();
    ctx.moveTo(0, s * 0.1);
    ctx.bezierCurveTo(s * 0.9, s * 0.3, s * 1.2, s * 0.8, s * 0.8, s * 1.3);
    ctx.bezierCurveTo(s * 0.4, s * 1.5, s * 0.2, s * 1.0, 0, s * 0.5);
    ctx.fillStyle = fillGrad;
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hindwing vein
    ctx.beginPath();
    ctx.moveTo(0, s * 0.2);
    ctx.lineTo(s * 0.6, s * 0.9);
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.45)`;
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  private renderGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.035)';
    ctx.lineWidth = 1;
    const step = 40;
    ctx.beginPath();
    for (let x = 0; x < this.width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();
  }
}
