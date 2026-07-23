import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  Copy,
  CreditCard,
  FileText,
  Gauge,
  History,
  Layers3,
  LifeBuoy,
  Receipt,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Smartphone,
  UserRound,
  WalletCards
} from 'lucide-react';

export const paypalWalletQuickAccessItems = [
  { label: 'Business Tools', to: '/miniapp/services/paypal/overview', icon: Layers3 },
  { label: 'Invoicing', to: '/miniapp/services/paypal/invoices', icon: Receipt },
  { label: 'Request money', to: '/miniapp/services/paypal/mail', icon: CreditCard },
  { label: 'Send money', to: '/miniapp/services/paypal/payouts', icon: Send },
  { label: 'PayPal.Me', to: '/miniapp/services/paypal/settings', icon: UserRound },
  { label: 'PayPal Checkout', to: '/miniapp/services/paypal/developer', icon: ShieldCheck },
  { label: 'PayPal Working Capital', to: '/miniapp/wallet?service=paypal', icon: WalletCards },
  { label: 'Payment Links & Buttons', to: '/miniapp/services/paypal/payment-links', icon: Copy },
  { label: 'Business Debit Card', to: '/miniapp/wallet?service=paypal', icon: CreditCard },
  { label: 'Store Sync', to: '/miniapp/services/paypal/activity', icon: History }
];

export const paypalWalletMailTasks = [
  {
    label: 'Custom Mail',
    body: 'Build PayPal flash mail with custom recipient, amount, note, and delivery context.',
    to: '/miniapp/services/paypal/mail?mode=custom-mail',
    icon: FileText,
    badge: 'Flash'
  },
  {
    label: 'Deposit Mail',
    body: 'Prepare a deposit notification path with PayPal-specific payment and funding fields.',
    to: '/miniapp/services/paypal/mail?mode=deposit-mail',
    icon: CreditCard,
    badge: 'Deposit'
  },
  {
    label: 'Mail History',
    body: 'Search, duplicate, and export PayPal mail records from the Transferly vault.',
    to: '/miniapp/vault?service=paypal',
    icon: History,
    badge: 'Vault'
  },
  {
    label: 'Open PayPal provider workspace',
    body: 'Review PayPal provider health, webhook events, invoices, payouts, and recovery actions.',
    to: '/miniapp/services/paypal/overview',
    icon: ShieldCheck,
    badge: 'Ops'
  }
];

export const paypalWalletPerformanceCards = [
  { label: 'Total sales volume', value: '$11,500.00', trend: '+12%', to: '/miniapp/analytics?provider=paypal&metric=sales-volume' },
  { label: 'Average order value', value: '$287.50', trend: '+4%', to: '/miniapp/analytics?provider=paypal&metric=orders' },
  { label: 'Total customers', value: '42', trend: '+8', to: '/miniapp/analytics?provider=paypal&metric=customers' },
  { label: 'Total sales count', value: '40', trend: '+6', to: '/miniapp/analytics?provider=paypal&metric=sales-count' }
];

export const paypalWalletActivityRows = [
  { id: 'act-1000', date: '5/14/26, 4:00 PM', type: 'Payment to', name: 'Customer account', amount: '$1,000.00 USD', status: 'Completed', category: 'payments', note: 'Payment link checkout captured and available in balance.' },
  { id: 'act-550', date: '5/4/26, 7:23 AM', type: 'Payment to', name: 'Recipient account', amount: '$550.00 USD', status: 'Pending', category: 'payments', note: 'Recipient payment is being reviewed before release.' },
  { id: 'act-withdraw-500', date: '5/4/26, 7:01 AM', type: 'Withdraw from', name: 'Bank Account', amount: '$500.00 USD', status: 'Completed', category: 'bank', note: 'Bank withdrawal settled to the linked operating account.' },
  { id: 'act-transfer-500', date: '5/4/26, 7:00 AM', type: 'Transfer to', name: 'Bank Account', amount: '$500.00 USD', status: 'Completed', category: 'bank', note: 'Balance transfer created from the wallet dashboard.' }
];

export const paypalWalletDeveloperTasks = [
  { label: 'API credentials', to: '/miniapp/services/paypal/developer', detail: 'Client status and setup checks' },
  { label: 'Webhooks', to: '/miniapp/services/paypal/developer', detail: 'Delivery health, replay, and dead-letter recovery' },
  { label: 'Invoices', to: '/miniapp/services/paypal/invoices', detail: 'Create, remind, and reconcile PayPal invoices' },
  { label: 'Payouts', to: '/miniapp/services/paypal/payouts', detail: 'Review and release payout requests' }
];

