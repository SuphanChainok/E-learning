"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import {
  type Company,
  type CompanyInfo,
  COMPANIES,
  COMPANIES_INFO,
  type PublicUser,
  isAdminRole,
} from "./types";

interface CompanyContextType {
  activeCompany: Company;
  setActiveCompany: (company: Company) => void;
  companyInfo: CompanyInfo;
  companies: Company[];
  allowedCompanies: Company[];
  canSwitch: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = "aag_active_company";

export function CompanyProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: PublicUser | null;
}) {
  const [activeCompany, setActiveCompanyState] = useState<Company>("AGE");

  // Determine allowed companies based on user role and permissions
  const allowedCompanies: Company[] = user
    ? isAdminRole(user.role)
      ? [...COMPANIES]
      : user.allowedCompanies && user.allowedCompanies.length > 0
        ? user.allowedCompanies
        : user.company
          ? [user.company]
          : [...COMPANIES]
    : [...COMPANIES];

  const canSwitch = Boolean(user && (isAdminRole(user.role) || allowedCompanies.length > 1));

  // Initialize from user preference or localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY) as Company | null;
        if (stored && COMPANIES.includes(stored)) {
          if (allowedCompanies.includes(stored)) {
            setActiveCompanyState(stored);
            document.documentElement.setAttribute("data-company", stored);
            return;
          }
        }
      }
    } catch {
      // Ignore storage errors
    }

    if (user?.company && COMPANIES.includes(user.company)) {
      setActiveCompanyState(user.company);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-company", user.company);
      }
    }
  }, [user, allowedCompanies]);

  const setActiveCompany = useCallback(
    (company: Company) => {
      if (!COMPANIES.includes(company)) return;
      if (!allowedCompanies.includes(company) && user && !isAdminRole(user.role)) {
        return;
      }
      setActiveCompanyState(company);
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, company);
          document.documentElement.setAttribute("data-company", company);
        }
      } catch {
        // Ignore storage errors
      }
    },
    [allowedCompanies, user],
  );

  const companyInfo = COMPANIES_INFO[activeCompany] || COMPANIES_INFO.AGE;

  return (
    <CompanyContext.Provider
      value={{
        activeCompany,
        setActiveCompany,
        companyInfo,
        companies: COMPANIES,
        allowedCompanies,
        canSwitch,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextType {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    return {
      activeCompany: "AGE",
      setActiveCompany: () => {},
      companyInfo: COMPANIES_INFO.AGE,
      companies: COMPANIES,
      allowedCompanies: [...COMPANIES],
      canSwitch: true,
    };
  }
  return ctx;
}

