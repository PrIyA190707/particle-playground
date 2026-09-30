import React, { useState } from 'react';
import { SimulationParams, SceneId, NEON_PALETTES } from '../types/simulation';
import { parseRemixPrompt, saveUserRemix } from '../utils/remixStorage';
import {
  Wand2,
  Sparkles,
  X,
  Play,
  BookmarkCheck,
  Tag,
  ArrowRight,
  Terminal,
  Zap,
  Layers,
  Compass,
} from 'lucide-react';

interface RemixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams: SimulationParams;
  onApplyParams: (params: Partial<SimulationParams>, sceneTarget?: SceneId) => void;
  onRemixSaved: () => void;
}

const SAMPLE_PROMPTS = [
  'a dragon made of fire particles',
  'cosmic black hole swallowing stars',
  'deep sea bioluminescent jellyfish',
  'cyberpunk matrix ocean wave grid in neon green',
  'hyperspeed tornado vortex in electric cyan',
  'quantum double helix in acid violet',
  'pulsating heart of electric pink energy',
];

export const RemixModal: React.FC<RemixModalProps> = ({
  isOpen,
  onClose,
  currentParams,
  onApplyParams,
  onRemixSaved,
}) => {
  const [promptText, setPromptText] = useState('');
  const [sceneTitle, setSceneTitle] = useState('');
  const [synthesizedResult, setSynthesizedResult] = useState<{
    params: Partial<SimulationParams>;
    sceneTarget: SceneId;
    suggestedTitle: string;
    matchedTags: string[];
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSynthesize = (customText?: string) => {
    const textToUse = customText !== undefined ? customText : promptText;
    if (!textToUse.trim()) return;

    const result = parseRemixPrompt(textToUse, currentParams);
    setSynthesizedResult(result);
    setSceneTitle(result.suggestedTitle);
    setIsSaved(false);

    // Immediately morph/apply into the live simulation so the user can see and interact with it
    onApplyParams(result.params, result.sceneTarget);
  };

  const handleSaveRemix = () => {
    if (!synthesizedResult) return;
    const finalParams: SimulationParams = {
      ...currentParams,
      ...synthesizedResult.params,
    };
    saveUserRemix(
      sceneTitle || synthesizedResult.suggestedTitle,
      promptText,
      synthesizedResult.sceneTarget,
      finalParams
    );
    setIsSaved(true);
    onRemixSaved();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const activePal =
    synthesizedResult?.params.palette
      ? NEON_PALETTES.find((p) => p.id === synthesizedResult.params.palette) || NEON_PALETTES[0]
      : NEON_PALETTES.find((p) => p.id === currentParams.palette) || NEON_PALETTES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-text">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Window */}
      <div className="relative w-full max-w-2xl bg-[#020a05] border border-[#4ade80] shadow-[0_0_35px_rgba(74,222,128,0.25)] rounded-sm font-mono z-10 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#031409] border-b border-[#0d3b1b]">
          <div className="flex items-center gap-2 text-[#4ade80] font-bold text-xs tracking-wider">
            <Wand2 className="w-4 h-4 text-[#4ade80]" />
            <span>SYS://REMIX_STUDIO</span>
            <span className="text-[9px] px-1.5 py-0.5 border border-[#166534] bg-[#052010] text-[#86efac]">
              AI_PARSER_v2
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#00aa44] hover:text-[#00ff66] transition-colors rounded-xs hover:bg-[#072513]"
            title="Close Remix Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Natural Language Prompt Input */}
          <div>
            <label className="block text-[11px] font-bold text-[#00ff66] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4ade80]" />
                DESCRIBE YOUR SCENE IN NATURAL LANGUAGE:
              </span>
              <span className="text-[9.5px] text-[#00aa44] font-normal">
                Subject · Mood · Color · Speed
              </span>
            </label>

            <div className="relative">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSynthesize();
                  }
                }}
                placeholder='e.g. "a dragon made of fire particles", "ocean storm in cyan"'
                className="w-full bg-[#010603] border border-[#124d25] focus:border-[#4ade80] focus:outline-hidden px-3.5 py-2.5 text-[#ffffff] font-mono text-[12px] placeholder-[#006622] rounded-xs shadow-inner"
                autoFocus
              />

              <button
                type="button"
                onClick={() => handleSynthesize()}
                disabled={!promptText.trim()}
                className={`absolute right-1.5 top-1.5 px-3 py-1 text-[11px] font-bold border transition-all flex items-center gap-1 ${
                  promptText.trim()
                    ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#ffffff] hover:bg-[#00ff66]/30 shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                    : 'border-[#0d3b1b] bg-[#041a0d] text-[#00551c] cursor-not-allowed'
                }`}
              >
                <span>SYNTHESIZE</span>
                <ArrowRight className="w-3 h-3 text-[#00ff66]" />
              </button>
            </div>
          </div>

          {/* Quick Preset Ideas Chips */}
          <div>
            <div className="text-[10px] text-[#008833] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>QUICK INSPIRATION CHIPS:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setPromptText(sample);
                    handleSynthesize(sample);
                  }}
                  className="px-2 py-1 text-[10px] font-mono border border-[#0d3b1b] bg-[#020d06] text-[#00cc55] hover:border-[#00ff66] hover:text-[#ffffff] hover:bg-[#062410] transition-all rounded-xs"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Synthesized Live Result Card */}
          {synthesizedResult && (
            <div className="p-3.5 border border-[#14532d] bg-[#020d06] rounded-xs space-y-3 shadow-md animate-fade-in">
              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-[#0d3b1b]">
                <span className="text-[#4ade80] font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
                  SYNTHESIZED LIVE SCENE
                </span>
                <span className="text-[9.5px] px-1.5 py-0.5 border border-[#124d25] text-[#00ff66] bg-[#041a0d]">
                  LIVE ON VIEWPORT
                </span>
              </div>

              {/* Matched Tags Chips */}
              <div className="flex flex-wrap gap-1">
                {synthesizedResult.matchedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-[9px] font-mono border border-[#124d25] bg-[#03150a] text-[#86efac]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Key Parameters Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                <div className="p-1.5 border border-[#0d3b1b] bg-[#010804]">
                  <span className="text-[#008833] block text-[9px]">FORMATION</span>
                  <span className="text-[#ffffff] font-bold uppercase">
                    {synthesizedResult.params.formation}
                  </span>
                </div>
                <div className="p-1.5 border border-[#0d3b1b] bg-[#010804]">
                  <span className="text-[#008833] block text-[9px]">SPRITE_STYLE</span>
                  <span className="text-[#ffffff] font-bold uppercase">
                    {synthesizedResult.params.visualStyle}
                  </span>
                </div>
                <div className="p-1.5 border border-[#0d3b1b] bg-[#010804]">
                  <span className="text-[#008833] block text-[9px]">PALETTE</span>
                  <span
                    className="font-bold flex items-center gap-1"
                    style={{ color: activePal.primary }}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: activePal.primary }}
                    />
                    {activePal.label}
                  </span>
                </div>
                <div className="p-1.5 border border-[#0d3b1b] bg-[#010804]">
                  <span className="text-[#008833] block text-[9px]">PARTICLES</span>
                  <span className="text-[#00ff66] font-bold">
                    {synthesizedResult.params.particleCount?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Publish Scene Name Input (Styled input, no browser popups) */}
              <div className="pt-2 border-t border-[#0d3b1b]">
                <label className="block text-[10.5px] font-bold text-[#00cc55] mb-1">
                  SCENE TITLE (FOR COMMUNITY GALLERY):
                </label>
                <input
                  type="text"
                  value={sceneTitle}
                  onChange={(e) => setSceneTitle(e.target.value)}
                  placeholder="Give your remix a name..."
                  className="w-full bg-[#010502] border border-[#166534] focus:border-[#00ff66] focus:outline-hidden px-3 py-1.5 text-[#ffffff] font-mono text-[11.5px] rounded-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#031409] border-t border-[#0d3b1b]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-[#124d25] bg-[#051c0d] text-[#00aa44] hover:text-[#00ff66] hover:border-[#00aa44] text-[11px] font-bold transition-all rounded-xs"
          >
            DISMISS
          </button>

          <div className="flex items-center gap-2">
            {synthesizedResult && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-[#124d25] bg-[#041a0d] text-[#00cc55] hover:text-[#00ff66] hover:border-[#00ff66] text-[11px] font-bold transition-all flex items-center gap-1.5 rounded-xs"
                  title="Close modal and explore scene"
                >
                  <Play className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>PLAY & TEST SCENE</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRemix}
                  disabled={isSaved}
                  className={`px-3.5 py-1.5 border text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md rounded-xs ${
                    isSaved
                      ? 'border-[#00ff66] bg-[#00ff66] text-[#020a05] shadow-[0_0_15px_rgba(0,255,102,0.6)]'
                      : 'border-[#00ff66] bg-[#00ff66]/20 text-[#ffffff] hover:bg-[#00ff66]/30 shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'SAVED TO GALLERY!' : 'SAVE REMIX'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
