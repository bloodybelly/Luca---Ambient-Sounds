import React, { useState, useMemo, useEffect } from 'react';
import { SOUND_LIBRARY } from './data/sounds';
import { THEMES } from './data/themes';
import { DEFAULT_PRESETS } from './data/presets';
import { ThemeId, Preset, SoundState } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAudioMixer } from './hooks/useAudioMixer';

import { Header } from './components/Header';
import { MasterMixer } from './components/MasterMixer';
import { CategoryFilter } from './components/CategoryFilter';
import { SoundCard } from './components/SoundCard';
import { PresetModal } from './components/PresetModal';
import { MiniPlayer } from './components/MiniPlayer';
import { VisualAtmosphere } from './components/VisualAtmosphere';
import { EmptyState } from './components/EmptyState';
import { DeveloperFooter } from './components/DeveloperFooter';
import { DownloadMixModal } from './components/DownloadMixModal';

export default function App() {
  // Theme state
  const [selectedThemeId, setSelectedThemeId] = useLocalStorage<ThemeId>('luca_theme', 'midnight');
  const currentTheme = useMemo(() => {
    return THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];
  }, [selectedThemeId]);

  // Visual effects toggle
  const [visualEffectsEnabled, setVisualEffectsEnabled] = useLocalStorage<boolean>('luca_vfx', true);

  // Favorites state
  const [favorites, setFavorites] = useLocalStorage<string[]>('luca_favorites', [
    'rain',
    'fireplace',
    'ocean_waves',
    'keyboard',
  ]);

  // Custom presets
  const [customPresets, setCustomPresets] = useLocalStorage<Preset[]>('luca_custom_presets', []);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);

  // Modals
  const [presetModalOpen, setPresetModalOpen] = useState<boolean>(false);
  const [downloadMixModalOpen, setDownloadMixModalOpen] = useState<boolean>(false);

  // Audio Mixer Engine
  const {
    soundStates,
    masterVolume,
    masterMuted,
    activeSoundsCount,
    activeSoundIds,
    toggleSound,
    setSoundVolume,
    toggleSoundMute,
    setMasterVolume,
    toggleMasterMute,
    resetAll,
    loadPreset,
    randomizeSounds,
    applyCustomMix,
  } = useAudioMixer();

  // Toggle favorite
  const handleToggleFavorite = (soundId: string) => {
    setFavorites((prev) => {
      if (prev.includes(soundId)) {
        return prev.filter((id) => id !== soundId);
      } else {
        return [...prev, soundId];
      }
    });
  };

  // Save new custom preset
  const handleSaveCustomPreset = (name: string) => {
    const soundVolumes: Record<string, number> = {};
    (Object.entries(soundStates) as [string, SoundState][]).forEach(([id, state]) => {
      if (state.playing) {
        soundVolumes[id] = state.volume;
      }
    });

    const newPreset: Preset = {
      id: `custom_${Date.now()}`,
      name,
      description: `Custom blend of ${Object.keys(soundVolumes).length} sounds`,
      isCustom: true,
      soundVolumes,
    };

    setCustomPresets((prev) => [newPreset, ...prev]);
  };

  // Delete custom preset
  const handleDeleteCustomPreset = (presetId: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  // Filtered sounds list
  const filteredSounds = useMemo(() => {
    return SOUND_LIBRARY.filter((sound) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = sound.name.toLowerCase().includes(query);
        const matchesDesc = sound.description.toLowerCase().includes(query);
        const matchesCat = sound.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // Favorites filter
      if (showOnlyFavorites) {
        if (!favorites.includes(sound.id)) {
          return false;
        }
      }

      // Active only filter
      if (showOnlyActive) {
        if (!soundStates[sound.id]?.playing) {
          return false;
        }
      }

      // Category filter
      if (!showOnlyFavorites && selectedCategory !== 'all') {
        if (sound.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, showOnlyFavorites, showOnlyActive, selectedCategory, favorites, soundStates]);

  // Set CSS variables on body for theme styling
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg', currentTheme.background);
    root.style.setProperty('--theme-surface', currentTheme.surface);
    root.style.setProperty('--theme-surface-active', currentTheme.surfaceActive);
    root.style.setProperty('--theme-border', currentTheme.border);
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-accent', currentTheme.accent);
    root.style.setProperty('--theme-glow', currentTheme.glow);
  }, [currentTheme]);

  return (
    <div
      id="luca-ambience-app"
      className="min-h-screen relative flex flex-col text-slate-100 selection:bg-purple-500/30 selection:text-purple-200 transition-colors duration-500 pb-28 sm:pb-24 font-sans"
      style={{
        backgroundColor: currentTheme.background,
        backgroundImage: currentTheme.bgGradient,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
      }}
    >
      {/* Visual Ambient Atmosphere Background Canvas */}
      <VisualAtmosphere
        themeId={currentTheme.id}
        currentTheme={currentTheme}
        enabled={visualEffectsEnabled}
        activeCount={activeSoundsCount}
      />

      {/* Main Header */}
      <Header
        currentTheme={currentTheme}
        themes={THEMES}
        onSelectTheme={setSelectedThemeId}
        activeCount={activeSoundsCount}
        onResetAll={resetAll}
        onOpenPresets={() => setPresetModalOpen(true)}
        onOpenDownloadMix={() => setDownloadMixModalOpen(true)}
        visualEffectsEnabled={visualEffectsEnabled}
        onToggleVisualEffects={() => setVisualEffectsEnabled(!visualEffectsEnabled)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 flex flex-col gap-6 z-10">
        {/* Master Mixer Top Controls */}
        <MasterMixer
          masterVolume={masterVolume}
          masterMuted={masterMuted}
          activeCount={activeSoundsCount}
          onMasterVolumeChange={setMasterVolume}
          onToggleMasterMute={toggleMasterMute}
          onResetAll={resetAll}
          onRandomize={randomizeSounds}
          onOpenDownloadMix={() => setDownloadMixModalOpen(true)}
          accentColor={currentTheme.primary}
          currentTheme={currentTheme}
        />

        {/* Empty State Banner (Shown when 0 sounds are active) */}
        {activeSoundsCount === 0 && (
          <EmptyState
            onQuickStartSound={(id) => toggleSound(id)}
            accentColor={currentTheme.primary}
          />
        )}

        {/* Category & Search Navigation */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          favoritesCount={favorites.length}
          showOnlyFavorites={showOnlyFavorites}
          onToggleShowFavorites={() => setShowOnlyFavorites((prev) => !prev)}
          showOnlyActive={showOnlyActive}
          onToggleShowActive={() => setShowOnlyActive((prev) => !prev)}
          activeCount={activeSoundsCount}
          accentColor={currentTheme.primary}
          currentTheme={currentTheme}
        />

        {/* Sounds Grid */}
        {filteredSounds.length > 0 ? (
          <div
            id="sound-cards-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
          >
            {filteredSounds.map((sound) => {
              const state = soundStates[sound.id] || {
                playing: false,
                volume: sound.defaultVolume,
                muted: false,
              };
              const isFav = favorites.includes(sound.id);

              return (
                <SoundCard
                  key={sound.id}
                  sound={sound}
                  state={state}
                  isFavorite={isFav}
                  onTogglePlay={toggleSound}
                  onVolumeChange={setSoundVolume}
                  onToggleMute={toggleSoundMute}
                  onToggleFavorite={handleToggleFavorite}
                  accentColor={currentTheme.primary}
                  currentTheme={currentTheme}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 bg-slate-900/30 rounded-3xl border border-slate-800">
            <p className="text-sm font-medium">No sounds found matching your filter criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowOnlyFavorites(false);
                setShowOnlyActive(false);
                setSelectedCategory('all');
              }}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* App Footer */}
        <DeveloperFooter
          currentTheme={currentTheme}
        />
      </main>

      {/* Presets Modal */}
      <PresetModal
        isOpen={presetModalOpen}
        onClose={() => setPresetModalOpen(false)}
        onLoadPreset={loadPreset}
        soundStates={soundStates}
        customPresets={customPresets}
        onSaveCustomPreset={handleSaveCustomPreset}
        onDeleteCustomPreset={handleDeleteCustomPreset}
        accentColor={currentTheme.primary}
      />

      {/* Sticky Bottom Mini Player */}
      <MiniPlayer
        activeSoundsCount={activeSoundsCount}
        activeSoundIds={activeSoundIds}
        soundStates={soundStates}
        masterVolume={masterVolume}
        masterMuted={masterMuted}
        onMasterVolumeChange={setMasterVolume}
        onToggleMasterMute={toggleMasterMute}
        onVolumeChange={setSoundVolume}
        onTogglePlay={toggleSound}
        onResetAll={resetAll}
        onOpenDownloadMix={() => setDownloadMixModalOpen(true)}
        accentColor={currentTheme.primary}
      />

      {/* Download Mix Modal */}
      <DownloadMixModal
        isOpen={downloadMixModalOpen}
        onClose={() => setDownloadMixModalOpen(false)}
        soundStates={soundStates}
        masterVolume={masterVolume}
        currentTheme={currentTheme}
        onApplyCustomMix={applyCustomMix}
        onSelectTheme={setSelectedThemeId}
      />
    </div>
  );
}
