import React, { useState } from 'react';
import { SceneId, SidebarItem, ScenePreset, SCENE_PRESETS, CommunityRemix, NEON_PALETTES } from '../types/simulation';
import {
  Terminal,
  Sparkles,
  Flame,
  Orbit,
  Zap,
  Sliders,
  ShieldAlert,
  Waves,
  Compass,
  Sun,
  Users,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { StaticThumbnail } from './StaticThumbnail';
import { generateMasterPrompt } from './PromptModal';

interface SidebarProps {
  activeScene: SceneId;
  onSelectScene: (scene: SceneId) => void;
  onSelectPreset?: (preset: ScenePreset) => void;
  activePresetId?: string;
  communityRemixes?: CommunityRemix[];
  activeRemixId?: string;
  onSelectRemix?: (remix: CommunityRemix) => void;
  onDeleteRemix?: (id: string) => void;
  onOpenRemixModal?: () => void;
  fps: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScene,
  onSelectScene,
  onSelectPreset,
  activePresetId,
  communityRemixes = [],
  activeRemixId,
  onSelectRemix,
  onDeleteRemix,
  onOpenRemixModal,
  fps,
}) => {
  const [copiedRemixId, setCopiedRemixId] = useState<string | null>(null);

  const handleCopyRemixPrompt = async (remix: CommunityRemix) => {
    const prompt = remix.promptDescription
      ? `${remix.promptDescription} — ${generateMasterPrompt(remix.params, remix.sceneTarget)}`
      : generateMasterPrompt(remix.params, remix.sceneTarget);

    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedRemixId(remix.id);
      setTimeout(() => setCopiedRemixId(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedRemixId(remix.id);
      setTimeout(() => setCopiedRemixId(null), 2000);
    }
  };
  const items: {
    id: SidebarItem;
    label: string;
    icon: React.ReactNode;
    sceneTarget?: SceneId;
    disabled?: boolean;
    tag?: string;
  }[] = [
    {
      id: 'INTERFACE',
      label: 'INTERFACE',
      icon: <Terminal className="w-4 h-4" />,
      disabled: true,
      tag: 'SYS_ROOT',
    },
    {
      id: 'BUTTERFLIES',
      label: 'BUTTERFLIES',
      icon: <Sparkles className="w-4 h-4" />,
      sceneTarget: 'butterflies',
      tag: '01',
    },
    {
      id: 'FIREFLIES',
      label: 'FIREFLIES',
      icon: <Flame className="w-4 h-4" />,
      sceneTarget: 'fireflies',
      tag: '02',
    },
    {
      id: 'FORCES',
      label: 'FORCES',
      icon: <Zap className="w-4 h-4" />,
      disabled: true,
      tag: 'STANDBY',
    },
    {
      id: 'SHAPES',
      label: 'SHAPES',
      icon: <Orbit className="w-4 h-4" />,
      sceneTarget: 'shapes',
      tag: '03',
    },
    {
      id: 'SHADERS',
      label: 'SHADERS',
      icon: <Sliders className="w-4 h-4" />,
      disabled: true,
      tag: 'OFFLINE',
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#030c06] border-r border-[#0d3b1b] flex flex-col justify-between font-mono select-none z-20">
      {/* Top Header / Branding */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <div className="p-4 border-b border-[#0d3b1b] bg-[#020a05]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold tracking-widest text-[#00ff66] flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_8px_#00ff66]" />
              TERMINAL // STITCH
            </span>
            <span className="text-[9px] px-1.5 py-0.5 border border-[#14532d] bg-[#052010] text-[#4ade80]">
              v2.8.4
            </span>
          </div>
          <div className="text-[10px] text-[#00aa44] tracking-tight">
            CORE.GEN_SIM // ENGINE_ACTIVE
          </div>
        </div>

        {/* Category Header */}
        <div className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-wider text-[#008833] flex items-center justify-between">
          <span>// NAVIGATION_NODES</span>
          <span className="text-[9px] text-[#006622]">03_ACT</span>
        </div>

        {/* Sidebar Item List */}
        <nav className="px-2.5 space-y-1">
          {items.map((item) => {
            const isScene = Boolean(item.sceneTarget);
            const isActive = isScene && activeScene === item.sceneTarget;
            const isDisabled = item.disabled;

            if (item.id === 'INTERFACE') {
              return (
                <div
                  key={item.id}
                  className="px-3 py-2 text-[12px] font-bold tracking-wider text-[#00e555] bg-[#051a0d]/60 border border-[#0e4420] flex items-center justify-between mb-2"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[9px] text-[#00aa44] bg-[#082b15] px-1 border border-[#105929]">
                    {item.tag}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (item.sceneTarget) {
                    onSelectScene(item.sceneTarget);
                  }
                }}
                className={`w-full group text-left px-3 py-2.5 text-[12px] font-mono tracking-wider transition-all duration-150 flex items-center justify-between border ${
                  isActive
                    ? 'bg-[#00ff66]/15 border-[#00ff66] text-[#ffffff] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                    : isDisabled
                    ? 'border-transparent text-[#005522] cursor-not-allowed opacity-60'
                    : 'border-transparent text-[#00cc55] hover:text-[#00ff66] hover:bg-[#062410] hover:border-[#124d25]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-[#00ff66]' : isDisabled ? 'text-[#00441a]' : 'text-[#00aa44] group-hover:text-[#00ff66]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isActive && (
                    <span className="text-[10px] text-[#00ff66] font-bold animate-pulse">
                      ►
                    </span>
                  )}
                  {item.tag && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 border ${
                        isActive
                          ? 'border-[#00ff66] text-[#00ff66] bg-[#04200e]'
                          : isDisabled
                          ? 'border-[#0a2714] text-[#005522] bg-[#031308]'
                          : 'border-[#124d25] text-[#00aa44] bg-[#051c0d]'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* SCENES CURATED PRESETS GROUP */}
        <div className="px-4 pt-3.5 pb-1 text-[10px] uppercase tracking-wider text-[#008833] flex items-center justify-between border-t border-[#092b14] mt-2">
          <span>// SCENES</span>
          <span className="text-[9px] text-[#00aa44]">CURATED</span>
        </div>

        <nav className="px-2.5 space-y-1 pb-3">
          {SCENE_PRESETS.map((preset) => {
            const isPresetActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (onSelectPreset) {
                    onSelectPreset(preset);
                  }
                }}
                className={`w-full group text-left px-3 py-2 text-[11.5px] font-mono tracking-wider transition-all duration-150 flex items-center justify-between border rounded-xs ${
                  isPresetActive
                    ? 'bg-[#00ff66]/15 border-[#00ff66] text-[#ffffff] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                    : 'border-transparent text-[#00cc55] hover:text-[#00ff66] hover:bg-[#062410] hover:border-[#124d25]'
                }`}
                title={preset.description}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span className={isPresetActive ? 'text-[#00ff66]' : 'text-[#00aa44] group-hover:text-[#00ff66]'}>
                    {preset.id === 'butterflies' && <Sparkles className="w-3.5 h-3.5" />}
                    {preset.id === 'fireflies' && <Flame className="w-3.5 h-3.5" />}
                    {preset.id === 'galaxy_voyage' && <Orbit className="w-3.5 h-3.5" />}
                    {preset.id === 'aurora_night' && <Waves className="w-3.5 h-3.5" />}
                    {preset.id === 'ocean_storm' && <Compass className="w-3.5 h-3.5" />}
                    {preset.id === 'cosmic_birth' && <Sun className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-semibold truncate">{preset.label}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPresetActive && (
                    <span className="text-[9px] text-[#00ff66] font-bold animate-pulse">
                      ►
                    </span>
                  )}
                  <span
                    className={`text-[8.5px] px-1 py-0.5 border ${
                      isPresetActive
                        ? 'border-[#00ff66] text-[#00ff66] bg-[#04200e]'
                        : 'border-[#124d25] text-[#008833] bg-[#051c0d]'
                    }`}
                  >
                    {preset.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* COMMUNITY GALLERY SECTION */}
        <div className="px-4 pt-3.5 pb-1 text-[10px] uppercase tracking-wider text-[#008833] flex items-center justify-between border-t border-[#092b14] mt-2">
          <span className="flex items-center gap-1.5 font-bold text-[#00cc55]">
            <Users className="w-3.5 h-3.5 text-[#00ff66]" />
            // COMMUNITY
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8.5px] px-1 py-0.2 border border-[#14532d] bg-[#041d0e] text-[#4ade80]">
              {communityRemixes.length} REMIXES
            </span>
            {onOpenRemixModal && (
              <button
                type="button"
                onClick={onOpenRemixModal}
                className="px-1.5 py-0.5 border border-[#00ff66] bg-[#00ff66]/15 text-[9px] text-[#00ff66] hover:bg-[#00ff66]/25 rounded-xs font-bold transition-all"
                title="Create New Remix"
              >
                + REMIX
              </button>
            )}
          </div>
        </div>

        <div className="px-2.5 space-y-2 pb-3">
          {communityRemixes.map((remix) => {
            const isRemixActive = activeRemixId === remix.id;
            const pal = NEON_PALETTES.find((p) => p.id === remix.palette) || NEON_PALETTES[0];
            const isCopied = copiedRemixId === remix.id;

            return (
              <div
                key={remix.id}
                className={`group relative p-2.5 text-left font-mono border rounded-xs transition-all duration-150 ${
                  isRemixActive
                    ? 'bg-[#00ff66]/10 border-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.25)]'
                    : 'bg-[#020b05] border-[#0d3b1b] hover:border-[#166534] hover:bg-[#041a0d]'
                }`}
              >
                {/* Header row: Thumbnail + Title + Author Tag */}
                <div
                  className="flex items-start gap-2.5 cursor-pointer"
                  onClick={() => onSelectRemix && onSelectRemix(remix)}
                >
                  <StaticThumbnail
                    formation={remix.params.formation}
                    primaryColor={pal.primary}
                    accentColor={pal.accent}
                    className="w-10 h-10 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-[#ffffff] truncate group-hover:text-[#00ff66] transition-colors">
                        {remix.title}
                      </span>
                      {remix.isUserCreated && onDeleteRemix && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRemix(remix.id);
                          }}
                          className="text-[#006622] hover:text-[#ef4444] transition-colors p-0.5"
                          title="Delete saved remix"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {remix.isUserCreated ? (
                        <span className="text-[8px] px-1 py-0.2 border border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] font-bold tracking-wider rounded-xs">
                          by you
                        </span>
                      ) : (
                        <span className="text-[8.5px] text-[#00aa44] truncate">
                          @{remix.author}
                        </span>
                      )}
                      <span className="text-[8.5px] text-[#006622]">·</span>
                      <span className="text-[8px] text-[#008833] uppercase">
                        {remix.params.formation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parameters Chips */}
                <div
                  className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-[#092b14] text-[8.5px] cursor-pointer"
                  onClick={() => onSelectRemix && onSelectRemix(remix)}
                >
                  <span className="px-1 py-0.2 border border-[#0d3b1b] bg-[#010804] text-[#00cc55]">
                    {remix.params.visualStyle}
                  </span>
                  <span className="px-1 py-0.2 border border-[#0d3b1b] bg-[#010804] text-[#00aa44]">
                    {Math.round(remix.params.particleCount / 1000)}k pts
                  </span>
                  <span className="px-1 py-0.2 border border-[#0d3b1b] bg-[#010804] text-[#00aa44]">
                    {remix.params.speed.toFixed(1)}x
                  </span>
                  <span
                    className="px-1 py-0.2 border border-[#0d3b1b] bg-[#010804] font-semibold"
                    style={{ color: pal.primary }}
                  >
                    {pal.code}
                  </span>
                </div>

                {/* Footer action row: Load + Copy Prompt */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#082210] text-[9px]">
                  <button
                    type="button"
                    onClick={() => onSelectRemix && onSelectRemix(remix)}
                    className={`font-bold transition-colors ${
                      isRemixActive ? 'text-[#00ff66]' : 'text-[#00aa44] hover:text-[#00ff66]'
                    }`}
                  >
                    {isRemixActive ? '► ACTIVE' : 'LOAD SCENE'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyRemixPrompt(remix);
                    }}
                    className={`px-1.5 py-0.5 border text-[8.5px] flex items-center gap-1 transition-all rounded-xs ${
                      isCopied
                        ? 'border-[#00ff66] bg-[#00ff66] text-[#020a05] font-bold'
                        : 'border-[#124d25] bg-[#03150a] text-[#00cc55] hover:text-[#ffffff] hover:border-[#00ff66]'
                    }`}
                    title="Copy master prompt for this remix"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-2.5 h-2.5" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>COPY PROMPT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Footer Diagnostics */}
      <div className="p-3.5 border-t border-[#0d3b1b] bg-[#020a05] space-y-2 text-[10px]">
        <div className="flex items-center justify-between text-[#009939]">
          <span>CYCLE_RATE</span>
          <span className="text-[#00ff66] font-bold">{fps} FPS</span>
        </div>
        <div className="flex items-center justify-between text-[#009939]">
          <span>BUS_CLOCK</span>
          <span className="text-[#4ade80]">3.2 GHz</span>
        </div>
        <div className="flex items-center justify-between text-[#009939]">
          <span>RENDER_TARGET</span>
          <span className="text-[#00ff66] uppercase">{activeScene}</span>
        </div>
        <div className="pt-2 border-t border-[#092b14] flex items-center justify-between text-[9px] text-[#007728]">
          <span>LINK: NOMINAL</span>
          <span className="flex items-center gap-1 text-[#00ff66]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-ping" />
            SYNCD
          </span>
        </div>
      </div>
    </aside>
  );
};
