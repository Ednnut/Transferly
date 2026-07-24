import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function WiseTransactions() {
  return (
    <ProviderShell title="Wise Transfers" status="connected">
      <div className="rounded-lg border p-4">Transfers list will appear here.</div>
    </ProviderShell>
  );
}
