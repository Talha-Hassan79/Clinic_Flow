import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router';
import { Lock, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../../layout/AuthLayout';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../utils/validation';
import { authService } from '../../services/auth.service';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || 'demo-reset-token';

  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setApiError(null);
      setIsSubmitting(true);
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Create a new secure password for your ClinicFlow account."
    >
      {isSuccess ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 text-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-text-primary">Password Reset Complete</h3>
            <p className="text-xs text-brand-text-secondary max-w-sm mx-auto leading-relaxed">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-blue-700 text-white font-semibold rounded-btn transition-all duration-200 shadow-subtle-sm"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {apiError && (
            <div className="p-3.5 rounded-btn bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1.5 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`w-full h-12 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                  errors.password ? 'border-danger' : 'border-brand-border'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1.5 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`w-full h-12 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                  errors.confirmPassword ? 'border-danger' : 'border-brand-border'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-danger font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary hover:bg-blue-700 text-white font-semibold rounded-btn transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-subtle-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
