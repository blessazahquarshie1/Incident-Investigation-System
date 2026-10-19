import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getCasePeople } from '../lib/caseScope'
import type { Person } from '../types'

interface AddPersonModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function AddPersonModal({
  isOpen,
  onClose,
  caseId,
}: AddPersonModalProps) {
  const data = useInvestigationStore(s => s.data)
  const addPersonToCase = useInvestigationStore(s => s.addPersonToCase)
  const createPersonForCase = useInvestigationStore(s => s.createPersonForCase)

  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [existingPersonId, setExistingPersonId] = useState('')
  const [fullName, setFullName] = useState('')
  const [type, setType] = useState<Person['type']>('suspect')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  const casePeople = useMemo(() => getCasePeople(data, caseId), [data, caseId])
  const casePeopleIds = useMemo(() => new Set(casePeople.map(p => p.id)), [casePeople])

  // Non-case persons available to link
  const availablePersons = useMemo(() => {
    return data.persons
      .filter(p => !casePeopleIds.has(p.id))
      .map(p => ({
        id: p.id,
        label: p.fullName,
        subLabel: `${p.type}${p.phone ? ` · ${p.phone}` : ''}`,
        type: 'person' as const,
      }))
  }, [data.persons, casePeopleIds])

  function handleClose() {
    setMode(availablePersons.length > 0 ? 'existing' : 'new')
    setExistingPersonId(availablePersons[0]?.id || '')
    setFullName('')
    setType('suspect')
    setPhone('')
    setAddress('')
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (mode === 'existing') {
      const targetId = existingPersonId || availablePersons[0]?.id
      if (!targetId) {
        setErrors({ existingPersonId: 'Please select a person to add to the case.' })
        return
      }
      addPersonToCase(caseId, targetId)
      setSuccessMsg('Person added to case.')
      setTimeout(() => handleClose(), 700)
    } else {
      const newErrors: Record<string, string> = {}
      if (!fullName.trim()) newErrors.fullName = 'Full name is required.'
      if (!type) newErrors.type = 'Person type is required.'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      createPersonForCase(caseId, {
        fullName: fullName.trim(),
        type,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      })

      setSuccessMsg('New person created and added to case.')
      setTimeout(() => handleClose(), 700)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Person to Case">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
            {successMsg}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-4 border-b border-slate-200 pb-3">
          <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-slate-800">
            <input
              type="radio"
              name="person-mode"
              checked={mode === 'existing'}
              onChange={() => setMode('existing')}
              disabled={availablePersons.length === 0}
              className="text-blue-600 focus:ring-blue-500"
            />
            Link existing person ({availablePersons.length} available)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-slate-800">
            <input
              type="radio"
              name="person-mode"
              checked={mode === 'new'}
              onChange={() => setMode('new')}
              className="text-blue-600 focus:ring-blue-500"
            />
            Create new person
          </label>
        </div>

        {mode === 'existing' ? (
          <FormField label="Select Person" required error={errors.existingPersonId}>
            <EntityPicker
              value={existingPersonId}
              onChange={val => {
                setExistingPersonId(val)
                setErrors(prev => ({ ...prev, existingPersonId: '' }))
              }}
              options={availablePersons}
              placeholder="Select person from registry…"
              error={!!errors.existingPersonId}
            />
          </FormField>
        ) : (
          <>
            <FormField label="Full Name" required error={errors.fullName} htmlFor="new-p-name">
              <input
                id="new-p-name"
                type="text"
                autoFocus
                placeholder="e.g. Samuel Yaw Donkor"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={fullName}
                onChange={e => {
                  setFullName(e.target.value)
                  setErrors(prev => ({ ...prev, fullName: '' }))
                }}
              />
            </FormField>

            <FormField label="Person Type / Role" required error={errors.type} htmlFor="new-p-type">
              <select
                id="new-p-type"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={type}
                onChange={e => setType(e.target.value as Person['type'])}
              >
                <option value="suspect">Suspect</option>
                <option value="witness">Witness</option>
                <option value="victim">Victim</option>
                <option value="person-of-interest">Person of Interest</option>
              </select>
            </FormField>

            <FormField label="Phone Number (Optional)" htmlFor="new-p-phone">
              <input
                id="new-p-phone"
                type="text"
                placeholder="e.g. 0244123456"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </FormField>

            <FormField label="Address (Optional)" htmlFor="new-p-addr">
              <input
                id="new-p-addr"
                type="text"
                placeholder="e.g. Ring Road Central, Accra"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </FormField>
          </>
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
            {mode === 'existing' ? 'Link Person' : 'Create & Link Person'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
