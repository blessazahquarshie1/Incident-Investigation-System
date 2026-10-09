import type { InvestigationData, Location } from '../types'

/**
 * Normalise a vehicle registration plate string:
 * Uppercase, strip all whitespace and hyphens.
 * Example: normalisePlate("gt 4521-23") => "GT452123"
 */
export function normalisePlate(text: string): string {
  return text.toUpperCase().replace(/[\s-]/g, '')
}

/**
 * Checks whether a vehicle with the given registration (normalised) already exists in data.
 */
export function isDuplicateVehicle(data: InvestigationData, registration: string): boolean {
  const norm = normalisePlate(registration)
  if (!norm) return false
  return data.vehicles.some(v => normalisePlate(v.registration) === norm)
}

/**
 * Checks whether a location with the same name and city (case-insensitive) already exists.
 */
export function isDuplicateLocation(data: InvestigationData, name: string, city: string): boolean {
  const normName = name.trim().toLowerCase()
  const normCity = city.trim().toLowerCase()
  if (!normName || !normCity) return false
  return data.locations.some(
    l => l.name.trim().toLowerCase() === normName && l.city.trim().toLowerCase() === normCity
  )
}

/**
 * Finds an existing location matching name and city (case-insensitive).
 */
export function findExistingLocation(data: InvestigationData, name: string, city: string): Location | undefined {
  const normName = name.trim().toLowerCase()
  const normCity = city.trim().toLowerCase()
  if (!normName || !normCity) return undefined
  return data.locations.find(
    l => l.name.trim().toLowerCase() === normName && l.city.trim().toLowerCase() === normCity
  )
}

/**
 * Parses an input string (e.g. "2026-09-14T10:15" or ISO string) as UTC ISO string.
 * Ghana operates on UTC (GMT) year-round.
 */
export function parseInputAsUtc(value: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.endsWith('Z')) return trimmed
  // If it's YYYY-MM-DDTHH:mm, append :00Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00Z`
  }
  // If it's YYYY-MM-DDTHH:mm:ss, append Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}Z`
  }
  return trimmed
}

/**
 * Checks if a parsed UTC date is in the future.
 */
export function isFutureDateTime(utcIsoString: string): boolean {
  if (!utcIsoString) return false
  const time = new Date(utcIsoString).getTime()
  if (isNaN(time)) return false
  return time > Date.now()
}

/**
 * Validation for Add Incident form.
 */
export function validateIncidentInput(
  _data: InvestigationData,
  input: {
    title?: string
    description?: string
    type?: string
    locationId?: string
    occurredAt?: string
    status?: string
  }
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.title?.trim()) {
    errors.title = 'Incident title is required.'
  }
  if (!input.description?.trim()) {
    errors.description = 'Incident description is required.'
  }
  if (!input.type?.trim()) {
    errors.type = 'Incident type is required.'
  }
  if (!input.locationId?.trim()) {
    errors.locationId = 'Location is required.'
  }
  if (!input.occurredAt?.trim()) {
    errors.occurredAt = 'Date and time occurred is required.'
  } else {
    const utcTime = parseInputAsUtc(input.occurredAt)
    const parsed = new Date(utcTime).getTime()
    if (isNaN(parsed)) {
      errors.occurredAt = 'Invalid date and time format.'
    } else if (isFutureDateTime(utcTime)) {
      errors.occurredAt = 'Incident occurred time cannot be in the future.'
    }
  }
  if (!input.status?.trim()) {
    errors.status = 'Status is required.'
  }

  return errors
}

/**
 * Validation for Add Document form.
 */
export function validateDocumentInput(input: {
  title?: string
  kind?: string
}): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.title?.trim()) {
    errors.title = 'Document title is required.'
  }
  if (!input.kind?.trim()) {
    errors.kind = 'Document kind is required.'
  }

  return errors
}

/**
 * Validation for Change Lead Investigator.
 */
export function validateLeadInvestigatorInput(
  data: InvestigationData,
  officerId?: string
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!officerId?.trim()) {
    errors.leadInvestigator = 'Please select a lead investigator.'
  } else if (!data.officers.some(o => o.id === officerId)) {
    errors.leadInvestigator = 'Selected officer does not exist.'
  }

  return errors
}

/**
 * Validation for Add Location to case.
 */
export function validateLocationInput(
  _data: InvestigationData,
  input: {
    name?: string
    city?: string
    region?: string
    visitedByPersonId?: string
  }
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.name?.trim()) {
    errors.name = 'Location name is required.'
  }
  if (!input.city?.trim()) {
    errors.city = 'City is required.'
  }
  if (!input.region?.trim()) {
    errors.region = 'Region is required.'
  }
  if (!input.visitedByPersonId?.trim()) {
    errors.visitedByPersonId = 'Select a case person who visited this location.'
  }

  return errors
}

/**
 * Validation for Add Vehicle form.
 */
export function validateVehicleInput(
  data: InvestigationData,
  input: {
    registration?: string
    make?: string
    model?: string
    color?: string
    connections?: Array<{ targetId: string; relationship: string }>
  }
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.registration?.trim()) {
    errors.registration = 'Registration plate number is required.'
  } else if (isDuplicateVehicle(data, input.registration)) {
    errors.registration = 'A vehicle with this registration already exists. Use "Link existing vehicle" instead.'
  }

  if (!input.make?.trim()) {
    errors.make = 'Vehicle make is required.'
  }
  if (!input.model?.trim()) {
    errors.model = 'Vehicle model is required.'
  }
  if (!input.color?.trim()) {
    errors.color = 'Vehicle colour is required.'
  }

  if (!input.connections || input.connections.length === 0) {
    errors.connections = 'A vehicle must be connected to at least one person or incident of this case.'
  }

  return errors
}

