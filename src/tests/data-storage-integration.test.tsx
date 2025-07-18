/**
 * Data Storage Integration Tests
 * 
 * Comprehensive integration tests for data storage functionality including:
 * - Complete save and retrieve workflow
 * - Data isolation between users
 * - Error scenarios and recovery
 * - CRUD operations with proper validation
 */

import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../lib/auth-context'
import SaveResultsButton from '../components/SaveResultsButton'
import SavedResultsList from '../components/SavedResultsList'
import { SavedResultsService } from '../lib/saved-results-service'
import type { User } from '../lib/auth.types'
import type { Question, SavedResult, SavedResultMetadata } from '../lib/schema'

// Mock Supabase client
const mockSupabaseFrom = {
  insert: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  single: jest.fn(),
}

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseFrom),
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    }
  }
}))

// Mock user data
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

const mockUser2: User = {
  ...mockUser,
  id: 'test-user-2-id',
  email: 'test2@example.com'
}

// Mock question data
const mockQuestions: Question[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    stem: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    answer: 'Paris',
    explanation: 'Paris is the capital and largest city of France.',
    difficulty: 'Beginner',
    subject: 'Geography'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    stem: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    answer: '4',
    explanation: 'Basic addition: 2 + 2 = 4',
    difficulty: 'Beginner',
    subject: 'Mathematics'
  }
]

const mockMetadata: SavedResultMetadata = {
  exam: 'General Knowledge',
  classStandard: '11th',
  difficulty: 'Beginner',
  type: 'MCQ',
  outputFormat: 'solved-examples',
  questionCount: 2
}

