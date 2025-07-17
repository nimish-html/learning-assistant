import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnswerKeyView from '@/components/AnswerKeyView';
import { Question } from '@/lib/schema';

// Mock data for testing
const mockMCQQuestion: Question = {
  id: '1',
  stem: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  answer: 'Paris',
  explanation: 'Paris is the capital and largest city of France, located in the north-central part of the country.',
  difficulty: 'Beginner',
  subject: 'Geography'
};

const mockSubjectiveQuestion: Question = {
  id: '2',
  stem: 'Explain the process of photosynthesis in plants and its importance to the ecosystem.',
  answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
  explanation: 'This process occurs in chloroplasts and involves light-dependent and light-independent reactions. It produces glucose and oxygen, which are essential for life on Earth.',
  difficulty: 'Amateur',
  subject: 'Biology'
};

const mockQuestions: Question[] = [mockMCQQuestion, mockSubjectiveQuestion];

describe('AnswerKeyView', () => {
  it('renders answer key header correctly', () => {
    render(<AnswerKeyView questions={mockQuestions} />);
    
    expect(screen.getByText('Answer Key')).toBeInTheDocument();
    expect(screen.getByText('Total Questions: 2')).toBeInTheDocument();
  });

  it('renders grading instructions', () => {
    render(<AnswerKeyView questions={mockQuestions} />);
    
    expect(screen.getByText('Grading Instructions:')).toBeInTheDocument();
    expect(screen.getByText('Each correct answer is highlighted in green')).toBeInTheDocument();
    expect(screen.getByText('For MCQ questions, only the marked option should be considered correct')).toBeInTheDocument();
  });

  it('renders MCQ answers with correct option highlighted', () => {
    render(<AnswerKeyView questions={[mockMCQQuestion]} />);
    
    // Answer header should be displayed
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getAllByText('Paris')).toHaveLength(2); // One in correct answer, one in options
    
    // All options should be displayed
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('C.')).toBeInTheDocument();
    expect(screen.getByText('D.')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
    
    // Question reference should be shown (abbreviated)
    expect(screen.getByText('Question:')).toBeInTheDocument();
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });

  it('renders subjective answers without options', () => {
    render(<AnswerKeyView questions={[mockSubjectiveQuestion]} />);
    
    // Answer header should be displayed
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getByText('Photosynthesis is the process by which plants convert light energy into chemical energy.')).toBeInTheDocument();
    
    // Options section should not be displayed
    expect(screen.queryByText('Options:')).not.toBeInTheDocument();
    expect(screen.queryByText('A.')).not.toBeInTheDocument();
  });

  it('shows explanations when showExplanations is true (default)', () => {
    render(<AnswerKeyView questions={[mockMCQQuestion]} />);
    
    expect(screen.getByText('Explanation:')).toBeInTheDocument();
    expect(screen.getByText('Paris is the capital and largest city of France, located in the north-central part of the country.')).toBeInTheDocument();
  });

  it('hides explanations when showExplanations is false', () => {
    render(<AnswerKeyView questions={[mockMCQQuestion]} showExplanations={false} />);
    
    expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
    expect(screen.queryByText('Paris is the capital and largest city of France, located in the north-central part of the country.')).not.toBeInTheDocument();
  });

  it('displays question metadata (difficulty and subject)', () => {
    render(<AnswerKeyView questions={[mockMCQQuestion]} />);
    
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Geography')).toBeInTheDocument();
  });

  it('renders summary statistics correctly', () => {
    render(<AnswerKeyView questions={mockQuestions} />);
    
    expect(screen.getByText('Answer Key Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
    expect(screen.getByText('MCQ Questions')).toBeInTheDocument();
    expect(screen.getByText('Subjective Questions')).toBeInTheDocument();
    
    // Check the counts - be more specific to avoid multiple matches
    const summarySection = screen.getByText('Answer Key Summary').closest('div');
    expect(summarySection).toHaveTextContent('2'); // Total questions
    expect(summarySection).toHaveTextContent('1'); // MCQ count and Subjective count
  });

  it('renders empty state when no questions provided', () => {
    render(<AnswerKeyView questions={[]} />);
    
    expect(screen.getByText('No answers available')).toBeInTheDocument();
    expect(screen.getByText('Total Questions: 0')).toBeInTheDocument();
    expect(screen.queryByText('Answer Key Summary')).not.toBeInTheDocument();
  });

  it('renders footer correctly', () => {
    render(<AnswerKeyView questions={mockQuestions} />);
    
    expect(screen.getByText('End of Answer Key')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <AnswerKeyView questions={mockQuestions} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<AnswerKeyView questions={[mockMCQQuestion]} />);
    
    // Check for proper ARIA labels and roles
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Answer key for questions');
    expect(screen.getByRole('article')).toHaveAttribute('aria-labelledby', 'answer-1');
    expect(screen.getByText('Answer 1')).toHaveAttribute('id', 'answer-1');
  });

  it('truncates long question stems in reference', () => {
    const longStemQuestion: Question = {
      ...mockMCQQuestion,
      stem: 'This is a very long question stem that should be truncated when displayed in the answer key reference section because it exceeds the 100 character limit that we have set for the abbreviated question display.'
    };
    
    render(<AnswerKeyView questions={[longStemQuestion]} />);
    
    // Should show truncated version with ellipsis
    expect(screen.getByText(/This is a very long question stem that should be truncated when displayed in the answer key.../)).toBeInTheDocument();
  });

  it('handles questions without explanations gracefully', () => {
    const questionWithoutExplanation: Question = {
      ...mockMCQQuestion,
      explanation: undefined
    };
    
    render(<AnswerKeyView questions={[questionWithoutExplanation]} />);
    
    // Should not show explanation section
    expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
  });

  it('correctly identifies and highlights correct MCQ option', () => {
    render(<AnswerKeyView questions={[mockMCQQuestion]} />);
    
    // Find the options section and check for correct highlighting
    const optionsSection = screen.getByText('Options:').closest('div');
    expect(optionsSection).toBeInTheDocument();
    
    // Check that Paris option is highlighted (it should have green background)
    const allParisElements = screen.getAllByText('Paris');
    const parisInOptions = allParisElements.find(el => 
      el.closest('div')?.classList.contains('bg-green-200')
    );
    expect(parisInOptions).toBeInTheDocument();
    
    // Other options should not be highlighted
    const londonOption = screen.getByText('London').closest('div');
    expect(londonOption).toHaveClass('bg-gray-100');
    expect(londonOption).toHaveClass('text-gray-700');
  });
});