/**
 * Validation for Add Connection form.
 */
export function validateConnectionInput(
  data: InvestigationData,
  input: {
    personId?: string
    relationship?: string
    targetId?: string
  }
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.personId?.trim()) {
    errors.personId = 'Person is required.'
  }
  if (!input.relationship?.trim()) {
    errors.relationship = 'Relationship type is required.'
  }
  if (!input.targetId?.trim()) {
    errors.targetId = 'Target entity is required.'
  }

  if (input.relationship && input.targetId) {
    const rel = input.relationship
    const target = input.targetId

    if (rel === 'visited' && !target.startsWith('L-')) {
      errors.targetId = 'A "visited" connection can only target a location.'
    } else if ((rel === 'involved-in' || rel === 'witnessed') && !target.startsWith('I-')) {
      errors.targetId = `A "${rel}" connection can only target an incident.`
    } else if ((rel === 'owns' || rel === 'connected-to') && !target.startsWith('V-')) {
      errors.targetId = `A "${rel}" connection can only target a vehicle.`
    }
  }

  if (input.personId && input.targetId && input.relationship && !errors.targetId) {
    const exists = data.relationships.some(
      r => r.source === input.personId && r.target === input.targetId && r.relationship === input.relationship
    )
    if (exists) {
      errors.targetId = 'This connection already exists.'
    }
  }

  return errors
}

/**
 * Validation for Witness Statement form.
 */
export function validateWitnessStatementInput(
  _data: InvestigationData,
  input: {
    witnessId?: string
    subjectPersonId?: string
    locationId?: string
    claimedTime?: string
    recordedAt?: string
    text?: string
  }
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.witnessId?.trim()) {
    errors.witnessId = 'Witness is required.'
  }
  if (!input.subjectPersonId?.trim()) {
    errors.subjectPersonId = 'Subject person being described is required.'
  }
  if (!input.locationId?.trim()) {
    errors.locationId = 'Location is required.'
  }

  if (!input.claimedTime?.trim()) {
    errors.claimedTime = 'Claimed presence time is required.'
  } else {
    const utcTime = parseInputAsUtc(input.claimedTime)
    if (isNaN(new Date(utcTime).getTime())) {
      errors.claimedTime = 'Invalid date and time.'
    } else if (isFutureDateTime(utcTime)) {
      errors.claimedTime = 'Claimed presence time cannot be in the future.'
    }
  }

  if (!input.recordedAt?.trim()) {
    errors.recordedAt = 'Recording time is required.'
  } else {
    const utcTime = parseInputAsUtc(input.recordedAt)
    if (isNaN(new Date(utcTime).getTime())) {
      errors.recordedAt = 'Invalid date and time.'
    } else if (isFutureDateTime(utcTime)) {
      errors.recordedAt = 'Recording time cannot be in the future.'
    }
  }

  if (!input.text?.trim()) {
    errors.text = 'Statement text is required.'
  }

  return errors
}

/**
 * Validation for Sighting form.
 */
export function validateSightingInput(
  _data: InvestigationData,
  input: {
    source?: string
    action?: string
    locationId?: string
    timestamp?: string
    vehicleId?: string
    personId?: string
    description?: string
  }
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.source?.trim()) {
    errors.source = 'Surveillance source is required.'
  }
  if (!input.action?.trim()) {
    errors.action = 'Action is required.'
  }
  if (!input.locationId?.trim()) {
    errors.locationId = 'Location is required.'
  }

  if (!input.timestamp?.trim()) {
    errors.timestamp = 'Sighting date and time is required.'
  } else {
    const utcTime = parseInputAsUtc(input.timestamp)
    if (isNaN(new Date(utcTime).getTime())) {
      errors.timestamp = 'Invalid date and time.'
    } else if (isFutureDateTime(utcTime)) {
      errors.timestamp = 'Sighting time cannot be in the future.'
    }
  }

  if (!input.vehicleId?.trim() && !input.personId?.trim()) {
    errors.vehicleOrPerson = 'At least one vehicle or person must be specified for the sighting.'
  }

  if (!input.description?.trim()) {
    errors.description = 'Description is required.'
  }

  return errors
}

/**
 * Validation for Phone Record form.
 */
export function validatePhoneRecordInput(
  _data: InvestigationData,
  input: {
    personId?: string
    phoneNumber?: string
    kind?: string
    timestamp?: string
    locationId?: string
    otherNumber?: string
  }
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.personId?.trim()) {
    errors.personId = 'Person is required.'
  }
  if (!input.phoneNumber?.trim()) {
    errors.phoneNumber = 'Phone number is required.'
  }
  if (!input.kind?.trim()) {
    errors.kind = 'Record kind is required.'
  }

  if (!input.timestamp?.trim()) {
    errors.timestamp = 'Timestamp is required.'
  } else {
    const utcTime = parseInputAsUtc(input.timestamp)
    if (isNaN(new Date(utcTime).getTime())) {
      errors.timestamp = 'Invalid date and time.'
    } else if (isFutureDateTime(utcTime)) {
      errors.timestamp = 'Timestamp cannot be in the future.'
    }
  }

  if (input.kind === 'cell-tower') {
    if (!input.locationId?.trim()) {
      errors.locationId = 'Tower location is required for cell-tower records.'
    }
  } else if (input.kind === 'call' || input.kind === 'sms') {
    if (!input.otherNumber?.trim()) {
      errors.otherNumber = 'Other party phone number is required for calls and SMS.'
    }
  }

  return errors
}
