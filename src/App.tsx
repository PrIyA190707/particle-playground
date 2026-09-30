/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SceneId,
  SimulationParams,
  DEFAULT_PARAMS,
  NEON_PALETTES,
  ScenePreset,
  CommunityRemix,
} from './types/simulation';
import { Sidebar } from './components/Sidebar';
import { ControlsPanel } from './components/ControlsPanel';
import { SceneSwitcherPill } from './components/SceneSwitcherPill';
import { TerminalHeader } from './components/TerminalHeader';
import { SimulationCanvas } from './components/SimulationCanvas';
import { PromptModal } from './components/PromptModal';
import { RemixModal } from './components/RemixModal';
import { getStoredRemixes, deleteRemix } from './utils/remixStorage';

export default function App() {
  const [activeScene, setActiveScene] = useState<SceneId>('butterflies');
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isPaused, setIsPaused] = useState(false);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);
  const [fps, setFps] = useState(60);
  const [entityCount, setEntityCount] = useState(DEFAULT_PARAMS.particleCount);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isRemixModalOpen, setIsRemixModalOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | undefined>('butterflies');
  const [communityRemixes, setCommunityRemixes] = useState<CommunityRemix[]>(() => getStoredRemixes());
  const [activeRemixId, setActiveRemixId] = useState<string | undefined>(undefined);

  const triggerBurstRef = useRef<(() => void) | null>(null);

  // Handle scene switching from either sidebar, pill arrows, or keyboard
  const handleSelectScene = useCallback((newScene: SceneId) => {
    setActiveScene(newScene);
    setActivePresetId(newScene);
    setActiveRemixId(undefined);
  }, []);

  // Handle curated scene presets (sets formation + visual style + slider values together)
  const handleSelectPreset = useCallback((preset: ScenePreset) => {
    setActivePresetId(preset.id);
    setActiveRemixId(undefined);
    if (preset.sceneTarget) {
      setActiveScene(preset.sceneTarget);
    }
    setParams((prev) => ({
      ...prev,
      ...preset.params,
    }));
  }, []);

  // Handle community remix selection (loads that scene immediately)
  const handleSelectRemix = useCallback((remix: CommunityRemix) => {
    setActiveRemixId(remix.id);
    setActivePresetId(undefined);
    if (remix.sceneTarget) {
      setActiveScene(remix.sceneTarget);
    }
    setParams((prev) => ({
      ...prev,
      ...remix.params,
    }));
  }, []);

  // Handle deleting a saved remix
  const handleDeleteRemix = useCallback((id: string) => {
    const updated = deleteRemix(id);
    setCommunityRemixes(updated);
    setActiveRemixId((current) => (current === id ? undefined : current));
  }, []);

  // Callback when a remix is saved from RemixModal
  const handleRemixSaved = useCallback(() => {
    const updated = getStoredRemixes();
    setCommunityRemixes(updated);
    if (updated.length > 0) {
      setActiveRemixId(updated[0].id);
      setActivePresetId(undefined);
    }
  }, []);

  // Apply synthesized remix params directly to viewport
  const handleApplyRemixParams = useCallback(
    (newParams: Partial<SimulationParams>, sceneTarget?: SceneId) => {
      if (sceneTarget) {
        setActiveScene(sceneTarget);
      }
      setParams((prev) => ({
        ...prev,
        ...newParams,
      }));
    },
    []
  );

  // Update simulation parameters
  const handleChangeParams = useCallback((newParams: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  // Reset to default parameters
  const handleResetParams = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  // Randomize parameters for interesting variations
  const handleRandomizeParams = useCallback(() => {
    const randomPal = NEON_PALETTES[Math.floor(Math.random() * NEON_PALETTES.length)];
    setParams((prev) => ({
      ...prev,
      palette: randomPal.id,
      colorHue: randomPal.hue,
      speed: Number((0.4 + Math.random() * 1.8).toFixed(2)),
      trailPersistence: Number((0.1 + Math.random() * 0.6).toFixed(2)),
      glowIntensity: Number((0.6 + Math.random() * 1.5).toFixed(2)),
      turbulence: Number((0.3 + Math.random() * 1.5).toFixed(2)),
      attraction: Number((0.2 + Math.random() * 1.4).toFixed(2)),
      wingScale: Number((0.7 + Math.random() * 1.0).toFixed(2)),
      pulseFrequency: Number((0.5 + Math.random() * 1.5).toFixed(2)),
      glowRadius: Math.floor(18 + Math.random() * 35),
      rotationSpeedX: Number(((Math.random() - 0.5) * 2.5).toFixed(2)),
      rotationSpeedY: Number(((Math.random() - 0.5) * 2.5).toFixed(2)),
      morphIntensity: Number((Math.random() * 0.8).toFixed(2)),
      explodeOffset: Number((Math.random() * 0.3).toFixed(2)),
    }));
  }, []);

  // Energy burst interaction
  const handleBurst = useCallback(() => {
    if (triggerBurstRef.current) {
      triggerBurstRef.current();
    }
  }, []);

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or editable field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === '1') {
        setActiveScene('butterflies');
      } else if (e.key === '2') {
        setActiveScene('fireflies');
      } else if (e.key === '3') {
        setActiveScene('shapes');
      } else if (e.key === 'b' || e.key === 'B') {
        handleBurst();
      } else if (e.key === 'c' || e.key === 'C') {
        setParams((prev) => {
          const currIdx = NEON_PALETTES.findIndex((p) => p.id === prev.palette);
          const next = NEON_PALETTES[(currIdx + 1) % NEON_PALETTES.length];
          return { ...prev, palette: next.id, colorHue: next.hue };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBurst]);

  const handleFpsUpdate = useCallback((newFps: number, count: number) => {
    setFps(newFps);
    setEntityCount(count);
  }, []);

  const handleMouseCoords = useCallback((x: number, y: number) => {
    setMouseCoords({ x, y });
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#020704] text-[#00ff66] font-mono overflow-hidden select-none">
      {/* Top Status Bar */}
      <TerminalHeader
        scene={activeScene}
        scanlinesEnabled={scanlinesEnabled}
        onToggleScanlines={() => setScanlinesEnabled((prev) => !prev)}
        mouseCoords={mouseCoords}
        fps={fps}
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        onOpenRemixModal={() => setIsRemixModalOpen(true)}
      />

      {/* Main Workspace: Left Sidebar + Center Canvas Viewport + Right Controls Panel */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeScene={activeScene}
          onSelectScene={handleSelectScene}
          onSelectPreset={handleSelectPreset}
          activePresetId={activePresetId}
          communityRemixes={communityRemixes}
          activeRemixId={activeRemixId}
          onSelectRemix={handleSelectRemix}
          onDeleteRemix={handleDeleteRemix}
          onOpenRemixModal={() => setIsRemixModalOpen(true)}
          fps={fps}
        />

        {/* Center Main Viewport */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-[#020704]">
          {/* Interactive Simulation Canvas */}
          <div className="w-full h-full relative">
            <SimulationCanvas
              scene={activeScene}
              params={params}
              isPaused={isPaused}
              scanlinesEnabled={scanlinesEnabled}
              onFpsUpdate={handleFpsUpdate}
              onMouseCoords={handleMouseCoords}
              triggerBurstRef={triggerBurstRef}
            />

            {/* Bottom Pill Arrows Navigation */}
            <SceneSwitcherPill
              currentScene={activeScene}
              onSceneChange={handleSelectScene}
            />
          </div>
        </main>

        {/* Right Sidebar: SIMULATION CONTROLS */}
        <ControlsPanel
          scene={activeScene}
          params={params}
          onChangeParams={handleChangeParams}
          onResetParams={handleResetParams}
          onRandomizeParams={handleRandomizeParams}
          onBurst={handleBurst}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          fps={fps}
          entityCount={entityCount}
        />
      </div>

      {/* Live Master Prompt Modal */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        params={params}
        scene={activeScene}
      />

      {/* Remix Studio & Publish Modal */}
      <RemixModal
        isOpen={isRemixModalOpen}
        onClose={() => setIsRemixModalOpen(false)}
        currentParams={params}
        onApplyParams={handleApplyRemixParams}
        onRemixSaved={handleRemixSaved}
      />
    </div>
  );
}
