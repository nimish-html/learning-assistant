'use client';

import { useCompletion } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import QuestionForm from '@/components/QuestionForm';
import QuestionList from '@/components/QuestionList';
import VerificationView from '@/components/VerificationView';
import { GeneratePayload, Question, QuestionSchema } from '@/lib/schema';
import { 
  Brain, 
  Sparkles, 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw,
  BookOpen,
  Target,
  Users,
  Award,
  X
} from 'lucide-react';

export default function TutoratiApp() {
  // Configure the hook to expect a **raw text** stream instead of the default `data` protocol
  // This prevents "Failed to parse stream string" errors that are harmless for plain text streams.
  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/generate',
    streamProtocol: 'text',
  });
  
  const [showForm, setShowForm] = useState(true);
  const [lastPayload, setLastPayload] = useState<GeneratePayload | null>(null);
  
  // New state for questions and verification
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Parse completion when it changes and loading finishes
  useEffect(() => {
    if (!completion || isLoading) return;
    
    console.log('Parsing completion:', completion.substring(0, 100) + '...');
    
    try {
      // Extract pure JSON array from the streamed text
      let jsonStr = completion.trim();

      // Strip AI markdown fences
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // If stream markers like "0:" or "e:" are present, grab the substring between first '[' and last ']'
      if (jsonStr.includes('0:"') || jsonStr.match(/^\d:/m)) {
        const start = jsonStr.indexOf('[');
        const end = jsonStr.lastIndexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
          jsonStr = jsonStr.substring(start, end + 1);
        }
      }

      // Fix: If AI returned object instead of array, wrap it in brackets
      jsonStr = jsonStr.trim();
      if (jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
        // For single questions, check if JSON is complete
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        
        // If incomplete (missing closing braces), try to complete it
        if (openBraces > closeBraces) {
          const missingBraces = openBraces - closeBraces;
          jsonStr += '}'.repeat(missingBraces);
        }
        
        jsonStr = '[' + jsonStr + ']';
      }

      const parsed = JSON.parse(jsonStr);
      
      // Validate it's an array of questions
      if (Array.isArray(parsed)) {
        // Validate each question matches our schema
        const validQuestions = parsed.filter(q => {
          const result = QuestionSchema.safeParse(q);
          return result.success;
        });
        
        console.log('Parsed questions:', validQuestions.length);
        
        if (validQuestions.length > 0) {
          setQuestions(validQuestions);
        }
      }
    } catch (error) {
      console.error('Failed to parse questions:', error);
      // Keep questions as null to show raw completion
    }
  }, [completion, isLoading]);

  // Debug: Track completion changes
  useEffect(() => {
    console.log('Completion changed:', {
      hasCompletion: !!completion,
      length: completion?.length || 0,
      isLoading,
      first100: completion?.substring(0, 100)
    });
  }, [completion, isLoading]);

  const handleFormSubmit = async (payload: GeneratePayload) => {
    setShowForm(false);
    setLastPayload(payload);
    
    // Reset previous results
    setQuestions(null);
    setVerifyResult(null);
    setVerifyError(null);
    
    // Send the payload directly to the completion API
    await complete('', {
      body: payload,
    });
  };

  const handleNewGeneration = () => {
    setShowForm(true);
    setQuestions(null);
    setVerifyResult(null);
    setVerifyError(null);
  };

  // Verify questions with backend
  const handleVerify = async () => {
    if (!questions) return;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Verification failed');
      }

      const text = await res.text();
      const parsed = JSON.parse(text);
      setVerifyResult(parsed);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Tutorati</h1>
                <p className="text-xs text-muted-foreground">v0.1</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>Global STEM Questions</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {(showForm && !completion) && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-primary mb-6 tracking-tight">
              AI-Powered STEM 
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"> Question Generator</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Generate and verify practice questions for competitive exams across 
              <span className="font-semibold text-primary"> India, US, EU, and UAE</span>. 
              Powered by advanced AI for authentic, curriculum-aligned content.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-primary mb-1">Multi-Region</h3>
                <p className="text-sm text-muted-foreground text-center">Support for JEE, NEET, SAT, MCAT & more</p>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-primary mb-1">Adaptive Difficulty</h3>
                <p className="text-sm text-muted-foreground text-center">Beginner to Ninja level questions</p>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-primary mb-1">Verified Quality</h3>
                <p className="text-sm text-muted-foreground text-center">AI-powered verification & explanations</p>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 border">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-medium text-primary mb-1">Exam Ready</h3>
                <p className="text-sm text-muted-foreground text-center">Curriculum-aligned content</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Question Form */}
          {(showForm && !completion) && (
            <section className="mb-12">
              <QuestionForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            </section>
          )}

          {/* Results Section */}
          {(completion || isLoading) && (
            <section className="space-y-8">
              {/* Loading State */}
              {isLoading && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-card border rounded-xl shadow-lg p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-6">
                        <RefreshCw className="w-8 h-8 text-white animate-spin" />
                      </div>
                      <h3 className="text-2xl font-semibold text-primary mb-2">Generating Questions</h3>
                      <p className="text-muted-foreground mb-4">
                        Creating {lastPayload?.count} {lastPayload?.type} questions for {lastPayload?.exam}...
                      </p>
                      <div className="w-full bg-secondary rounded-full h-2 max-w-md mx-auto">
                        <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {completion && (
                <div className="max-w-5xl mx-auto">
                  <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-semibold">Generated Questions</h3>
                            <p className="text-green-100">Successfully created your practice questions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{questions ? questions.length : '...'}</div>
                          <div className="text-green-100 text-sm">Questions</div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Debug info */}
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                          <span className="font-medium text-amber-800">Debug Information</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-amber-700">
                          <div><strong>Questions parsed:</strong> {questions ? questions.length : 'none'}</div>
                          <div><strong>Completion length:</strong> {completion.length} chars</div>
                          <div><strong>Loading status:</strong> {isLoading ? 'yes' : 'no'}</div>
                        </div>
                      </div>
                      
                      {questions ? (
                        <div>
                          <div className="flex items-center gap-2 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-800 font-medium">Successfully parsed {questions.length} questions!</span>
                          </div>
                          <QuestionList questions={questions} />
                        </div>
                      ) : (
                        <div className="bg-secondary rounded-lg p-4">
                          <h4 className="font-medium text-primary mb-2">Raw Generation Output:</h4>
                          <pre className="whitespace-pre-wrap text-sm font-mono text-muted-foreground overflow-x-auto">
                            {completion}
                          </pre>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t">
                        {/* Verify Button */}
                        {questions && !isVerifying && !verifyResult && (
                          <button
                            onClick={handleVerify}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Verify Questions
                          </button>
                        )}

                        {/* New Generation Button */}
                        {!isLoading && (
                          <button
                            onClick={handleNewGeneration}
                            className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Generate New Questions
                          </button>
                        )}
                      </div>

                      {/* Verification States */}
                      {isVerifying && (
                        <div className="mt-6 flex items-center gap-2 text-blue-600">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Verifying questions...</span>
                        </div>
                      )}

                      {verifyError && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-red-800 text-sm">{verifyError}</div>
                        </div>
                      )}

                      {verifyResult && (
                        <div className="mt-8">
                          <VerificationView data={verifyResult} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Critical Errors Only */}
              {error && !error.message.includes('Failed to parse stream') && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <X className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-red-800">Error</h3>
                    </div>
                    <p className="text-red-700">{error.message}</p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">Tutorati</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered STEM question generation for competitive exams worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
