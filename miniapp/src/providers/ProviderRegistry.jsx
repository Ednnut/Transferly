import React, { createContext, useContext, useMemo } from 'react';

// Frontend Provider Registry — UI-level registry for provider modules
const ProviderContext = createContext({ providers: new Map(), register: () => {} });

export function ProviderRegistryProvider({ children, initialProviders = [] }) {
  const map = useMemo(() => new Map(initialProviders.map((p) => [p.id, p])), [initialProviders]);
  const value = useMemo(() => ({ providers: map, register: (p) => map.set(p.id, p) }), [map]);
  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
}

export function useProviderRegistry() {
  return useContext(ProviderContext);
}

export function useProvider(id) {
  const registry = useProviderRegistry();
  return registry.providers.get(id);
}

export default ProviderRegistryProvider;
