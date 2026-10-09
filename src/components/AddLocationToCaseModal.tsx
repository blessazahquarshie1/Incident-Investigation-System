import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { findExistingLocation } from '../lib/validation'
import { getCasePeople } from '../lib/caseScope'

interface AddLocationToCaseModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function AddLocationToCaseModal({
  isOpen,
  onClose,
  caseId,
}: AddLocationToCaseModalProps) {
  const data = useInvestigationStore(s => s.data)
  const createLocation = useInvestigationStore(s => s.createLocation)
  const addVisitedLocation = useInvestigationStore(s => s.addVisitedLocation)

  const casePeople = useMemo(() => getCasePeople(data, caseId), [data, caseId])

  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [existingLocationId, setExistingLocationId] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [visitedByPersonId, setVisitedByPersonId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  function handleClose() {
    setMode('existing')
    setExistingLocationId(data.locations[0]?.id || '')
    setName('')
    setCity('')
    setRegion('')
    setVisitedByPersonId(casePeople[0]?.id || '')
    setErrors({})
    setSuccessMsg('')
    setInfoMsg('')
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
    return casePeople.map(p => ({
      id: p.id,
      label: p.fullName,
      subLabel: p.type,
      type: 'person' as const,
    }))
  }, [casePeople])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!visitedByPersonId) {
      newErrors.visitedByPersonId = 'Select a case person who visited this location.'
    }

    if (mode === 'existing') {
      if (!existingLocationId) {
        newErrors.existingLocationId = 'Select a location.'
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      addVisitedLocation(caseId, existingLocationId, visitedByPersonId)
      setSuccessMsg('Location linked to case via person visit.')
      setTimeout(() => handleClose(), 700)
    } else {
      if (!name.trim()) newErrors.name = 'Location name is required.'
      if (!city.trim()) newErrors.city = 'City is required.'
      if (!region.trim()) newErrors.region = 'Region is required.'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      // Check duplicate
      const existing = findExistingLocation(data, name, city)
      let finalLocationId = ''

      if (existing) {
        setInfoMsg(`Location "${existing.name}, ${existing.city}" already exists. Using existing record.`)
        finalLocationId = existing.id
      } else {
        const created = createLocation({
          name: name.trim(),
          city: city.trim(),
          region: region.trim(),
        })
        finalLocationId = created.id
      }

      addVisitedLocation(caseId, finalLocationId, visitedByPersonId)
      setSuccessMsg('Location saved and linked to case.')
      setTimeout(() => handleClose(), 800)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Location to Case">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
            {successMsg}
          </div>
        )}
        {infoMsg && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[14px] text-blue-700">
            {infoMsg}
          </div>
        )}

        <div className="flex gap-4 border-b border-slate-200 pb-3">
          <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-slate-800">
            <input
              type="radio"
              name="loc-mode"
              checked={mode === 'existing'}
              onChange={() => setMode('existing')}
              className="text-blue-600 focus:ring-blue-500"
            />
            Link existing location
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-slate-800">
            <input
              type="radio"
              name="loc-mode"
              checked={mode === 'new'}
              onChange={() => setMode('new')}
              className="text-blue-600 focus:ring-blue-500"
            />
            Create new location
          </label>
        </div>

        {mode === 'existing' ? (
          <FormField label="Select Location" required error={errors.existingLocationId}>
            <EntityPicker
              value={existingLocationId}
              onChange={val => {
                setExistingLocationId(val)
                setErrors(prev => ({ ...prev, existingLocationId: '' }))
              }}
              options={locationOptions}
              placeholder="Select location from registry…"
              error={!!errors.existingLocationId}
            />
          </FormField>
        ) : (
          <>
            <FormField label="Location Name" required error={errors.name} htmlFor="case-loc-name">
              <input
                id="case-loc-name"
                type="text"
                autoFocus
                placeholder="e.g. Accra Mall Parking Lot"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setErrors(prev => ({ ...prev, name: '' }))
                }}
              />
            </FormField>

            <FormField label="City" required error={errors.city} htmlFor="case-loc-city">
              <input
                id="case-loc-city"
                type="text"
                placeholder="e.g. Accra"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={city}
                onChange={e => {
                  setCity(e.target.value)
                  setErrors(prev => ({ ...prev, city: '' }))
                }}
              />
            </FormField>

            <FormField label="Region" required error={errors.region} htmlFor="case-loc-region">
              <input
                id="case-loc-region"
                type="text"
                placeholder="e.g. Greater Accra"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={region}
                onChange={e => {
                  setRegion(e.target.value)
                  setErrors(prev => ({ ...prev, region: '' }))
                }}
              />
            </FormField>
          </>
        )}

        <FormField
          label="Case Person Who Visited This Location"
          required
          error={errors.visitedByPersonId}
          hint="Every case location must be connected to at least one person in the case."
        >
          <EntityPicker
            value={visitedByPersonId}
            onChange={val => {
              setVisitedByPersonId(val)
              setErrors(prev => ({ ...prev, visitedByPersonId: '' }))
            }}
            options={personOptions}
            placeholder="Select case person who visited…"
            error={!!errors.visitedByPersonId}
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
            {mode === 'existing' ? 'Link Location' : 'Create & Link Location'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
