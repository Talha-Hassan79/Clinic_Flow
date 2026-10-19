import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../layout/AuthLayout';
import { loginSchema, type LoginFormData } from '../../utils/validation';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';
import { getDefaultRouteForRole } from '../../routes/ProtectedRoute';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError(null);
      setIsSubmitting(true);
      const res = await authService.login(data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      const targetRoute = getDefaultRouteForRole(res.user?.role);
      navigate(targetRoute);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your ClinicFlow workspace to manage appointments and patient records."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Error Alert */}
        {apiError && (
          <div className="p-4 rounded-btn bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Email Field */}
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

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-brand-text-primary uppercase tracking-wider">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline transition-all"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`w-full h-12 pl-10 pr-11 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                errors.password ? 'border-danger' : 'border-brand-border'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-text-secondary hover:text-brand-text-primary transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-danger font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-primary hover:bg-blue-700 text-white font-semibold rounded-btn transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-subtle-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-brand-text-secondary">
            Don't have a clinic account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register your clinic
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
