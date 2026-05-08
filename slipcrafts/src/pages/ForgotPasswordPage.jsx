import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ForgotPasswordPage() {
  const { config } = useAppContext();
  const brand = config?.brand_color || '#f8812d';
  const supportEmail = config?.support_email || 'support@transferly.app';

  return (
    <div className="min-h-screen bg-[#f8f7f3] px-4 py-8" style={{ fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] flex-col justify-center">
        <Link to="/" className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] text-lg font-black text-white shadow-[0_18px_45px_rgba(248,129,45,0.28)]" style={{ backgroundColor: brand }}>
          TR
          <span className="sr-only">Transferly</span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950">Reset access</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Contact support from the email on your account and request a password reset.
          </p>
        </div>

        <div className="mt-8 rounded-[22px] border border-[#e7dece] bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">Support email</p>
              <a href={`mailto:${supportEmail}`} className="mt-1 block text-sm font-bold text-slate-600 hover:text-slate-950">
                {supportEmail}
              </a>
            </div>
          </div>
        </div>

        <Link
          to="/login"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#e7dece] bg-white px-6 text-sm font-black text-slate-800 transition hover:border-[#f2c39a] hover:bg-orange-50"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
