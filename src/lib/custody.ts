import type { Evidence, CustodyEntry, EvidenceStatus, CustodyAction } from '../types'

/**
 * EVIDENCE CUSTODY STATE MACHINE
 * 
 * Plain-English concept:
 * A state machine is a list of valid states (e.g. collected, with-officer, in-evidence-room, destroyed)
 * plus strict rules about which moves (transitions) between states are permitted.
 * 
 * Just as a real court of law requires an unbroken, verified chain of custody,
 * this software enforces that evidence cannot simply jump between arbitrary states.
 * For example:
 * - Evidence that is destroyed can never be transferred or analysed.
 * - Evidence can only be transferred by the officer currently holding it.
 * - Every transfer creates a new append-only log entry; historical records are never modified.
 */

export const ALLOWED_ACTIONS: Record<EvidenceStatus, CustodyAction[]> = {
  'collected': ['transferred', 'submitted-to-evidence-room'],
  'with-officer': ['transferred', 'submitted-to-evidence-room'],
  'in-evidence-room': ['transferred', 'analysis-started', 'released', 'destroyed'],
  'under-analysis': ['analysis-completed'],
  'analysed': ['transferred', 'submitted-to-evidence-room', 'released', 'destroyed'],
  'released': [],
  'destroyed': [],
}

/**
 * Derives the current evidence status directly from the last action in its custody history.
 * Status is never stored independently of its custody log.
 */
export function deriveStatus(history: CustodyEntry[]): EvidenceStatus {
  if (!history || history.length === 0) {
    return 'collected'
  }
  const last = history[history.length - 1]
  switch (last.action) {
    case 'collected':
      return 'collected'
    case 'transferred':
      return 'with-officer'
    case 'submitted-to-evidence-room':
      return 'in-evidence-room'
    case 'analysis-started':
      return 'under-analysis'
    case 'analysis-completed':
      return 'analysed'
    case 'released':
      return 'released'
    case 'destroyed':
      return 'destroyed'
  }
}

/**
 * Returns the list of permitted next actions for an item of evidence.
 */
export function getAllowedActions(evidence: Evidence): CustodyAction[] {
  const currentStatus = deriveStatus(evidence.custodyHistory)
  return ALLOWED_ACTIONS[currentStatus] ?? []
}

/**
 * Returns the officer ID of the current custodian.
 * Defined as the recipient (toOfficerId) of the last transfer, or the officerId of the last entry.
 */
export function getCurrentHolderId(evidence: Evidence): string {
  if (!evidence.custodyHistory || evidence.custodyHistory.length === 0) {
    return evidence.collectedBy
  }
  const last = evidence.custodyHistory[evidence.custodyHistory.length - 1]
  if (last.action === 'transferred' && last.toOfficerId) {
    return last.toOfficerId
  }
  return last.officerId
}

export interface CustodyActionInput {
  timestamp: string
  officerId: string
  toOfficerId?: string
  note?: string
}

export type CustodyValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

/**
 * Validates a proposed custody action against business rules and the current state.
 */
export function validateCustodyAction(
  evidence: Evidence,
  action: CustodyAction,
  input: CustodyActionInput
): CustodyValidationResult {
  const currentStatus = deriveStatus(evidence.custodyHistory)
  const allowed = ALLOWED_ACTIONS[currentStatus] ?? []

  // 1. Check if the action is allowed from the current status
  if (!allowed.includes(action)) {
    if (currentStatus === 'destroyed') {
      return {
        ok: false,
        reason: `Evidence ${evidence.id} cannot be ${action}: it has already been marked destroyed.`,
      }
    }
    if (currentStatus === 'released') {
      return {
        ok: false,
        reason: `Evidence ${evidence.id} cannot be ${action}: it has already been released.`,
      }
    }
    return {
      ok: false,
      reason: `Evidence ${evidence.id} currently has status '${currentStatus}', which does not allow '${action}'. Allowed actions: ${allowed.join(', ') || 'none'}.`,
    }
  }

  const currentHolder = getCurrentHolderId(evidence)

  // 2. Transfer specific validations
  if (action === 'transferred') {
    if (!input.toOfficerId) {
      return { ok: false, reason: 'A recipient officer must be specified when transferring custody.' }
    }
    if (input.toOfficerId === currentHolder) {
      return { ok: false, reason: 'Cannot transfer evidence to the current custodian.' }
    }
  }

  // 3. Timestamp chronological order check
  if (evidence.custodyHistory.length > 0) {
    const lastTimestamp = new Date(evidence.custodyHistory[evidence.custodyHistory.length - 1].timestamp).getTime()
    const newTimestamp = new Date(input.timestamp).getTime()
    if (newTimestamp < lastTimestamp) {
      return {
        ok: false,
        reason: `Action timestamp cannot be earlier than the previous custody entry (${evidence.custodyHistory[evidence.custodyHistory.length - 1].timestamp}).`,
      }
    }
  }

  // 4. Custodian authority check
  // Only the person holding the item can hand it on or submit it, except when already in the evidence room
  if (currentStatus !== 'in-evidence-room') {
    if (action === 'transferred' || action === 'submitted-to-evidence-room' || action === 'analysis-started') {
      if (input.officerId !== currentHolder) {
        return {
          ok: false,
          reason: `Only the current custodian (${currentHolder}) can perform this action, but officer ${input.officerId} was provided.`,
        }
      }
    }
  }

  return { ok: true }
}

/**
 * Applies an action to evidence, returning a new immutable evidence object on success
 * or the rejection reason without changing anything.
 */
export function applyCustodyAction(
  evidence: Evidence,
  action: CustodyAction,
  input: CustodyActionInput
): { ok: true; evidence: Evidence } | { ok: false; reason: string } {
  const validation = validateCustodyAction(evidence, action, input)
  if (!validation.ok) {
    return validation
  }

  const nextEntryNumber = evidence.custodyHistory.length + 1
  const newEntry: CustodyEntry = {
    id: `CE-${evidence.id}-${nextEntryNumber}`,
    action,
    timestamp: input.timestamp,
    officerId: input.officerId,
    toOfficerId: input.toOfficerId,
    note: input.note,
  }

  const newHistory = [...evidence.custodyHistory, newEntry]
  const newStatus = deriveStatus(newHistory)

  const updatedEvidence: Evidence = {
    ...evidence,
    status: newStatus,
    custodyHistory: newHistory,
  }

  return { ok: true, evidence: updatedEvidence }
}

