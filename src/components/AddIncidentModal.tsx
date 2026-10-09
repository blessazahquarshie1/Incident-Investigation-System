import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import CreateLocationModal from './CreateLocationModal'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validateIncidentInput, parseInputAsUtc } from '../lib/validation'
import type { Incident, Location, Case } from '../types'

interface AddIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
  defaultType?: Case['type']
}

export default function AddIncidentModal({
  isOpen,
  onClose,
  caseId,
  defaultType = 'other',
}: AddIncidentModalProps) {
  const data = useInvestigationStore(s => s.data)
  const addIncidentToCase = useInvestigationStore(s => s.addIncidentToCase)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Incident['type']>(defaultType)
  const [locationId, setLocationId] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [status, setStatus] = useState<Incident['status']>('unresolved')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false)

  function handleClose() {
    setTitle('')
    setDescription('')
    setType(defaultType)
    setLocationId(data.locations[0]?.id || '')
    setOccurredAt('')
    setStatus('unresolved')
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

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
    const validationErrors = validateIncidentInput(data, {
      title,
      description,
      type,
      locationId,
      occurredAt,
      status,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    addIncidentToCase(caseId, {
      title: title.trim(),
      description: description.trim(),
      type,
      locationId,
      occurredAt: parseInputAsUtc(occurredAt),
      status,
    })

    setSuccessMsg('Incident successfully added to case.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Add Incident to Case">
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
              {successMsg}
            </div>
          )}

          <FormField label="Incident Title" required error={errors.title} htmlFor="inc-title">
            <input
              id="inc-title"
              type="text"
              autoFocus
              placeholder="e.g. Armed robbery at commercial center"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                setErrors(prev => ({ ...prev, title: '' }))
              }}
            />
          </FormField>

          <FormField label="Description" required error={errors.description} htmlFor="inc-desc">
            <textarea
              id="inc-desc"
              rows={3}
              placeholder="Detailed description of what occurred..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                setErrors(prev => ({ ...prev, description: '' }))
              }}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" required error={errors.type} htmlFor="inc-type">
              <select
                id="inc-type"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={type}
                onChange={e => setType(e.target.value as Incident['type'])}
              >
                <option value="theft">Theft</option>
                <option value="fraud">Fraud</option>
                <option value="assault">Assault</option>
                <option value="cybercrime">Cybercrime</option>
                <option value="other">Other</option>
              </select>
            </FormField>

            <FormField label="Status" required error={errors.status} htmlFor="inc-status">
              <select
                id="inc-status"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={status}
                onChange={e => setStatus(e.target.value as Incident['status'])}
              >
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </FormField>
          </div>

          <FormField label="Location" required error={errors.locationId}>
            <EntityPicker
              value={locationId}
              onChange={val => {
                setLocationId(val)
                setErrors(prev => ({ ...prev, locationId: '' }))
              }}
              options={locationOptions}
              placeholder="Select incident location…"
              onCreateNew={() => setIsCreateLocOpen(true)}
              createNewLabel="+ Create new location…"
              error={!!errors.locationId}
            />
          </FormField>

          <FormField
            label="Occurred Date & Time"
            required
            error={errors.occurredAt}
            hint="Parsed in UTC (Ghana Time). Cannot be in the future."
            htmlFor="inc-occurred"
          >
            <input
              id="inc-occurred"
              type="datetime-local"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={occurredAt}
              onChange={e => {
                setOccurredAt(e.target.value)
                setErrors(prev => ({ ...prev, occurredAt: '' }))
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
              Add Incident
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
