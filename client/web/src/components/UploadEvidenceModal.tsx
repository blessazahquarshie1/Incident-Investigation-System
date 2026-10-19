import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import CreateLocationModal from './CreateLocationModal'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getCasePeople } from '../lib/caseScope'
import type { Evidence, Location } from '../types'

interface UploadEvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function UploadEvidenceModal({
  isOpen,
  onClose,
  caseId,
}: UploadEvidenceModalProps) {
  const data = useInvestigationStore(s => s.data)
  const addEvidence = useInvestigationStore(s => s.addEvidence)

  const casePeople = useMemo(() => getCasePeople(data, caseId), [data, caseId])

  const [title, setTitle] = useState('')
  const [type, setType] = useState<Evidence['type']>('document')
  const [description, setDescription] = useState('')
  const [locationId, setLocationId] = useState('')
  const [linkedPersons, setLinkedPersons] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false)

  function handleClose() {
    setTitle('')
    setType('document')
    setDescription('')
    setLocationId('')
    setLinkedPersons([])
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

  function togglePerson(personId: string) {
    setLinkedPersons(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = 'Evidence title is required.'
    if (!description.trim()) newErrors.description = 'Evidence description is required.'
    if (!type) newErrors.type = 'Evidence type is required.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    addEvidence(caseId, {
      title: title.trim(),
      type,
      description: description.trim(),
      locationId: locationId || undefined,
      linkedPersons,
    })

    setSuccessMsg('Evidence successfully uploaded and logged.')
    setTimeout(() => handleClose(), 700)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Upload Evidence">
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
              {successMsg}
            </div>
          )}

          <FormField label="Evidence Title" required error={errors.title} htmlFor="ev-title">
            <input
              id="ev-title"
              type="text"
              autoFocus
              placeholder="e.g. Recovered Safe Box with Cash"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                setErrors(prev => ({ ...prev, title: '' }))
              }}
            />
          </FormField>

          <FormField label="Evidence Type" required error={errors.type} htmlFor="ev-type">
            <select
              id="ev-type"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={type}
              onChange={e => setType(e.target.value as Evidence['type'])}
            >
              <option value="document">Document</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="device">Device</option>
              <option value="vehicle">Vehicle</option>
              <option value="digital">Digital</option>
            </select>
          </FormField>

          <FormField label="Recovery Location" error={errors.locationId}>
            <EntityPicker
              value={locationId}
              onChange={val => setLocationId(val)}
              options={locationOptions}
              placeholder="Select recovery location (optional)…"
              onCreateNew={() => setIsCreateLocOpen(true)}
              createNewLabel="+ Create new location…"
            />
          </FormField>

          <FormField label="Description" required error={errors.description} htmlFor="ev-desc">
            <textarea
              id="ev-desc"
              rows={3}
              placeholder="Physical description, condition, serial numbers, packaging details..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                setErrors(prev => ({ ...prev, description: '' }))
              }}
            />
          </FormField>

          {casePeople.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[14px] font-medium text-slate-700">
                Link to Case Persons
              </label>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1.5 bg-slate-50/50">
                {casePeople.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-1 text-[14px] text-slate-800 hover:bg-white rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={linkedPersons.includes(p.id)}
                      onChange={() => togglePerson(p.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{p.fullName}</span>
                    <span className="text-[12px] text-slate-400 font-mono">({p.type})</span>
                  </label>
                ))}
              </div>
            </div>
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
              Upload Evidence
            </button>
          </div>
        </form>
      </Modal>

      <CreateLocationModal
        isOpen={isCreateLocOpen}
        onClose={() => setIsCreateLocOpen(false)}
        onSuccess={(newLoc: Location) => {
          setLocationId(newLoc.id)
        }}
      />
    </>
  )
}
