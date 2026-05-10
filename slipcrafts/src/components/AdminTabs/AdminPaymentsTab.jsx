import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  ExternalLink,
  FileText,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldX,
  Send,
  Trash2,
  Wallet,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { listStripeConnectedAccounts } from '../../lib/api';
import PayPalSandboxPayoutChrome from './AdminPaymentsTab.paypalSandbox';
import {
  BUILT_IN_INVOICE_SAVED_VIEWS,
  BUILT_IN_PAYOUT_SAVED_VIEWS,
  PAYPAL_BRAND,
  buildReminderDrafts,
  calculateLineItemSubtotalCents,
  calculateLineItemsTotalCents,
  createEmptyInvoiceComposer,
  createEmptyLineItem,
  createEmptyPayoutComposer,
  createEmptyTemplateForm,
  formatCents,
  formatDateTime,
  getInitialPageParam,
  getInitialSearchParam,
  getPayoutPricingPreview,
  getTopUpOrderTone,
  getWalletAvailableCents,
  getWalletBucketCents,
  parseMoneyToCents,
  readSavedViewsForType,
  setSearchParamIfChanged,
  writeSavedViewsForType
} from './AdminPaymentsTab.utils';
import {
  DetailRow,
  InvoiceActions,
  PaginationControls,
  PaymentRecordDrawer,
  PayoutComposerSection,
  PayoutActions,
  StatusPill,
  TimelinePanel
} from './AdminPaymentsTab.components';

