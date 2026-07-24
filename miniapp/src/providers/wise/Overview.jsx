import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function WiseOverview() {
  return (
    <ProviderShell title="Wise Overview" status="connected">
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">Balances: <strong>Loading...</strong></div>
        <div className="rounded-lg border p-4">Recent transfers: <em>Not loaded</em></div>
      </div>
    </ProviderShell>
  );
}
