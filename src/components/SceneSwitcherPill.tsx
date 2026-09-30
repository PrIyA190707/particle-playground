import React from 'react';
import { SceneId, SCENES } from '../types/simulation';
import { ChevronLeft, ChevronRight, Terminal } from 'lucide-react';

interface SceneSwitcherPillProps {
  currentScene: SceneId;
  onSceneChange: (scene: SceneId) => void;
}

export const SceneSwitcherPill: React.FC<SceneSwitcherPillProps> = ({
  currentScene,
  onSceneChange,
}) => {
  const currentIndex = SCENES.findIndex((s) => s.id === currentScene);
  const activeMeta = SCENES[currentIndex] || SCENES[0];

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + SCENES.length) % SCENES.length;
    onSceneChange(SCENES[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % SCENES.length;
    onSceneChange(SCENES[nextIndex].id);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 select-none">
      {/* Outer Glow container */}
      <div className="relative group">
        {/* Neon back glow */}
        <div className="absolute -inset-1 bg-[#00ff66]/20 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-300 pointer-events-none" />

        {/* The Pill */}
        <div className="relative flex items-center bg-[#020d06]/95 border-2 border-[#00ff66]/60 rounded-full px-2 py-1.5 shadow-[0_0_20px_rgba(0,255,102,0.25)] backdrop-blur-md">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Scene"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#00ff66] hover:bg-[#00ff66]/20 hover:text-[#ffffff] active:scale-95 transition-all border border-transparent hover:border-[#00ff66]/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center Info Display */}
          <div className="flex items-center gap-3 px-3 min-w-[210px] justify-center text-center">
            {/* Index Counter */}
            <span className="text-[10px] font-mono tracking-widest text-[#00aa44] bg-[#051c0d] px-1.5 py-0.5 rounded border border-[#0f4422]">
              {activeMeta.code} / 03
            </span>

            {/* Scene Name */}
            <span className="text-[13px] font-mono font-bold tracking-wider text-[#00ff66] text-shadow-[0_0_8px_#00ff66] drop-shadow">
              {activeMeta.label}
            </span>

            {/* Mode Tag */}
            <span className="text-[9px] font-mono text-[#55ff99] opacity-80 uppercase hidden sm:inline">
              [{activeMeta.tag}]
            </span>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Scene"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#00ff66] hover:bg-[#00ff66]/20 hover:text-[#ffffff] active:scale-95 transition-all border border-transparent hover:border-[#00ff66]/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mini dot indicators beneath pill */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSceneChange(scene.id)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                currentScene === scene.id
                  ? 'w-6 bg-[#00ff66] shadow-[0_0_6px_#00ff66]'
                  : 'w-1.5 bg-[#0e3b1c] hover:bg-[#00aa44]'
              }`}
              title={`Switch to ${scene.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
