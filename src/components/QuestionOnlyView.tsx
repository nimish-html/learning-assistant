'use client';

import React from 'react';
import { Question } from '@/lib/schema';
import { HelpCircle } from 'lucide-react';

interface QuestionOnlyViewProps {
  questions: Question[];
  className?: string;
  showMetadata?: boolean;
}

/**
 * QuestionOnlyView component for displaying questions without answers or explanations
 * Designed for clean formatting suitable for test papers and assignments
 */
const QuestionOnlyView: React.FC<QuestionOnlyViewProps> = ({ 
  questions, 
  className = '',
  showMetadata = false 
}) => {
  const renderQuestion = (question: Question, index: number) => (
    <div
      key={question.id || index}
      className="mb-8 p-4 border border-gray-200 rounded-lg bg-white"
      role="article"
      aria-labelledby={`question-${index + 1}`}
    >
      {/* Question Header */}
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-blue-600" />
        <h3 
          id={`question-${index + 1}`}
          className="text-lg font-semibold text-gray-800"
        >
          Question {index + 1}
        </h3>
        
        {/* Optional metadata display */}
        {showMetadata && (
          <div className="ml-auto flex gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
              {question.difficulty}
            </span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              {question.subject}
            </span>
          </div>
        )}
      </div>

      {/* Question Stem */}
      <div className="mb-4">
        <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
          {question.stem}
        </p>
      </div>

      {/* Multiple Choice Options */}
      {question.options && question.options.length > 0 && (
        <div className="ml-4">
          <div className="space-y-2">
            {question.options.map((option, optIndex) => {
              const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
              return (
                <div
                  key={optIndex}
                  className="flex items-start gap-3 text-gray-800"
                >
                  <span className="font-medium text-gray-600 min-w-[20px]">
                    {optionLabel}.
                  </span>
                  <span className="leading-relaxed">
                    {option}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Answer Space for Subjective Questions */}
      {(!question.options || question.options.length === 0) && (
        <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">Answer:</p>
          <div className="space-y-3">
            {/* Provide lined space for written answers */}
            {[...Array(4)].map((_, lineIndex) => (
              <div 
                key={lineIndex}
                className="border-b border-gray-300 h-6"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`space-y-6 ${className}`}
      role="main"
      aria-label="Questions for test or assignment"
    >
      {/* Header */}
      <div className="text-center mb-8 p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Question Paper
        </h1>
        <p className="text-gray-600">
          Total Questions: {questions.length}
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">Instructions:</h2>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Read all questions carefully before answering</li>
          <li>For multiple choice questions, select the best answer</li>
          <li>For subjective questions, write your answers in the space provided</li>
          <li>Manage your time effectively</li>
        </ul>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.length > 0 ? (
          questions.map((question, index) => renderQuestion(question, index))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No questions available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          End of Question Paper
        </p>
      </div>
    </div>
  );
};

export default QuestionOnlyView;