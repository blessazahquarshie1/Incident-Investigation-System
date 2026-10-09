import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import CreateLocationModal from './CreateLocationModal'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validatePhoneRecordInput, parseInputAsUtc } from '../lib/validation'
import type { PhoneRecord, Location } from '../types'

interface AddPhoneRecordModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function AddPhoneRecordModal({
  isOpen,
  onClose,
  caseId,
}: AddPhoneRecordModalProps) {
  const data = useInvestigationStore(s => s.data)
  const addPhoneRecord = useInvestigationStore(s => s.addPhoneRecord)

  const [personId, setPersonId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [kind, setKind] = useState<PhoneRecord['kind']>('call')
  const [timestamp, setTimestamp] = useState('')
  const [locationId, setLocationId] = useState('')
  const [otherNumber, setOtherNumber] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false)

  function handleClose() {
    const firstPerson = data.persons[0]
    setPersonId(firstPerson?.id || '')
    setPhoneNumber(firstPerson?.phone || '')
    setKind('call')
    setTimestamp('')
    setLocationId('')
    setOtherNumber('')
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

  function handlePersonChange(newPersonId: string) {
    setPersonId(newPersonId)
    const person = data.persons.find(p => p.id === newPersonId)
    if (person?.phone) {
      setPhoneNumber(person.phone)
    }
    setErrors(prev => ({ ...prev, personId: '' }))
  }

  const personOptions = useMemo(() => {
    return data.persons.map(p => ({
      id: p.id,
      label: p.fullName,
      subLabel: p.phone ? `${p.type} · ${p.phone}` : p.type,
      type: 'person' as const,
    }))
  }, [data.persons])

  const locationOptions = useMemo(() => {
    return data.locations.map(loc => ({
      id: loc.id,
      label: `${loc.name} (${loc.city})`,
      subLabel: loc.region,
      type: 'location' as const,
    }))
  }, [data.locations])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validatePhoneRecordInput(data, {
      personId,
      phoneNumber,
      kind,
      timestamp,
      locationId: kind === 'cell-tower' ? locationId : undefined,
      otherNumber: kind !== 'cell-tower' ? otherNumber : undefined,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    addPhoneRecord(caseId, {
      personId,
      phoneNumber: phoneNumber.trim(),
      kind,
      timestamp: parseInputAsUtc(timestamp),
      locationId: kind === 'cell-tower' ? locationId : undefined,
      otherNumber: kind !== 'cell-tower' ? otherNumber.trim() : undefined,
    })

    setSuccessMsg('Phone record successfully saved.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Record Phone Activity">
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
              {successMsg}
            </div>
          )}

          <FormField label="Person" required error={errors.personId}>
            <EntityPicker
              value={personId}
              onChange={handlePersonChange}
              options={personOptions}
              placeholder="Select person for phone record…"
              error={!!errors.personId}
            />
          </FormField>

          <FormField label="Phone Number" required error={errors.phoneNumber} htmlFor="pr-phone">
            <input
              id="pr-phone"
              type="text"
              placeholder="e.g. 0244123456"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value)
                setErrors(prev => ({ ...prev, phoneNumber: '' }))
              }}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Record Kind" required error={errors.kind} htmlFor="pr-kind">
              <select
                id="pr-kind"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={kind}
                onChange={e => {
                  setKind(e.target.value as PhoneRecord['kind'])
                  setErrors(prev => ({ ...prev, kind: '', locationId: '', otherNumber: '' }))
                }}
              >
                <option value="call">Call</option>
                <option value="sms">SMS</option>
                <option value="cell-tower">Cell Tower</option>
              </select>
            </FormField>

            <FormField
              label="Timestamp"
              required
              error={errors.timestamp}
              hint="Parsed in UTC (Ghana Time). Cannot be in the future."
              htmlFor="pr-timestamp"
            >
              <input
                id="pr-timestamp"
                type="datetime-local"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={timestamp}
                onChange={e => {
                  setTimestamp(e.target.value)
                  setErrors(prev => ({ ...prev, timestamp: '' }))
                }}
              />
            </FormField>
          </div>

          {kind === 'cell-tower' ? (
            <FormField label="Cell Tower Location" required error={errors.locationId}>
              <EntityPicker
                value={locationId}
                onChange={val => {
                  setLocationId(val)
                  setErrors(prev => ({ ...prev, locationId: '' }))
                }}
                options={locationOptions}
                placeholder="Select cell tower location…"
                onCreateNew={() => setIsCreateLocOpen(true)}
                createNewLabel="+ Create new location…"
                error={!!errors.locationId}
              />
            </FormField>
          ) : (
            <FormField
              label="Other Party Phone Number"
              required
              error={errors.otherNumber}
              htmlFor="pr-other-number"
            >
              <input
                id="pr-other-number"
                type="text"
                placeholder="e.g. 0501234567 or 191"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={otherNumber}
                onChange={e => {
                  setOtherNumber(e.target.value)
                  setErrors(prev => ({ ...prev, otherNumber: '' }))
                }}
              />
            </FormField>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
            >
              Record Phone Event
            </button>
          </div>
        </form>
      </Modal>

      <CreateLocationModal
        isOpen={isCreateLocOpen}
        onClose={() => setIsCreateLocOpen(false)}
        onSuccess={(newLoc: Location) => {
          setLocationId(newLoc.id)
          setErrors(prev => ({ ...prev, locationId: '' }))
        }}
      />
    </>
  )
}
