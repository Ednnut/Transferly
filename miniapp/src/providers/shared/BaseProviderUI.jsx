import React from 'react';

export function ProviderShell({ children, title, status }) {
  return (
    <div className="provider-shell space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-black">{title}</h1>
        <div className="text-sm text-slate-500">{status}</div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default ProviderShell;
