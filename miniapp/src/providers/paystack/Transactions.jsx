import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function PaystackTransactions() {
  return (
    <ProviderShell title="Paystack Transactions" status="connected">
      <div className="rounded-lg border p-4">Transactions list will appear here.</div>
    </ProviderShell>
  );
}
