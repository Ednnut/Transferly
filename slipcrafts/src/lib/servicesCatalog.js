export const serviceCatalog = [
  {
    slug: 'ai-reply',
    title: 'AI Reply',
    category: 'Featured',
    badge: 'New',
    status: 'available',
    description: 'Smart AI-powered replies for your conversations. Paste a message or screenshot and get the perfect response.',
    detail:
      'Use this flow when you want quick drafting help before sending a message. It fits the live Transferly pattern of lightweight utility tools that sit beside the core receipt flows.',
    launchTo: '/transactions',
    launchLabel: 'Open Activity',
    accent: { bg: '#111827', fg: '#f8fafc', edge: '#374151', glow: 'rgba(17,24,39,0.28)' },
    mark: 'AI'
  },
  {
    slug: 'articles',
    title: 'Articles',
    category: 'Premium Articles',
    badge: 'Utility',
    status: 'available',
    description: 'Buy and read premium article bundles inside the same workspace.',
    detail:
      'The live app exposes articles as a separate utility surface. This implementation keeps the dedicated service page and positions it as a content-led workspace rather than a generator.',
    launchTo: '/transactions',
    launchLabel: 'View Orders',
    accent: { bg: '#0f172a', fg: '#f8fafc', edge: '#334155', glow: 'rgba(15,23,42,0.28)' },
    mark: 'AR'
  },
  {
    slug: 'faker-data',
    title: 'Faker Data',
    category: 'Data Generator',
    badge: 'Utility',
    status: 'available',
    description: 'Generate quick fake data sets and utility payloads for demos and support workflows.',
    detail:
      'This mirrors the live catalog item that sits alongside receipts and flash emails. It is presented as a distinct tool even if your current backend does not yet generate dedicated faker outputs.',
    launchTo: '/transactions',
    launchLabel: 'Open Activity',
    accent: { bg: '#164e63', fg: '#ecfeff', edge: '#0f766e', glow: 'rgba(8,145,178,0.22)' },
    mark: 'FD'
  },
  {
    slug: 'opay',
    title: 'Opay',
    category: 'Bank Slips',
    badge: 'Popular',
    status: 'available',
    description: 'Generate Opay-style transfer slip visuals from the bank receipt workspace.',
    detail:
      'Opay is one of the first-click bank-slip brands in the live app. The dedicated page funnels into the existing bank slip generator with Opay-specific framing.',
    launchTo: '/dashboard/generate?type=bank&service=opay',
    launchLabel: 'Open Bank Slip Tool',
    accent: { bg: '#16a34a', fg: '#f0fdf4', edge: '#166534', glow: 'rgba(34,197,94,0.24)' },
    mark: 'OP'
  },
  {
    slug: 'kuda',
    title: 'Kuda',
    category: 'Bank Slips',
    badge: 'Popular',
    status: 'available',
    description: 'Launch the Kuda-style transfer slip workflow from a dedicated service page.',
    detail:
      'Kuda follows the same structure as Opay in the live catalog. It lands in the bank slip flow, but the click path is its own branded service page.',
    launchTo: '/dashboard/generate?type=bank&service=kuda',
    launchLabel: 'Open Bank Slip Tool',
    accent: { bg: '#7c3aed', fg: '#f5f3ff', edge: '#5b21b6', glow: 'rgba(124,58,237,0.22)' },
    mark: 'KU'
  },
  {
    slug: 'palmpay',
    title: 'Palmpay',
    category: 'Bank Slips',
    badge: 'Soon',
    status: 'comingSoon',
    description: 'Preview the upcoming Palmpay bank slip flow.',
    detail:
      'The captured live app shows Palmpay with a coming-soon treatment. This page preserves that expectation instead of pretending the generator already supports it.',
    launchTo: '',
    launchLabel: 'Coming Soon',
    accent: { bg: '#15803d', fg: '#f0fdf4', edge: '#14532d', glow: 'rgba(21,128,61,0.2)' },
    mark: 'PP'
  },
  {
    slug: 'binance',
    title: 'Binance',
    category: 'Flash Emails',
    badge: 'Live',
    status: 'available',
    description: 'Open the flash-mail flow with Binance positioning and branding context.',
    detail:
      'The live app exposes Binance as a first-class flash email service. This dedicated page routes into the existing email receipt builder with Binance selected in context.',
    launchTo: '/dashboard/generate?type=email&service=binance',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#f59e0b', fg: '#1f2937', edge: '#b45309', glow: 'rgba(245,158,11,0.24)' },
    mark: 'BI'
  },
  {
    slug: 'bybit',
    title: 'Bybit',
    category: 'Flash Emails',
    badge: 'Live',
    status: 'available',
    description: 'Bybit-branded flash email workflow for transactional or support-style outputs.',
    detail:
      'Bybit lives in the same flash email family as Binance and Coinbase on the captured live services page.',
    launchTo: '/dashboard/generate?type=email&service=bybit',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#111827', fg: '#fef3c7', edge: '#374151', glow: 'rgba(17,24,39,0.28)' },
    mark: 'BY'
  },
  {
    slug: 'coinbase',
    title: 'Coinbase',
    category: 'Flash Emails',
    badge: 'Live',
    status: 'available',
    description: 'Coinbase flash email service page routed into the email generator.',
    detail:
      'Coinbase is a core flash email brand in the captured live catalog. The dedicated page keeps that branded click path while reusing the current email tooling.',
    launchTo: '/dashboard/generate?type=email&service=coinbase',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#2563eb', fg: '#eff6ff', edge: '#1d4ed8', glow: 'rgba(37,99,235,0.24)' },
    mark: 'CB'
  },
  {
    slug: 'paypal',
    title: 'PayPal',
    category: 'Flash Emails',
    badge: 'Live',
    status: 'available',
    description: 'PayPal-styled flash email flow with its own branded service surface.',
    detail:
      'PayPal is one of the most visible services in the live app. This page preserves that prominence and routes into the email receipt generator with PayPal preselected in context.',
    launchTo: '/dashboard/generate?type=email&service=paypal',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#003087', fg: '#eff6ff', edge: '#1d4ed8', glow: 'rgba(0,48,135,0.24)' },
    mark: 'PP'
  },
  {
    slug: 'stripe',
    title: 'Stripe Connect',
    category: 'Payment Providers',
    badge: 'Adapter',
    status: 'available',
    description: 'Stripe Connect provider launcher for invoices, payment links, connected-account payouts, and balance readiness.',
    detail:
      'Stripe is registered as a payment provider adapter. The launcher groups Custom Details, Invoices, Payouts, Wallet Balance, and setup state in one service page.',
    launchTo: '/services/stripe',
    launchLabel: 'Open Stripe Launcher',
    accent: { bg: '#635bff', fg: '#ffffff', edge: '#4f46e5', glow: 'rgba(99,91,255,0.24)' },
    mark: 'ST'
  },
  {
    slug: 'paystack',
    title: 'Paystack',
    category: 'Payment Providers',
    badge: 'Adapter',
    status: 'available',
    description: 'Paystack provider launcher for Payment Requests, transfers, wallet balance, and webhook readiness.',
    detail:
      'Paystack is registered as a payment provider adapter. The launcher groups invoice-like Payment Requests, transfers, Custom Details, and provider setup lanes.',
    launchTo: '/services/paystack',
    launchLabel: 'Open Paystack Launcher',
    accent: { bg: '#011b33', fg: '#ffffff', edge: '#0f3b61', glow: 'rgba(1,27,51,0.26)' },
    mark: 'PS'
  },
  {
    slug: 'flutterwave',
    title: 'Flutterwave',
    category: 'Payment Providers',
    badge: 'Adapter',
    status: 'available',
    description: 'Flutterwave provider launcher for hosted checkout links, transfers, transfer-rate previews, and wallet readiness.',
    detail:
      'Flutterwave is registered as a payment provider adapter. The launcher groups hosted checkout, payout transfers, Custom Details, balance readiness, and setup state.',
    launchTo: '/services/flutterwave',
    launchLabel: 'Open Flutterwave Launcher',
    accent: { bg: '#f5a623', fg: '#1f2937', edge: '#b87503', glow: 'rgba(245,166,35,0.24)' },
    mark: 'FL'
  },
  {
    slug: 'crypto',
    title: 'Crypto Commerce',
    category: 'Payment Providers',
    badge: 'Adapter',
    status: 'available',
    description: 'Crypto Commerce provider launcher for hosted crypto checkout, settlement review, and receipt-style custom details.',
    detail:
      'Crypto Commerce is registered as a hosted charge and checkout adapter. The launcher keeps crypto invoices, settlement safeguards, wallet review, and Custom Details grouped together.',
    launchTo: '/services/crypto',
    launchLabel: 'Open Crypto Launcher',
    accent: { bg: '#111827', fg: '#fef3c7', edge: '#374151', glow: 'rgba(17,24,39,0.28)' },
    mark: 'CR'
  },
  {
    slug: 'crypto-com',
    title: 'Crypto.com',
    category: 'Flash Emails',
    badge: 'Live',
    status: 'available',
    description: 'Crypto.com flash email surface with direct access into the email builder.',
    detail:
      'The captured live services page places Crypto.com in the same active flash-email set as PayPal, Binance, and Coinbase.',
    launchTo: '/dashboard/generate?type=email&service=crypto-com',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#1d4ed8', fg: '#eff6ff', edge: '#1e40af', glow: 'rgba(29,78,216,0.24)' },
    mark: 'CC'
  },
  {
    slug: 'wise',
    title: 'Wise',
    category: 'Flash Emails',
    badge: 'Live',
    status: 'available',
    description: 'Wise-branded flash mail tool page that routes into the existing email workflow.',
    detail:
      'Wise is grouped under flash emails in the captured live catalog. This page preserves that structure and routes to the generator.',
    launchTo: '/dashboard/generate?type=email&service=wise',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#14b8a6', fg: '#ecfeff', edge: '#0f766e', glow: 'rgba(20,184,166,0.24)' },
    mark: 'WI'
  },
  {
    slug: 'cash-app',
    title: 'Cash App',
    category: 'Flash Emails',
    badge: 'New',
    status: 'available',
    description: 'Cash App flash email flow with the same one-click service-page entry used in the live app.',
    detail:
      'Cash App is shown as a new flash email service in the captured live page. The dedicated page mirrors that positioning and routes into the existing builder.',
    launchTo: '/dashboard/generate?type=email&service=cash-app',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#16a34a', fg: '#f0fdf4', edge: '#166534', glow: 'rgba(22,163,74,0.24)' },
    mark: 'CA'
  },
  {
    slug: 'zelle',
    title: 'Zelle',
    category: 'Flash Emails',
    badge: 'New',
    status: 'available',
    description: 'Zelle flash email service with its own branded landing page before launch.',
    detail:
      'Zelle appears as a newer flash-email brand in the live catalog. This keeps the same service-page-first click model.',
    launchTo: '/dashboard/generate?type=email&service=zelle',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#6d28d9', fg: '#f5f3ff', edge: '#5b21b6', glow: 'rgba(109,40,217,0.22)' },
    mark: 'ZE'
  },
  {
    slug: 'venmo',
    title: 'Venmo',
    category: 'Flash Emails',
    badge: 'New',
    status: 'available',
    description: 'Venmo-styled flash email tool page with direct access into the email builder.',
    detail:
      'Venmo is shown as a new flash-email addition in the live service grid. This page makes that service feel first-class before the generator opens.',
    launchTo: '/dashboard/generate?type=email&service=venmo',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#1d4ed8', fg: '#eff6ff', edge: '#1e40af', glow: 'rgba(29,78,216,0.22)' },
    mark: 'VE'
  },
  {
    slug: 'trust-wallet',
    title: 'Trust Wallet',
    category: 'Flash Emails',
    badge: 'New',
    status: 'available',
    description: 'Trust Wallet flash email surface built into the same Transferly flow.',
    detail:
      'Trust Wallet is treated as a new flash-email service in the captured live app. This page mirrors that launch posture.',
    launchTo: '/dashboard/generate?type=email&service=trust-wallet',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#2563eb', fg: '#eff6ff', edge: '#1d4ed8', glow: 'rgba(37,99,235,0.24)' },
    mark: 'TW'
  },
  {
    slug: 'gcash',
    title: 'GCash',
    category: 'Flash Emails',
    badge: 'New',
    status: 'available',
    description: 'GCash flash email flow with dedicated catalog entry and branded landing page.',
    detail:
      'GCash appears in the captured live flash-email list as a newer entry. The page keeps that brand visible even though the generator underneath is shared.',
    launchTo: '/dashboard/generate?type=email&service=gcash',
    launchLabel: 'Open Flash Mail Tool',
    accent: { bg: '#0ea5e9', fg: '#ecfeff', edge: '#0369a1', glow: 'rgba(14,165,233,0.24)' },
    mark: 'GC'
  },
  {
    slug: 'crypto-receipts',
    title: 'Crypto Receipts',
    category: 'Crypto Receipts',
    badge: 'Live',
    status: 'available',
    description: 'Crypto-focused receipt workflow presented as its own service lane.',
    detail:
      'The live catalog separates crypto receipts from general flash emails. This page keeps that product distinction even before a dedicated crypto form exists locally.',
    launchTo: '/transactions',
    launchLabel: 'Open Activity',
    accent: { bg: '#0f172a', fg: '#fef3c7', edge: '#334155', glow: 'rgba(15,23,42,0.3)' },
    mark: 'CR'
  },
  {
    slug: 'support-sites',
    title: 'Support Sites',
    category: 'Support Pages',
    badge: 'Suite',
    status: 'available',
    description: 'Support-style pages and operational landing surfaces inside the service catalog.',
    detail:
      'The captured live services page labels this family as support pages. This dedicated detail screen routes into your existing help/support material.',
    launchTo: '/help',
    launchLabel: 'Open Support Area',
    accent: { bg: '#334155', fg: '#f8fafc', edge: '#0f172a', glow: 'rgba(51,65,85,0.24)' },
    mark: 'SS'
  },
  {
    slug: 'pass-clone',
    title: 'Pass Clone',
    category: 'Password Clone',
    badge: 'Suite',
    status: 'available',
    description: 'Password-clone style operational page surface as shown in the live catalog.',
    detail:
      'Pass Clone appears as its own service in the captured live page. The detail route preserves that separate click target even though the current app still treats it as informational.',
    launchTo: '/help',
    launchLabel: 'Open Help',
    accent: { bg: '#1f2937', fg: '#f8fafc', edge: '#111827', glow: 'rgba(31,41,55,0.24)' },
    mark: 'PC'
  },
  {
    slug: 'wallet-tracker',
    title: 'Wallet Tracker',
    category: 'Wallet Tracker',
    badge: 'New',
    status: 'available',
    description: 'Track wallet-related activity through a dedicated service lane.',
    detail:
      'This is treated as a new utility surface in the captured live app. The page gives it a distinct home even though your local implementation currently routes to activity history.',
    launchTo: '/transactions',
    launchLabel: 'Open Activity',
    accent: { bg: '#0f766e', fg: '#ecfeff', edge: '#115e59', glow: 'rgba(15,118,110,0.24)' },
    mark: 'WT'
  },
  {
    slug: 'qr-code',
    title: 'QR Code',
    category: 'QR Code Generator',
    badge: 'New',
    status: 'available',
    description: 'QR utility flow with its own service surface and brand tile.',
    detail:
      'The captured live service grid treats QR Code as a separate utility entry, so this page makes it directly addressable and catalog-driven.',
    launchTo: '/transactions',
    launchLabel: 'Open Activity',
    accent: { bg: '#ea580c', fg: '#fff7ed', edge: '#c2410c', glow: 'rgba(234,88,12,0.22)' },
    mark: 'QR'
  },
  {
    slug: 'link-shortener',
    title: 'Link Shortener',
    category: 'Link Shortener',
    badge: 'New',
    status: 'available',
    description: 'Short-link utility page modeled after the live service catalog.',
    detail:
      'Link Shortener sits in the utility tail of the captured live list. The dedicated service route keeps it discoverable and aligned with the live IA.',
    launchTo: '/transactions',
    launchLabel: 'Open Activity',
    accent: { bg: '#7c2d12', fg: '#fff7ed', edge: '#9a3412', glow: 'rgba(124,45,18,0.22)' },
    mark: 'LS'
  },
  {
    slug: 'investinnova',
    title: 'Investinnova - Investment platform',
    category: 'Scripts',
    badge: '95,000 pts',
    status: 'available',
    description: 'Script-style purchase listing surfaced below the core service categories in the captured live app.',
    detail:
      'This mirrors the visible script listing from the Playwright capture. It behaves like a dedicated product card rather than a generator tool.',
    launchTo: '/transactions',
    launchLabel: 'View Purchases',
    accent: { bg: '#14532d', fg: '#f0fdf4', edge: '#166534', glow: 'rgba(20,83,45,0.24)' },
    mark: 'IN'
  }
];

