import React, { createContext, useState } from 'react';

export const VaultContext = createContext();

export const VaultProvider = ({ children }) => {
  const [vaultKey, setVaultKey] = useState(null);

  return (
    <VaultContext.Provider value={{ vaultKey, setVaultKey }}>
      {children}
    </VaultContext.Provider>
  );
};
