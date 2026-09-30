import React, { useState } from 'react';
import { SimulationParams, SceneId, NEON_PALETTES } from '../types/simulation';
import { Terminal, Copy, Check, X, Sparkles, SlidersHorizontal, Info } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: SimulationParams;
  scene: SceneId;
}

export function generateMasterPrompt(params: SimulationParams, scene: SceneId): string {
  const pal = NEON_PALETTES.find((p) => p.id === params.palette) || NEON_PALETTES[0];

  const formationDescriptions: Record<string, string> = {
    sphere: 'a rotating 3D Fibonacci sphere lattice',
    helix: 'a rotating double-helix DNA spiral with transverse ladder rungs',
    torus: 'a rotating 3D torus donut ring',
    butterfly: 'a bioluminescent winged butterfly silhouette with dynamic fluttering wave deformation',
    aurora: 'drifting curtains of atmospheric aurora waves rippling through 3D space',
    galaxy: 'a spiral galaxy with a radiant galactic nucleus and differential orbital rotation arms',
    heart: 'a pulsating 3D cardiac heart beating in rhythmic lub-dub pulses',
    cloud: 'a turbulent free-floating organic particle cloud with Brownian wander',
    vortex: 'a conical tornado funnel vortex spiraling upwards with top-speed acceleration',
    black_hole: 'a gravitational black hole with a glowing accretion disk slowly spiraling inward and relativistic dipping at the event horizon',
    torus_knot: 'a continuous 3D woven trefoil torus knot with particles flowing along the path',
    wave_grid: 'a flat horizontal grid rolling with undulating ocean wave harmonics',
    supernova: 'a cyclic supernova star collapsing inward, pausing, then exploding into a supersonic ejecta shockwave before reforming',
    jellyfish: 'a rhythmic swimming jellyfish with a pulsating umbrella bell and undulating trailing tentacles',
  };

  const styleDescriptions: Record<string, string> = {
    sparkle: '4-point sparkle star sprites with soft radial halos',
    circle: 'crisp circular vector nodes',
    drop: 'fluid teardrop droplets',
    filled_circle: 'solid luminous antialiased circular discs',
    ring: 'concentric vector rings',
    triangle: 'equilateral directional neon triangles',
    arrow: 'directional chevron arrow glyphs',
    square: 'crisp monospace square pixels',
  };

  const formationDesc = formationDescriptions[params.formation] || `${params.formation} 3D geometry`;
  const styleDesc = styleDescriptions[params.visualStyle] || `${params.visualStyle} sprites`;
  const trailPercent = Math.round(params.trailPersistence * 100);
  const bloomDesc = params.bloomEnabled
    ? `additive UnrealBloomPass post-processing (${params.bloomStrength.toFixed(2)}x intensity, ${params.bloomRadius.toFixed(2)} radius)`
    : 'standard additive blending';
  const wireframeDesc = params.showWireframe ? 'intertwined with an illuminated 3D neon wireframe lattice' : 'pure particle volume';
  const orbitDesc = params.autoOrbit ? `automated 360-degree camera orbiting at ${params.autoOrbitSpeed.toFixed(2)}x` : 'interactive manual orbit';
  const choreographyDesc = params.activeMotion ? `, executing a live generative ${params.activeMotion.toUpperCase()} choreography motion override` : '';

  return (
    `A high-fidelity 3D generative particle simulation featuring ${params.particleCount.toLocaleString()} luminous neon particles forming ${formationDesc}. ` +
    `Rendered with ${styleDesc} in a ${pal.label.toLowerCase()} palette (${pal.primary} primary and ${pal.accent} highlights). ` +
    `Optical qualities include ${bloomDesc}, ${wireframeDesc}, and ${trailPercent}% CRT phosphor motion blur trail persistence. ` +
    `Kinematics operate at ${params.speed.toFixed(2)}x speed with turbulence factor ${params.turbulence.toFixed(2)} and attraction factor ${params.attraction.toFixed(2)}. ` +
    `Observed via ${orbitDesc} under high-performance WebGL buffer geometry${choreographyDesc}.`
  );
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, params, scene }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const masterPrompt = generateMasterPrompt(params, scene);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(masterPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = masterPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-text">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#020a05] border border-[#00ff66] shadow-[0_0_30px_rgba(0,255,102,0.25)] rounded-sm font-mono z-10 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#031409] border-b border-[#0d3b1b]">
          <div className="flex items-center gap-2 text-[#00ff66] font-bold text-xs tracking-wider">
            <Terminal className="w-4 h-4 text-[#00ff66]" />
            <span>SYS://MASTER_PROMPT_GENERATOR</span>
            <span className="text-[9px] px-1.5 py-0.2 border border-[#14532d] bg-[#052010] text-[#4ade80]">
              LIVE_SYNC
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#00aa44] hover:text-[#00ff66] transition-colors rounded-xs hover:bg-[#072513]"
            title="Close dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          <div className="flex items-center justify-between text-[10px] text-[#00aa44]">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-[#00ff66]" />
              CURRENT SCENE SYNCHRONIZED PROMPT
            </span>
            <span className="text-[#00ff66] font-mono">
              TARGET: [{scene.toUpperCase()}] // {params.formation.toUpperCase()}
            </span>
          </div>

          {/* Master Prompt Output Box */}
          <div className="relative p-3.5 bg-[#010603] border border-[#124d25] rounded-xs text-[#00ff66] font-mono text-[11.5px] leading-relaxed shadow-inner">
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
              <span className="text-[8px] text-[#008833]">LIVE</span>
            </div>
            <p className="pr-12">{masterPrompt}</p>
          </div>

          {/* Real-time State Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9.5px]">
            <div className="p-1.5 border border-[#0d3b1b] bg-[#020d06]">
              <span className="text-[#008833] block">FORMATION</span>
              <span className="text-[#ffffff] font-bold uppercase">{params.formation}</span>
            </div>
            <div className="p-1.5 border border-[#0d3b1b] bg-[#020d06]">
              <span className="text-[#008833] block">SPRITE_KERNEL</span>
              <span className="text-[#ffffff] font-bold uppercase">{params.visualStyle}</span>
            </div>
            <div className="p-1.5 border border-[#0d3b1b] bg-[#020d06]">
              <span className="text-[#008833] block">PARTICLES</span>
              <span className="text-[#00ff66] font-bold">{params.particleCount.toLocaleString()}</span>
            </div>
            <div className="p-1.5 border border-[#0d3b1b] bg-[#020d06]">
              <span className="text-[#008833] block">BLOOM</span>
              <span className="text-[#4ade80] font-bold">{params.bloomEnabled ? `${params.bloomStrength.toFixed(1)}x` : 'BYPASS'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#031409] border-t border-[#0d3b1b] text-xs">
          <span className="text-[10px] text-[#007728] hidden sm:inline">
            Updates in real-time as simulation sliders change
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#124d25] bg-[#051c0d] text-[#00aa44] hover:text-[#00ff66] hover:border-[#00aa44] text-[11px] font-bold transition-all"
            >
              CLOSE
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-1.5 border text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md ${
                copied
                  ? 'border-[#00ff66] bg-[#00ff66] text-[#020a05] shadow-[0_0_12px_rgba(0,255,102,0.6)]'
                  : 'border-[#00ff66] bg-[#00ff66]/20 text-[#ffffff] hover:bg-[#00ff66]/30 shadow-[0_0_8px_rgba(0,255,102,0.3)]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#020a05]" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>COPY PROMPT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
