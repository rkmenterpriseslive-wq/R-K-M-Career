import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

export interface PopupConfig {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  buttonText?: string;
}

interface PopupContextType {
  showPopup: (config: PopupConfig) => void;
  hidePopup: () => void;
  popupConfig: PopupConfig & { isOpen: boolean };
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [popupConfig, setPopupConfig] = useState<PopupContextType['popupConfig']>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    buttonText: '',
  });

  const showPopup = useCallback((config: PopupConfig) => {
    setPopupConfig({
      ...config,
      isOpen: true,
      buttonText: config.buttonText || (config.type === 'error' ? 'Try Again' : 'Continue'),
    });
  }, []);

  const hidePopup = useCallback(() => {
    setPopupConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <PopupContext.Provider value={{ showPopup, hidePopup, popupConfig }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = (): PopupContextType => {
  const context = useContext(PopupContext);
  if (context === undefined) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};
