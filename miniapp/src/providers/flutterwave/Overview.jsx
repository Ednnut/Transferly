import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function FlutterwaveOverview() {
  return (
    <ProviderShell title="Flutterwave Overview" status="connected">
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">Balance: <strong>Loading...</strong></div>
        <div className="rounded-lg border p-4">Recent transactions: <em>Not loaded</em></div>
      </div>
    </ProviderShell>
  );
}
