import React, { useEffect, useRef } from 'react';
import { SceneId, SimulationParams } from '../types/simulation';
import { ParticleFormationSystem } from '../simulations/ParticleFormationSystem';

interface SimulationCanvasProps {
  scene: SceneId;
  params: SimulationParams;
  isPaused: boolean;
  scanlinesEnabled: boolean;
  onFpsUpdate: (fps: number, entityCount: number) => void;
  onMouseCoords: (x: number, y: number) => void;
  triggerBurstRef?: React.MutableRefObject<(() => void) | null>;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  scene,
  params,
  isPaused,
  scanlinesEnabled,
  onFpsUpdate,
  onMouseCoords,
  triggerBurstRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const particleSystemRef = useRef<ParticleFormationSystem | null>(null);
  const paramsRef = useRef<SimulationParams>(params);
  const sceneRef = useRef<SceneId>(scene);
  const isPausedRef = useRef<boolean>(isPaused);

  paramsRef.current = params;
  sceneRef.current = scene;
  isPausedRef.current = isPaused;

  // Setup burst trigger callback for parent controls
  useEffect(() => {
    if (triggerBurstRef) {
      triggerBurstRef.current = () => {
        particleSystemRef.current?.burst(1.2);
      };
    }
  }, [triggerBurstRef]);

