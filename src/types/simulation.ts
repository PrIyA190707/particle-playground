export type SceneId = 'butterflies' | 'fireflies' | 'shapes';

export type SidebarItem = 'INTERFACE' | 'BUTTERFLIES' | 'FIREFLIES' | 'FORCES' | 'SHAPES' | 'SHADERS';

export type ShapeType = 'tesseract' | 'icosahedron' | 'torus_knot' | 'geodesic' | 'lissajous';

export type FormationType =
  | 'sphere'
  | 'helix'
  | 'torus'
  | 'butterfly'
  | 'aurora'
  | 'galaxy'
  | 'heart'
  | 'cloud'
  | 'vortex'
  | 'black_hole'
  | 'torus_knot'
  | 'wave_grid'
  | 'supernova'
  | 'jellyfish';

export type VisualStyle =
  | 'sparkle'
  | 'circle'
  | 'drop'
  | 'filled_circle'
  | 'ring'
  | 'triangle'
  | 'arrow'
  | 'square';

export type NeonPaletteId =
  | 'toxic_green'
  | 'electric_cyan'
  | 'hot_magenta'
  | 'plasma_gold'
  | 'acid_violet'
  | 'cyber_amber';

export interface NeonPalette {
  id: NeonPaletteId;
  label: string;
  code: string;
  primary: string;
  secondary: string;
  accent: string;
  hue: number;
}

export const NEON_PALETTES: NeonPalette[] = [
  {
    id: 'toxic_green',
    label: 'TOXIC GREEN',
    code: 'GRN_01',
    primary: '#00ff66',
    secondary: '#16a34a',
    accent: '#86efac',
    hue: 142,
  },
  {
    id: 'electric_cyan',
    label: 'ELECTRIC CYAN',
    code: 'CYN_02',
    primary: '#00f3ff',
    secondary: '#0284c7',
    accent: '#7dd3fc',
    hue: 188,
  },
  {
    id: 'hot_magenta',
    label: 'HOT MAGENTA',
    code: 'MAG_03',
    primary: '#ff007f',
    secondary: '#a21caf',
    accent: '#f472b6',
    hue: 328,
  },
  {
    id: 'plasma_gold',
    label: 'PLASMA GOLD',
    code: 'GLD_04',
    primary: '#ffb700',
    secondary: '#d97706',
    accent: '#fde047',
    hue: 43,
  },
  {
    id: 'acid_violet',
    label: 'ACID VIOLET',
    code: 'VIO_05',
    primary: '#b026ff',
    secondary: '#7c3aed',
    accent: '#c084fc',
    hue: 278,
  },
  {
    id: 'cyber_amber',
    label: 'CYBER AMBER',
    code: 'AMB_06',
    primary: '#ff5500',
    secondary: '#c2410c',
    accent: '#fb923c',
    hue: 20,
  },
];

export type PresetMotionType = 'pulse' | 'wave' | 'swirl' | 'chaos';

export interface SimulationParams {
  // Formation & Visual Style & Color Palette & Preset Motions
  formation: FormationType;
  visualStyle: VisualStyle;
  palette: NeonPaletteId;
  activeMotion: PresetMotionType | null;

  // System Core
  speed: number;            // 0.1 to 3.0
  particleCount: number;    // 500 to 20000
  trailPersistence: number; // 0.05 to 0.95
  glowIntensity: number;    // 0.2 to 2.5
  attraction: number;       // 0 to 2.0
  turbulence: number;       // 0 to 2.0
  colorHue: number;         // Hue angle
  
  // Unreal Bloom & Wireframe settings
  bloomEnabled: boolean;
  bloomStrength: number;    // 0.2 to 3.5
  bloomRadius: number;      // 0.1 to 1.2
  bloomThreshold: number;   // 0.0 to 0.5
  showWireframe: boolean;

  // Automated Camera Orbit
  autoOrbit: boolean;
  autoOrbitSpeed: number;   // 0.1 to 3.0
  
  // Butterflies specific
  wingScale: number;        // 0.5 to 2.5
  flapRate: number;         // 0.5 to 3.0
  flockRadius: number;      // 30 to 200

  // Fireflies specific
  pulseFrequency: number;   // 0.2 to 3.0
  glowRadius: number;       // 10 to 80
  driftJitter: number;      // 0.1 to 2.0
  syncTendency: number;     // 0 to 1.0

  // Shapes specific
  shapeType: ShapeType;
  rotationSpeedX: number;   // -3 to 3
  rotationSpeedY: number;   // -3 to 3
  rotationSpeedZ: number;   // -3 to 3
  shapeScale: number;       // 0.5 to 2.5
  wireframeDensity: number; // 4 to 24
  morphIntensity: number;   // 0 to 1.5
  explodeOffset: number;    // 0 to 1.0
  perspective: number;      // 300 to 1200
}