export const serviceGroups = [
  {
    title: 'Featured',
    description: 'Top-level utility and content surfaces shown first in the live catalog.',
    slugs: ['ai-reply', 'articles', 'faker-data']
  },
  {
    title: 'Bank Slips',
    description: 'Bank-slip style services with direct, brand-specific launch points.',
    slugs: ['opay', 'kuda', 'palmpay']
  },
  {
    title: 'Payment Providers',
    description: 'Provider launchers group Custom Details, Invoices, Payouts, Wallet Balance, and setup state by provider.',
    slugs: ['paypal', 'stripe', 'wise', 'paystack', 'flutterwave', 'crypto']
  },
  {
    title: 'Flash Emails',
    description: 'The largest part of the catalog, with exchange, wallet, and payment-brand email flows.',
    slugs: [
      'binance',
      'bybit',
      'coinbase',
      'paypal',
      'crypto-com',
      'wise',
      'cash-app',
      'zelle',
      'venmo',
      'trust-wallet',
      'gcash'
    ]
  },
  {
    title: 'Crypto Receipts',
    description: 'Crypto receipt generation is surfaced as its own lane in the captured live app.',
    slugs: ['crypto-receipts']
  },
  {
    title: 'Support Pages',
    description: 'Support page tooling keeps a dedicated group instead of being bundled with utilities.',
    slugs: ['support-sites']
  },
  {
    title: 'Password Clone',
    description: 'Password clone tooling appears as a separate live catalog group.',
    slugs: ['pass-clone']
  },
  {
    title: 'Wallet Tracker',
    description: 'Wallet tracking is presented as its own new service lane.',
    slugs: ['wallet-tracker']
  },
  {
    title: 'QR Code Generator',
    description: 'QR generation is a standalone utility group in the live service catalog.',
    slugs: ['qr-code']
  },
  {
    title: 'Link Shortener',
    description: 'Link shortening is a standalone utility group in the live service catalog.',
    slugs: ['link-shortener']
  },
  {
    title: 'Scripts',
    description: 'Standalone purchasable script listings surfaced below the main service tools.',
    slugs: ['investinnova']
  }
];

