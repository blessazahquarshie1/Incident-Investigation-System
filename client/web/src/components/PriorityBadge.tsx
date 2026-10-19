import Badge from './Badge';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return <Badge className={styles[priority]}>{label}</Badge>;
}

