import type { InvestigationData } from '../types'
import { getPersonName, getLocationName } from './lookup'

export interface Lead {
  priority: 'high' | 'medium' | 'low'
  text: string
  entityIds: string[]
}

export type NameMatchKind = 'exact-name' | 'shared-alias' | 'surname-only'

export interface NameMatch {
  personAId: string
  personBId: string
  kind: NameMatchKind
  matchedTerm?: string
}

export interface ComparisonSignals {
  caseAId: string
  caseBId: string
  sharedPersonIds: string[]
  sharedVehicleIds: string[]
  sharedLocationIds: string[]
  sharedPhoneNumbers: string[]
  sharedEvidenceTags: string[]
  nameMatches: NameMatch[]
  similarTimeOfDay: boolean
  sameType: boolean
}

const PRIORITY_ORDER: Record<Lead['priority'], number> = {
  high: 1,
  medium: 2,
  low: 3,
}

/**
 * Generates actionable investigative leads based on cross-case signals that fired.
 * Leads are sorted by priority: high first, then medium, then low.
 */
export function generateLeads(
  data: InvestigationData,
  comparison: ComparisonSignals
): Lead[] {
  const leads: Lead[] = []

  // 1. Shared people (high priority)
  for (const pid of comparison.sharedPersonIds) {
    const name = getPersonName(data, pid)
    leads.push({
      priority: 'high',
      text: `${name} is linked to both cases. Compare his statements and alibi in each.`,
      entityIds: [pid],
    })
  }

  // 2. Shared vehicles (high priority)
  for (const vid of comparison.sharedVehicleIds) {
    const v = data.vehicles.find(veh => veh.id === vid)
    const label = v ? `${v.registration} (${v.make} ${v.model})` : vid
    leads.push({
      priority: 'high',
      text: `Vehicle ${label} appears in both cases. Check where it was seen in each case and who was driving.`,
      entityIds: [vid],
    })
  }

  // 3. Shared phone numbers (high priority)
  for (const phone of comparison.sharedPhoneNumbers) {
    leads.push({
      priority: 'high',
      text: `Phone number ${phone} is used in both cases. Request the call records for both.`,
      entityIds: [],
    })
  }

  // 4. Shared evidence tags (medium priority)
  for (const tag of comparison.sharedEvidenceTags) {
    leads.push({
      priority: 'medium',
      text: `Both cases have evidence tagged '${tag}'. Compare the items side by side.`,
      entityIds: [],
    })
  }

  // 5. Shared locations (medium priority)
  for (const lid of comparison.sharedLocationIds) {
    const locName = getLocationName(data, lid)
    leads.push({
      priority: 'medium',
      text: `Both cases involve ${locName}. Compare CCTV and witness statements from both dates.`,
      entityIds: [lid],
    })
  }

  // 6. Name matches (medium for exact/alias, low for surname)
  for (const nm of comparison.nameMatches) {
    const personA = data.persons.find(p => p.id === nm.personAId)
    const personB = data.persons.find(p => p.id === nm.personBId)
    const nameA = personA?.fullName ?? nm.personAId
    const nameB = personB?.fullName ?? nm.personBId

    if (nm.kind === 'exact-name') {
      leads.push({
        priority: 'medium',
        text: `A person called ${nameA} appears in both cases under different records. Check whether they are the same person.`,
        entityIds: [nm.personAId, nm.personBId],
      })
    } else if (nm.kind === 'shared-alias') {
      const aliasTerm = nm.matchedTerm ?? personA?.knownAliases?.[0] ?? 'alias'
      leads.push({
        priority: 'medium',
        text: `A person with alias '${aliasTerm}' appears in both cases under different records. Check whether they are the same person.`,
        entityIds: [nm.personAId, nm.personBId],
      })
    } else if (nm.kind === 'surname-only') {
      leads.push({
        priority: 'low',
        text: `${nameB} shares a surname with ${nameA} in the other case. This may be a relative or a coincidence.`,
        entityIds: [nm.personAId, nm.personBId],
      })
    }
  }

  // 7. Similar time of day (low priority)
  if (comparison.similarTimeOfDay) {
    leads.push({
      priority: 'low',
      text: `Both incidents happened around the same time of day. Compare the two timelines.`,
      entityIds: [],
    })
  }

  // Sort leads: high -> medium -> low
  return leads.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

