import React from 'react';
import {
  SceneId,
  SimulationParams,
  ShapeType,
  FormationType,
  VisualStyle,
  NeonPaletteId,
  NEON_PALETTES,
  PresetMotionType,
} from '../types/simulation';
import {
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Sparkles,
  SlidersHorizontal,
  Activity,
  Globe,
  Dna,
  Donut,
  Waves,
  Orbit,
  Heart,
  Cloud,
  Palette,
  RefreshCw,
  Wand2,
  Radio,
  RotateCw,
  Zap,
  Camera,
  Tornado,
  CircleDot,
  Infinity,
  Grid,
  Sun,
  Flame,
} from 'lucide-react';

interface ControlsPanelProps {
  scene: SceneId;
  params: SimulationParams;
  onChangeParams: (newParams: Partial<SimulationParams>) => void;
  onResetParams: () => void;
  onRandomizeParams: () => void;
  onBurst: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  fps: number;
  entityCount: number;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  scene,
  params,
  onChangeParams,
  onResetParams,
  onRandomizeParams,
  onBurst,
  isPaused,
  onTogglePause,
  fps,
  entityCount,
}) => {
  // Formations list
  const formations: { id: FormationType; label: string; icon: React.ReactNode }[] = [
    { id: 'sphere', label: 'SPHERE', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'helix', label: 'HELIX', icon: <Dna className="w-3.5 h-3.5" /> },
    { id: 'torus', label: 'TORUS', icon: <Donut className="w-3.5 h-3.5" /> },
    { id: 'butterfly', label: 'BUTTERFLY', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'aurora', label: 'AURORA', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'galaxy', label: 'GALAXY', icon: <Orbit className="w-3.5 h-3.5" /> },
    { id: 'heart', label: 'HEART', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'cloud', label: 'CLOUD', icon: <Cloud className="w-3.5 h-3.5" /> },
    { id: 'vortex', label: 'VORTEX', icon: <Tornado className="w-3.5 h-3.5" /> },
    { id: 'black_hole', label: 'BLACK HOLE', icon: <CircleDot className="w-3.5 h-3.5" /> },
    { id: 'torus_knot', label: 'TORUS KNOT', icon: <Infinity className="w-3.5 h-3.5" /> },
    { id: 'wave_grid', label: 'WAVE GRID', icon: <Grid className="w-3.5 h-3.5" /> },
    { id: 'supernova', label: 'SUPERNOVA', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'jellyfish', label: 'JELLYFISH', icon: <Flame className="w-3.5 h-3.5" /> },
  ];

  // Visual Styles list (8 tiles)
  const visualStyles: { id: VisualStyle; label: string; glyph: string; icon?: React.ReactNode }[] = [
    { id: 'sparkle', label: 'SPARKLE', glyph: '✦' },
    { id: 'circle', label: 'CIRCLE', glyph: '○' },
    { id: 'drop', label: 'DROP', glyph: '💧' },
    { id: 'filled_circle', label: 'FILLED', glyph: '●' },
    { id: 'ring', label: 'RING', glyph: '◎' },
    { id: 'triangle', label: 'TRIANGLE', glyph: '▲' },
    { id: 'arrow', label: 'ARROW', glyph: '➤' },
    { id: 'square', label: 'SQUARE', glyph: '■' },
  ];

  // Preset choreographies list (Pulse, Wave, Swirl, Chaos)
  const presetMotions: {
    id: PresetMotionType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'pulse', label: 'PULSE', sublabel: 'RADIAL SURGE', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'wave', label: 'WAVE', sublabel: 'TRANSVERSE RIPPLE', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'swirl', label: 'SWIRL', sublabel: 'VORTEX WHIRLPOOL', icon: <RotateCw className="w-3.5 h-3.5" /> },
    { id: 'chaos', label: 'CHAOS', sublabel: 'QUANTUM DISPERSION', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  const currentPaletteObj = NEON_PALETTES.find((p) => p.id === params.palette) || NEON_PALETTES[0];

  const handleCyclePalette = () => {
    const currentIndex = NEON_PALETTES.findIndex((p) => p.id === params.palette);
    const nextIndex = (currentIndex + 1) % NEON_PALETTES.length;
    const next = NEON_PALETTES[nextIndex];
    onChangeParams({ palette: next.id, colorHue: next.hue });
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-[#030c06] border-l border-[#0d3b1b] flex flex-col justify-between font-mono select-none z-20 overflow-y-auto">
      <div>
        {/* Panel Header */}
        <div className="p-4 border-b border-[#0d3b1b] bg-[#020a05]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold tracking-widest text-[#00ff66] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#00ff66]" />
              SIMULATION CONTROLS
            </span>
            <span className="text-[9px] px-1.5 py-0.5 border border-[#124d25] text-[#00e555] bg-[#051c0d]">
              LIVE
            </span>
          </div>
          <div className="text-[10px] text-[#00aa44]">
            // ACTIVE NODE: [{scene.toUpperCase()}] · FORM: [{params.formation.toUpperCase()}] · THEME: [{currentPaletteObj.label}]
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="p-3 border-b border-[#0d3b1b] bg-[#04140a]/60 grid grid-cols-3 gap-2 text-[10px]">
          <button
            type="button"
            onClick={onTogglePause}
            className={`py-1.5 px-2 border flex items-center justify-center gap-1.5 font-bold transition-all ${
              isPaused
                ? 'border-[#ffaa00] bg-[#ffaa00]/15 text-[#ffcc00]'
                : 'border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66] hover:bg-[#00ff66]/25'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>

          <button
            type="button"
            onClick={onBurst}
            className="py-1.5 px-2 border border-[#0e4d25] bg-[#062412] text-[#00ff66] hover:bg-[#09351a] hover:border-[#00ff66] flex items-center justify-center gap-1 font-bold transition-all"
            title="Inject energy into simulation"
          >
            <Sparkles className="w-3 h-3 text-[#00ff66]" />
            BURST
          </button>

          <button
            type="button"
            onClick={onRandomizeParams}
            className="py-1.5 px-2 border border-[#0e4d25] bg-[#062412] text-[#00cc55] hover:text-[#00ff66] hover:border-[#00ff66] flex items-center justify-center gap-1 font-bold transition-all"
            title="Randomize parameters"
          >
            <Shuffle className="w-3 h-3" />
            MUTATE
          </button>
        </div>

        {/* Sliders and Sections Container */}
        <div className="p-4 space-y-4">
          {/* SYSTEM CORE (Primary Kinematics) */}
          <div className="space-y-3 pb-3 border-b border-[#0b2f15]">
            <div className="text-[10px] uppercase tracking-wider text-[#008833] flex justify-between">
              <span>// SYSTEM CORE</span>
              <span className="text-[#006622]">PRIMARY_KINEMATICS</span>
            </div>

            {/* SPEED SLIDER */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#00cc55]">SIM_VELOCITY</span>
                <span className="text-[#00ff66] font-bold">{params.speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.05"
                value={params.speed}
                onChange={(e) => onChangeParams({ speed: parseFloat(e.target.value) })}
                className="w-full accent-[#00ff66]"
              />
            </div>

            {/* PARTICLE COUNT / POPULATION (up to 20,000 particles) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#00cc55]">POPULATION_DENSITY</span>
                <span className="text-[#00ff66] font-bold">{params.particleCount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="20000"
                step="250"
                value={params.particleCount}
                onChange={(e) => onChangeParams({ particleCount: parseInt(e.target.value, 10) })}
                className="w-full accent-[#00ff66]"
              />
            </div>

            {/* GLOW INTENSITY */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#00cc55]">GLOW_LUMEN</span>
                <span className="text-[#00ff66] font-bold">{params.glowIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.2"
                step="0.05"
                value={params.glowIntensity}
                onChange={(e) => onChangeParams({ glowIntensity: parseFloat(e.target.value) })}
                className="w-full accent-[#00ff66]"
              />
            </div>

            {/* UNREAL BLOOM EFFECT PASS */}
            <div className="p-2 border border-[#124d25] bg-[#020d06] rounded-xs space-y-2">
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="text-[#00cc55] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00ff66]" />
                  UNREAL_BLOOM_PASS
                </span>
                <button
                  type="button"
                  onClick={() => onChangeParams({ bloomEnabled: !params.bloomEnabled })}
                  className={`px-2 py-0.5 text-[8.5px] border font-bold transition-all ${
                    params.bloomEnabled
                      ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.4)]'
                      : 'border-[#124d25] bg-[#031409] text-[#008833]'
                  }`}
                >
                  {params.bloomEnabled ? 'ENABLED' : 'BYPASS'}
                </button>
              </div>

              {params.bloomEnabled && (
                <>
                  {/* Bloom Intensity Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-[#008833]">BLOOM_STRENGTH</span>
                      <span className="text-[#00ff66] font-bold">{params.bloomStrength.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.5"
                      step="0.1"
                      value={params.bloomStrength}
                      onChange={(e) => onChangeParams({ bloomStrength: parseFloat(e.target.value) })}
                      className="w-full accent-[#00ff66]"
                    />
                  </div>

                  {/* Bloom Radius Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-[#008833]">DISPERSION_RADIUS</span>
                      <span className="text-[#00ff66] font-bold">{params.bloomRadius.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={params.bloomRadius}
                      onChange={(e) => onChangeParams({ bloomRadius: parseFloat(e.target.value) })}
                      className="w-full accent-[#00ff66]"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-4 gap-1 text-[8px] font-mono pt-0.5">
                    {[
                      { label: '0.6x SOFT', s: 0.6, r: 0.3 },
                      { label: '1.5x NEON', s: 1.5, r: 0.45 },
                      { label: '2.5x HIGH', s: 2.5, r: 0.6 },
                      { label: '3.5x NOVA', s: 3.5, r: 0.8 },
                    ].map((bp) => {
                      const isActive = Math.abs(params.bloomStrength - bp.s) < 0.2;
                      return (
                        <button
                          key={bp.label}
                          type="button"
                          onClick={() => onChangeParams({ bloomStrength: bp.s, bloomRadius: bp.r })}
                          className={`py-0.5 border text-center transition-all ${
                            isActive
                              ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#ffffff] font-bold'
                              : 'border-[#124d25] bg-[#031409] text-[#00aa44] hover:text-[#00ff66]'
                          }`}
                        >
                          {bp.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* NEON WIREFRAME LATTICE TOGGLE */}
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#00cc55]">3D_NEON_WIREFRAME</span>
              <button
                type="button"
                onClick={() => onChangeParams({ showWireframe: !params.showWireframe })}
                className={`px-2 py-0.5 text-[8.5px] border font-bold transition-all ${
                  params.showWireframe
                    ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.4)]'
                    : 'border-[#124d25] bg-[#031409] text-[#008833]'
                }`}
              >
                {params.showWireframe ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>

            {/* AUTOMATED CAMERA ORBIT (HANDS-FREE VIEWING) */}
            <div className="p-2 border border-[#124d25] bg-[#020d06] rounded-xs space-y-2">
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="text-[#00cc55] font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#00ff66]" />
                  AUTO_CAMERA_ORBIT
                </span>
                <button
                  type="button"
                  onClick={() => onChangeParams({ autoOrbit: !params.autoOrbit })}
                  className={`px-2 py-0.5 text-[8.5px] border font-bold transition-all ${
                    params.autoOrbit
                      ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.4)]'
                      : 'border-[#124d25] bg-[#031409] text-[#008833]'
                  }`}
                >
                  {params.autoOrbit ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {params.autoOrbit && (
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-[#008833]">ORBIT_REVOLUTION_SPEED</span>
                    <span className="text-[#00ff66] font-bold">{params.autoOrbitSpeed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.05"
                    value={params.autoOrbitSpeed}
                    onChange={(e) => onChangeParams({ autoOrbitSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-[#00ff66]"
                  />
                  <div className="flex justify-between text-[8px] text-[#006622] pt-0.5 font-mono">
                    <span>SLOW (0.1x)</span>
                    <span className="text-[#00aa44]">CINEMATIC 360°</span>
                    <span>RAPID (2.5x)</span>
                  </div>
                </div>
              )}
            </div>

            {/* TRAIL PERSISTENCE / MOTION BLUR SLIDER */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#00cc55]">TRAIL_PERSISTENCE (MOTION BLUR)</span>
                <span className="text-[#00ff66] font-bold">
                  {params.trailPersistence <= 0.02
                    ? 'OFF (0%)'
                    : params.trailPersistence < 0.35
                    ? `SHORT (${Math.round(params.trailPersistence * 100)}%)`
                    : params.trailPersistence < 0.70
                    ? `MED (${Math.round(params.trailPersistence * 100)}%)`
                    : params.trailPersistence < 0.88
                    ? `LONG (${Math.round(params.trailPersistence * 100)}%)`
                    : `HYPER (${Math.round(params.trailPersistence * 100)}%)`}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.95"
                step="0.01"
                value={params.trailPersistence}
                onChange={(e) => onChangeParams({ trailPersistence: parseFloat(e.target.value) })}
                className="w-full accent-[#00ff66]"
                title="Adjust particle trail persistence and motion blur length"
              />
              {/* Quick preset buttons */}
              <div className="grid grid-cols-5 gap-1 mt-1 text-[8px] font-mono">
                {[
                  { label: '0% OFF', val: 0.0 },
                  { label: '25% LOW', val: 0.25 },
                  { label: '50% MED', val: 0.5 },
                  { label: '75% HIGH', val: 0.75 },
                  { label: '92% MAX', val: 0.92 },
                ].map((preset) => {
                  const isActive = Math.abs(params.trailPersistence - preset.val) < 0.05;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onChangeParams({ trailPersistence: preset.val })}
                      className={`py-0.5 border text-center transition-all ${
                        isActive
                          ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#ffffff] font-bold'
                          : 'border-[#124d25] bg-[#031409] text-[#00aa44] hover:text-[#00ff66] hover:border-[#00ff66]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PRESET ANIMATIONS (GENERATIVE CHOREOGRAPHIES) */}
          <div className="space-y-2 pb-3 border-b border-[#0b2f15]">
            <div className="text-[10px] uppercase tracking-wider text-[#008833] flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#00ff66]" />
                // PRESET ANIMATIONS
              </span>
              <span className="text-[9px] text-[#00aa44]">CHOREOGRAPHY</span>
            </div>

            {/* 4 Motion Buttons: Pulse, Wave, Swirl, Chaos */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {presetMotions.map((m) => {
                const isActive = params.activeMotion === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      // Trigger or re-trigger motion
                      onChangeParams({ activeMotion: m.id });
                    }}
                    className={`p-2 border flex items-center gap-2 transition-all rounded-sm text-left relative overflow-hidden ${
                      isActive
                        ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#ffffff] font-bold shadow-[0_0_12px_rgba(0,255,102,0.45)]'
                        : 'border-[#124d25] bg-[#051c0d] text-[#00cc55] hover:text-[#00ff66] hover:border-[#00aa44] hover:bg-[#072412]'
                    }`}
                    title={`Trigger ${m.label} generative choreography`}
                  >
                    <div
                      className={`p-1 rounded flex-shrink-0 ${
                        isActive
                          ? 'text-[#00ff66] bg-[#00ff66]/20'
                          : 'text-[#00aa44] bg-[#020d06]'
                      }`}
                    >
                      {m.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate tracking-wider font-bold">{m.label}</span>
                        {isActive && (
                          <span className="text-[7.5px] px-1 py-0.5 bg-[#00ff66]/30 text-[#00ff66] rounded-xs font-mono animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[8px] text-[#008833] truncate">
                        {m.sublabel}
                      </div>
                    </div>

                    {/* Progress pulse bar when active */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00ff66] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. FORMATION SECTION (ABOVE Visual Style) */}
          <div className="space-y-2 pb-3 border-b border-[#0b2f15]">
            <div className="text-[10px] uppercase tracking-wider text-[#008833] flex justify-between items-center">
              <span>// FORMATION</span>
              <span className="text-[9px] text-[#00aa44]">3D_LATTICE</span>
            </div>

            {/* Formation Tiles Grid: SPHERE · HELIX · TORUS · BUTTERFLY · AURORA · GALAXY · HEART · CLOUD */}
            <div className="grid grid-cols-4 gap-1.5 text-[9px]">
              {formations.map((f) => {
                const isSelected = params.formation === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChangeParams({ formation: f.id })}
                    className={`p-2 border flex flex-col items-center justify-center gap-1 transition-all rounded-sm ${
                      isSelected
                        ? 'border-[#00ff66] bg-[#00ff66]/15 text-[#ffffff] font-bold shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                        : 'border-[#124d25] bg-[#051c0d] text-[#00bb44] hover:text-[#00ff66] hover:border-[#00aa44]'
                    }`}
                    title={`Morph particles to ${f.label}`}
                  >
                    <span className={isSelected ? 'text-[#00ff66]' : 'text-[#008833]'}>
                      {f.icon}
                    </span>
                    <span className="truncate w-full text-center tracking-tighter">
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. VISUAL STYLE SECTION (BELOW Formation) */}
          <div className="space-y-2 pb-3 border-b border-[#0b2f15]">
            <div className="text-[10px] uppercase tracking-wider text-[#008833] flex justify-between items-center">
              <span>// VISUAL STYLE</span>
              <span className="text-[9px] text-[#00aa44]">SPRITE_KERNEL</span>
            </div>

            {/* Visual Style 8 Tiles Grid: sparkle, circle, drop, filled circle, ring, triangle, arrow, square */}
            <div className="grid grid-cols-4 gap-1.5 text-[9px]">
              {visualStyles.map((st) => {
                const isSelected = params.visualStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onChangeParams({ visualStyle: st.id })}
                    className={`p-2 border flex flex-col items-center justify-center gap-1 transition-all rounded-sm ${
                      isSelected
                        ? 'border-[#00ff66] bg-[#00ff66]/15 text-[#ffffff] font-bold shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                        : 'border-[#124d25] bg-[#051c0d] text-[#00bb44] hover:text-[#00ff66] hover:border-[#00aa44]'
                    }`}
                    title={`Select visual style: ${st.label}`}
                  >
                    <span className={`text-[14px] leading-none ${isSelected ? 'text-[#00ff66] drop-shadow-[0_0_4px_#00ff66]' : 'text-[#009939]'}`}>
                      {st.glyph}
                    </span>
                    <span className="truncate w-full text-center tracking-tighter">
                      {st.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. NEON PALETTE SELECTOR SECTION */}
          <div className="space-y-2 pb-3 border-b border-[#0b2f15]">
            <div className="text-[10px] uppercase tracking-wider text-[#008833] flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#00ff66]" />
                // NEON PALETTE
              </span>
              <button
                type="button"
                onClick={handleCyclePalette}
                className="text-[9px] px-1.5 py-0.5 border border-[#14532d] bg-[#052010] text-[#00ff66] hover:bg-[#073219] hover:border-[#00ff66] flex items-center gap-1 transition-all font-mono"
                title="Cycle to next preset neon theme"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                CYCLE ►
              </button>
            </div>

            {/* Neon Palettes Grid (6 Themes) */}
            <div className="grid grid-cols-2 gap-1.5 text-[9px]">
              {NEON_PALETTES.map((pal) => {
                const isSelected = params.palette === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => onChangeParams({ palette: pal.id, colorHue: pal.hue })}
                    style={{
                      borderColor: isSelected ? pal.primary : undefined,
                      boxShadow: isSelected ? `0 0 10px ${pal.primary}55` : undefined,
                      backgroundColor: isSelected ? `${pal.primary}18` : undefined,
                    }}
                    className={`p-2 border flex items-center gap-2 transition-all rounded-sm text-left ${
                      isSelected
                        ? 'text-[#ffffff] font-bold'
                        : 'border-[#124d25] bg-[#051c0d] text-[#00bb44] hover:text-[#00ff66] hover:border-[#00aa44]'
                    }`}
                    title={`Apply ${pal.label} theme`}
                  >
                    {/* Dual-color Gradient Swatch Indicator */}
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20 relative"
                      style={{
                        background: `linear-gradient(135deg, ${pal.primary} 0%, ${pal.secondary} 100%)`,
                        boxShadow: isSelected ? `0 0 8px ${pal.primary}` : undefined,
                      }}
                    >
                      {isSelected && (
                        <span
                          className="absolute -inset-0.5 rounded-full animate-ping opacity-60 pointer-events-none"
                          style={{ backgroundColor: pal.primary }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate font-semibold tracking-tighter"
                        style={{ color: isSelected ? pal.accent : undefined }}
                      >
                        {pal.label}
                      </div>
                      <div className="text-[8px] text-[#008833] font-mono">
                        {pal.code}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SCENE SPECIFIC SLIDERS */}
          {scene === 'butterflies' && (
            <div className="space-y-3 pb-3 border-b border-[#0b2f15]">
              <div className="text-[10px] uppercase tracking-wider text-[#008833]">
                // BUTTERFLIES DYNAMICS
              </div>

              {/* WING SCALE */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">WING_SPAN_SCALE</span>
                  <span className="text-[#00ff66] font-bold">{params.wingScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.2"
                  step="0.05"
                  value={params.wingScale}
                  onChange={(e) => onChangeParams({ wingScale: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* FLUTTER CHAOS / TURBULENCE */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">FLUTTER_CHAOS</span>
                  <span className="text-[#00ff66] font-bold">{params.turbulence.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={params.turbulence}
                  onChange={(e) => onChangeParams({ turbulence: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* MOUSE ATTRACTION */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">ATTRACTOR_FORCE</span>
                  <span className="text-[#00ff66] font-bold">{params.attraction.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={params.attraction}
                  onChange={(e) => onChangeParams({ attraction: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>
            </div>
          )}

          {scene === 'fireflies' && (
            <div className="space-y-3 pb-3 border-b border-[#0b2f15]">
              <div className="text-[10px] uppercase tracking-wider text-[#008833]">
                // FIREFLIES OSCILLATORS
              </div>

              {/* PULSE FREQUENCY */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">PULSE_FREQUENCY</span>
                  <span className="text-[#00ff66] font-bold">{params.pulseFrequency.toFixed(2)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={params.pulseFrequency}
                  onChange={(e) => onChangeParams({ pulseFrequency: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* GLOW RADIUS */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">AURA_RADIUS</span>
                  <span className="text-[#00ff66] font-bold">{params.glowRadius} px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="65"
                  step="1"
                  value={params.glowRadius}
                  onChange={(e) => onChangeParams({ glowRadius: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* KURAMOTO SYNC */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">PHASE_SYNC_TENDENCY</span>
                  <span className="text-[#00ff66] font-bold">{(params.syncTendency * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={params.syncTendency}
                  onChange={(e) => onChangeParams({ syncTendency: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>
            </div>
          )}

          {scene === 'shapes' && (
            <div className="space-y-3 pb-3 border-b border-[#0b2f15]">
              <div className="text-[10px] uppercase tracking-wider text-[#008833]">
                // 3D GEOMETRY SELECTOR
              </div>

              {/* SHAPE SELECTOR BUTTONS */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {(
                  [
                    { id: 'tesseract', label: 'TESSERACT 4D' },
                    { id: 'icosahedron', label: 'ICOSAHEDRON' },
                    { id: 'torus_knot', label: 'TORUS KNOT' },
                    { id: 'geodesic', label: 'GEODESIC' },
                    { id: 'lissajous', label: 'LISSAJOUS' },
                  ] as { id: ShapeType; label: string }[]
                ).map((sh) => (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => onChangeParams({ shapeType: sh.id })}
                    className={`px-2 py-1.5 text-left border transition-all ${
                      params.shapeType === sh.id
                        ? 'border-[#00ff66] bg-[#00ff66]/15 text-[#ffffff] font-bold shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                        : 'border-[#124d25] bg-[#051c0d] text-[#00bb44] hover:text-[#00ff66] hover:border-[#00aa44]'
                    } ${sh.id === 'lissajous' ? 'col-span-2' : ''}`}
                  >
                    {params.shapeType === sh.id ? '► ' : ''}{sh.label}
                  </button>
                ))}
              </div>

              {/* ROTATION SPEED X */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">ROTATION_PITCH_X</span>
                  <span className="text-[#00ff66] font-bold">{params.rotationSpeedX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.5"
                  step="0.1"
                  value={params.rotationSpeedX}
                  onChange={(e) => onChangeParams({ rotationSpeedX: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* ROTATION SPEED Y */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">ROTATION_YAW_Y</span>
                  <span className="text-[#00ff66] font-bold">{params.rotationSpeedY.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.5"
                  step="0.1"
                  value={params.rotationSpeedY}
                  onChange={(e) => onChangeParams({ rotationSpeedY: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* SCALE / ZOOM */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">GEOMETRIC_SCALE</span>
                  <span className="text-[#00ff66] font-bold">{params.shapeScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="2.2"
                  step="0.05"
                  value={params.shapeScale}
                  onChange={(e) => onChangeParams({ shapeScale: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* MORPH / HARMONIC SINE DEFORM */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">MORPH_DISTORTION</span>
                  <span className="text-[#00ff66] font-bold">{params.morphIntensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.05"
                  value={params.morphIntensity}
                  onChange={(e) => onChangeParams({ morphIntensity: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>

              {/* EXPLODE / DISPERSION */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#00cc55]">EXPLODE_OFFSET</span>
                  <span className="text-[#00ff66] font-bold">{params.explodeOffset.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.02"
                  value={params.explodeOffset}
                  onChange={(e) => onChangeParams({ explodeOffset: parseFloat(e.target.value) })}
                  className="w-full accent-[#00ff66]"
                />
              </div>
            </div>
          )}

          {/* Reset Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onResetParams}
              className="w-full py-2 px-3 border border-[#0f4320] bg-[#031409] text-[#00cc55] hover:text-[#00ff66] hover:border-[#00ff66] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESTORE PRESET DEFAULTS
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Telemetry */}
      <div className="p-3.5 border-t border-[#0d3b1b] bg-[#020a05] space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between text-[#008833]">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#00ff66]" />
            ACTIVE_ENTITIES
          </span>
          <span className="text-[#00ff66] font-bold">{entityCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-[#008833]">
          <span>GPU_PIPELINE</span>
          <span className="text-[#4ade80]">WEBGL_BUFFER_GEOM</span>
        </div>
        <div className="flex items-center justify-between text-[#008833]">
          <span>FPS_STABILITY</span>
          <span className="text-[#00ff66]">{fps >= 50 ? 'STABLE' : 'CALCULATING'}</span>
        </div>
      </div>
    </aside>
  );
};
