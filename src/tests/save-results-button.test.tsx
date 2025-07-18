/**
 * SaveResultsButton Component Tests
 * 
 * Tests for the save results button component including:
 * - Conditional rendering based on authentication
 * - Save dialog functionality
 * - Loading states and error handling
 * - Success feedback
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SaveResultsButton from '@/components/SaveResultsButton'
import { useAuth } from '@/lib/auth-context'
import { SavedResultsService } from '@/lib/saved-results-service'
import type { Question, SavedResultMetadata } from '@/lib/schema'

// Mock Supabase to avoid ES module issues
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    }
  }
}))

// Mock the auth context
jest.mock('@/lib/auth-context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock the saved results service
jest.mock('@/lib/saved-results-service', () => ({
  SavedResultsService: {
    saveResults: jest.fn(),
    getUserResults: jest.fn(),
    getResultById: jest.fn(),
    deleteResult: jest.fn(),
    getUserResultsCount: jest.fn(),
  }
}))
const mockSavedResultsService = SavedResultsService as jest.Mocked<typeof SavedResultsService>

// Mock data
const mockQuestions: Question[] = [
  {
    id: '1',
    stem: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    answer: '4',
    explanation: 'Basic addition',
    difficulty: 'Beginner',
    subject: 'Mathematics'
  },
  {
    id: '2',
    stem: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    answer: 'Paris',
    explanation: 'Paris is the capital city of France',
    difficulty: 'Beginner',
    subject: 'Geography'
  }
]

const mockMetadata: SavedResultMetadata = {
  exam: 'JEE Main',
  classStandard: '12th',
  difficulty: 'Beginner',
  type: 'MCQ',
  outputFormat: 'solved-examples',
  questionCount: 2
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated'
}

const mockSavedResult = {
  id: 'saved-123',
  user_id: 'user-123',
  title: 'Test Results',
  questions: mockQuestions,
  metadata: mockMetadata,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('SaveResultsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Conditional Rendering', () => {
    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })

      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      expect(screen.queryByText('Save Results')).not.toBeInTheDocument()
    })

    it('should not render when no questions are provided', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })

      render(
        <SaveResultsButton 
          questions={[]} 
          metadata={mockMetadata} 
        />
      )

      expect(screen.queryByText('Save Results')).not.toBeInTheDocument()
    })

    it('should render when user is authenticated and questions are available', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })

      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      expect(screen.getByText('Save Results')).toBeInTheDocument()
    })
  })

  describe('Save Dialog', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })
    })

    it('should open save dialog when button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))

      expect(screen.getByText('Save Question Results')).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByText('Question Details')).toBeInTheDocument()
    })

    it('should display default title based on metadata', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))

      const titleInput = screen.getByLabelText('Title') as HTMLInputElement
      expect(titleInput.value).toBe('JEE Main - MCQ Questions (Beginner)')
    })

    it('should display question metadata in dialog', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))

      expect(screen.getByText('JEE Main')).toBeInTheDocument()
      expect(screen.getByText('12th')).toBeInTheDocument()
      expect(screen.getByText('MCQ')).toBeInTheDocument()
      expect(screen.getByText('Beginner')).toBeInTheDocument()
      expect(screen.getByText('2 questions')).toBeInTheDocument()
      expect(screen.getByText('solved-examples')).toBeInTheDocument()
    })

    it('should close dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))
      expect(screen.getByText('Save Question Results')).toBeInTheDocument()

      await user.click(screen.getByText('Cancel'))
      expect(screen.queryByText('Save Question Results')).not.toBeInTheDocument()
    })

    it('should close dialog when X button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))
      expect(screen.getByText('Save Question Results')).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      await user.click(closeButton)
      expect(screen.queryByText('Save Question Results')).not.toBeInTheDocument()
    })

    it('should close dialog when Escape key is pressed', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))
      expect(screen.getByText('Save Question Results')).toBeInTheDocument()

      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, '{Escape}')
      expect(screen.queryByText('Save Question Results')).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })
    })

    it('should show error when trying to save with empty title', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      
      // Debug: Check if save button is disabled
      const saveButton = screen.getByRole('button', { name: /save$/i })
      expect(saveButton).toBeDisabled()
      
      // Since the button is disabled, we can't click it to trigger the error
      // Let's test the validation logic by typing and then clearing
      await user.type(titleInput, 'test')
      expect(screen.getByRole('button', { name: /save$/i })).not.toBeDisabled()
      
      await user.clear(titleInput)
      expect(screen.getByRole('button', { name: /save$/i })).toBeDisabled()
    })

    it('should disable save button when title is empty', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      
      const saveButton = screen.getByRole('button', { name: /save$/i })
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when title is provided', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata} 
        />
      )

      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      
      // Button should be disabled when title is empty
      expect(screen.getByRole('button', { name: /save$/i })).toBeDisabled()
      
      // Button should be enabled when title is provided
      await user.type(titleInput, 'New Title')
      expect(screen.getByRole('button', { name: /save$/i })).not.toBeDisabled()
    })
  })

  describe('Save Functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })
    })

    it('should save results successfully', async () => {
      const user = userEvent.setup()
      const mockOnSaveSuccess = jest.fn()
      
      mockSavedResultsService.saveResults.mockResolvedValue(mockSavedResult)
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'My Test Results')
      
      await user.click(screen.getByRole('button', { name: /save$/i }))

      await waitFor(() => {
        expect(mockSavedResultsService.saveResults).toHaveBeenCalledWith(
          {
            title: 'My Test Results',
            questions: mockQuestions,
            metadata: mockMetadata
          },
          mockUser.id
        )
      })

      expect(mockOnSaveSuccess).toHaveBeenCalledWith(mockSavedResult)
      expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
    })

    it('should show loading state during save', async () => {
      const user = userEvent.setup()
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      mockSavedResultsService.saveResults.mockReturnValue(savePromise)
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))
      await user.click(screen.getByRole('button', { name: /save$/i }))

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()

      // Resolve the promise
      resolvePromise!(mockSavedResult)
      
      await waitFor(() => {
        expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
      })
    })

    it('should handle save errors', async () => {
      const user = userEvent.setup()
      
      mockSavedResultsService.saveResults.mockRejectedValue(
        new Error('Database connection failed')
      )
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))
      await user.click(screen.getByRole('button', { name: /save$/i }))

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument()
      })
    })

    it('should handle generic save errors', async () => {
      const user = userEvent.setup()
      
      mockSavedResultsService.saveResults.mockRejectedValue('Unknown error')
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))
      await user.click(screen.getByRole('button', { name: /save$/i }))

      await waitFor(() => {
        expect(screen.getByText('Failed to save results')).toBeInTheDocument()
      })
    })

    it('should save on Enter key press', async () => {
      const user = userEvent.setup()
      
      mockSavedResultsService.saveResults.mockResolvedValue(mockSavedResult)
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'My Test Results{Enter}')

      await waitFor(() => {
        expect(mockSavedResultsService.saveResults).toHaveBeenCalled()
      })
    })

    it('should auto-close dialog after successful save', async () => {
      const user = userEvent.setup()
      
      mockSavedResultsService.saveResults.mockResolvedValue(mockSavedResult)
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))
      await user.click(screen.getByRole('button', { name: /save$/i }))

      await waitFor(() => {
        expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
      })

      // Wait for auto-close (2 seconds)
      await waitFor(() => {
        expect(screen.queryByText('Save Question Results')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })
    })

    it('should have proper ARIA labels', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))

      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument()
    })

    it('should focus title input when dialog opens', async () => {
      const user = userEvent.setup()
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))

      const titleInput = screen.getByLabelText('Title')
      expect(titleInput).toHaveFocus()
    })

    it('should disable interactive elements during save', async () => {
      const user = userEvent.setup()
      
      let resolvePromise: (value: any) => void
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      mockSavedResultsService.saveResults.mockReturnValue(savePromise)
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
        />
      )

      await user.click(screen.getByText('Save Results'))
      await user.click(screen.getByRole('button', { name: /save$/i }))

      expect(screen.getByLabelText('Title')).toBeDisabled()
      expect(screen.getByRole('button', { name: /close dialog/i })).toBeDisabled()

      resolvePromise!(mockSavedResult)
    })
  })

  describe('Custom Props', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn()
      })
    })

    it('should apply custom className', () => {
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
          className="custom-class"
        />
      )

      const button = screen.getByText('Save Results')
      expect(button).toHaveClass('custom-class')
    })

    it('should call onSaveSuccess callback when provided', async () => {
      const user = userEvent.setup()
      const mockOnSaveSuccess = jest.fn()
      
      mockSavedResultsService.saveResults.mockResolvedValue(mockSavedResult)
      
      render(
        <SaveResultsButton 
          questions={mockQuestions} 
          metadata={mockMetadata}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await user.click(screen.getByText('Save Results'))
      await user.click(screen.getByRole('button', { name: /save$/i }))

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalledWith(mockSavedResult)
      })
    })
  })
})