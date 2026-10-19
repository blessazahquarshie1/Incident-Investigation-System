import type {
  InvestigationData,
  Case,
  Person,
  Evidence,
  ActivityLogEntry,
} from '../types'
import { getCasePeople, getCaseEvidence, getCaseActivity } from './caseScope'
import { buildTimeline, type TimelineEvent } from './timeline'
import { detectTimelineConflicts, type TimelineConflict } from './conflicts'
import { calculateConnection, describeScore, type PairConnection } from './connections'
import { deriveStatus, getCurrentHolderId } from './custody'
import { getOfficerName, getPersonName } from './lookup'

export interface ReportPersonGroup {
  type: Person['type']
  label: string
  people: Person[]
}

export interface ReportEvidenceItem {
  id: string
  title: string
  type: Evidence['type']
  description: string
  status: Evidence['status']
  holderId: string
  holderName: string
  collectedAt: string
  collectedBy: string
}

export interface ReportConnectionItem {
  pair: PairConnection
  personAName: string
  personBName: string
  breakdown: string[]
}

export interface CaseReport {
  caseRecord: Case
  leadInvestigatorName: string
  peopleGroups: ReportPersonGroup[]
  evidenceItems: ReportEvidenceItem[]
  timelineEvents: TimelineEvent[]
  conflicts: TimelineConflict[]
  topConnections: ReportConnectionItem[]
  recentActivity: ActivityLogEntry[]
}

/**
 * Compiles a comprehensive investigative case report document.
 * 
 * Plain-English concept:
 * A case report is the investigative equivalent of an executive summary.
 * It synthesizes records that normally live across multiple tabs into one cohesive,
 * printable dossier: who is involved, what evidence was seized, what happened when,
 * what contradicts itself, and how the prime suspects are connected.
 * 
 * This function does not invent new business logic; it acts as an aggregator,
 * orchestrating the pure functions created in earlier steps.
 */
export function buildCaseReport(
  data: InvestigationData,
  caseId: string
): CaseReport | null {
  const caseRecord = data.cases.find(c => c.id === caseId)
  if (!caseRecord) {
    return null
  }

  // 1. Header info
  const leadInvestigatorName = getOfficerName(data, caseRecord.leadInvestigator)

  // 2. People grouped by role
  const casePeople = getCasePeople(data, caseId)
  const roleTypes: Array<{ type: Person['type']; label: string }> = [
    { type: 'suspect', label: 'Suspects' },
    { type: 'person-of-interest', label: 'Persons of Interest' },
    { type: 'witness', label: 'Witnesses' },
    { type: 'victim', label: 'Victims' },
  ]
  const peopleGroups: ReportPersonGroup[] = roleTypes
    .map(role => ({
      type: role.type,
      label: role.label,
      people: casePeople.filter(p => p.type === role.type),
    }))
    .filter(group => group.people.length > 0)

  // 3. Evidence with live custody status and custodian
  const caseEvidence = getCaseEvidence(data, caseId)
  const evidenceItems: ReportEvidenceItem[] = caseEvidence.map(ev => {
    const holderId = getCurrentHolderId(ev)
    return {
      id: ev.id,
      title: ev.title,
      type: ev.type,
      description: ev.description,
      status: deriveStatus(ev.custodyHistory),
      holderId,
      holderName: getOfficerName(data, holderId),
      collectedAt: ev.collectedAt,
      collectedBy: getOfficerName(data, ev.collectedBy),
    }
  })

  // 4. Key timeline events
  const timelineEvents = buildTimeline(data, caseId)

  // 5. Timeline conflicts
  const conflicts = detectTimelineConflicts(data, caseId)

  // 6. Strongest connections (top 5 pairs within case)
  const pairs: ReportConnectionItem[] = []
  for (let i = 0; i < casePeople.length; i++) {
    for (let j = i + 1; j < casePeople.length; j++) {
      const pA = casePeople[i]
      const pB = casePeople[j]
      const connection = calculateConnection(data, pA.id, pB.id)
      if (connection.score > 0) {
        pairs.push({
          pair: connection,
          personAName: getPersonName(data, pA.id),
          personBName: getPersonName(data, pB.id),
          breakdown: describeScore(connection),
        })
      }
    }
  }
  pairs.sort((a, b) => b.pair.score - a.pair.score)
  const topConnections = pairs.slice(0, 5)

  // 7. Activity summary (10 newest entries)
  const recentActivity = getCaseActivity(data, caseId).slice(0, 10)

  return {
    caseRecord,
    leadInvestigatorName,
    peopleGroups,
    evidenceItems,
    timelineEvents,
    conflicts,
    topConnections,
    recentActivity,
  }
}

