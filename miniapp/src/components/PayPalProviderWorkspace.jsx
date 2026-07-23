import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Gauge,
  RefreshCw,
  Send,
  ShieldCheck
} from 'lucide-react';
import PaymentsTab from './AdminTabs/PaymentsTab';
import ProviderWorkspaceShell from './ProviderWorkspaceShell';
import { getProviderDashboard, getProviderResource } from '../lib/api';
import {
  getProviderLaneDefinition,
  getProviderManifest,
  getProviderWorkspaceRoute,
  isProviderLaneSupported
} from '../lib/providerManifests';

const paypalLanes = [
  'overview',
  'invoices',
  'payouts',
  'payments',
  'orders',
  'transactions',
  'webhooks',
  'disputes',
  'subscriptions',
  'tokens',
  'fx',
  'developer',
  'settings'
];

const laneResourceMap = {
  overview: 'overview',
  invoices: 'invoices',
  payouts: 'payouts',
  payments: 'payments',
  orders: 'orders',
  transactions: 'transactions',
  webhooks: 'webhooks',
  disputes: 'disputes',
  subscriptions: 'subscriptions',
  tokens: 'tokens',
  fx: 'currency-exchange',
  developer: 'developer',
  settings: 'settings'
};

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function humanizeStatus(value) {
  return String(value || 'unknown')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDateTime(value) {
  if (!value) {
    return 'Time unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function toIsoDateTime(value) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function defaultPayPalTransactionFilters(query = {}) {
  return {
    dateFrom: toDateTimeLocalValue(query.dateFrom),
    dateTo: toDateTimeLocalValue(query.dateTo),
    status: query.status || '',
    transactionType: query.transactionType || query.type || '',
    transactionId: query.transactionId || '',
    limit: String(query.limit || 25)
  };
}

function readDashboard(payload) {
  return payload?.data || payload || null;
}

function readResourceData(payload) {
  return payload?.data || {};
}

function readDashboardResources(dashboard) {
  return dashboard?.provider_resources || dashboard?.resources || [];
}

function getResourceReadiness(resourcePayload, dashboard, resourceName) {
  if (resourcePayload?.readiness) {
    return resourcePayload.readiness;
  }

  return readDashboardResources(dashboard).find((resource) => (
    resource.resource === resourceName ||
    resource.lane === resourceName ||
    resource.lane === (resourceName === 'currency-exchange' ? 'fx' : resourceName)
  )) || null;
}

function usePayPalWorkspaceData(activeLane, resourceParams = {}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    loading: true,
    error: '',
    dashboard: null,
    resource: null
  });

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    const resourceName = laneResourceMap[activeLane] || 'overview';

    async function load() {
      setState((current) => ({
        ...current,
        loading: true,
        error: ''
      }));

      try {
        const [dashboardPayload, resourcePayload] = await Promise.all([
          getProviderDashboard('paypal'),
          getProviderResource('paypal', resourceName, resourceParams)
        ]);

        if (alive) {
          setState({
            loading: false,
            error: '',
            dashboard: readDashboard(dashboardPayload),
            resource: resourcePayload
          });
        }
      } catch (error) {
        if (alive) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error?.message || 'Transferly could not load the PayPal workspace.'
          }));
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [activeLane, reloadKey, resourceParams]);

  return {
    ...state,
    reload
  };
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'default' }) {
  const toneClass = tone === 'warning'
    ? 'bg-amber-400/10 text-amber-100 ring-amber-300/25'
    : 'bg-[var(--provider-accent-soft)] text-[var(--tg-text-color)] ring-[var(--provider-accent-border)]';

  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${toneClass}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--tg-hint-color)]">{label}</p>
          <p className="mt-1 text-lg font-black text-[var(--tg-text-color)]">{value}</p>
          {detail ? <p className="mt-1 text-xs font-bold leading-5 text-[var(--tg-subtitle-text-color)]">{detail}</p> : null}
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  const normalized = normalizeStatus(status);
  const toneClass = ['live', 'sandbox-ready', 'healthy', 'configured', 'processed'].includes(normalized)
    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
    : ['needs-env', 'needs-webhook', 'needs-review', 'failed', 'error'].includes(normalized)
      ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
      : normalized === 'preview'
        ? 'border-sky-400/30 bg-sky-400/10 text-sky-100'
        : 'border-white/10 bg-white/[0.045] text-[var(--tg-subtitle-text-color)]';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${toneClass}`}>
      {humanizeStatus(status)}
    </span>
  );
}

function ActionCard({ to, icon: Icon, label, detail }) {
  return (
    <Link
      to={to}
      className="group rounded-[22px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-[var(--provider-accent-border)] hover:bg-[var(--provider-accent-soft)]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--provider-accent-soft)] text-[var(--tg-text-color)] ring-1 ring-[var(--provider-accent-border)]">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-black text-[var(--tg-text-color)]">{label}</p>
            <ArrowRight className="opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" size={15} />
          </div>
          <p className="mt-1 text-xs font-bold leading-5 text-[var(--tg-subtitle-text-color)]">{detail}</p>
        </div>
      </div>
    </Link>
  );
}

function LaneHeader({ eyebrow, title, body, action }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-black text-[var(--tg-text-color)]">{title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--tg-subtitle-text-color)]">{body}</p>
        </div>
        {action}
      </div>
    </section>
  );
}

function CapabilityList({ title, items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-black text-[var(--tg-text-color)]">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] p-5 text-center">
      <p className="font-black text-[var(--tg-text-color)]">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--tg-subtitle-text-color)]">{body}</p>
    </div>
  );
}

function ReadinessPanel({ readiness }) {
  if (!readiness) {
    return null;
  }

  const missingEnv = readiness.missing_env || [];

  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">Readiness</p>
          <h3 className="mt-2 text-lg font-black text-[var(--tg-text-color)]">{readiness.api_resource || readiness.label}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--tg-subtitle-text-color)]">
            {readiness.implemented ? 'This lane is connected to Transferly operations.' : 'This lane is prepared and waits for the backend module to enable live actions.'}
          </p>
        </div>
        <StatusPill status={readiness.status} />
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">Environment</dt>
          <dd className="mt-1 text-sm font-black text-[var(--tg-text-color)]">{readiness.environment || 'not configured'}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">Configuration</dt>
          <dd className="mt-1 text-sm font-black text-[var(--tg-text-color)]">{missingEnv.length ? `${missingEnv.length} missing` : 'Ready'}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">Secrets</dt>
          <dd className="mt-1 text-sm font-black text-[var(--tg-text-color)]">Never exposed</dd>
        </div>
      </dl>

      {missingEnv.length ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-100">Missing configuration</p>
          <p className="mt-2 text-sm font-semibold text-amber-50">{missingEnv.join(', ')}</p>
        </div>
      ) : null}

      <CapabilityList title="Supported actions" items={readiness.supported_actions || []} />
    </section>
  );
}

function NextActions({ actions = [] }) {
  if (!actions.length) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">Next recommended actions</p>
      <div className="mt-3 space-y-3">
        {actions.map((action) => (
          <article key={action.code || action.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <p className="font-black text-[var(--tg-text-color)]">{action.label}</p>
            {action.detail ? <p className="mt-1 text-xs font-bold leading-5 text-[var(--tg-subtitle-text-color)]">{action.detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function RecordList({ title, records = [], emptyTitle, emptyBody, renderRecord }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">{title}</p>
      <div className="mt-3 space-y-3">
        {records.length ? records.map(renderRecord) : (
          <EmptyState title={emptyTitle} body={emptyBody} />
        )}
      </div>
    </section>
  );
}

function PayPalOverview({ dashboard, resource }) {
  const data = readResourceData(resource);
  const resources = data.resources || readDashboardResources(dashboard);
  const readyResources = resources.filter((item) => ['live', 'sandbox-ready'].includes(normalizeStatus(item.status))).length;
  const recentInvoices = data.recent_invoices || dashboard?.recent_invoices || [];
  const recentPayouts = data.recent_payouts || dashboard?.recent_payouts || [];
  const recentWebhooks = data.recent_webhook_events || [];
  const failedActions = data.failed_or_pending_actions || dashboard?.risk_flags || [];

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={ShieldCheck}
          label="Readiness"
          value={`${readyResources}/${resources.length || 0}`}
          detail="PayPal resource lanes ready for sandbox/live operations"
          tone={readyResources < resources.length ? 'warning' : 'default'}
        />
        <MetricCard
          icon={FileText}
          label="Invoices"
          value={recentInvoices.length}
          detail="Recent PayPal collection records from Transferly"
        />
        <MetricCard
          icon={Send}
          label="Payouts"
          value={recentPayouts.length}
          detail="Recent PayPal payout records from Transferly"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          to={getProviderWorkspaceRoute('paypal', 'invoices')}
          icon={FileText}
          label="PayPal invoices"
          detail="Preview, create, send, refresh, remind, and cancel supported invoice records."
        />
        <ActionCard
          to={getProviderWorkspaceRoute('paypal', 'payouts')}
          icon={Send}
          label="PayPal payouts"
          detail="Preview, review, approve, submit, and track idempotent payout requests."
        />
        <ActionCard
          to={getProviderWorkspaceRoute('paypal', 'webhooks')}
          icon={Activity}
          label="Webhooks"
          detail="Review sanitized webhook metadata, delivery state, and replay readiness."
        />
        <ActionCard
          to={getProviderWorkspaceRoute('paypal', 'settings')}
          icon={Gauge}
          label="Settings"
          detail="Check environment mode, required variables, webhook setup, currencies, and docs links."
        />
      </section>

      <RecordList
        title="Recent webhook events"
        records={recentWebhooks}
        emptyTitle="No webhook events yet"
        emptyBody="Verified PayPal webhook metadata appears here after events are ingested."
        renderRecord={(event) => (
          <article key={event.event_id || event.id || event.type} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={event.status || event.signature_verification_status || 'recorded'} />
              <span className="text-xs font-bold text-[var(--tg-subtitle-text-color)]">{formatDateTime(event.received_at || event.processed_at)}</span>
            </div>
            <p className="mt-2 font-black text-[var(--tg-text-color)]">{event.event_type || 'PayPal webhook event'}</p>
            <p className="mt-1 text-xs font-bold text-[var(--tg-subtitle-text-color)]">Raw payloads are not exposed in the Mini App.</p>
          </article>
        )}
      />

      <NextActions actions={data.next_recommended_actions || dashboard?.next_recommended_actions || failedActions} />
    </div>
  );
}

function PayPalInvoiceLane({ readiness }) {
  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow="PayPal Invoicing API"
        title="Invoice lane"
        body="Create, preview, send, refresh, remind, and cancel supported PayPal invoice records through Transferly workflows."
      />
      <ReadinessPanel readiness={readiness} />
      <CapabilityList
        title="Available invoice actions"
        items={['Create invoice draft', 'Preview totals before provider state', 'Send official PayPal invoice', 'Refresh invoice status', 'Send reminder', 'Cancel invoice safely']}
      />
      <PaymentsTab embedded mode="invoice" providerFilter="paypal" />
    </div>
  );
}

function PayPalPayoutLane({ readiness }) {
  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow="PayPal Payouts API"
        title="Payout lane"
        body="Preview and submit PayPal payouts with Transferly review, risk checks, audit logs, and idempotency controls."
      />
      <ReadinessPanel readiness={readiness} />
      <CapabilityList
        title="Available payout actions"
        items={['Review payout request', 'Preview fees and eligibility', 'Require idempotency key', 'Approve or reject manually', 'Refresh provider status', 'Preserve audit trail']}
      />
      <PaymentsTab embedded mode="payout" providerFilter="paypal" />
    </div>
  );
}

function PayPalOrdersLane({ payload, readiness, onLookupOrder, onClearOrder }) {
  const data = readResourceData(payload);
  const detail = data.detail || {};
  const records = data.records || [];
  const [orderId, setOrderId] = useState(detail.query?.orderId || records[0]?.id || '');

  function submitOrderLookup(event) {
    event.preventDefault();
    const cleanOrderId = orderId.trim();
    if (!cleanOrderId) {
      onClearOrder();
      return;
    }
    onLookupOrder(cleanOrderId);
  }

  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow="PayPal Orders API"
        title="Order lookup and checkout readiness"
        body="Review PayPal order state from Transferly without enabling create or capture actions until validation, authorization, and audit trails are complete."
      />
      <ReadinessPanel readiness={readiness} />
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Gauge} label="Lookup" value={detail.order_lookup_enabled ? 'Enabled' : 'Prepared'} detail="Read-only provider order lookup." />
        <MetricCard icon={ShieldCheck} label="Create/Capture" value={detail.create_order_enabled || detail.capture_order_enabled ? 'Enabled' : 'Gated'} detail="Money movement order actions remain disabled." tone={detail.create_order_enabled || detail.capture_order_enabled ? 'default' : 'warning'} />
        <MetricCard icon={Activity} label="Orders" value={records.length} detail="Provider order records returned for the current query." />
      </section>
      <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">Order lookup</p>
        <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={submitOrderLookup}>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">PayPal order ID</span>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="ORDER-123"
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-bold text-[var(--tg-text-color)] outline-none transition focus:border-[var(--provider-accent-border)]"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[var(--provider-accent)] px-4 text-sm font-black text-white"
          >
            Look up
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderId('');
              onClearOrder();
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-[var(--tg-text-color)]"
          >
            Clear
          </button>
        </form>
        <p className="mt-3 text-xs font-bold leading-5 text-[var(--tg-subtitle-text-color)]">
          Lookup is read-only. Transferly does not create, approve, capture, or settle orders from this panel.
        </p>
      </section>
      <CapabilityList title="Order safeguards" items={detail.capability_checks || readiness?.supported_actions || []} />
      <RecordList
        title="Order records"
        records={records}
        emptyTitle="No order selected"
        emptyBody="Transferly supports safe PayPal order lookup by provider order ID. Create and capture actions remain gated."
        renderRecord={(record) => (
          <article key={record.id || record.created_at || 'paypal-order'} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={record.status || record.provider_status || 'recorded'} />
              <span className="text-xs font-bold text-[var(--tg-subtitle-text-color)]">{formatDateTime(record.updated_at || record.created_at)}</span>
            </div>
            <p className="mt-2 font-black text-[var(--tg-text-color)]">{record.id || 'PayPal order'}</p>
            <p className="mt-1 text-xs font-bold text-[var(--tg-subtitle-text-color)]">
              {record.intent || 'Order'} · {record.amount || 'Amount unavailable'} {record.currency || ''}
            </p>
            <p className="mt-1 text-xs font-bold text-[var(--tg-subtitle-text-color)]">
              Buyer: {record.buyer?.email || record.buyer?.payer_id || 'not provided'}
            </p>
          </article>
        )}
      />
      <NextActions actions={payload?.next_actions || []} />
    </div>
  );
}

function PayPalTransactionsLane({ payload, readiness, onSearchTransactions, onShowTransferlyTransactions }) {
  const data = readResourceData(payload);
  const detail = data.detail || {};
  const records = data.records || [];
  const [filters, setFilters] = useState(() => defaultPayPalTransactionFilters(detail.query));

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function submitPayPalSearch(event) {
    event.preventDefault();
    onSearchTransactions({
      source: 'paypal',
      dateFrom: toIsoDateTime(filters.dateFrom),
      dateTo: toIsoDateTime(filters.dateTo),
      status: filters.status.trim() || undefined,
      transactionType: filters.transactionType.trim() || undefined,
      transactionId: filters.transactionId.trim() || undefined,
      limit: Number(filters.limit) || 25
    });
  }

  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow="PayPal Transaction Search API"
        title="Provider transaction search and reconciliation"
        body="Use provider transaction records for investigation and reconciliation while keeping Transferly’s ledger as the balance source of truth."
      />
      <ReadinessPanel readiness={readiness} />
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Gauge} label="Search" value={detail.paypal_search_enabled ? 'PayPal' : 'Transferly'} detail={detail.paypal_search_enabled ? 'Provider-native search response.' : 'Local Transferly-linked activity view.'} />
        <MetricCard icon={ShieldCheck} label="Ledger truth" value="Transferly" detail={data.source_of_truth?.transferly_ledger || 'Provider status does not define wallet balances.'} />
        <MetricCard icon={Activity} label="Records" value={records.length} detail="Invoices, payouts, and provider transaction records." />
      </section>
      <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">Provider search</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--tg-subtitle-text-color)]">
              Search PayPal provider records for reconciliation. Results do not replace Transferly ledger balances.
            </p>
          </div>
          <StatusPill status={detail.paypal_search_enabled ? 'live' : 'preview'} />
        </div>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submitPayPalSearch}>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">From</span>
            <input
              type="datetime-local"
              value={filters.dateFrom}
              onChange={(event) => updateFilter('dateFrom', event.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-bold text-[var(--tg-text-color)] outline-none transition focus:border-[var(--provider-accent-border)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">To</span>
            <input
              type="datetime-local"
              value={filters.dateTo}
              onChange={(event) => updateFilter('dateTo', event.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-bold text-[var(--tg-text-color)] outline-none transition focus:border-[var(--provider-accent-border)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">Status</span>
            <input
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
              placeholder="COMPLETED, PENDING"
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-bold text-[var(--tg-text-color)] outline-none transition focus:border-[var(--provider-accent-border)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">Type</span>
            <input
              value={filters.transactionType}
              onChange={(event) => updateFilter('transactionType', event.target.value)}
              placeholder="T0006 or provider type"
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-bold text-[var(--tg-text-color)] outline-none transition focus:border-[var(--provider-accent-border)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">Transaction ID</span>
            <input
              value={filters.transactionId}
              onChange={(event) => updateFilter('transactionId', event.target.value)}
              placeholder="Provider transaction ID"
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-bold text-[var(--tg-text-color)] outline-none transition focus:border-[var(--provider-accent-border)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--tg-hint-color)]">Limit</span>
            <select
              value={filters.limit}
              onChange={(event) => updateFilter('limit', event.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-bold text-[var(--tg-text-color)] outline-none transition focus:border-[var(--provider-accent-border)]"
            >
              <option value="10">10 records</option>
              <option value="25">25 records</option>
              <option value="50">50 records</option>
              <option value="100">100 records</option>
            </select>
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
            <button
              type="submit"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-[var(--provider-accent)] px-4 text-sm font-black text-white"
            >
              Search PayPal records
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters(defaultPayPalTransactionFilters());
                onShowTransferlyTransactions();
              }}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-[var(--tg-text-color)]"
            >
              Show Transferly records
            </button>
          </div>
        </form>
      </section>
      {detail.provider_latency_notice ? (
        <section className="rounded-[28px] border border-sky-400/20 bg-sky-400/10 p-4">
          <p className="text-sm font-black text-sky-50">Provider reporting delay</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-sky-50">{detail.provider_latency_notice}</p>
        </section>
      ) : null}
      {detail.provider_error ? (
        <section className="rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-sm font-black text-amber-50">Transaction Search unavailable</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-50">{detail.provider_error.message}</p>
        </section>
      ) : null}
      <RecordList
        title="Transaction records"
        records={records}
        emptyTitle="No transaction records found"
        emptyBody="Transferly will show linked activity here. Provider-native search can be filtered by date range, status, type, or transaction ID."
        renderRecord={(record) => (
          <article key={`${record.source || record.type}-${record.id || record.created_at}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={record.status || record.provider_status || 'recorded'} />
              <span className="text-xs font-bold text-[var(--tg-subtitle-text-color)]">{formatDateTime(record.updated_at || record.created_at)}</span>
            </div>
            <p className="mt-2 font-black text-[var(--tg-text-color)]">{record.id || 'PayPal transaction'}</p>
            <p className="mt-1 text-xs font-bold text-[var(--tg-subtitle-text-color)]">
              {record.type || record.linked_resource || 'Transaction'} · {record.amount || 'Amount unavailable'} {record.currency || ''}
            </p>
            <p className="mt-1 text-xs font-bold text-[var(--tg-subtitle-text-color)]">
              Source: {humanizeStatus(record.source || record.linked_resource || 'provider record')}
            </p>
          </article>
        )}
      />
      <NextActions actions={payload?.next_actions || []} />
    </div>
  );
}

