import React from 'react';
import { Headphones, Sparkles, Heart, ArrowUp, Music2 } from 'lucide-react';
import { ThemeConfig } from '../types';

interface DeveloperFooterProps {
  currentTheme: ThemeConfig;
}

export const DeveloperFooter: React.FC<DeveloperFooterProps> = ({
  currentTheme,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="app-footer"
      className="w-full mt-16 pt-10 pb-8 border-t transition-colors duration-500"
      style={{
        borderColor: `${currentTheme.border}`,
        backgroundColor: `${currentTheme.surface}80`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand Identity Card */}
        <div className="flex items-center gap-4 text-left">
          {/* Ambient Icon with Theme Ring */}
          <div className="relative group">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colorMix[0]}, ${currentTheme.colorMix[1]})`,
                boxShadow: `0 4px 20px ${currentTheme.glow}`,
              }}
            >
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 flex items-center justify-center"
              style={{ borderColor: currentTheme.primary }}
              title="Acoustic Atmosphere"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            </div>
          </div>

          {/* App Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Acoustic Atmosphere Builder
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Luca Ambience
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Craft your ideal soundscape for deep focus, sleep, and relaxation</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Scroll to Top */}
          <button
            type="button"
            id="scroll-to-top-btn"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to Top</span>
          </button>
        </div>
      </div>

      {/* Scenario Palette & Ambient Note */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <Music2 className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
          <span>Atmospheric Web Audio Engine • Real-time Procedural Synthesizers</span>
        </div>

        {/* Current Active Scenario Color Mixture */}
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
          <span className="text-[11px] text-slate-400">Current Atmosphere:</span>
          <span className="text-[11px] font-semibold text-slate-200">{currentTheme.name}</span>
          <div className="flex items-center -space-x-1 ml-1">
            {currentTheme.colorMix.map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
                style={{ backgroundColor: c }}
                title={currentTheme.palette[i]?.name || c}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline mx-0.5" />
          <span>for peaceful spaces</span>
        </div>
      </div>
    </footer>
  );
};
