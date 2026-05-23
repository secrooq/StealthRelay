'use client';

import React, { createContext, useContext, useState } from 'react';

type VaultContextType = {
  vaultKey: string | null;
  setVaultKey: (key: string | null) => void;
  isLocked: boolean;
};

const VaultContext = createContext<VaultContextType>({
  vaultKey: null,
  setVaultKey: () => {},
  isLocked: true
});

export const VaultProvider = ({ children }: { children: React.ReactNode }) => {
  const [vaultKey, setVaultKeyInternal] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("stealth_vault_key");
    }
    return null;
  });

  const setVaultKey = (key: string | null) => {
    setVaultKeyInternal(key);
    if (typeof window !== "undefined") {
      if (key) {
        sessionStorage.setItem("stealth_vault_key", key);
      } else {
        sessionStorage.removeItem("stealth_vault_key");
      }
    }
  };

  return (
    <VaultContext.Provider value={{ vaultKey, setVaultKey, isLocked: !vaultKey }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => useContext(VaultContext);
