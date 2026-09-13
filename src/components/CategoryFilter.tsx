import React from 'react';
import { Search, X, Star, Radio } from 'lucide-react';
import { SOUND_CATEGORIES } from '../data/sounds';
import { ThemeConfig } from '../types';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritesCount: number;
  showOnlyFavorites: boolean;
  onToggleShowFavorites: () => void;
  showOnlyActive: boolean;
  onToggleShowActive: () => void;
  activeCount: number;
  accentColor: string;
  currentTheme?: ThemeConfig;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  favoritesCount,
  showOnlyFavorites,
  onToggleShowFavorites,
  showOnlyActive,
  onToggleShowActive,
  activeCount,
  accentColor,
  currentTheme,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Search Input Bar & Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            id="sound-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sounds (e.g. rain, zombie, airplane, cat)..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors placeholder-slate-400"
            style={{
              backgroundColor: currentTheme ? currentTheme.surface : 'var(--theme-surface)',
              borderColor: currentTheme ? currentTheme.border : 'var(--theme-border)',
              color: currentTheme ? currentTheme.text : '#fff',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Badges (Favorites & Active Only) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Favorites Filter */}
          <button
            type="button"
            id="filter-favorites-btn"
            onClick={onToggleShowFavorites}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showOnlyFavorites
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            style={{
              backgroundColor: showOnlyFavorites ? undefined : (currentTheme ? currentTheme.surface : 'var(--theme-surface)'),
              borderColor: showOnlyFavorites ? undefined : (currentTheme ? currentTheme.border : 'var(--theme-border)'),
            }}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Active Sounds Only */}
          <button
            type="button"
            id="filter-active-btn"
            onClick={onToggleShowActive}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showOnlyActive
                ? 'text-white border-transparent shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            style={{
              backgroundColor: showOnlyActive ? accentColor : (currentTheme ? currentTheme.surface : 'var(--theme-surface)'),
              borderColor: showOnlyActive ? undefined : (currentTheme ? currentTheme.border : 'var(--theme-border)'),
            }}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Active Only</span>
            {activeCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        {SOUND_CATEGORIES.map((cat) => {
          const isSelected = !showOnlyFavorites && selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              id={`category-pill-${cat.id}`}
              onClick={() => {
                if (showOnlyFavorites) onToggleShowFavorites();
                onSelectCategory(cat.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                isSelected
                  ? 'text-white border-transparent shadow-sm font-bold scale-[1.02]'
                  : 'text-slate-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isSelected ? accentColor : (currentTheme ? currentTheme.surface : 'var(--theme-surface)'),
                borderColor: isSelected ? undefined : (currentTheme ? currentTheme.border : 'var(--theme-border)'),
                boxShadow: isSelected ? `0 2px 10px ${accentColor}40` : undefined,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
