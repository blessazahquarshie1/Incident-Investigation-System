import Badge from './Badge';
import { ENTITY_STYLE } from '../lib/entityStyle';
import type { EntityType } from '../types';

interface EntityTypeBadgeProps {
  type: string;
}

export default function EntityTypeBadge({ type }: EntityTypeBadgeProps) {
  const entityType = type as EntityType;
  const style = ENTITY_STYLE[entityType];

  if (!style) {
    return <Badge className="bg-slate-100 text-slate-600">{type}</Badge>;
  }

  return <Badge className={`${style.bgColor} ${style.color}`}>{style.label}</Badge>;
}


