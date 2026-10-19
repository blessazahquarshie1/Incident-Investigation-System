import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validateVehicleInput } from '../lib/validation'
import { getCasePeople, getCaseIncidents } from '../lib/caseScope'

interface AddNewVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function AddNewVehicleModal({
  isOpen,
  onClose,
  caseId,
}: AddNewVehicleModalProps) {
  const data = useInvestigationStore(s => s.data)
  const createVehicle = useInvestigationStore(s => s.createVehicle)

  const casePeople = useMemo(() => getCasePeople(data, caseId), [data, caseId])
  const caseIncidents = useMemo(() => getCaseIncidents(data, caseId), [data, caseId])

  const [registration, setRegistration] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [color, setColor] = useState('')
  
  // Person connections: map personId -> 'none' | 'owns' | 'connected-to'
  const [personConnections, setPersonConnections] = useState<Record<string, 'none' | 'owns' | 'connected-to'>>({})
  // Incident connections: set of incidentIds involved in
  const [incidentInvolvements, setIncidentInvolvements] = useState<Set<string>>(new Set())

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  function handleClose() {
    setRegistration('')
    setMake('')
    setModel('')
    setColor('')
    const initialPeople: Record<string, 'none' | 'owns' | 'connected-to'> = {}
    casePeople.forEach(p => {
      initialPeople[p.id] = 'none'
    })
    if (casePeople[0]) {
      initialPeople[casePeople[0].id] = 'owns'
    }
    setPersonConnections(initialPeople)
    setIncidentInvolvements(new Set())
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

  function handlePersonRoleChange(personId: string, role: 'none' | 'owns' | 'connected-to') {
    setPersonConnections(prev => ({
      ...prev,
      [personId]: role,
    }))
    setErrors(prev => ({ ...prev, connections: '' }))
  }

  function toggleIncident(incidentId: string) {
    setIncidentInvolvements(prev => {
      const next = new Set(prev)
      if (next.has(incidentId)) next.delete(incidentId)
      else next.add(incidentId)
      return next
    })
    setErrors(prev => ({ ...prev, connections: '' }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Build connections array
    const connections: Array<{ targetId: string; relationship: 'owns' | 'connected-to' | 'involved-in' }> = []
    
    Object.entries(personConnections).forEach(([pId, role]) => {
      if (role === 'owns' || role === 'connected-to') {
        connections.push({ targetId: pId, relationship: role })
      }
    })

    incidentInvolvements.forEach(incId => {
      connections.push({ targetId: incId, relationship: 'involved-in' })
    })

    const validationErrors = validateVehicleInput(data, {
      registration,
      make,
      model,
      color,
      connections,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    createVehicle(
      caseId,
      {
        registration: registration.trim().toUpperCase(),
        make: make.trim(),
        model: model.trim(),
        color: color.trim(),
      },
      connections
    )

    setSuccessMsg('Vehicle added and linked to case.')
    setTimeout(() => handleClose(), 700)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Vehicle to Case">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
            {successMsg}
          </div>
        )}

        <FormField
          label="Registration Plate Number"
          required
          error={errors.registration}
          hint="e.g. GT-4521-23. Rejects duplicate registrations."
          htmlFor="veh-reg"
        >
          <input
            id="veh-reg"
            type="text"
            autoFocus
            placeholder="GT-4521-23"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-mono uppercase focus:border-blue-500 focus:outline-none"
            value={registration}
            onChange={e => {
              setRegistration(e.target.value.toUpperCase())
              setErrors(prev => ({ ...prev, registration: '' }))
            }}
          />
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Make" required error={errors.make} htmlFor="veh-make">
            <input
              id="veh-make"
              type="text"
              placeholder="Toyota"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={make}
              onChange={e => {
                setMake(e.target.value)
                setErrors(prev => ({ ...prev, make: '' }))
              }}
            />
          </FormField>

          <FormField label="Model" required error={errors.model} htmlFor="veh-model">
            <input
              id="veh-model"
              type="text"
              placeholder="Hilux"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={model}
              onChange={e => {
                setModel(e.target.value)
                setErrors(prev => ({ ...prev, model: '' }))
              }}
            />
          </FormField>

          <FormField label="Colour" required error={errors.color} htmlFor="veh-color">
            <input
              id="veh-color"
              type="text"
              placeholder="Silver"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              value={color}
              onChange={e => {
                setColor(e.target.value)
                setErrors(prev => ({ ...prev, color: '' }))
              }}
            />
          </FormField>
        </div>

        {/* Case Connections Section */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div>
            <span className="block text-[14px] font-medium text-slate-800">
              Connect to this case <span className="text-red-500">*</span>
            </span>
            <p className="text-[13px] text-slate-500">
              A vehicle must be connected to at least one person or incident of this case.
            </p>
          </div>

          {errors.connections && (
            <p className="text-[13px] font-medium text-red-600 leading-tight" role="alert">
              {errors.connections}
            </p>
          )}

          {/* People Connections */}
          {casePeople.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-700">
                Case People Links
              </label>
              <div className="space-y-2 rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 max-h-40 overflow-y-auto">
                {casePeople.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-[14px]">
                    <div className="font-medium text-slate-800">
                      {p.fullName} <span className="text-[12px] text-slate-400">({p.type})</span>
                    </div>
                    <select
                      className="rounded border border-slate-200 px-2 py-1 text-[13px] bg-white focus:outline-none focus:border-blue-500"
                      value={personConnections[p.id] || 'none'}
                      onChange={e =>
                        handlePersonRoleChange(p.id, e.target.value as 'none' | 'owns' | 'connected-to')
                      }
                    >
                      <option value="none">No link</option>
                      <option value="owns">owns</option>
                      <option value="connected-to">connected-to</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incident Involvements */}
          {caseIncidents.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-700">
                Case Incidents Involvement
              </label>
              <div className="space-y-1.5 rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 max-h-32 overflow-y-auto">
                {caseIncidents.map(inc => (
                  <label
                    key={inc.id}
                    className="flex items-center gap-2 text-[14px] text-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={incidentInvolvements.has(inc.id)}
                      onChange={() => toggleIncident(inc.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      {inc.title} <span className="text-[12px] text-slate-400 font-mono">({inc.id})</span>
                    </span>
                    <span className="text-[12px] text-blue-600 font-medium ml-auto">involved-in</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

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
            Add Vehicle
          </button>
        </div>
      </form>
    </Modal>
  )
}
