'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SignInFormData } from '@/lib/auth.types';
import { LogIn, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  onForgotPassword?: () => void;
}

export default function SignInForm({ onSuccess, onSwitchToSignUp, onForgotPassword }: SignInFormProps) {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignInFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignInFormData, string>> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please provide a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      await signIn(formData.email, formData.password);
      setIsSuccess(true);
      setIsLoading(false);
      
      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ email: errorMessage });
      setIsLoading(false);
      // Don't call onSuccess on error - just return
      return;
    }
  };

  const handleInputChange = (field: keyof SignInFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleForgotPassword = () => {
    onForgotPassword?.();
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
                <h2 className="text-2xl font-semibold">Welcome Back!</h2>
                <p className="text-white/80">You've been signed in successfully</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 text-center">
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sign in successful!
              </h3>
              <p className="text-gray-600">
                You can now save your generated questions and access your saved work.
              </p>
            </div>
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
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Sign In</h2>
              <p className="text-white/80">Access your saved questions and answers</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6" data-testid="signin-form">
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
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-600" />
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password *
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full h-10 px-3 py-2 pr-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600" data-testid="password-error">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            {onForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-black font-medium hover:underline focus:outline-none focus:underline"
                  data-testid="forgot-password-link"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="signin-button"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </div>

          {/* Switch to Sign Up */}
          {onSwitchToSignUp && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="text-black font-medium hover:underline focus:outline-none focus:underline"
                  data-testid="switch-to-signup"
                >
                  Create one here
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}