export default function AdminPaymentsTab({ mode = 'all', embedded = false, providerFilter = '' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || '';
  const {
    config,
    profile,
    invoices,
    invoiceTemplates,
    invoiceReminderConfigurations,
    paymentIssues,
    payouts,
    invoicePagination,
    payoutPagination,
    adminTopUpOrders,
    acknowledgePaymentIssue,
    fetchInvoices,
    fetchInvoiceReminderConfigurations,
    fetchInvoiceTemplates,
    fetchPaymentIssues,
    fetchPayouts,
    fetchAdminTopUpOrders,
    createInvoice,
    previewInvoice,
    createPayout,
    previewPayout,
    approvePayout,
    rejectPayout,
    releaseInvoiceFunds,
    markInvoiceReviewRequired,
    addInvoiceNote,
    addPayoutNote,
    createInvoiceTemplate,
    updateInvoiceTemplate,
    deleteInvoiceTemplate,
    refreshInvoice,
    sendInvoiceReminder,
    cancelInvoiceAutoReminders,
    generateInvoiceQr,
    cancelInvoice,
    updateInvoiceReminderConfiguration,
    suspendInvoiceReminderConfiguration,
    resumeInvoiceReminderConfiguration,
    fetchInvoiceTimeline,
    refreshPayout,
    cancelUnclaimedPayout,
    fetchPayoutTimeline,
    runPaymentReconciliation,
    resolvePaymentIssue,
    reopenPaymentIssue,
    completeTopUpOrder,
    cancelTopUpOrder
  } = useAppContext();
  const brand = config?.brand_color || '#f8812d';
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [invoiceTimelineId, setInvoiceTimelineId] = useState('');
  const [payoutTimelineId, setPayoutTimelineId] = useState('');
  const [invoiceTimelineEntries, setInvoiceTimelineEntries] = useState([]);
  const [payoutTimelineEntries, setPayoutTimelineEntries] = useState([]);
  const [invoiceTimelineLoading, setInvoiceTimelineLoading] = useState(false);
  const [payoutTimelineLoading, setPayoutTimelineLoading] = useState(false);
  const [reminderDrafts, setReminderDrafts] = useState({});
  const [issueNotes, setIssueNotes] = useState({});
  const [editingTemplateId, setEditingTemplateId] = useState('');
  const [templateForm, setTemplateForm] = useState(createEmptyTemplateForm());
  const [invoiceComposer, setInvoiceComposer] = useState(createEmptyInvoiceComposer());
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [payoutComposer, setPayoutComposer] = useState(createEmptyPayoutComposer());
  const [lastCreatedPayout, setLastCreatedPayout] = useState(null);
  const [payoutServerPreview, setPayoutServerPreview] = useState(null);
  const [stripeConnectedAccountsState, setStripeConnectedAccountsState] = useState({
    accounts: [],
    loading: false,
    error: ''
  });
  const [selectedStripeConnectedAccountId, setSelectedStripeConnectedAccountId] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState(() => getInitialSearchParam(searchParams, 'invoiceRecipient'));
  const [invoiceProviderSearch, setInvoiceProviderSearch] = useState(() => getInitialSearchParam(searchParams, 'invoiceProvider'));
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState(() => getInitialSearchParam(searchParams, 'invoiceStatus', 'ALL'));
  const [invoiceTemplateFilter, setInvoiceTemplateFilter] = useState(() => getInitialSearchParam(searchParams, 'invoiceTemplate', 'ALL'));
  const [invoiceDateFrom, setInvoiceDateFrom] = useState(() => getInitialSearchParam(searchParams, 'invoiceFrom'));
  const [invoiceDateTo, setInvoiceDateTo] = useState(() => getInitialSearchParam(searchParams, 'invoiceTo'));
  const [invoicePage, setInvoicePage] = useState(() => getInitialPageParam(searchParams, 'invoicePage'));
  const [invoicePageSize, setInvoicePageSize] = useState(() => getInitialSearchParam(searchParams, 'invoicePageSize', '50'));
  const [invoiceSortBy, setInvoiceSortBy] = useState(() => getInitialSearchParam(searchParams, 'invoiceSortBy', 'createdAt'));
  const [invoiceSortDirection, setInvoiceSortDirection] = useState(() => getInitialSearchParam(searchParams, 'invoiceSortDirection', 'desc'));
  const [payoutSearch, setPayoutSearch] = useState(() => getInitialSearchParam(searchParams, 'payoutRecipient'));
  const [payoutStatusFilter, setPayoutStatusFilter] = useState(() => getInitialSearchParam(searchParams, 'payoutStatus', 'ALL'));
  const [payoutProviderFilter, setPayoutProviderFilter] = useState(() => getInitialSearchParam(searchParams, 'payoutProvider', 'ALL'));
  const [payoutDateFrom, setPayoutDateFrom] = useState(() => getInitialSearchParam(searchParams, 'payoutFrom'));
  const [payoutDateTo, setPayoutDateTo] = useState(() => getInitialSearchParam(searchParams, 'payoutTo'));
  const [payoutPage, setPayoutPage] = useState(() => getInitialPageParam(searchParams, 'payoutPage'));
  const [payoutPageSize, setPayoutPageSize] = useState(() => getInitialSearchParam(searchParams, 'payoutPageSize', '50'));
  const [payoutSortBy, setPayoutSortBy] = useState(() => getInitialSearchParam(searchParams, 'payoutSortBy', 'createdAt'));
  const [payoutSortDirection, setPayoutSortDirection] = useState(() => getInitialSearchParam(searchParams, 'payoutSortDirection', 'desc'));
  const [customInvoiceSavedViews, setCustomInvoiceSavedViews] = useState(() => readSavedViewsForType('invoice'));
  const [customPayoutSavedViews, setCustomPayoutSavedViews] = useState(() => readSavedViewsForType('payout'));
  const [invoiceSavedViewName, setInvoiceSavedViewName] = useState('');
  const [payoutSavedViewName, setPayoutSavedViewName] = useState('');
  const [detailDrawer, setDetailDrawer] = useState({ type: '', id: '' });
  const [payoutSandboxView, setPayoutSandboxView] = useState('home');
  const sectionRefs = useRef({});
  const invoiceFilterResetReadyRef = useRef(false);
  const payoutFilterResetReadyRef = useRef(false);
  const showFundingOrders = mode === 'all' || mode === 'payout';
  const showReminderCadence = mode === 'all' || mode === 'invoice';
  const showInvoiceTemplates = mode === 'all' || mode === 'invoice';
  const showInvoices = mode === 'all' || mode === 'invoice';
  const showPayouts = mode === 'all' || mode === 'payout';
  const showPaymentIssues = true;
  const isPayPalInvoiceWorkspace = embedded && mode === 'invoice';
  const isPayPalPayoutWorkspace = embedded && mode === 'payout';
  const isStripePayoutWorkspace = embedded && mode === 'payout' && providerFilter === 'stripe';
  const isPayPalEmbeddedWorkspace = isPayPalInvoiceWorkspace || isPayPalPayoutWorkspace;

  useEffect(() => {
    if (!isStripePayoutWorkspace) {
      setStripeConnectedAccountsState({ accounts: [], loading: false, error: '' });
      setSelectedStripeConnectedAccountId('');
      return undefined;
    }

    let cancelled = false;
    setStripeConnectedAccountsState((previous) => ({ ...previous, loading: true, error: '' }));

    listStripeConnectedAccounts()
      .then((payload) => {
        if (cancelled) return;
        setStripeConnectedAccountsState({
          accounts: Array.isArray(payload?.data) ? payload.data : [],
          loading: false,
          error: ''
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setStripeConnectedAccountsState({
          accounts: [],
          loading: false,
          error: error?.message || 'Stripe connected accounts could not be loaded.'
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isStripePayoutWorkspace]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    if (!embedded) {
      nextParams.set('tab', 'payments');
    }
    setSearchParamIfChanged(nextParams, 'invoiceRecipient', invoiceSearch);
    setSearchParamIfChanged(nextParams, 'invoiceProvider', invoiceProviderSearch);
    setSearchParamIfChanged(nextParams, 'invoiceStatus', invoiceStatusFilter, 'ALL');
    setSearchParamIfChanged(nextParams, 'invoiceTemplate', invoiceTemplateFilter, 'ALL');
    setSearchParamIfChanged(nextParams, 'invoiceFrom', invoiceDateFrom);
    setSearchParamIfChanged(nextParams, 'invoiceTo', invoiceDateTo);
    setSearchParamIfChanged(nextParams, 'invoicePage', invoicePage, '1');
    setSearchParamIfChanged(nextParams, 'invoicePageSize', invoicePageSize, '50');
    setSearchParamIfChanged(nextParams, 'invoiceSortBy', invoiceSortBy, 'createdAt');
    setSearchParamIfChanged(nextParams, 'invoiceSortDirection', invoiceSortDirection, 'desc');
    setSearchParamIfChanged(nextParams, 'payoutRecipient', payoutSearch);
    setSearchParamIfChanged(nextParams, 'payoutStatus', payoutStatusFilter, 'ALL');
    setSearchParamIfChanged(nextParams, 'payoutProvider', payoutProviderFilter, 'ALL');
    setSearchParamIfChanged(nextParams, 'payoutFrom', payoutDateFrom);
    setSearchParamIfChanged(nextParams, 'payoutTo', payoutDateTo);
    setSearchParamIfChanged(nextParams, 'payoutPage', payoutPage, '1');
    setSearchParamIfChanged(nextParams, 'payoutPageSize', payoutPageSize, '50');
    setSearchParamIfChanged(nextParams, 'payoutSortBy', payoutSortBy, 'createdAt');
    setSearchParamIfChanged(nextParams, 'payoutSortDirection', payoutSortDirection, 'desc');

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    embedded,
    invoiceDateFrom,
    invoiceDateTo,
    invoicePage,
    invoicePageSize,
    invoiceProviderSearch,
    invoiceSearch,
    invoiceSortBy,
    invoiceSortDirection,
    invoiceStatusFilter,
    invoiceTemplateFilter,
    payoutDateFrom,
    payoutDateTo,
    payoutPage,
    payoutPageSize,
    payoutProviderFilter,
    payoutSearch,
    payoutSortBy,
    payoutSortDirection,
    payoutStatusFilter,
    searchParams,
    setSearchParams
  ]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      await Promise.all([
        fetchInvoices(),
        fetchPayouts(),
        fetchAdminTopUpOrders(),
        fetchInvoiceReminderConfigurations(),
        fetchInvoiceTemplates(),
        fetchPaymentIssues()
      ]);
      if (active) {
        setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [
    fetchInvoiceReminderConfigurations,
    fetchInvoiceTemplates,
    fetchInvoices,
    fetchPaymentIssues,
    fetchPayouts,
    fetchAdminTopUpOrders
  ]);

  useEffect(() => {
    setReminderDrafts(buildReminderDrafts(invoiceReminderConfigurations));
  }, [invoiceReminderConfigurations]);

  const sectionLinks = useMemo(
    () => [
      ...(showFundingOrders ? [{ id: 'funding-orders', label: 'Funding Orders', icon: CheckCircle2 }] : []),
      ...(showReminderCadence ? [{ id: 'reminder-cadence', label: 'Reminder Cadence', icon: Clock3 }] : []),
      ...(showPaymentIssues ? [{ id: 'payment-issues', label: 'Payment Issues', icon: AlertTriangle }] : []),
      ...(showInvoiceTemplates ? [{ id: 'invoice-templates', label: 'Invoice Templates', icon: FileText }] : []),
      ...(showInvoices ? [{ id: 'invoices', label: 'Official Invoices', icon: QrCode }] : []),
      ...(showPayouts ? [{ id: 'payouts', label: 'Official Payouts', icon: Send }] : [])
    ],
    [showFundingOrders, showReminderCadence, showPaymentIssues, showInvoiceTemplates, showInvoices, showPayouts]
  );

  useEffect(() => {
    if (!activeSection) {
      return;
    }

    const target = sectionRefs.current[activeSection];
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeSection]);

  const summary = useMemo(() => {
    const pendingPayouts = payouts.filter((entry) => ['PENDING', 'PROCESSING', 'QUEUED'].includes(entry.status));
    const payableInvoices = invoices.filter((entry) => ['SENT', 'SCHEDULED', 'UPDATED'].includes(entry.status));
    const openIssues = paymentIssues.filter((entry) => entry.status === 'OPEN');
    const awaitingFundingOrders = adminTopUpOrders.filter((entry) => entry.status === 'awaiting_confirmation');

    return [
      { icon: Wallet, label: 'Invoices', value: invoices.length, tone: brand },
      { icon: Activity, label: 'Payouts', value: payouts.length, tone: '#3b82f6' },
      { icon: CheckCircle2, label: 'Funding Review', value: awaitingFundingOrders.length, tone: '#f59e0b' },
      { icon: FileText, label: 'Templates', value: invoiceTemplates.length, tone: '#111827' },
      { icon: AlertTriangle, label: 'Open Issues', value: openIssues.length, tone: '#ef4444' },
      { icon: Send, label: 'Open Invoice Flows', value: payableInvoices.length, tone: '#10b981' },
      { icon: RotateCcw, label: 'Pending Payout Sync', value: pendingPayouts.length, tone: '#f59e0b' }
    ];
  }, [adminTopUpOrders, brand, invoiceTemplates.length, invoices, paymentIssues, payouts]);

  const visibleSummary = useMemo(() => {
    if (mode === 'invoice') {
      return summary.filter(({ label }) =>
        ['Invoices', 'Templates', 'Open Issues', 'Open Invoice Flows'].includes(label)
      );
    }

    if (mode === 'payout') {
      return summary.filter(({ label }) =>
        ['Payouts', 'Funding Review', 'Open Issues', 'Pending Payout Sync'].includes(label)
      );
    }

    return summary;
  }, [mode, summary]);

  const invoiceStatusOptions = useMemo(
    () => ['ALL', ...new Set(invoices.map((entry) => entry.status).filter(Boolean))],
    [invoices]
  );

  const payoutStatusOptions = useMemo(
    () =>
      Array.from(new Set([
        'ALL',
        'PENDING_APPROVAL',
        'QUEUED',
        'PROCESSING',
        'PENDING',
        'SUCCESS',
        'FAILED',
        'DENIED',
        'REJECTED',
        ...payouts.map((entry) => entry.status).filter(Boolean)
      ])),
    [payouts]
  );

  const payoutProviderOptions = useMemo(
    () =>
      Array.from(new Set([
        'ALL',
        'PENDING',
        'PROCESSING',
        'SUCCESS',
        'UNCLAIMED',
        'ONHOLD',
        'FAILED',
        'RETURNED',
        ...payouts
          .map((entry) => entry.official_paypal?.provider_item_status || entry.metadata?.provider_item_status)
          .filter(Boolean)
      ])),
    [payouts]
  );

  useEffect(() => {
    if (!invoiceFilterResetReadyRef.current) {
      invoiceFilterResetReadyRef.current = true;
      return;
    }

    setInvoicePage(1);
  }, [
    invoiceDateFrom,
    invoiceDateTo,
    invoicePageSize,
    invoiceProviderSearch,
    invoiceSearch,
    invoiceSortBy,
    invoiceSortDirection,
    invoiceStatusFilter,
    invoiceTemplateFilter
  ]);

  const invoiceQuery = useMemo(() => {
    const dateFrom = invoiceDateFrom ? new Date(`${invoiceDateFrom}T00:00:00.000Z`).toISOString() : undefined;
    const dateTo = invoiceDateTo ? new Date(`${invoiceDateTo}T23:59:59.999Z`).toISOString() : undefined;

    return {
      recipient: invoiceSearch.trim() || undefined,
      provider: providerFilter || undefined,
      providerInvoiceId: invoiceProviderSearch.trim() || undefined,
      status: invoiceStatusFilter === 'ALL' ? undefined : invoiceStatusFilter,
      templateId: invoiceTemplateFilter === 'ALL' ? undefined : invoiceTemplateFilter,
      dateFrom,
      dateTo,
      page: invoicePage,
      pageSize: Number(invoicePageSize) || 50,
      sortBy: invoiceSortBy,
      sortDirection: invoiceSortDirection
    };
  }, [
    invoiceDateFrom,
    invoiceDateTo,
    invoicePage,
    invoicePageSize,
    providerFilter,
    invoiceProviderSearch,
    invoiceSearch,
    invoiceSortBy,
    invoiceSortDirection,
    invoiceStatusFilter,
    invoiceTemplateFilter
  ]);

  useEffect(() => {
    if (!showInvoices) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      const nextInvoices = await fetchInvoices(invoiceQuery);
      if (!active) {
        return;
      }
      if (
        detailDrawer.type === 'invoice' &&
        !nextInvoices.some((entry) => entry.internal_invoice_id === detailDrawer.id)
      ) {
        setDetailDrawer({ type: '', id: '' });
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [detailDrawer.id, detailDrawer.type, fetchInvoices, invoiceQuery, showInvoices]);

  useEffect(() => {
    if (!payoutFilterResetReadyRef.current) {
      payoutFilterResetReadyRef.current = true;
      return;
    }

    setPayoutPage(1);
  }, [
    payoutDateFrom,
    payoutDateTo,
    payoutPageSize,
    payoutProviderFilter,
    payoutSearch,
    payoutSortBy,
    payoutSortDirection,
    payoutStatusFilter
  ]);

  const payoutQuery = useMemo(() => {
    const dateFrom = payoutDateFrom ? new Date(`${payoutDateFrom}T00:00:00.000Z`).toISOString() : undefined;
    const dateTo = payoutDateTo ? new Date(`${payoutDateTo}T23:59:59.999Z`).toISOString() : undefined;

    return {
      recipient: payoutSearch.trim() || undefined,
      status: payoutStatusFilter === 'ALL' ? undefined : payoutStatusFilter,
      providerState: payoutProviderFilter === 'ALL' ? undefined : payoutProviderFilter,
      dateFrom,
      dateTo,
      page: payoutPage,
      pageSize: Number(payoutPageSize) || 50,
      sortBy: payoutSortBy,
      sortDirection: payoutSortDirection
    };
  }, [
    payoutDateFrom,
    payoutDateTo,
    payoutPage,
    payoutPageSize,
    payoutProviderFilter,
    payoutSearch,
    payoutSortBy,
    payoutSortDirection,
    payoutStatusFilter
  ]);

  useEffect(() => {
    if (!showPayouts) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      const nextPayouts = await fetchPayouts(payoutQuery);
      if (!active) {
        return;
      }
      if (detailDrawer.type === 'payout' && !nextPayouts.some((entry) => entry.payout_id === detailDrawer.id)) {
        setDetailDrawer({ type: '', id: '' });
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [detailDrawer.id, detailDrawer.type, fetchPayouts, payoutQuery, showPayouts]);

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (invoiceStatusFilter !== 'ALL' && invoice.status !== invoiceStatusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        invoice.summary?.invoice_number,
        invoice.invoice_id,
        invoice.summary?.recipient_email,
        invoice.summary?.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [invoiceSearch, invoiceStatusFilter, invoices]);

  const filteredPayouts = useMemo(() => {
    const query = payoutSearch.trim().toLowerCase();

    return payouts.filter((payout) => {
      const providerStatus = payout.official_paypal?.provider_item_status || payout.metadata?.provider_item_status || '';

      if (payoutStatusFilter !== 'ALL' && payout.status !== payoutStatusFilter) {
        return false;
      }

      if (payoutProviderFilter !== 'ALL' && providerStatus !== payoutProviderFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        payout.payout_id,
        payout.summary?.receiver,
        payout.tracking?.sender_batch_id,
        providerStatus
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [payoutProviderFilter, payoutSearch, payoutStatusFilter, payouts]);

  const workspaceTitle =
    mode === 'invoice'
      ? `Official ${providerFilter === 'stripe' ? 'Stripe' : providerFilter === 'crypto' ? 'Crypto' : 'PayPal'} Invoicing Workspace`
      : mode === 'payout'
        ? `Official ${providerFilter === 'stripe' ? 'Stripe' : 'PayPal'} Payout Workspace`
        : 'PayPal Operations';

  const workspaceDescription =
    mode === 'invoice'
      ? `Run the full hosted-invoice workflow here without leaving the ${providerFilter === 'stripe' ? 'Stripe' : providerFilter === 'crypto' ? 'Crypto' : 'PayPal'} service experience.`
      : mode === 'payout'
        ? `Run the full payout tracking and remediation workflow here without leaving the ${providerFilter === 'stripe' ? 'Stripe' : 'PayPal'} service experience.`
      : 'Work only with official PayPal invoice links, QR payloads, sync actions, and payout tracking.';
  const selectedInvoiceTemplate = invoiceTemplates.find((template) => template.id === invoiceComposer.templateId) || null;
  const invoiceDraftItems = selectedInvoiceTemplate ? selectedInvoiceTemplate.line_items || [] : invoiceComposer.items;
  const invoiceDraftCurrency = selectedInvoiceTemplate
    ? selectedInvoiceTemplate.currency_code
    : (invoiceComposer.currency || 'USD').trim().toUpperCase();
  const invoiceDraftTotalCents = calculateLineItemsTotalCents(invoiceDraftItems);
  const payoutPreview = useMemo(
    () => getPayoutPricingPreview(payoutComposer, config, profile),
    [config, payoutComposer, profile]
  );
  const payoutImpactPreview = payoutServerPreview
    ? {
        ...payoutPreview,
        feeCents: Number(payoutServerPreview.fee_cents || payoutPreview.feeCents),
        totalDebitCents: Number(payoutServerPreview.total_debit_cents || payoutPreview.totalDebitCents),
        availableCents: Number(payoutServerPreview.balance?.available_cents ?? payoutPreview.availableCents),
        remainingAvailableCents: Number(
          payoutServerPreview.balance?.remaining_available_cents ?? payoutPreview.remainingAvailableCents
        ),
        likelyReviewPath:
          payoutServerPreview.next_action === 'MANUAL_REVIEW'
            ? 'Manual review likely'
            : payoutServerPreview.next_action === 'BLOCK'
              ? 'Blocked by policy'
              : payoutServerPreview.next_action === 'READY_AFTER_SETUP'
                ? 'Ready after setup'
              : 'Auto-processing likely'
      }
    : payoutPreview;
  const walletCurrency =
    profile?.wallet?.currencyCode || profile?.wallet?.currency_code || payoutImpactPreview.currency || 'USD';
  const payoutSandboxWallet = {
    availableCents: getWalletAvailableCents(profile),
    pendingCents: getWalletBucketCents(profile, 'pendingBalanceCents', 'pending_balance_cents'),
    frozenCents: getWalletBucketCents(profile, 'frozenBalanceCents', 'frozen_balance_cents'),
    paidOutCents: getWalletBucketCents(profile, 'paidOutBalanceCents', 'paid_out_balance_cents')
  };
  const payoutSandboxStatus = {
    processing: payouts.filter((entry) => ['PENDING', 'PROCESSING', 'QUEUED'].includes(entry.status)).length,
    review: payouts.filter((entry) => entry.status === 'PENDING_APPROVAL').length,
    issues: payouts.filter((entry) =>
      ['ONHOLD', 'RETURNED', 'FAILED', 'DENIED'].includes(
        entry.official_paypal?.provider_item_status || entry.metadata?.provider_item_status || entry.status
      )
    ).length
  };
  const selectedInvoiceRecord = invoices.find((invoice) => invoice.internal_invoice_id === detailDrawer.id) || null;
  const selectedPayoutRecord = payouts.find((payout) => payout.payout_id === detailDrawer.id) || null;
  const showInvoiceComposer = mode === 'invoice';
  const showPayoutComposer = mode === 'payout';
  const renderPayPalPayoutChrome = isPayPalPayoutWorkspace;
  const renderSummaryCards = !renderPayPalPayoutChrome;
  const renderWorkspaceControls = !renderPayPalPayoutChrome;
  const renderPayoutComposer = showPayoutComposer && !renderPayPalPayoutChrome;
  const renderPayoutActivity = showPayouts && !renderPayPalPayoutChrome;
  const renderFundingOrders = showFundingOrders && !renderPayPalPayoutChrome;
  const renderPaymentIssues = showPaymentIssues && !renderPayPalPayoutChrome;
  const handleRefreshAll = async () => {
    setBusyAction('reconciliation');
    const result = await runPaymentReconciliation({ invoiceLimit: 50, payoutLimit: 50 });
    if (result.success) {
      await Promise.all([
        fetchInvoices(),
        fetchPayouts(payoutQuery),
        fetchAdminTopUpOrders(),
        fetchInvoiceReminderConfigurations(),
        fetchPaymentIssues()
      ]);
      toast.success(
        `Reconciled ${result.result.summary.invoice_count} invoices and ${result.result.summary.payout_count} payouts`
      );
    } else {
      toast.error(result.message || 'Failed to run reconciliation');
    }
    setBusyAction('');
  };

  const registerSectionRef = (sectionId) => (element) => {
    if (element) {
      sectionRefs.current[sectionId] = element;
    }
  };

  const handleSectionJump = (sectionId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (embedded) {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', 'payments');
    }
    nextParams.set('section', sectionId);
    setSearchParams(nextParams);
  };

  const handlePayoutSandboxNavigation = (view) => {
    setPayoutSandboxView(view);

    if (isPayPalPayoutWorkspace) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('tab');
      nextParams.delete('section');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const applyPayoutFilters = (next) => {
    if (!next) {
      return;
    }

    setPayoutSearch(next.search || '');
    setPayoutStatusFilter(next.status || 'ALL');
    setPayoutProviderFilter(next.provider || 'ALL');
    setPayoutSortBy(next.sortBy || 'createdAt');
    setPayoutSortDirection(next.sortDirection || 'desc');
    setPayoutDateFrom(next.dateFrom || '');
    setPayoutDateTo(next.dateTo || '');
    setPayoutPageSize(String(next.pageSize || '50'));
  };

  const applyPayoutSavedView = (view) => {
    const savedView = [...BUILT_IN_PAYOUT_SAVED_VIEWS, ...customPayoutSavedViews].find((entry) => entry.id === view);
    applyPayoutFilters(savedView?.filters);
  };

  const applyInvoiceFilters = (next) => {
    if (!next) {
      return;
    }

    setInvoiceSearch(next.recipient || '');
    setInvoiceProviderSearch(next.provider || '');
    setInvoiceStatusFilter(next.status || 'ALL');
    setInvoiceTemplateFilter(next.template || 'ALL');
    setInvoiceSortBy(next.sortBy || 'createdAt');
    setInvoiceSortDirection(next.sortDirection || 'desc');
    setInvoiceDateFrom(next.dateFrom || '');
    setInvoiceDateTo(next.dateTo || '');
    setInvoicePageSize(String(next.pageSize || '50'));
  };

  const applyInvoiceSavedView = (view) => {
    const savedView = [...BUILT_IN_INVOICE_SAVED_VIEWS, ...customInvoiceSavedViews].find((entry) => entry.id === view);
    applyInvoiceFilters(savedView?.filters);
  };

  const buildCurrentInvoiceSavedView = () => ({
    recipient: invoiceSearch,
    provider: invoiceProviderSearch,
    status: invoiceStatusFilter,
    template: invoiceTemplateFilter,
    dateFrom: invoiceDateFrom,
    dateTo: invoiceDateTo,
    pageSize: invoicePageSize,
    sortBy: invoiceSortBy,
    sortDirection: invoiceSortDirection
  });

  const buildCurrentPayoutSavedView = () => ({
    search: payoutSearch,
    status: payoutStatusFilter,
    provider: payoutProviderFilter,
    dateFrom: payoutDateFrom,
    dateTo: payoutDateTo,
    pageSize: payoutPageSize,
    sortBy: payoutSortBy,
    sortDirection: payoutSortDirection
  });

  const handleSaveInvoiceSavedView = () => {
    const label = invoiceSavedViewName.trim();
    if (!label) {
      toast.error('Name the invoice view first');
      return;
    }

    const nextViews = [
      ...customInvoiceSavedViews,
      {
        id: `invoice-${Date.now()}`,
        label,
        filters: buildCurrentInvoiceSavedView()
      }
    ];
    setCustomInvoiceSavedViews(nextViews);
    writeSavedViewsForType('invoice', nextViews);
    setInvoiceSavedViewName('');
    toast.success('Invoice view saved');
  };

  const handleDeleteInvoiceSavedView = (viewId) => {
    const nextViews = customInvoiceSavedViews.filter((entry) => entry.id !== viewId);
    setCustomInvoiceSavedViews(nextViews);
    writeSavedViewsForType('invoice', nextViews);
  };

  const handleSavePayoutSavedView = () => {
    const label = payoutSavedViewName.trim();
    if (!label) {
      toast.error('Name the payout view first');
      return;
    }

    const nextViews = [
      ...customPayoutSavedViews,
      {
        id: `payout-${Date.now()}`,
        label,
        filters: buildCurrentPayoutSavedView()
      }
    ];
    setCustomPayoutSavedViews(nextViews);
    writeSavedViewsForType('payout', nextViews);
    setPayoutSavedViewName('');
    toast.success('Payout view saved');
  };

  const handleDeletePayoutSavedView = (viewId) => {
    const nextViews = customPayoutSavedViews.filter((entry) => entry.id !== viewId);
    setCustomPayoutSavedViews(nextViews);
    writeSavedViewsForType('payout', nextViews);
  };

  const resetTemplateForm = () => {
    setEditingTemplateId('');
    setTemplateForm(createEmptyTemplateForm());
  };

  const resetInvoiceComposer = () => {
    setInvoiceComposer(createEmptyInvoiceComposer());
  };

  const handleInvoiceComposerFieldChange = (field, value) => {
    setInvoiceComposer((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleInvoiceComposerLineItemChange = (index, field, value) => {
    setInvoiceComposer((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addInvoiceComposerLineItem = () => {
    setInvoiceComposer((previous) => ({
      ...previous,
      items: [...previous.items, createEmptyLineItem()]
    }));
  };

  const removeInvoiceComposerLineItem = (index) => {
    setInvoiceComposer((previous) => ({
      ...previous,
      items:
        previous.items.length === 1
          ? previous.items
          : previous.items.filter((_item, itemIndex) => itemIndex !== index)
    }));
  };

  const buildInvoiceComposerPayload = () => {
    const payload = {
      recipientEmail: invoiceComposer.recipientEmail.trim(),
      description: invoiceComposer.description.trim() || undefined,
      issueDate: invoiceComposer.issueDate || undefined,
      dueDate: invoiceComposer.dueDate
        ? new Date(`${invoiceComposer.dueDate}T23:59:59.000Z`).toISOString()
        : undefined
    };

    if (invoiceComposer.templateId) {
      payload.templateId = invoiceComposer.templateId;
    } else {
      payload.currency = invoiceComposer.currency.trim().toUpperCase();
      payload.items = invoiceComposer.items.map((item) => ({
        name: item.name.trim(),
        description: item.description.trim() || undefined,
        quantity: Number(item.quantity),
        unitAmount: Number(item.unitAmount)
      }));
    }

    return payload;
  };

  const handleInvoiceComposerSubmit = async () => {
    const payload = buildInvoiceComposerPayload();

    const confirmed = window.confirm(
      `Create and send a hosted PayPal invoice for ${formatCents(invoiceDraftTotalCents, invoiceDraftCurrency)}? PayPal will create the customer payment link after submission.`
    );
    if (!confirmed) {
      return;
    }

    setBusyAction('create-invoice');
    const result = await createInvoice(payload);
    if (result.success) {
      await Promise.all([fetchInvoices(), fetchPaymentIssues()]);
      setLastCreatedInvoice(result.invoice);
      resetInvoiceComposer();
      handleSectionJump('invoices');
      toast.success('Official PayPal invoice created');
    } else {
      toast.error(result.message || 'Failed to create invoice');
    }
    setBusyAction('');
  };

  const resetPayoutComposer = () => {
    setPayoutComposer(createEmptyPayoutComposer());
  };

  const handlePayoutComposerFieldChange = (field, value) => {
    setPayoutComposer((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleStripeConnectedAccountSelect = (accountId) => {
    setSelectedStripeConnectedAccountId(accountId);
    const account = stripeConnectedAccountsState.accounts.find((entry) => entry.id === accountId);
    if (!account) {
      return;
    }

    setPayoutComposer((previous) => ({
      ...previous,
      receiver: account.stripe_account_id,
      recipientType: 'STRIPE_ACCOUNT',
      receiverCountryCode: account.country_code || previous.receiverCountryCode || 'US'
    }));
  };

  const buildPayoutComposerPayload = () => ({
    provider: providerFilter || undefined,
    receiver: payoutComposer.receiver.trim(),
    recipientType: payoutComposer.recipientType,
    receiverCountryCode: payoutComposer.receiverCountryCode.trim().toUpperCase() || undefined,
    amount: Number(payoutComposer.amount),
    currency: payoutComposer.currency.trim().toUpperCase(),
    note: payoutComposer.note.trim() || undefined
  });

  useEffect(() => {
    if (!showInvoiceComposer || !invoiceComposer.recipientEmail || invoiceDraftTotalCents <= 0) {
      setInvoicePreview(null);
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      const result = await previewInvoice(buildInvoiceComposerPayload());
      if (active) {
        setInvoicePreview(result.success ? result.preview : null);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [invoiceComposer, invoiceDraftTotalCents, previewInvoice, showInvoiceComposer]);

  useEffect(() => {
    if (!showPayoutComposer || !payoutComposer.receiver || parseMoneyToCents(payoutComposer.amount) <= 0) {
      setPayoutServerPreview(null);
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      const result = await previewPayout(buildPayoutComposerPayload());
      if (active) {
        setPayoutServerPreview(result.success ? result.preview : null);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [payoutComposer, previewPayout, showPayoutComposer]);

  const handlePayoutComposerSubmit = async () => {
    setBusyAction('create-payout');
    const result = await createPayout(buildPayoutComposerPayload());

    if (result.success) {
      const refreshedPayouts = await fetchPayouts(payoutQuery);
      await fetchPaymentIssues();
      const matchedPayout =
        refreshedPayouts.find((entry) => entry.payout_id === result.payout?.payout_id) || result.payout;
      setLastCreatedPayout(matchedPayout);
      resetPayoutComposer();
      setSelectedStripeConnectedAccountId('');
      if (isPayPalPayoutWorkspace) {
        handlePayoutSandboxNavigation('activity');
      } else {
        handleSectionJump('payouts');
      }
      toast.success(isStripePayoutWorkspace ? 'Stripe payout requested' : 'Official PayPal payout requested');
    } else {
      toast.error(result.message || 'Failed to create payout');
    }
    setBusyAction('');
  };

  const handleReminderDraftChange = (configurationId, field, value) => {
    setReminderDrafts((previous) => ({
      ...previous,
      [configurationId]: {
        ...previous[configurationId],
        [field]: value
      }
    }));
  };

  const handleReminderConfigurationSave = async (configuration) => {
    const draft = reminderDrafts[configuration.id];
    if (!draft) {
      return;
    }

    setBusyAction(`reminder-save:${configuration.id}`);
    const result = await updateInvoiceReminderConfiguration(configuration.id, {
      type: draft.type,
      interval: {
        unit: draft.unit,
        value: Number(draft.value)
      },
      repetition: Number(draft.repetition),
      notification: {
        send_to_invoicer: Boolean(draft.send_to_invoicer)
      }
    });

    if (result.success) {
      toast.success('Reminder cadence updated');
    } else {
      toast.error(result.message || 'Failed to update reminder cadence');
    }
    setBusyAction('');
  };

  const handleReminderConfigurationToggle = async (configuration) => {
    const action = configuration.status === 'ACTIVE'
      ? suspendInvoiceReminderConfiguration
      : resumeInvoiceReminderConfiguration;
    const successMessage = configuration.status === 'ACTIVE' ? 'Reminder cadence suspended' : 'Reminder cadence resumed';

    setBusyAction(`reminder-toggle:${configuration.id}`);
    const result = await action(configuration.id);
    if (result.success) {
      toast.success(successMessage);
    } else {
      toast.error(result.message || 'Failed to update reminder cadence status');
    }
    setBusyAction('');
  };

  const handleTemplateFieldChange = (field, value) => {
    setTemplateForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleTemplateLineItemChange = (index, field, value) => {
    setTemplateForm((previous) => ({
      ...previous,
      line_items: previous.line_items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addTemplateLineItem = () => {
    setTemplateForm((previous) => ({
      ...previous,
      line_items: [...previous.line_items, createEmptyLineItem()]
    }));
  };

  const removeTemplateLineItem = (index) => {
    setTemplateForm((previous) => ({
      ...previous,
      line_items:
        previous.line_items.length === 1
          ? previous.line_items
          : previous.line_items.filter((_item, itemIndex) => itemIndex !== index)
    }));
  };

  const startTemplateEdit = (template) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name || '',
      description: template.description || '',
      currency_code: template.currency_code || 'USD',
      default_due_days:
        template.default_due_days === null || typeof template.default_due_days === 'undefined'
          ? ''
          : String(template.default_due_days),
      is_active: Boolean(template.is_active),
      line_items: (template.line_items || []).length
        ? template.line_items.map((item) => ({
            name: item.name || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unitAmount: item.unitAmount || ''
          }))
        : [createEmptyLineItem()]
    });
  };

  const handleTemplateSubmit = async () => {
    const normalizedItems = templateForm.line_items.map((item) => ({
      name: item.name.trim(),
      description: item.description.trim() || undefined,
      quantity: Number(item.quantity),
      unitAmount: Number(item.unitAmount)
    }));

    const payload = {
      name: templateForm.name.trim(),
      description: templateForm.description.trim() || undefined,
      currency_code: templateForm.currency_code.trim().toUpperCase(),
      default_due_days: templateForm.default_due_days === '' ? undefined : Number(templateForm.default_due_days),
      is_active: Boolean(templateForm.is_active),
      line_items: normalizedItems
    };

    const result = editingTemplateId
      ? await updateInvoiceTemplate(editingTemplateId, payload)
      : await createInvoiceTemplate(payload);

    if (result.success) {
      toast.success(editingTemplateId ? 'Template updated' : 'Template created');
      resetTemplateForm();
    } else {
      toast.error(result.message || 'Failed to save template');
    }
  };

  const handleTemplateDelete = async (template) => {
    const confirmed = window.confirm(`Delete invoice template "${template.name}"?`);
    if (!confirmed) {
      return;
    }

    const result = await deleteInvoiceTemplate(template.id);
    if (result.success) {
      toast.success('Template deleted');
      if (editingTemplateId === template.id) {
        resetTemplateForm();
      }
    } else {
      toast.error(result.message || 'Failed to delete template');
    }
  };

  const handleTemplateToggleActive = async (template) => {
    const result = await updateInvoiceTemplate(template.id, {
      is_active: !template.is_active
    });

    if (result.success) {
      toast.success(template.is_active ? 'Template archived' : 'Template activated');
    } else {
      toast.error(result.message || 'Failed to update template status');
    }
  };

  const handleInvoiceAction = async (action, invoice, runner, successMessage) => {
    setBusyAction(`${action}:${invoice.internal_invoice_id}`);
    const result = await runner(invoice.internal_invoice_id);
    if (result.success) {
      await fetchPaymentIssues();
      toast.success(successMessage);
    } else {
      toast.error(result.message || 'Action failed');
    }
    setBusyAction('');
  };

  const handleInvoiceReminderCancellation = async (invoice) => {
    const confirmed = window.confirm(
      `Stop automatic PayPal reminders for invoice ${invoice.summary.invoice_number || invoice.invoice_id}?`
    );

    if (!confirmed) {
      return;
    }

    setBusyAction(`cancel-reminders:${invoice.internal_invoice_id}`);
    const result = await cancelInvoiceAutoReminders(invoice.internal_invoice_id);
    if (result.success) {
      toast.success('Invoice auto reminders cancelled in PayPal');
    } else {
      toast.error(result.message || 'Failed to cancel invoice auto reminders');
    }
    setBusyAction('');
  };

  const handlePayoutRefresh = async (payout) => {
    setBusyAction(`refresh:${payout.payout_id}`);
    const result = await refreshPayout(payout.payout_id);
    if (result.success) {
      await fetchPaymentIssues();
      toast.success('Payout refreshed');
    } else {
      toast.error(result.message || 'Failed to refresh payout');
    }
    setBusyAction('');
  };

  const handleCancelUnclaimedPayout = async (payout) => {
    const confirmed = window.confirm(
      `Cancel the unclaimed PayPal payout item for payout ${payout.payout_id}? Returned funds will move back to available balance once PayPal confirms the cancellation.`
    );

    if (!confirmed) {
      return;
    }

    setBusyAction(`cancel-unclaimed:${payout.payout_id}`);
    const result = await cancelUnclaimedPayout(payout.payout_id);
    if (result.success) {
      await fetchPaymentIssues();
      toast.success('Unclaimed payout cancellation submitted to PayPal');
    } else {
      toast.error(result.message || 'Failed to cancel unclaimed payout');
    }
    setBusyAction('');
  };

  const handleApprovePayout = async (payout) => {
    setBusyAction(`approve:${payout.payout_id}`);
    const result = await approvePayout(payout.payout_id);
    if (result.success) {
      await Promise.all([fetchPayouts(payoutQuery), fetchPaymentIssues()]);
      toast.success('Payout approved');
    } else {
      toast.error(result.message || 'Failed to approve payout');
    }
    setBusyAction('');
  };

  const handleRejectPayout = async (payout, reason) => {
    const confirmed = window.confirm(`Reject payout ${payout.payout_id}?`);
    if (!confirmed) {
      return;
    }

    setBusyAction(`reject:${payout.payout_id}`);
    const result = await rejectPayout(payout.payout_id, reason);
    if (result.success) {
      await Promise.all([fetchPayouts(payoutQuery), fetchPaymentIssues()]);
      toast.success('Payout rejected');
    } else {
      toast.error(result.message || 'Failed to reject payout');
    }
    setBusyAction('');
  };

  const handleReleaseInvoiceFunds = async (invoice, amount, reason) => {
    const confirmed = window.confirm(`Release funds for invoice ${invoice.summary?.invoice_number || invoice.invoice_id}?`);
    if (!confirmed) {
      return;
    }

    setBusyAction(`release:${invoice.internal_invoice_id}`);
    const result = await releaseInvoiceFunds(invoice.internal_invoice_id, {
      amount: amount ? Number(amount) : undefined,
      reason: reason || undefined
    });
    if (result.success) {
      await Promise.all([fetchInvoices(), fetchPaymentIssues()]);
      toast.success('Invoice funds released');
    } else {
      toast.error(result.message || 'Failed to release invoice funds');
    }
    setBusyAction('');
  };

  const handleMarkInvoiceReviewRequired = async (invoice) => {
    const confirmed = window.confirm(`Mark invoice ${invoice.summary?.invoice_number || invoice.invoice_id} for settlement review?`);
    if (!confirmed) {
      return;
    }

    setBusyAction(`review:${invoice.internal_invoice_id}`);
    const result = await markInvoiceReviewRequired(invoice.internal_invoice_id, {
      reason: 'Operator requested provider settlement review from admin workspace'
    });
    if (result.success) {
      await Promise.all([fetchInvoices(), fetchPaymentIssues()]);
      toast.success('Invoice marked for provider review');
    } else {
      toast.error(result.message || 'Failed to mark invoice for review');
    }
    setBusyAction('');
  };

  const handleAddRecordNote = async (record, type, note, onSaved) => {
    setBusyAction(`note:${type}:${type === 'invoice' ? record.internal_invoice_id : record.payout_id}`);
    const result =
      type === 'invoice'
        ? await addInvoiceNote(record.internal_invoice_id, note)
        : await addPayoutNote(record.payout_id, note);
    if (result.success) {
      onSaved();
      if (type === 'invoice') {
        setInvoiceTimelineId(record.internal_invoice_id);
        setInvoiceTimelineLoading(true);
        setInvoiceTimelineEntries(await fetchInvoiceTimeline(record.internal_invoice_id, 15));
        setInvoiceTimelineLoading(false);
      } else {
        setPayoutTimelineId(record.payout_id);
        setPayoutTimelineLoading(true);
        setPayoutTimelineEntries(await fetchPayoutTimeline(record.payout_id, 15));
        setPayoutTimelineLoading(false);
      }
      toast.success('Operator note saved');
    } else {
      toast.error(result.message || 'Failed to save note');
    }
    setBusyAction('');
  };

  const handleTopUpOrderComplete = async (order) => {
    const confirmed = window.confirm(
      `Approve funding order ${order.order_id} and credit ${Number(order.points || 0).toLocaleString()} points?`
    );

    if (!confirmed) {
      return;
    }

    setBusyAction(`topup-complete:${order.order_id}`);
    const result = await completeTopUpOrder(order.order_id);
    if (result.success) {
      toast.success('Funding order completed and points credited');
    } else {
      toast.error(result.message || 'Failed to complete funding order');
    }
    setBusyAction('');
  };

  const handleTopUpOrderCancel = async (order) => {
    const confirmed = window.confirm(`Cancel funding order ${order.order_id}?`);

    if (!confirmed) {
      return;
    }

    setBusyAction(`topup-cancel:${order.order_id}`);
    const result = await cancelTopUpOrder(order.order_id);
    if (result.success) {
      toast.success('Funding order cancelled');
    } else {
      toast.error(result.message || 'Failed to cancel funding order');
    }
    setBusyAction('');
  };

  const handleInvoiceCancel = async (invoice) => {
    const confirmed = window.confirm(
      `Cancel PayPal invoice ${invoice.summary.invoice_number || invoice.invoice_id}? This cannot be undone from this panel.`
    );

    if (!confirmed) {
      return;
    }

    setBusyAction(`cancel:${invoice.internal_invoice_id}`);
    const result = await cancelInvoice(invoice.internal_invoice_id);
    if (result.success) {
      await fetchPaymentIssues();
      toast.success('Invoice cancelled in PayPal');
    } else {
      toast.error(result.message || 'Failed to cancel invoice');
    }
    setBusyAction('');
  };

  const handleIssueAction = async (issue, action) => {
    const key = `issue:${action}:${issue.payment_issue_id}`;
    setBusyAction(key);
    const note = issueNotes[issue.payment_issue_id] || '';
    const runner =
      action === 'acknowledge'
        ? acknowledgePaymentIssue
        : action === 'resolve'
          ? resolvePaymentIssue
          : reopenPaymentIssue;
    const result = await runner(issue.payment_issue_id, note);
    if (result.success) {
      toast.success(
        action === 'acknowledge'
          ? 'Issue acknowledged.'
          : action === 'resolve'
            ? 'Issue resolved.'
            : 'Issue reopened.'
      );
      setIssueNotes((previous) => ({ ...previous, [issue.payment_issue_id]: '' }));
    } else {
      toast.error(result.message || 'Failed to update issue');
    }
    setBusyAction('');
  };

  const toggleInvoiceTimeline = async (invoice) => {
    if (invoiceTimelineId === invoice.internal_invoice_id) {
      setInvoiceTimelineId('');
      setInvoiceTimelineEntries([]);
      return;
    }

    setInvoiceTimelineId(invoice.internal_invoice_id);
    setInvoiceTimelineLoading(true);
    const entries = await fetchInvoiceTimeline(invoice.internal_invoice_id, 15);
    setInvoiceTimelineEntries(entries);
    setInvoiceTimelineLoading(false);
  };

  const togglePayoutTimeline = async (payout) => {
    if (payoutTimelineId === payout.payout_id) {
      setPayoutTimelineId('');
      setPayoutTimelineEntries([]);
      return;
    }

    setPayoutTimelineId(payout.payout_id);
    setPayoutTimelineLoading(true);
    const entries = await fetchPayoutTimeline(payout.payout_id, 15);
    setPayoutTimelineEntries(entries);
    setPayoutTimelineLoading(false);
  };

  const payoutSandboxChrome = (
    <PayPalSandboxPayoutChrome
      adminTopUpOrders={adminTopUpOrders}
      busyAction={busyAction}
      filteredPayouts={filteredPayouts}
      onNavigate={handlePayoutSandboxNavigation}
      onOpenPayoutDetail={(payout) => setDetailDrawer({ type: 'payout', id: payout.payout_id })}
      onPayoutComposerFieldChange={handlePayoutComposerFieldChange}
      onPayoutComposerSubmit={handlePayoutComposerSubmit}
      onRefreshAll={handleRefreshAll}
      onResetPayoutComposer={resetPayoutComposer}
      paymentIssues={paymentIssues}
      payoutComposer={payoutComposer}
      payoutImpactPreview={payoutImpactPreview}
      payoutSandboxStatus={payoutSandboxStatus}
      payoutSandboxView={payoutSandboxView}
      payoutSandboxWallet={payoutSandboxWallet}
      walletCurrency={walletCurrency}
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isPayPalEmbeddedWorkspace ? (
        <div
          className={
            isPayPalPayoutWorkspace
              ? 'overflow-hidden bg-white'
              : 'overflow-hidden rounded-[28px] border bg-white shadow-[0_24px_60px_rgba(0,48,135,0.08)]'
          }
          style={{
            borderColor: isPayPalPayoutWorkspace ? undefined : PAYPAL_BRAND.border,
            background: isPayPalPayoutWorkspace ? '#ffffff' : `linear-gradient(135deg, ${PAYPAL_BRAND.mist} 0%, #ffffff 58%, rgba(0,156,222,0.08) 100%)`
          }}
        >
          {isPayPalPayoutWorkspace ? (
            <>
            {payoutSandboxChrome}
            </>
          ) : (
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <img
                  src={PAYPAL_BRAND.logoUrl}
                  alt="PayPal"
                  className="h-10 w-auto"
                />
                <h2 className="mt-5 text-3xl font-black tracking-[-0.05em]" style={{ color: PAYPAL_BRAND.ink }}>
                  PayPal Invoicing
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Create, send, and manage official PayPal invoices with hosted links, reminder controls, QR generation, and template-backed workflows in one operational surface.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Hosted invoice links', 'Template backed', 'Reminder aware', 'QR ready'].map((chip) => (
                    <div
                      key={chip}
                      className="inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]"
                      style={{
                        borderColor: PAYPAL_BRAND.border,
                        backgroundColor: '#ffffff',
                        color: PAYPAL_BRAND.blue
                      }}
                    >
                      {chip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                <div className="rounded-[22px] border bg-white p-4 shadow-sm" style={{ borderColor: PAYPAL_BRAND.border }}>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Invoice Surface
                  </p>
                  <p className="mt-3 text-lg font-black tracking-[-0.03em]" style={{ color: PAYPAL_BRAND.ink }}>
                    Hosted links + records
                  </p>
                </div>
                <div className="rounded-[22px] border bg-white p-4 shadow-sm" style={{ borderColor: PAYPAL_BRAND.border }}>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Operational Model
                  </p>
                  <p className="mt-3 text-lg font-black tracking-[-0.03em]" style={{ color: PAYPAL_BRAND.ink }}>
                    Send, sync, remind, reconcile
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {renderSummaryCards ? (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${embedded ? 'xl:grid-cols-2' : 'xl:grid-cols-4'}`}>
        {visibleSummary.map(({ icon: Icon, label, value, tone }) => (
          <div
            key={label}
            className="rounded-2xl border bg-white p-6 shadow-sm"
            style={
              isPayPalEmbeddedWorkspace
                ? { borderColor: PAYPAL_BRAND.border, boxShadow: '0 16px 40px rgba(0,48,135,0.06)' }
                : undefined
            }
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: isPayPalEmbeddedWorkspace ? `${PAYPAL_BRAND.blue}10` : `${tone}20`
              }}
            >
              <Icon size={22} style={{ color: isPayPalEmbeddedWorkspace ? PAYPAL_BRAND.blue : tone }} />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">{label}</p>
            <p
              className="mt-1 text-3xl font-bold"
              style={{ color: isPayPalEmbeddedWorkspace ? PAYPAL_BRAND.ink : undefined }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
      ) : null}

      {renderWorkspaceControls ? (
      <div
        className="rounded-2xl border bg-white p-6 shadow-sm"
        style={isPayPalEmbeddedWorkspace ? { borderColor: PAYPAL_BRAND.border } : undefined}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3
              className="text-xl font-bold"
              style={{ color: isPayPalEmbeddedWorkspace ? PAYPAL_BRAND.ink : undefined }}
            >
              {workspaceTitle}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{workspaceDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                Promise.all([
                  fetchInvoices(),
                  fetchPayouts(payoutQuery),
                  fetchAdminTopUpOrders(),
                  fetchInvoiceReminderConfigurations(),
                  fetchInvoiceTemplates(),
                  fetchPaymentIssues()
                ]).then(() => toast.success('Payments refreshed'))
              }
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh Lists
            </button>
            <button
              onClick={handleRefreshAll}
              disabled={busyAction === 'reconciliation'}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: isPayPalEmbeddedWorkspace ? PAYPAL_BRAND.blue : brand }}
            >
              <RotateCcw size={16} className={busyAction === 'reconciliation' ? 'animate-spin' : ''} />
              Run Reconciliation
            </button>
          </div>
        </div>

        <div
          className="mt-5 rounded-2xl border p-4"
          style={{
            borderColor: PAYPAL_BRAND.border,
            background: isPayPalEmbeddedWorkspace
              ? `linear-gradient(135deg, rgba(0,48,135,0.10), rgba(255,255,255,1))`
              : 'linear-gradient(135deg,rgba(0,48,135,0.08),rgba(255,255,255,1))'
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: PAYPAL_BRAND.blue }}>
                Official {providerFilter === 'stripe' ? 'Stripe' : providerFilter === 'crypto' ? 'Crypto' : 'PayPal'} Workflow
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {isStripePayoutWorkspace
                  ? 'Select a connected account, preview transfer readiness, request approval, and process Stripe payouts from this operational surface.'
                  : isPayPalPayoutWorkspace
                    ? 'Request, review, refresh, and remediate payouts from the same PayPal-branded operational surface.'
                  : isPayPalInvoiceWorkspace
                    ? 'Create, send, remind, sync, and manage official invoices from the same PayPal-branded operational surface.'
                  : 'Deep-link into the exact operational surface you need instead of scanning the entire admin panel.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {sectionLinks.map(({ id, label, icon: Icon }) => {
                const selected = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSectionJump(id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                      selected
                        ? 'text-white'
                        : 'bg-white text-slate-700'
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: PAYPAL_BRAND.blue,
                            backgroundColor: PAYPAL_BRAND.blue
                          }
                        : {
                            borderColor: PAYPAL_BRAND.border,
                            color: isPayPalEmbeddedWorkspace ? PAYPAL_BRAND.ink : undefined
                          }
                    }
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {showInvoiceComposer ? (
        <div ref={registerSectionRef('payout-composer')} className="grid scroll-mt-28 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className="rounded-2xl border bg-white p-6 shadow-sm"
            style={isPayPalInvoiceWorkspace ? { borderColor: PAYPAL_BRAND.border, boxShadow: '0 20px 44px rgba(0,48,135,0.06)' } : undefined}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-bold" style={{ color: isPayPalInvoiceWorkspace ? PAYPAL_BRAND.ink : undefined }}>
                  Quick Create Official Invoice
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create and send a real PayPal invoice from this workspace using a saved template or manual line items.
                </p>
              </div>
              <button
                onClick={resetInvoiceComposer}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Recipient Email</label>
                <input
                  type="email"
                  value={invoiceComposer.recipientEmail}
                  onChange={(event) => handleInvoiceComposerFieldChange('recipientEmail', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  placeholder="buyer@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Template</label>
                <select
                  value={invoiceComposer.templateId}
                  onChange={(event) => handleInvoiceComposerFieldChange('templateId', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                >
                  <option value="">No template</option>
                  {invoiceTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · {template.currency_code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Issue Date</label>
                <input
                  type="date"
                  value={invoiceComposer.issueDate}
                  onChange={(event) => handleInvoiceComposerFieldChange('issueDate', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={invoiceComposer.dueDate}
                  onChange={(event) => handleInvoiceComposerFieldChange('dueDate', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={invoiceComposer.description}
                onChange={(event) => handleInvoiceComposerFieldChange('description', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                placeholder="Optional note that appears on the official invoice."
              />
            </div>

            {selectedInvoiceTemplate ? (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedInvoiceTemplate.name}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {selectedInvoiceTemplate.description || 'Template-backed PayPal invoice'}
                    </p>
                  </div>
                  <StatusPill
                    value={selectedInvoiceTemplate.is_active ? 'ACTIVE' : 'INACTIVE'}
                    tone={selectedInvoiceTemplate.is_active ? 'green' : 'gray'}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  {selectedInvoiceTemplate.line_items?.length || 0} line items · {selectedInvoiceTemplate.currency_code} · Due in {selectedInvoiceTemplate.default_due_days ?? 'manual'} days
                </div>
                <div className="mt-3 divide-y divide-blue-100 rounded-lg bg-white">
                  {(selectedInvoiceTemplate.line_items || []).map((item, index) => (
                    <div key={`${selectedInvoiceTemplate.id}-preview-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                      <span className="font-semibold text-gray-700">{item.name || `Line item ${index + 1}`}</span>
                      <span className="text-gray-600">
                        {Number(item.quantity || 0)} x {formatCents(parseMoneyToCents(item.unitAmount), selectedInvoiceTemplate.currency_code)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-black text-gray-950">
                    <span>Template total</span>
                    <span>{formatCents(invoiceDraftTotalCents, invoiceDraftCurrency)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Manual Line Items</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Use this when you do not want to rely on a stored template.
                    </p>
                  </div>
                  <button
                    onClick={addInvoiceComposerLineItem}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                  >
                    <Plus size={14} />
                    Item
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                    <input
                      value={invoiceComposer.currency}
                      onChange={(event) => handleInvoiceComposerFieldChange('currency', event.target.value)}
                      maxLength={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-orange-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {invoiceComposer.items.map((item, index) => (
                    <div key={`invoice-composer-line-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(event) => handleInvoiceComposerLineItemChange(index, 'name', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Unit amount"
                          value={item.unitAmount}
                          onChange={(event) => handleInvoiceComposerLineItemChange(index, 'unitAmount', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(event) => handleInvoiceComposerLineItemChange(index, 'quantity', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                        <input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(event) => handleInvoiceComposerLineItemChange(index, 'description', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <div className="mr-auto text-xs font-semibold text-gray-500">
                          Subtotal: {formatCents(calculateLineItemSubtotalCents(item), invoiceDraftCurrency)}
                        </div>
                        <button
                          onClick={() => removeInvoiceComposerLineItem(index)}
                          disabled={invoiceComposer.items.length === 1}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleInvoiceComposerSubmit}
                disabled={busyAction === 'create-invoice'}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: isPayPalInvoiceWorkspace ? PAYPAL_BRAND.blue : brand }}
              >
                <Send size={16} className={busyAction === 'create-invoice' ? 'animate-pulse' : ''} />
                Create Official Invoice
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-2xl border bg-white p-5 shadow-sm"
              style={isPayPalInvoiceWorkspace ? { borderColor: PAYPAL_BRAND.border } : undefined}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Draft Preview</p>
              <div className="mt-4 space-y-3">
                <DetailRow label="Recipient" value={invoiceComposer.recipientEmail || 'Add recipient email'} />
                <DetailRow
                  label="Template"
                  value={selectedInvoiceTemplate ? selectedInvoiceTemplate.name : 'Manual line items'}
                />
                <DetailRow label="Line Items" value={`${invoiceDraftItems.length} item${invoiceDraftItems.length === 1 ? '' : 's'}`} />
                <DetailRow
                  label="Draft Total"
                  value={
                    invoicePreview
                      ? `${invoicePreview.total} ${invoicePreview.currency}`
                      : formatCents(invoiceDraftTotalCents, invoiceDraftCurrency)
                  }
                />
                <DetailRow label="Risk Path" value={invoicePreview?.risk_decision || 'Preview pending'} />
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
                  PayPal will create the hosted invoice link after you confirm submission.
                </div>
              </div>
            </div>

            {lastCreatedInvoice ? (
              <div
                className="rounded-2xl border p-5 shadow-sm"
                style={{
                  borderColor: PAYPAL_BRAND.border,
                  background: isPayPalInvoiceWorkspace
                    ? 'linear-gradient(180deg, rgba(0,156,222,0.08), rgba(255,255,255,1))'
                    : undefined
                }}
              >
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: isPayPalInvoiceWorkspace ? PAYPAL_BRAND.blue : undefined }}>
                  Last Created
                </p>
                <p className="mt-3 text-lg font-black tracking-[-0.03em]" style={{ color: isPayPalInvoiceWorkspace ? PAYPAL_BRAND.ink : undefined }}>
                  {lastCreatedInvoice.summary?.invoice_number || lastCreatedInvoice.invoice_id}
                </p>
                <div className="mt-2 text-sm text-slate-600">
                  {lastCreatedInvoice.summary?.recipient_email}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {lastCreatedInvoice.summary?.amount} {lastCreatedInvoice.summary?.currency}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lastCreatedInvoice.invoice_link ? (
                    <a
                      href={lastCreatedInvoice.invoice_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <ExternalLink size={14} />
                      Open PayPal
                    </a>
                  ) : null}
                  <button
                    onClick={() => handleSectionJump('invoices')}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
                  >
                    <QrCode size={14} />
                    View In Records
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {renderPayoutComposer ? (
        <PayoutComposerSection
          busyAction={busyAction}
          isStripePayoutWorkspace={isStripePayoutWorkspace}
          lastCreatedPayout={lastCreatedPayout}
          onPayoutComposerFieldChange={handlePayoutComposerFieldChange}
          onPayoutComposerSubmit={handlePayoutComposerSubmit}
          onResetPayoutComposer={resetPayoutComposer}
          onStripeConnectedAccountSelect={handleStripeConnectedAccountSelect}
          payoutComposer={payoutComposer}
          payoutImpactPreview={payoutImpactPreview}
          payoutSandboxWallet={payoutSandboxWallet}
          selectedStripeConnectedAccountId={selectedStripeConnectedAccountId}
          stripeConnectedAccountsState={stripeConnectedAccountsState}
          walletCurrency={walletCurrency}
        />
      ) : null}

      {renderFundingOrders ? (
        <div ref={registerSectionRef('funding-orders')} className="scroll-mt-28 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Funding Orders</h3>
            <p className="text-sm text-gray-500">
              Review user point purchases before ledger credit is released.
            </p>
          </div>
          <p className="text-sm text-gray-500">{adminTopUpOrders.length} tracked orders</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {['Order', 'User', 'Funding Method', 'Points', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminTopUpOrders.map((order) => {
                  const closed = ['completed', 'cancelled'].includes(order.status);

                  return (
                    <tr key={order.order_id} className="border-b border-gray-100 align-top hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{order.order_id}</div>
                        <div className="mt-1 text-xs text-gray-500">Created: {formatDateTime(order.created_at)}</div>
                        {order.submitted_at && (
                          <div className="mt-1 text-xs text-amber-700">
                            Submitted: {formatDateTime(order.submitted_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.user_id || order.userId}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{order.method_title || 'Manual funding'}</div>
                        <div className="mt-1 text-xs text-gray-500">{order.service_intent || 'General balance'}</div>
                        {order.vendor_url && (
                          <a
                            href={order.vendor_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                          >
                            <ExternalLink size={13} />
                            Open funding link
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {Number(order.points || 0).toLocaleString()} pts
                        <div className="mt-1 text-xs font-normal text-gray-500">{order.amount_label}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill value={(order.status || 'pending').replaceAll('_', ' ')} tone={getTopUpOrderTone(order.status)} />
                        {order.admin_notes && (
                          <div className="mt-2 text-xs text-gray-500">{order.admin_notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleTopUpOrderComplete(order)}
                            disabled={closed || Boolean(busyAction)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Complete
                          </button>
                          <button
                            onClick={() => handleTopUpOrderCancel(order)}
                            disabled={closed || Boolean(busyAction)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <ShieldX size={14} />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {adminTopUpOrders.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">No funding orders yet.</div>
          )}
        </div>
        </div>
      ) : null}

      {showReminderCadence ? (
        <div ref={registerSectionRef('reminder-cadence')} className="scroll-mt-28 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Reminder Cadence</h3>
          <p className="text-sm text-gray-500">
            {invoiceReminderConfigurations.length} official PayPal auto reminder configurations
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {invoiceReminderConfigurations.map((configuration) => {
            const draft = reminderDrafts[configuration.id] || {
              type: configuration.type,
              unit: configuration.interval?.unit || 'DAY',
              value: String(configuration.interval?.value || 1),
              repetition: String(configuration.repetition || 1),
              send_to_invoicer: Boolean(configuration.notification?.send_to_invoicer)
            };

            return (
              <div key={configuration.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{configuration.type.replace('_', ' ')}</h4>
                    <p className="mt-1 text-xs text-gray-500">{configuration.id}</p>
                  </div>
                  <StatusPill
                    value={configuration.status || 'UNKNOWN'}
                    tone={configuration.status === 'ACTIVE' ? 'green' : 'amber'}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Interval Unit</label>
                    <select
                      value={draft.unit}
                      onChange={(event) => handleReminderDraftChange(configuration.id, 'unit', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    >
                      <option value="DAY">DAY</option>
                      <option value="WEEK">WEEK</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Interval Value</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={draft.value}
                      onChange={(event) => handleReminderDraftChange(configuration.id, 'value', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Repetition</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={draft.repetition}
                      onChange={(event) =>
                        handleReminderDraftChange(configuration.id, 'repetition', event.target.value)
                      }
                      disabled={draft.type === 'BEFORE_DUE'}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-100"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 md:pt-7">
                    <input
                      type="checkbox"
                      checked={draft.send_to_invoicer}
                      onChange={(event) =>
                        handleReminderDraftChange(configuration.id, 'send_to_invoicer', event.target.checked)
                      }
                    />
                    Send copy to invoicer
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Created: {formatDateTime(configuration.metadata?.created_time)}</span>
                  <span>Updated: {formatDateTime(configuration.metadata?.updated_time)}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleReminderConfigurationSave(configuration)}
                    disabled={Boolean(busyAction)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Send size={14} />
                    Save Cadence
                  </button>
                  <button
                    onClick={() => handleReminderConfigurationToggle(configuration)}
                    disabled={Boolean(busyAction)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RotateCcw
                      size={14}
                      className={busyAction === `reminder-toggle:${configuration.id}` ? 'animate-spin' : ''}
                    />
                    {configuration.status === 'ACTIVE' ? 'Suspend' : 'Resume'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {invoiceReminderConfigurations.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
            No official PayPal reminder configurations available.
          </div>
        )}
        </div>
      ) : null}

      {renderPaymentIssues ? (
        <div ref={registerSectionRef('payment-issues')} className="scroll-mt-28 space-y-4">
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-bold text-gray-900"
            style={isPayPalEmbeddedWorkspace ? { color: PAYPAL_BRAND.ink } : undefined}
          >
            Payment Issues
          </h3>
          <p className="text-sm text-gray-500">{paymentIssues.length} tracked operational issues</p>
        </div>

        <div
          className="rounded-2xl border bg-white p-6 shadow-sm"
          style={isPayPalEmbeddedWorkspace ? { borderColor: PAYPAL_BRAND.border, boxShadow: '0 16px 40px rgba(0,48,135,0.06)' } : undefined}
        >
          {paymentIssues.length === 0 ? (
            <div className="text-sm text-gray-500">No open issues from reconciliation or provider sync.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {paymentIssues.map((issue) => (
                <div
                  key={issue.payment_issue_id}
                  className="rounded-xl border p-4"
                  style={
                    isPayPalEmbeddedWorkspace
                      ? {
                          borderColor: PAYPAL_BRAND.border,
                          background: 'linear-gradient(180deg, rgba(244,248,255,0.9), rgba(255,255,255,1))'
                        }
                      : undefined
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p
                        className="text-sm font-semibold text-gray-900"
                        style={isPayPalEmbeddedWorkspace ? { color: PAYPAL_BRAND.ink } : undefined}
                      >
                        {issue.summary}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {issue.entity_type} · {issue.entity_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill value={issue.severity} tone={issue.severity === 'HIGH' ? 'red' : 'amber'} />
                      <StatusPill value={issue.status} tone={issue.status === 'OPEN' ? 'red' : 'green'} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Type: {issue.issue_type}</span>
                    <span>Last Seen: {formatDateTime(issue.last_seen_at)}</span>
                  </div>
                  {(issue.acknowledgement?.acknowledged_at || issue.resolution?.resolved_at) && (
                    <div className="mt-3 space-y-1 text-xs text-gray-500">
                      {issue.acknowledgement?.acknowledged_at && (
                        <div>
                          Acknowledged: {formatDateTime(issue.acknowledgement.acknowledged_at)}
                          {issue.acknowledgement.acknowledged_by_actor_id
                            ? ` · ${issue.acknowledgement.acknowledged_by_actor_id}`
                            : ''}
                        </div>
                      )}
                      {issue.resolution?.resolved_at && (
                        <div>
                          Resolved: {formatDateTime(issue.resolution.resolved_at)}
                          {issue.resolution.resolved_by_actor_id ? ` · ${issue.resolution.resolved_by_actor_id}` : ''}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Operator Note
                    </label>
                    <textarea
                      value={issueNotes[issue.payment_issue_id] || ''}
                      onChange={(event) =>
                        setIssueNotes((previous) => ({
                          ...previous,
                          [issue.payment_issue_id]: event.target.value
                        }))
                      }
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      placeholder="Add an acknowledgement or resolution note"
                    />
                  </div>
                  {issue.metadata && Object.keys(issue.metadata).length > 0 && (
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
                      {JSON.stringify(issue.metadata, null, 2)}
                    </pre>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {issue.status !== 'ACKNOWLEDGED' && issue.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleIssueAction(issue, 'acknowledge')}
                        disabled={Boolean(busyAction)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <MessageSquare size={14} />
                        Acknowledge
                      </button>
                    )}
                    {issue.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleIssueAction(issue, 'resolve')}
                        disabled={Boolean(busyAction)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Resolve
                      </button>
                    )}
                    {issue.status === 'RESOLVED' && (
                      <button
                        onClick={() => handleIssueAction(issue, 'reopen')}
                        disabled={Boolean(busyAction)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      ) : null}

      {showInvoiceTemplates ? (
        <div ref={registerSectionRef('invoice-templates')} className="scroll-mt-28 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Invoice Templates</h3>
          <p className="text-sm text-gray-500">{invoiceTemplates.length} stored admin templates</p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  {editingTemplateId ? 'Edit Template' : 'Create Template'}
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Save reusable invoice structures for official PayPal invoice generation.
                </p>
              </div>
              {editingTemplateId && (
                <button
                  onClick={resetTemplateForm}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Template Name</label>
                <input
                  value={templateForm.name}
                  onChange={(event) => handleTemplateFieldChange('name', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(event) => handleTemplateFieldChange('description', event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                  <input
                    value={templateForm.currency_code}
                    onChange={(event) => handleTemplateFieldChange('currency_code', event.target.value)}
                    maxLength={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-orange-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Default Due Days</label>
                  <input
                    type="number"
                    min="0"
                    value={templateForm.default_due_days}
                    onChange={(event) => handleTemplateFieldChange('default_due_days', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={templateForm.is_active}
                  onChange={(event) => handleTemplateFieldChange('is_active', event.target.checked)}
                />
                Template is active
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Line Items</label>
                  <button
                    onClick={addTemplateLineItem}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                    Item
                  </button>
                </div>
                <div className="space-y-3">
                  {templateForm.line_items.map((item, index) => (
                    <div key={`template-line-item-${index}`} className="rounded-lg border border-gray-200 p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(event) => handleTemplateLineItemChange(index, 'name', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Unit amount"
                          value={item.unitAmount}
                          onChange={(event) => handleTemplateLineItemChange(index, 'unitAmount', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(event) => handleTemplateLineItemChange(index, 'quantity', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                        <input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(event) => handleTemplateLineItemChange(index, 'description', event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => removeTemplateLineItem(index)}
                          disabled={templateForm.line_items.length === 1}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTemplateSubmit}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: brand }}
              >
                {editingTemplateId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Template', 'Currency', 'Due Days', 'Items', 'Status', 'Actions'].map((heading) => (
                      <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceTemplates.map((template) => (
                    <tr key={template.id} className="border-b border-gray-100 align-top hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{template.name}</div>
                        <div className="mt-1 text-xs text-gray-500">{template.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{template.currency_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {template.default_due_days ?? 'Manual'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{template.line_items?.length || 0}</td>
                      <td className="px-6 py-4">
                        <StatusPill value={template.is_active ? 'ACTIVE' : 'INACTIVE'} tone={template.is_active ? 'green' : 'gray'} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startTemplateEdit(template)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleTemplateToggleActive(template)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {template.is_active ? 'Archive' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleTemplateDelete(template)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invoiceTemplates.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">No invoice templates yet.</div>
            )}
          </div>
        </div>
        </div>
      ) : null}

      {showInvoices ? (
        <div ref={registerSectionRef('invoices')} className="scroll-mt-28 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3
              className="text-lg font-bold text-gray-900"
              style={isPayPalInvoiceWorkspace ? { color: PAYPAL_BRAND.ink } : undefined}
            >
              Invoices
            </h3>
            <p className="text-sm text-gray-500">
              {filteredInvoices.length} shown
              {invoicePagination?.total ? ` of ${invoicePagination.total}` : ` of ${invoices.length}`} official invoice records
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <input
              value={invoiceSearch}
              onChange={(event) => setInvoiceSearch(event.target.value)}
              placeholder="Recipient or number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
            <input
              value={invoiceProviderSearch}
              onChange={(event) => setInvoiceProviderSearch(event.target.value)}
              placeholder="PayPal invoice ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
            <select
              value={invoiceStatusFilter}
              onChange={(event) => setInvoiceStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            >
              {invoiceStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : status}
                </option>
              ))}
            </select>
            <select
              value={invoiceTemplateFilter}
              onChange={(event) => setInvoiceTemplateFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              aria-label="Invoice template"
            >
              <option value="ALL">All templates</option>
              {invoiceTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={invoiceDateFrom}
              onChange={(event) => setInvoiceDateFrom(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              aria-label="Invoice date from"
            />
            <input
              type="date"
              value={invoiceDateTo}
              onChange={(event) => setInvoiceDateTo(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              aria-label="Invoice date to"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={invoiceSortBy}
                onChange={(event) => setInvoiceSortBy(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                aria-label="Invoice sort field"
              >
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
                <option value="amount">Amount</option>
                <option value="recipient">Recipient</option>
                <option value="status">Status</option>
                <option value="dueDate">Due</option>
              </select>
              <select
                value={invoiceSortDirection}
                onChange={(event) => setInvoiceSortDirection(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                aria-label="Invoice sort direction"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            <select
              value={invoicePageSize}
              onChange={(event) => setInvoicePageSize(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              aria-label="Invoice page size"
            >
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
              <option value="250">250 rows</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BUILT_IN_INVOICE_SAVED_VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => applyInvoiceSavedView(view.id)}
              className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              {view.label}
            </button>
          ))}
          {customInvoiceSavedViews.map((view) => (
            <span key={view.id} className="inline-flex overflow-hidden rounded-full border border-blue-200 bg-blue-50">
              <button
                type="button"
                onClick={() => applyInvoiceSavedView(view.id)}
                className="px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100"
              >
                {view.label}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInvoiceSavedView(view.id)}
                className="border-l border-blue-200 px-2 text-blue-700 hover:bg-blue-100"
                aria-label={`Delete ${view.label}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <div className="flex min-w-[240px] overflow-hidden rounded-full border border-gray-300 bg-white">
            <input
              value={invoiceSavedViewName}
              onChange={(event) => setInvoiceSavedViewName(event.target.value)}
              placeholder="Save current invoice view"
              className="min-w-0 flex-1 px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none"
            />
            <button
              type="button"
              onClick={handleSaveInvoiceSavedView}
              className="inline-flex items-center gap-1 border-l border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <Plus size={13} />
              Save
            </button>
          </div>
        </div>

        {isPayPalInvoiceWorkspace ? (
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: PAYPAL_BRAND.border,
              background: 'linear-gradient(180deg, rgba(0,156,222,0.06), rgba(255,255,255,1))'
            }}
          >
            <div className="flex flex-wrap gap-2">
              {[
                'PAID: payment completed',
                'SENT: customer link active',
                'UPDATED: invoice changed after send',
                'CANCELLED: invoice voided',
                'QR Ready: official QR generated'
              ].map((item) => (
                <div
                  key={item}
                  className="inline-flex rounded-full border bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]"
                  style={{ borderColor: PAYPAL_BRAND.border, color: PAYPAL_BRAND.blue }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          style={isPayPalInvoiceWorkspace ? { borderColor: PAYPAL_BRAND.border, boxShadow: '0 18px 40px rgba(0,48,135,0.06)' } : undefined}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead
                className="border-b bg-gray-50"
                style={
                  isPayPalInvoiceWorkspace
                    ? {
                        borderColor: PAYPAL_BRAND.border,
                        background: 'linear-gradient(180deg, rgba(0,48,135,0.06), rgba(244,248,255,1))'
                      }
                    : undefined
                }
              >
                <tr>
                  {['Invoice', 'Recipient', 'Amount', 'Status', 'Official PayPal', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <React.Fragment key={invoice.internal_invoice_id}>
                    <tr
                      className="border-b align-top hover:bg-gray-50"
                      style={isPayPalInvoiceWorkspace ? { borderColor: PAYPAL_BRAND.border } : undefined}
                    >
                      <td className="px-6 py-4">
                        <div
                          className="font-semibold text-gray-900"
                          style={isPayPalInvoiceWorkspace ? { color: PAYPAL_BRAND.ink } : undefined}
                        >
                          {invoice.summary.invoice_number}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{invoice.invoice_id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{invoice.summary.recipient_email}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {invoice.summary.amount} {invoice.summary.currency}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill
                          value={invoice.status}
                          tone={invoice.status === 'PAID' ? 'green' : invoice.status === 'FAILED' ? 'red' : 'blue'}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>Issue Date: {invoice.summary.issue_date || 'Immediate send'}</div>
                        <div className="mt-1">Due: {invoice.summary.due_date || 'Not set'}</div>
                        <div className="mt-1">Synced: {formatDateTime(invoice.official_paypal?.last_synced_at)}</div>
                        <div className="mt-1">
                          QR: {invoice.official_paypal?.qr?.image_url_png ? 'Ready' : 'Not generated'}
                        </div>
                        <div className="mt-1">
                          Auto reminders: {invoice.summary.auto_reminders_cancelled_at ? 'Stopped' : 'Active'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDetailDrawer({ type: 'invoice', id: invoice.internal_invoice_id })}
                          className="mb-2 inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <Eye size={14} />
                          Details
                        </button>
                        <InvoiceActions
                          invoice={invoice}
                          busyAction={busyAction}
                          onRefresh={(item) =>
                            handleInvoiceAction('refresh', item, refreshInvoice, 'Invoice refreshed')
                          }
                          onReminder={(item) =>
                            handleInvoiceAction('remind', item, sendInvoiceReminder, 'Reminder sent')
                          }
                          onCancelReminders={handleInvoiceReminderCancellation}
                          onQr={(item) =>
                            handleInvoiceAction('qr', item, generateInvoiceQr, 'Official PayPal QR generated')
                          }
                          onCancel={handleInvoiceCancel}
                          onReviewRequired={handleMarkInvoiceReviewRequired}
                          onTimelineToggle={toggleInvoiceTimeline}
                          timelineOpen={invoiceTimelineId === invoice.internal_invoice_id}
                        />
                      </td>
                    </tr>
                    {invoiceTimelineId === invoice.internal_invoice_id && (
                      <tr
                        className="border-b bg-white"
                        style={isPayPalInvoiceWorkspace ? { borderColor: PAYPAL_BRAND.border } : undefined}
                      >
                        <td colSpan={6} className="px-6 py-5">
                          <TimelinePanel
                            title={`Invoice Timeline · ${invoice.summary.invoice_number}`}
                            loading={invoiceTimelineLoading}
                            entries={invoiceTimelineEntries}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInvoices.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">No invoices yet.</div>
          )}
          <PaginationControls
            pagination={invoicePagination}
            onPrevious={() => setInvoicePage((page) => Math.max(1, page - 1))}
            onNext={() => setInvoicePage((page) => page + 1)}
          />
        </div>
        </div>
      ) : null}

      {renderPayoutActivity ? (
        <div ref={registerSectionRef('payouts')} className="scroll-mt-28 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3
              className="text-lg font-bold text-gray-900"
              style={isPayPalPayoutWorkspace ? { color: PAYPAL_BRAND.ink } : undefined}
            >
              {isPayPalPayoutWorkspace ? 'Activity' : 'Payouts'}
            </h3>
            <p className="text-sm text-gray-500">
              {filteredPayouts.length} shown
              {payoutPagination?.total ? ` of ${payoutPagination.total}` : ` of ${payouts.length}`} tracked payout records
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <input
              value={payoutSearch}
              onChange={(event) => setPayoutSearch(event.target.value)}
              placeholder="Recipient, payout, batch"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
            <select
              value={payoutStatusFilter}
              onChange={(event) => setPayoutStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            >
              {payoutStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All internal statuses' : status}
                </option>
              ))}
            </select>
            <select
              value={payoutProviderFilter}
              onChange={(event) => setPayoutProviderFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            >
              {payoutProviderOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All provider states' : status}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={payoutDateFrom}
              onChange={(event) => setPayoutDateFrom(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              aria-label="Payout date from"
            />
            <input
              type="date"
              value={payoutDateTo}
              onChange={(event) => setPayoutDateTo(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              aria-label="Payout date to"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={payoutSortBy}
                onChange={(event) => setPayoutSortBy(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                aria-label="Payout sort field"
              >
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
                <option value="amount">Amount</option>
                <option value="receiver">Receiver</option>
                <option value="status">Status</option>
              </select>
              <select
                value={payoutSortDirection}
                onChange={(event) => setPayoutSortDirection(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                aria-label="Payout sort direction"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            <select
              value={payoutPageSize}
              onChange={(event) => setPayoutPageSize(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              aria-label="Payout page size"
            >
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
              <option value="250">250 rows</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BUILT_IN_PAYOUT_SAVED_VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => applyPayoutSavedView(view.id)}
              className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              {view.label}
            </button>
          ))}
          {customPayoutSavedViews.map((view) => (
            <span key={view.id} className="inline-flex overflow-hidden rounded-full border border-blue-200 bg-blue-50">
              <button
                type="button"
                onClick={() => applyPayoutSavedView(view.id)}
                className="px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100"
              >
                {view.label}
              </button>
              <button
                type="button"
                onClick={() => handleDeletePayoutSavedView(view.id)}
                className="border-l border-blue-200 px-2 text-blue-700 hover:bg-blue-100"
                aria-label={`Delete ${view.label}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <div className="flex min-w-[240px] overflow-hidden rounded-full border border-gray-300 bg-white">
            <input
              value={payoutSavedViewName}
              onChange={(event) => setPayoutSavedViewName(event.target.value)}
              placeholder="Save current payout view"
              className="min-w-0 flex-1 px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none"
            />
            <button
              type="button"
              onClick={handleSavePayoutSavedView}
              className="inline-flex items-center gap-1 border-l border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <Plus size={13} />
              Save
            </button>
          </div>
        </div>

        {isPayPalPayoutWorkspace ? (
          <div
            className="rounded-2xl border bg-white p-4"
            style={{
              borderColor: PAYPAL_BRAND.border,
              boxShadow: '0 14px 34px rgba(0,20,53,0.05)'
            }}
          >
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black" style={{ color: PAYPAL_BRAND.ink }}>Provider states</p>
              <p className="text-xs font-semibold" style={{ color: PAYPAL_BRAND.muted }}>
                PayPal sandbox item statuses mapped into the payout queue
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'PENDING: provider processing',
                'UNCLAIMED: can be cancelled',
                'ONHOLD: provider review',
                'RETURNED: funds sent back',
                'SUCCESS: recipient paid'
              ].map((item) => (
                <div
                  key={item}
                  className="inline-flex rounded-full border bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]"
                  style={{ borderColor: PAYPAL_BRAND.border, color: PAYPAL_BRAND.actionBlue }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          style={isPayPalPayoutWorkspace ? { borderColor: PAYPAL_BRAND.border, boxShadow: '0 18px 40px rgba(0,48,135,0.06)' } : undefined}
        >
          <div className="overflow-x-auto">
            <table className={`w-full ${isPayPalPayoutWorkspace ? 'min-w-[860px]' : 'min-w-[1040px]'}`}>
              <thead
                className="border-b bg-gray-50"
                style={
                  isPayPalPayoutWorkspace
                    ? {
                        borderColor: PAYPAL_BRAND.border,
                        backgroundColor: PAYPAL_BRAND.shell
                      }
                    : undefined
                }
              >
                <tr>
                  {['Payout', 'Receiver', 'Amount', 'Risk', 'Provider State', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((payout) => (
                  <React.Fragment key={payout.payout_id}>
                    <tr
                      className="border-b align-top hover:bg-gray-50"
                      style={isPayPalPayoutWorkspace ? { borderColor: PAYPAL_BRAND.border } : undefined}
                    >
                      <td className="px-6 py-4">
                        <div
                          className="font-semibold text-gray-900"
                          style={isPayPalPayoutWorkspace ? { color: PAYPAL_BRAND.ink } : undefined}
                        >
                          {payout.payout_id}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Batch: {payout.tracking.sender_batch_id || 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{payout.summary.receiver}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {payout.summary.amount} {payout.summary.currency}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill
                          value={payout.risk_decision}
                          tone={
                            payout.risk_decision === 'APPROVED'
                              ? 'green'
                              : payout.risk_decision === 'BLOCKED'
                                ? 'red'
                                : 'amber'
                          }
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <StatusPill
                            value={payout.status}
                            tone={
                              payout.status === 'SUCCESS'
                                ? 'green'
                                : payout.status === 'FAILED' || payout.status === 'DENIED'
                                  ? 'red'
                                  : 'blue'
                            }
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Provider item: {payout.official_paypal?.provider_item_status || payout.metadata?.provider_item_status || 'Unknown'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Synced: {formatDateTime(payout.official_paypal?.last_synced_at || payout.metadata?.last_synced_at)}
                        </div>
                        {payout.official_paypal?.provider_issue_code && (
                          <div className="mt-1 text-xs text-amber-700">
                            Issue code: {payout.official_paypal.provider_issue_code}
                          </div>
                        )}
                        {payout.official_paypal?.remediation?.reason && (
                          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            {payout.official_paypal.remediation.reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDetailDrawer({ type: 'payout', id: payout.payout_id })}
                          className="mb-2 inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <Eye size={14} />
                          Details
                        </button>
                        <PayoutActions
                          payout={payout}
                          busyAction={busyAction}
                          onRefresh={handlePayoutRefresh}
                          onCancelUnclaimed={handleCancelUnclaimedPayout}
                          onTimelineToggle={togglePayoutTimeline}
                          timelineOpen={payoutTimelineId === payout.payout_id}
                        />
                      </td>
                    </tr>
                    {payoutTimelineId === payout.payout_id && (
                      <tr
                        className="border-b bg-white"
                        style={isPayPalPayoutWorkspace ? { borderColor: PAYPAL_BRAND.border } : undefined}
                      >
                        <td colSpan={6} className="px-6 py-5">
                          <TimelinePanel
                            title={`Payout Timeline · ${payout.payout_id}`}
                            loading={payoutTimelineLoading}
                            entries={payoutTimelineEntries}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPayouts.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">No payouts yet.</div>
          )}
          <PaginationControls
            pagination={payoutPagination}
            onPrevious={() => setPayoutPage((page) => Math.max(1, page - 1))}
            onNext={() => setPayoutPage((page) => page + 1)}
          />
        </div>
        </div>
      ) : null}

      <PaymentRecordDrawer
        record={detailDrawer.type === 'invoice' ? selectedInvoiceRecord : selectedPayoutRecord}
        type={detailDrawer.type}
        busyAction={busyAction}
        onClose={() => setDetailDrawer({ type: '', id: '' })}
        invoiceActions={{
          onRefresh: (item) => handleInvoiceAction('refresh', item, refreshInvoice, 'Invoice refreshed'),
          onReminder: (item) => handleInvoiceAction('remind', item, sendInvoiceReminder, 'Reminder sent'),
          onCancelReminders: handleInvoiceReminderCancellation,
          onQr: (item) => handleInvoiceAction('qr', item, generateInvoiceQr, 'Official PayPal QR generated'),
          onCancel: handleInvoiceCancel,
          onReviewRequired: handleMarkInvoiceReviewRequired,
          onTimelineToggle: toggleInvoiceTimeline
        }}
        payoutActions={{
          onRefresh: handlePayoutRefresh,
          onCancelUnclaimed: handleCancelUnclaimedPayout,
          onTimelineToggle: togglePayoutTimeline
        }}
        adminActions={{
          onApprovePayout: handleApprovePayout,
          onRejectPayout: handleRejectPayout,
          onReleaseInvoice: handleReleaseInvoiceFunds,
          onAddNote: handleAddRecordNote
        }}
        timeline={{
          open:
            detailDrawer.type === 'invoice'
              ? invoiceTimelineId === selectedInvoiceRecord?.internal_invoice_id
              : payoutTimelineId === selectedPayoutRecord?.payout_id,
          loading: detailDrawer.type === 'invoice' ? invoiceTimelineLoading : payoutTimelineLoading,
          entries: detailDrawer.type === 'invoice' ? invoiceTimelineEntries : payoutTimelineEntries
        }}
      />
    </div>
  );
}
