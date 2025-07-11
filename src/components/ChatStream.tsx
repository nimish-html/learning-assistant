'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Question } from '@/lib/schema';

interface ChatStreamProps {
  onVerify?: (questions: Question[]) => void;
}

export default function ChatStream({ onVerify }: ChatStreamProps) {
  const { messages, isLoading, error, reload } = useChat({
    api: '/api/generate',
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Parse questions from the latest assistant message
  const getLatestQuestions = (): Question[] | null => {
    const lastAssistantMessage = messages
      .filter(m => m.role === 'assistant')
      .pop();
    
    if (!lastAssistantMessage?.content) return null;
    
    try {
      const parsed = JSON.parse(lastAssistantMessage.content);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const handleVerify = async () => {
    const questions = getLatestQuestions();
    if (!questions || questions.length === 0) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Process verification stream here
        const chunk = new TextDecoder().decode(value);
        console.log('Verification chunk:', chunk);
      }

      if (onVerify) {
        onVerify(questions);
      }
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatQuestion = (question: Question, index: number) => {
    return (
      <div key={question.id || index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        <div className="mb-3">
          <span className="text-sm font-semibold text-gray-600">Question {index + 1}</span>
          <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
            {question.difficulty}
          </span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {question.subject}
          </span>
        </div>
        
        <p className="text-black font-medium mb-3">{question.stem}</p>
        
        {question.options && question.options.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
            <div className="space-y-1">
              {question.options.map((option, optIdx) => (
                <div key={optIdx} className="text-sm text-gray-800">
                  <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm">
            <span className="font-medium text-green-700">Answer: </span>
            <span className="text-green-800">{question.answer}</span>
          </p>
          {question.explanation && (
            <p className="text-sm mt-2">
              <span className="font-medium text-gray-700">Explanation: </span>
              <span className="text-gray-800">{question.explanation}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  const formatMessageContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].stem) {
        // This looks like questions array
        return (
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Generated Questions:</h3>
            {parsed.map((question: Question, index: number) => formatQuestion(question, index))}
          </div>
        );
      }
    } catch {
      // Not JSON, treat as regular text
    }
    
    return <pre className="whitespace-pre-wrap text-black">{content}</pre>;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Messages */}
      <div className="space-y-4 mb-6">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="text-sm font-medium text-gray-600 mb-1">
              {message.role === 'user' ? '👤 User' : '🤖 AI Assistant'}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {message.role === 'assistant' 
                ? formatMessageContent(message.content)
                : <p className="text-black">{message.content}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
            <span className="text-gray-600">Generating questions...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 font-medium">Error occurred</p>
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            </div>
            <button
              onClick={() => reload()}
              className="text-red-700 hover:text-red-900 text-sm underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Verification Error */}
      {verificationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <p className="text-red-800 font-medium">Verification Error</p>
          <p className="text-red-600 text-sm mt-1">{verificationError}</p>
        </div>
      )}

      {/* Verification Button */}
      {getLatestQuestions() && !isLoading && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="bg-white border-2 border-black text-black py-2 px-6 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isVerifying ? 'Verifying Questions...' : 'Verify Questions'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {messages.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          <p>Fill out the form above to generate practice questions.</p>
        </div>
      )}
    </div>
  );
} 