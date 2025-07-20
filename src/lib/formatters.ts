import { Question, OutputFormat, FormattedOutput, Document } from './schema';
import { formatOption } from './option-utils';

/**
 * Base interface for question formatters
 * Each formatter implements a specific output format for questions
 */
export interface QuestionFormatter {
  /**
   * Format questions according to the specific output format
   * @param questions Array of questions to format
   * @param options Optional formatting options
   * @returns FormattedOutput with documents structured for the format
   */
  format(questions: Question[], options?: unknown): FormattedOutput;
}

/**
 * Factory function to get the appropriate formatter for a given output format
 * @param format The desired output format
 * @returns QuestionFormatter instance for the specified format
 */
export function getFormatter(format: OutputFormat): QuestionFormatter {
  switch (format) {
    case 'solved-examples':
      return new SolvedExamplesFormatter();
    case 'assignment-format':
      return new AssignmentFormatter();
    case 'separate-documents':
      return new SeparateDocumentsFormatter();
    default:
      // Fallback to solved examples for unknown formats
      return new SolvedExamplesFormatter();
  }
}

/**
 * Utility function to generate question content with proper numbering
 * @param question The question object
 * @param index The question number (0-based)
 * @returns Formatted question string
 */
export function formatQuestionContent(question: Question, index: number): string {
  const questionNumber = index + 1;
  let content = `**Question ${questionNumber}:** ${question.stem}\n\n`;
  
  // Add options for MCQ questions
  if (question.options && question.options.length > 0) {
    question.options.forEach((option, optIndex) => {
      // Use the formatOption utility to handle duplicate labels properly
      const formattedOption = formatOption(option, optIndex);
      content += `${formattedOption}\n`;
    });
    content += '\n';
  }
  
  return content;
}

/**
 * Utility function to generate answer content with explanations
 * @param question The question object
 * @param index The question number (0-based)
 * @returns Formatted answer string
 */
export function formatAnswerContent(question: Question, index: number): string {
  const questionNumber = index + 1;
  let content = `**Answer ${questionNumber}:** ${question.answer}\n\n`;
  
  if (question.explanation) {
    content += `**Explanation:** ${question.explanation}\n\n`;
  }
  
  return content;
}

/**
 * Formatter for solved examples format
 * Shows answers and explanations immediately after each question
 */
export class SolvedExamplesFormatter implements QuestionFormatter {
  format(questions: Question[]): FormattedOutput {
    let combinedContent = '';
    
    questions.forEach((question, index) => {
      // Add question
      combinedContent += formatQuestionContent(question, index);
      
      // Add answer immediately after question
      combinedContent += formatAnswerContent(question, index);
      
      // Add separator between questions (except for the last one)
      if (index < questions.length - 1) {
        combinedContent += '---\n\n';
      }
    });
    
    const document: Document = {
      title: 'Solved Examples',
      content: combinedContent,
      type: 'combined'
    };
    
    return {
      format: 'solved-examples',
      questions,
      documents: [document]
    };
  }
}

/**
 * Formatter for assignment format
 * Shows all questions first, then answer key at the end
 */
export class AssignmentFormatter implements QuestionFormatter {
  format(questions: Question[]): FormattedOutput {
    // Generate questions section
    let questionsContent = '# Questions\n\n';
    questions.forEach((question, index) => {
      questionsContent += formatQuestionContent(question, index);
    });
    
    // Generate answer key section
    let answersContent = '# Answer Key\n\n';
    questions.forEach((question, index) => {
      answersContent += formatAnswerContent(question, index);
    });
    
    // Combine both sections in a single document
    const combinedContent = questionsContent + '\n---\n\n' + answersContent;
    
    const document: Document = {
      title: 'Assignment with Answer Key',
      content: combinedContent,
      type: 'combined'
    };
    
    return {
      format: 'assignment-format',
      questions,
      documents: [document]
    };
  }
}

/**
 * Formatter for separate documents format
 * Creates two distinct documents: questions only and answer key
 */
export class SeparateDocumentsFormatter implements QuestionFormatter {
  format(questions: Question[]): FormattedOutput {
    // Generate questions-only document
    let questionsContent = '';
    questions.forEach((question, index) => {
      questionsContent += formatQuestionContent(question, index);
    });
    
    // Generate answer key document
    let answersContent = '';
    questions.forEach((question, index) => {
      answersContent += formatAnswerContent(question, index);
    });
    
    const questionsDocument: Document = {
      title: 'Questions',
      content: questionsContent,
      type: 'questions'
    };
    
    const answersDocument: Document = {
      title: 'Answer Key',
      content: answersContent,
      type: 'answers'
    };
    
    return {
      format: 'separate-documents',
      questions,
      documents: [questionsDocument, answersDocument]
    };
  }
}