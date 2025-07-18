/**
 * Saved Results List Component
 * 
 * Displays a list of user's saved question results with title, date, and preview.
 * Provides click-to-view functionality and handles empty states.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, FileText, Eye, AlertCircle, Loader2, BookOpen, Clock, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { SavedResultsService } from '@/lib/saved-results-service'
import type { SavedResult } from '@/lib/schema'
import QuestionList from './QuestionList'

interface SavedResultsListProps {
  onResultSelect?: (result: SavedResult) => void
  className?: string
}

interface ListState {
  results: SavedResult[]
  loading: boolean
  error: string | null
  selectedResult: SavedResult | null
  showingDetails: boolean
}

interface DeleteState {
  isDeleting: boolean
  deleteError: string | null
  confirmingDelete: SavedResult | null
}

export default function SavedResultsList({
  onResultSelect,
  className = ''
}: SavedResultsListProps) {
  const { user } = useAuth()
  const [listState, setListState] = useState<ListState>({
    results: [],
    loading: true,
    error: null,
    selectedResult: null,
    showingDetails: false
  })

  const [deleteState, setDeleteState] = useState<DeleteState>({
    isDeleting: false,
    deleteError: null,
    confirmingDelete: null
  })

  // Load saved results when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadSavedResults()
    } else {
      setListState(prev => ({
        ...prev,
        results: [],
        loading: false,
        error: null
      }))
    }
  }, [user])

  const loadSavedResults = async () => {
    if (!user) return

    setListState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const results = await SavedResultsService.getUserResults(user.id)
      setListState(prev => ({
        ...prev,
        results,
        loading: false
      }))
    } catch (error) {
      setListState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load saved results'
      }))
    }
  }

  const handleResultClick = (result: SavedResult) => {
    setListState(prev => ({
      ...prev,
      selectedResult: result,
      showingDetails: true
    }))

    // Call optional callback
    if (onResultSelect) {
      onResultSelect(result)
    }
  }

  const handleBackToList = () => {
    setListState(prev => ({
      ...prev,
      selectedResult: null,
      showingDetails: false
    }))
  }

  const handleDeleteClick = (event: React.MouseEvent, result: SavedResult) => {
    // Prevent the result click event from firing
    event.stopPropagation()
    
    setDeleteState(prev => ({
      ...prev,
      confirmingDelete: result,
      deleteError: null
    }))
  }

  const handleDeleteConfirm = async () => {
    if (!deleteState.confirmingDelete || !user) return

    setDeleteState(prev => ({
      ...prev,
      isDeleting: true,
      deleteError: null
    }))

    try {
      await SavedResultsService.deleteResult(deleteState.confirmingDelete.id, user.id)
      
      // Remove the deleted result from the list
      setListState(prev => ({
        ...prev,
        results: prev.results.filter(r => r.id !== deleteState.confirmingDelete?.id),
        // If we're viewing the deleted result, go back to list
        selectedResult: prev.selectedResult?.id === deleteState.confirmingDelete?.id ? null : prev.selectedResult,
        showingDetails: prev.selectedResult?.id === deleteState.confirmingDelete?.id ? false : prev.showingDetails
      }))

      // Clear delete state
      setDeleteState({
        isDeleting: false,
        deleteError: null,
        confirmingDelete: null
      })
    } catch (error) {
      setDeleteState(prev => ({
        ...prev,
        isDeleting: false,
        deleteError: error instanceof Error ? error.message : 'Failed to delete result'
      }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteState({
      isDeleting: false,
      deleteError: null,
      confirmingDelete: null
    })
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getPreviewText = (result: SavedResult) => {
    if (!result.questions || result.questions.length === 0) {
      return 'No questions available'
    }

    const firstQuestion = result.questions[0]
    const preview = firstQuestion.stem.length > 100 
      ? firstQuestion.stem.substring(0, 100) + '...'
      : firstQuestion.stem

    return preview
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'amateur':
        return 'bg-yellow-100 text-yellow-800'
      case 'ninja':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Don't render if user is not authenticated
  if (!user) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sign in to view saved results
        </h3>
        <p className="text-gray-600">
          Create an account to save and access your question results.
        </p>
      </div>
    )
  }

  // Show loading state
  if (listState.loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your saved results...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (listState.error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error loading results
        </h3>
        <p className="text-gray-600 mb-4">{listState.error}</p>
        <button
          onClick={loadSavedResults}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Show detailed view when a result is selected
  if (listState.showingDetails && listState.selectedResult) {
    const result = listState.selectedResult
    return (
      <div className={className}>
        {/* Header with back button */}
        <div className="mb-6 pb-4 border-b">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Back to saved results
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {result.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(result.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{result.questions.length} questions</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(result.metadata.difficulty)}`}>
                  {result.metadata.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Question content */}
        <QuestionList 
          questions={result.questions}
          outputFormat={result.metadata.outputFormat}
        />
      </div>
    )
  }

  // Show empty state
  if (listState.results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No saved results yet
        </h3>
        <p className="text-gray-600">
          Generate some questions and save them to see them here.
        </p>
      </div>
    )
  }

  // Show results list
  return (
    <>
      <div className={className}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Saved Results
          </h2>
          <p className="text-gray-600">
            {listState.results.length} saved result{listState.results.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-4">
          {listState.results.map((result) => (
            <div
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {result.title}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteClick(e, result)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete result"
                    aria-label={`Delete ${result.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(result.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{result.questions.length} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{result.metadata.exam}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(result.metadata.difficulty)}`}>
                  {result.metadata.difficulty}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {result.metadata.type}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {result.metadata.classStandard}
                </span>
              </div>

              {/* Preview */}
              <p className="text-gray-700 text-sm line-clamp-2">
                {getPreviewText(result)}
              </p>

              {/* Updated indicator */}
              {result.updated_at !== result.created_at && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Updated {formatDate(result.updated_at)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteState.confirmingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Saved Result
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold">"{deleteState.confirmingDelete.title}"</span>?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This will permanently remove {deleteState.confirmingDelete.questions.length} question{deleteState.confirmingDelete.questions.length !== 1 ? 's' : ''} and all associated data.
              </p>
            </div>

            {deleteState.deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{deleteState.deleteError}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleteState.isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteState.isDeleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteState.isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}