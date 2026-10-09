import React, { useState, useMemo } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import EntityPicker from './EntityPicker'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validateLeadInvestigatorInput } from '../lib/validation'

interface ChangeLeadInvestigatorModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
  currentLeadId: string
}

export default function ChangeLeadInvestigatorModal({
  isOpen,
  onClose,
  caseId,
  currentLeadId,
}: ChangeLeadInvestigatorModalProps) {
  const data = useInvestigationStore(s => s.data)
  const changeLeadInvestigator = useInvestigationStore(s => s.changeLeadInvestigator)

  const [officerId, setOfficerId] = useState(currentLeadId)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  function handleClose() {
    setOfficerId(currentLeadId)
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

  const officerOptions = useMemo(() => {
    return data.officers.map(off => ({
      id: off.id,
      label: `${off.rank} ${off.fullName}`,
      subLabel: `${off.badgeNumber} · ${off.department}`,
      type: 'officer' as const,
    }))
  }, [data.officers])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validateLeadInvestigatorInput(data, officerId)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    changeLeadInvestigator(caseId, officerId)
    setSuccessMsg('Lead investigator successfully changed.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Lead Investigator">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
            {successMsg}
          </div>
        )}

        <FormField label="Assign Lead Investigator" required error={errors.leadInvestigator}>
          <EntityPicker
            value={officerId}
            onChange={val => {
              setOfficerId(val)
              setErrors(prev => ({ ...prev, leadInvestigator: '' }))
            }}
            options={officerOptions}
            placeholder="Select officer to lead this case…"
            error={!!errors.leadInvestigator}
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
            Save Lead Investigator
          </button>
        </div>
      </form>
    </Modal>
  )
}
