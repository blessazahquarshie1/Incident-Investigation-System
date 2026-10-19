import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getCasePeople, getCaseLocations, getCaseIncidents, getCaseVehicles } from '../lib/caseScope'
import { validateConnectionInput } from '../lib/validation'
import { getVehicleOwner } from '../lib/lookup'
import { buildGraph, getNeighbors, getNodeEdges } from '../lib/graph'
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
  const [pendingOwnerConflict, setPendingOwnerConflict] = useState<{
    vehicleReg: string
    currentOwnerName: string
    newPersonName: string
    edge: InvestigationEdge
  } | null>(null)

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
      const caseLocations = getCaseLocations(data, caseId)
      const list = caseLocations.length > 0 ? caseLocations : data.locations
      return list.map(loc => ({
        id: loc.id,
        label: `${loc.name} (${loc.city})`,
        subLabel: loc.region,
        type: 'location' as const,
      }))
    }
    if (relationship === 'involved-in' || relationship === 'witnessed') {
      const caseIncidents = getCaseIncidents(data, caseId)
      const list = caseIncidents.length > 0 ? caseIncidents : data.incidents
      return list.map(inc => ({
        id: inc.id,
        label: inc.title,
        subLabel: `${inc.id} · ${inc.status}`,
        type: 'incident' as const,
      }))
    }
    if (relationship === 'owns' || relationship === 'connected-to') {
      const caseVehicles = getCaseVehicles(data, caseId)
      const list = caseVehicles.length > 0 ? caseVehicles : data.vehicles
      return list.map(v => ({
        id: v.id,
        label: `${v.registration} — ${v.make} ${v.model}`,
        subLabel: v.color,
        type: 'vehicle' as const,
      }))
    }
    return []
  }, [relationship, data, caseId])

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

    if (relationship === 'owns' && targetId.startsWith('V-')) {
      const currentOwner = getVehicleOwner(data, targetId)
      if (currentOwner && currentOwner.id !== effectivePersonId) {
        const veh = data.vehicles.find(v => v.id === targetId)
        const person = data.persons.find(p => p.id === effectivePersonId)
        setPendingOwnerConflict({
          vehicleReg: veh?.registration ?? targetId,
          currentOwnerName: currentOwner.fullName,
          newPersonName: person?.fullName ?? effectivePersonId,
          edge,
        })
        return
      }
    }

    addConnection(caseId, edge)
    setSuccessMsg('Connection successfully linked.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <>
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

          {/* Current links for the selected person */}
          {(() => {
            if (!effectivePersonId) return null
            const graph = buildGraph(data)
            const neighbors = getNeighbors(graph, effectivePersonId)
            const edges = getNodeEdges(graph, effectivePersonId)
            if (neighbors.length === 0) return null

            return (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 space-y-1 text-[13px]">
                <p className="font-semibold text-slate-700">Currently linked to:</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {neighbors.map(nid => {
                    const edge = edges.find(e => e.source === nid || e.target === nid)
                    const label = graph.nodes.find(n => n.id === nid)?.label ?? nid
                    return (
                      <span key={nid} className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-2 py-0.5 text-slate-700 font-medium">
                        {label} <span className="text-slate-400 font-normal italic">({edge?.relationship})</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })()}

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

      <ConfirmDeleteModal
        isOpen={Boolean(pendingOwnerConflict)}
        onClose={() => setPendingOwnerConflict(null)}
        onConfirm={() => {
          if (pendingOwnerConflict) {
            addConnection(caseId, pendingOwnerConflict.edge)
            setSuccessMsg('Connection successfully linked.')
            setPendingOwnerConflict(null)
            setTimeout(() => handleClose(), 700)
          }
        }}
        title="Change Vehicle Owner"
        message={
          pendingOwnerConflict
            ? `${pendingOwnerConflict.vehicleReg} is already owned by ${pendingOwnerConflict.currentOwnerName}. Make ${pendingOwnerConflict.newPersonName} the owner? ${pendingOwnerConflict.currentOwnerName} will become 'connected to' the vehicle.`
            : ''
        }
        confirmText="Change Owner"
        cancelText="Cancel"
      />
    </>
  )
}
