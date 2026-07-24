import React from 'react';
import ProviderShell from '../shared/BaseProviderUI';

export default function CryptoTransactions() {
  return (
    <ProviderShell title="Crypto Charges" status="connected">
      <div className="rounded-lg border p-4">Charges list will appear here.</div>
    </ProviderShell>
  );
}