function PayPalWebhookLane({ payload, readiness }) {
  const data = readResourceData(payload);
  const records = data.records || [];

  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow="PayPal Webhooks Management API"
        title="Webhook operations"
        body="Track PayPal webhook readiness, signature verification state, failed attempts, and sanitized event metadata."
        action={(
          <Link
            to="/miniapp/ops?provider=paypal"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-[var(--tg-text-color)] transition hover:bg-white/[0.08]"
          >
            Command center
            <ArrowRight size={15} />
          </Link>
        )}
      />
      <ReadinessPanel readiness={readiness} />
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={CheckCircle2} label="Webhook ID" value={data.configured_webhook_id_present ? 'Configured' : 'Missing'} detail="Webhook ID value is never exposed." tone={data.configured_webhook_id_present ? 'default' : 'warning'} />
        <MetricCard icon={ShieldCheck} label="Signature" value={humanizeStatus(data.signature_verification_status)} detail="Status only; no headers or raw payloads." />
        <MetricCard icon={AlertTriangle} label="Failed attempts" value={data.failed_attempts || 0} detail="Review failures through command center." tone={data.failed_attempts ? 'warning' : 'default'} />
      </section>
      <RecordList
        title="Sanitized webhook events"
        records={records}
        emptyTitle="No webhook metadata available"
        emptyBody="PayPal webhook events appear here after Transferly verifies and records sanitized metadata."
        renderRecord={(event) => (
          <article key={event.event_id || event.id || event.type} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={event.status || 'recorded'} />
              <span className="text-xs font-bold text-[var(--tg-subtitle-text-color)]">{formatDateTime(event.received_at || event.processed_at)}</span>
            </div>
            <p className="mt-2 font-black text-[var(--tg-text-color)]">{event.event_type || 'PayPal webhook event'}</p>
            <p className="mt-1 text-xs font-bold text-[var(--tg-subtitle-text-color)]">Linked resource: {event.linked_resource || 'not linked yet'}</p>
          </article>
        )}
      />
    </div>
  );
}

