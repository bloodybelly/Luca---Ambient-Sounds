import React from 'react';
import {
  Sparkles,
  RotateCcw,
  Palette,
  BookmarkCheck,
  Eye,
  EyeOff,
  Radio,
  Sliders,
  Download,
} from 'lucide-react';
import { ThemeConfig, ThemeId } from '../types';

interface HeaderProps {
  currentTheme: ThemeConfig;
  themes: ThemeConfig[];
  onSelectTheme: (id: ThemeId) => void;
  activeCount: number;
  onResetAll: () => void;
  onOpenPresets: () => void;
  onOpenDownloadMix?: () => void;
  visualEffectsEnabled: boolean;
  onToggleVisualEffects: () => void;
  onOpenQuickMixer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  themes,
  onSelectTheme,
  activeCount,
  onResetAll,
  onOpenPresets,
  onOpenDownloadMix,
  visualEffectsEnabled,
  onToggleVisualEffects,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = React.useState(false);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors duration-300"
      style={{
        backgroundColor: `${currentTheme.background}f0`,
        borderColor: `${currentTheme.border}80`,
      }}
    >
      {/* Top Bold Action Banner */}
      <div
        id="top-action-banner"
        className="w-full border-b border-white/10 py-1 px-4 text-center flex items-center justify-center gap-2 relative overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${currentTheme.primary}15, ${currentTheme.accent}25, ${currentTheme.primary}15)`,
        }}
      >
        <span className="text-[11px] sm:text-xs md:text-sm font-black tracking-widest text-white uppercase select-none drop-shadow-sm flex items-center gap-2">
          <span>MIX - CREATE - DOWNLOAD</span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md font-bold text-white relative overflow-hidden"
            style={{
              backgroundColor: currentTheme.primary,
              boxShadow: `0 0 16px ${currentTheme.glow}`,
            }}
          >
            {/* Animated sound wave bars in brand badge */}
            <div className="flex items-end gap-0.5 h-4">
              <span
                className={`w-1 bg-white rounded-full ${activeCount > 0 ? 'animate-bounce' : 'h-2'}`}
                style={{ animationDuration: '0.6s' }}
              />
              <span
                className={`w-1 bg-white rounded-full ${activeCount > 0 ? 'animate-bounce' : 'h-3.5'}`}
                style={{ animationDuration: '0.8s', animationDelay: '0.15s' }}
              />
              <span
                className={`w-1 bg-white rounded-full ${activeCount > 0 ? 'animate-bounce' : 'h-1.5'}`}
                style={{ animationDuration: '0.5s', animationDelay: '0.3s' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Luca Ambience
              </h1>
              {activeCount > 0 && (
                <span
                  id="active-sounds-indicator"
                  className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: currentTheme.badge,
                    color: currentTheme.primary,
                    border: `1px solid ${currentTheme.primary}40`,
                  }}
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>{activeCount} active</span>
                </span>
              )}
            </div>
            <p className="hidden sm:block text-xs text-slate-400 font-normal">
              Build your perfect atmosphere.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Visual Effects Toggle */}
          <button
            type="button"
            id="toggle-visual-effects-btn"
            onClick={onToggleVisualEffects}
            title={visualEffectsEnabled ? 'Disable ambient particle atmosphere' : 'Enable ambient particle atmosphere'}
            aria-label="Toggle ambient visual effects"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-slate-800"
          >
            {visualEffectsEnabled ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Presets Modal Button */}
          <button
            type="button"
            id="presets-trigger-btn"
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm"
          >
            <BookmarkCheck className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
            <span className="hidden sm:inline">Presets</span>
          </button>

          {/* Download Mix Button */}
          {onOpenDownloadMix && (
            <button
              type="button"
              id="header-download-mix-btn"
              onClick={onOpenDownloadMix}
              disabled={activeCount === 0}
              title={activeCount > 0 ? 'Download active atmosphere mix (.mp3, .wav, .webm, or preset)' : 'Turn on sounds to download mix'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                activeCount > 0
                  ? 'text-sky-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border-sky-500/40 hover:border-sky-400/80 shadow-sky-900/20'
                  : 'text-slate-600 border-slate-800/40 opacity-40 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Download Mix</span>
            </button>
          )}

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="theme-selector-btn"
              onClick={() => setThemeDropdownOpen((prev) => !prev)}
              aria-expanded={themeDropdownOpen}
              aria-label="Change atmospheric scenario"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
              <div className="hidden sm:flex items-center -space-x-1 mr-0.5">
                {currentTheme.colorMix.slice(0, 3).map((hex, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-black/50 shadow-sm"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <span className="hidden md:inline">{currentTheme.name}</span>
            </button>

            {themeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setThemeDropdownOpen(false)}
                />
                <div
                  id="theme-dropdown-menu"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/98 border border-slate-700/90 shadow-2xl p-2.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
                >
                  <div className="px-2.5 py-2 border-b border-slate-800/80 mb-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white tracking-tight">
                        Atmospheric Scenarios
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Dynamic multi-color ambient soundscapes
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                      {themes.length} Scenarios
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {themes.map((th) => {
                      const isSelected = th.id === currentTheme.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          id={`scenario-theme-${th.id}`}
                          onClick={() => {
                            onSelectTheme(th.id);
                            setThemeDropdownOpen(false);
                          }}
                          className={`w-full flex flex-col gap-1.5 p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-white/10 border-white/20 shadow-md ring-1'
                              : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5 hover:border-slate-800'
                          }`}
                          style={
                            isSelected
                              ? {
                                  borderColor: `${th.primary}66`,
                                  boxShadow: `0 0 15px ${th.glow}`,
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-xs sm:text-sm">
                                {th.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400">
                                {th.scenario}
                              </span>
                            </div>

                            {isSelected && (
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md text-white shadow-sm"
                                style={{ backgroundColor: th.primary }}
                              >
                                Active
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-1">
                            {th.description}
                          </p>

                          {/* Mixture of Colors display */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <span className="text-[10px] text-slate-400 font-medium">
                              Color Mixture:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {th.palette.map((color, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 group/color"
                                  title={`${color.name} (${color.hex})`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm transition-transform group-hover/color:scale-125"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <span className="hidden lg:inline text-[10px] text-slate-400 group-hover/color:text-slate-200">
                                    {color.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reset All Sounds Button */}
          <button
            type="button"
            id="header-reset-all-btn"
            onClick={onResetAll}
            disabled={activeCount === 0}
            title="Mute & turn off all playing sounds"
            aria-label="Reset all playing sounds"
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeCount > 0
                ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-red-500/20 hover:border-red-500/40 border-slate-700/60'
                : 'text-slate-600 border-transparent opacity-40 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
