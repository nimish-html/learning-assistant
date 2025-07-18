'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ResetPasswordFormData } from '@/lib/auth.types';
import { KeyRound, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  onBackToSignIn?: () => void;
}

export default function ResetPasswordForm({ onSuccess, onBackToSignIn }: ResetPasswordFormProps) {
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ResetPasswordFormData, string>> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please provide a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({}); // Only clear errors if validation passes

    try {
      await resetPassword(formData.email);
      setIsSuccess(true);
      setIsLoading(false);
      
      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ email: errorMessage });
      setIsLoading(false);
      // Don't call onSuccess on error - just return
      return;
    }
  };

  const handleInputChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBackToSignIn = () => {
    onBackToSignIn?.();
  };

  // Show success state
  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Email Sent!</h2>
                <p className="text-white/80">Check your inbox for reset instructions</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 text-center">
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reset email sent successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                We've sent password reset instructions to <strong>{formData.email}</strong>. 
                Please check your inbox and follow the link to reset your password.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
              <p className="font-medium mb-1">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset link in the email</li>
                <li>Create a new password</li>
                <li>Return here to sign in with your new password</li>
              </ol>
            </div>

            {onBackToSignIn && (
              <button
                onClick={handleBackToSignIn}
                className="inline-flex items-center gap-2 text-black font-medium hover:underline focus:outline-none focus:underline"
                data-testid="back-to-signin-success"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Reset Password</h2>
              <p className="text-white/80">Enter your email to receive reset instructions</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6" data-testid="reset-password-form">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </label>
              </div>
              <input
                id="email"
                type="text"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                placeholder="Enter your email address"
                disabled={isLoading}
                data-testid="email-input"
              />
              {errors.email && (
                <p className="text-sm text-red-600" data-testid="email-error">
                  {errors.email}
                </p>
              )}
              <p className="text-xs text-gray-500">
                We'll send password reset instructions to this email address
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="reset-password-button"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending Reset Email...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Send Reset Email
                </>
              )}
            </button>
          </div>

          {/* Back to Sign In */}
          {onBackToSignIn && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleBackToSignIn}
                className="inline-flex items-center gap-2 text-black font-medium hover:underline focus:outline-none focus:underline"
                data-testid="back-to-signin"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}