function PayPalSettingsLane({ payload, readiness }) {
  const data = readResourceData(payload);

  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow="PayPal settings"
        title="Environment and readiness"
        body="Review PayPal environment mode, required configuration, webhook posture, supported currencies, and documentation links without exposing secrets."
      />
      <ReadinessPanel readiness={readiness} />
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Gauge} label="Mode" value={data.environment_mode || 'not configured'} detail="Sandbox records are labeled by the API." />
        <MetricCard icon={ShieldCheck} label="Webhook" value={humanizeStatus(data.webhook_endpoint_status)} detail="Endpoint readiness only; no secrets exposed." />
        <MetricCard icon={CheckCircle2} label="Currencies" value={(data.supported_currencies || []).length} detail={(data.supported_currencies || []).join(', ') || 'No currency list available.'} />
      </section>
      <CapabilityList title="Enabled actions" items={data.enabled_actions || []} />
      <section className="rounded-[28px] border border-white/10 bg-[var(--tg-section-bg-color)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--tg-hint-color)]">Documentation</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(data.docs_links || []).map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[42px] items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm font-black text-[var(--tg-text-color)]"
            >
              {link.label}
              <BookOpen size={15} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function PayPalDeveloperLane({ payload, readiness, manifest }) {
  const data = readResourceData(payload);

  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow="PayPal developer"
        title="Traceability and operator controls"
        body="Use request IDs, idempotency keys, audit logs, and command-center tools to troubleshoot provider operations safely."
        action={(
          <a
            href={manifest.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-[var(--tg-text-color)] transition hover:bg-white/[0.08]"
          >
            <BookOpen size={15} />
            PayPal docs
          </a>
        )}
      />
      <ReadinessPanel readiness={readiness} />
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Code2} label="Request IDs" value="Enabled" detail={data.detail?.request_ids || 'Included with provider responses.'} />
        <MetricCard icon={RefreshCw} label="Idempotency" value="Required" detail={data.detail?.idempotency || 'Required for payout submission.'} />
        <MetricCard icon={Clock3} label="Audit trail" value="Enabled" detail={data.detail?.audit_logging || 'Sensitive operations are recorded.'} />
      </section>
      <ActionCard
        to="/miniapp/ops?provider=paypal"
        icon={Code2}
        label="Open operator tools"
        detail="Use existing replay, ignore, provider health, balance, and dead-letter recovery tools without duplicating command-center behavior."
      />
    </div>
  );
}

