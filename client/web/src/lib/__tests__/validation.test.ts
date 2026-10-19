import { describe, it, expect } from 'vitest'
import { mockData } from '../../data'
import {
  normalisePlate,
  isDuplicateVehicle,
  isDuplicateLocation,
  parseInputAsUtc,
  validateIncidentInput,
  validateDocumentInput,
  validateLeadInvestigatorInput,
  validateLocationInput,
  validateVehicleInput,
  validateConnectionInput,
  validateWitnessStatementInput,
  validateSightingInput,
  validatePhoneRecordInput,
} from '../validation'

describe('validation: normalisePlate', () => {
  it('normalisePlate("gt 4521-23") equals "GT452123"', () => {
    expect(normalisePlate('gt 4521-23')).toBe('GT452123')
  })
})

describe('validation: parseInputAsUtc', () => {
  it('appends :00Z to datetime-local format', () => {
    expect(parseInputAsUtc('2026-09-14T10:15')).toBe('2026-09-14T10:15:00Z')
  })
  it('preserves existing Z suffix', () => {
    expect(parseInputAsUtc('2026-09-14T10:15:00Z')).toBe('2026-09-14T10:15:00Z')
  })
})

describe('validation: duplicate vehicle check', () => {
  it('catches GT-4521-23 written three different ways', () => {
    // V-001 has registration 'GT-4521-23'
    expect(isDuplicateVehicle(mockData, 'GT-4521-23')).toBe(true)
    expect(isDuplicateVehicle(mockData, 'gt 4521-23')).toBe(true)
    expect(isDuplicateVehicle(mockData, 'gt452123')).toBe(true)
    expect(isDuplicateVehicle(mockData, 'GT 4521 23')).toBe(true)
    expect(isDuplicateVehicle(mockData, 'GR-9999-99')).toBe(false)
  })
})

describe('validation: duplicate location check', () => {
  it('duplicate location check ignores case and whitespace', () => {
    // L-001 is Accra Mall / Accra
    expect(isDuplicateLocation(mockData, 'Accra Mall', 'Accra')).toBe(true)
    expect(isDuplicateLocation(mockData, 'accra mall', 'accra')).toBe(true)
    expect(isDuplicateLocation(mockData, '  Accra Mall  ', '  ACCRA  ')).toBe(true)
    expect(isDuplicateLocation(mockData, 'Brand New Station', 'Tamale')).toBe(false)
  })
})

