import React, { useState, useEffect } from 'react';
import { SceneId } from '../types/simulation';
import { Tv, Monitor, Maximize2, Minimize2, Cpu, Copy, FileText, Wand2 } from 'lucide-react';

interface TerminalHeaderProps {
  scene: SceneId;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  mouseCoords: { x: number; y: number };
  fps: number;
  onOpenPromptModal: () => void;
  onOpenRemixModal: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  scene,
  scanlinesEnabled,
  onToggleScanlines,
  mouseCoords,
  fps,
  onOpenPromptModal,
  onOpenRemixModal,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-10 bg-[#020904] border-b border-[#0d3b1b] flex items-center justify-between px-4 font-mono text-[11px] select-none z-20">
      {/* Left: Terminal Node Info */}
      <div className="flex items-center gap-3">
        <span className="text-[#00ff66] font-bold flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#00ff66]" />
          SYS://SIM_CANVAS
        </span>
        <span className="text-[#006622] hidden sm:inline">|</span>
        <span className="text-[#00bb44] hidden sm:inline">
          NODE: <span className="text-[#ffffff]">[{scene.toUpperCase()}]</span>
        </span>
      </div>

      {/* Center: Live Cursor & Frame Coordinates */}
      <div className="hidden md:flex items-center gap-4 text-[#00aa44]">
        <div className="flex items-center gap-1">
          <span>CURSOR:</span>
          <span className="text-[#00ff66] font-mono">
            X:{String(Math.max(0, mouseCoords.x)).padStart(4, '0')} Y:
            {String(Math.max(0, mouseCoords.y)).padStart(4, '0')}
          </span>
        </div>
        <span className="text-[#004416]">|</span>
        <div className="flex items-center gap-1">
          <span>SYS_CLOCK:</span>
          <span className="text-[#4ade80]">{timeStr}</span>
        </div>
      </div>

      {/* Right: Quick Action Toggles */}
      <div className="flex items-center gap-2">
        {/* Remix Studio Action Button */}
        <button
          type="button"
          onClick={onOpenRemixModal}
          className="px-2.5 py-0.5 border border-[#4ade80] bg-[#4ade80]/15 hover:bg-[#4ade80]/25 text-[#ffffff] hover:text-[#4ade80] hover:shadow-[0_0_12px_rgba(74,222,128,0.5)] text-[10px] flex items-center gap-1.5 font-bold transition-all rounded-xs"
          title="Open AI Remix Studio"
        >
          <Wand2 className="w-3 h-3 text-[#4ade80]" />
          <span>REMIX</span>
        </button>

        {/* Copy Master Prompt Action Button */}
        <button
          type="button"
          onClick={onOpenPromptModal}
          className="px-2.5 py-0.5 border border-[#00ff66] bg-[#00ff66]/15 hover:bg-[#00ff66]/25 text-[#ffffff] hover:text-[#00ff66] hover:shadow-[0_0_10px_rgba(0,255,102,0.4)] text-[10px] flex items-center gap-1.5 font-bold transition-all rounded-xs"
          title="Open Master Prompt Modal"
        >
          <Copy className="w-3 h-3 text-[#00ff66]" />
          <span>COPY PROMPT</span>
        </button>

        {/* Scanlines CRT Toggle */}
        <button
          type="button"
          onClick={onToggleScanlines}
          className={`px-2 py-0.5 border text-[10px] flex items-center gap-1 font-bold transition-all ${
            scanlinesEnabled
              ? 'border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66]'
              : 'border-[#0a2e16] bg-[#031409] text-[#006622] hover:text-[#00aa44]'
          }`}
          title="Toggle CRT Scanline Overlay"
        >
          <Tv className="w-3 h-3" />
          <span>CRT {scanlinesEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="px-2 py-0.5 border border-[#0d3b1b] bg-[#031409] text-[#00aa44] hover:text-[#00ff66] hover:border-[#00ff66] text-[10px] flex items-center gap-1 transition-all"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          <span className="hidden sm:inline">{isFullscreen ? 'EXIT' : 'FULL'}</span>
        </button>
      </div>
    </header>
  );
};
