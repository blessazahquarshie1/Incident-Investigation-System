import { describe, it, expect } from 'vitest'
import { mockData } from '../../fixtures'
import {
  getConnectionSnapshot,
  diffSnapshots,
  type ConnectionSnapshot,
} from '../connectionDiff'

describe('connectionDiff', () => {
  describe('getConnectionSnapshot', () => {
    it('captures case pairs and related cases for a case', () => {
      const snapshot = getConnectionSnapshot(mockData, 'CASE-00123')
      expect(snapshot.caseId).toBe('CASE-00123')
      expect(snapshot.casePairs.size).toBeGreaterThan(0)
      // Check P-001 and P-002 pair inside CASE-00123
      const pairKey = ['P-001', 'P-002'].sort().join(':')
      const p1p2 = snapshot.casePairs.get(pairKey)
      expect(p1p2).toBeDefined()
      expect(p1p2?.score).toBe(13)
      expect(p1p2?.level).toBe('STRONG')
    })
  })

  describe('diffSnapshots', () => {
    it('returns empty array when snapshots are identical', () => {
      const snap = getConnectionSnapshot(mockData, 'CASE-00123')
      const diff = diffSnapshots(snap, snap)
      expect(diff).toEqual([])
    })

    it('reports a new person pair sharing a vehicle', () => {
      const before: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map(),
        relatedCases: new Map(),
      }

      const after: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map([
          [
            'P-A:P-B',
            {
              personAId: 'P-A',
              personBId: 'P-B',
              personAName: 'Alice Mensah',
              personBName: 'Bob Asante',
              score: 4,
              level: 'MODERATE',
              sharedVehicles: ['V-001'],
              sharedLocations: [],
              sharedIncidents: [],
              sharedEvidence: [],
              sharedPhoneNumbers: [],
            },
          ],
        ]),
        relatedCases: new Map(),
      }

      const diff = diffSnapshots(before, after)
      expect(diff).toContain(
        'Alice Mensah and Bob Asante now share a vehicle (score 4, MODERATE)'
      )
    })

    it('reports an increased score for an existing person pair', () => {
      const before: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map([
          [
            'P-A:P-B',
            {
              personAId: 'P-A',
              personBId: 'P-B',
              personAName: 'Alice Mensah',
              personBName: 'Bob Asante',
              score: 4,
              level: 'MODERATE',
              sharedVehicles: ['V-001'],
              sharedLocations: [],
              sharedIncidents: [],
              sharedEvidence: [],
              sharedPhoneNumbers: [],
            },
          ],
        ]),
        relatedCases: new Map(),
      }

      const after: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map([
          [
            'P-A:P-B',
            {
              personAId: 'P-A',
              personBId: 'P-B',
              personAName: 'Alice Mensah',
              personBName: 'Bob Asante',
              score: 9,
              level: 'MODERATE',
              sharedVehicles: ['V-001'],
              sharedLocations: ['L-001'],
              sharedIncidents: [],
              sharedEvidence: [],
              sharedPhoneNumbers: [],
            },
          ],
        ]),
        relatedCases: new Map(),
      }

      const diff = diffSnapshots(before, after)
      expect(diff).toContain(
        'Alice Mensah and Bob Asante connection increased (score 9, MODERATE)'
      )
    })

    it('reports a new related case link', () => {
      const before: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map(),
        relatedCases: new Map(),
      }

      const after: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map(),
        relatedCases: new Map([
          [
            'CASE-00201',
            {
              caseId: 'CASE-00201',
              score: 12,
              level: 'STRONG',
            },
          ],
        ]),
      }

      const diff = diffSnapshots(before, after)
      expect(diff).toContain('This case is now linked to CASE-00201 (STRONG)')
    })

    it('reports an increased link level for an existing related case', () => {
      const before: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map(),
        relatedCases: new Map([
          [
            'CASE-00201',
            {
              caseId: 'CASE-00201',
              score: 4,
              level: 'WEAK',
            },
          ],
        ]),
      }

      const after: ConnectionSnapshot = {
        caseId: 'TEST-CASE',
        casePairs: new Map(),
        relatedCases: new Map([
          [
            'CASE-00201',
            {
              caseId: 'CASE-00201',
              score: 10,
              level: 'STRONG',
            },
          ],
        ]),
      }

      const diff = diffSnapshots(before, after)
      expect(diff).toContain('Link to CASE-00201 increased (STRONG)')
    })
  })
})

