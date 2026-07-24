import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function StripeOverview() {
  return (
    <ProviderShell title="Stripe Overview" status="connected">
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">Balance: <strong>Loading...</strong></div>
        <div className="rounded-lg border p-4">Recent payments: <em>Not loaded</em></div>
      </div>
    </ProviderShell>
  );
}
