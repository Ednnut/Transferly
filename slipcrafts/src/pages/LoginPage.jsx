import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, config } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const brand = config?.brand_color || '#f8812d';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: { email: '', password: '', rememberMe: false }
  });

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Login successful');
        navigate('/dashboard');
        return;
      }

      toast.error(result.message || 'Login failed');
    } catch (_error) {
      toast.error('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f3] px-4 py-8" style={{ fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] flex-col justify-center">
        <Link to="/" className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] text-lg font-black text-white shadow-[0_18px_45px_rgba(248,129,45,0.28)]" style={{ backgroundColor: brand }}>
          TR
          <span className="sr-only">Transferly</span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Email address</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                })}
                className="h-11 w-full rounded-lg border border-[#e7dece] bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#f2c39a] focus:ring-4 focus:ring-orange-100"
              />
            </div>
            {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>}
          </label>

          <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
              Password
              <Link to="/forgot-password" className="text-xs font-black transition hover:opacity-80" style={{ color: brand }}>
                Forgot password?
              </Link>
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className="h-11 w-full rounded-lg border border-[#e7dece] bg-white pl-11 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#f2c39a] focus:ring-4 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 rounded border-slate-300"
              style={{ accentColor: brand }}
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-6 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: brand }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-slate-500">New to Transferly?</p>
          <Link
            to="/register"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-[#e7dece] bg-white px-6 text-sm font-black text-slate-800 transition hover:border-[#f2c39a] hover:bg-orange-50"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
