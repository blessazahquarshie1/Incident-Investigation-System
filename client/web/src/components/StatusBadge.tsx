import Badge from './Badge';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // normalize status for display
  const label = status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  let style = 'bg-slate-100 text-slate-600';

  switch (status.toLowerCase()) {
    case 'open':
    case 'collected':
      style = 'bg-teal-100 text-teal-700';
      break;
    case 'investigating':
    case 'under-analysis':
    case 'with-officer':
      style = 'bg-blue-100 text-blue-700';
      break;
    case 'pending':
    case 'in-evidence-room':
      style = 'bg-amber-100 text-amber-700';
      break;
    case 'closed':
    case 'released':
    case 'destroyed':
      style = 'bg-slate-100 text-slate-500';
      break;
    case 'unresolved':
      style = 'bg-orange-100 text-orange-700';
      break;
    case 'resolved':
    case 'analysed':
      style = 'bg-green-100 text-green-700';
      break;
  }

  return <Badge className={style}>{label}</Badge>;
}

