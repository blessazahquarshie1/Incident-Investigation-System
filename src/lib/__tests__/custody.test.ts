import { describe, it, expect } from 'vitest'
import { mockData } from '../../data'
import {
  deriveStatus,
  getAllowedActions,
  getCurrentHolderId,
  validateCustodyAction,
  applyCustodyAction,
  ALLOWED_ACTIONS,
} from '../custody'
import type { Evidence, CustodyAction } from '../../types'

describe('deriveStatus', () => {
  it('correctly derives status from every mock evidence custodyHistory', () => {
    for (const ev of mockData.evidence) {
      const derived = deriveStatus(ev.custodyHistory)
      expect(ev.status).toBe(derived)
    }
  })
})

describe('E-024 Laptop custody history', () => {
  it('is valid step-by-step and ends in under-analysis', () => {
    const e024 = mockData.evidence.find(e => e.id === 'E-024')
    expect(e024).toBeDefined()
    expect(e024!.status).toBe('under-analysis')
    expect(e024!.custodyHistory).toHaveLength(4)

    // Verify step by step replay
    const baseEvidence: Evidence = {
      ...e024!,
      status: 'collected',
      custodyHistory: [e024!.custodyHistory[0]],
    }
    expect(deriveStatus(baseEvidence.custodyHistory)).toBe('collected')
    expect(getCurrentHolderId(baseEvidence)).toBe('O-001')

    // Step 2: transfer to O-002
    const step2Res = applyCustodyAction(baseEvidence, 'transferred', {
      timestamp: e024!.custodyHistory[1].timestamp,
      officerId: 'O-001',
      toOfficerId: 'O-002',
    })
    expect(step2Res.ok).toBe(true)
    if (step2Res.ok) {
      expect(step2Res.evidence.status).toBe('with-officer')
      expect(getCurrentHolderId(step2Res.evidence)).toBe('O-002')

      // Step 3: submitted to evidence room
      const step3Res = applyCustodyAction(step2Res.evidence, 'submitted-to-evidence-room', {
        timestamp: e024!.custodyHistory[2].timestamp,
        officerId: 'O-002',
      })
      expect(step3Res.ok).toBe(true)
      if (step3Res.ok) {
        expect(step3Res.evidence.status).toBe('in-evidence-room')

        // Step 4: analysis started
        const step4Res = applyCustodyAction(step3Res.evidence, 'analysis-started', {
          timestamp: e024!.custodyHistory[3].timestamp,
          officerId: 'O-003',
        })
        expect(step4Res.ok).toBe(true)
        if (step4Res.ok) {
          expect(step4Res.evidence.status).toBe('under-analysis')
        }
      }
    }
  })
})

describe('Destroyed and released evidence blocking', () => {
  it('rejects any action on destroyed evidence E-031 with the destroyed reason', () => {
    const e031 = mockData.evidence.find(e => e.id === 'E-031')
    expect(e031).toBeDefined()
    expect(e031!.status).toBe('destroyed')

    const allowed = getAllowedActions(e031!)
    expect(allowed).toHaveLength(0)

    const transferAttempt = applyCustodyAction(e031!, 'transferred', {
      timestamp: '2026-09-16T12:00:00Z',
      officerId: 'O-001',
      toOfficerId: 'O-002',
    })
    expect(transferAttempt.ok).toBe(false)
    if (!transferAttempt.ok) {
      expect(transferAttempt.reason).toContain('cannot be transferred')
      expect(transferAttempt.reason).toContain('already been marked destroyed')
    }
  })

  it('allows no actions on released and destroyed items', () => {
    expect(ALLOWED_ACTIONS['released']).toHaveLength(0)
    expect(ALLOWED_ACTIONS['destroyed']).toHaveLength(0)
  })
})

describe('Custody action validation checks', () => {
  const sampleEvidence: Evidence = {
    id: 'E-TEST',
    caseId: 'CASE-00123',
    title: 'Test Knife',
    type: 'device',
    description: 'Test weapon',
    collectedAt: '2026-09-14T09:00:00Z',
    collectedBy: 'O-001',
    status: 'collected',
    linkedPersons: [],
    custodyHistory: [
      { id: 'CE-TEST-1', action: 'collected', timestamp: '2026-09-14T09:00:00Z', officerId: 'O-001' }
    ],
  }

  it('rejects transfer without a recipient', () => {
    const res = validateCustodyAction(sampleEvidence, 'transferred', {
      timestamp: '2026-09-14T10:00:00Z',
      officerId: 'O-001',
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toContain('recipient officer must be specified')
    }
  })

  it('rejects transfer to the same officer currently holding it', () => {
    const res = validateCustodyAction(sampleEvidence, 'transferred', {
      timestamp: '2026-09-14T10:00:00Z',
      officerId: 'O-001',
      toOfficerId: 'O-001',
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toContain('Cannot transfer evidence to the current custodian')
    }
  })

  it('rejects a timestamp earlier than the last entry', () => {
    const res = validateCustodyAction(sampleEvidence, 'transferred', {
      timestamp: '2026-09-14T08:00:00Z', // 1 hour earlier than 09:00:00
      officerId: 'O-001',
      toOfficerId: 'O-002',
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toContain('earlier than the previous custody entry')
    }
  })

  it('rejects action by an officer who is not the current holder', () => {
    const res = validateCustodyAction(sampleEvidence, 'transferred', {
      timestamp: '2026-09-14T10:00:00Z',
      officerId: 'O-005', // current holder is O-001
      toOfficerId: 'O-002',
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toContain('Only the current custodian')
    }
  })
})
