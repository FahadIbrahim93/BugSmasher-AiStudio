import { Trophy, Target, Skull, Star, Shield, Award, Zap, HeartOff, Crosshair, Flame, Hammer, Sparkles } from 'lucide-react';
import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ className?: string }>;

// Maps the icon keys used in ACHIEVEMENTS_DATA to lucide-react components.
const ACHIEVEMENT_ICONS: Record<string, IconComponent> = {
  target: Target,
  skull: Skull,
  star: Star,
  shield: Shield,
  award: Award,
  zap: Zap,
  'heart-off': HeartOff,
  aim: Crosshair,
  flame: Flame,
  hammer: Hammer,
  sparkles: Sparkles,
};

export function AchievementIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ACHIEVEMENT_ICONS[icon] || Trophy;
  return <Icon className={className} aria-hidden="true" />;
}
