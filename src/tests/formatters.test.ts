import { 
  SolvedExamplesFormatter, 
  AssignmentFormatter, 
  SeparateDocumentsFormatter,
  getFormatter,
  formatQuestionContent,
  formatAnswerContent
} from '../lib/formatters';
import { Question, OutputFormat } from '../lib/schema';

// Mock question data for testing
const mockMCQQuestion: Question = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  stem: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  answer: 'Paris',
  explanation: 'Paris is the capital and largest city of France.',
  difficulty: 'Beginner',
  subject: 'Geography'
};

const mockSubjectiveQuestion: Question = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  stem: 'Explain the process of photosynthesis.',
  answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
  explanation: 'This process occurs in chloroplasts and involves light-dependent and light-independent reactions.',
  difficulty: 'Amateur',
  subject: 'Biology'
};

const mockQuestions: Question[] = [mockMCQQuestion, mockSubjectiveQuestion];

describe('Utility Functions', () => {
  describe('formatQuestionContent', () => {
    it('should format MCQ question with options correctly', () => {
      const result = formatQuestionContent(mockMCQQuestion, 0);
      
      expect(result).toContain('**Question 1:** What is the capital of France?');
      expect(result).toContain('A. London');
      expect(result).toContain('B. Berlin');
      expect(result).toContain('C. Paris');
      expect(result).toContain('D. Madrid');
    });

    it('should format subjective question without options', () => {
      const result = formatQuestionContent(mockSubjectiveQuestion, 1);
      
      expect(result).toContain('**Question 2:** Explain the process of photosynthesis.');
      expect(result).not.toContain('A.');
      expect(result).not.toContain('B.');
    });

    it('should handle question numbering correctly', () => {
      const result = formatQuestionContent(mockMCQQuestion, 4);
      expect(result).toContain('**Question 5:**');
    });
  });

  describe('formatAnswerContent', () => {
    it('should format answer with explanation', () => {
      const result = formatAnswerContent(mockMCQQuestion, 0);
      
      expect(result).toContain('**Answer 1:** Paris');
      expect(result).toContain('**Explanation:** Paris is the capital and largest city of France.');
    });

    it('should format answer without explanation', () => {
      const questionWithoutExplanation: Question = {
        ...mockMCQQuestion,
        explanation: undefined
      };
      
      const result = formatAnswerContent(questionWithoutExplanation, 0);
      
      expect(result).toContain('**Answer 1:** Paris');
      expect(result).not.toContain('**Explanation:**');
    });

    it('should handle answer numbering correctly', () => {
      const result = formatAnswerContent(mockMCQQuestion, 2);
      expect(result).toContain('**Answer 3:**');
    });
  });
});

describe('SolvedExamplesFormatter', () => {
  let formatter: SolvedExamplesFormatter;

  beforeEach(() => {
    formatter = new SolvedExamplesFormatter();
  });

  it('should create a single combined document', () => {
    const result = formatter.format(mockQuestions);
    
    expect(result.format).toBe('solved-examples');
    expect(result.questions).toEqual(mockQuestions);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].type).toBe('combined');
    expect(result.documents[0].title).toBe('Solved Examples');
  });

  it('should interleave questions and answers', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    // Check that first question appears before first answer
    const question1Index = content.indexOf('**Question 1:**');
    const answer1Index = content.indexOf('**Answer 1:**');
    const question2Index = content.indexOf('**Question 2:**');
    const answer2Index = content.indexOf('**Answer 2:**');
    
    expect(question1Index).toBeLessThan(answer1Index);
    expect(answer1Index).toBeLessThan(question2Index);
    expect(question2Index).toBeLessThan(answer2Index);
  });

  it('should include separators between question-answer pairs', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    // Should have separator between first and second question-answer pair
    expect(content).toContain('---');
  });

  it('should handle single question correctly', () => {
    const result = formatter.format([mockMCQQuestion]);
    const content = result.documents[0].content;
    
    expect(content).toContain('**Question 1:**');
    expect(content).toContain('**Answer 1:**');
    expect(content).not.toContain('---'); // No separator for single question
  });

  it('should handle empty questions array', () => {
    const result = formatter.format([]);
    
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].content).toBe('');
  });

  it('should maintain question order', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    const question1Index = content.indexOf('What is the capital of France?');
    const question2Index = content.indexOf('Explain the process of photosynthesis.');
    
    expect(question1Index).toBeLessThan(question2Index);
  });

  it('should include all question options for MCQ', () => {
    const result = formatter.format([mockMCQQuestion]);
    const content = result.documents[0].content;
    
    expect(content).toContain('A. London');
    expect(content).toContain('B. Berlin');
    expect(content).toContain('C. Paris');
    expect(content).toContain('D. Madrid');
  });

  it('should include explanations when available', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    expect(content).toContain('Paris is the capital and largest city of France.');
    expect(content).toContain('This process occurs in chloroplasts');
  });
});

