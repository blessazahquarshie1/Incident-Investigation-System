import { describe, it, expect } from 'vitest'
import { useInvestigationStore } from '../../store/useInvestigationStore'
import {
  getCasePeople,
  getCaseLocations,
  getCaseVehicles,
  getCaseEvidence,
  getCaseDocuments,
  getCaseActivity,
} from '../caseScope'
import { calculateConnection } from '../connections'
import { detectTimelineConflicts } from '../conflicts'
import { buildGraph } from '../graph'
import { searchAll } from '../search'
import { buildTimeline } from '../timeline'

describe('Step 05b — End-to-End Acceptance Scenario', () => {
  it('executes full 7-step scenario and verifies score 16 VERY STRONG, timeline conflict, graph, search, and activity log', () => {
    const store = useInvestigationStore.getState()

    // 1. Create a brand new case + two people
    store.createCase({
      title: 'Special Acceptance Test Case',
      description: 'Case created to verify Step 05b all-forms workflow',
      type: 'theft',
      priority: 'high',
      leadInvestigator: 'O-001',
    })

    const newCase = useInvestigationStore.getState().data.cases.find(
      c => c.title === 'Special Acceptance Test Case'
    )!
    expect(newCase).toBeDefined()
    const caseId = newCase.id

    store.createPersonForCase(caseId, {
      fullName: 'Acceptance Suspect Alpha',
      type: 'suspect',
      phone: '0249999001',
    })
    store.createPersonForCase(caseId, {
      fullName: 'Acceptance Suspect Beta',
      type: 'suspect',
      phone: '0249999002',
    })

    const casePeople = getCasePeople(useInvestigationStore.getState().data, caseId)
    expect(casePeople).toHaveLength(2)
    const person1 = casePeople.find(p => p.fullName === 'Acceptance Suspect Alpha')!
    const person2 = casePeople.find(p => p.fullName === 'Acceptance Suspect Beta')!
    expect(person1).toBeDefined()
    expect(person2).toBeDefined()

    // 2. Add one incident at a NEW location
    const newLocation = store.createLocation({
      name: 'Adabraka Warehouse Complex',
      city: 'Accra',
      region: 'Greater Accra',
    })
    expect(newLocation).toBeDefined()

    const newIncident = store.addIncidentToCase(caseId, {
      title: 'Warehouse Vault Forced Entry',
      description: 'Rear security shutters pried open during early morning hours',
      type: 'theft',
      locationId: newLocation.id,
      occurredAt: '2026-09-14T03:00:00Z',
      status: 'unresolved',
    })
    expect(newIncident).toBeDefined()

    // 3. Add one new vehicle: person 1 owns it, person 2 connected-to it, vehicle involved-in incident
    const newVehicle = store.createVehicle(
      caseId,
      {
        registration: 'ER-8877-26',
        make: 'Nissan',
        model: 'Navara',
        color: 'Black',
      },
      [
        { targetId: person1.id, relationship: 'owns' },
        { targetId: person2.id, relationship: 'connected-to' },
        { targetId: newIncident.id, relationship: 'involved-in' },
      ]
    )
    expect(newVehicle).toBeDefined()
    expect(newVehicle.ownerId).toBe(person1.id)

    // 4. Both people marked involved-in the incident and both visited the new location
    store.addConnection(caseId, {
      source: person1.id,
      target: newIncident.id,
      relationship: 'involved-in',
    })
    store.addConnection(caseId, {
      source: person2.id,
      target: newIncident.id,
      relationship: 'involved-in',
    })
    store.addVisitedLocation(caseId, newLocation.id, person1.id)
    store.addVisitedLocation(caseId, newLocation.id, person2.id)

    // 5. One evidence item linked to BOTH people
    store.addEvidence(caseId, {
      title: 'Crowbar and Acetylene Torch Kit',
      type: 'device',
      description: 'Heavy burglary implements recovered near loading bay',
      locationId: newLocation.id,
      linkedPersons: [person1.id, person2.id],
    })

    // 6. One document
    store.addDocumentToCase(caseId, {
      title: 'Forensic Toolmark Impression Report',
      kind: 'report',
    })

    // 7. Witness statement saying person 1 was in Takoradi (L-005) at 10:15,
    // and a CCTV sighting of person 1 in Accra (L-001) at 10:10 the same day
    store.addWitnessStatement(caseId, {
      witnessId: person2.id,
      subjectPersonId: person1.id,
      locationId: 'L-005', // Takoradi Harbour
      claimedTime: '2026-09-14T10:15:00Z',
      recordedAt: '2026-09-14T16:00:00Z',
      text: 'Saw the subject loading crates near the dockside at Takoradi',
    })

    store.addSighting(caseId, {
      source: 'cctv',
      action: 'seen',
      locationId: 'L-001', // Accra Mall
      timestamp: '2026-09-14T10:10:00Z',
      personId: person1.id,
      description: 'Subject identified on main concourse security feed in Accra',
    })

    // Current fresh store state
    const currentData = useInvestigationStore.getState().data

    // Verification A: Locations, Vehicles, Evidence, Documents tabs show new records
    const caseLocs = getCaseLocations(currentData, caseId)
    expect(caseLocs.some(l => l.id === newLocation.id)).toBe(true)

    const caseVehs = getCaseVehicles(currentData, caseId)
    expect(caseVehs.some(v => v.id === newVehicle.id)).toBe(true)

    const caseEvs = getCaseEvidence(currentData, caseId)
    expect(caseEvs.some(e => e.title === 'Crowbar and Acetylene Torch Kit')).toBe(true)

    const caseDocs = getCaseDocuments(currentData, caseId)
    expect(caseDocs.some(d => d.title === 'Forensic Toolmark Impression Report')).toBe(true)

    // Verification B: Connections tab shows score of 16, VERY STRONG
    // (2 for location + 4 vehicle + 5 incident + 5 evidence)
    const connectionResult = calculateConnection(currentData, person1.id, person2.id)
    expect(connectionResult.sharedLocations).toHaveLength(1) // newLocation
    expect(connectionResult.sharedVehicles).toHaveLength(1) // newVehicle
    expect(connectionResult.sharedIncidents).toHaveLength(1) // newIncident
    expect(connectionResult.sharedEvidence).toHaveLength(1) // Crowbar kit
    expect(connectionResult.score).toBe(16)
    expect(connectionResult.level).toBe('VERY STRONG')

    // Verification C: Timeline tab shows records and conflict detection
    const timelineEvents = buildTimeline(currentData, caseId)
    expect(timelineEvents.length).toBeGreaterThanOrEqual(4)

    const caseConflicts = detectTimelineConflicts(currentData, caseId)
    expect(caseConflicts.length).toBeGreaterThanOrEqual(1)
    const conflictForP1 = caseConflicts.find(c => c.personId === person1.id)
    expect(conflictForP1).toBeDefined()
    expect(conflictForP1!.gapMinutes).toBe(5)
    // Accra to Takoradi travel time is 270 minutes
    expect(conflictForP1!.requiredMinutes).toBe(270)

    // Verification D: Graph page shows the new nodes
    const graph = buildGraph(currentData)
    expect(graph.nodes.some(n => n.id === newLocation.id)).toBe(true)
    expect(graph.nodes.some(n => n.id === newVehicle.id)).toBe(true)
    expect(graph.nodes.some(n => n.id === newIncident.id)).toBe(true)
    expect(graph.nodes.some(n => n.id === person1.id)).toBe(true)
    expect(graph.nodes.some(n => n.id === person2.id)).toBe(true)

    // Verification E: Searching the new plate finds the vehicle
    const searchResults = searchAll(currentData, graph, 'ER-8877-26')
    expect(searchResults.some(r => r.entityType === 'vehicle' && r.id === newVehicle.id)).toBe(true)

    // Also searching normalized without hyphen
    const searchNorm = searchAll(currentData, graph, 'er887726')
    expect(searchNorm.some(r => r.entityType === 'vehicle' && r.id === newVehicle.id)).toBe(true)

    // Verification F: Activity log lists every action recorded in order
    const caseActivity = getCaseActivity(currentData, caseId)
    expect(caseActivity.length).toBeGreaterThanOrEqual(8)
    const actions = caseActivity.map(a => a.action)
    expect(actions).toContain('case-created')
    expect(actions).toContain('person-added')
    expect(actions).toContain('incident-added')
    expect(actions).toContain('vehicle-added')
    expect(actions).toContain('location-added')
    expect(actions).toContain('evidence-uploaded')
    expect(actions).toContain('document-added')
    expect(actions).toContain('timeline-record-added')
  })
})

