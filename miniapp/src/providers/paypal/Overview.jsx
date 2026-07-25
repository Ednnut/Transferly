import React from 'react';
import { FileText, Send, Shield, Zap } from 'lucide-react';
import { ProviderOverview } from '../shared/BaseProviderUI';

/**
 * PayPalOverview — Overview tab for the PayPal provider workspace.
 *
 * Injects PayPal-specific callouts (invoice summary, payout summary,
 * quick-action chips) below the shared metrics via the `children` slot.
 */
export default function PayPalOverview({ manifest, dashboard, snapshot, loading, error }) {
  return (
    <ProviderOverview
      manifest={manifest}
      dashboard={dashboard}
      snapshot={snapshot}
      loading={loading}
      error={error}
    >
      {/* PayPal-specific callout section */}
      <section className="space-y-3">
        {/* Quick-action chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: FileText, label: 'Create Invoice', hint: 'Send a PayPal invoice to a buyer' },
            { icon: Send, label: 'Request Payout', hint: 'Send funds to a PayPal account' },
            { icon: Shield, label: 'Check Disputes', hint: 'Review open PayPal disputes' },
            { icon: Zap, label: 'Webhook Events', hint: 'Recent PayPal webhook deliveries' }
          ].map(({ icon: Icon, label, hint }) => (
            <button
              key={label}
              type="button"
              title={hint}
              aria-label={hint}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-2xl border border-[var(--miniapp-border-color)] bg-[var(--miniapp-card-surface)] px-3 text-xs font-black text-[var(--miniapp-text-primary)] transition-opacity hover:opacity-80 active:opacity-60"
            >
              <Icon size={13} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* PayPal stat callouts */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-[var(--miniapp-border-color)] bg-[var(--miniapp-secondary-surface)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--miniapp-text-muted)]">
              Invoices
            </p>
            <p className="mt-2 text-base font-black text-[var(--miniapp-text-primary)]">
              {dashboard?.invoices?.total ?? dashboard?.recent_invoices?.length ?? '—'}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--miniapp-text-muted)]">
              PayPal invoice collection · INVOICING.INVOICE.PAID → pending_balance
            </p>
          </div>
          <div className="rounded-[22px] border border-[var(--miniapp-border-color)] bg-[var(--miniapp-secondary-surface)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--miniapp-text-muted)]">
              Payouts
            </p>
            <p className="mt-2 text-base font-black text-[var(--miniapp-text-primary)]">
              {dashboard?.payouts?.total ?? dashboard?.recent_payouts?.length ?? '—'}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--miniapp-text-muted)]">
              PayPal mass payout · risk-checked · ledger-reserved
            </p>
          </div>
        </div>

        {/* PayPal environment badge */}
        <div className="rounded-[22px] border border-[var(--miniapp-border-color)] bg-[var(--miniapp-secondary-surface)] px-4 py-3">
          <p className="text-xs font-black text-[var(--miniapp-text-muted)]">
            Environment:{' '}
            <span className="font-black text-[var(--miniapp-text-primary)]">
              {snapshot?.environment ?? dashboard?.environment ?? 'sandbox'}
            </span>
            {' · '}
            Webhook ID set:{' '}
            <span className="font-black text-[var(--miniapp-text-primary)]">
              {snapshot?.configured ? 'yes' : 'no'}
            </span>
          </p>
        </div>
      </section>
    </ProviderOverview>
  );
}
