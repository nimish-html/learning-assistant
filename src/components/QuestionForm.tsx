'use client';

import { useState } from 'react';
import { GeneratePayload, GeneratePayloadSchema } from '@/lib/schema';
import { GraduationCap, Settings, BookOpen, Target, Hash, FileText } from 'lucide-react';

interface QuestionFormProps {
  onSubmit: (payload: GeneratePayload) => void;
  isLoading?: boolean;
}

const examOptions = [
  { value: 'JEE (India)', label: '🇮🇳 JEE (India)' },
  { value: 'NEET (India)', label: '🇮🇳 NEET (India)' },
  { value: 'SAT (US)', label: '🇺🇸 SAT (US)' },
  { value: 'MCAT (US)', label: '🇺🇸 MCAT (US)' },
  { value: 'German Abitur STEM', label: '🇪🇺 German Abitur STEM' },
  { value: 'French Baccalauréat Série S', label: '🇪🇺 French Baccalauréat Série S' },
  { value: 'EmSAT Physics/Math (UAE)', label: '🇦🇪 EmSAT Physics/Math (UAE)' },
  { value: 'EmSAT Chemistry (UAE)', label: '🇦🇪 EmSAT Chemistry (UAE)' },
];

export default function QuestionForm({ onSubmit, isLoading = false }: QuestionFormProps) {
  const [formData, setFormData] = useState<Partial<GeneratePayload>>({
    exam: '',
    classStandard: '12th',
    count: 5,
    difficulty: 'Amateur',
    type: 'MCQ',
    preferredSource: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GeneratePayload, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = GeneratePayloadSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof GeneratePayload, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof GeneratePayload;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    onSubmit(result.data);
  };

  const handleInputChange = (field: keyof GeneratePayload, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Generate STEM Questions</h2>
              <p className="text-white/80">Create practice questions for competitive exams</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6" data-testid="question-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Exam by Country *</label>
              </div>
              <select
                value={formData.exam || ''}
                onChange={(e) => handleInputChange('exam', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="">Select an exam...</option>
                {examOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.exam && <p className="text-sm text-red-600">{errors.exam}</p>}
            </div>

            {/* Class/Standard */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Class/Standard *</label>
              </div>
              <select
                value={formData.classStandard || '12th'}
                onChange={(e) => handleInputChange('classStandard', e.target.value as '11th' | '12th')}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
              </select>
              {errors.classStandard && <p className="text-sm text-red-600">{errors.classStandard}</p>}
            </div>

            {/* Number of Questions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Number of Questions *</label>
              </div>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.count ?? ''}
                onChange={(e) => handleInputChange('count', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                disabled={isLoading}
                placeholder="Enter number of questions (1-50)"
              />
              {errors.count && <p className="text-sm text-red-600">{errors.count}</p>}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Difficulty Level *</label>
              </div>
              <select
                value={formData.difficulty || 'Amateur'}
                onChange={(e) => handleInputChange('difficulty', e.target.value as 'Beginner' | 'Amateur' | 'Ninja')}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="Beginner">Beginner</option>
                <option value="Amateur">Amateur</option>
                <option value="Ninja">Ninja</option>
              </select>
              {errors.difficulty && <p className="text-sm text-red-600">{errors.difficulty}</p>}
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Question Type *</label>
              </div>
              <select
                value={formData.type || 'MCQ'}
                onChange={(e) => handleInputChange('type', e.target.value as 'MCQ' | 'Subjective')}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="MCQ">Multiple Choice Questions (MCQ)</option>
                <option value="Subjective">Subjective Questions</option>
              </select>
              {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
            </div>

            {/* Preferred Source - Full Width */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Preferred Source (Optional)</label>
              </div>
              <input
                type="text"
                value={formData.preferredSource || ''}
                onChange={(e) => handleInputChange('preferredSource', e.target.value)}
                placeholder="e.g., NCERT, Khan Academy, specific textbook..."
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                disabled={isLoading}
              />
              {errors.preferredSource && <p className="text-sm text-red-600">{errors.preferredSource}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[200px] justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  Generate Questions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 