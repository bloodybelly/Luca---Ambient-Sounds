import { Preset } from '../types';

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    description: 'Immersive flow state with rainfall, coding rhythm, and brown noise.',
    icon: 'Brain',
    soundVolumes: {
      rain: 45,
      brown_noise: 30,
      keyboard: 20,
    },
  },
  {
    id: 'cozy_evening',
    name: 'Cozy Evening',
    description: 'Warm hearth logs snapping alongside gentle rain and retro vinyl.',
    icon: 'Flame',
    soundVolumes: {
      fireplace: 65,
      rain: 35,
      vinyl: 20,
    },
  },
  {
    id: 'forest_escape',
    name: 'Forest Escape',
    description: 'Crisp mountain canopy with morning songbirds and a bubbling brook.',
    icon: 'Trees',
    soundVolumes: {
      forest: 60,
      birds: 40,
      river: 35,
    },
  },
  {
    id: 'ocean_sleep',
    name: 'Ocean Sleep',
    description: 'Heavy rolling surf with coastal night breeze and meadow crickets.',
    icon: 'Moon',
    soundVolumes: {
      ocean_waves: 70,
      wind: 20,
      crickets: 15,
    },
  },
  {
    id: 'cafe_study',
    name: 'Cafe Study',
    description: 'Espresso buzz, keyboard clicks, and raindrops on window glass.',
    icon: 'Coffee',
    soundVolumes: {
      coffee_shop: 55,
      rain: 25,
      keyboard: 20,
    },
  },
  {
    id: 'night_cabin',
    name: 'Night Cabin',
    description: 'Heavy rain patter on the tin roof with a crackling fire and nocturnal trees.',
    icon: 'Home',
    soundVolumes: {
      deep_rain: 50,
      fireplace: 50,
      night_forest: 25,
    },
  },
  {
    id: 'space_odyssey',
    name: 'Orbital Voyage',
    description: 'Deep cosmic reactor hums with soothing static drift.',
    icon: 'Orbit',
    soundVolumes: {
      space_station: 60,
      white_noise: 20,
      wind: 15,
    },
  },
  {
    id: 'flight_altitude',
    name: 'In-Flight Cabin',
    description: 'Calming twin-jet cruising drone with gentle high-altitude air rush.',
    icon: 'Plane',
    soundVolumes: {
      aeroplane: 60,
      fan: 25,
    },
  },
  {
    id: 'purr_comfort',
    name: 'Cat & Fireside',
    description: 'Contented feline purring with cozy hearth crackle and gentle rain.',
    icon: 'Cat',
    soundVolumes: {
      cat_purr: 65,
      fireplace: 45,
      rain: 25,
    },
  },
  {
    id: 'horror_night',
    name: 'Zombie Outbreak',
    description: 'Eerie haunted spires with approaching zombie snarls and storm thunder.',
    icon: 'Skull',
    soundVolumes: {
      zombie: 50,
      haunted: 40,
      thunder: 35,
    },
  },
];