function PayPalPreparedLane({ lane, payload, readiness }) {
  const data = readResourceData(payload);
  const laneDefinition = getProviderLaneDefinition(lane);
  const detail = data.detail || {};
  const records = data.records || [];

  return (
    <div className="space-y-4">
      <LaneHeader
        eyebrow={readiness?.api_resource || laneDefinition.label}
        title={`${laneDefinition.label} workspace`}
        body={readiness?.implemented
          ? 'This PayPal resource is available through Transferly operations.'
          : 'This PayPal resource is prepared as a safe setup lane until the live backend module is enabled.'}
      />
      <ReadinessPanel readiness={readiness} />
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Gauge} label="Setup state" value={humanizeStatus(data.setup_state)} detail="Unsupported actions return setup guidance instead of raw provider errors." />
        <MetricCard icon={ShieldCheck} label="Ledger source" value="Transferly" detail={data.source_of_truth?.transferly_ledger || 'Transferly ledger remains authoritative.'} />
        <MetricCard icon={Activity} label="Records" value={records.length} detail="Linked provider records appear here after the backend resource is enabled." />
      </section>
      <CapabilityList title="Capability checks" items={detail.capability_checks || readiness?.supported_actions || []} />
      {detail.disclaimer ? (
        <section className="rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-sm font-black text-amber-50">Provider settlement disclaimer</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-50">{detail.disclaimer}</p>
        </section>
      ) : null}
      <RecordList
        title={`${laneDefinition.label} records`}
        records={records}
        emptyTitle={`No ${laneDefinition.label.toLowerCase()} records yet`}
        emptyBody="Transferly will show provider-linked records here after this PayPal resource is fully connected."
        renderRecord={(record) => (
          <article key={`${record.type || lane}-${record.id || record.created_at}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={record.status || 'recorded'} />
              <span className="text-xs font-bold text-[var(--tg-subtitle-text-color)]">{formatDateTime(record.created_at)}</span>
            </div>
            <p className="mt-2 font-black text-[var(--tg-text-color)]">{record.id || `${laneDefinition.label} record`}</p>
            <p className="mt-1 text-xs font-bold text-[var(--tg-subtitle-text-color)]">{record.type || record.linked_resource || 'PayPal resource'}</p>
          </article>
        )}
      />
      <NextActions actions={payload?.next_actions || []} />
    </div>
  );
}

export default function PayPalProviderWorkspace({ lane = 'overview' }) {
  const manifest = getProviderManifest('paypal');
  const requestedLane = lane || 'overview';
  const activeLane = isProviderLaneSupported('paypal', requestedLane) && paypalLanes.includes(requestedLane)
    ? requestedLane
    : 'overview';
  const resourceName = laneResourceMap[activeLane] || 'overview';
  const [resourceQueryByLane, setResourceQueryByLane] = useState({});
  const resourceParams = useMemo(() => resourceQueryByLane[activeLane] || {}, [activeLane, resourceQueryByLane]);
  const { loading, error, dashboard, resource, reload } = usePayPalWorkspaceData(activeLane, resourceParams);
  const lanes = useMemo(() => manifest.lanes.filter((item) => paypalLanes.includes(item.id)), [manifest.lanes]);
  const laneDefinition = getProviderLaneDefinition(activeLane);
  const readiness = getResourceReadiness(resource, dashboard, resourceName);
  const connectionStatus = dashboard?.provider?.status || resource?.status || readiness?.status || manifest.status;
  const environment = dashboard?.provider?.environment || resource?.environment || readiness?.environment || manifest.environmentSupport;

  if (requestedLane !== activeLane) {
    return <Navigate to={getProviderWorkspaceRoute('paypal', activeLane)} replace />;
  }

  const quickActions = [
    { label: 'Overview', to: getProviderWorkspaceRoute('paypal', 'overview') },
    { label: 'Invoices', to: getProviderWorkspaceRoute('paypal', 'invoices') },
    { label: 'Payouts', to: getProviderWorkspaceRoute('paypal', 'payouts') },
    { label: 'Webhooks', to: getProviderWorkspaceRoute('paypal', 'webhooks') },
    { label: 'Settings', to: getProviderWorkspaceRoute('paypal', 'settings') }
  ];

  const setLaneQuery = (laneId, query) => {
    setResourceQueryByLane((current) => ({
      ...current,
      [laneId]: query
    }));
  };

  return (
    <ProviderWorkspaceShell
      manifest={manifest}
      activeLane={activeLane}
      lanes={lanes}
      environment={environment}
      connectionStatus={connectionStatus}
      capabilities={manifest.capabilities}
      quickActions={quickActions}
      state={loading ? 'loading' : error ? 'error' : 'ready'}
      error={error}
      onRetry={reload}
    >
      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={Gauge}
            label="Workspace"
            value={laneDefinition.label}
            detail="Transferly-owned PayPal financial operations workspace"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Status"
            value={humanizeStatus(connectionStatus)}
            detail="Loaded from provider readiness and health APIs."
          />
          <MetricCard
            icon={ShieldCheck}
            label="Environment"
            value={Array.isArray(environment) ? environment.join(' / ') : environment}
            detail="Secrets and raw provider payloads are never exposed."
          />
        </section>

        {activeLane === 'overview' ? <PayPalOverview dashboard={dashboard} resource={resource} /> : null}
        {activeLane === 'invoices' ? <PayPalInvoiceLane readiness={getResourceReadiness(resource, dashboard, 'invoices')} /> : null}
        {activeLane === 'payouts' ? <PayPalPayoutLane readiness={getResourceReadiness(resource, dashboard, 'payouts')} /> : null}
        {activeLane === 'orders' ? (
          <PayPalOrdersLane
            payload={resource}
            readiness={readiness}
            onLookupOrder={(orderId) => setLaneQuery('orders', { orderId })}
            onClearOrder={() => setLaneQuery('orders', {})}
          />
        ) : null}
        {activeLane === 'transactions' ? (
          <PayPalTransactionsLane
            payload={resource}
            readiness={readiness}
            onSearchTransactions={(query) => setLaneQuery('transactions', query)}
            onShowTransferlyTransactions={() => setLaneQuery('transactions', {})}
          />
        ) : null}
        {activeLane === 'webhooks' ? <PayPalWebhookLane payload={resource} readiness={readiness} /> : null}
        {activeLane === 'developer' ? <PayPalDeveloperLane payload={resource} readiness={readiness} manifest={manifest} /> : null}
        {activeLane === 'settings' ? <PayPalSettingsLane payload={resource} readiness={readiness} /> : null}
        {!['overview', 'invoices', 'payouts', 'orders', 'transactions', 'webhooks', 'developer', 'settings'].includes(activeLane) ? (
          <PayPalPreparedLane lane={activeLane} payload={resource} readiness={readiness} />
        ) : null}
      </div>
    </ProviderWorkspaceShell>
  );
}
