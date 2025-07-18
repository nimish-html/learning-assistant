/**
 * Save Results Button Component
 * 
 * A conditional save button that appears after question generation for authenticated users.
 * Provides a save dialog with title input and handles loading states and feedback.
 */

'use client'

import React, { useState } from 'react'
import { Save, X, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { SavedResultsService } from '@/lib/saved-results-service'
import type { Question, SaveResultsPayload, SavedResultMetadata, SavedResult } from '@/lib/schema'

interface SaveResultsButtonProps {
  questions: Question[]
  metadata: SavedResultMetadata
  onSaveSuccess?: (savedResult: SavedResult) => void
  className?: string
}

interface SaveState {
  isOpen: boolean
  isSaving: boolean
  title: string
  error: string | null
  success: boolean
}

export default function SaveResultsButton({
  questions,
  metadata,
  onSaveSuccess,
  className = ''
}: SaveResultsButtonProps) {
  const { user } = useAuth()
  const [saveState, setSaveState] = useState<SaveState>({
    isOpen: false,
    isSaving: false,
    title: '',
    error: null,
    success: false
  })

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  // Don't render if no questions available
  if (!questions || questions.length === 0) {
    return null
  }

  const openSaveDialog = () => {
    // Generate a default title based on metadata
    const defaultTitle = `${metadata.exam} - ${metadata.type} Questions (${metadata.difficulty})`

    setSaveState({
      isOpen: true,
      isSaving: false,
      title: defaultTitle,
      error: null,
      success: false
    })
  }

  const closeSaveDialog = () => {
    setSaveState(prev => ({
      ...prev,
      isOpen: false,
      error: null,
      success: false
    }))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveState(prev => ({
      ...prev,
      title: e.target.value,
      error: null // Clear error when user types
    }))
  }

  const handleSave = async () => {
    // Validate title
    if (!saveState.title.trim()) {
      setSaveState(prev => ({
        ...prev,
        error: 'Please enter a title for your saved results'
      }))
      return
    }

    setSaveState(prev => ({
      ...prev,
      isSaving: true,
      error: null
    }))

    try {
      const payload: SaveResultsPayload = {
        title: saveState.title.trim(),
        questions,
        metadata
      }

      const savedResult = await SavedResultsService.saveResults(payload, user.id)

      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        success: true
      }))

      // Call success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess(savedResult)
      }

      // Auto-close dialog after success
      setTimeout(() => {
        closeSaveDialog()
      }, 2000)

    } catch (error) {
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save results'
      }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saveState.isSaving) {
      handleSave()
    } else if (e.key === 'Escape') {
      closeSaveDialog()
    }
  }

  return (
    <>
      {/* Save Button */}
      <button
        onClick={openSaveDialog}
        className={`inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors ${className}`}
        disabled={saveState.isSaving}
      >
        <Save className="w-4 h-4" />
        Save Results
      </button>

      {/* Save Dialog Modal */}
      {saveState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Save Question Results
              </h3>
              <button
                onClick={closeSaveDialog}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md p-1"
                disabled={saveState.isSaving}
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Success State */}
              {saveState.success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Results saved successfully!</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {saveState.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{saveState.error}</span>
                  </div>
                </div>
              )}

              {/* Form */}
              {!saveState.success && (
                <div className="space-y-4">
                  {/* Title Input */}
                  <div>
                    <label htmlFor="save-title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      id="save-title"
                      type="text"
                      value={saveState.title}
                      onChange={handleTitleChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter a title for your saved results"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={saveState.isSaving}
                      autoFocus
                    />
                  </div>

                  {/* Metadata Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Question Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><span className="font-medium">Exam:</span> {metadata.exam}</div>
                      <div><span className="font-medium">Class:</span> {metadata.classStandard}</div>
                      <div><span className="font-medium">Type:</span> {metadata.type}</div>
                      <div><span className="font-medium">Difficulty:</span> {metadata.difficulty}</div>
                      <div><span className="font-medium">Count:</span> {questions.length} questions</div>
                      <div><span className="font-medium">Format:</span> {metadata.outputFormat}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!saveState.success && (
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={closeSaveDialog}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  disabled={saveState.isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveState.isSaving || !saveState.title.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveState.isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}