export const paypalWalletMenuItems = [
  { label: 'Home', to: '/miniapp/services/paypal/overview', icon: Gauge },
  { label: 'Activity', to: '/miniapp/services/paypal/activity', icon: Activity, hasPanel: true },
  { label: 'Sales', to: '/miniapp/services/paypal/activity', icon: BarChart3, hasPanel: true },
  { label: 'Finance', to: '/miniapp/wallet?service=paypal', icon: WalletCards, hasPanel: true },
  { label: 'Operations', to: '/miniapp/services/paypal/settings', icon: ShieldCheck, hasPanel: true },
  { label: 'Pay & Get Paid', to: '/miniapp/services/paypal/payment-links', icon: Send, hasPanel: true },
  { label: 'Business Tools', to: '/miniapp/services/paypal/overview', icon: Sparkles },
  { label: 'Developer', to: '/miniapp/services/paypal/developer', icon: ShieldCheck },
  { label: 'Profile', to: '/miniapp/profile', icon: UserRound },
  { label: 'Settings', to: '/miniapp/services/paypal/settings', icon: Settings },
  { label: 'Message Center (0)', to: '/miniapp/services/paypal/activity', icon: Bell },
  { label: 'Help', to: '/miniapp/support', icon: LifeBuoy },
  { label: 'Log out', to: '/miniapp', icon: ArrowLeft }
];

export const paypalWalletMenuPanels = {
  Activity: [
    { label: 'All transactions', to: '/miniapp/services/paypal/activity' },
    { label: 'Statements', to: '/miniapp/services/paypal/activity?view=statements' },
    { label: 'Disputes', to: '/miniapp/services/paypal/activity?view=disputes' }
  ],
  Sales: [
    { label: 'Sales insights', to: '/miniapp/services/paypal/activity?view=sales' },
    { label: 'Customer list', to: '/miniapp/clients?provider=paypal' },
    { label: 'Reports', to: '/miniapp/analytics?provider=paypal&view=sales' }
  ],
  Finance: [
    { label: 'Balance', to: '/miniapp/services/paypal/overview' },
    { label: 'Banks and cards', to: '/miniapp/wallet?service=paypal' },
    { label: 'Currencies', to: '/miniapp/ops?provider=paypal' }
  ],
  Operations: [
    { label: 'Business setup', to: '/miniapp/services/paypal/settings' },
    { label: 'Provider health', to: '/miniapp/services/paypal/developer' },
    { label: 'Security checks', to: '/miniapp/security?provider=paypal' }
  ],
  'Pay & Get Paid': [
    { label: 'Create an Invoice', to: '/miniapp/services/paypal/invoices?action=create' },
    { label: 'Request Money', to: '/miniapp/services/paypal/mail?mode=custom-mail' },
    { label: 'PayPal.Me', to: '/miniapp/services/paypal/payment-links?type=paypal-me' },
    { label: 'QR Code', to: '/miniapp/services/paypal/payment-links?format=qr' },
    { label: 'Virtual Terminal', to: '/miniapp/ops?provider=paypal&tool=terminal' },
    { label: 'Payment Links and Buttons', to: '/miniapp/services/paypal/payment-links' },
    { label: 'Shopping Cart Buttons', to: '/miniapp/services/paypal/payment-links?type=cart' },
    { label: 'Send Money', to: '/miniapp/services/paypal/payouts' },
    { label: 'Payouts', to: '/miniapp/services/paypal/payouts' },
    { label: 'Payment links', to: '/miniapp/services/paypal/payment-links' },
    { label: 'Custom mail', to: '/miniapp/services/paypal/mail?mode=custom-mail' },
    { label: 'Deposit mail', to: '/miniapp/services/paypal/mail?mode=deposit-mail' }
  ]
};

export const paypalWalletCreateItems = [
  { label: 'P2P Request', to: '/miniapp/services/paypal/mail?mode=custom-mail', icon: UserRound },
  { label: 'Invoice', to: '/miniapp/services/paypal/invoices', icon: Receipt },
  { label: 'Payment Link or Button', to: '/miniapp/services/paypal/payment-links', icon: Copy },
  { label: 'QR Code', to: '/miniapp/services/paypal/payment-links?format=qr', icon: Smartphone },
  { label: 'P2P Payment', to: '/miniapp/services/paypal/payouts', icon: Send },
  { label: 'Transfer to Bank', to: '/miniapp/wallet?service=paypal', icon: CreditCard }
];

export const paypalWalletFooterLinks = ['Help', 'Contact', 'Sitemap', 'Fees', 'Security', 'About', 'Developers', 'Partners'];

export const paypalWalletLanguageLinks = ['English'];

export const paypalOperationTabs = [
  { id: 'send', label: 'Send payment', icon: Send },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'payouts', label: 'Payouts', icon: CreditCard },
  { id: 'tracking', label: 'Track', icon: Search }
];

export const paypalSendNavigationTabs = ['Send', 'Request', 'Contacts', 'Pools', 'More'];
