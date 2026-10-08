import { describe, it, expect } from 'vitest'
import { mockData } from '../../data'
import { buildTimeline } from '../timeline'
import { detectTimelineConflicts } from '../conflicts'

describe('buildTimeline', () => {
  it('CASE-00123 events appear in the expected relative order', () => {
    const events = buildTimeline(mockData, 'CASE-00123')
    const times = events.map(e => new Date(e.timestamp).getTime())
    // Sorted ascending
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1])
    }
    // The 6 robbery events appear in order (check timestamps)
    const ev1 = events.find(e => e.sourceRecordId === 'SG-001') // 08:03 V-001 entered
    const ev3 = events.find(e => e.source === 'location' && e.personIds.includes('P-001') && e.timestamp.includes('08:20')) // 08:20 CCTV
    const ev4 = events.find(e => e.sourceRecordId === 'I-023') // 08:31 incident
    expect(ev1).toBeDefined()
    expect(ev3).toBeDefined()
    expect(ev4).toBeDefined()
    if (ev1 && ev3 && ev4) {
      expect(new Date(ev1.timestamp).getTime()).toBeLessThan(new Date(ev3.timestamp).getTime())
      expect(new Date(ev3.timestamp).getTime()).toBeLessThanOrEqual(new Date(ev4.timestamp).getTime())
    }
  })

  it('all 6 source kinds appear in the full timeline', () => {
    const events = buildTimeline(mockData)
    const sources = new Set(events.map(e => e.source))
    expect(sources.has('evidence')).toBe(true)
    expect(sources.has('incident')).toBe(true)
    expect(sources.has('vehicle-sighting')).toBe(true)
    expect(sources.has('location')).toBe(true)
    expect(sources.has('witness-statement')).toBe(true)
    expect(sources.has('phone-record')).toBe(true)
  })

  it('is sorted ascending for any input', () => {
    const events = buildTimeline(mockData)
    for (let i = 1; i < events.length; i++) {
      expect(new Date(events[i].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(events[i - 1].timestamp).getTime()
      )
    }
  })
})

describe('detectTimelineConflicts', () => {
  it('Takoradi 10:15 vs Accra 10:10 IS flagged for P-001', () => {
    const conflicts = detectTimelineConflicts(mockData, 'CASE-00123')
    const c = conflicts.find(
      x => x.personId === 'P-001' &&
        ((x.claimA.locationId === 'L-001' && x.claimB.locationId === 'L-005') ||
         (x.claimA.locationId === 'L-005' && x.claimB.locationId === 'L-001')) &&
        (x.claimA.timestamp.includes('10:10') || x.claimB.timestamp.includes('10:10'))
    )
    expect(c).toBeDefined()
    expect(c!.gapMinutes).toBe(5)
  })

  it('Accra 10:10 vs Tema 12:00 is NOT flagged for P-001', () => {
    const conflicts = detectTimelineConflicts(mockData, 'CASE-00123')
    const c = conflicts.find(
      x => x.personId === 'P-001' &&
        ((x.claimA.locationId === 'L-001' && x.claimB.locationId === 'L-002') ||
         (x.claimA.locationId === 'L-002' && x.claimB.locationId === 'L-001'))
    )
    expect(c).toBeUndefined()
  })

  it('same-location claims never conflict', () => {
    const conflicts = detectTimelineConflicts(mockData)
    for (const c of conflicts) {
      expect(c.claimA.locationId).not.toBe(c.claimB.locationId)
    }
  })
})
