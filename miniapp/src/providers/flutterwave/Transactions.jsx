import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function FlutterwaveTransactions() {
  return (
    <ProviderShell title="Flutterwave Transactions" status="connected">
      <div className="rounded-lg border p-4">Transactions list will appear here.</div>
    </ProviderShell>
  );
}
