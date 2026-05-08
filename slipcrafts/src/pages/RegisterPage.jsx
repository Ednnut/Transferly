import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Lock, Mail, User, UserRound, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const stepConfig = [
  {
    id: 1,
    title: 'Create account',
    subtitle: 'Tell us who you are',
    eyebrow: 'Step 1 of 3 - Your identity',
    fields: ['name', 'username', 'email']
  },
  {
    id: 2,
    title: 'Create account',
    subtitle: 'Create a strong password',
    eyebrow: 'Step 2 of 3 - Secure your account',
    fields: ['password', 'confirmPassword']
  },
  {
    id: 3,
    title: 'Create account',
    subtitle: 'Final details to get started',
    eyebrow: 'Step 3 of 3 - Almost there!',
    fields: ['agreeTerms']
  }
];

function StepMarker({ step, currentStep, brand }) {
  const complete = currentStep > step;
  const active = currentStep === step;

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black transition ${
        complete || active ? 'text-white shadow-sm' : 'border-[#e7dece] bg-white text-slate-400'
      }`}
      style={complete || active ? { backgroundColor: brand, borderColor: brand } : undefined}
    >
      {step}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser, config } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const brand = config?.brand_color || '#f8812d';
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: searchParams.get('ref') || '',
      agreeTerms: false
    }
  });

  const password = watch('password');

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('referralCode', refCode);
    }
  }, [searchParams, setValue]);

  const moveNext = async () => {
    const step = stepConfig.find((entry) => entry.id === currentStep);
    if (!step) {
      return;
    }

    const valid = await trigger(step.fields);
    if (!valid) {
      return;
    }

    setCurrentStep((previous) => Math.min(previous + 1, stepConfig.length));
  };

  const moveBack = () => {
    setCurrentStep((previous) => Math.max(previous - 1, 1));
  };

  const onSubmit = async (data) => {
    try {
      const result = await registerUser(data.name, data.email, data.password, data.referralCode);
      if (result.success) {
        toast.success('Account created. Welcome to Transferly');
        navigate('/dashboard');
        return;
      }

      toast.error(result.message || 'Registration failed');
    } catch (_error) {
      toast.error('An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f3] px-4 py-8" style={{ fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] flex-col justify-center">
        <Link
          to="/"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] text-lg font-black text-white shadow-[0_18px_45px_rgba(248,129,45,0.28)]"
          style={{ backgroundColor: brand }}
        >
          TR
          <span className="sr-only">Transferly</span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950">
            {stepConfig[currentStep - 1].title}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {stepConfig[currentStep - 1].subtitle}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          {stepConfig.map((step) => (
            <StepMarker key={step.id} step={step.id} currentStep={currentStep} brand={brand} />
          ))}
        </div>

        <p className="mt-4 text-center text-sm font-black tracking-[0.02em] text-slate-500">
          {stepConfig[currentStep - 1].eyebrow}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {currentStep === 1 ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Full name</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    className="h-11 w-full rounded-lg border border-[#e7dece] bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#f2c39a] focus:ring-4 focus:ring-orange-100"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Use your real name. It helps with verification when buying points.
                </p>
                {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Username</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="johndoe"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' }
                    })}
                    className="h-11 w-full rounded-lg border border-[#e7dece] bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#f2c39a] focus:ring-4 focus:ring-orange-100"
                  />
                </div>
                {errors.username && <p className="mt-2 text-sm text-red-500">{errors.username.message}</p>}
              </label>

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

              <button
                type="button"
                onClick={moveNext}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-black text-white transition hover:opacity-90"
                style={{ backgroundColor: brand }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </>
          ) : null}

          {currentStep === 2 ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' }
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
                <p className="mt-2 text-xs font-semibold text-slate-400">Must be at least 8 characters.</p>
                {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Confirm password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match'
                    })}
                    className="h-11 w-full rounded-lg border border-[#e7dece] bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#f2c39a] focus:ring-4 focus:ring-orange-100"
                  />
                </div>
                {errors.confirmPassword && <p className="mt-2 text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={moveBack}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#e7dece] bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={moveNext}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-black text-white transition hover:opacity-90"
                  style={{ backgroundColor: brand }}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : null}

          {currentStep === 3 ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Referral code (optional)</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter referrer's username"
                    {...register('referralCode')}
                    className="h-11 w-full rounded-lg border border-[#e7dece] bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#f2c39a] focus:ring-4 focus:ring-orange-100"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  If someone referred you, enter their username. Otherwise leave blank.
                </p>
              </label>

              <label className="block rounded-[18px] border border-[#f2d9be] bg-[#fff6ea] p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    {...register('agreeTerms', { required: 'You must agree to our terms and conditions' })}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                    style={{ accentColor: brand }}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Agree to our terms and conditions</p>
                    {errors.agreeTerms ? (
                      <p className="mt-1 text-sm text-red-500">{errors.agreeTerms.message}</p>
                    ) : null}
                  </div>
                </div>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={moveBack}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#e7dece] bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: brand }}
                >
                  {isSubmitting ? 'Creating...' : 'Create account'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : null}
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-slate-500">Already have an account?</p>
          <Link
            to="/login"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-[#e7dece] bg-white px-6 text-sm font-black text-slate-800 transition hover:border-[#f2c39a] hover:bg-orange-50"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
