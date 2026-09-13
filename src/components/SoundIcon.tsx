import React from 'react';
import {
  CloudRain,
  CloudLightning,
  Waves,
  Droplets,
  Trees,
  Wind,
  Feather,
  Flame,
  FlameKindling,
  Coffee,
  BookOpen,
  Disc,
  Fan,
  CupSoda,
  Building2,
  Car,
  TrainTrack,
  Train,
  Plane,
  Keyboard,
  Activity,
  Radio,
  Briefcase,
  AirVent,
  PenTool,
  CloudRainWind,
  Moon,
  Bug,
  Waves as WavesLadder,
  BellRing,
  Orbit,
  Gamepad2,
  Tent,
  Hammer,
  Users,
  Ghost,
  Volume2,
  MessageSquare,
  Swords,
  Skull,
  Laugh,
  Frown,
  Cat,
  Dog,
  Eye,
  Fish,
  Compass,
} from 'lucide-react';

interface SoundIconProps {
  name: string;
  className?: string;
  isActive?: boolean;
  color?: string;
}

export const SoundIcon: React.FC<SoundIconProps> = ({ name, className = 'w-7 h-7', isActive = false, color }) => {
  const iconProps = {
    className: `${className} transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100 opacity-80'}`,
    style: color && isActive ? { color } : undefined,
  };

  switch (name) {
    case 'CloudRain':
      return <CloudRain {...iconProps} />;
    case 'CloudLightning':
      return <CloudLightning {...iconProps} />;
    case 'Waves':
      return <Waves {...iconProps} />;
    case 'Droplets':
      return <Droplets {...iconProps} />;
    case 'Trees':
      return <Trees {...iconProps} />;
    case 'Wind':
      return <Wind {...iconProps} />;
    case 'Feather':
      return <Feather {...iconProps} />;
    case 'Flame':
      return <Flame {...iconProps} />;
    case 'FlameKindling':
      return <FlameKindling {...iconProps} />;
    case 'Coffee':
      return <Coffee {...iconProps} />;
    case 'BookOpen':
      return <BookOpen {...iconProps} />;
    case 'Disc':
      return <Disc {...iconProps} className={`${iconProps.className} ${isActive ? 'animate-spin' : ''}`} style={{ ...iconProps.style, animationDuration: '4s' }} />;
    case 'Fan':
      return <Fan {...iconProps} className={`${iconProps.className} ${isActive ? 'animate-spin' : ''}`} style={{ ...iconProps.style, animationDuration: '2.5s' }} />;
    case 'CupSoda':
      return <CupSoda {...iconProps} />;
    case 'Building2':
      return <Building2 {...iconProps} />;
    case 'Car':
      return <Car {...iconProps} />;
    case 'TrainTrack':
      return <TrainTrack {...iconProps} />;
    case 'Train':
      return <Train {...iconProps} />;
    case 'Plane':
      return <Plane {...iconProps} />;
    case 'Keyboard':
      return <Keyboard {...iconProps} />;
    case 'Activity':
      return <Activity {...iconProps} />;
    case 'Radio':
      return <Radio {...iconProps} />;
    case 'Briefcase':
      return <Briefcase {...iconProps} />;
    case 'AirVent':
      return <AirVent {...iconProps} />;
    case 'PenTool':
      return <PenTool {...iconProps} />;
    case 'CloudRainWind':
      return <CloudRainWind {...iconProps} />;
    case 'Moon':
      return <Moon {...iconProps} />;
    case 'Bug':
      return <Bug {...iconProps} />;
    case 'WavesLadder':
      return <WavesLadder {...iconProps} />;
    case 'BellRing':
      return <BellRing {...iconProps} />;
    case 'Orbit':
      return <Orbit {...iconProps} className={`${iconProps.className} ${isActive ? 'animate-spin' : ''}`} style={{ ...iconProps.style, animationDuration: '8s' }} />;
    case 'Gamepad2':
      return <Gamepad2 {...iconProps} />;
    case 'Tent':
      return <Tent {...iconProps} />;
    case 'Hammer':
      return <Hammer {...iconProps} />;
    case 'Users':
      return <Users {...iconProps} />;
    case 'Ghost':
      return <Ghost {...iconProps} />;
    case 'MessageSquare':
      return <MessageSquare {...iconProps} />;
    case 'Swords':
      return <Swords {...iconProps} />;
    case 'Skull':
      return <Skull {...iconProps} />;
    case 'Laugh':
      return <Laugh {...iconProps} />;
    case 'Frown':
      return <Frown {...iconProps} />;
    case 'Cat':
      return <Cat {...iconProps} />;
    case 'Dog':
      return <Dog {...iconProps} />;
    case 'Eye':
      return <Eye {...iconProps} />;
    case 'Fish':
      return <Fish {...iconProps} />;
    case 'Compass':
      return <Compass {...iconProps} />;
    default:
      return <Volume2 {...iconProps} />;
  }
};
