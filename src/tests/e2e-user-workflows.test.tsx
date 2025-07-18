/**
 * End-to-End User Workflow Tests
 * 
 * Comprehensive end-to-end tests for complete user workflows including:
 * - Complete user journey from registration to saving results
 * - Unauthenticated user experience remains functional
 * - Cross-browser authentication persistence
 * - Real-world user scenarios and edge cases
 */

import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../lib/auth-context'
import SaveResultsButton from '../components/SaveResultsButton'
import SavedResultsList from '../components/SavedResultsList'
import SignUpForm from '../components/SignUpForm'
import SignInForm from '../components/SignInForm'
import QuestionForm from '../components/QuestionForm'
import QuestionList from '../components/QuestionList'
import type { User } from '../lib/auth.types'
import type { Question, SavedResultMetadata } from '../lib/schema'

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
    })),
  }
}))

// Mock window.location
const mockLocation = {
  origin: 'http://localhost',
  href: 'http://localhost',
  reload: jest.fn()
}

;(global as any).window = {
  location: mockLocation
}

// Mock user data
const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
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

const mockSavedResult = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  user_id: mockUser.id,
  title: 'My Test Questions',
  questions: mockQuestions,
  metadata: mockMetadata,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

describe('End-to-End User Workflow Tests', () => {
  let mockUnsubscribe: jest.Mock
  let authStateCallback: (user: User | null) => void
  let mockSupabaseAuth: any
  let mockSupabaseFrom: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockUnsubscribe = jest.fn()
    
    // Get the mocked supabase instances
    mockSupabaseAuth = require('../lib/supabase').supabase.auth
    mockSupabaseFrom = require('../lib/supabase').supabase.from()
    
    // Setup default auth state change mock
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    
    // Default to no user
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
    
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
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

  describe('Complete User Journey: Registration to Saving Results', () => {
    it('should handle complete user journey from registration to saving and viewing results', async () => {
      const user = userEvent.setup()
      
      // Mock successful sign up
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

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

      // Complete application component that includes all features
      function CompleteApp() {
        const [currentView, setCurrentView] = React.useState<'signup' | 'questions' | 'saved'>('signup')
        const [generatedQuestions, setGeneratedQuestions] = React.useState<Question[]>([])
        const [showSaveButton, setShowSaveButton] = React.useState(false)

        const handleSignUpSuccess = () => {
          // Simulate auth state change
          act(() => {
            authStateCallback(mockUser)
          })
          setCurrentView('questions')
        }

        const handleGenerateQuestions = () => {
          setGeneratedQuestions(mockQuestions)
          setShowSaveButton(true)
        }

        const handleSaveSuccess = () => {
          setCurrentView('saved')
        }

        return (
          <AuthProvider>
            <div>
              <nav>
                <button onClick={() => setCurrentView('signup')}>Sign Up</button>
                <button onClick={() => setCurrentView('questions')}>Generate Questions</button>
                <button onClick={() => setCurrentView('saved')}>Saved Results</button>
              </nav>

              {currentView === 'signup' && (
                <div>
                  <h1>Create Account</h1>
                  <SignUpForm onSuccess={handleSignUpSuccess} />
                </div>
              )}

              {currentView === 'questions' && (
                <div>
                  <h1>Question Generator</h1>
                  <button onClick={handleGenerateQuestions}>Generate Questions</button>
                  
                  {generatedQuestions.length > 0 && (
                    <div>
                      <QuestionList questions={generatedQuestions} outputFormat="solved-examples" />
                      {showSaveButton && (
                        <SaveResultsButton
                          questions={generatedQuestions}
                          metadata={mockMetadata}
                          onSaveSuccess={handleSaveSuccess}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentView === 'saved' && (
                <div>
                  <h1>Saved Results</h1>
                  <SavedResultsList />
                </div>
              )}
            </div>
          </AuthProvider>
        )
      }

      render(<CompleteApp />)

      // Step 1: User signs up
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const signUpButton = screen.getByTestId('signup-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(signUpButton)

      // Should show success and transition to questions
      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Question Generator' })).toBeInTheDocument()
      })

      // Step 2: User generates questions
      await user.click(screen.getByText('Generate Questions'))

      // Should show generated questions
      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
      })

      // Should show save button for authenticated user
      expect(screen.getByText('Save Results')).toBeInTheDocument()

      // Step 3: User saves results
      await user.click(screen.getByText('Save Results'))

      // Should show save dialog
      expect(screen.getByText('Save Question Results')).toBeInTheDocument()

      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'My Test Questions')
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show success and transition to saved results
      await waitFor(() => {
        expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Saved Results' })).toBeInTheDocument()
      })

      // Step 4: User views saved results
      await waitFor(() => {
        expect(screen.getByText('My Test Questions')).toBeInTheDocument()
        expect(screen.getByText('2 questions')).toBeInTheDocument()
      })

      // Verify all API calls were made correctly
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost/auth/callback'
        }
      })

      expect(mockSupabaseFrom.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        title: 'My Test Questions',
        questions: mockQuestions,
        metadata: mockMetadata
      })

      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should handle user journey with existing account sign-in', async () => {
      const user = userEvent.setup()
      
      // Mock successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      })

      // Mock existing saved results
      mockSupabaseFrom.order.mockResolvedValue({
        data: [mockSavedResult],
        error: null
      })

      function SignInApp() {
        const [isSignedIn, setIsSignedIn] = React.useState(false)

        const handleSignInSuccess = () => {
          act(() => {
            authStateCallback(mockUser)
          })
          setIsSignedIn(true)
        }

        return (
          <AuthProvider>
            {!isSignedIn ? (
              <div>
                <h1>Sign In</h1>
                <SignInForm onSuccess={handleSignInSuccess} />
              </div>
            ) : (
              <div>
                <h1>Welcome Back!</h1>
                <SavedResultsList />
              </div>
            )}
          </AuthProvider>
        )
      }

      render(<SignInApp />)

      // User signs in
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const signInButton = screen.getByTestId('signin-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      // Should show success and user's saved results
      await waitFor(() => {
        expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('My Test Questions')).toBeInTheDocument()
      })

      // Verify sign in API call
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  describe('Unauthenticated User Experience', () => {
    it('should allow unauthenticated users to generate questions without save functionality', async () => {
      const user = userEvent.setup()

      function UnauthenticatedApp() {
        const [questions, setQuestions] = React.useState<Question[]>([])

        const handleGenerate = () => {
          setQuestions(mockQuestions)
        }

        return (
          <AuthProvider>
            <div>
              <h1>Question Generator</h1>
              <button onClick={handleGenerate}>Generate Questions</button>
              
              {questions.length > 0 && (
                <div>
                  <QuestionList questions={questions} outputFormat="solved-examples" />
                  <SaveResultsButton
                    questions={questions}
                    metadata={mockMetadata}
                  />
                </div>
              )}
            </div>
          </AuthProvider>
        )
      }

      render(<UnauthenticatedApp />)

      // User can generate questions
      await user.click(screen.getByText('Generate Questions'))

      // Should show questions
      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
      })

      // Should NOT show save button for unauthenticated user
      expect(screen.queryByText('Save Results')).not.toBeInTheDocument()
    })

    it('should show sign-in prompt when unauthenticated user tries to access saved results', async () => {
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

    it('should offer save option when user signs in after generating questions', async () => {
      const user = userEvent.setup()

      // Mock successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      })

      function DynamicAuthApp() {
        const [questions, setQuestions] = React.useState<Question[]>([])
        const [showSignIn, setShowSignIn] = React.useState(false)

        const handleGenerate = () => {
          setQuestions(mockQuestions)
        }

        const handleSignInSuccess = () => {
          act(() => {
            authStateCallback(mockUser)
          })
          setShowSignIn(false)
        }

        return (
          <AuthProvider>
            <div>
              <h1>Question Generator</h1>
              <button onClick={handleGenerate}>Generate Questions</button>
              <button onClick={() => setShowSignIn(true)}>Sign In</button>
              
              {questions.length > 0 && (
                <div>
                  <QuestionList questions={questions} outputFormat="solved-examples" />
                  <SaveResultsButton
                    questions={questions}
                    metadata={mockMetadata}
                  />
                </div>
              )}

              {showSignIn && (
                <div>
                  <h2>Sign In</h2>
                  <SignInForm onSuccess={handleSignInSuccess} />
                </div>
              )}
            </div>
          </AuthProvider>
        )
      }

      render(<DynamicAuthApp />)

      // User generates questions first (unauthenticated)
      await user.click(screen.getByText('Generate Questions'))

      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
      })

      // No save button initially
      expect(screen.queryByText('Save Results')).not.toBeInTheDocument()

      // User signs in
      await user.click(screen.getByText('Sign In'))
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const signInButton = screen.getByTestId('signin-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      // Should now show save button after authentication
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })
    })
  })

  describe('Cross-Browser Authentication Persistence', () => {
    it('should persist authentication state across page refreshes', async () => {
      // Mock existing session
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      })

      function PersistentAuthApp() {
        return (
          <AuthProvider>
            <div>
              <SaveResultsButton
                questions={mockQuestions}
                metadata={mockMetadata}
              />
            </div>
          </AuthProvider>
        )
      }

      const { rerender } = render(<PersistentAuthApp />)

      // Should show save button for authenticated user
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Simulate page refresh by re-rendering
      rerender(<PersistentAuthApp />)

      // Should still show save button after "refresh"
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Verify session was checked
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled()
    })

    it('should handle session expiration gracefully', async () => {
      // Start with valid session
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      function SessionApp() {
        return (
          <AuthProvider>
            <div>
              <SaveResultsButton
                questions={mockQuestions}
                metadata={mockMetadata}
              />
              <SavedResultsList />
            </div>
          </AuthProvider>
        )
      }

      render(<SessionApp />)

      // Should initially show authenticated state
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Simulate session expiration
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired', status: 401 }
      })

      // Simulate auth state change (session expired)
      act(() => {
        authStateCallback(null)
      })

      // Should handle gracefully - save button disappears, shows sign-in prompt
      await waitFor(() => {
        expect(screen.queryByText('Save Results')).not.toBeInTheDocument()
        expect(screen.getByText('Sign in to view saved results')).toBeInTheDocument()
      })
    })

    it('should maintain user data consistency across multiple tabs/windows', async () => {
      // Mock user with saved results
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseFrom.order.mockResolvedValue({
        data: [mockSavedResult],
        error: null
      })

      function MultiTabApp() {
        return (
          <AuthProvider>
            <SavedResultsList />
          </AuthProvider>
        )
      }

      // Render first "tab"
      const { rerender } = render(<MultiTabApp />)

      await waitFor(() => {
        expect(screen.getByText('My Test Questions')).toBeInTheDocument()
      })

      // Simulate auth state change from another tab (user signs out)
      act(() => {
        authStateCallback(null)
      })

      // Should update to show unauthenticated state
      await waitFor(() => {
        expect(screen.getByText('Sign in to view saved results')).toBeInTheDocument()
      })

      // Simulate auth state change from another tab (user signs back in)
      act(() => {
        authStateCallback(mockUser)
      })

      // Should update to show authenticated state again
      await waitFor(() => {
        expect(screen.getByText('My Test Questions')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network interruptions during user workflow', async () => {
      const user = userEvent.setup()

      // Mock network error during save
      mockSupabaseFrom.single.mockRejectedValueOnce(new Error('Network error'))
      
      // Mock successful retry
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: mockSavedResult,
        error: null
      })

      // Start with authenticated user
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      function NetworkErrorApp() {
        return (
          <AuthProvider>
            <SaveResultsButton
              questions={mockQuestions}
              metadata={mockMetadata}
            />
          </AuthProvider>
        )
      }

      render(<NetworkErrorApp />)

      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Try to save
      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Title')
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // User can retry
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
      })
    })

    it('should handle concurrent user actions gracefully', async () => {
      const user = userEvent.setup()

      // Mock slow save operation
      let resolveSave: (value: any) => void
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve
      })
      mockSupabaseFrom.single.mockReturnValue(savePromise)

      // Start with authenticated user
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      function ConcurrentApp() {
        return (
          <AuthProvider>
            <SaveResultsButton
              questions={mockQuestions}
              metadata={mockMetadata}
            />
          </AuthProvider>
        )
      }

      render(<ConcurrentApp />)

      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Start save operation
      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Title')
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      
      // Save button should be disabled during save
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()

      // Resolve the save operation
      act(() => {
        resolveSave({
          data: mockSavedResult,
          error: null
        })
      })

      // Should show success
      await waitFor(() => {
        expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
      })
    })

    it('should handle data corruption and validation errors', async () => {
      const user = userEvent.setup()

      // Mock validation error
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Invalid data format', code: '23514' }
      })

      // Start with authenticated user
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      function ValidationErrorApp() {
        return (
          <AuthProvider>
            <SaveResultsButton
              questions={mockQuestions}
              metadata={mockMetadata}
            />
          </AuthProvider>
        )
      }

      render(<ValidationErrorApp />)

      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Try to save
      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Title')
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Invalid data format')).toBeInTheDocument()
      })

      // Dialog should remain open for user to fix the issue
      expect(screen.getByText('Save Question Results')).toBeInTheDocument()
    })
  })

  describe('User Experience and Accessibility', () => {
    it('should provide clear feedback for all user actions', async () => {
      const user = userEvent.setup()

      // Mock successful operations
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      mockSupabaseFrom.single.mockResolvedValue({
        data: mockSavedResult,
        error: null
      })

      function FeedbackApp() {
        const [step, setStep] = React.useState<'signup' | 'save'>('signup')

        const handleSignUpSuccess = () => {
          act(() => {
            authStateCallback(mockUser)
          })
          setStep('save')
        }

        return (
          <AuthProvider>
            {step === 'signup' ? (
              <SignUpForm onSuccess={handleSignUpSuccess} />
            ) : (
              <SaveResultsButton
                questions={mockQuestions}
                metadata={mockMetadata}
              />
            )}
          </AuthProvider>
        )
      }

      render(<FeedbackApp />)

      // Sign up flow with feedback
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const signUpButton = screen.getByTestId('signup-button')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      // Should show loading state during submission
      await user.click(signUpButton)
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()

      // Should show success feedback
      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument()
        expect(screen.getByText(/check your email to verify/i)).toBeInTheDocument()
      })

      // Should transition to save functionality
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })

      // Save flow with feedback
      await user.click(screen.getByText('Save Results'))
      
      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Title')
      await user.click(screen.getByRole('button', { name: /save$/i }))

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument()

      // Should show success feedback
      await waitFor(() => {
        expect(screen.getByText('Results saved successfully!')).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation throughout the workflow', async () => {
      // Mock successful operations
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      })

      function KeyboardApp() {
        const [isSignedIn, setIsSignedIn] = React.useState(false)

        const handleSignInSuccess = () => {
          act(() => {
            authStateCallback(mockUser)
          })
          setIsSignedIn(true)
        }

        return (
          <AuthProvider>
            {!isSignedIn ? (
              <SignInForm onSuccess={handleSignInSuccess} />
            ) : (
              <SaveResultsButton
                questions={mockQuestions}
                metadata={mockMetadata}
              />
            )}
          </AuthProvider>
        )
      }

      render(<KeyboardApp />)

      // Test keyboard navigation in sign-in form
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')

      // Tab navigation should work
      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)

      // Type and use Tab to move to next field
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.tab()
      expect(document.activeElement).toBe(passwordInput)

      // Enter password and submit with Enter key
      await userEvent.type(passwordInput, 'password123')
      await userEvent.keyboard('{Enter}')

      // Should sign in successfully
      await waitFor(() => {
        expect(screen.getByText('Save Results')).toBeInTheDocument()
      })
    })
  })
})