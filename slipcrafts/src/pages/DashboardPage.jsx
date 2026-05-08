import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, Coins, Copy, FileClock, FileText, LifeBuoy, Sparkles, Users, Wallet, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { useAppContext } from '../context/AppContext';
import ServiceLogo from '../components/ServiceLogo';
import { dashboardPreviewSlugs, getServiceBySlug } from '../lib/servicesCatalog';

const featuredTools = [
  {
    title: 'AI Reply',
    badge: 'New',
    body: 'Paste a message or screenshot and clean up the response before sending.',
    icon: Bot,
    to: '/services/ai-reply'
  },
  {
    title: 'Articles (FMT)',
    badge: 'Utility',
    body: 'Use your points on quick utility surfaces and content-led workflows.',
    icon: Sparkles,
    to: '/services/articles'
  },
  {
    title: 'Support Sites',
    badge: 'Suite',
    body: 'Support-style pages and page-builder utilities live in the same service board.',
    icon: Users,
    to: '/services/support-sites'
  },
  {
    title: 'Opay',
    badge: 'Popular',
    body: 'Jump straight into bank-slip style generation from a popular service tile.',
    icon: FileText,
    to: '/services/opay'
  }
];

const primaryLinks = [
  { label: 'Services', to: '/services' },
  { label: 'Orders', to: '/orders' },
  { label: 'History', to: '/transactions' }
];

const TELEGRAM_MODAL_KEY = 'transferly_telegram_community_seen';

