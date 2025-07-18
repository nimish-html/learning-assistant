/**
 * Lazy-loaded authentication components
 * 
 * This file provides lazy-loaded versions of authentication components
 * to improve initial bundle size and loading performance.
 */

import { lazy, Suspense, ComponentType } from 'react'
import { LogIn, UserPlus, KeyRound } from 'lucide-react'

// Lazy load authentication components
const SignInFormLazy = lazy(() => import('./SignInForm'))
const SignUpFormLazy = lazy(() => import('./SignUpForm'))
const ResetPasswordFormLazy = lazy(() => import('./ResetPasswordForm'))

// Loading component for auth forms
function AuthFormSkeleton({ icon: Icon, title }: { icon: ComponentType<any>, title: string }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-400">{title}</h2>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

// Wrapped components with suspense and loading states
export function LazySignInForm(props: any) {
  return (
    <Suspense fallback={<AuthFormSkeleton icon={LogIn} title="Loading Sign In..." />}>
      <SignInFormLazy {...props} />
    </Suspense>
  )
}

export function LazySignUpForm(props: any) {
  return (
    <Suspense fallback={<AuthFormSkeleton icon={UserPlus} title="Loading Sign Up..." />}>
      <SignUpFormLazy {...props} />
    </Suspense>
  )
}

export function LazyResetPasswordForm(props: any) {
  return (
    <Suspense fallback={<AuthFormSkeleton icon={KeyRound} title="Loading Reset Form..." />}>
      <ResetPasswordFormLazy {...props} />
    </Suspense>
  )
}

// Export all lazy components
export {
  SignInFormLazy as SignInForm,
  SignUpFormLazy as SignUpForm,
  ResetPasswordFormLazy as ResetPasswordForm
}