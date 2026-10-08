import { Users, AlertTriangle, Car, FileSearch, MapPin } from 'lucide-react'

// Local type for Step 01, will be removed in Step 02 when imported from '../types'
import type { EntityType } from '../types';

export const ENTITY_STYLE: Record<EntityType, { color: string; bgColor: string; icon: React.FC<{className?: string}>; label: string }> = {
  person: { color: 'text-violet-700', bgColor: 'bg-violet-100', icon: Users, label: 'Person' },
  incident: { color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertTriangle, label: 'Incident' },
  vehicle: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Car, label: 'Vehicle' },
  evidence: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: FileSearch, label: 'Evidence' },
  location: { color: 'text-rose-700', bgColor: 'bg-rose-100', icon: MapPin, label: 'Location' },
}

