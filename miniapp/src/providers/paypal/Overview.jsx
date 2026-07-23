import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function PayPalOverview() {
  return (
    <ProviderShell title="PayPal Overview" status="connected">
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">Balance: <strong>Loading...</strong></div>
        <div className="rounded-lg border p-4">Recent invoices: <em>Not loaded</em></div>
      </div>
    </ProviderShell>
  );
}