describe('AssignmentFormatter', () => {
  let formatter: AssignmentFormatter;

  beforeEach(() => {
    formatter = new AssignmentFormatter();
  });

  it('should create a single combined document with questions and answer key sections', () => {
    const result = formatter.format(mockQuestions);
    
    expect(result.format).toBe('assignment-format');
    expect(result.questions).toEqual(mockQuestions);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].type).toBe('combined');
    expect(result.documents[0].title).toBe('Assignment with Answer Key');
  });

  it('should separate questions from answers with distinct sections', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    // Check that questions section comes before answer key section
    const questionsHeaderIndex = content.indexOf('# Questions');
    const answerKeyHeaderIndex = content.indexOf('# Answer Key');
    
    expect(questionsHeaderIndex).toBeLessThan(answerKeyHeaderIndex);
    expect(questionsHeaderIndex).toBeGreaterThan(-1);
    expect(answerKeyHeaderIndex).toBeGreaterThan(-1);
  });

  it('should include section separator between questions and answers', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    expect(content).toContain('---');
  });

  it('should place all questions in the questions section without answers', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    const questionsSection = content.split('# Answer Key')[0];
    
    // Questions should be present in questions section
    expect(questionsSection).toContain('**Question 1:** What is the capital of France?');
    expect(questionsSection).toContain('**Question 2:** Explain the process of photosynthesis.');
    
    // Answers should NOT be present in questions section
    expect(questionsSection).not.toContain('**Answer 1:**');
    expect(questionsSection).not.toContain('**Answer 2:**');
  });

  it('should place all answers in the answer key section', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    const answerKeySection = content.split('# Answer Key')[1];
    
    // Answers should be present in answer key section
    expect(answerKeySection).toContain('**Answer 1:** Paris');
    expect(answerKeySection).toContain('**Answer 2:** Photosynthesis is the process');
    
    // Explanations should be included
    expect(answerKeySection).toContain('**Explanation:** Paris is the capital and largest city of France.');
    expect(answerKeySection).toContain('**Explanation:** This process occurs in chloroplasts');
  });

  it('should maintain question numbering consistency between sections', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    const questionsSection = content.split('# Answer Key')[0];
    const answerKeySection = content.split('# Answer Key')[1];
    
    // Question numbers should match between sections
    expect(questionsSection).toContain('**Question 1:**');
    expect(questionsSection).toContain('**Question 2:**');
    expect(answerKeySection).toContain('**Answer 1:**');
    expect(answerKeySection).toContain('**Answer 2:**');
  });

  it('should include MCQ options in questions section', () => {
    const result = formatter.format([mockMCQQuestion]);
    const content = result.documents[0].content;
    
    const questionsSection = content.split('# Answer Key')[0];
    
    expect(questionsSection).toContain('A. London');
    expect(questionsSection).toContain('B. Berlin');
    expect(questionsSection).toContain('C. Paris');
    expect(questionsSection).toContain('D. Madrid');
  });

  it('should handle empty questions array', () => {
    const result = formatter.format([]);
    
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].content).toContain('# Questions');
    expect(result.documents[0].content).toContain('# Answer Key');
  });

  it('should handle single question correctly', () => {
    const result = formatter.format([mockMCQQuestion]);
    const content = result.documents[0].content;
    
    expect(content).toContain('# Questions');
    expect(content).toContain('**Question 1:**');
    expect(content).toContain('# Answer Key');
    expect(content).toContain('**Answer 1:**');
  });

  it('should maintain question order in both sections', () => {
    const result = formatter.format(mockQuestions);
    const content = result.documents[0].content;
    
    const questionsSection = content.split('# Answer Key')[0];
    const answerKeySection = content.split('# Answer Key')[1];
    
    // Check order in questions section
    const q1Index = questionsSection.indexOf('What is the capital of France?');
    const q2Index = questionsSection.indexOf('Explain the process of photosynthesis.');
    expect(q1Index).toBeLessThan(q2Index);
    
    // Check order in answer key section
    const a1Index = answerKeySection.indexOf('**Answer 1:**');
    const a2Index = answerKeySection.indexOf('**Answer 2:**');
    expect(a1Index).toBeLessThan(a2Index);
  });
});

