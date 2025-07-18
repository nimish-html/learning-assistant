/**
 * UserMenu Component Tests
 * 
 * Tests the UserMenu component functionality including dropdown behavior,
 * user information display, and sign-out functionality.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import UserMenu from '@/components/UserMenu'
import { useAuth } from '@/lib/auth-context'
import type { User } from '@/lib/auth.types'

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('UserMenu', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
  }

  const mockSignOut = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: mockSignOut,
      resetPassword: jest.fn(),
    })
  })

  describe('Rendering', () => {
    it('should render user menu trigger with user info', () => {
      render(<UserMenu user={mockUser} />)
      
      expect(screen.getByText('test')).toBeInTheDocument() // Username from email
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should show dropdown when clicked', () => {
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('should hide dropdown initially', () => {
      render(<UserMenu user={mockUser} />)
      
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
    })
  })

  describe('Dropdown Behavior', () => {
    it('should toggle dropdown on trigger click', () => {
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      
      // Open dropdown
      fireEvent.click(trigger)
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
      
      // Close dropdown
      fireEvent.click(trigger)
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
    })

    it('should close dropdown when clicking outside', () => {
      render(
        <div>
          <UserMenu user={mockUser} />
          <div data-testid="outside">Outside element</div>
        </div>
      )
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
      
      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'))
      
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
    })

    it('should rotate chevron icon when dropdown is open', () => {
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      const chevron = trigger.querySelector('svg:last-child')
      
      expect(chevron).not.toHaveClass('rotate-180')
      
      fireEvent.click(trigger)
      
      expect(chevron).toHaveClass('rotate-180')
    })
  })

  describe('Sign Out Functionality', () => {
    it('should call signOut when sign out button is clicked', async () => {
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
      })
    })

    it('should close dropdown after successful sign out', async () => {
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
      })
    })

    it('should handle sign out errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockRejectedValueOnce(new Error('Sign out failed'))
      
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing out:', expect.any(Error))
      })
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('User Information Display', () => {
    it('should display username from email', () => {
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      expect(screen.getByText('test')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should handle emails without @ symbol', () => {
      const userWithoutAt: User = {
        ...mockUser,
        email: 'testuser',
      }
      
      render(<UserMenu user={userWithoutAt} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should handle undefined email', () => {
      const userWithoutEmail: User = {
        ...mockUser,
        email: undefined,
      }
      
      render(<UserMenu user={userWithoutEmail} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      // Should not crash and should render empty strings
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<UserMenu user={mockUser} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<UserMenu user={mockUser} />)
      
      const trigger = screen.getByRole('button')
      
      // Focus and activate with Enter
      trigger.focus()
      fireEvent.keyDown(trigger, { key: 'Enter' })
      
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should hide username on small screens', () => {
      render(<UserMenu user={mockUser} />)
      
      const usernameSpan = screen.getByText('test')
      expect(usernameSpan).toHaveClass('hidden', 'sm:inline')
    })
  })
})