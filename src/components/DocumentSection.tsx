'use client';

import React from 'react';
import { Document } from '@/lib/schema';
import { FileText, HelpCircle, Key } from 'lucide-react';

interface DocumentSectionProps {
  document: Document;
  className?: string;
}

/**
 * DocumentSection component for rendering formatted documents
 * Handles different document types (questions, answers, combined) with appropriate styling
 */
const DocumentSection: React.FC<DocumentSectionProps> = ({ 
  document, 
  className = '' 
}) => {
  // Get icon based on document type
  const getDocumentIcon = () => {
    switch (document.type) {
      case 'questions':
        return <HelpCircle className="w-5 h-5 text-blue-600" />;
      case 'answers':
        return <Key className="w-5 h-5 text-green-600" />;
      case 'combined':
        return <FileText className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get styling based on document type
  const getDocumentStyling = () => {
    switch (document.type) {
      case 'questions':
        return {
          containerClass: 'border-blue-200 bg-blue-50',
          headerClass: 'text-blue-800 bg-blue-100',
          contentClass: 'text-blue-900'
        };
      case 'answers':
        return {
          containerClass: 'border-green-200 bg-green-50',
          headerClass: 'text-green-800 bg-green-100',
          contentClass: 'text-green-900'
        };
      case 'combined':
        return {
          containerClass: 'border-purple-200 bg-purple-50',
          headerClass: 'text-purple-800 bg-purple-100',
          contentClass: 'text-purple-900'
        };
      default:
        return {
          containerClass: 'border-gray-200 bg-gray-50',
          headerClass: 'text-gray-800 bg-gray-100',
          contentClass: 'text-gray-900'
        };
    }
  };

  const styling = getDocumentStyling();

  // Process content to handle markdown-like formatting
  const processContent = (content: string) => {
    // Split content by lines and process each line
    return content.split('\n').map((line, index) => {
      // Handle headers (lines starting with #)
      if (line.startsWith('# ')) {
        return (
          <h2 
            key={index} 
            className="text-xl font-bold mb-4 mt-6 first:mt-0 text-gray-800"
          >
            {line.substring(2)}
          </h2>
        );
      }
      
      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2 leading-relaxed">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <strong key={partIndex} className="font-semibold">
                  {part}
                </strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </p>
        );
      }
      
      // Handle horizontal rules (---)
      if (line.trim() === '---') {
        return (
          <hr 
            key={index} 
            className="my-6 border-t-2 border-gray-300" 
          />
        );
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <div key={index} className="mb-2" />;
      }
      
      // Regular text lines
      return (
        <p key={index} className="mb-2 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <section 
      className={`border rounded-lg p-6 mb-6 ${styling.containerClass} ${className}`}
      role="region"
      aria-labelledby={`document-title-${document.type}`}
    >
      {/* Document Header */}
      <header className={`flex items-center gap-3 mb-4 p-3 rounded-md ${styling.headerClass}`}>
        {getDocumentIcon()}
        <h1 
          id={`document-title-${document.type}`}
          className="text-lg font-semibold"
        >
          {document.title}
        </h1>
      </header>

      {/* Document Content */}
      <div 
        className={`${styling.contentClass} prose prose-sm max-w-none`}
        role="main"
        aria-label={`${document.title} content`}
      >
        {document.content ? (
          <div className="whitespace-pre-wrap">
            {processContent(document.content)}
          </div>
        ) : (
          <p className="text-gray-500 italic">No content available</p>
        )}
      </div>
    </section>
  );
};

export default DocumentSection;