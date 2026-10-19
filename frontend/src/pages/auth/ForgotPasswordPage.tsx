import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../layout/AuthLayout';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/validation';
import { authService } from '../../services/auth.service';

export const ForgotPasswordPage: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      const res = await authService.forgotPassword(data.email);
      setSuccessMsg(res.message);
    } catch {
      setSuccessMsg('If an account with that email exists, instructions have been sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your account email address and we will send password reset instructions."
    >
      {successMsg ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 text-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-text-primary">Check your inbox</h3>
            <p className="text-xs text-brand-text-secondary max-w-sm mx-auto leading-relaxed">
              {successMsg}
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="doctor@clinic.com"
                {...register('email')}
                className={`w-full h-12 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                  errors.email ? 'border-danger' : 'border-brand-border'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-danger font-medium">{errors.email.message}</p>
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
                <span>Send Reset Link</span>
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
