import React, {createContext, useContext, useState} from 'react';

const LaWalletContext = createContext<{
  isLogged: boolean;
  login: (apiEndpoint: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export const LaWalletProvider = ({children}) => {
  const [isLogged, setIsLogged] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');

  const login = async (_apiEndpoint: string) => {
    setApiEndpoint(_apiEndpoint);
    setIsLogged(true);
  };

  const logout = () => {
    setIsLogged(false);
    setApiEndpoint('');
  };

  return (
    <LaWalletContext.Provider value={{isLogged, login, logout}}>
      {children}
    </LaWalletContext.Provider>
  );
};

export const useLaWallet = () => useContext(LaWalletContext);
