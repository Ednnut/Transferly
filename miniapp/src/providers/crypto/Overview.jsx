import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function CryptoOverview() {
  return (
    <ProviderShell title="Crypto Commerce Overview" status="connected">
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">Charges: <strong>Loading...</strong></div>
        <div className="rounded-lg border p-4">Recent activity: <em>Not loaded</em></div>
      </div>
    </ProviderShell>
  );
}
