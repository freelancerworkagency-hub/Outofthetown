import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Customer } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  customer: Customer | null;
  customerToken: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authReason: string;
  openAuthModal: (reason?: string, onSuccessCallback?: () => void) => void;
  closeAuthModal: () => void;
  sendOtp: (email: string, phone: string, name?: string) => Promise<{ message: string; otpPreview?: string }>;
  verifyOtp: (email: string, phone: string, otp: string, name?: string) => Promise<boolean>;
  logout: () => void;
  requireAuth: (onSuccessAction: () => void, reason?: string) => void;
  updateCustomerProfile: (updated: Partial<Customer>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_CUSTOMER_KEY = 'ott_customer_session';
const STORAGE_TOKEN_KEY = 'ott_customer_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string>('order');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Sync token & customer to localStorage
  useEffect(() => {
    if (customer && customerToken) {
      localStorage.setItem(STORAGE_CUSTOMER_KEY, JSON.stringify(customer));
      localStorage.setItem(STORAGE_TOKEN_KEY, customerToken);
    } else {
      localStorage.removeItem(STORAGE_CUSTOMER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  }, [customer, customerToken]);

  const openAuthModal = (reason: string = 'order', onSuccessCallback?: () => void) => {
    setAuthReason(reason);
    if (onSuccessCallback) {
      setPendingCallback(() => onSuccessCallback);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingCallback(null);
  };

  const requireAuth = (onSuccessAction: () => void, reason: string = 'order') => {
    if (customer && customerToken) {
      onSuccessAction();
      return;
    }
    openAuthModal(reason, onSuccessAction);
  };

  const sendOtp = async (email: string, phone: string, name?: string) => {
    return await api.sendCustomerOtp({ email, phone, name });
  };

  const verifyOtp = async (email: string, phone: string, otp: string, name?: string): Promise<boolean> => {
    try {
      const result = await api.verifyCustomerOtp({ email, phone, otp, name });
      setCustomer(result.customer);
      setCustomerToken(result.token);
      setIsAuthModalOpen(false);

      // Execute pending action (e.g. checkout or reservation)
      if (pendingCallback) {
        const cb = pendingCallback;
        setPendingCallback(null);
        setTimeout(() => cb(), 100);
      }

      return true;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setCustomer(null);
    setCustomerToken(null);
    localStorage.removeItem(STORAGE_CUSTOMER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  };

  const updateCustomerProfile = (updated: Partial<Customer>) => {
    if (customer) {
      const merged = { ...customer, ...updated };
      setCustomer(merged);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        customerToken,
        isAuthenticated: Boolean(customer && customerToken),
        isAuthModalOpen,
        authReason,
        openAuthModal,
        closeAuthModal,
        sendOtp,
        verifyOtp,
        logout,
        requireAuth,
        updateCustomerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
