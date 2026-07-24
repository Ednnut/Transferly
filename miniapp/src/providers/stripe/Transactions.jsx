import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function StripeTransactions() {
  return (
    <ProviderShell title="Stripe Transactions" status="connected">
      <div className="rounded-lg border p-4">Transactions list will appear here.</div>
    </ProviderShell>
  );
}
