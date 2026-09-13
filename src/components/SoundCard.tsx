import React from 'react';
import { Star, Power } from 'lucide-react';
import { SoundItem, SoundState, ThemeConfig } from '../types';
import { SoundIcon } from './SoundIcon';
import { VolumeSlider } from './VolumeSlider';

interface SoundCardProps {
  sound: SoundItem;
  state: SoundState;
  isFavorite: boolean;
  onTogglePlay: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onToggleMute: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  accentColor?: string;
  currentTheme?: ThemeConfig;
}

export const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  state,
  isFavorite,
  onTogglePlay,
  onVolumeChange,
  onToggleMute,
  onToggleFavorite,
  accentColor = '#8b5cf6',
  currentTheme,
}) => {
  const isActive = state.playing;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only toggle if clicked directly on card or non-interactive areas
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button')) {
      return;
    }
    onTogglePlay(sound.id);
  };

  const effectiveAccent = sound.color || accentColor;

  return (
    <div
      id={`sound-card-${sound.id}`}
      onClick={handleCardClick}
      role="region"
      aria-label={`${sound.name} sound card, ${isActive ? 'Active' : 'Inactive'}`}
      className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 select-none flex flex-col justify-between cursor-pointer border backdrop-blur-md ${
        isActive
          ? 'shadow-xl scale-[1.01]'
          : 'hover:scale-[1.01] hover:shadow-lg shadow-sm opacity-90 hover:opacity-100'
      }`}
      style={{
        backgroundColor: isActive
          ? (currentTheme ? currentTheme.surfaceActive : 'var(--theme-surface-active)')
          : (currentTheme ? currentTheme.surface : 'var(--theme-surface)'),
        borderColor: isActive
          ? effectiveAccent
          : (currentTheme ? currentTheme.border : 'var(--theme-border)'),
        boxShadow: isActive
          ? `0 8px 30px ${effectiveAccent}40, 0 0 0 1px ${effectiveAccent}60`
          : '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Active Top Accent Line */}
      {isActive && (
        <div
          className="absolute top-0 left-6 right-6 h-[2px] rounded-full transition-all duration-300"
          style={{
            backgroundColor: effectiveAccent,
            boxShadow: `0 0 10px ${effectiveAccent}`,
          }}
        />
      )}

      {/* Header Row: Icon + Favorite Button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isActive
              ? 'bg-white/10 shadow-inner ring-2'
              : 'bg-slate-800/60 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
          }`}
          style={{
            ringColor: isActive ? effectiveAccent : undefined,
            color: isActive ? effectiveAccent : undefined,
          }}
        >
          <SoundIcon
            name={sound.iconName}
            isActive={isActive}
            color={effectiveAccent}
            className="w-6 h-6"
          />
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite toggle */}
          <button
            type="button"
            id={`fav-btn-${sound.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(sound.id);
            }}
            aria-label={isFavorite ? `Remove ${sound.name} from favorites` : `Add ${sound.name} to favorites`}
            className={`p-2 rounded-lg transition-colors duration-150 cursor-pointer ${
              isFavorite
                ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 opacity-40 group-hover:opacity-100'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Quick Play/Pause Power Button */}
          <button
            type="button"
            id={`toggle-power-${sound.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay(sound.id);
            }}
            aria-label={isActive ? `Turn off ${sound.name}` : `Turn on ${sound.name}`}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-white text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            style={{
              backgroundColor: isActive ? effectiveAccent : undefined,
              color: isActive ? '#ffffff' : undefined,
            }}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Sound Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h3
            className={`font-semibold text-base tracking-tight transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
            }`}
          >
            {sound.name}
          </h3>
          {isActive && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: effectiveAccent }}
            />
          )}
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
          {sound.description}
        </p>
      </div>

      {/* Volume Slider Section */}
      <div className="mt-auto pt-2 border-t border-slate-800/60">
        <VolumeSlider
          id={sound.id}
          label={sound.name}
          value={state.volume}
          onChange={(vol) => onVolumeChange(sound.id, vol)}
          muted={state.muted}
          onToggleMute={() => onToggleMute(sound.id)}
          accentColor={effectiveAccent}
          size="md"
        />
      </div>
    </div>
  );
};
