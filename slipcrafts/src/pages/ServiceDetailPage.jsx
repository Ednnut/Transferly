import React from 'react';
import { ArrowLeft, ArrowRight, Clock3, ExternalLink, FileText, Layers3, Send, Sparkles, Wallet } from 'lucide-react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import AdminPaymentsTab from '../components/AdminTabs/AdminPaymentsTab';
import DashboardLayout from '../components/DashboardLayout';
import { useAppContext } from '../context/AppContext';
import ServiceLogo from '../components/ServiceLogo';
import {
  getRelatedServices,
  getServiceBySlug,
  getServiceEstimatedCost,
  getServicePreview,
  getRecommendedPointPacks
} from '../lib/servicesCatalog';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { config, profile, user } = useAppContext();
  const service = getServiceBySlug(slug || '');
  const points = Number(profile?.points || 0);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const isLive = service.status === 'available';
  const estimatedCost = getServiceEstimatedCost(service, config);
  const relatedServices = getRelatedServices(service.slug, 3);
  const preview = getServicePreview(service);
  const recommendedPacks = getRecommendedPointPacks(service, config);
  const needsTopUp = estimatedCost !== null && points < estimatedCost;
  const isFlashEmailService = service.category === 'Flash Emails';
  const isBankSlipService = service.category === 'Bank Slips';
  const isPayPalService = service.slug === 'paypal';
  const officialView = searchParams.get('view');
  const isOfficialInvoiceView = isPayPalService && officialView === 'official-invoicing';
  const isOfficialPayoutView = isPayPalService && officialView === 'official-payouts';

  if (isFlashEmailService) {
    const launchOptions = [
      {
        title: 'Custom Mail',
        subtitle: 'Open the editable flash-mail builder for this service.',
        to: `/dashboard/generate?type=email&service=${service.slug}&mailType=custom`
      },
      {
        title: 'Deposit Mail',
        subtitle: 'Use the same service flow with deposit-mail context applied.',
        to: `/dashboard/generate?type=email&service=${service.slug}&mailType=deposit`
      }
    ];
    const officialOptions = isPayPalService
      ? [
          {
            title: 'Official Invoicing',
            subtitle: 'Jump into the canonical PayPal invoice workspace with hosted links, QR generation, reminder cadence, and sync controls.',
            to: `/services/${service.slug}?view=official-invoicing`,
            icon: FileText
          },
          {
            title: 'Official Payouts',
            subtitle: 'Open the operational PayPal payout console for provider-state tracking, reconciliation, and remediation actions.',
            to: `/services/${service.slug}?view=official-payouts`,
            icon: Send
          }
        ]
      : [];

    if (isOfficialInvoiceView || isOfficialPayoutView) {
      const viewTitle = isOfficialInvoiceView ? 'Official PayPal Invoicing' : 'Official PayPal Payouts';
      const viewSubtitle = isOfficialInvoiceView
        ? 'Launch the hosted PayPal invoice stack from a dedicated PayPal sub-launcher.'
        : 'Launch the official payout operations stack from a dedicated PayPal sub-launcher.';
      const viewDescription = isOfficialInvoiceView
        ? 'This launcher is for canonical PayPal invoice work only: hosted invoice links, QR creation, reminder cadence, template reuse, and provider sync.'
        : 'This launcher is for canonical PayPal payout work only: payout tracking, provider-state refresh, remediation actions, funding review, and reconciliation.';
      const checklist = isOfficialInvoiceView
        ? ['Hosted PayPal invoice links', 'Official QR generation', 'Template-backed invoice ops', 'Reminder cadence controls']
        : ['Official payout tracking', 'Provider-state remediation', 'Funding review alignment', 'Reconciliation issue handling'];

      return (
        <DashboardLayout>
          <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
            <div className="rounded-[32px] border border-[#d8e4f8] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] p-6 shadow-[0_20px_60px_rgba(0,48,135,0.08)] md:p-8">
              <div className="mx-auto max-w-4xl">
                <Link
                  to={`/services/${service.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-black text-[#003087] transition hover:text-[#001f5c]"
                >
                  <ArrowLeft size={16} />
                  Back to PayPal Launcher
                </Link>

                <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-4">
                      <ServiceLogo service={service} size="lg" />
                      <div className="inline-flex rounded-full border border-[#b7c9ea] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#003087]">
                        PayPal Official Launcher
                      </div>
                    </div>
                    <h1 className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">{viewTitle}</h1>
                    <p className="mt-3 text-base font-semibold text-slate-700">{viewSubtitle}</p>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{viewDescription}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                    <div className="rounded-[22px] border border-[#d9e4f7] bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Access</p>
                      <p className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-950">
                        {user?.isAdmin ? 'Admin Enabled' : 'Admin Required'}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-[#d9e4f7] bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Readiness</p>
                      <p className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-950">
                        {needsTopUp ? 'Balance Attention' : 'Operationally Ready'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className={`rounded-[24px] border px-4 py-4 text-left ${needsTopUp ? 'border-[#f2d0b0] bg-[#fff4e8]' : 'border-[#d9eee1] bg-[#effaf4]'}`}>
                      <div className="flex items-start gap-3">
                        <Wallet size={18} className={needsTopUp ? 'text-[#c76c1a]' : 'text-emerald-600'} />
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {needsTopUp
                              ? `Your balance is below the ${estimatedCost.toLocaleString()} point recommendation for ${service.title}.`
                              : `Your balance is ready for ${service.title}.`}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-slate-600">
                            Recommended packs: {recommendedPacks.map((pack) => `${pack.toLocaleString()} pts`).join(' · ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#d9e4f7] bg-white p-5">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        <Sparkles size={14} />
                        Includes
                      </div>
                      <div className="mt-4 space-y-3">
                        {checklist.map((item) => (
                          <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {user?.isAdmin ? (
                  <div className="mt-8">
                    <AdminPaymentsTab
                      mode={isOfficialInvoiceView ? 'invoice' : 'payout'}
                      embedded
                    />
                  </div>
                ) : (
                  <div className="mt-8 rounded-[28px] border border-[#d7e3f9] bg-white/85 p-6 text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#003087]">
                          <Layers3 size={14} />
                          Workspace Locked
                        </div>
                        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">Admin access is required for the official PayPal workspace.</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                          The real invoice and payout consoles are embedded here, but they stay restricted because they control canonical PayPal operations, provider-state remediation, and funding release.
                        </p>
                      </div>
                      <Clock3 size={18} className="mt-1 text-slate-400" />
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={`/services/${service.slug}`}
                    className="inline-flex items-center justify-center rounded-full border border-[#c7d6f1] bg-white px-5 py-3 text-sm font-black text-[#003087] transition hover:border-[#003087]"
                  >
                    Back to PayPal Launcher
                  </Link>
                  {!user?.isAdmin ? (
                    <Link
                      to="/help"
                      className="inline-flex items-center justify-center rounded-full border border-[#ece2d2] bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-[#f2c39a]"
                    >
                      Request Admin Help
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <div className="rounded-[32px] border border-[#ece2d2] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] md:p-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center">
                <ServiceLogo service={service} size="lg" />
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">{service.title}</h1>
              <p className="mt-3 text-base font-semibold text-slate-600">Choose the type of mail to Send</p>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                This launcher matches the live flow more closely: pick the mail variant first, then continue into the builder with {service.title} context already applied.
              </p>

              {estimatedCost !== null ? (
                <div className={`mt-6 rounded-[24px] border px-4 py-4 text-left ${needsTopUp ? 'border-[#f2d0b0] bg-[#fff4e8]' : 'border-[#d9eee1] bg-[#effaf4]'}`}>
                  <div className="flex items-start gap-3">
                    <Wallet size={18} className={needsTopUp ? 'text-[#c76c1a]' : 'text-emerald-600'} />
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {needsTopUp
                          ? `Your balance is below the ${estimatedCost.toLocaleString()} point recommendation for ${service.title}.`
                          : `Your balance is ready for ${service.title}.`}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-600">
                        Recommended packs: {recommendedPacks.map((pack) => `${pack.toLocaleString()} pts`).join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {launchOptions.map((option) => (
                  <Link
                    key={option.title}
                    to={option.to}
                    className="rounded-[26px] border border-[#ece2d2] bg-[#faf7f1] px-5 py-5 text-left transition hover:border-[#f2c39a] hover:bg-orange-50/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-[-0.03em] text-slate-950">{option.title}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{option.subtitle}</p>
                      </div>
                      <ArrowRight size={18} className="mt-1 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>

              {isPayPalService ? (
                <div className="mt-8 rounded-[28px] border border-[#c9d7f0] bg-[linear-gradient(135deg,rgba(0,48,135,0.08),rgba(255,255,255,1))] p-5 text-left">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#003087]">Official PayPal Alternative</p>
                      <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950">Use the real invoice and payout operations when you need PayPal-hosted flows.</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        This keeps the flash-mail builder available while exposing the production-facing PayPal back office for hosted invoices, payout tracking, provider sync, and remediation.
                      </p>
                    </div>
                    <div className="inline-flex rounded-full border border-[#b5c7ea] bg-white/85 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#003087]">
                      {user?.isAdmin ? 'Admin enabled' : 'Admin required'}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {officialOptions.map((option) => {
                      const Icon = option.icon;

                      if (!user?.isAdmin) {
                        return (
                          <div
                            key={option.title}
                            className="rounded-[24px] border border-[#d7e3f9] bg-white/80 px-5 py-5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#003087] text-white">
                                  <Icon size={18} />
                                </div>
                                <p className="mt-4 text-lg font-black tracking-[-0.03em] text-slate-950">{option.title}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-600">{option.subtitle}</p>
                                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Admin access required</p>
                              </div>
                              <Clock3 size={18} className="mt-1 text-slate-400" />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={option.title}
                          to={option.to}
                          className="rounded-[24px] border border-[#bcd0f6] bg-white px-5 py-5 transition hover:border-[#003087] hover:shadow-[0_18px_40px_rgba(0,48,135,0.08)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#003087] text-white">
                                <Icon size={18} />
                              </div>
                              <p className="mt-4 text-lg font-black tracking-[-0.03em] text-slate-950">{option.title}</p>
                              <p className="mt-2 text-sm leading-7 text-slate-600">{option.subtitle}</p>
                              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#003087]">Open official ops</p>
                            </div>
                            <ArrowRight size={18} className="mt-1 text-[#003087]" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {needsTopUp ? (
                  <Link
                    to={`/buy-point?intent=${service.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
                    style={{ backgroundColor: service.accent.bg }}
                  >
                    Buy Points
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-[#ece2d2] bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-[#f2c39a]"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isBankSlipService) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <div className="rounded-[32px] border border-[#ece2d2] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] md:p-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center">
                <ServiceLogo service={service} size="lg" />
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">{service.title}</h1>
              <p className="mt-3 text-base font-semibold text-slate-600">{isLive ? `${service.title} bank slips` : 'Bank slip flow coming soon'}</p>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                This launcher keeps the bank-slip brands simple and direct: open the branded slip builder, then generate the transfer proof without extra navigation noise.
              </p>

              {estimatedCost !== null ? (
                <div className={`mt-6 rounded-[24px] border px-4 py-4 text-left ${needsTopUp ? 'border-[#f2d0b0] bg-[#fff4e8]' : 'border-[#d9eee1] bg-[#effaf4]'}`}>
                  <div className="flex items-start gap-3">
                    <Wallet size={18} className={needsTopUp ? 'text-[#c76c1a]' : 'text-emerald-600'} />
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {needsTopUp
                          ? `Your balance is below the ${estimatedCost.toLocaleString()} point recommendation for ${service.title}.`
                          : `Your balance is ready for ${service.title}.`}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-600">
                        Recommended packs: {recommendedPacks.map((pack) => `${pack.toLocaleString()} pts`).join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 grid gap-4">
                {isLive ? (
                  <Link
                    to={`/dashboard/generate?type=bank&service=${service.slug}`}
                    className="rounded-[26px] border border-[#ece2d2] bg-[#faf7f1] px-5 py-5 text-left transition hover:border-[#f2c39a] hover:bg-orange-50/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-[-0.03em] text-slate-950">Generate Slip</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">Open the branded bank-slip builder with {service.title} context already applied.</p>
                      </div>
                      <ArrowRight size={18} className="mt-1 text-slate-400" />
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-[26px] border border-slate-200 bg-slate-100 px-5 py-5 text-left opacity-70">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-[-0.03em] text-slate-950">Coming Soon</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">Keep this branded entry point in place until the {service.title} bank-slip flow is released.</p>
                      </div>
                      <Clock3 size={18} className="mt-1 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {needsTopUp ? (
                  <Link
                    to={`/buy-point?intent=${service.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
                    style={{ backgroundColor: service.accent.bg }}
                  >
                    Buy Points
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-[#ece2d2] bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-[#f2c39a]"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <div className="rounded-[32px] bg-[#121212] px-6 py-7 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link to="/services" className="inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-white">
                <ArrowLeft size={16} />
                Back to Services
              </Link>
              <div className="mt-5 flex items-center gap-4">
                <ServiceLogo service={service} size="lg" />
                <div>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
                    {service.category}
                  </div>
                  <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">{service.title}</h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 md:text-base">{service.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:w-[300px]">
              <div className="rounded-[24px] border border-white/8 bg-white/6 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">Current balance</p>
                <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{points.toLocaleString()} pts</p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/6 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">Service status</p>
                <p className="mt-3 text-lg font-black tracking-[-0.03em] text-white">{isLive ? 'Available now' : 'Coming soon'}</p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/6 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">Badge</p>
                <p className="mt-3 text-lg font-black tracking-[-0.03em] text-white">{service.badge}</p>
              </div>
              {estimatedCost !== null ? (
                <div className="rounded-[24px] border border-white/8 bg-white/6 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">Suggested balance</p>
                  <p className="mt-3 text-lg font-black tracking-[-0.03em] text-white">{estimatedCost.toLocaleString()} pts</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <section className="rounded-[30px] border border-[#e9e0d2] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <Sparkles size={14} />
              Service Overview
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">A dedicated page for the {service.title} flow.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{service.detail}</p>

            <div className="mt-6 rounded-[28px] border border-[#ece2d2] bg-[#faf7f1] p-5">
              <div className="flex items-center gap-3">
                <ServiceLogo service={service} size="md" showTitle />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <Layers3 size={14} />
                    Category
                  </div>
                  <p className="mt-2 text-lg font-black text-slate-950">{service.category}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <Clock3 size={14} />
                    Status
                  </div>
                  <p className="mt-2 text-lg font-black text-slate-950">{isLive ? 'Ready to launch' : 'Awaiting release'}</p>
                </div>
              </div>
            </div>

            <div
              className="mt-6 overflow-hidden rounded-[28px] border p-5 text-white shadow-[0_18px_45px_var(--service-glow)]"
              style={{
                backgroundColor: service.accent.bg,
                borderColor: service.accent.edge,
                '--service-glow': service.accent.glow
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">{preview.eyebrow}</p>
                  <h3 className="mt-3 max-w-xl text-2xl font-black tracking-[-0.04em] text-white">{preview.headline}</h3>
                </div>
                <ServiceLogo service={service} size="md" />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {preview.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm font-bold text-white/85">
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[30px] border border-[#e9e0d2] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] md:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Launch</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {isLive ? 'Open this service now.' : 'This service is not active yet.'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {isLive
                  ? 'Use the dedicated launch button below to continue into the matching Transferly tool flow.'
                  : 'The live capture marks this service as upcoming. Keep the dedicated service page in place so the catalog structure stays intact.'}
              </p>

              {estimatedCost !== null ? (
                <div className={`mt-5 rounded-[24px] border px-4 py-4 ${needsTopUp ? 'border-[#f2d0b0] bg-[#fff4e8]' : 'border-[#d9eee1] bg-[#effaf4]'}`}>
                  <div className="flex items-start gap-3">
                    <Wallet size={18} className={needsTopUp ? 'text-[#c76c1a]' : 'text-emerald-600'} />
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {needsTopUp
                          ? `You need at least ${estimatedCost.toLocaleString()} points for this flow.`
                          : `Your balance is ready for this ${service.category === 'Bank Slips' ? 'bank slip' : 'flash email'} flow.`}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-600">
                        Recommended top-up packs: {recommendedPacks.map((pack) => `${pack.toLocaleString()} pts`).join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {isLive ? (
                <div className="mt-6 space-y-3">
                  {needsTopUp ? (
                    <Link
                      to={`/buy-point?intent=${service.slug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black text-white transition hover:opacity-90"
                      style={{ backgroundColor: service.accent.bg }}
                    >
                      Buy Points for {service.title}
                      <ArrowRight size={16} />
                    </Link>
                  ) : null}
                  <Link
                    to={service.launchTo}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black transition ${
                      needsTopUp ? 'border border-[#eadfce] bg-[#faf7f1] text-slate-800 hover:border-[#f2c39a]' : 'text-white hover:opacity-90'
                    }`}
                    style={needsTopUp ? undefined : { backgroundColor: service.accent.bg }}
                  >
                    {service.launchLabel}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <button
                  disabled
                  className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-300 px-5 py-3.5 text-sm font-black text-white"
                >
                  {service.launchLabel}
                </button>
              )}
            </div>

            {relatedServices.length ? (
              <div className="rounded-[30px] border border-[#e9e0d2] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] md:p-7">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Related services</p>
                <div className="mt-4 space-y-3">
                  {relatedServices.map((related) => (
                    <Link
                      key={related.slug}
                      to={`/services/${related.slug}`}
                      className="flex items-center justify-between rounded-[24px] border border-[#ece2d2] bg-[#faf7f1] px-4 py-4 text-sm font-black text-slate-800 transition hover:border-[#f2c39a]"
                    >
                      <div className="flex items-center gap-3">
                        <ServiceLogo service={related} size="sm" />
                        <div>
                          <p className="text-sm font-black text-slate-950">{related.title}</p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{related.badge}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[30px] border border-[#e9e0d2] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] md:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Navigation</p>
              <div className="mt-4 space-y-3">
                <Link
                  to="/services"
                  className="flex items-center justify-between rounded-[24px] border border-[#ece2d2] bg-[#faf7f1] px-4 py-4 text-sm font-black text-slate-800 transition hover:border-[#f2c39a]"
                >
                  Back to all services
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/transactions"
                  className="flex items-center justify-between rounded-[24px] border border-[#ece2d2] bg-[#faf7f1] px-4 py-4 text-sm font-black text-slate-800 transition hover:border-[#f2c39a]"
                >
                  View activity
                  <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
