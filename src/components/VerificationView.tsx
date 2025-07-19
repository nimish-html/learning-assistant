'use client';

import React from 'react';
import QuestionList from '@/components/QuestionList';
import { Question } from '@/lib/schema';

interface Issue {
  questionId: string;
  type: 'duplicate' | 'syllabus' | 'answer_key' | 'format' | string;
  description: string;
  severity: 'high' | 'medium' | 'low' | string;
}

export interface VerificationResult {
  validQuestions: Question[];
  issues: Issue[];
  summary: {
    totalQuestions: number;
    validQuestions: number;
    issuesFound: number;
    duplicatesRemoved: number;
  };
}

interface VerificationViewProps {
  data: VerificationResult;
}

const badgeColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-200 text-red-800';
    case 'medium':
      return 'bg-yellow-200 text-yellow-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

const VerificationView: React.FC<VerificationViewProps> = ({ data }) => {
  const { summary, issues, validQuestions } = data;
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-3">Verification Summary</h3>
        <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
          <li>Total questions: {summary.totalQuestions}</li>
          <li>Valid questions: {summary.validQuestions}</li>
          <li>Issues found: {summary.issuesFound}</li>
          <li>Duplicates removed: {summary.duplicatesRemoved}</li>
        </ul>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-black mb-4">Issues</h3>
          <div className="space-y-4">
            {issues.map((issue, idx) => (
              <div key={idx} className="border border-gray-100 p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="font-medium">Question ID: {issue.questionId}</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${badgeColor(issue.severity)}`}>{issue.severity}</span>
                </div>
                <p className="text-sm text-gray-800 mb-1"><span className="font-semibold">Type:</span> {issue.type}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Description:</span> {issue.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Valid questions display */}
      {validQuestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">Valid Questions</h3>
          <QuestionList questions={validQuestions} />
        </div>
      )}
    </div>
  );
};

export default VerificationView; 