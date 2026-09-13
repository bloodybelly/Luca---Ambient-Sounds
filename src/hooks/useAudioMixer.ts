import { useState, useCallback, useEffect, useRef } from 'react';
import { SOUND_LIBRARY } from '../data/sounds';
import { SoundEngine } from '../audio/SoundEngine';
import { Preset, SoundState } from '../types';

export function useAudioMixer() {
  const engineRef = useRef<SoundEngine | null>(null);

  // Initialize engine on first render
  useEffect(() => {
    engineRef.current = SoundEngine.getInstance();
  }, []);

  // Initialize sound states with defaults
  const [soundStates, setSoundStates] = useState<Record<string, SoundState>>(() => {
    const initial: Record<string, SoundState> = {};
    SOUND_LIBRARY.forEach((sound) => {
      initial[sound.id] = {
        playing: false,
        volume: sound.defaultVolume,
        muted: false,
      };
    });
    return initial;
  });

  const [masterVolume, setMasterVolumeState] = useState<number>(80);
  const [masterMuted, setMasterMuted] = useState<boolean>(false);

  // Toggle single sound on / off
  const toggleSound = useCallback((id: string) => {
    const soundItem = SOUND_LIBRARY.find((s) => s.id === id);
    if (!soundItem) return;

    setSoundStates((prev) => {
      const current = prev[id] || {
        playing: false,
        volume: soundItem.defaultVolume,
        muted: false,
      };
      const nextPlaying = !current.playing;
      const engine = engineRef.current || SoundEngine.getInstance();

      if (nextPlaying) {
        engine.startSound(id, soundItem.audioPath, current.muted ? 0 : current.volume, soundItem.generatorType);
      } else {
        engine.stopSound(id);
      }

      return {
        ...prev,
        [id]: {
          ...current,
          playing: nextPlaying,
        },
      };
    });
  }, []);

  // Adjust volume of a sound (0-100)
  const setSoundVolume = useCallback((id: string, newVolume: number) => {
    const soundItem = SOUND_LIBRARY.find((s) => s.id === id);
    if (!soundItem) return;

    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));

    setSoundStates((prev) => {
      const current = prev[id] || {
        playing: false,
        volume: soundItem.defaultVolume,
        muted: false,
      };

      const engine = engineRef.current || SoundEngine.getInstance();
      if (current.playing && !current.muted) {
        engine.setSoundVolume(id, clamped);
      }

      return {
        ...prev,
        [id]: {
          ...current,
          volume: clamped,
        },
      };
    });
  }, []);

  // Mute / unmute a single sound
  const toggleSoundMute = useCallback((id: string) => {
    setSoundStates((prev) => {
      const current = prev[id];
      if (!current) return prev;

      const nextMuted = !current.muted;
      const engine = engineRef.current || SoundEngine.getInstance();
      if (current.playing) {
        engine.setSoundMute(id, nextMuted);
      }

      return {
        ...prev,
        [id]: {
          ...current,
          muted: nextMuted,
        },
      };
    });
  }, []);

  // Set master volume
  const setMasterVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));
    setMasterVolumeState(clamped);
    const engine = engineRef.current || SoundEngine.getInstance();
    engine.setMasterVolume(clamped);
  }, []);

  // Toggle master mute
  const toggleMasterMute = useCallback(() => {
    setMasterMuted((prev) => {
      const next = !prev;
      const engine = engineRef.current || SoundEngine.getInstance();
      engine.setMasterMute(next);
      return next;
    });
  }, []);

  // Reset all sounds to OFF
  const resetAll = useCallback(() => {
    const engine = engineRef.current || SoundEngine.getInstance();
    engine.stopAll();

    setSoundStates((prev) => {
      const next: Record<string, SoundState> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = {
          ...prev[id],
          playing: false,
          muted: false,
        };
      });
      return next;
    });
  }, []);

  // Load a preset
  const loadPreset = useCallback((preset: Preset) => {
    const engine = engineRef.current || SoundEngine.getInstance();
    engine.stopAll();

    setSoundStates((prev) => {
      const next: Record<string, SoundState> = {};
      // first set all to off
      Object.keys(prev).forEach((id) => {
        next[id] = {
          ...prev[id],
          playing: false,
          muted: false,
        };
      });

      // Now activate preset sounds
      Object.entries(preset.soundVolumes).forEach(([soundId, vol]) => {
        const item = SOUND_LIBRARY.find((s) => s.id === soundId);
        if (item) {
          next[soundId] = {
            playing: true,
            volume: vol,
            muted: false,
          };
          engine.startSound(soundId, item.audioPath, vol, item.generatorType);
        }
      });

      return next;
    });
  }, []);

  // "Surprise Me" / Chaos Mode: pick 3-5 random sounds with pleasant volume ranges
  const randomizeSounds = useCallback(() => {
    const engine = engineRef.current || SoundEngine.getInstance();
    engine.stopAll();

    // Pick 3 to 4 distinct sounds across categories
    const count = 3 + Math.floor(Math.random() * 2); // 3 or 4
    const shuffled = [...SOUND_LIBRARY].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    setSoundStates((prev) => {
      const next: Record<string, SoundState> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = {
          ...prev[id],
          playing: false,
          muted: false,
        };
      });

      selected.forEach((sound) => {
        const randVol = 30 + Math.floor(Math.random() * 45); // 30 - 75%
        next[sound.id] = {
          playing: true,
          volume: randVol,
          muted: false,
        };
        engine.startSound(sound.id, sound.audioPath, randVol, sound.generatorType);
      });

      return next;
    });
  }, []);

  // Pause all playing sounds or Resume all previously playing
  const togglePlayAll = useCallback(() => {
    const engine = engineRef.current || SoundEngine.getInstance();
    const playingIds = (Object.entries(soundStates) as [string, SoundState][])
      .filter(([, state]) => state.playing)
      .map(([id]) => id);

    if (playingIds.length > 0) {
      // Pause all
      engine.stopAll();
      setSoundStates((prev) => {
        const next: Record<string, SoundState> = {};
        Object.keys(prev).forEach((id) => {
          next[id] = {
            ...prev[id],
            playing: false,
          };
        });
        return next;
      });
    }
  }, [soundStates]);

  // Derived states
  const activeSoundIds = (Object.entries(soundStates) as [string, SoundState][])
    .filter(([, state]) => state.playing)
    .map(([id]) => id);

  const activeSoundsCount = activeSoundIds.length;
  const isPlayingAny = activeSoundsCount > 0;

  return {
    soundStates,
    masterVolume,
    masterMuted,
    activeSoundsCount,
    activeSoundIds,
    isPlayingAny,
    toggleSound,
    setSoundVolume,
    toggleSoundMute,
    setMasterVolume,
    toggleMasterMute,
    resetAll,
    loadPreset,
    randomizeSounds,
    togglePlayAll,
  };
}
