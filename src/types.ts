export type SoundCategory =
  | 'nature'
  | 'animals'
  | 'people'
  | 'transport'
  | 'cozy'
  | 'city'
  | 'focus'
  | 'sleep'
  | 'fun';

export type SoundGeneratorType =
  | 'rain'
  | 'thunder'
  | 'ocean'
  | 'river'
  | 'forest'
  | 'wind'
  | 'birds'
  | 'campfire'
  | 'waterfall'
  | 'coffee_shop'
  | 'fireplace'
  | 'library'
  | 'cozy_room'
  | 'vinyl'
  | 'fan'
  | 'tea_room'
  | 'city_street'
  | 'traffic'
  | 'subway'
  | 'train'
  | 'airport'
  | 'cafe'
  | 'keyboard'
  | 'office'
  | 'white_noise'
  | 'brown_noise'
  | 'ac'
  | 'study_room'
  | 'typing'
  | 'deep_rain'
  | 'night_forest'
  | 'crickets'
  | 'waves'
  | 'soft_wind'
  | 'chimes'
  | 'night_ambience'
  | 'carnival'
  | 'arcade'
  | 'construction'
  | 'stadium'
  | 'space_station'
  | 'haunted'
  | 'people_talking'
  | 'fight'
  | 'zombie'
  | 'laugh'
  | 'cry'
  | 'aeroplane'
  | 'helicopter'
  | 'cat'
  | 'dog'
  | 'wolf'
  | 'owl'
  | 'frog'
  | 'horse'
  | 'whale';

export interface SoundItem {
  id: string;
  name: string;
  category: SoundCategory;
  description: string;
  iconName: string; // Lucide icon identifier
  defaultVolume: number;
  color: string;
  generatorType: SoundGeneratorType;
  audioPath: string;
}

export interface SoundState {
  playing: boolean;
  volume: number; // 0 to 100
  muted: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  icon?: string;
  soundVolumes: Record<string, number>; // soundId -> volume (0-100)
}

export type ThemeId =
  | 'midnight'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'crimson'
  | 'lavender'
  | 'coffee'
  | 'arctic'
  | 'neon';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  background: string;
  bgGradient: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  border: string;
  borderActive: string;
  primary: string;
  primaryHover: string;
  accent: string;
  text: string;
  muted: string;
  glow: string;
  badge: string;
  tag: string;
}
