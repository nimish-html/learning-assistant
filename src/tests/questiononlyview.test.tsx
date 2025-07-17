import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionOnlyView from '@/components/QuestionOnlyView';
import { Question } from '@/lib/schema';

// Mock data for testing
const mockMCQQuestion: Question = {
  id: '1',
  stem: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  answer: 'Paris',
  explanation: 'Paris is the capital and largest city of France.',
  difficulty: 'Beginner',
  subject: 'Geography'
};

const mockSubjectiveQuestion: Question = {
  id: '2',
  stem: 'Explain the process of photosynthesis in plants.',
  answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
  explanation: 'This process occurs in chloroplasts and involves light and dark reactions.',
  difficulty: 'Amateur',
  subject: 'Biology'
};

const mockQuestions: Question[] = [mockMCQQuestion, mockSubjectiveQuestion];

describe('QuestionOnlyView', () => {
  it('renders question paper header correctly', () => {
    render(<QuestionOnlyView questions={mockQuestions} />);
    
    expect(screen.getByText('Question Paper')).toBeInTheDocument();
    expect(screen.getByText('Total Questions: 2')).toBeInTheDocument();
  });

  it('renders instructions section', () => {
    render(<QuestionOnlyView questions={mockQuestions} />);
    
    expect(screen.getByText('Instructions:')).toBeInTheDocument();
    expect(screen.getByText('Read all questions carefully before answering')).toBeInTheDocument();
    expect(screen.getByText('For multiple choice questions, select the best answer')).toBeInTheDocument();
  });

  it('renders MCQ questions with options but no answers', () => {
    render(<QuestionOnlyView questions={[mockMCQQuestion]} />);
    
    // Question should be displayed
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    
    // Options should be displayed
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('C.')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('D.')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
    
    // Answer and explanation should NOT be displayed
    expect(screen.queryByText('Answer:')).not.toBeInTheDocument();
    expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
    expect(screen.queryByText('Paris is the capital and largest city of France.')).not.toBeInTheDocument();
  });

  it('renders subjective questions with answer space', () => {
    render(<QuestionOnlyView questions={[mockSubjectiveQuestion]} />);
    
    // Question should be displayed
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Explain the process of photosynthesis in plants.')).toBeInTheDocument();
    
    // Answer space should be provided
    expect(screen.getByText('Answer:')).toBeInTheDocument();
    
    // Answer and explanation content should NOT be displayed
    expect(screen.queryByText('Photosynthesis is the process by which plants convert light energy into chemical energy.')).not.toBeInTheDocument();
    expect(screen.queryByText('This process occurs in chloroplasts and involves light and dark reactions.')).not.toBeInTheDocument();
  });

  it('shows metadata when showMetadata prop is true', () => {
    render(<QuestionOnlyView questions={[mockMCQQuestion]} showMetadata={true} />);
    
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Geography')).toBeInTheDocument();
  });

  it('hides metadata when showMetadata prop is false or not provided', () => {
    render(<QuestionOnlyView questions={[mockMCQQuestion]} showMetadata={false} />);
    
    expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
    expect(screen.queryByText('Geography')).not.toBeInTheDocument();
  });

  it('renders empty state when no questions provided', () => {
    render(<QuestionOnlyView questions={[]} />);
    
    expect(screen.getByText('No questions available')).toBeInTheDocument();
    expect(screen.getByText('Total Questions: 0')).toBeInTheDocument();
  });

  it('renders footer correctly', () => {
    render(<QuestionOnlyView questions={mockQuestions} />);
    
    expect(screen.getByText('End of Question Paper')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <QuestionOnlyView questions={mockQuestions} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<QuestionOnlyView questions={[mockMCQQuestion]} />);
    
    // Check for proper ARIA labels and roles
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Questions for test or assignment');
    expect(screen.getByRole('article')).toHaveAttribute('aria-labelledby', 'question-1');
    expect(screen.getByText('Question 1')).toHaveAttribute('id', 'question-1');
  });

  it('handles questions with long stems correctly', () => {
    const longStemQuestion: Question = {
      ...mockMCQQuestion,
      stem: 'This is a very long question stem that should wrap properly and maintain good readability even when it spans multiple lines. It should preserve whitespace and formatting as needed.'
    };
    
    render(<QuestionOnlyView questions={[longStemQuestion]} />);
    
    expect(screen.getByText(longStemQuestion.stem)).toBeInTheDocument();
    expect(screen.getByText(longStemQuestion.stem)).toHaveClass('whitespace-pre-wrap');
  });
});