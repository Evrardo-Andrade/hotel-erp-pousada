import { useEffect, useMemo, useRef, useState } from "react";
import { useCompany } from "../../app/company.jsx";
import { useTheme } from "../../app/theme.jsx";

const initialForm = {
  trade_name: "",
  legal_name: "",
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
  primary_color: "#00A846",
  default_theme: "classic-light",
  admin_name: "",
  admin_email: "",
  admin_phone: "",
  admin_user_id: "",
  admin_access_profile: "admin"
};

export function SettingsPage() {
  const { company, saveCompany, saveCompanyLogo, removeCompanyLogo, isLoadingCompany } = useCompany();
  const { theme, setTheme, themeOptions } = useTheme();
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm({
      ...initialForm,
      ...(company || {}),
      default_theme: company?.default_theme || theme
    });
  }, [company, theme]);

  const previewLogo = useMemo(() => company?.logo_url || "", [company]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const updated = await saveCompany({
        ...form,
        subtitle: "Hotel ERP - Operacao e fiscal"
      });

      if (updated.default_theme && updated.default_theme !== theme) {
        setTheme(updated.default_theme);
      }

      setFeedback({ type: "success", message: "Perfil da empresa salvo com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel salvar o perfil da empresa." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsSubmitting(true);
      await saveCompanyLogo(file);
      setFeedback({ type: "success", message: "Logomarca atualizada com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel enviar a logomarca." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveLogo() {
    try {
      setIsSubmitting(true);
      await removeCompanyLogo();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFeedback({ type: "success", message: "Logomarca removida com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel remover a logomarca." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  if (isLoadingCompany) {
    return <div className="empty-state">Carregando perfil da empresa...</div>;
  }

  return (
    <section className="page-grid settings-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Perfil da Empresa</h2>
            <p>Dados cadastrais, identidade visual e administrador principal do Hotel ERP.</p>
          </div>
        </div>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}

        <form className="room-form" onSubmit={handleSubmit}>
          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Dados da empresa</h3>
              <p>Nome fantasia, razao social e informacoes fiscais basicas.</p>
            </div>
            <div className="room-form-grid">
              <label className="field"><span>Nome fantasia</span><input name="trade_name" value={form.trade_name} onChange={handleChange} /></label>
              <label className="field"><span>Razao social</span><input name="legal_name" value={form.legal_name} onChange={handleChange} /></label>
              <label className="field"><span>CNPJ</span><input name="cnpj" value={form.cnpj} onChange={handleChange} /></label>
              <label className="field"><span>Inscricao estadual</span><input name="state_registration" value={form.state_registration} onChange={handleChange} /></label>
              <label className="field"><span>Inscricao municipal</span><input name="municipal_registration" value={form.municipal_registration} onChange={handleChange} /></label>
              <label className="field"><span>CNAE</span><input name="cnae" value={form.cnae} onChange={handleChange} /></label>
              <label className="field"><span>Regime tributario</span><select name="tax_regime" value={form.tax_regime} onChange={handleChange}><option value="">Selecione</option><option value="Simples Nacional">Simples Nacional</option><option value="Lucro Presumido">Lucro Presumido</option><option value="Lucro Real">Lucro Real</option></select></label>
              <label className="field"><span>Telefone</span><input name="phone" value={form.phone} onChange={handleChange} /></label>
              <label className="field"><span>WhatsApp</span><input name="whatsapp" value={form.whatsapp} onChange={handleChange} /></label>
              <label className="field"><span>E-mail</span><input name="email" type="email" value={form.email} onChange={handleChange} /></label>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Endereco</h3>
              <p>Endereco principal da empresa/pousada.</p>
            </div>
            <div className="room-form-grid">
              <label className="field"><span>CEP</span><input name="zip_code" value={form.zip_code} onChange={handleChange} /></label>
              <label className="field span-two"><span>Logradouro</span><input name="street" value={form.street} onChange={handleChange} /></label>
              <label className="field"><span>Numero</span><input name="number" value={form.number} onChange={handleChange} /></label>
              <label className="field"><span>Complemento</span><input name="complement" value={form.complement} onChange={handleChange} /></label>
              <label className="field"><span>Bairro</span><input name="district" value={form.district} onChange={handleChange} /></label>
              <label className="field"><span>Cidade</span><input name="city" value={form.city} onChange={handleChange} /></label>
              <label className="field"><span>UF</span><input name="state" value={form.state} onChange={handleChange} maxLength="2" /></label>
              <label className="field"><span>Pais</span><input name="country" value={form.country} onChange={handleChange} /></label>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Identidade visual</h3>
              <p>Logo, cor principal e tema visual padrao.</p>
            </div>
            <div className="company-profile-layout">
              <div className="company-logo-card">
                <div className="company-logo-preview">
                  {previewLogo ? (
                    <img src={previewLogo} alt={form.trade_name || "Empresa"} />
                  ) : (
                    <div>Sem logo</div>
                  )}
                </div>
                <div className="room-card-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={handleLogoChange}
                    disabled={isSubmitting}
                  />
                  <button type="button" className="ghost-button" onClick={handleRemoveLogo} disabled={isSubmitting || !previewLogo}>
                    Remover logo
                  </button>
                </div>
              </div>
              <div className="room-form-grid">
                <label className="field"><span>Cor principal da marca</span><input name="primary_color" type="color" value={form.primary_color} onChange={handleChange} /></label>
                <label className="field"><span>Tema visual padrao</span><select name="default_theme" value={form.default_theme} onChange={handleChange}>{themeOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}</select></label>
              </div>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Administrador</h3>
              <p>Responsavel principal pelo ambiente SaaS.</p>
            </div>
            <div className="room-form-grid">
              <label className="field"><span>Nome do administrador</span><input name="admin_name" value={form.admin_name} onChange={handleChange} /></label>
              <label className="field"><span>E-mail do administrador</span><input name="admin_email" type="email" value={form.admin_email} onChange={handleChange} /></label>
              <label className="field"><span>Telefone</span><input name="admin_phone" value={form.admin_phone} onChange={handleChange} /></label>
              <label className="field"><span>Usuario / login</span><input name="admin_user_id" value={form.admin_user_id} onChange={handleChange} /></label>
              <label className="field"><span>Perfil de acesso</span><select name="admin_access_profile" value={form.admin_access_profile} onChange={handleChange}><option value="admin">Admin</option><option value="gerente">Gerente</option><option value="recepcao">Recepcao</option><option value="financeiro">Financeiro</option></select></label>
            </div>
          </section>

          <div className="room-form-actions">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar perfil da empresa"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
