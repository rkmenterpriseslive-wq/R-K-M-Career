import React from 'react';
import Button from './Button';

interface PopupProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  buttonText: string;
  onClose: () => void;
}

const SuccessIcon = () => (
  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const InfoIcon = () => (
    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const Popup: React.FC<PopupProps> = ({ isOpen, type, title, message, buttonText, onClose }) => {
  if (!isOpen) return null;

  const typeStyles = {
    success: {
      borderColor: 'border-green-500',
      iconBg: 'bg-green-500',
      buttonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      icon: <SuccessIcon />
    },
    error: {
      borderColor: 'border-red-500',
      iconBg: 'bg-red-500',
      buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: <ErrorIcon />
    },
    info: {
        borderColor: 'border-blue-500',
        iconBg: 'bg-blue-500',
        buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        icon: <InfoIcon />
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in" role="dialog" aria-modal="true">
      <div className={`relative bg-white w-full max-w-sm rounded-lg shadow-xl border-t-4 ${styles.borderColor}`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6 pt-10 text-center">
          {/* Icon */}
          <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${styles.iconBg}`}>
            {styles.icon}
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>

          {/* Action Button */}
          <div className="mt-6">
            <Button
              onClick={onClose}
              className={`w-full justify-center ${styles.buttonClass}`}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
