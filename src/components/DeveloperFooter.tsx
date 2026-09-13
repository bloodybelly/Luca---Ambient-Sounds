import React from 'react';
import { Linkedin, ExternalLink, Sparkles, Heart, ArrowUp, Music2, Coffee } from 'lucide-react';
import { ThemeConfig } from '../types';

interface DeveloperFooterProps {
  currentTheme: ThemeConfig;
  onOpenBuyCoffee?: () => void;
}

export const DeveloperFooter: React.FC<DeveloperFooterProps> = ({
  currentTheme,
  onOpenBuyCoffee,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="developer-footer"
      className="w-full mt-16 pt-10 pb-8 border-t transition-colors duration-500"
      style={{
        borderColor: `${currentTheme.border}`,
        backgroundColor: `${currentTheme.surface}80`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Developer Identity Card */}
        <div className="flex items-center gap-4 text-left">
          {/* Avatar with Initials & Theme Ring */}
          <div className="relative group">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colorMix[0]}, ${currentTheme.colorMix[1]})`,
                boxShadow: `0 4px 20px ${currentTheme.glow}`,
              }}
            >
              AR
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 flex items-center justify-center"
              style={{ borderColor: currentTheme.primary }}
              title="Verified Creator"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            </div>
          </div>

          {/* Name & Role */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Created & Developed By
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Archana Raj
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>A CSE Undergrad trying to make your lives easier</span>
            </p>
          </div>
        </div>

        {/* Links & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Buy Me a Coffee Button */}
          {onOpenBuyCoffee && (
            <button
              type="button"
              id="footer-buy-coffee-btn"
              onClick={onOpenBuyCoffee}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-[0.98] cursor-pointer group bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/20"
            >
              <Coffee className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Buy Me a Coffee</span>
            </button>
          )}

          {/* LinkedIn Button */}
          <a
            id="developer-linkedin-link"
            href="https://in.linkedin.com/in/archana-raj-857473300"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-[0.98] cursor-pointer group"
            style={{
              backgroundColor: '#0a66c2',
              boxShadow: '0 4px 14px rgba(10, 102, 194, 0.35)',
            }}
          >
            <Linkedin className="w-4 h-4 fill-current text-white" />
            <span>Connect on LinkedIn</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* Scroll to Top */}
          <button
            type="button"
            id="scroll-to-top-btn"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Top</span>
          </button>
        </div>
      </div>

      {/* Scenario Palette & Signature Footer Note */}
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
          <span>by Archana Raj</span>
        </div>
      </div>
    </footer>
  );
};
