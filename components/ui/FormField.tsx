import React from 'react'

export interface FormFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  helperText?: string
  children: React.ReactNode
  className?: string
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      htmlFor,
      required = false,
      error,
      helperText,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for helper text and error message
    const helperTextId = helperText ? `${htmlFor}-helper` : undefined
    const errorId = error ? `${htmlFor}-error` : undefined

    return (
      <div ref={ref} className={`space-y-2 ${className}`} {...props}>
        {/* Label */}
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-danger-500 ml-1" aria-label="required">*</span>}
        </label>

        {/* Input element (passed as children) */}
        {/* Clone children to add aria attributes */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              'aria-required': required || undefined,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': [helperTextId, errorId]
                .filter(Boolean)
                .join(' ') || undefined,
            })
          }
          return child
        })}

        {/* Helper text */}
        {helperText && !error && (
          <p id={helperTextId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-danger-500 flex items-start">
            <svg
              className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