const mockSavedResult: SavedResult = {
  id: 'saved-result-1',
  user_id: 'test-user-id',
  title: 'Test Questions',
  questions: mockQuestions,
  metadata: mockMetadata,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

describe('Data Storage Integration Tests', () => {
  let mockUnsubscribe: jest.Mock
  let authStateCallback: (user: User | null) => void
  let mockSupabaseAuth: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockUnsubscribe = jest.fn()
    
    // Get the mocked supabase auth
    mockSupabaseAuth = require('../lib/supabase').supabase.auth
    
    // Setup default auth state change mock
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    
    // Default to authenticated user
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
    
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null
    })

    // Setup default Supabase query chain mocks
    mockSupabaseFrom.insert.mockReturnValue(mockSupabaseFrom)
    mockSupabaseFrom.select.mockReturnValue(mockSupabaseFrom)
    mockSupabaseFrom.update.mockReturnValue(mockSupabaseFrom)
    mockSupabaseFrom.delete.mockReturnValue(mockSupabaseFrom)
    mockSupabaseFrom.eq.mockReturnValue(mockSupabaseFrom)
    mockSupabaseFrom.order.mockReturnValue(mockSupabaseFrom)
    mockSupabaseFrom.single.mockReturnValue(mockSupabaseFrom)
  })

  describe('Complete Save and Retrieve Workflow', () => {
    it('should save questions and retrieve them successfully', async () => {
      const user = userEvent.setup()
      
      // Mock successful save
      mockSupabaseFrom.single.mockResolvedValue({
        data: mockSavedResult,
        error: null
      })

      // Mock successful retrieve
      mockSupabaseFrom.order.mockResolvedValue({
        data: [mockSavedResult],
        error: null
      })

      const onSaveSuccess = jest.fn()

      render(
        <AuthProvider>
          <SaveResultsButton
            questions={mockQuestions}
            metadata={mockMetadata}
            onSaveSuccess={onSaveSuccess}
          />
        </AuthProvider>
      )

      // Wait for auth to initialize
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Click save button
      await user.click(screen.getByText('Save Results'))

      // Should show save dialog
      expect(screen.getByText('Save Question Results')).toBeInTheDocument()
      expect(screen.getByDisplayValue(/General Knowledge.*MCQ.*Beginner/)).toBeInTheDocument()

      // Enter custom title
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'My Custom Test Questions')

      // Click save
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseFrom.insert).toHaveBeenCalledWith({
          user_id: 'test-user-id',
          title: 'My Custom Test Questions',
          questions: mockQuestions,
          metadata: mockMetadata
        })
      })

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
      })

      // Should call success callback
      expect(onSaveSuccess).toHaveBeenCalledWith(mockSavedResult)
    })

    it('should retrieve and display saved results', async () => {
      // Mock successful retrieve
      mockSupabaseFrom.order.mockResolvedValue({
        data: [mockSavedResult],
        error: null
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Should show loading initially
      expect(screen.getByText('Loading your saved results...')).toBeInTheDocument()

      // Should show results after loading
      await waitFor(() => {
        expect(screen.getByText('Your Saved Results')).toBeInTheDocument()
        expect(screen.getByText('Test Questions')).toBeInTheDocument()
        expect(screen.getByText('2 questions')).toBeInTheDocument()
        expect(screen.getByText('General Knowledge')).toBeInTheDocument()
      })

      // Verify API call
      expect(mockSupabaseFrom.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockSupabaseFrom.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should view detailed results when clicking on a saved result', async () => {
      const user = userEvent.setup()
      
      // Mock successful retrieve
      mockSupabaseFrom.order.mockResolvedValue({
        data: [mockSavedResult],
        error: null
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText('Test Questions')).toBeInTheDocument()
      })

      // Click on the result
      await user.click(screen.getByText('Test Questions'))

      // Should show detailed view
      await waitFor(() => {
        expect(screen.getByText('← Back to saved results')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Test Questions' })).toBeInTheDocument()
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
      })
    })

    it('should delete saved results with confirmation', async () => {
      const user = userEvent.setup()
      
      // Mock successful retrieve
      mockSupabaseFrom.order.mockResolvedValue({
        data: [mockSavedResult],
        error: null
      })

      // Mock successful delete
      mockSupabaseFrom.delete.mockResolvedValue({
        error: null
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText('Test Questions')).toBeInTheDocument()
      })

      // Hover over the result to show delete button
      const resultCard = screen.getByText('Test Questions').closest('div')
      fireEvent.mouseEnter(resultCard!)

      // Click delete button
      const deleteButton = screen.getByLabelText('Delete Test Questions')
      await user.click(deleteButton)

      // Should show confirmation dialog
      expect(screen.getByText('Delete Saved Result')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete.*"Test Questions"/)).toBeInTheDocument()

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: 'Delete' }))

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseFrom.delete).toHaveBeenCalled()
        expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', 'saved-result-1')
        expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      })

      // Result should be removed from list
      await waitFor(() => {
        expect(screen.queryByText('Test Questions')).not.toBeInTheDocument()
        expect(screen.getByText('No saved results yet')).toBeInTheDocument()
      })
    })
  })

  describe('Data Isolation Between Users', () => {
    it('should only show results for the authenticated user', async () => {
      // Mock results for user 1
      const user1Results = [
        { ...mockSavedResult, id: 'result-1', title: 'User 1 Results' }
      ]

      // Mock results for user 2
      const user2Results = [
        { ...mockSavedResult, id: 'result-2', user_id: 'test-user-2-id', title: 'User 2 Results' }
      ]

      // Initially authenticated as user 1
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseFrom.order.mockResolvedValue({
        data: user1Results,
        error: null
      })

      const { rerender } = render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Should show user 1's results
      await waitFor(() => {
        expect(screen.getByText('User 1 Results')).toBeInTheDocument()
        expect(screen.queryByText('User 2 Results')).not.toBeInTheDocument()
      })

      // Verify API was called with user 1's ID
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', 'test-user-id')

      // Switch to user 2
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser2 },
        error: null
      })

      mockSupabaseFrom.order.mockResolvedValue({
        data: user2Results,
        error: null
      })

      // Simulate auth state change
      act(() => {
        authStateCallback(mockUser2)
      })

      // Should now show user 2's results
      await waitFor(() => {
        expect(screen.getByText('User 2 Results')).toBeInTheDocument()
        expect(screen.queryByText('User 1 Results')).not.toBeInTheDocument()
      })

      // Verify API was called with user 2's ID
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', 'test-user-2-id')
    })

    it('should prevent users from accessing other users\' results by ID', async () => {
      // Mock error for unauthorized access
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      // Try to get result by ID with wrong user
      await expect(
        SavedResultsService.getResultById('saved-result-1', 'wrong-user-id')
      ).rejects.toThrow('Saved result not found')

      // Verify security check in query
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', 'saved-result-1')
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', 'wrong-user-id')
    })

    it('should prevent users from deleting other users\' results', async () => {
      // Mock no rows affected (user doesn't own the result)
      mockSupabaseFrom.delete.mockResolvedValue({
        error: null
      })

      // Try to delete result with wrong user ID
      await expect(
        SavedResultsService.deleteResult('saved-result-1', 'wrong-user-id')
      ).resolves.toBeUndefined()

      // Verify security check in query
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', 'saved-result-1')
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', 'wrong-user-id')
    })
  })

  describe('Error Scenarios and Recovery', () => {
    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock save error
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: '08000' }
      })

      render(
        <AuthProvider>
          <SaveResultsButton
            questions={mockQuestions}
            metadata={mockMetadata}
          />
        </AuthProvider>
      )

      // Wait for auth to initialize
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Click save button
      await user.click(screen.getByText('Save Results'))

      // Enter title and save
      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Title')
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Database connection error. Please try again.')).toBeInTheDocument()
      })

      // Should still show the dialog for retry
      expect(screen.getByText('Save Question Results')).toBeInTheDocument()
    })

    it('should handle load errors gracefully', async () => {
      // Mock load error
      mockSupabaseFrom.order.mockResolvedValue({
        data: null,
        error: { message: 'Network timeout', code: '08000' }
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Error loading results')).toBeInTheDocument()
        expect(screen.getByText('Request timed out. Please try again.')).toBeInTheDocument()
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    it('should handle delete errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock successful retrieve
      mockSupabaseFrom.order.mockResolvedValue({
        data: [mockSavedResult],
        error: null
      })

      // Mock delete error
      mockSupabaseFrom.delete.mockResolvedValue({
        error: { message: 'Permission denied', code: '42501' }
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText('Test Questions')).toBeInTheDocument()
      })

      // Hover and click delete
      const resultCard = screen.getByText('Test Questions').closest('div')
      fireEvent.mouseEnter(resultCard!)
      const deleteButton = screen.getByLabelText('Delete Test Questions')
      await user.click(deleteButton)

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: 'Delete' }))

      // Should show error in dialog
      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument()
      })

      // Result should still be in list
      expect(screen.getByText('Test Questions')).toBeInTheDocument()
    })

    it('should handle validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <SaveResultsButton
            questions={mockQuestions}
            metadata={mockMetadata}
          />
        </AuthProvider>
      )

      // Wait for auth to initialize
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Click save button
      await user.click(screen.getByText('Save Results'))

      // Clear title and try to save
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show validation error
      expect(screen.getByText('Please enter a title for your saved results')).toBeInTheDocument()

      // Save button should be disabled when title is empty
      expect(screen.getByRole('button', { name: /save$/i })).toBeDisabled()
    })

    it('should handle network errors during save', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockSupabaseFrom.single.mockRejectedValue(new Error('Failed to fetch'))

      render(
        <AuthProvider>
          <SaveResultsButton
            questions={mockQuestions}
            metadata={mockMetadata}
          />
        </AuthProvider>
      )

      // Wait for auth to initialize
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Click save button
      await user.click(screen.getByText('Save Results'))

      // Enter title and save
      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Title')
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
      })
    })

    it('should retry loading results after error', async () => {
      const user = userEvent.setup()
      
      // Mock initial error
      mockSupabaseFrom.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network timeout', code: '08000' }
      })

      // Mock successful retry
      mockSupabaseFrom.order.mockResolvedValueOnce({
        data: [mockSavedResult],
        error: null
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Error loading results')).toBeInTheDocument()
      })

      // Click try again
      await user.click(screen.getByText('Try Again'))

      // Should show loading then results
      expect(screen.getByText('Loading your saved results...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Test Questions')).toBeInTheDocument()
      })
    })
  })

  describe('Unauthenticated User Experience', () => {
    it('should not show save button for unauthenticated users', () => {
      // Mock no user
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      render(
        <AuthProvider>
          <SaveResultsButton
            questions={mockQuestions}
            metadata={mockMetadata}
          />
        </AuthProvider>
      )

      // Should not render anything
      expect(screen.queryByText('Save Results')).not.toBeInTheDocument()
    })

    it('should show sign-in prompt for unauthenticated users in results list', async () => {
      // Mock no user
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Should show sign-in prompt
      await waitFor(() => {
        expect(screen.getByText('Sign in to view saved results')).toBeInTheDocument()
        expect(screen.getByText('Create an account to save and access your question results.')).toBeInTheDocument()
      })
    })

    it('should show save option when user signs in after generating questions', async () => {
      // Start with no user
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { rerender } = render(
        <AuthProvider>
          <SaveResultsButton
            questions={mockQuestions}
            metadata={mockMetadata}
          />
        </AuthProvider>
      )

      // Should not show save button
      expect(screen.queryByText('Save Results')).not.toBeInTheDocument()

      // User signs in
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Simulate auth state change
      act(() => {
        authStateCallback(mockUser)
      })

      // Should now show save button
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })
    })
  })

  describe('Data Validation and Schema Compliance', () => {
    it('should validate saved result data against schema', async () => {
      // Mock invalid data from database
      const invalidData = {
        ...mockSavedResult,
        questions: 'invalid-questions-format' // Should be array
      }

      mockSupabaseFrom.order.mockResolvedValue({
        data: [invalidData],
        error: null
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      // Should handle invalid data gracefully
      await waitFor(() => {
        expect(screen.getByText('No saved results yet')).toBeInTheDocument()
      })

      // Should log warning about invalid data
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid saved result data found:',
        mockSavedResult.id,
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })

    it('should validate payload before saving', async () => {
      const invalidPayload = {
        title: '', // Invalid: empty title
        questions: [], // Invalid: no questions
        metadata: {} // Invalid: missing required fields
      }

      await expect(
        SavedResultsService.saveResults(invalidPayload as any, 'test-user-id')
      ).rejects.toThrow(/Invalid payload/)
    })

    it('should validate user ID before operations', async () => {
      const validPayload = {
        title: 'Test',
        questions: mockQuestions,
        metadata: mockMetadata
      }

      // Test empty user ID - should fail at user ID validation
      await expect(
        SavedResultsService.saveResults(validPayload, '')
      ).rejects.toThrow('Valid user ID is required')

      // Test null user ID - should fail at user ID validation  
      await expect(
        SavedResultsService.saveResults(validPayload, null as any)
      ).rejects.toThrow('Valid user ID is required')

      // Test with valid UUID user ID to ensure it passes user ID validation
      const validUserId = '550e8400-e29b-41d4-a716-446655440000'
      
      // Mock successful save to test that user ID validation passes
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: { ...mockSavedResult, user_id: validUserId },
        error: null
      })

      await expect(
        SavedResultsService.saveResults(validPayload, validUserId)
      ).resolves.toBeDefined()
    })
  })

  describe('Performance and Optimization', () => {
    it('should load results in correct order (newest first)', async () => {
      const multipleResults = [
        { ...mockSavedResult, id: 'result-1', created_at: '2024-01-03T00:00:00.000Z', title: 'Newest' },
        { ...mockSavedResult, id: 'result-2', created_at: '2024-01-01T00:00:00.000Z', title: 'Oldest' },
        { ...mockSavedResult, id: 'result-3', created_at: '2024-01-02T00:00:00.000Z', title: 'Middle' }
      ]

      mockSupabaseFrom.order.mockResolvedValue({
        data: multipleResults,
        error: null
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('3 saved results')).toBeInTheDocument()
      })

      // Verify order query was called correctly
      expect(mockSupabaseFrom.order).toHaveBeenCalledWith('created_at', { ascending: false })

      // Results should appear in the order returned by the query
      const resultTitles = screen.getAllByText(/Newest|Middle|Oldest/)
      expect(resultTitles[0]).toHaveTextContent('Newest')
      expect(resultTitles[1]).toHaveTextContent('Middle')
      expect(resultTitles[2]).toHaveTextContent('Oldest')
    })

    it('should handle large numbers of results efficiently', async () => {
      // Generate many results
      const manyResults = Array.from({ length: 50 }, (_, i) => ({
        ...mockSavedResult,
        id: `result-${i}`,
        title: `Result ${i + 1}`
      }))

      mockSupabaseFrom.order.mockResolvedValue({
        data: manyResults,
        error: null
      })

      render(
        <AuthProvider>
          <SavedResultsList />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('50 saved results')).toBeInTheDocument()
      })

      // Should render all results
      expect(screen.getByText('Result 1')).toBeInTheDocument()
      expect(screen.getByText('Result 50')).toBeInTheDocument()
    })
  })
})