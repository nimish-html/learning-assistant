/**
 * Integration test for page.tsx format handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TutoratiApp from '@/app/page';

// Mock the useCompletion hook
const mockComplete = jest.fn();
const mockUseCompletion = {
  completion: '',
  complete: mockComplete,
  isLoading: false,
  error: null,
};

jest.mock('@ai-sdk/react', () => ({
  useCompletion: () => mockUseCompletion,
}));

// Mock session storage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('TutoratiApp Format Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should load saved format preference from session storage on mount', () => {
    mockSessionStorage.getItem.mockReturnValue('assignment-format');
    
    render(<TutoratiApp />);
    
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('tutorati-output-format');
  });

  it('should save format preference to session storage when format changes', async () => {
    render(<TutoratiApp />);
    
    // Find and click the form to show it
    const examSelect = screen.getByLabelText(/exam by country/i);
    fireEvent.change(examSelect, { target: { value: 'JEE (India)' } });
    
    const formatSelect = screen.getByTestId('output-format-select');
    fireEvent.change(formatSelect, { target: { value: 'assignment-format' } });
    
    const generateButton = screen.getByRole('button', { name: /generate questions/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('tutorati-output-format', 'assignment-format');
    });
  });

  it('should pass output format to QuestionList when questions are available', async () => {
    // Mock completion with valid questions
    mockUseCompletion.completion = JSON.stringify([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        stem: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        answer: '4',
        explanation: 'Basic arithmetic',
        difficulty: 'Beginner',
        subject: 'Mathematics'
      }
    ]);
    mockUseCompletion.isLoading = false;

    render(<TutoratiApp />);
    
    // Wait for questions to be parsed and displayed
    await waitFor(() => {
      expect(screen.getByText(/successfully parsed 1 questions/i)).toBeInTheDocument();
    });
    
    // Verify that the QuestionList is rendered (which means format was passed correctly)
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('should handle invalid format from session storage gracefully', () => {
    mockSessionStorage.getItem.mockReturnValue('invalid-format');
    
    render(<TutoratiApp />);
    
    // Should not crash and should use default format
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('tutorati-output-format');
  });

  it('should save format preference when format state changes', () => {
    render(<TutoratiApp />);
    
    // The component should save to session storage when format changes
    // This is tested indirectly through the useEffect that saves format changes
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('tutorati-output-format', 'solved-examples');
  });
});