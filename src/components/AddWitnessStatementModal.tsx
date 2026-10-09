import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import CreateLocationModal from './CreateLocationModal'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validateWitnessStatementInput, parseInputAsUtc } from '../lib/validation'
import { getCasePeople } from '../lib/caseScope'
import type { Location } from '../types'

interface AddWitnessStatementModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function AddWitnessStatementModal({
  isOpen,
  onClose,
  caseId,
}: AddWitnessStatementModalProps) {
  const data = useInvestigationStore(s => s.data)
  const addWitnessStatement = useInvestigationStore(s => s.addWitnessStatement)

  const casePeople = useMemo(() => getCasePeople(data, caseId), [data, caseId])

  const [witnessId, setWitnessId] = useState('')
  const [subjectPersonId, setSubjectPersonId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [claimedTime, setClaimedTime] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false)

  function handleClose() {
    setWitnessId('')
    setSubjectPersonId('')
    setLocationId('')
    setClaimedTime('')
    const now = new Date()
    setRecordedAt(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
    setText('')
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

  const effectiveWitnessId = witnessId || (casePeople.find(p => p.type === 'witness')?.id || casePeople[0]?.id || '')
  const effectiveSubjectId = subjectPersonId || (casePeople.find(p => p.type === 'suspect')?.id || '')
  const effectiveLocationId = locationId || (data.locations[0]?.id || '')

  const personOptions = useMemo(() => {
    return data.persons.map(p => ({
      id: p.id,
      label: p.fullName,
      subLabel: `${p.type}${casePeople.some(cp => cp.id === p.id) ? ' · Case member' : ''}`,
      type: 'person' as const,
    }))
  }, [data.persons, casePeople])

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
    const validationErrors = validateWitnessStatementInput(data, {
      witnessId: effectiveWitnessId,
      subjectPersonId: effectiveSubjectId,
      locationId: effectiveLocationId,
      claimedTime,
      recordedAt,
      text,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    addWitnessStatement(caseId, {
      witnessId: effectiveWitnessId,
      subjectPersonId: effectiveSubjectId,
      locationId: effectiveLocationId,
      claimedTime: parseInputAsUtc(claimedTime),
      recordedAt: parseInputAsUtc(recordedAt),
      text: text.trim(),
    })

    setSuccessMsg('Witness statement successfully recorded.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Record Witness Statement">
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
              {successMsg}
            </div>
          )}

          <FormField label="Witness" required error={errors.witnessId}>
            <EntityPicker
              value={effectiveWitnessId}
              onChange={val => {
                setWitnessId(val)
                setErrors(prev => ({ ...prev, witnessId: '' }))
              }}
              options={personOptions}
              placeholder="Select witness…"
              error={!!errors.witnessId}
            />
          </FormField>

          <FormField label="Subject Person (Person being described)" required error={errors.subjectPersonId}>
            <EntityPicker
              value={effectiveSubjectId}
              onChange={val => {
                setSubjectPersonId(val)
                setErrors(prev => ({ ...prev, subjectPersonId: '' }))
              }}
              options={personOptions}
              placeholder="Select subject person…"
              error={!!errors.subjectPersonId}
            />
          </FormField>

          <FormField label="Location" required error={errors.locationId}>
            <EntityPicker
              value={effectiveLocationId}
              onChange={val => {
                setLocationId(val)
                setErrors(prev => ({ ...prev, locationId: '' }))
              }}
              options={locationOptions}
              placeholder="Select location where person was seen…"
              onCreateNew={() => setIsCreateLocOpen(true)}
              createNewLabel="+ Create new location…"
              error={!!errors.locationId}
            />
          </FormField>

          <FormField
            label="Claimed Time (When the witness says the person was there)"
            required
            error={errors.claimedTime}
            hint="Parsed in UTC (Ghana Time). Cannot be in the future."
            htmlFor="ws-claimed-time"
          >
            <input
              id="ws-claimed-time"
              type="datetime-local"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={claimedTime}
              onChange={e => {
                setClaimedTime(e.target.value)
                setErrors(prev => ({ ...prev, claimedTime: '' }))
              }}
            />
          </FormField>

          <FormField
            label="Recorded Time (When statement was taken)"
            required
            error={errors.recordedAt}
            hint="Parsed in UTC (Ghana Time). Cannot be in the future."
            htmlFor="ws-recorded-at"
          >
            <input
              id="ws-recorded-at"
              type="datetime-local"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={recordedAt}
              onChange={e => {
                setRecordedAt(e.target.value)
                setErrors(prev => ({ ...prev, recordedAt: '' }))
              }}
            />
          </FormField>

          <FormField label="Statement Text" required error={errors.text} htmlFor="ws-text">
            <textarea
              id="ws-text"
              rows={3}
              placeholder="Enter what the witness reported..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={text}
              onChange={e => {
                setText(e.target.value)
                setErrors(prev => ({ ...prev, text: '' }))
              }}
            />
          </FormField>

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
              Record Statement
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
