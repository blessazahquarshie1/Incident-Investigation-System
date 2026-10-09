import React, { useState } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { findExistingLocation } from '../lib/validation'
import type { Location } from '../types'

interface CreateLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (location: Location) => void
}

export default function CreateLocationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateLocationModalProps) {
  const data = useInvestigationStore(s => s.data)
  const createLocation = useInvestigationStore(s => s.createLocation)

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [infoMessage, setInfoMessage] = useState('')

  function handleReset() {
    setName('')
    setCity('')
    setRegion('')
    setErrors({})
    setInfoMessage('')
  }

  function handleClose() {
    handleReset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = 'Location name is required.'
    if (!city.trim()) newErrors.city = 'City is required.'
    if (!region.trim()) newErrors.region = 'Region is required.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Check duplicate
    const existing = findExistingLocation(data, name, city)
    if (existing) {
      setInfoMessage(`Location "${existing.name}, ${existing.city}" already exists. Using existing record.`)
      setTimeout(() => {
        onSuccess(existing)
        handleClose()
      }, 1000)
      return
    }

    const created = createLocation({
      name: name.trim(),
      city: city.trim(),
      region: region.trim(),
    })

    onSuccess(created)
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Location">
      <form onSubmit={handleSubmit} className="space-y-4">
        {infoMessage && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[14px] text-blue-700">
            {infoMessage}
          </div>
        )}

        <FormField label="Location Name" required error={errors.name} htmlFor="loc-name">
          <input
            id="loc-name"
            type="text"
            autoFocus
            placeholder="e.g. Makola Market East Gate"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </FormField>

        <FormField label="City" required error={errors.city} htmlFor="loc-city">
          <input
            id="loc-city"
            type="text"
            placeholder="e.g. Accra"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </FormField>

        <FormField label="Region" required error={errors.region} htmlFor="loc-region">
          <input
            id="loc-region"
            type="text"
            placeholder="e.g. Greater Accra"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            value={region}
            onChange={e => setRegion(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
          >
            Create Location
          </button>
        </div>
      </form>
    </Modal>
  )
}