describe('validation: validateIncidentInput', () => {
  it('returns errors for empty required fields', () => {
    const errs = validateIncidentInput(mockData, {})
    expect(errs.title).toBeDefined()
    expect(errs.description).toBeDefined()
    expect(errs.type).toBeDefined()
    expect(errs.locationId).toBeDefined()
    expect(errs.occurredAt).toBeDefined()
    expect(errs.status).toBeDefined()
  })

  it('returns no errors for valid input', () => {
    const errs = validateIncidentInput(mockData, {
      title: 'Commercial break-in',
      description: 'Rear window shattered and safe opened',
      type: 'theft',
      locationId: 'L-001',
      occurredAt: '2026-09-14T08:31',
      status: 'unresolved',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})

describe('validation: validateDocumentInput', () => {
  it('returns errors for empty required fields', () => {
    const errs = validateDocumentInput({})
    expect(errs.title).toBeDefined()
    expect(errs.kind).toBeDefined()
  })

  it('returns no errors for valid input', () => {
    const errs = validateDocumentInput({
      title: 'Forensic Ballistics Report',
      kind: 'report',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})

describe('validation: validateLeadInvestigatorInput', () => {
  it('returns error when empty or invalid', () => {
    expect(validateLeadInvestigatorInput(mockData, '')).toHaveProperty('leadInvestigator')
    expect(validateLeadInvestigatorInput(mockData, 'O-999')).toHaveProperty('leadInvestigator')
  })

  it('returns no error for existing officer', () => {
    expect(Object.keys(validateLeadInvestigatorInput(mockData, 'O-001'))).toHaveLength(0)
  })
})

describe('validation: validateLocationInput', () => {
  it('returns errors for empty required fields', () => {
    const errs = validateLocationInput(mockData, {})
    expect(errs.name).toBeDefined()
    expect(errs.city).toBeDefined()
    expect(errs.region).toBeDefined()
    expect(errs.visitedByPersonId).toBeDefined()
  })

  it('returns no errors for valid input', () => {
    const errs = validateLocationInput(mockData, {
      name: 'Safehouse Alpha',
      city: 'Kasoa',
      region: 'Central',
      visitedByPersonId: 'P-001',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})

describe('validation: validateVehicleInput', () => {
  it('returns errors for empty required fields and missing connections', () => {
    const errs = validateVehicleInput(mockData, {})
    expect(errs.registration).toBeDefined()
    expect(errs.make).toBeDefined()
    expect(errs.model).toBeDefined()
    expect(errs.color).toBeDefined()
    expect(errs.connections).toBeDefined()
  })

  it('rejects duplicate registration plate', () => {
    const errs = validateVehicleInput(mockData, {
      registration: 'gt 4521 23', // exists as V-001
      make: 'Toyota',
      model: 'Hilux',
      color: 'Black',
      connections: [{ targetId: 'P-001', relationship: 'owns' }],
    })
    expect(errs.registration).toContain('already exists')
  })

  it('returns no errors for valid input', () => {
    const errs = validateVehicleInput(mockData, {
      registration: 'GX-8833-25',
      make: 'Nissan',
      model: 'Navara',
      color: 'Black',
      connections: [{ targetId: 'P-001', relationship: 'owns' }],
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})

describe('validation: validateConnectionInput', () => {
  it('returns errors for empty required fields', () => {
    const errs = validateConnectionInput(mockData, {})
    expect(errs.personId).toBeDefined()
    expect(errs.relationship).toBeDefined()
    expect(errs.targetId).toBeDefined()
  })

  it('enforces target entity type compatibility', () => {
    // visited only location
    expect(
      validateConnectionInput(mockData, { personId: 'P-001', relationship: 'visited', targetId: 'V-001' })
    ).toHaveProperty('targetId')

    // involved-in only incident
    expect(
      validateConnectionInput(mockData, { personId: 'P-001', relationship: 'involved-in', targetId: 'L-001' })
    ).toHaveProperty('targetId')

    // owns only vehicle
    expect(
      validateConnectionInput(mockData, { personId: 'P-001', relationship: 'owns', targetId: 'I-001' })
    ).toHaveProperty('targetId')
  })

  it('returns no errors for valid connection', () => {
    const errs = validateConnectionInput(mockData, {
      personId: 'P-001',
      relationship: 'visited',
      targetId: 'L-007',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})

describe('validation: validateWitnessStatementInput', () => {
  it('returns errors for empty required fields', () => {
    const errs = validateWitnessStatementInput(mockData, {})
    expect(errs.witnessId).toBeDefined()
    expect(errs.subjectPersonId).toBeDefined()
    expect(errs.locationId).toBeDefined()
    expect(errs.claimedTime).toBeDefined()
    expect(errs.recordedAt).toBeDefined()
    expect(errs.text).toBeDefined()
  })

  it('returns no errors for valid input', () => {
    const errs = validateWitnessStatementInput(mockData, {
      witnessId: 'P-002',
      subjectPersonId: 'P-001',
      locationId: 'L-005',
      claimedTime: '2026-09-14T10:15',
      recordedAt: '2026-09-14T12:00',
      text: 'Saw the subject standing outside the harbor entrance.',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})

describe('validation: validateSightingInput', () => {
  it('returns errors for empty required fields', () => {
    const errs = validateSightingInput(mockData, {})
    expect(errs.source).toBeDefined()
    expect(errs.action).toBeDefined()
    expect(errs.locationId).toBeDefined()
    expect(errs.timestamp).toBeDefined()
    expect(errs.vehicleOrPerson).toBeDefined()
    expect(errs.description).toBeDefined()
  })

  it('returns no errors for valid input with person', () => {
    const errs = validateSightingInput(mockData, {
      source: 'cctv',
      action: 'seen',
      locationId: 'L-001',
      timestamp: '2026-09-14T10:10',
      personId: 'P-001',
      description: 'Captured on street surveillance footage.',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})

describe('validation: validatePhoneRecordInput', () => {
  it('returns errors for empty required fields', () => {
    const errs = validatePhoneRecordInput(mockData, {})
    expect(errs.personId).toBeDefined()
    expect(errs.phoneNumber).toBeDefined()
    expect(errs.kind).toBeDefined()
    expect(errs.timestamp).toBeDefined()
  })

  it('requires tower location for cell-tower kind', () => {
    const errs = validatePhoneRecordInput(mockData, {
      personId: 'P-001',
      phoneNumber: '0241234567',
      kind: 'cell-tower',
      timestamp: '2026-09-14T08:14',
    })
    expect(errs.locationId).toBeDefined()
  })

  it('requires otherNumber for call kind', () => {
    const errs = validatePhoneRecordInput(mockData, {
      personId: 'P-001',
      phoneNumber: '0241234567',
      kind: 'call',
      timestamp: '2026-09-14T08:45',
    })
    expect(errs.otherNumber).toBeDefined()
  })

  it('returns no errors for valid call record', () => {
    const errs = validatePhoneRecordInput(mockData, {
      personId: 'P-001',
      phoneNumber: '0241234567',
      kind: 'call',
      timestamp: '2026-09-14T08:45',
      otherNumber: '191',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })
})
