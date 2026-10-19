import React from 'react'

export interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

/**
 * Standard reusable FormField component providing accessible label,
 * required indicator (*), hint text, and inline error feedback.
 */
export default function FormField({
  label,
  required = false,
  hint,
  error,
  children,
  htmlFor,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="block text-[14px] font-medium text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500 font-bold" title="Required field" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>

      {hint && (
        <p className="text-[13px] text-slate-500 leading-normal">
          {hint}
        </p>
      )}

      <div className="mt-1">{children}</div>

      {error && (
        <p className="text-[13px] font-medium text-red-600 leading-tight" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

