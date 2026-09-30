import {
  CommunityRemix,
  SimulationParams,
  SceneId,
  FormationType,
  VisualStyle,
  NeonPaletteId,
  DEFAULT_PARAMS,
} from '../types/simulation';

const STORAGE_KEY = 'CYBER_PARTICLE_COMMUNITY_REMIXES_V1';

export const SEED_COMMUNITY_REMIXES: CommunityRemix[] = [
  {
    id: 'seed_solar_phoenix',
    title: 'Solar Phoenix',
    author: 'AstroNova',
    isUserCreated: false,
    promptDescription: 'a celestial dragon made of flaming solar flare particles',
    createdAt: 1727650000000,
    palette: 'plasma_gold',
    sceneTarget: 'shapes',
    params: {
      ...DEFAULT_PARAMS,
      formation: 'supernova',
      visualStyle: 'triangle',
      palette: 'plasma_gold',
      speed: 1.4,
      particleCount: 16000,
      glowIntensity: 1.8,
      trailPersistence: 0.35,
      bloomEnabled: true,
      bloomStrength: 2.2,
      bloomRadius: 0.55,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.75,
    },
  },
  {
    id: 'seed_quantum_abyss',
    title: 'Quantum Abyss',
    author: 'VoidWalker',
    isUserCreated: false,
    promptDescription: 'gravitational black hole accretion disk with relativistic frame dragging',
    createdAt: 1727660000000,
    palette: 'acid_violet',
    sceneTarget: 'shapes',
    params: {
      ...DEFAULT_PARAMS,
      formation: 'black_hole',
      visualStyle: 'circle',
      palette: 'acid_violet',
      speed: 0.85,
      particleCount: 18000,
      glowIntensity: 1.5,
      trailPersistence: 0.45,
      bloomEnabled: true,
      bloomStrength: 1.9,
      bloomRadius: 0.5,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.5,
    },
  },
  {
    id: 'seed_neon_cyberspace',
    title: 'Neon Cyberspace',
    author: 'GlitchRunner',
    isUserCreated: false,
    promptDescription: 'cyberpunk matrix ocean wave grid rolling in toxic terminal green',
    createdAt: 1727670000000,
    palette: 'toxic_green',
    sceneTarget: 'shapes',
    params: {
      ...DEFAULT_PARAMS,
      formation: 'wave_grid',
      visualStyle: 'square',
      palette: 'toxic_green',
      speed: 1.3,
      particleCount: 14000,
      glowIntensity: 1.4,
      trailPersistence: 0.28,
      bloomEnabled: true,
      bloomStrength: 1.6,
      bloomRadius: 0.45,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.85,
    },
  },
  {
    id: 'seed_abyssal_jellyfish',
    title: 'Abyssal Jellyfish',
    author: 'Nautilus99',
    isUserCreated: false,
    promptDescription: 'deep ocean bioluminescent jellyfish pulsing with electric cyan tentacles',
    createdAt: 1727680000000,
    palette: 'electric_cyan',
    sceneTarget: 'shapes',
    params: {
      ...DEFAULT_PARAMS,
      formation: 'jellyfish',
      visualStyle: 'drop',
      palette: 'electric_cyan',
      speed: 0.95,
      particleCount: 15000,
      glowIntensity: 1.6,
      trailPersistence: 0.35,
      bloomEnabled: true,
      bloomStrength: 1.8,
      bloomRadius: 0.48,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.65,
    },
  },
];

export function getStoredRemixes(): CommunityRemix[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMMUNITY_REMIXES));
      return SEED_COMMUNITY_REMIXES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMMUNITY_REMIXES));
      return SEED_COMMUNITY_REMIXES;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to read remixes from localStorage:', err);
    return SEED_COMMUNITY_REMIXES;
  }
}

