import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Building2, User, Mail, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../layout/AuthLayout';
import { registerSchema, type RegisterFormData } from '../../utils/validation';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      clinicName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setApiError(null);
      setIsSubmitting(true);
      const res = await authService.register(data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to register clinic. Please try again.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your clinic workspace"
      subtitle="Start managing patients, appointments, and billing with ClinicFlow in minutes."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Alert */}
        {apiError && (
          <div className="p-3.5 rounded-btn bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Clinic Name */}
        <div>
          <label className="block text-xs font-semibold text-brand-text-primary mb-1 uppercase tracking-wider">
            Clinic Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. City Health Clinic"
              {...register('clinicName')}
              className={`w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                errors.clinicName ? 'border-danger' : 'border-brand-border'
              }`}
            />
          </div>
          {errors.clinicName && (
            <p className="mt-1 text-xs text-danger font-medium">{errors.clinicName.message}</p>
          )}
        </div>

        {/* First & Last Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1 uppercase tracking-wider">
              First Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ahmed"
                {...register('firstName')}
                className={`w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                  errors.firstName ? 'border-danger' : 'border-brand-border'
                }`}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-xs text-danger font-medium">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1 uppercase tracking-wider">
              Last Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Khan"
                {...register('lastName')}
                className={`w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                  errors.lastName ? 'border-danger' : 'border-brand-border'
                }`}
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-xs text-danger font-medium">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="dr.ahmed@clinic.com"
                {...register('email')}
                className={`w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                  errors.email ? 'border-danger' : 'border-brand-border'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-danger font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1 uppercase tracking-wider">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="+92 300 1234567"
                {...register('phone')}
                className="w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border border-brand-border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-brand-text-primary mb-1 uppercase tracking-wider">
            Password (min 8 characters)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={`w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border text-sm text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                errors.password ? 'border-danger' : 'border-brand-border'
              }`}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-danger font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-primary hover:bg-blue-700 text-white font-semibold rounded-btn transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-subtle-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Create Clinic Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Footer Link */}
        <div className="text-center pt-1">
          <p className="text-xs text-brand-text-secondary">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in to your clinic
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