export const DEFAULT_PARAMS: SimulationParams = {
  formation: 'cloud',
  visualStyle: 'sparkle',
  palette: 'toxic_green',
  activeMotion: null,

  speed: 1.0,
  particleCount: 12000,
  trailPersistence: 0.25,
  glowIntensity: 1.2,
  attraction: 0.8,
  turbulence: 0.9,
  colorHue: 142, // Classic terminal neon green
  bloomEnabled: true,
  bloomStrength: 1.5,
  bloomRadius: 0.45,
  bloomThreshold: 0.12,
  showWireframe: true,
  autoOrbit: true,
  autoOrbitSpeed: 0.8,

  wingScale: 1.0,
  flapRate: 1.2,
  flockRadius: 90,

  pulseFrequency: 1.0,
  glowRadius: 28,
  driftJitter: 0.8,
  syncTendency: 0.6,

  shapeType: 'tesseract',
  rotationSpeedX: 0.8,
  rotationSpeedY: 1.1,
  rotationSpeedZ: 0.4,
  shapeScale: 1.2,
  wireframeDensity: 12,
  morphIntensity: 0.35,
  explodeOffset: 0.0,
  perspective: 650,
};

export interface SceneMeta {
  id: SceneId;
  label: string;
  code: string;
  description: string;
  tag: string;
}

export const SCENES: SceneMeta[] = [
  {
    id: 'butterflies',
    label: 'BUTTERFLIES',
    code: '01',
    description: 'Bioluminescent swarm dynamics with multi-joint wing flap acoustics',
    tag: 'FLUID_BIOMECH',
  },
  {
    id: 'fireflies',
    label: 'FIREFLIES',
    code: '02',
    description: 'Phase-synchronized phosphor oscillators drifting through dusk fields',
    tag: 'QUANTUM_PULSE',
  },
  {
    id: 'shapes',
    label: 'SHAPES',
    code: '03',
    description: '4D hyperdimensional projection & morphing wireframe lattice geometry',
    tag: 'VECT_TENSOR_3D',
  },
];

export interface CommunityRemix {
  id: string;
  title: string;
  author: string;
  isUserCreated: boolean;
  promptDescription: string;
  createdAt: number;
  palette: NeonPaletteId;
  sceneTarget: SceneId;
  params: SimulationParams;
}

export interface ScenePreset {
  id: string;
  label: string;
  tag: string;
  description: string;
  sceneTarget?: SceneId;
  params: Partial<SimulationParams>;
}

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'butterflies',
    label: 'BUTTERFLIES',
    tag: 'PRESET_01',
    description: 'Bioluminescent butterfly swarm with flutter wing flapping acoustics',
    sceneTarget: 'butterflies',
    params: {
      formation: 'butterfly',
      visualStyle: 'sparkle',
      palette: 'toxic_green',
      speed: 1.0,
      glowIntensity: 1.2,
      trailPersistence: 0.25,
      bloomEnabled: true,
      bloomStrength: 1.5,
    },
  },
  {
    id: 'fireflies',
    label: 'FIREFLIES',
    tag: 'PRESET_02',
    description: 'Phase-synchronized phosphor oscillators drifting through dusk canopy',
    sceneTarget: 'fireflies',
    params: {
      formation: 'cloud',
      visualStyle: 'circle',
      palette: 'plasma_gold',
      speed: 0.85,
      glowIntensity: 1.4,
      trailPersistence: 0.35,
      bloomEnabled: true,
      bloomStrength: 1.6,
    },
  },
  {
    id: 'galaxy_voyage',
    label: 'GALAXY VOYAGE',
    tag: 'PRESET_03',
    description: 'Deep celestial spiral galaxy with slow orbital velocity and sparkle stars',
    sceneTarget: 'shapes',
    params: {
      formation: 'galaxy',
      visualStyle: 'sparkle',
      palette: 'acid_violet',
      speed: 0.45,
      particleCount: 16000,
      glowIntensity: 1.5,
      trailPersistence: 0.45,
      bloomEnabled: true,
      bloomStrength: 1.8,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.5,
    },
  },
  {
    id: 'aurora_night',
    label: 'AURORA NIGHT',
    tag: 'PRESET_04',
    description: 'Atmospheric curtains of drop particles radiating in electric cyan-green glow',
    sceneTarget: 'shapes',
    params: {
      formation: 'aurora',
      visualStyle: 'drop',
      palette: 'electric_cyan',
      speed: 0.7,
      particleCount: 14000,
      glowIntensity: 1.6,
      trailPersistence: 0.35,
      bloomEnabled: true,
      bloomStrength: 2.0,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.6,
    },
  },
  {
    id: 'ocean_storm',
    label: 'OCEAN STORM',
    tag: 'PRESET_05',
    description: 'Turbulent rolling ocean wave grid with directional triangle particles',
    sceneTarget: 'shapes',
    params: {
      formation: 'wave_grid',
      visualStyle: 'triangle',
      palette: 'electric_cyan',
      speed: 1.6,
      particleCount: 15000,
      turbulence: 1.4,
      glowIntensity: 1.3,
      trailPersistence: 0.25,
      bloomEnabled: true,
      bloomStrength: 1.5,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.9,
    },
  },
  {
    id: 'cosmic_birth',
    label: 'COSMIC BIRTH',
    tag: 'PRESET_06',
    description: 'Pulsing stellar collapse and cataclysmic supernova explosion loop',
    sceneTarget: 'shapes',
    params: {
      formation: 'supernova',
      visualStyle: 'circle',
      palette: 'plasma_gold',
      speed: 1.1,
      particleCount: 16000,
      glowIntensity: 1.8,
      trailPersistence: 0.35,
      bloomEnabled: true,
      bloomStrength: 2.4,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.7,
    },
  },
];
