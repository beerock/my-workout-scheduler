'use client'

import { useState, useEffect } from 'react'
import {
  getEmailTemplatePreview,
  getAllTemplateTypes,
  type EmailTemplateType,
  type TemplateInfo,
} from '@/app/actions/email-preview'

type TemplateListItem = {
  type: EmailTemplateType
  name: string
  severity: string
}

export default function EmailPreviewPage() {
  const [templateTypes, setTemplateTypes] = useState<TemplateListItem[]>([])
  const [selectedType, setSelectedType] = useState<EmailTemplateType>('welcome')
  const [template, setTemplate] = useState<TemplateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [copySuccess, setCopySuccess] = useState(false)

  // Load template types on mount
  useEffect(() => {
    getAllTemplateTypes().then(setTemplateTypes)
  }, [])

  // Load selected template
  useEffect(() => {
    setLoading(true)
    getEmailTemplatePreview(selectedType)
      .then(setTemplate)
      .finally(() => setLoading(false))
  }, [selectedType])

  const handleCopyHtml = async () => {
    if (template?.html) {
      await navigator.clipboard.writeText(template.html)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-orange-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Email Template Preview
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Preview notification emails with Design System v2
            </p>
          </div>
          <a
            href="/prototype"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Prototype Hub
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Template Selector */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-medium text-gray-900 mb-3">Templates</h2>
              <div className="space-y-1">
                {templateTypes.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedType === t.type
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${getSeverityColor(t.severity)}`}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Info */}
            {template && (
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Email Details</h3>
                <dl className="text-sm space-y-2">
                  <div>
                    <dt className="text-gray-500">Subject</dt>
                    <dd className="text-gray-900 font-mono text-xs mt-0.5 break-words">
                      {template.subject}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Severity</dt>
                    <dd className="text-gray-900 capitalize">{template.severity}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">View Mode</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    viewMode === 'desktop'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    viewMode === 'mobile'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Copy HTML Button */}
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Export</h3>
              <button
                onClick={handleCopyHtml}
                disabled={!template}
                className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
              >
                {copySuccess ? 'Copied!' : 'Copy HTML'}
              </button>
            </div>

            {/* Send Test Button */}
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Send Test Email</h3>
              <p className="text-sm text-gray-500 mb-3">
                Run this command to send a real test email:
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                npx tsx test-notification-emails.ts your@email.com
              </code>
            </div>
          </div>

          {/* Email Preview */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Email Header Bar */}
              {template && (
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Subject:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {template.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">From:</span>
                    <span className="text-sm text-gray-700">
                      My Workout Scheduler &lt;noreply@beerock.com&gt;
                    </span>
                  </div>
                </div>
              )}

              {/* Email Content */}
              {loading ? (
                <div className="flex items-center justify-center h-[700px] bg-gray-50">
                  <div className="text-gray-500">Loading template...</div>
                </div>
              ) : template ? (
                <div
                  className={`flex justify-center bg-gray-200 ${
                    viewMode === 'mobile' ? 'p-4' : ''
                  }`}
                >
                  <iframe
                    srcDoc={template.html}
                    className={`border-0 bg-white transition-all duration-300 ${
                      viewMode === 'mobile'
                        ? 'w-[375px] h-[700px] shadow-xl rounded-lg'
                        : 'w-full h-[700px]'
                    }`}
                    title="Email Preview"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[700px] bg-gray-50">
                  <div className="text-gray-500">Select a template to preview</div>
                </div>
              )}
            </div>

            {/* Supabase Templates Link */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-1">
                Supabase Auth Email Templates
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                Need to update Supabase auth emails (verify, reset password, etc.)?
              </p>
              <a
                href="/docs/SUPABASE_EMAIL_TEMPLATES.md"
                target="_blank"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View copy-paste templates in docs/SUPABASE_EMAIL_TEMPLATES.md
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
