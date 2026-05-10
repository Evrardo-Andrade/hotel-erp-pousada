import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deleteCompanyLogo, fetchCompanySettings, updateCompanySettings, uploadCompanyLogo } from "../services/api";
import { useAuth } from "./auth.jsx";
import { useTheme } from "./theme.jsx";

const CompanyContext = createContext(null);

const fallbackProfile = {
  trade_name: "Click7 Systems",
  legal_name: "Click7 Systems",
  cnpj: "",
  state_registration: "",
  municipal_registration: "",
  cnae: "",
  tax_regime: "",
  phone: "",
  whatsapp: "",
  email: "",
  zip_code: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  country: "Brasil",
  logo_url: "",
  logo_filename: "",
  primary_color: "#00A846",
  default_theme: "classic-light",
  admin_name: "",
  admin_email: "",
  admin_phone: "",
  admin_user_id: "",
  admin_access_profile: "admin",
  subtitle: "Hotel ERP - Operacao e fiscal"
};

export function CompanyProvider({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { setTheme } = useTheme();
  const [company, setCompany] = useState(fallbackProfile);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!isAuthenticated) {
      setCompany(fallbackProfile);
      setIsLoadingCompany(false);
      return;
    }

    loadCompany();
  }, [isAuthenticated, isLoadingAuth]);

  async function loadCompany() {
    try {
      setIsLoadingCompany(true);
      const data = await fetchCompanySettings();
      const merged = { ...fallbackProfile, ...(data || {}) };
      setCompany(merged);
      if (!window.localStorage.getItem("hotel-erp-theme") && merged.default_theme) {
        setTheme(merged.default_theme);
      }
    } catch (_error) {
      setCompany(fallbackProfile);
    } finally {
      setIsLoadingCompany(false);
    }
  }

  async function saveCompany(payload) {
    const updated = await updateCompanySettings(payload);
    const merged = { ...fallbackProfile, ...(updated || {}) };
    setCompany(merged);
    if (merged.default_theme) {
      setTheme(merged.default_theme);
    }
    return merged;
  }

  async function saveCompanyLogo(file) {
    const updated = await uploadCompanyLogo(file);
    const merged = { ...fallbackProfile, ...(updated || {}) };
    setCompany(merged);
    return merged;
  }

  async function removeCompanyLogo() {
    const updated = await deleteCompanyLogo();
    const merged = { ...fallbackProfile, ...(updated || {}) };
    setCompany(merged);
    return merged;
  }

  const value = useMemo(() => ({
    company,
    isLoadingCompany,
    reloadCompany: loadCompany,
    saveCompany,
    saveCompanyLogo,
    removeCompanyLogo
  }), [company, isLoadingCompany]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider.");
  }
  return context;
}
