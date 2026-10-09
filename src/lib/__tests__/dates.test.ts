import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDateTime } from '../dates'

describe('dates utility', () => {
  it('formatDate formats day, month abbreviation, and year', () => {
    expect(formatDate('2026-09-15T17:30:00Z')).toBe('15 Sep 2026')
    expect(formatDate('2026-01-01T00:00:00Z')).toBe('01 Jan 2026')
  })

  it('formatTime formats 12-hour time with lowercased am/pm', () => {
    expect(formatTime('2026-09-15T17:30:00Z')).toBe('5:30pm')
    expect(formatTime('2026-09-14T08:31:00Z')).toBe('8:31am')
    expect(formatTime('2026-01-01T00:00:00Z')).toBe('12:00am')
  })

  it('formatDateTime formats date and time with "at"', () => {
    expect(formatDateTime('2026-09-15T17:30:00Z')).toBe('15 Sep 2026 at 5:30pm')
    expect(formatDateTime('2026-09-14T08:31:00Z')).toBe('14 Sep 2026 at 8:31am')
  })

  it('handles invalid date input gracefully', () => {
    expect(formatDate('invalid-date')).toBe('invalid-date')
    expect(formatTime('invalid-date')).toBe('invalid-date')
    expect(formatDateTime('invalid-date')).toBe('invalid-date')
  })
})