  // Respond to formation change
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setFormation(params.formation);
    }
  }, [params.formation]);

  // Respond to visual style change
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setVisualStyle(params.visualStyle);
    }
  }, [params.visualStyle]);

  // Respond to palette change
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.updateColors(params.palette, params.formation);
    }
  }, [params.palette, params.formation]);

  // Respond to preset animation choreography trigger
  useEffect(() => {
    if (params.activeMotion && particleSystemRef.current) {
      particleSystemRef.current.triggerChoreography(params.activeMotion);
    }
  }, [params.activeMotion]);

  // Initialize and run the simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const hudCanvas = hudCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !hudCanvas || !container) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    // 1. Initialize WebGL Particle Formation System (cap pixel ratio at 2)
    const sys = new ParticleFormationSystem(canvas, paramsRef.current);
    particleSystemRef.current = sys;

    // Handle container resize
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width <= 0 || height <= 0) return;

      sys.resize(width, height);

      // Resize HUD Canvas
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      hudCanvas.width = width * dpr;
      hudCanvas.height = height * dpr;
      hudCanvas.style.width = `${width}px`;
      hudCanvas.style.height = `${height}px`;

      const hudCtx = hudCanvas.getContext('2d');
      if (hudCtx) {
        hudCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Render HUD overlay (radar rings, reticles, corner crosshairs)
    const drawHUD = (hudCtx: CanvasRenderingContext2D, width: number, height: number, p: SimulationParams) => {
      hudCtx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const r1 = Math.min(width, height) * 0.38;

      hudCtx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
      hudCtx.lineWidth = 1;

      // Outer radar ring
      hudCtx.beginPath();
      hudCtx.arc(cx, cy, r1, 0, Math.PI * 2);
      hudCtx.stroke();

      // Inner concentric ring
      hudCtx.beginPath();
      hudCtx.arc(cx, cy, r1 * 0.65, 0, Math.PI * 2);
      hudCtx.stroke();

      // Center crosshairs
      hudCtx.beginPath();
      hudCtx.moveTo(cx - 12, cy);
      hudCtx.lineTo(cx + 12, cy);
      hudCtx.moveTo(cx, cy - 12);
      hudCtx.lineTo(cx, cy + 12);
      hudCtx.stroke();

      // Four corner target reticles
      const pad = 24;
      const len = 12;
      hudCtx.strokeStyle = 'rgba(0, 255, 102, 0.35)';

      // Top-left
      hudCtx.beginPath();
      hudCtx.moveTo(pad, pad + len);
      hudCtx.lineTo(pad, pad);
      hudCtx.lineTo(pad + len, pad);
      hudCtx.stroke();

      // Top-right
      hudCtx.beginPath();
      hudCtx.moveTo(width - pad - len, pad);
      hudCtx.lineTo(width - pad, pad);
      hudCtx.lineTo(width - pad, pad + len);
      hudCtx.stroke();

      // Bottom-left
      hudCtx.beginPath();
      hudCtx.moveTo(pad, height - pad - len);
      hudCtx.lineTo(pad, height - pad);
      hudCtx.lineTo(pad + len, height - pad);
      hudCtx.stroke();

      // Bottom-right
      hudCtx.beginPath();
      hudCtx.moveTo(width - pad - len, height - pad);
      hudCtx.lineTo(width - pad, height - pad);
      hudCtx.lineTo(width - pad, height - pad - len);
      hudCtx.stroke();

      // Top left instructions & status
      hudCtx.font = '10px "Share Tech Mono", monospace';
      hudCtx.fillStyle = 'rgba(0, 255, 102, 0.55)';
      hudCtx.textAlign = 'left';
      hudCtx.fillText(`[MOUSE DRAG: ORBIT VIEWPORT · WHEEL: ZOOM · CAMERA: ${p.autoOrbit ? `AUTO (${p.autoOrbitSpeed.toFixed(1)}x)` : 'MANUAL'}]`, 24, 38);
      const choreoTag = p.activeMotion ? ` // CHOREO: [${p.activeMotion.toUpperCase()}]` : '';
      hudCtx.fillText(`[FORMATION: ${p.formation.toUpperCase()} // STYLE: ${p.visualStyle.toUpperCase()} // THEME: ${p.palette.toUpperCase()}${choreoTag}]`, 24, 52);

      // Top right diagnostics
      hudCtx.textAlign = 'right';
      hudCtx.fillText(`BUFFER: POINTS_${p.particleCount.toLocaleString()}`, width - 24, 38);
      hudCtx.fillText(`POSTPROCESS: ${p.bloomEnabled ? `UNREAL_BLOOM (${p.bloomStrength.toFixed(1)}x)` : 'BYPASS'}`, width - 24, 52);
      hudCtx.fillText(`LATTICE_WIREFRAME: ${p.showWireframe ? 'ACTIVE' : 'OFF'}`, width - 24, 66);
    };

    // Animation Loop
    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // FPS tracking
      frameCount++;
      if (currentTime - lastFpsTime >= 500) {
        const measuredFps = Math.round((frameCount * 1000) / (currentTime - lastFpsTime));
        onFpsUpdate(measuredFps, paramsRef.current.particleCount);
        frameCount = 0;
        lastFpsTime = currentTime;
      }

      const p = paramsRef.current;
      const paused = isPausedRef.current;

      if (!paused) {
        sys.update(p, dt);
      }

      sys.render();

      // Draw HUD overlay periodically (every few frames)
      const hudCtx = hudCanvas.getContext('2d');
      if (hudCtx && frameCount % 3 === 0) {
        drawHUD(hudCtx, container.clientWidth, container.clientHeight, p);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      sys.dispose();
      particleSystemRef.current = null;
    };
  }, [onFpsUpdate]);

  // Pointer event handlers for Camera Orbit
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    particleSystemRef.current?.handlePointerDown(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onMouseCoords(Math.round(x), Math.round(y));
    particleSystemRef.current?.handlePointerMove(x, y);
  };

  const handlePointerUp = () => {
    particleSystemRef.current?.handlePointerUp();
  };

  const handlePointerLeave = () => {
    handlePointerUp();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    particleSystemRef.current?.handleWheel(e.deltaY);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#020704]">
      {/* 3D WebGL Particle Formation Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      />

      {/* 2D Terminal HUD Overlay Canvas */}
      <canvas
        ref={hudCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Retro CRT Scanlines & Phosphor Vignette Overlay */}
      {scanlinesEnabled && (
        <div className="absolute inset-0 crt-overlay pointer-events-none" />
      )}
      <div className="absolute inset-0 crt-vignette pointer-events-none" />
    </div>
  );
};