export function getServiceBySlug(slug) {
  return serviceCatalog.find((service) => service.slug === slug) || null;
}

export function getServicesByGroup(group) {
  return group.slugs
    .map((slug) => getServiceBySlug(slug))
    .filter(Boolean);
}

const categoryPreviewDefaults = {
  'Flash Emails': {
    eyebrow: 'Flash email flow',
    headline: 'Open a branded mail-style builder with one clean export path.',
    bullets: ['Provider-focused framing', 'Shared receipt/export engine', 'Fast launch from services grid']
  },
  'Bank Slips': {
    eyebrow: 'Bank slip flow',
    headline: 'Launch a branded transfer-slip workspace with transaction-ready fields.',
    bullets: ['Bank-specific framing', 'Printable output', 'Point-based generation']
  },
  Featured: {
    eyebrow: 'Utility flow',
    headline: 'Keep lightweight tools in the same catalog rhythm as the live app.',
    bullets: ['Single-purpose workspace', 'Fast re-entry from dashboard', 'Catalog-first navigation']
  },
  Scripts: {
    eyebrow: 'Script listing',
    headline: 'Treat premium scripts like product listings instead of generic generator cards.',
    bullets: ['High-value listing', 'Separate purchase context', 'Visible inside the main services board']
  }
};

const servicePreviewOverrides = {
  paypal: {
    eyebrow: 'PayPal flash mail',
    headline: 'Route into the PayPal-styled flash-mail builder with a more official, focused entry.',
    bullets: ['PayPal service framing', 'Launches the email builder', 'Best paired with a points top-up']
  },
  opay: {
    eyebrow: 'Opay bank slip',
    headline: 'Start from the Opay tile and drop straight into the transfer-slip workflow.',
    bullets: ['Opay-specific positioning', 'Bank-slip generator underneath', 'Fast output download']
  },
  kuda: {
    eyebrow: 'Kuda bank slip',
    headline: 'Use a dedicated Kuda entry page before entering the shared bank-slip builder.',
    bullets: ['Kuda-branded click path', 'Shared generation engine', 'Points-based export']
  },
  investinnova: {
    eyebrow: 'Script purchase',
    headline: 'Keep premium script offers visually distinct from the tool generators.',
    bullets: ['High-ticket listing', 'Catalog visibility', 'Purchase-oriented product surface']
  }
};

