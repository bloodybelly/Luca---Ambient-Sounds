import React from 'react';
import { Sparkles, Play } from 'lucide-react';
import { SOUND_LIBRARY } from '../data/sounds';
import { SoundIcon } from './SoundIcon';

interface EmptyStateProps {
  onQuickStartSound: (id: string) => void;
  accentColor: string;
}

const RECOMMENDED_IDS = ['rain', 'fireplace', 'ocean_waves', 'coffee_shop', 'brown_noise'];

export const EmptyState: React.FC<EmptyStateProps> = ({ onQuickStartSound, accentColor }) => {
  const recommendedSounds = SOUND_LIBRARY.filter((s) => RECOMMENDED_IDS.includes(s.id));

  return (
    <div
      id="empty-atmosphere-state"
      className="w-full py-8 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md text-center flex flex-col items-center justify-center gap-3 transition-all duration-300"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 shadow-inner"
        style={{
          backgroundColor: `${accentColor}18`,
          color: accentColor,
        }}
      >
        <Sparkles className="w-6 h-6" />
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Your atmosphere is quiet.
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Pick a sound to get started, or try one of these soothing favorites:
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        {recommendedSounds.map((sound) => (
          <button
            key={sound.id}
            type="button"
            id={`empty-recommend-${sound.id}`}
            onClick={() => onQuickStartSound(sound.id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <SoundIcon name={sound.iconName} className="w-3.5 h-3.5" color={sound.color} />
            <span>{sound.name}</span>
            <Play className="w-2.5 h-2.5 fill-slate-400 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};