function TelegramCommunityModal() {
  const [open, setOpen] = React.useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(TELEGRAM_MODAL_KEY) !== 'true';
  });

  const close = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TELEGRAM_MODAL_KEY, 'true');
    }
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  const benefits = [
    { icon: LifeBuoy, text: 'Get help & answers to your questions' },
    { icon: Wallet, text: 'Learn how to buy & manage points' },
    { icon: CheckCircle2, text: "Report vendors who haven't released points" },
    { icon: Sparkles, text: 'Updates, tips & community support' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8">
      <div className="relative w-full max-w-md rounded-[30px] bg-white p-6 shadow-[0_32px_100px_rgba(15,23,42,0.28)]">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          aria-label="Close"
        >
          <X size={17} />
        </button>

        <div className="pr-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#229ed9]/10 text-[#229ed9]">
            <Users size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">
            Join our Telegram Community
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Stay connected for updates, support & more</p>
        </div>

        <div className="mt-6 space-y-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div key={benefit.text} className="flex items-center gap-3 rounded-[18px] bg-[#f8f7f3] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                  <Icon size={17} />
                </div>
                <p className="text-sm font-bold text-slate-700">{benefit.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          <a
            href="https://t.me/+DhQqLRVqOHpmMmQ0"
            target="_blank"
            rel="noreferrer"
            onClick={close}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#229ed9] px-5 py-3 text-sm font-black text-white transition hover:bg-[#1b8fc6]"
          >
            Join Telegram Channel
            <ArrowRight size={16} />
          </a>
          <button
            type="button"
            onClick={close}
            className="inline-flex w-full items-center justify-center rounded-full border border-[#ece7dd] bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            I&apos;ve already joined
          </button>
          <p className="text-center text-xs font-semibold text-slate-400">
            You can also join from your settings page later
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, config, receipts, topUpOrders } = useAppContext();
  const brand = config?.brand_color || '#f8812d';
  const firstName = (profile?.name || user?.email || 'User').split(' ')[0];
  const referralLink = typeof window === 'undefined'
    ? ''
    : `${window.location.origin}/register?ref=${profile?.referral_code || ''}`;
  const previewServices = dashboardPreviewSlugs
    .map((slug) => getServiceBySlug(slug))
    .filter(Boolean);
  const recentTopUpOrder = topUpOrders[0] || null;

  const activitySummary = useMemo(() => ([
    {
      label: 'Total Balance',
      value: (profile?.points || 0).toLocaleString(),
      suffix: 'pts',
      icon: Wallet
    },
    {
      label: 'Receipts',
      value: receipts.length.toLocaleString(),
      suffix: '',
      icon: FileText
    },
    {
      label: 'Referrals',
      value: (profile?.referral_count || 0).toLocaleString(),
      suffix: '',
      icon: Users
    },
    {
      label: 'Funding orders',
      value: topUpOrders.length.toLocaleString(),
      suffix: '',
      icon: Coins
    }
  ]), [profile?.points, profile?.referral_count, receipts.length, topUpOrders.length]);

  const copyReferralLink = async () => {
    if (!referralLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied');
    } catch (_error) {
      toast.error('Unable to copy referral link');
    }
  };

  return (
    <DashboardLayout>
      <TelegramCommunityModal />
      <div className="space-y-8 px-4 py-5 md:px-8 md:py-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-500">Welcome back,</p>
                  <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950">
                    {firstName} <span className="align-middle text-2xl">👋</span>
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600">
                    Keep your balance topped up, launch the service you need, and move between receipt work, email work,
                    and utility actions from one account.
                  </p>
                </div>
                <Link
                  to="/buy-point"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
                  style={{ backgroundColor: brand }}
                >
                  <Wallet size={16} />
                  Buy Points
                </Link>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_280px]">
                <div className="rounded-[26px] bg-[#f8f7f3] p-5">
                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="rounded-[24px] bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Wallet size={16} className="text-slate-400" />
                        Total Balance
                      </div>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-4xl font-black tracking-[-0.05em] text-slate-950">
                          {(profile?.points || 0).toLocaleString()}
                        </span>
                        <span className="pb-1 text-sm font-semibold text-slate-500">pts</span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {primaryLinks.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="inline-flex items-center justify-between rounded-[22px] bg-white px-4 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:bg-orange-50"
                        >
                          <span>{item.label}</span>
                          <ArrowRight size={16} className="text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  {activitySummary.slice(1).map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="rounded-[24px] bg-[#f8f7f3] p-5">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <Icon size={16} className="text-slate-400" />
                          {item.label}
                        </div>
                        <div className="mt-3 flex items-end gap-2">
                          <span className="text-3xl font-black tracking-[-0.04em] text-slate-950">{item.value}</span>
                          {item.suffix ? <span className="pb-1 text-sm font-semibold text-slate-500">{item.suffix}</span> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-[24px] bg-[#121212] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-[-0.04em]">Quick Actions</h2>
                    <Wallet size={22} className="text-white/35" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      to="/buy-point"
                      className="rounded-2xl bg-white px-4 py-4 text-sm font-black text-slate-950 transition hover:bg-orange-50"
                    >
                      Buy Points
                    </Link>
                    <a
                      href="https://t.me/+DhQqLRVqOHpmMmQ0"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-black text-white transition hover:bg-white/10"
                    >
                      Join Vendor
                    </a>
                    <button
                      onClick={copyReferralLink}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-black text-white transition hover:bg-white/10 sm:col-span-2"
                    >
                      Copy Ref Link
                    </button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#ebe2d4] bg-[#f8f7f3] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Featured</p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">AI Reply</h2>
                    </div>
                    <Bot size={22} className="text-slate-400" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Smart AI-powered replies for any conversation.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {featuredTools.slice(1).map((tool) => (
                      <Link
                        key={tool.title}
                        to={tool.to}
                        className="rounded-[18px] bg-white px-4 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:bg-orange-50"
                      >
                        <p>{tool.title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{tool.body}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] bg-[#121212] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Service Access</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Jump into the tools board.</h2>
              </div>
              <Sparkles size={20} className="text-white/35" />
            </div>

            <div className="mt-6 space-y-3">
              <Link
                to="/services"
                className="flex items-center justify-between rounded-[24px] bg-white px-4 py-4 text-slate-950 transition hover:bg-orange-50"
              >
                <div>
                  <p className="text-sm font-black">Services</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Open the full catalog</p>
                </div>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/orders"
                className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-black">Orders</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Recent activity</p>
                </div>
                <FileClock size={18} />
              </Link>
              <Link
                to="/transactions"
                className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-black">History</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Usage and funding</p>
                </div>
                <FileText size={18} />
              </Link>
            </div>
          </div>
        </section>

        {recentTopUpOrder ? (
          <section className="rounded-[30px] border border-[#ebe2d4] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Latest funding order</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{recentTopUpOrder.amount_label}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {recentTopUpOrder.method_title} · {recentTopUpOrder.status.replace(/_/g, ' ')} · created {new Date(recentTopUpOrder.created_at).toLocaleString()}
                </p>
              </div>
              <Link
                to={recentTopUpOrder.service_intent ? `/buy-point?intent=${recentTopUpOrder.service_intent}` : '/buy-point'}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
                style={{ backgroundColor: brand }}
              >
                Continue Funding
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {featuredTools.map((tool, index) => {
            const Icon = tool.icon;
            const dark = index === 0;

            return (
              <Link
                key={tool.title}
                to={tool.to}
                className={`rounded-[28px] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:translate-y-[-2px] ${
                  dark ? 'bg-[#121212] text-white' : 'border border-[#ebe2d4] bg-white text-slate-950'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-orange-50 text-orange-600'}`}>
                  <Icon size={20} />
                </div>
                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black tracking-[-0.03em]">{tool.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'bg-white/10 text-orange-200' : 'bg-slate-100 text-slate-600'}`}>
                      {tool.badge}
                    </span>
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${dark ? 'text-white/68' : 'text-slate-600'}`}>{tool.body}</p>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="rounded-[30px] border border-[#ebe2d4] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">All Services</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Browse the full Transferly services board.</h2>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-black text-slate-700 transition hover:text-slate-950">
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {previewServices.map((service) => (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                className="group rounded-[22px] border border-[#ece7dd] bg-[#f8f7f3] px-4 py-4 transition hover:border-orange-200 hover:bg-orange-50"
              >
                <div className="flex items-start gap-3">
                  <ServiceLogo service={service} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{service.title}</p>
                        {service.badge === 'New' ? (
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-500">New</p>
                        ) : null}
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
