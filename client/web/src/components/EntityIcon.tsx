import { ENTITY_STYLE } from '../lib/entityStyle';
import type { EntityType } from '../types';

interface EntityIconProps {
  type: EntityType;
  className?: string;
}

export default function EntityIcon({ type, className = '' }: EntityIconProps) {
  const style = ENTITY_STYLE[type];
  if (!style) return null;
  const Icon = style.icon;

  return <Icon className={`${style.color} ${className}`} />;
}


