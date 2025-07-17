'use client';

import React from 'react';
import { Question } from '@/lib/schema';
import { Key, CheckCircle, Info } from 'lucide-react';

interface AnswerKeyViewProps {
  questions: Question[];
  className?: string;
  showExplanations?: boolean;
}

/**
 * AnswerKeyView component for displaying answer key with question numbers
 * Includes answers and explanations in structured format for grading reference
 */
const AnswerKeyView: React.FC<AnswerKeyViewProps> = ({ 
  questions, 
  className = '',
  showExplanations = true 
}) => {
  const renderAnswerItem = (question: Question, index: number) => (
    <div
      key={question.id || index}
      className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50"
      role="article"
      aria-labelledby={`answer-${index + 1}`}
    >
      {/* Answer Header */}
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h3 
          id={`answer-${index + 1}`}
          className="text-lg font-semibold text-green-800"
        >
          Answer {index + 1}
        </h3>
        
        {/* Question metadata */}
        <div className="ml-auto flex gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
            {question.difficulty}
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {question.subject}
          </span>
        </div>
      </div>

      {/* Question Reference (abbreviated) */}
      <div className="mb-3 p-2 bg-white border border-green-200 rounded">
        <p className="text-sm text-gray-600 font-medium mb-1">Question:</p>
        <p className="text-sm text-gray-800 line-clamp-2">
          {question.stem.length > 100 
            ? `${question.stem.substring(0, 100)}...` 
            : question.stem
          }
        </p>
      </div>

      {/* Correct Answer */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <span className="font-semibold text-green-700 min-w-[80px]">
            Correct Answer:
          </span>
          <span className="font-medium text-green-800 bg-green-100 px-2 py-1 rounded">
            {question.answer}
          </span>
        </div>
      </div>

      {/* Multiple Choice Options (if applicable) */}
      {question.options && question.options.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options.map((option, optIndex) => {
              const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
              const isCorrect = option.trim().toLowerCase() === question.answer.trim().toLowerCase();
              return (
                <div
                  key={optIndex}
                  className={`flex items-start gap-2 p-2 rounded text-sm ${
                    isCorrect 
                      ? 'bg-green-200 text-green-800 font-semibold border border-green-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium min-w-[20px]">
                    {optionLabel}.
                  </span>
                  <span className="flex-1">
                    {option}
                  </span>
                  {isCorrect && (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanation */}
      {showExplanations && question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 mb-1">Explanation:</p>
              <p className="text-blue-700 text-sm leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`space-y-6 ${className}`}
      role="main"
      aria-label="Answer key for questions"
    >
      {/* Header */}
      <div className="text-center mb-8 p-4 border-b border-gray-200">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Key className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            Answer Key
          </h1>
        </div>
        <p className="text-gray-600">
          Total Questions: {questions.length}
        </p>
      </div>

      {/* Instructions for graders */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-amber-800 mb-2">Grading Instructions:</h2>
        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>Each correct answer is highlighted in green</li>
          <li>For MCQ questions, only the marked option should be considered correct</li>
          <li>For subjective questions, use the explanation as a grading rubric</li>
          <li>Award partial credit for subjective answers that demonstrate understanding</li>
        </ul>
      </div>

      {/* Answer Key Items */}
      <div className="space-y-6">
        {questions.length > 0 ? (
          questions.map((question, index) => renderAnswerItem(question, index))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No answers available</p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {questions.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Answer Key Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-gray-600">Total Questions</p>
              <p className="text-xl font-bold text-gray-800">{questions.length}</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-600">MCQ Questions</p>
              <p className="text-xl font-bold text-blue-600">
                {questions.filter(q => q.options && q.options.length > 0).length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-600">Subjective Questions</p>
              <p className="text-xl font-bold text-purple-600">
                {questions.filter(q => !q.options || q.options.length === 0).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-12 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          End of Answer Key
        </p>
      </div>
    </div>
  );
};

export default AnswerKeyView;