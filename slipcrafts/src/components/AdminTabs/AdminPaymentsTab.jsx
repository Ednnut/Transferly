import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
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
  Wallet
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const PAYPAL_BRAND = {
  logoUrl: 'https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-200px.png',
  blue: '#003087',
  cyan: '#009cde',
  ink: '#001435',
  mist: '#f4f8ff',
  border: '#d5e3ff'
};

function createEmptyLineItem() {
  return {
    name: '',
    description: '',
    quantity: 1,
    unitAmount: ''
  };
}

function createEmptyTemplateForm() {
  return {
    name: '',
    description: '',
    currency_code: 'USD',
    default_due_days: '',
    is_active: true,
    line_items: [createEmptyLineItem()]
  };
}

function createEmptyInvoiceComposer() {
  return {
    recipientEmail: '',
    templateId: '',
    description: '',
    currency: 'USD',
    issueDate: '',
    dueDate: '',
    items: [createEmptyLineItem()]
  };
}

function createEmptyPayoutComposer() {
  return {
    receiver: '',
    recipientType: 'EMAIL',
    receiverCountryCode: 'US',
    amount: '',
    currency: 'USD',
    note: ''
  };
}

function buildReminderDrafts(configurations) {
  return Object.fromEntries(
    configurations.map((configuration) => [
      configuration.id,
      {
        type: configuration.type || 'BEFORE_DUE',
        unit: configuration.interval?.unit || 'DAY',
        value: String(configuration.interval?.value || 1),
        repetition: String(configuration.repetition || 1),
        send_to_invoicer: Boolean(configuration.notification?.send_to_invoicer)
      }
    ])
  );
}

