import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Clock3,
  FileText,
  Mail,
  Map,
  QrCode,
  Shield,
  Sparkles,
  Wallet
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAppContext } from '../context/AppContext';
import ServiceLogo from '../components/ServiceLogo';
import { getServiceBySlug } from '../lib/servicesCatalog';

const baseSupportedPlatforms = [
  getServiceBySlug('binance'),
  getServiceBySlug('bybit'),
  getServiceBySlug('coinbase'),
  getServiceBySlug('paypal'),
  getServiceBySlug('crypto-com'),
  getServiceBySlug('cash-app'),
  getServiceBySlug('opay'),
  getServiceBySlug('kuda'),
  getServiceBySlug('wise')
].filter(Boolean);

const supportedPlatforms = [...baseSupportedPlatforms, ...baseSupportedPlatforms].map((platform, index) => ({
  key: `${platform.slug}-${index}`,
  label: platform.slug === 'cash-app' ? 'CashApp' : platform.title,
  service: platform
}));

const serviceFeatures = [
  getServiceBySlug('paypal'),
  getServiceBySlug('binance'),
  getServiceBySlug('opay'),
  getServiceBySlug('cash-app')
];

const features = [
  {
    icon: Bot,
    eyebrow: 'New',
    title: 'AI Reply',
    body: 'Paste a message or screenshot and get a clean response tone before you send.'
  },
  {
    icon: FileText,
    eyebrow: 'Popular',
    title: 'Receipt Generation',
    body: 'Build polished bank-slip style receipts and downloadable visual proofs in minutes.'
  },
  {
    icon: Mail,
    eyebrow: 'Live',
    title: 'Flash Emails',
    body: 'Shape sender-style emails with point-based actions and fast output for your workflow.'
  },
  {
    icon: Map,
    eyebrow: 'Suite',
    title: 'Support Pages',
    body: 'Spin up support-style surfaces and operational landing pages from the same account.'
  },
  {
    icon: Shield,
    eyebrow: 'Secure',
    title: 'Safe & Encrypted',
    body: 'Keep a single account balance, controlled access, and a predictable workflow across the app.'
  },
  {
    icon: QrCode,
    eyebrow: 'Utility',
    title: 'QR & Link Tools',
    body: 'Use quick-utility surfaces around QR, links, and wallet flows without leaving the dashboard.'
  }
];

const steps = [
  {
    step: '01',
    title: 'Create an Account',
    body: 'Sign up in seconds with no credit card required and get instant access to every core service.'
  },
  {
    step: '02',
    title: 'Buy Points',
    body: 'Top up your balance through crypto or P2P vendors. Points remain the universal currency across the app.'
  },
  {
    step: '03',
    title: 'Use Any Service',
    body: 'Generate receipts, send emails, and open support-style tools directly from the dashboard when you need them.'
  }
];

