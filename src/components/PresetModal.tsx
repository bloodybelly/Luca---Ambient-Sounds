import React, { useState } from 'react';
import { X, BookmarkPlus, Play, Trash2, Check, Sparkles, Sliders } from 'lucide-react';
import { Preset, SoundState } from '../types';
import { DEFAULT_PRESETS } from '../data/presets';
import { SOUND_LIBRARY } from '../data/sounds';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (preset: Preset) => void;
  soundStates: Record<string, SoundState>;
  customPresets: Preset[];
  onSaveCustomPreset: (name: string, description?: string) => void;
  onDeleteCustomPreset: (id: string) => void;
  accentColor: string;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
  soundStates,
  customPresets,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  accentColor,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Active sounds currently running
  const activeEntries = (Object.entries(soundStates) as [string, SoundState][]).filter(([, state]) => state.playing);
  const hasActiveSounds = activeEntries.length > 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !hasActiveSounds) return;

    onSaveCustomPreset(newPresetName.trim());
    setNewPresetName('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div
      id="preset-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="preset-modal-card"
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
              <span>Atmospheric Presets</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly load curated soundscapes or save your own custom mix.
            </p>
          </div>

          <button
            type="button"
            id="close-presets-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close presets modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Save Current Combination Section */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <BookmarkPlus className="w-4 h-4" style={{ color: accentColor }} />
              <span>Save Current Combination</span>
            </h3>

            {hasActiveSounds ? (
              <form onSubmit={handleSave} className="space-y-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {activeEntries.map(([soundId, state]) => {
                    const sound = SOUND_LIBRARY.find((s) => s.id === soundId);
                    return (
                      <span
                        key={soundId}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-900/80 text-slate-300 border border-slate-700/60"
                      >
                        {sound?.name || soundId}: {state.volume}%
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="new-preset-name-input"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Give your preset a name (e.g. Midnight Writing)..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 focus:border-slate-500 text-white placeholder-slate-500 focus:outline-none"
                    maxLength={30}
                  />
                  <button
                    type="submit"
                    id="save-preset-btn"
                    disabled={!newPresetName.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 ${
                      !newPresetName.trim()
                        ? 'opacity-40 cursor-not-allowed bg-slate-700'
                        : 'shadow-md hover:scale-[1.02]'
                    }`}
                    style={{
                      backgroundColor: newPresetName.trim() ? accentColor : undefined,
                    }}
                  >
                    {saveSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    <span>{saveSuccess ? 'Saved!' : 'Save Preset'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-400">
                Turn on any sounds to save your custom blend as a reusable preset.
              </p>
            )}
          </div>

          {/* Custom Presets (if any exist) */}
          {customPresets.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Your Saved Mixes ({customPresets.length})
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    id={`custom-preset-${preset.id}`}
                    className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-white truncate">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {Object.entries(preset.soundVolumes)
                          .map(([sId, vol]) => {
                            const snd = SOUND_LIBRARY.find((s) => s.id === sId);
                            return `${snd?.name || sId} (${vol}%)`;
                          })
                          .join(' • ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id={`load-preset-${preset.id}`}
                        onClick={() => {
                          onLoadPreset(preset);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Load</span>
                      </button>

                      <button
                        type="button"
                        id={`delete-preset-${preset.id}`}
                        onClick={() => onDeleteCustomPreset(preset.id)}
                        title="Delete preset"
                        aria-label={`Delete preset ${preset.name}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curated Presets */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Curated Soundscapes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  id={`default-preset-${preset.id}`}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-white group-hover:text-slate-100">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {preset.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {Object.keys(preset.soundVolumes).length} sounds
                    </span>

                    <button
                      type="button"
                      id={`load-default-preset-${preset.id}`}
                      onClick={() => {
                        onLoadPreset(preset);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Play Mix</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