describe('SeparateDocumentsFormatter', () => {
  let formatter: SeparateDocumentsFormatter;

  beforeEach(() => {
    formatter = new SeparateDocumentsFormatter();
  });

  it('should create two separate documents', () => {
    const result = formatter.format(mockQuestions);
    
    expect(result.format).toBe('separate-documents');
    expect(result.questions).toEqual(mockQuestions);
    expect(result.documents).toHaveLength(2);
  });

  it('should create questions document and answer key document', () => {
    const result = formatter.format(mockQuestions);
    
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    expect(questionsDoc).toBeDefined();
    expect(answersDoc).toBeDefined();
    expect(questionsDoc?.title).toBe('Questions');
    expect(answersDoc?.title).toBe('Answer Key');
  });

  it('should include only questions in the questions document', () => {
    const result = formatter.format(mockQuestions);
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    
    expect(questionsDoc?.content).toContain('**Question 1:** What is the capital of France?');
    expect(questionsDoc?.content).toContain('**Question 2:** Explain the process of photosynthesis.');
    
    // Should NOT contain answers or explanations
    expect(questionsDoc?.content).not.toContain('**Answer 1:**');
    expect(questionsDoc?.content).not.toContain('**Answer 2:**');
    expect(questionsDoc?.content).not.toContain('**Explanation:**');
  });

  it('should include only answers in the answer key document', () => {
    const result = formatter.format(mockQuestions);
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    expect(answersDoc?.content).toContain('**Answer 1:** Paris');
    expect(answersDoc?.content).toContain('**Answer 2:** Photosynthesis is the process');
    
    // Should include explanations
    expect(answersDoc?.content).toContain('**Explanation:** Paris is the capital and largest city of France.');
    expect(answersDoc?.content).toContain('**Explanation:** This process occurs in chloroplasts');
    
    // Should NOT contain question stems
    expect(answersDoc?.content).not.toContain('What is the capital of France?');
    expect(answersDoc?.content).not.toContain('Explain the process of photosynthesis.');
  });

  it('should include MCQ options in questions document only', () => {
    const result = formatter.format([mockMCQQuestion]);
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    // Questions document should have options
    expect(questionsDoc?.content).toContain('A. London');
    expect(questionsDoc?.content).toContain('B. Berlin');
    expect(questionsDoc?.content).toContain('C. Paris');
    expect(questionsDoc?.content).toContain('D. Madrid');
    
    // Answer key document should NOT have options
    expect(answersDoc?.content).not.toContain('A. London');
    expect(answersDoc?.content).not.toContain('B. Berlin');
  });

  it('should maintain consistent question numbering between documents', () => {
    const result = formatter.format(mockQuestions);
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    // Both documents should have matching question numbers
    expect(questionsDoc?.content).toContain('**Question 1:**');
    expect(questionsDoc?.content).toContain('**Question 2:**');
    expect(answersDoc?.content).toContain('**Answer 1:**');
    expect(answersDoc?.content).toContain('**Answer 2:**');
  });

  it('should maintain question order in both documents', () => {
    const result = formatter.format(mockQuestions);
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    // Check order in questions document
    const q1Index = questionsDoc?.content.indexOf('What is the capital of France?') ?? -1;
    const q2Index = questionsDoc?.content.indexOf('Explain the process of photosynthesis.') ?? -1;
    expect(q1Index).toBeLessThan(q2Index);
    
    // Check order in answer key document
    const a1Index = answersDoc?.content.indexOf('**Answer 1:**') ?? -1;
    const a2Index = answersDoc?.content.indexOf('**Answer 2:**') ?? -1;
    expect(a1Index).toBeLessThan(a2Index);
  });

  it('should handle empty questions array', () => {
    const result = formatter.format([]);
    
    expect(result.documents).toHaveLength(2);
    
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    expect(questionsDoc?.content).toBe('');
    expect(answersDoc?.content).toBe('');
  });

  it('should handle single question correctly', () => {
    const result = formatter.format([mockMCQQuestion]);
    
    expect(result.documents).toHaveLength(2);
    
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    expect(questionsDoc?.content).toContain('**Question 1:**');
    expect(answersDoc?.content).toContain('**Answer 1:**');
  });

  it('should handle questions without explanations', () => {
    const questionWithoutExplanation: Question = {
      ...mockMCQQuestion,
      explanation: undefined
    };
    
    const result = formatter.format([questionWithoutExplanation]);
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    expect(answersDoc?.content).toContain('**Answer 1:** Paris');
    expect(answersDoc?.content).not.toContain('**Explanation:**');
  });

  it('should handle mixed question types correctly', () => {
    const result = formatter.format(mockQuestions);
    const questionsDoc = result.documents.find(doc => doc.type === 'questions');
    const answersDoc = result.documents.find(doc => doc.type === 'answers');
    
    // MCQ question should have options in questions doc
    expect(questionsDoc?.content).toContain('A. London');
    expect(questionsDoc?.content).toContain('B. Berlin');
    expect(questionsDoc?.content).toContain('C. Paris');
    expect(questionsDoc?.content).toContain('D. Madrid');
    
    // Subjective question should be present but without options
    expect(questionsDoc?.content).toContain('**Question 2:** Explain the process of photosynthesis.');
    
    // Both should have answers in answer key
    expect(answersDoc?.content).toContain('**Answer 1:** Paris');
    expect(answersDoc?.content).toContain('**Answer 2:** Photosynthesis is the process');
  });
});

describe('getFormatter', () => {
  it('should return SolvedExamplesFormatter for solved-examples format', () => {
    const formatter = getFormatter('solved-examples');
    expect(formatter).toBeInstanceOf(SolvedExamplesFormatter);
  });

  it('should return AssignmentFormatter for assignment-format', () => {
    const formatter = getFormatter('assignment-format');
    expect(formatter).toBeInstanceOf(AssignmentFormatter);
  });

  it('should return SeparateDocumentsFormatter for separate-documents format', () => {
    const formatter = getFormatter('separate-documents');
    expect(formatter).toBeInstanceOf(SeparateDocumentsFormatter);
  });

  it('should return SolvedExamplesFormatter as fallback for unknown format', () => {
    const formatter = getFormatter('unknown-format' as OutputFormat);
    expect(formatter).toBeInstanceOf(SolvedExamplesFormatter);
  });
});