'use client';

import React from 'react';
import { Question } from '@/lib/schema';

interface QuestionListProps {
  questions: Question[];
}

const QuestionList: React.FC<QuestionListProps> = ({ questions }) => {
  const renderQuestion = (question: Question, index: number) => (
    <div
      key={question.id || index}
      className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50"
    >
      {/* Header */}
      <div className="mb-3 flex items-center flex-wrap gap-2 text-sm">
        <span className="font-semibold text-gray-600">Question {index + 1}</span>
        <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded capitalize">
          {question.difficulty}
        </span>
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {question.subject}
        </span>
      </div>

      {/* Stem */}
      <p className="text-black font-medium mb-4 whitespace-pre-wrap">
        {question.stem}
      </p>

      {/* Options */}
      {question.options && question.options.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
          <div className="space-y-1">
            {question.options.map((opt, idx) => {
              const label = String.fromCharCode(65 + idx);
              const isCorrect = opt.trim().toLowerCase() === question.answer.trim().toLowerCase();
              return (
                <div
                  key={idx}
                  className={
                    'text-sm flex items-start gap-2 ' +
                    (isCorrect ? 'text-green-800 font-semibold' : 'text-gray-800')
                  }
                >
                  <span className="font-medium">{label}.</span>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Answer & Explanation */}
      <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
        <p>
          <span className="font-medium text-green-700">Answer:&nbsp;</span>
          <span className="text-green-800 whitespace-pre-wrap">{question.answer}</span>
        </p>
        {question.explanation && (
          <p>
            <span className="font-medium text-gray-700">Explanation:&nbsp;</span>
            <span className="text-gray-800 whitespace-pre-wrap">
              {question.explanation}
            </span>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {questions.map((q, idx) => renderQuestion(q, idx))}
    </div>
  );
};

export default QuestionList; 