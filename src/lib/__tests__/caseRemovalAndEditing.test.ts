import { describe, it, expect } from 'vitest'
import { useInvestigationStore } from '../../store/useInvestigationStore'
import {
  getCasePeople,
  getCaseLocations,
  getCaseVehicles,
  getCaseEvidence,
} from '../caseScope'

describe('Case Entity Removal and Person Editing', () => {
  it('updates a person details across store records', () => {
    const store = useInvestigationStore.getState()
    const person = store.data.persons[0]
    expect(person).toBeDefined()

    store.updatePerson(person.id, {
      fullName: 'Updated Name Testing',
      type: 'witness',
      phone: '0240009999',
      address: '77 Test Boulevard, Airport City, Accra',
      knownAliases: ['Tester', 'New Alias'],
    })

    const updated = useInvestigationStore.getState().data.persons.find(p => p.id === person.id)!
    expect(updated.fullName).toBe('Updated Name Testing')
    expect(updated.type).toBe('witness')
    expect(updated.phone).toBe('0240009999')
    expect(updated.address).toBe('77 Test Boulevard, Airport City, Accra')
    expect(updated.knownAliases).toEqual(['Tester', 'New Alias'])
  })

  it('removes a person from a case and cleans up case links and evidence', () => {
    const store = useInvestigationStore.getState()

    // Create a new case
    store.createCase({
      title: 'Removal Test Case',
      description: 'Testing person removal',
      type: 'fraud',
      priority: 'medium',
      leadInvestigator: 'O-001',
    })

    const kase = useInvestigationStore.getState().data.cases.find(c => c.title === 'Removal Test Case')!
    expect(kase).toBeDefined()

    // Add a person
    store.createPersonForCase(kase.id, {
      fullName: 'Person To Be Removed',
      type: 'suspect',
    })

    let casePeople = getCasePeople(useInvestigationStore.getState().data, kase.id)
    expect(casePeople).toHaveLength(1)
    const person = casePeople[0]

    // Add evidence linked to this person
    store.addEvidence(kase.id, {
      title: 'Linked Phone Evidence',
      type: 'device',
      description: 'Smartphone of suspect',
      linkedPersons: [person.id],
    })

    let caseEv = getCaseEvidence(useInvestigationStore.getState().data, kase.id)
    expect(caseEv[0].linkedPersons).toContain(person.id)

    // Remove person from case
    store.removePersonFromCase(kase.id, person.id)

    casePeople = getCasePeople(useInvestigationStore.getState().data, kase.id)
    expect(casePeople).toHaveLength(0)

    caseEv = getCaseEvidence(useInvestigationStore.getState().data, kase.id)
    expect(caseEv[0].linkedPersons).not.toContain(person.id)

    const updatedPerson = useInvestigationStore.getState().data.persons.find(p => p.id === person.id)!
    expect(updatedPerson.relatedCases).not.toContain(kase.id)
  })

  it('removes a vehicle from a case and detaches case links and sightings', () => {
    const store = useInvestigationStore.getState()

    // Create a case
    store.createCase({
      title: 'Vehicle Removal Test Case',
      description: 'Testing vehicle removal',
      type: 'theft',
      priority: 'high',
      leadInvestigator: 'O-001',
    })
    const kase = useInvestigationStore.getState().data.cases.find(c => c.title === 'Vehicle Removal Test Case')!

    // Add a person
    store.createPersonForCase(kase.id, {
      fullName: 'Vehicle Owner Person',
      type: 'suspect',
    })
    const person = getCasePeople(useInvestigationStore.getState().data, kase.id)[0]

    // Create a vehicle
    const vehicle = store.createVehicle(
      kase.id,
      {
        registration: 'GX-9999-26',
        make: 'Nissan',
        model: 'Patrol',
        color: 'White',
      },
      [{ targetId: person.id, relationship: 'owns' }]
    )

    // Sighting in this case
    store.addSighting(kase.id, {
      source: 'cctv',
      action: 'seen',
      locationId: 'L-001',
      timestamp: new Date().toISOString(),
      description: 'Spotted at junction',
      vehicleId: vehicle.id,
    })

    let caseVehicles = getCaseVehicles(useInvestigationStore.getState().data, kase.id)
    expect(caseVehicles.some(v => v.id === vehicle.id)).toBe(true)

    // Remove vehicle from case
    store.removeVehicleFromCase(kase.id, vehicle.id)

    caseVehicles = getCaseVehicles(useInvestigationStore.getState().data, kase.id)
    expect(caseVehicles.some(v => v.id === vehicle.id)).toBe(false)

    // Verify sightings in this case for this vehicle removed
    const caseSightings = useInvestigationStore.getState().data.sightings.filter(
      s => s.caseId === kase.id && s.vehicleId === vehicle.id
    )
    expect(caseSightings).toHaveLength(0)
  })

  it('removes a location from a case and detaches sightings and evidence locationId', () => {
    const store = useInvestigationStore.getState()

    // Create a case
    store.createCase({
      title: 'Location Removal Test Case',
      description: 'Testing location removal',
      type: 'other',
      priority: 'low',
      leadInvestigator: 'O-001',
    })
    const kase = useInvestigationStore.getState().data.cases.find(c => c.title === 'Location Removal Test Case')!

    const location = store.createLocation({
      name: 'Safehouse Location Under Test',
      city: 'Tema',
      region: 'Greater Accra',
    })

    // Add evidence linked to this location
    store.addEvidence(kase.id, {
      title: 'Documents at safehouse',
      type: 'document',
      description: 'Found on table',
      locationId: location.id,
      linkedPersons: [],
    })

    // Add sighting at this location
    store.addSighting(kase.id, {
      source: 'patrol',
      action: 'seen',
      locationId: location.id,
      timestamp: new Date().toISOString(),
      description: 'Patrol sighting',
    })

    let caseLocations = getCaseLocations(useInvestigationStore.getState().data, kase.id)
    expect(caseLocations.some(l => l.id === location.id)).toBe(true)

    // Remove location from case
    store.removeLocationFromCase(kase.id, location.id)

    caseLocations = getCaseLocations(useInvestigationStore.getState().data, kase.id)
    expect(caseLocations.some(l => l.id === location.id)).toBe(false)

    const ev = useInvestigationStore.getState().data.evidence.find(
      e => e.caseId === kase.id && e.title === 'Documents at safehouse'
    )!
    expect(ev.locationId).toBeUndefined()
  })
})
