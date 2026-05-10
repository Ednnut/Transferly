const SERVICE_GROUPS = [
  {
    id: "BANK",
    title: "Bank Slips",
    description: "Generate bank-transfer slip receipts.",
    slugs: ["opay", "kuda", "palmpay"],
  },
  {
    id: "PAYMENT_PROVIDERS",
    title: "Payment Providers",
    description: "Provider workspaces for custom details, invoices, payouts, balances, and activity.",
    slugs: ["paypal", "stripe", "wise", "paystack", "flutterwave", "crypto"],
  },
  {
    id: "FLASH",
    title: "Flash Emails",
    description: "Generate branded flash-email receipts.",
    slugs: [
      "binance",
      "bybit",
      "coinbase",
      "paypal",
      "crypto-com",
      "wise",
      "cash-app",
      "zelle",
      "venmo",
      "trust-wallet",
      "gcash",
    ],
  },
  {
    id: "CRYPTO",
    title: "Crypto Receipts",
    description: "Crypto-focused receipt workflows.",
    slugs: ["crypto-receipts"],
  },
  {
    id: "UTILITIES",
    title: "Utilities",
    description: "Support, wallet, QR, link, and content tools.",
    slugs: [
      "ai-reply",
      "articles",
      "faker-data",
      "support-sites",
      "pass-clone",
      "wallet-tracker",
      "qr-code",
      "link-shortener",
      "investinnova",
    ],
  },
];

const SERVICE_CATALOG = [
  { slug: "ai-reply", title: "AI Reply", category: "Featured", status: "available", badge: "New", launchMode: "info" },
  { slug: "articles", title: "Articles", category: "Featured", status: "available", badge: "Utility", launchMode: "info" },
  { slug: "faker-data", title: "Faker Data", category: "Featured", status: "available", badge: "Utility", launchMode: "info" },
  { slug: "opay", title: "Opay", category: "Bank Slips", status: "available", badge: "Popular", receiptType: "bank" },
  { slug: "kuda", title: "Kuda", category: "Bank Slips", status: "available", badge: "Popular", receiptType: "bank" },
  { slug: "palmpay", title: "Palmpay", category: "Bank Slips", status: "comingSoon", badge: "Soon", receiptType: "bank" },
  { slug: "binance", title: "Binance", category: "Flash Emails", status: "available", badge: "Live", receiptType: "email" },
  { slug: "bybit", title: "Bybit", category: "Flash Emails", status: "available", badge: "Live", receiptType: "email" },
  { slug: "coinbase", title: "Coinbase", category: "Flash Emails", status: "available", badge: "Live", receiptType: "email" },
  { slug: "paypal", title: "PayPal", category: "Flash Emails", status: "available", badge: "Live", receiptType: "email" },
  { slug: "stripe", title: "Stripe Connect", category: "Payment Providers", status: "available", badge: "Adapter", receiptType: "email" },
  { slug: "paystack", title: "Paystack", category: "Payment Providers", status: "available", badge: "Adapter", receiptType: "email" },
  { slug: "flutterwave", title: "Flutterwave", category: "Payment Providers", status: "available", badge: "Adapter", receiptType: "email" },
  { slug: "crypto", title: "Crypto Commerce", category: "Payment Providers", status: "available", badge: "Adapter", receiptType: "email" },
  { slug: "crypto-com", title: "Crypto.com", category: "Flash Emails", status: "available", badge: "Live", receiptType: "email" },
  { slug: "wise", title: "Wise", category: "Flash Emails", status: "available", badge: "Live", receiptType: "email" },
  { slug: "cash-app", title: "Cash App", category: "Flash Emails", status: "available", badge: "New", receiptType: "email" },
  { slug: "zelle", title: "Zelle", category: "Flash Emails", status: "available", badge: "New", receiptType: "email" },
  { slug: "venmo", title: "Venmo", category: "Flash Emails", status: "available", badge: "New", receiptType: "email" },
  { slug: "trust-wallet", title: "Trust Wallet", category: "Flash Emails", status: "available", badge: "New", receiptType: "email" },
  { slug: "gcash", title: "GCash", category: "Flash Emails", status: "available", badge: "New", receiptType: "email" },
  { slug: "crypto-receipts", title: "Crypto Receipts", category: "Crypto Receipts", status: "available", badge: "Live", receiptType: "email" },
  { slug: "support-sites", title: "Support Sites", category: "Support Pages", status: "available", badge: "Suite", launchMode: "info" },
  { slug: "pass-clone", title: "Pass Clone", category: "Password Clone", status: "available", badge: "Suite", launchMode: "info" },
  { slug: "wallet-tracker", title: "Wallet Tracker", category: "Wallet Tracker", status: "available", badge: "New", launchMode: "info" },
  { slug: "qr-code", title: "QR Code", category: "QR Code Generator", status: "available", badge: "New", launchMode: "info" },
  { slug: "link-shortener", title: "Link Shortener", category: "Link Shortener", status: "available", badge: "New", launchMode: "info" },
  { slug: "investinnova", title: "Investinnova - Investment platform", category: "Scripts", status: "available", badge: "95,000 pts", launchMode: "info" },
];

const SERVICE_BY_SLUG = new Map(SERVICE_CATALOG.map((service) => [service.slug, service]));
const SERVICE_GROUP_BY_ID = new Map(SERVICE_GROUPS.map((group) => [group.id, group]));

function getService(slug) {
  return SERVICE_BY_SLUG.get(String(slug || "").toLowerCase()) || null;
}

function getGroup(groupId) {
  return SERVICE_GROUP_BY_ID.get(String(groupId || "").toUpperCase()) || null;
}

function canGenerateService(service) {
  return Boolean(service?.receiptType && service.status === "available");
}

function getServiceGroupId(service) {
  const group = SERVICE_GROUPS.find((item) => item.slugs.includes(service?.slug));
  return group?.id || "UTILITIES";
}

function serviceSummary(service) {
  if (!service) return "Unknown service.";
  if (canGenerateService(service)) {
    const flow = service.receiptType === "bank" ? "Bank-slip receipt" : "Email receipt";
    return `${flow} service in the ${service.category} workspace.`;
  }
  if (service.status === "comingSoon") {
    return "This service is visible in the catalog but is not enabled for generation yet.";
  }
  return "This catalog service is available as an informational or web-app workspace entry.";
}

function searchServices(term, limit = 8) {
  const query = String(term || "").trim().toLowerCase();
  if (!query) return [];

  return SERVICE_CATALOG
    .map((service) => {
      const fields = [service.slug, service.title, service.category, service.badge].map((value) =>
        String(value || "").toLowerCase(),
      );
      const exact = fields.some((field) => field === query);
      const startsWith = fields.some((field) => field.startsWith(query));
      const includes = fields.some((field) => field.includes(query));
      if (!exact && !startsWith && !includes) {
        return null;
      }
      return {
        service,
        score: exact ? 0 : startsWith ? 1 : 2,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.service.title.localeCompare(b.service.title))
    .slice(0, limit)
    .map((entry) => entry.service);
}

module.exports = {
  SERVICE_GROUPS,
  SERVICE_CATALOG,
  getService,
  getGroup,
  searchServices,
  canGenerateService,
  getServiceGroupId,
  serviceSummary,
};
