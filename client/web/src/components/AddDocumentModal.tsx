import React, { useState } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { validateDocumentInput } from '../lib/validation'
import type { CaseDocument } from '../types'

interface AddDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export default function AddDocumentModal({
  isOpen,
  onClose,
  caseId,
}: AddDocumentModalProps) {
  const addDocumentToCase = useInvestigationStore(s => s.addDocumentToCase)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<CaseDocument['kind']>('report')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  function handleClose() {
    setTitle('')
    setKind('report')
    setErrors({})
    setSuccessMsg('')
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validateDocumentInput({ title, kind })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    addDocumentToCase(caseId, {
      title: title.trim(),
      kind,
    })

    setSuccessMsg('Document successfully added to case.')
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Document to Case">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
            {successMsg}
          </div>
        )}

        <FormField label="Document Title" required error={errors.title} htmlFor="doc-title">
          <input
            id="doc-title"
            type="text"
            autoFocus
            placeholder="e.g. Initial Crime Scene Report"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              setErrors(prev => ({ ...prev, title: '' }))
            }}
          />
        </FormField>

        <FormField label="Document Kind" required error={errors.kind} htmlFor="doc-kind">
          <select
            id="doc-kind"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            value={kind}
            onChange={e => setKind(e.target.value as CaseDocument['kind'])}
          >
            <option value="report">Report</option>
            <option value="warrant">Warrant</option>
            <option value="statement">Statement</option>
            <option value="court-order">Court Order</option>
            <option value="other">Other</option>
          </select>
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
            Add Document
          </button>
        </div>
      </form>
    </Modal>
  )
}
