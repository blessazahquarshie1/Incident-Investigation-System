import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import CreateLocationModal from './CreateLocationModal'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validateSightingInput, parseInputAsUtc } from '../lib/validation'
import type { Sighting, Location } from '../types'

interface AddSightingModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function AddSightingModal({
  isOpen,
  onClose,
  caseId,
}: AddSightingModalProps) {
  const data = useInvestigationStore(s => s.data)
  const addSighting = useInvestigationStore(s => s.addSighting)

  const [source, setSource] = useState<Sighting['source']>('cctv')
  const [action, setAction] = useState<Sighting['action']>('seen')
  const [locationId, setLocationId] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [personId, setPersonId] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false)

  function handleClose() {
    setSource('cctv')
    setAction('seen')
    setLocationId(data.locations[0]?.id || '')
    setTimestamp('')
    setVehicleId('')
    setPersonId('')
    setDescription('')
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

  const personOptions = useMemo(() => {
    return data.persons.map(p => ({
      id: p.id,
      label: p.fullName,
      subLabel: p.type,
      type: 'person' as const,
    }))
  }, [data.persons])

  const vehicleOptions = useMemo(() => {
    return data.vehicles.map(v => ({
      id: v.id,
      label: `${v.registration} — ${v.make} ${v.model}`,
      subLabel: v.color,
      type: 'vehicle' as const,
    }))
  }, [data.vehicles])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validateSightingInput(data, {
      source,
      action,
      locationId,
      timestamp,
      vehicleId: vehicleId || undefined,
      personId: personId || undefined,
      description,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    addSighting(caseId, {
      source,
      action,
      locationId,
      timestamp: parseInputAsUtc(timestamp),
      vehicleId: vehicleId || undefined,
      personId: personId || undefined,
      description: description.trim(),
    })

    setSuccessMsg('Sighting record successfully saved.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Record Surveillance Sighting">
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Source" required error={errors.source} htmlFor="sg-source">
              <select
                id="sg-source"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={source}
                onChange={e => setSource(e.target.value as Sighting['source'])}
              >
                <option value="cctv">CCTV</option>
                <option value="patrol">Patrol</option>
                <option value="anpr">ANPR</option>
                <option value="informant">Informant</option>
              </select>
            </FormField>

            <FormField label="Action" required error={errors.action} htmlFor="sg-action">
              <select
                id="sg-action"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={action}
                onChange={e => setAction(e.target.value as Sighting['action'])}
              >
                <option value="seen">Seen</option>
                <option value="entered">Entered</option>
                <option value="left">Left</option>
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
              placeholder="Select sighting location…"
              onCreateNew={() => setIsCreateLocOpen(true)}
              createNewLabel="+ Create new location…"
              error={!!errors.locationId}
            />
          </FormField>

          <FormField
            label="Sighting Date & Time"
            required
            error={errors.timestamp}
            hint="Parsed in UTC (Ghana Time). Cannot be in the future."
            htmlFor="sg-timestamp"
          >
            <input
              id="sg-timestamp"
              type="datetime-local"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={timestamp}
              onChange={e => {
                setTimestamp(e.target.value)
                setErrors(prev => ({ ...prev, timestamp: '' }))
              }}
            />
          </FormField>

          {errors.vehicleOrPerson && (
            <p className="text-[13px] font-medium text-red-600 leading-tight" role="alert">
              {errors.vehicleOrPerson}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Person Sighted (Optional)" error={errors.personId}>
              <EntityPicker
                value={personId}
                onChange={val => {
                  setPersonId(val)
                  setErrors(prev => ({ ...prev, vehicleOrPerson: '' }))
                }}
                options={personOptions}
                placeholder="Select person (if identified)…"
              />
            </FormField>

            <FormField label="Vehicle Sighted (Optional)" error={errors.vehicleId}>
              <EntityPicker
                value={vehicleId}
                onChange={val => {
                  setVehicleId(val)
                  setErrors(prev => ({ ...prev, vehicleOrPerson: '' }))
                }}
                options={vehicleOptions}
                placeholder="Select vehicle (if identified)…"
              />
            </FormField>
          </div>

          <FormField label="Description" required error={errors.description} htmlFor="sg-desc">
            <textarea
              id="sg-desc"
              rows={3}
              placeholder="Provide context, camera ID, direction of travel, etc."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                setErrors(prev => ({ ...prev, description: '' }))
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
              Record Sighting
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
