import React from 'react';
import { Volume2, VolumeX, Shuffle, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import { VolumeSlider } from './VolumeSlider';
import { ThemeConfig } from '../types';

interface MasterMixerProps {
  masterVolume: number;
  masterMuted: boolean;
  activeCount: number;
  onMasterVolumeChange: (volume: number) => void;
  onToggleMasterMute: () => void;
  onResetAll: () => void;
  onRandomize: () => void;
  accentColor: string;
  currentTheme?: ThemeConfig;
}

export const MasterMixer: React.FC<MasterMixerProps> = ({
  masterVolume,
  masterMuted,
  activeCount,
  onMasterVolumeChange,
  onToggleMasterMute,
  onResetAll,
  onRandomize,
  accentColor,
  currentTheme,
}) => {
  return (
    <div
      id="master-mixer-panel"
      className="w-full rounded-2xl p-4 sm:p-5 border transition-all duration-300 backdrop-blur-md shadow-lg"
      style={{
        backgroundColor: currentTheme ? currentTheme.surface : 'var(--theme-surface)',
        borderColor: currentTheme ? currentTheme.border : 'var(--theme-border)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Master Volume Control */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Master Volume
              </span>
            </div>
            {activeCount > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                {activeCount} {activeCount === 1 ? 'sound' : 'sounds'} playing
              </span>
            )}
          </div>

          <VolumeSlider
            id="master"
            label="Master Volume"
            value={masterVolume}
            onChange={onMasterVolumeChange}
            muted={masterMuted}
            onToggleMute={onToggleMasterMute}
            accentColor={accentColor}
            size="md"
          />
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Surprise Me / Randomizer Button */}
          <button
            type="button"
            id="surprise-me-btn"
            onClick={onRandomize}
            title="Randomize a peaceful sound combination"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 2px 14px ${accentColor}40`,
            }}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Surprise Me</span>
          </button>

          {/* Reset Mixer Button */}
          <button
            type="button"
            id="master-reset-btn"
            onClick={onResetAll}
            disabled={activeCount === 0}
            title="Stop all sounds"
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              activeCount > 0
                ? 'text-slate-200 hover:text-white bg-slate-800/80 hover:bg-red-500/20 hover:border-red-500/40 border-slate-700/60'
                : 'text-slate-600 bg-slate-900/40 border-slate-800/40 opacity-40 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Silence All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