export function saveUserRemix(
  title: string,
  promptDescription: string,
  sceneTarget: SceneId,
  params: SimulationParams
): CommunityRemix[] {
  const current = getStoredRemixes();
  const newRemix: CommunityRemix = {
    id: `user_remix_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: title.trim() || 'Untitled Remix',
    author: 'by you',
    isUserCreated: true,
    promptDescription: promptDescription.trim(),
    createdAt: Date.now(),
    palette: params.palette,
    sceneTarget,
    params: { ...params },
  };

  const updated = [newRemix, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save remix to localStorage:', err);
  }
  return updated;
}

export function deleteRemix(id: string): CommunityRemix[] {
  const current = getStoredRemixes();
  const updated = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to update remixes after delete:', err);
  }
  return updated;
}

/**
 * Intelligent Keyword Mapper:
 * Parses user input prompt for Subject, Mood, Color, Speed, Glow, and Density.
 * If no keywords match, provides a tasteful, cohesive randomization.
 */
export function parseRemixPrompt(
  input: string,
  baseParams: SimulationParams
): {
  params: Partial<SimulationParams>;
  sceneTarget: SceneId;
  suggestedTitle: string;
  matchedTags: string[];
} {
  const text = input.toLowerCase().trim();
  const matchedTags: string[] = [];

  let formation: FormationType | undefined;
  let sceneTarget: SceneId = 'shapes';
  let visualStyle: VisualStyle | undefined;
  let palette: NeonPaletteId | undefined;
  let speed: number | undefined;
  let glowIntensity: number | undefined;
  let bloomStrength: number | undefined;
  let particleCount: number | undefined;
  let titleNoun = '';

  // 1. SUBJECT / FORMATION MATCHING
  if (
    text.includes('dragon') ||
    text.includes('fire') ||
    text.includes('flame') ||
    text.includes('phoenix') ||
    text.includes('supernova') ||
    text.includes('explosion') ||
    text.includes('blast') ||
    text.includes('sun') ||
    text.includes('flare')
  ) {
    formation = 'supernova';
    visualStyle = 'triangle';
    if (!palette) palette = 'plasma_gold';
    glowIntensity = 1.8;
    bloomStrength = 2.4;
    matchedTags.push('FORMATION: SUPERNOVA', 'ELEMENT: FIRE');
    titleNoun = text.includes('dragon') ? 'Fire Dragon' : text.includes('phoenix') ? 'Solar Phoenix' : 'Supernova Flare';
  } else if (
    text.includes('black hole') ||
    text.includes('singularity') ||
    text.includes('abyss') ||
    text.includes('void') ||
    text.includes('dark matter') ||
    text.includes('gravity') ||
    text.includes('event horizon')
  ) {
    formation = 'black_hole';
    visualStyle = 'circle';
    if (!palette) palette = 'acid_violet';
    glowIntensity = 1.5;
    bloomStrength = 1.9;
    matchedTags.push('FORMATION: BLACK HOLE', 'THEME: GRAVITATIONAL');
    titleNoun = 'Singularity Abyss';
  } else if (
    text.includes('tornado') ||
    text.includes('vortex') ||
    text.includes('twister') ||
    text.includes('cyclone') ||
    text.includes('whirlpool') ||
    text.includes('funnel')
  ) {
    formation = 'vortex';
    visualStyle = 'arrow';
    matchedTags.push('FORMATION: VORTEX', 'DYNAMIC: ROTATIONAL');
    titleNoun = 'Quantum Vortex';
  } else if (
    text.includes('jellyfish') ||
    text.includes('medusa') ||
    text.includes('tentacle') ||
    text.includes('deep sea') ||
    text.includes('abyssal') ||
    text.includes('aquatic') ||
    text.includes('swim')
  ) {
    formation = 'jellyfish';
    visualStyle = 'drop';
    if (!palette) palette = 'electric_cyan';
    matchedTags.push('FORMATION: JELLYFISH', 'ORGANIC: BIOLUMINESCENT');
    titleNoun = 'Abyssal Jellyfish';
  } else if (
    text.includes('wave') ||
    text.includes('ocean') ||
    text.includes('sea') ||
    text.includes('grid') ||
    text.includes('terrain') ||
    text.includes('matrix') ||
    text.includes('synthwave')
  ) {
    formation = 'wave_grid';
    visualStyle = 'square';
    matchedTags.push('FORMATION: WAVE GRID', 'SURFACE: UNDULATING');
    titleNoun = 'Cyber Ocean Grid';
  } else if (
    text.includes('knot') ||
    text.includes('trefoil') ||
    text.includes('braid') ||
    text.includes('infinity') ||
    text.includes('loop') ||
    text.includes('woven')
  ) {
    formation = 'torus_knot';
    visualStyle = 'ring';
    matchedTags.push('FORMATION: TORUS KNOT', 'TOPOLOGY: 3D_WOVEN');
    titleNoun = 'Infinite Knot';
  } else if (
    text.includes('galaxy') ||
    text.includes('cosmos') ||
    text.includes('nebula') ||
    text.includes('milky way') ||
    text.includes('starlight')
  ) {
    formation = 'galaxy';
    visualStyle = 'sparkle';
    matchedTags.push('FORMATION: GALAXY', 'COSMIC: SPIRAL');
    titleNoun = 'Galactic Spiral';
  } else if (
    text.includes('aurora') ||
    text.includes('borealis') ||
    text.includes('northern lights') ||
    text.includes('curtain')
  ) {
    formation = 'aurora';
    visualStyle = 'drop';
    if (!palette) palette = 'electric_cyan';
    matchedTags.push('FORMATION: AURORA', 'ATMOSPHERIC: IONIZED');
    titleNoun = 'Boreal Aurora';
  } else if (
    text.includes('butterfly') ||
    text.includes('butterflies') ||
    text.includes('moth') ||
    text.includes('flutter') ||
    text.includes('wings')
  ) {
    formation = 'butterfly';
    sceneTarget = 'butterflies';
    visualStyle = 'sparkle';
    matchedTags.push('FORMATION: BUTTERFLY', 'SWARM: KINEMATIC');
    titleNoun = 'Luminous Butterfly';
  } else if (
    text.includes('firefly') ||
    text.includes('fireflies') ||
    text.includes('phosphor') ||
    text.includes('glow bug') ||
    text.includes('lantern')
  ) {
    formation = 'cloud';
    sceneTarget = 'fireflies';
    visualStyle = 'circle';
    if (!palette) palette = 'plasma_gold';
    matchedTags.push('FORMATION: FIREFLIES', 'SYNCHRONOUS: PHOSPHOR');
    titleNoun = 'Nocturnal Fireflies';
  } else if (
    text.includes('heart') ||
    text.includes('love') ||
    text.includes('cardiac') ||
    text.includes('beat') ||
    text.includes('pulse')
  ) {
    formation = 'heart';
    visualStyle = 'circle';
    if (!palette) palette = 'hot_magenta';
    matchedTags.push('FORMATION: HEART', 'PULSE: RHYTHMIC');
    titleNoun = 'Pulsating Heart';
  } else if (
    text.includes('dna') ||
    text.includes('helix') ||
    text.includes('spiral') ||
    text.includes('genetic')
  ) {
    formation = 'helix';
    visualStyle = 'square';
    matchedTags.push('FORMATION: HELIX', 'BIOMETRIC: DOUBLE_HELIX');
    titleNoun = 'Genetic Helix';
  } else if (
    text.includes('sphere') ||
    text.includes('orb') ||
    text.includes('planet') ||
    text.includes('globe')
  ) {
    formation = 'sphere';
    visualStyle = 'filled_circle';
    matchedTags.push('FORMATION: SPHERE', 'GEOMETRY: FIBONACCI');
    titleNoun = 'Fibonacci Orb';
  } else if (text.includes('torus') || text.includes('donut') || text.includes('ring')) {
    formation = 'torus';
    visualStyle = 'ring';
    matchedTags.push('FORMATION: TORUS', 'GEOMETRY: TOROIDAL');
    titleNoun = 'Neon Torus';
  }

  // 2. COLOR / MOOD PALETTE MATCHING
  if (
    text.includes('green') ||
    text.includes('toxic') ||
    text.includes('matrix') ||
    text.includes('radioactive') ||
    text.includes('emerald') ||
    text.includes('terminal')
  ) {
    palette = 'toxic_green';
    matchedTags.push('PALETTE: TOXIC GREEN');
  } else if (
    text.includes('cyan') ||
    text.includes('blue') ||
    text.includes('ice') ||
    text.includes('water') ||
    text.includes('aqua') ||
    text.includes('electric') ||
    text.includes('frost')
  ) {
    palette = 'electric_cyan';
    matchedTags.push('PALETTE: ELECTRIC CYAN');
  } else if (
    text.includes('magenta') ||
    text.includes('pink') ||
    text.includes('rose') ||
    text.includes('fuchsia')
  ) {
    palette = 'hot_magenta';
    matchedTags.push('PALETTE: HOT MAGENTA');
  } else if (
    text.includes('purple') ||
    text.includes('violet') ||
    text.includes('amethyst') ||
    text.includes('acid') ||
    text.includes('indigo')
  ) {
    palette = 'acid_violet';
    matchedTags.push('PALETTE: ACID VIOLET');
  } else if (
    text.includes('gold') ||
    text.includes('yellow') ||
    text.includes('fire') ||
    text.includes('amber') ||
    text.includes('plasma') ||
    text.includes('orange') ||
    text.includes('sun') ||
    text.includes('warm')
  ) {
    palette = 'plasma_gold';
    matchedTags.push('PALETTE: PLASMA GOLD');
  } else if (text.includes('cyber amber') || text.includes('bronze') || text.includes('copper')) {
    palette = 'cyber_amber';
    matchedTags.push('PALETTE: CYBER AMBER');
  }

  // 3. VISUAL STYLE MATCHING (if not overridden by formation)
  if (text.includes('sparkle') || text.includes('star') || text.includes('twinkle') || text.includes('glitter')) {
    visualStyle = 'sparkle';
    matchedTags.push('STYLE: SPARKLE');
  } else if (text.includes('drop') || text.includes('rain') || text.includes('liquid') || text.includes('droplet')) {
    visualStyle = 'drop';
    matchedTags.push('STYLE: DROP');
  } else if (text.includes('triangle') || text.includes('polygon') || text.includes('prism')) {
    visualStyle = 'triangle';
    matchedTags.push('STYLE: TRIANGLE');
  } else if (text.includes('square') || text.includes('pixel') || text.includes('voxel') || text.includes('cube')) {
    visualStyle = 'square';
    matchedTags.push('STYLE: SQUARE');
  } else if (text.includes('ring') || text.includes('halo')) {
    visualStyle = 'ring';
    matchedTags.push('STYLE: RING');
  } else if (text.includes('arrow') || text.includes('chevron') || text.includes('vector')) {
    visualStyle = 'arrow';
    matchedTags.push('STYLE: ARROW');
  }

  // 4. SPEED DYNAMICS
  if (
    text.includes('fast') ||
    text.includes('rapid') ||
    text.includes('hyper') ||
    text.includes('storm') ||
    text.includes('swift') ||
    text.includes('furious') ||
    text.includes('rush')
  ) {
    speed = 1.85;
    matchedTags.push('VELOCITY: HYPER (1.85x)');
  } else if (
    text.includes('slow') ||
    text.includes('calm') ||
    text.includes('gentle') ||
    text.includes('zen') ||
    text.includes('peaceful') ||
    text.includes('drift') ||
    text.includes('idle')
  ) {
    speed = 0.55;
    matchedTags.push('VELOCITY: ZEN (0.55x)');
  } else if (text.includes('medium') || text.includes('steady')) {
    speed = 1.0;
  }

  // 5. GLOW / LUMINANCE
  if (
    text.includes('blinding') ||
    text.includes('intense') ||
    text.includes('radiant') ||
    text.includes('supernova') ||
    text.includes('blaze') ||
    text.includes('bright')
  ) {
    glowIntensity = 1.95;
    bloomStrength = 2.6;
    matchedTags.push('LUMEN: INTENSE NOVA');
  } else if (text.includes('soft') || text.includes('dim') || text.includes('subtle') || text.includes('faint')) {
    glowIntensity = 0.75;
    bloomStrength = 0.95;
    matchedTags.push('LUMEN: SOFT SHEEN');
  }

  // 6. POPULATION DENSITY
  if (
    text.includes('dense') ||
    text.includes('swarm') ||
    text.includes('massive') ||
    text.includes('million') ||
    text.includes('heavy') ||
    text.includes('crowded')
  ) {
    particleCount = 18000;
    matchedTags.push('DENSITY: 18,000');
  } else if (text.includes('sparse') || text.includes('few') || text.includes('minimal') || text.includes('light')) {
    particleCount = 5000;
    matchedTags.push('DENSITY: 5,000');
  }

  // 7. TASTEFUL RANDOMIZATION FALLBACK (if user entered arbitrary words with no matches)
  const formationsPool: FormationType[] = [
    'vortex',
    'black_hole',
    'torus_knot',
    'wave_grid',
    'supernova',
    'jellyfish',
    'galaxy',
    'aurora',
    'helix',
    'sphere',
  ];
  const stylesPool: VisualStyle[] = ['sparkle', 'circle', 'drop', 'triangle', 'square', 'ring'];
  const palettesPool: NeonPaletteId[] = [
    'toxic_green',
    'electric_cyan',
    'hot_magenta',
    'plasma_gold',
    'acid_violet',
    'cyber_amber',
  ];

  if (!formation) {
    // Hash input string for deterministic tastefulness
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    formation = formationsPool[absHash % formationsPool.length];
    matchedTags.push(`EXPLORATION: ${formation.toUpperCase()}`);
  }

  if (!visualStyle) {
    const styleIdx = Math.floor(Math.random() * stylesPool.length);
    visualStyle = stylesPool[styleIdx];
  }

  if (!palette) {
    const palIdx = Math.floor(Math.random() * palettesPool.length);
    palette = palettesPool[palIdx];
  }

  if (speed === undefined) {
    speed = 0.8 + Math.round(Math.random() * 8) * 0.1;
  }

  if (glowIntensity === undefined) {
    glowIntensity = 1.35;
  }

  if (bloomStrength === undefined) {
    bloomStrength = 1.7;
  }

  if (particleCount === undefined) {
    particleCount = 14500;
  }

  // Suggested title generation
  let finalTitle = titleNoun;
  if (!finalTitle) {
    const words = input
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['made', 'with', 'from', 'scene', 'particles', 'like', 'the'].includes(w.toLowerCase()));
    if (words.length > 0) {
      finalTitle = words
        .slice(0, 3)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    } else {
      finalTitle = `${palette.replace('_', ' ').toUpperCase()} ${formation.toUpperCase()}`;
    }
  }

  return {
    params: {
      ...baseParams,
      formation,
      visualStyle,
      palette,
      speed,
      glowIntensity,
      bloomEnabled: true,
      bloomStrength,
      particleCount,
      showWireframe: true,
      autoOrbit: true,
      autoOrbitSpeed: 0.75,
    },
    sceneTarget,
    suggestedTitle: finalTitle,
    matchedTags,
  };
}
