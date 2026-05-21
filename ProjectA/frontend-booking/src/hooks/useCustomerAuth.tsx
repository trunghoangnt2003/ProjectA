import { createContext, useContext, useState, type ReactNode } from "react";
import type { CustomerAccount } from "../types/domain";
import { customerAuthService } from "../services/customerAuthService";

interface AuthContextValue {
  customer: CustomerAccount | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (input: { name: string; phone: string; email?: string; password: string }) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "bk_customer";

const AuthContext = createContext<AuthContextValue>({
  customer: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

function load(): CustomerAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomerAccount) : null;
  } catch {
    return null;
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerAccount | null>(load);

  const persist = (c: CustomerAccount | null) => {
    setCustomer(c);
    if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (phone: string, password: string) => {
    persist(await customerAuthService.login(phone, password));
  };

  const register = async (input: { name: string; phone: string; email?: string; password: string }) => {
    persist(await customerAuthService.register(input));
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ customer, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(AuthContext);
}