function formatDateTime(value) {
  if (!value) {
    return 'Not synced';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function StatusPill({ value, tone = 'gray' }) {
  const styles = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone] || styles.gray}`}>
      {value}
    </span>
  );
}

function getTopUpOrderTone(status) {
  if (status === 'completed') {
    return 'green';
  }
  if (status === 'cancelled') {
    return 'red';
  }
  if (status === 'awaiting_confirmation') {
    return 'amber';
  }
  return 'blue';
}

function TimelinePanel({ title, loading, entries }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      {loading ? (
        <div className="py-4 text-sm text-gray-500">Loading timeline…</div>
      ) : entries.length === 0 ? (
        <div className="py-4 text-sm text-gray-500">No timeline events yet.</div>
      ) : (
        <div className="mt-3 space-y-3">
          {entries.map((entry) => (
            <div key={entry.audit_log_id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{entry.action}</p>
                <p className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</p>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Actor: {entry.actor_type}{entry.actor_id ? ` · ${entry.actor_id}` : ''}
              </div>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceActions({
  invoice,
  busyAction,
  onRefresh,
  onReminder,
  onCancelReminders,
  onQr,
  onCancel,
  onTimelineToggle,
  timelineOpen
}) {
  const isBusy = (action) => busyAction === `${action}:${invoice.internal_invoice_id}`;
  const canCancel = !['PAID', 'CANCELLED', 'REFUNDED'].includes(invoice.status);
  const canSendReminder = ['SENT', 'UPDATED'].includes(invoice.status);
  const canGenerateQr = ['SENT', 'UPDATED', 'PAID'].includes(invoice.status);
  const remindersStopped = Boolean(invoice.summary.auto_reminders_cancelled_at);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onRefresh(invoice)}
        disabled={Boolean(busyAction)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <RefreshCw size={14} className={isBusy('refresh') ? 'animate-spin' : ''} />
        Refresh
      </button>
      <button
        onClick={() => onReminder(invoice)}
        disabled={!canSendReminder || Boolean(busyAction)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <Send size={14} />
        Remind
      </button>
      <button
        onClick={() => onCancelReminders(invoice)}
        disabled={remindersStopped || Boolean(busyAction)}
        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
      >
        <ShieldX size={14} />
        Stop Reminders
      </button>
      <button
        onClick={() => onQr(invoice)}
        disabled={!canGenerateQr || Boolean(busyAction)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <QrCode size={14} />
        QR
      </button>
      <button
        onClick={() => onCancel(invoice)}
        disabled={!canCancel || Boolean(busyAction)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        <ShieldX size={14} />
        Cancel
      </button>
      <button
        onClick={() => onTimelineToggle(invoice)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        <Clock3 size={14} />
        {timelineOpen ? 'Hide Timeline' : 'Timeline'}
      </button>
      {invoice.invoice_link && (
        <a
          href={invoice.invoice_link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
        >
          <ExternalLink size={14} />
          Open PayPal
        </a>
      )}
    </div>
  );
}

function PayoutActions({ payout, busyAction, onRefresh, onCancelUnclaimed, onTimelineToggle, timelineOpen }) {
  const isBusy = busyAction === `refresh:${payout.payout_id}`;
  const remediation = payout.official_paypal?.remediation;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onRefresh(payout)}
        disabled={Boolean(busyAction)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <RefreshCw size={14} className={isBusy ? 'animate-spin' : ''} />
        Refresh
      </button>
      {remediation?.action === 'cancel_unclaimed' && remediation.allowed && (
        <button
          onClick={() => onCancelUnclaimed(payout)}
          disabled={Boolean(busyAction)}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          <ShieldX size={14} />
          {remediation.label}
        </button>
      )}
      <button
        onClick={() => onTimelineToggle(payout)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        <Clock3 size={14} />
        {timelineOpen ? 'Hide Timeline' : 'Timeline'}
      </button>
    </div>
  );
}

export default function AdminPaymentsTab({ mode = 'all', embedded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || '';
  const {
    config,
    invoices,
    invoiceTemplates,
    invoiceReminderConfigurations,
    paymentIssues,
    payouts,
    adminTopUpOrders,
    acknowledgePaymentIssue,
    fetchInvoices,
    fetchInvoiceReminderConfigurations,
    fetchInvoiceTemplates,
    fetchPaymentIssues,
    fetchPayouts,
    fetchAdminTopUpOrders,
    createInvoice,
    createPayout,
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
  const [payoutComposer, setPayoutComposer] = useState(createEmptyPayoutComposer());
  const [lastCreatedPayout, setLastCreatedPayout] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [payoutSearch, setPayoutSearch] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('ALL');
  const [payoutProviderFilter, setPayoutProviderFilter] = useState('ALL');
  const sectionRefs = useRef({});
  const showFundingOrders = mode === 'all' || mode === 'payout';
  const showReminderCadence = mode === 'all' || mode === 'invoice';
  const showInvoiceTemplates = mode === 'all' || mode === 'invoice';
  const showInvoices = mode === 'all' || mode === 'invoice';
  const showPayouts = mode === 'all' || mode === 'payout';
  const showPaymentIssues = true;
  const isPayPalInvoiceWorkspace = embedded && mode === 'invoice';
  const isPayPalPayoutWorkspace = embedded && mode === 'payout';
  const isPayPalEmbeddedWorkspace = isPayPalInvoiceWorkspace || isPayPalPayoutWorkspace;

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
    () => ['ALL', ...new Set(payouts.map((entry) => entry.status).filter(Boolean))],
    [payouts]
  );

  const payoutProviderOptions = useMemo(
    () => [
      'ALL',
      ...new Set(
        payouts
          .map((entry) => entry.official_paypal?.provider_item_status || entry.metadata?.provider_item_status)
          .filter(Boolean)
      )
    ],
    [payouts]
  );

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
      ? 'Official PayPal Invoicing Workspace'
      : mode === 'payout'
        ? 'Official PayPal Payout Workspace'
        : 'PayPal Operations';

  const workspaceDescription =
    mode === 'invoice'
      ? 'Run the full hosted-invoice workflow here without leaving the PayPal service experience.'
      : mode === 'payout'
        ? 'Run the full payout tracking and remediation workflow here without leaving the PayPal service experience.'
      : 'Work only with official PayPal invoice links, QR payloads, sync actions, and payout tracking.';
  const selectedInvoiceTemplate = invoiceTemplates.find((template) => template.id === invoiceComposer.templateId) || null;
  const showInvoiceComposer = mode === 'invoice';
  const showPayoutComposer = mode === 'payout';

  const handleRefreshAll = async () => {
    setBusyAction('reconciliation');
    const result = await runPaymentReconciliation({ invoiceLimit: 50, payoutLimit: 50 });
    if (result.success) {
      await Promise.all([
        fetchInvoices(),
        fetchPayouts(),
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

  const handleInvoiceComposerSubmit = async () => {
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

  const handlePayoutComposerSubmit = async () => {
    setBusyAction('create-payout');
    const result = await createPayout({
      receiver: payoutComposer.receiver.trim(),
      recipientType: payoutComposer.recipientType,
      receiverCountryCode: payoutComposer.receiverCountryCode.trim().toUpperCase() || undefined,
      amount: Number(payoutComposer.amount),
      currency: payoutComposer.currency.trim().toUpperCase(),
      note: payoutComposer.note.trim() || undefined
    });

    if (result.success) {
      const refreshedPayouts = await fetchPayouts();
      await fetchPaymentIssues();
      const matchedPayout =
        refreshedPayouts.find((entry) => entry.payout_id === result.payout?.payout_id) || result.payout;
      setLastCreatedPayout(matchedPayout);
      resetPayoutComposer();
      handleSectionJump('payouts');
      toast.success('Official PayPal payout requested');
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
          className="overflow-hidden rounded-[28px] border p-6 shadow-[0_24px_60px_rgba(0,48,135,0.08)]"
          style={{
            borderColor: PAYPAL_BRAND.border,
            background: `linear-gradient(135deg, ${PAYPAL_BRAND.mist} 0%, #ffffff 58%, rgba(0,156,222,0.08) 100%)`
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <img
                src={PAYPAL_BRAND.logoUrl}
                alt="PayPal"
                className="h-10 w-auto"
              />
              <h2 className="mt-5 text-3xl font-black tracking-[-0.05em]" style={{ color: PAYPAL_BRAND.ink }}>
                {isPayPalInvoiceWorkspace ? 'PayPal Invoicing' : 'PayPal Payouts'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {isPayPalInvoiceWorkspace
                  ? 'Create, send, and manage official PayPal invoices with hosted links, reminder controls, QR generation, and template-backed workflows in one operational surface.'
                  : 'Send money to recipients using their email, phone number, or PayPal ID while keeping review, fee, and provider-state controls visible in one operational surface.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(isPayPalInvoiceWorkspace
                  ? ['Hosted invoice links', 'Template backed', 'Reminder aware', 'QR ready']
                  : ['Balance-funded', 'Review aware', 'Provider synced', 'Remediation ready']).map((chip) => (
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
                  {isPayPalInvoiceWorkspace ? 'Invoice Surface' : 'Recipient Types'}
                </p>
                <p className="mt-3 text-lg font-black tracking-[-0.03em]" style={{ color: PAYPAL_BRAND.ink }}>
                  {isPayPalInvoiceWorkspace ? 'Hosted links + records' : 'Email, Phone, PayPal ID'}
                </p>
              </div>
              <div className="rounded-[22px] border bg-white p-4 shadow-sm" style={{ borderColor: PAYPAL_BRAND.border }}>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {isPayPalInvoiceWorkspace ? 'Operational Model' : 'Funding Model'}
                </p>
                <p className="mt-3 text-lg font-black tracking-[-0.03em]" style={{ color: PAYPAL_BRAND.ink }}>
                  {isPayPalInvoiceWorkspace ? 'Send, sync, remind, reconcile' : 'PayPal Balance + Fees'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
                  fetchPayouts(),
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
                Official PayPal Workflow
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {isPayPalPayoutWorkspace
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

      {showInvoiceComposer ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
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
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Composer Notes</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Template mode uses your saved PayPal invoice defaults and line items.</p>
                <p>Manual mode sends the invoice with explicit currency and item values from this page.</p>
                <p>The created invoice will appear immediately in the official records table below.</p>
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

      {showPayoutComposer ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className="rounded-2xl border bg-white p-6 shadow-sm"
            style={{ borderColor: PAYPAL_BRAND.border, boxShadow: '0 20px 44px rgba(0,48,135,0.06)' }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-bold" style={{ color: PAYPAL_BRAND.ink }}>
                  Quick Create Official Payout
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Request a real PayPal payout from this workspace and let the policy, fee, and approval flow resolve naturally.
                </p>
              </div>
              <button
                onClick={resetPayoutComposer}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Receiver</label>
                <input
                  value={payoutComposer.receiver}
                  onChange={(event) => handlePayoutComposerFieldChange('receiver', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Recipient Type</label>
                <select
                  value={payoutComposer.recipientType}
                  onChange={(event) => handlePayoutComposerFieldChange('recipientType', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                >
                  <option value="EMAIL">EMAIL</option>
                  <option value="PHONE">PHONE</option>
                  <option value="PAYPAL_ID">PAYPAL_ID</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={payoutComposer.amount}
                  onChange={(event) => handlePayoutComposerFieldChange('amount', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  placeholder="25.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                <input
                  value={payoutComposer.currency}
                  onChange={(event) => handlePayoutComposerFieldChange('currency', event.target.value)}
                  maxLength={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Receiver Country</label>
                <input
                  value={payoutComposer.receiverCountryCode}
                  onChange={(event) => handlePayoutComposerFieldChange('receiverCountryCode', event.target.value)}
                  maxLength={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-orange-400 focus:outline-none"
                  placeholder="US"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Note</label>
              <textarea
                value={payoutComposer.note}
                onChange={(event) => handlePayoutComposerFieldChange('note', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                placeholder="Optional payout note"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handlePayoutComposerSubmit}
                disabled={busyAction === 'create-payout'}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: PAYPAL_BRAND.blue }}
              >
                <Send size={16} className={busyAction === 'create-payout' ? 'animate-pulse' : ''} />
                Request Official Payout
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-2xl border bg-white p-5 shadow-sm"
              style={{ borderColor: PAYPAL_BRAND.border }}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Flow Notes</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Payout requests can enter manual review based on configured thresholds and policy rules.</p>
                <p>Fees and total debit are computed server-side and reflected in the payout records after creation.</p>
                <p>Provider submission, holds, and unclaimed-item remediation continue in the workspace below.</p>
              </div>
            </div>

            {lastCreatedPayout ? (
              <div
                className="rounded-2xl border p-5 shadow-sm"
                style={{
                  borderColor: PAYPAL_BRAND.border,
                  background: 'linear-gradient(180deg, rgba(0,156,222,0.08), rgba(255,255,255,1))'
                }}
              >
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: PAYPAL_BRAND.blue }}>
                  Last Requested
                </p>
                <p className="mt-3 text-lg font-black tracking-[-0.03em]" style={{ color: PAYPAL_BRAND.ink }}>
                  {lastCreatedPayout.payout_id}
                </p>
                <div className="mt-2 text-sm text-slate-600">
                  {lastCreatedPayout.summary?.receiver || payoutComposer.receiver}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {lastCreatedPayout.summary?.amount || Number(lastCreatedPayout.amount || 0).toFixed?.(2) || '--'} {lastCreatedPayout.summary?.currency || payoutComposer.currency}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill
                    value={lastCreatedPayout.status || 'REQUESTED'}
                    tone={
                      lastCreatedPayout.status === 'SUCCESS'
                        ? 'green'
                        : lastCreatedPayout.status === 'FAILED' || lastCreatedPayout.status === 'DENIED'
                          ? 'red'
                          : 'blue'
                    }
                  />
                  {lastCreatedPayout.risk_decision ? (
                    <StatusPill
                      value={lastCreatedPayout.risk_decision}
                      tone={
                        lastCreatedPayout.risk_decision === 'APPROVED'
                          ? 'green'
                          : lastCreatedPayout.risk_decision === 'BLOCKED'
                            ? 'red'
                            : 'amber'
                      }
                    />
                  ) : null}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleSectionJump('payouts')}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
                  >
                    <Wallet size={14} />
                    View In Records
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showFundingOrders ? (
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

      {showPaymentIssues ? (
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
            <p className="text-sm text-gray-500">{filteredInvoices.length} of {invoices.length} official invoice records</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={invoiceSearch}
              onChange={(event) => setInvoiceSearch(event.target.value)}
              placeholder="Search invoice, recipient, description"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none md:w-[280px]"
            />
            <select
              value={invoiceStatusFilter}
              onChange={(event) => setInvoiceStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none md:w-[180px]"
            >
              {invoiceStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : status}
                </option>
              ))}
            </select>
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
        </div>
        </div>
      ) : null}

      {showPayouts ? (
        <div ref={registerSectionRef('payouts')} className="scroll-mt-28 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3
              className="text-lg font-bold text-gray-900"
              style={isPayPalPayoutWorkspace ? { color: PAYPAL_BRAND.ink } : undefined}
            >
              Payouts
            </h3>
            <p className="text-sm text-gray-500">{filteredPayouts.length} of {payouts.length} tracked payout records</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={payoutSearch}
              onChange={(event) => setPayoutSearch(event.target.value)}
              placeholder="Search payout, receiver, batch"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none md:w-[260px]"
            />
            <select
              value={payoutStatusFilter}
              onChange={(event) => setPayoutStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none md:w-[180px]"
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none md:w-[190px]"
            >
              {payoutProviderOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All provider states' : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isPayPalPayoutWorkspace ? (
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: PAYPAL_BRAND.border,
              background: 'linear-gradient(180deg, rgba(0,156,222,0.06), rgba(255,255,255,1))'
            }}
          >
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
          style={isPayPalPayoutWorkspace ? { borderColor: PAYPAL_BRAND.border, boxShadow: '0 18px 40px rgba(0,48,135,0.06)' } : undefined}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead
                className="border-b bg-gray-50"
                style={
                  isPayPalPayoutWorkspace
                    ? {
                        borderColor: PAYPAL_BRAND.border,
                        background: 'linear-gradient(180deg, rgba(0,48,135,0.06), rgba(244,248,255,1))'
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
        </div>
        </div>
      ) : null}
    </div>
  );
}
