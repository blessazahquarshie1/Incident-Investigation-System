import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validateConnectionInput } from '../lib/validation'
import { getCasePeople } from '../lib/caseScope'
import type { InvestigationEdge } from '../types'

interface AddConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
  initialPersonId?: string
}

type AllowedRelationship = 'visited' | 'involved-in' | 'witnessed' | 'owns' | 'connected-to'

export default function AddConnectionModal({
  isOpen,
  onClose,
  caseId,
  initialPersonId = '',
}: AddConnectionModalProps) {
  const data = useInvestigationStore(s => s.data)
  const addConnection = useInvestigationStore(s => s.addConnection)

  const casePeople = useMemo(() => getCasePeople(data, caseId), [data, caseId])

  const [personId, setPersonId] = useState(initialPersonId)
  const [relationship, setRelationship] = useState<AllowedRelationship>('visited')
  const [targetId, setTargetId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  const effectivePersonId = personId || initialPersonId || (casePeople[0]?.id ?? '')

  function handleClose() {
    setPersonId(initialPersonId || (casePeople[0]?.id ?? ''))
    setRelationship('visited')
    setTargetId('')
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

  // Reset target when relationship type category changes
  function handleRelationshipChange(rel: AllowedRelationship) {
    setRelationship(rel)
    setTargetId('')
    setErrors(prev => ({ ...prev, targetId: '', relationship: '' }))
  }

  // Options for Target EntityPicker based on relationship
  const targetOptions = useMemo(() => {
    if (relationship === 'visited') {
      return data.locations.map(loc => ({
        id: loc.id,
        label: `${loc.name} (${loc.city})`,
        subLabel: loc.region,
        type: 'location' as const,
      }))
    }
    if (relationship === 'involved-in' || relationship === 'witnessed') {
      return data.incidents.map(inc => ({
        id: inc.id,
        label: inc.title,
        subLabel: `${inc.id} · ${inc.status}`,
        type: 'incident' as const,
      }))
    }
    if (relationship === 'owns' || relationship === 'connected-to') {
      return data.vehicles.map(v => ({
        id: v.id,
        label: `${v.registration} — ${v.make} ${v.model}`,
        subLabel: v.color,
        type: 'vehicle' as const,
      }))
    }
    return []
  }, [relationship, data])

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
    const validationErrors = validateConnectionInput(data, {
      personId: effectivePersonId,
      relationship,
      targetId,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const edge: InvestigationEdge = {
      source: effectivePersonId,
      target: targetId,
      relationship,
    }

    addConnection(caseId, edge)
    setSuccessMsg('Connection successfully linked.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Connection">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
            {successMsg}
          </div>
        )}

        <FormField label="Case Person" required error={errors.personId}>
          <EntityPicker
            value={effectivePersonId}
            onChange={val => {
              setPersonId(val)
              setErrors(prev => ({ ...prev, personId: '' }))
            }}
            options={personOptions}
            placeholder="Select a person from this case…"
            error={!!errors.personId}
          />
        </FormField>

        <FormField label="Relationship Type" required error={errors.relationship} htmlFor="conn-rel">
          <select
            id="conn-rel"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            value={relationship}
            onChange={e => handleRelationshipChange(e.target.value as AllowedRelationship)}
          >
            <option value="visited">visited (targets Location)</option>
            <option value="involved-in">involved-in (targets Incident)</option>
            <option value="witnessed">witnessed (targets Incident)</option>
            <option value="owns">owns (targets Vehicle)</option>
            <option value="connected-to">connected-to (targets Vehicle)</option>
          </select>
        </FormField>

        <FormField
          label={`Target ${relationship === 'visited' ? 'Location' : relationship === 'owns' || relationship === 'connected-to' ? 'Vehicle' : 'Incident'}`}
          required
          error={errors.targetId}
        >
          <EntityPicker
            value={targetId}
            onChange={val => {
              setTargetId(val)
              setErrors(prev => ({ ...prev, targetId: '' }))
            }}
            options={targetOptions}
            placeholder={`Select target ${relationship === 'visited' ? 'location' : relationship === 'owns' || relationship === 'connected-to' ? 'vehicle' : 'incident'}…`}
            error={!!errors.targetId}
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
            Add Connection
          </button>
        </div>
      </form>
    </Modal>
  )
}
