import type { InvestigationData } from '../types'

export type TimelineSource =
  | 'evidence' | 'incident' | 'location' | 'witness-statement' | 'vehicle-sighting' | 'phone-record'

export interface TimelineEvent {
  id: string           // e.g. 'evt-WS-001'
  timestamp: string    // ISO
  source: TimelineSource
  title: string
  description: string
  caseId: string
  locationId?: string
  personIds: string[]
  vehicleId?: string
  sourceRecordId: string
}

export function buildTimeline(data: InvestigationData, caseId?: string): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Filter helper
  const inCase = (c: string) => !caseId || c === caseId

  // Evidence: collectedAt
  for (const ev of data.evidence) {
    if (!inCase(ev.caseId)) continue
    events.push({
      id: `evt-${ev.id}`,
      timestamp: ev.collectedAt,
      source: 'evidence',
      title: `Evidence collected: ${ev.title}`,
      description: ev.description,
      caseId: ev.caseId,
      locationId: ev.locationId,
      personIds: ev.linkedPersons,
      sourceRecordId: ev.id,
    })
  }

  // Incidents: occurredAt
  for (const inc of data.incidents) {
    if (!inCase(inc.caseId)) continue
    events.push({
      id: `evt-${inc.id}`,
      timestamp: inc.occurredAt,
      source: 'incident',
      title: `Incident occurred: ${inc.title}`,
      description: inc.description,
      caseId: inc.caseId,
      locationId: inc.locationId,
      personIds: [],
      sourceRecordId: inc.id,
    })
  }

  // Sightings
  for (const s of data.sightings) {
    if (!inCase(s.caseId)) continue
    if (s.vehicleId) {
      // Vehicle sighting
      const actionLabel = s.action === 'entered' ? 'Vehicle entered location'
        : s.action === 'left' ? 'Vehicle left location'
        : 'Vehicle seen'
      events.push({
        id: `evt-${s.id}`,
        timestamp: s.timestamp,
        source: 'vehicle-sighting',
        title: actionLabel,
        description: s.description,
        caseId: s.caseId,
        locationId: s.locationId,
        personIds: s.personId ? [s.personId] : [],
        vehicleId: s.vehicleId,
        sourceRecordId: s.id,
      })
    } else if (s.personId) {
      // Person sighting (CCTV, patrol, etc.)
      const person = data.persons.find(p => p.id === s.personId)
      const personType = person?.type ?? 'person'
      const label = s.source === 'cctv' ? `${personType} detected on CCTV`
        : s.source === 'patrol' ? `${personType} spotted by patrol`
        : s.source === 'anpr' ? `${personType} detected by ANPR`
        : `${personType} reported by informant`
      events.push({
        id: `evt-${s.id}`,
        timestamp: s.timestamp,
        source: 'location',
        title: label.charAt(0).toUpperCase() + label.slice(1),
        description: s.description,
        caseId: s.caseId,
        locationId: s.locationId,
        personIds: [s.personId],
        sourceRecordId: s.id,
      })
    }
  }

  // Witness statements: recordedAt
  for (const ws of data.witnessStatements) {
    if (!inCase(ws.caseId)) continue
    events.push({
      id: `evt-${ws.id}`,
      timestamp: ws.recordedAt,
      source: 'witness-statement',
      title: 'Witness statement recorded',
      description: `${ws.text} (claims subject was at location at ${new Date(ws.claimedTime).toISOString().substring(11, 16)} UTC)`,
      caseId: ws.caseId,
      locationId: ws.locationId,
      personIds: [ws.witnessId, ws.subjectPersonId],
      sourceRecordId: ws.id,
    })
  }

  // Phone records: timestamp
  for (const pr of data.phoneRecords) {
    if (!inCase(pr.caseId)) continue
    const label = pr.kind === 'cell-tower' ? 'Phone connected to cell tower'
      : pr.otherNumber === '191' ? 'Emergency call made'
      : pr.kind === 'call' ? 'Call made'
      : 'SMS sent'
    events.push({
      id: `evt-${pr.id}`,
      timestamp: pr.timestamp,
      source: 'phone-record',
      title: label,
      description: `Phone ${pr.phoneNumber}${pr.otherNumber ? ` → ${pr.otherNumber}` : ''}`,
      caseId: pr.caseId,
      locationId: pr.locationId,
      personIds: [pr.personId],
      sourceRecordId: pr.id,
    })
  }

  // Sort by timestamp. We convert to milliseconds with getTime() so JavaScript
  // can compare them as numbers (Date objects cannot be subtracted directly).
  // Stable tie-break on id so equal timestamps always come out the same order.
  events.sort((a, b) => {
    const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    return diff !== 0 ? diff : a.id.localeCompare(b.id)
  })

  return events
}
