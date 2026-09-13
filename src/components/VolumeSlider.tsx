import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  id: string;
  label: string;
  value: number; // 0-100
  onChange: (value: number) => void;
  muted?: boolean;
  onToggleMute?: () => void;
  disabled?: boolean;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  id,
  label,
  value,
  onChange,
  muted = false,
  onToggleMute,
  disabled = false,
  accentColor = '#8b5cf6',
  size = 'md',
}) => {
  const displayValue = muted ? 0 : value;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const nextVal = Number(e.target.value);
    onChange(nextVal);
  };

  const handleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleMute && !disabled) {
      onToggleMute();
    }
  };

  const trackHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div
      id={`volume-slider-wrapper-${id}`}
      className="flex items-center gap-2.5 w-full select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {onToggleMute && (
        <button
          type="button"
          id={`mute-btn-${id}`}
          onClick={handleMuteClick}
          disabled={disabled}
          title={muted ? `Unmute ${label}` : `Mute ${label}`}
          aria-label={muted ? `Unmute ${label}` : `Mute ${label}`}
          className={`p-1.5 rounded-lg transition-colors duration-150 flex-shrink-0 cursor-pointer ${
            muted
              ? 'text-red-400 hover:text-red-300 bg-red-500/10'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {muted ? <VolumeX className={iconSize} /> : <Volume2 className={iconSize} />}
        </button>
      )}

      {/* Interactive slider track container */}
      <div className="relative flex-1 flex items-center py-2">
        {/* Background track */}
        <div className={`w-full ${trackHeight} rounded-full bg-slate-800/80 overflow-hidden relative shadow-inner`}>
          {/* Active fill */}
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              muted ? 'opacity-30' : 'opacity-100'
            }`}
            style={{
              width: `${displayValue}%`,
              backgroundColor: muted ? '#64748b' : accentColor,
              boxShadow: !muted && displayValue > 0 ? `0 0 8px ${accentColor}80` : 'none',
            }}
          />
        </div>

        {/* Real HTML range input over the top for 100% native touch and accessibility */}
        <input
          type="range"
          id={`range-input-${id}`}
          min="0"
          max="100"
          step="1"
          value={displayValue}
          onChange={handleSliderChange}
          disabled={disabled}
          aria-label={`${label} volume`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayValue}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10 touch-pan-x"
        />

        {/* Custom thumb visual */}
        <div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
          style={{
            left: `calc(${displayValue}% - ${size === 'sm' ? '6px' : '8px'})`,
          }}
        >
          <div
            className={`${
              size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
            } rounded-full bg-white shadow-md border border-slate-700/50 flex items-center justify-center transition-transform ${
              disabled ? 'opacity-40' : 'scale-100'
            }`}
            style={{
              boxShadow: !muted ? `0 0 10px ${accentColor}` : 'none',
            }}
          />
        </div>
      </div>

      {/* Percentage readout */}
      <span
        id={`volume-percent-${id}`}
        className={`font-mono text-xs font-semibold tabular-nums min-w-[2.5rem] text-right ${
          muted ? 'text-red-400 line-through' : disabled ? 'text-slate-500' : 'text-slate-300'
        }`}
      >
        {displayValue}%
      </span>
    </div>
  );
};
