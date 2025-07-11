import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionForm from '@/components/QuestionForm';
import { GeneratePayload } from '@/lib/schema';

describe('QuestionForm Component Tests', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  it('should render all form fields', () => {
    render(<QuestionForm {...defaultProps} />);

    expect(screen.getByLabelText(/exam by country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/class\/standard/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of questions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/difficulty level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred source/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate questions/i })).toBeInTheDocument();
  });

  it('should show default values', () => {
    render(<QuestionForm {...defaultProps} />);

    expect(screen.getByDisplayValue('12th Grade')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Amateur')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Multiple Choice Questions (MCQ)')).toBeInTheDocument();
  });

  it('should call onSubmit with valid data when form is submitted', async () => {
    const user = userEvent.setup();
    render(<QuestionForm {...defaultProps} />);

    // Select exam
    await user.selectOptions(screen.getByLabelText(/exam by country/i), '🇮🇳 JEE (India)');
    
    // Change count
    await user.clear(screen.getByLabelText(/number of questions/i));
    await user.type(screen.getByLabelText(/number of questions/i), '10');

    // Add preferred source
    await user.type(screen.getByLabelText(/preferred source/i), 'NCERT');

    // Submit form
    fireEvent.submit(screen.getByTestId('question-form'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        exam: 'JEE (India)',
        classStandard: '12th',
        count: 10,
        difficulty: 'Amateur',
        type: 'MCQ',
        preferredSource: 'NCERT',
      });
    });
  });

  it('should show validation errors for invalid data', async () => {
    const user = userEvent.setup();
    render(<QuestionForm {...defaultProps} />);

    // Submit form without selecting exam
    fireEvent.submit(screen.getByTestId('question-form'));

    await waitFor(() => {
      expect(screen.getByText(/exam selection is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should clear error when field is corrected', async () => {
    const user = userEvent.setup();
    render(<QuestionForm {...defaultProps} />);

    // Submit to trigger validation error
    fireEvent.submit(screen.getByTestId('question-form'));

    await waitFor(() => {
      expect(screen.getByText(/exam selection is required/i)).toBeInTheDocument();
    });

    // Fix the error by selecting an exam
    await user.selectOptions(screen.getByLabelText(/exam by country/i), '🇮🇳 JEE (India)');

    // Error should disappear
    await waitFor(() => {
      expect(screen.queryByText(/exam selection is required/i)).not.toBeInTheDocument();
    });
  });

  it('should disable form when loading', () => {
    render(<QuestionForm {...defaultProps} isLoading={true} />);

    expect(screen.getByLabelText(/exam by country/i)).toBeDisabled();
    expect(screen.getByLabelText(/class\/standard/i)).toBeDisabled();
    expect(screen.getByLabelText(/number of questions/i)).toBeDisabled();
    expect(screen.getByLabelText(/difficulty level/i)).toBeDisabled();
    expect(screen.getByLabelText(/question type/i)).toBeDisabled();
    expect(screen.getByLabelText(/preferred source/i)).toBeDisabled();
    
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Generating Questions...');
  });

  it('should validate count boundaries', async () => {
    const user = userEvent.setup();
    render(<QuestionForm {...defaultProps} />);

    // Select exam first to avoid that validation error
    await user.selectOptions(screen.getByLabelText(/exam by country/i), '🇮🇳 JEE (India)');

    // Test count = 0 (invalid)
    await user.clear(screen.getByLabelText(/number of questions/i));
    await user.type(screen.getByLabelText(/number of questions/i), '0');
    fireEvent.submit(screen.getByTestId('question-form'));

    await waitFor(() => {
      expect(screen.getByText(/Number must be greater than or equal to 1/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Test count = 51 (invalid)
    await user.clear(screen.getByLabelText(/number of questions/i));
    await user.type(screen.getByLabelText(/number of questions/i), '51');
    fireEvent.submit(screen.getByTestId('question-form'));

    await waitFor(() => {
      expect(screen.getByText(/Number must be less than or equal to 50/i)).toBeInTheDocument();
    });
  });

  it('should handle all exam options', async () => {
    const user = userEvent.setup();
    render(<QuestionForm {...defaultProps} />);

    const examSelect = screen.getByLabelText(/exam by country/i);
    
    // Test that all exam options are present
    expect(screen.getByRole('option', { name: /🇮🇳 JEE \(India\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /🇮🇳 NEET \(India\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /🇺🇸 SAT \(US\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /🇺🇸 MCAT \(US\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /🇪🇺 German Abitur STEM/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /🇪🇺 French Baccalauréat Série S/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /🇦🇪 EmSAT Physics\/Math \(UAE\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /🇦🇪 EmSAT Chemistry \(UAE\)/i })).toBeInTheDocument();
  });

  it('should handle difficulty level changes', async () => {
    const user = userEvent.setup();
    render(<QuestionForm {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/exam by country/i), '🇮🇳 JEE (India)');
    await user.selectOptions(screen.getByLabelText(/difficulty level/i), 'Ninja');
    
    fireEvent.submit(screen.getByTestId('question-form'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          difficulty: 'Ninja',
        })
      );
    });
  });

  it('should handle question type changes', async () => {
    const user = userEvent.setup();
    render(<QuestionForm {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/exam by country/i), '🇮🇳 JEE (India)');
    await user.selectOptions(screen.getByLabelText(/question type/i), 'Subjective Questions');
    
    fireEvent.submit(screen.getByTestId('question-form'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Subjective',
        })
      );
    });
  });
}); 