export function getServicePreview(service) {
  return servicePreviewOverrides[service.slug] || categoryPreviewDefaults[service.category] || {
    eyebrow: 'Service flow',
    headline: 'Give each catalog entry a focused preview before the user launches the underlying tool.',
    bullets: ['Dedicated service page', 'Stronger category framing', 'Clear next action']
  };
}

export function getServiceEstimatedCost(service, config) {
  if (service.category === 'Bank Slips') {
    return Number(config?.bank_slip_cost || 10);
  }

  if (service.category === 'Flash Emails') {
    return Number(config?.email_receipt_cost || 5);
  }

  if (service.category === 'Scripts') {
    return 95000;
  }

  return null;
}

export function getRecommendedPointPacks(service, config) {
  const baseline = getServiceEstimatedCost(service, config);

  if (!baseline) {
    return [50, 100, 250, 500];
  }

  const multipliers = baseline >= 1000 ? [1, 2, 3, 5] : [2, 5, 10, 25];
  return [...new Set(multipliers.map((multiplier) => baseline * multiplier))]
    .sort((left, right) => left - right);
}

export function getRelatedServices(slug, limit = 3) {
  const current = getServiceBySlug(slug);
  if (!current) {
    return [];
  }

  return serviceCatalog
    .filter((service) => service.slug !== slug)
    .filter((service) => service.category === current.category || service.status === current.status)
    .slice(0, limit);
}

export const dashboardPreviewSlugs = [
  'crypto-receipts',
  'paypal',
  'kuda',
  'cash-app',
  'zelle',
  'venmo',
  'trust-wallet',
  'wise',
  'faker-data',
  'wallet-tracker',
  'binance',
  'coinbase'
];
