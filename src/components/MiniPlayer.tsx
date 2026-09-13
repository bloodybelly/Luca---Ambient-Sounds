import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Pause,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { SoundItem, SoundState } from '../types';
import { SOUND_LIBRARY } from '../data/sounds';
import { VolumeSlider } from './VolumeSlider';

interface MiniPlayerProps {
  activeSoundsCount: number;
  activeSoundIds: string[];
  soundStates: Record<string, SoundState>;
  masterVolume: number;
  masterMuted: boolean;
  onMasterVolumeChange: (volume: number) => void;
  onToggleMasterMute: () => void;
  onVolumeChange: (id: string, volume: number) => void;
  onTogglePlay: (id: string) => void;
  onResetAll: () => void;
  accentColor: string;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  activeSoundsCount,
  activeSoundIds,
  soundStates,
  masterVolume,
  masterMuted,
  onMasterVolumeChange,
  onToggleMasterMute,
  onVolumeChange,
  onTogglePlay,
  onResetAll,
  accentColor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (activeSoundsCount === 0) return null;

  return (
    <div
      id="mini-player-container"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300 select-none"
    >
      <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Expanded Drawer (Shows sliders for all currently active sounds) */}
        {isExpanded && (
          <div className="p-4 border-b border-slate-800/80 max-h-60 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Active Sound Levels</span>
              </span>
              <button
                type="button"
                id="mini-player-silence-all-btn"
                onClick={onResetAll}
                className="text-[11px] text-red-400 hover:text-red-300 font-medium"
              >
                Silence All
              </button>
            </div>

            <div className="space-y-2.5">
              {activeSoundIds.map((soundId) => {
                const sound = SOUND_LIBRARY.find((s) => s.id === soundId);
                const state = soundStates[soundId];
                if (!sound || !state) return null;

                return (
                  <div
                    key={soundId}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <span className="text-xs font-medium text-white min-w-[5.5rem] truncate">
                      {sound.name}
                    </span>
                    <div className="flex-1">
                      <VolumeSlider
                        id={`mini-${soundId}`}
                        label={sound.name}
                        value={state.volume}
                        onChange={(vol) => onVolumeChange(soundId, vol)}
                        accentColor={sound.color || accentColor}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary Sticky Compact Bar */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Active Count & Drawer Toggle */}
          <button
            type="button"
            id="mini-player-toggle-expand"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                {activeSoundsCount} {activeSoundsCount === 1 ? 'sound' : 'sounds'} playing
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                )}
              </span>
              <span className="text-[10px] text-slate-400">
                {isExpanded ? 'Hide mixer' : 'Tap to adjust individual sounds'}
              </span>
            </div>
          </button>

          {/* Master Volume Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="mini-player-mute-btn"
              onClick={onToggleMasterMute}
              title={masterMuted ? 'Unmute master' : 'Mute master'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {masterMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <span className="text-xs font-mono font-semibold text-slate-300 tabular-nums">
              {masterMuted ? '0%' : `${masterVolume}%`}
            </span>

            {/* Quick Silence All Button */}
            <button
              type="button"
              id="mini-player-silence-btn"
              onClick={onResetAll}
              title="Silence all sounds"
              aria-label="Silence all sounds"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
