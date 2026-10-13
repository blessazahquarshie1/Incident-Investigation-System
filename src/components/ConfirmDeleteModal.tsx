import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  entityName?: string
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  entityName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[15px] text-slate-700 leading-normal">
              {message}
            </p>
            {entityName && (
              <p className="text-[14px] font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded p-2">
                {entityName}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