export default function HomePage() {
  const { config, testimonials } = useAppContext();
  const brand = config?.brand_color || '#f8812d';
  const totalUsers = Number(config?.total_users || 335221);
  const totalReceipts = Number(config?.total_receipts || 857347);
  const emailCount = Math.max(Math.round(totalReceipts * 0.9), 779901);
  const featuredTestimonials = (testimonials || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#111111] text-white" style={{ fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif' }}>
      <Navbar />

      <main>
        <section className="overflow-hidden border-b border-white/8 bg-[#111111]">
          <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_480px]">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                  <Sparkles size={15} />
                  Trusted by {totalUsers.toLocaleString()}+ users worldwide
                </div>
                <div className="space-y-5">
                  <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.06em] text-white md:text-6xl">
                    The All-in-One Digital Services Platform
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/68 md:text-lg">
                    Generate receipts, send flash emails, build support pages, and build login pages — all from one powerful dashboard.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black text-white transition hover:opacity-90"
                    style={{ backgroundColor: brand }}
                  >
                    Get Started Free
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Learn More
                  </Link>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-white/60">
                  {['SSL Encrypted', 'Instant Delivery', 'Available Worldwide'].map((item) => (
                    <div key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[30px] border border-white/8 bg-white/5 p-5 shadow-[0_32px_90px_rgba(0,0,0,0.35)]">
                  <div className="rounded-[24px] bg-[#181818] p-5">
                    <div className="flex items-center justify-between border-b border-white/8 pb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Workspace</p>
                        <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">Transferly</p>
                      </div>
                      <div
                        className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white"
                        style={{ backgroundColor: brand }}
                      >
                        Live
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        { value: `${totalReceipts.toLocaleString()}+`, label: 'Activities' },
                        { value: `${totalUsers.toLocaleString()}+`, label: 'Happy Users' },
                        { value: `${emailCount.toLocaleString()}+`, label: 'Emails Sent' }
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl bg-white/5 p-4">
                          <p className="text-xl font-black tracking-[-0.04em]">{stat.value}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/42">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-[22px] bg-white px-4 py-4 text-slate-950">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Featured</p>
                            <p className="mt-1 text-lg font-black tracking-[-0.03em]">AI Reply</p>
                          </div>
                          <Bot size={20} className="text-slate-400" />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">Smart AI-powered replies for any conversation.</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] bg-white/5 p-4">
                          <p className="text-sm font-bold">Bank Slips</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/42">Generate</p>
                        </div>
                        <div className="rounded-[22px] bg-white/5 p-4">
                          <p className="text-sm font-bold">Flash Emails</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/42">Send</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-black/5 bg-[#f7f4ed] text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Supported Platforms</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-9">
              {supportedPlatforms.map((platform) => (
                <div
                  key={platform.key}
                  className="flex items-center justify-center gap-3 rounded-full border border-[#e7dfd0] bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.03)]"
                >
                  <ServiceLogo service={platform.service} size="sm" />
                  <span>{platform.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f4ed] text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">Features</p>
              <h2 className="text-4xl font-black tracking-[-0.05em]">Everything You Need, One Platform</h2>
              <p className="text-base leading-8 text-slate-600">
                A single consumer workspace for receipt generation, email operations, support-style surfaces, and utility actions powered by one points wallet.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className={`rounded-[28px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${
                      index === 0
                        ? 'border-[#151515] bg-[#151515] text-white lg:col-span-2'
                        : 'border-[#ebe2d4] bg-white text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          index === 0 ? 'bg-white/10 text-white' : 'bg-orange-50 text-orange-600'
                        }`}
                      >
                        <Icon size={22} />
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                          index === 0 ? 'bg-white/10 text-orange-200' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {feature.eyebrow}
                      </span>
                    </div>
                    <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">{feature.title}</h3>
                    <p className={`mt-3 text-sm leading-7 ${index === 0 ? 'text-white/72' : 'text-slate-600'}`}>{feature.body}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {serviceFeatures.map((service) => (
                <div key={service.slug} className="rounded-[24px] border border-[#ebe2d4] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center gap-3">
                    <ServiceLogo service={service} size="sm" />
                    <div>
                      <p className="text-sm font-black text-slate-950">{service.title}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{service.category}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">How It Works</p>
              <h2 className="text-4xl font-black tracking-[-0.05em]">Three Simple Steps</h2>
              <p className="text-base leading-8 text-slate-600">Getting started takes less than a minute. Here&apos;s how.</p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((item) => (
                <article key={item.step} className="rounded-[28px] border border-[#ebe2d4] bg-[#f7f4ed] p-6">
                  <p className="text-5xl font-black tracking-[-0.06em]" style={{ color: brand }}>
                    {item.step}
                  </p>
                  <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f4ed] text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">Testimonials</p>
                <h2 className="text-4xl font-black tracking-[-0.05em]">Loved by Thousands</h2>
                <p className="text-base leading-8 text-slate-600">Join {totalUsers.toLocaleString()}+ users who trust Transferly for their digital service needs.</p>
              </div>
              <div className="rounded-full border border-[#e7dfd0] bg-white px-4 py-2 text-sm font-bold text-slate-700">
                {totalUsers.toLocaleString()}+ users
              </div>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {featuredTestimonials.map((testimonial, index) => (
                <article key={testimonial.id || index} className="rounded-[26px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <p className="text-sm leading-7 text-slate-700">
                    “{testimonial.content}”
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ backgroundColor: brand }}
                    >
                      {(testimonial.clientName || testimonial.name || 'S')
                        .split(' ')
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">{testimonial.clientName || testimonial.name || 'Transferly User'}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {testimonial.clientCountry || testimonial.role || 'Community'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
