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
} from 'lucide-react';
import { ThemeConfig, ThemeId } from '../types';

interface HeaderProps {
  currentTheme: ThemeConfig;
  themes: ThemeConfig[];
  onSelectTheme: (id: ThemeId) => void;
  activeCount: number;
  onResetAll: () => void;
  onOpenPresets: () => void;
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
  visualEffectsEnabled,
  onToggleVisualEffects,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = React.useState(false);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors duration-300"
      style={{
        backgroundColor: `${currentTheme.background}e6`,
        borderColor: `${currentTheme.border}80`,
      }}
    >
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

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="theme-selector-btn"
              onClick={() => setThemeDropdownOpen((prev) => !prev)}
              aria-expanded={themeDropdownOpen}
              aria-label="Change color theme"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
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
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2.5 py-1.5 text-xs font-medium text-slate-400 border-b border-slate-800/80 mb-1">
                    Visual Themes
                  </div>
                  <div className="space-y-1">
                    {themes.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          onSelectTheme(th.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          th.id === currentTheme.id
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: th.primary }}
                          />
                          <span>{th.name}</span>
                        </div>
                        {th.id === currentTheme.id && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: th.primary }} />
                        )}
                      </button>
                    ))}
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
