import { useEffect, useMemo, useRef, useState } from "react";

const tabs = [
  { id: "personal", label: "Dados pessoais" },
  { id: "documents", label: "Documentos" },
  { id: "address", label: "Endereco" },
  { id: "checkin", label: "Check-in / FNRH" },
  { id: "attachments", label: "Anexos" },
  { id: "notes", label: "Observacoes" }
];

const initialUpload = {
  documentType: "RG/CIN",
  description: "",
  file: null
};

function getAge(dateString) {
  if (!dateString) {
    return null;
  }

  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function GuestFormModal({
  isOpen,
  mode,
  guest,
  documents,
  onClose,
  onSubmit,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  isSubmitting,
  errorMessage
}) {
  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState({});
  const [uploadForm, setUploadForm] = useState(initialUpload);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      nome: guest?.nome || "",
      nome_social: guest?.nome_social || "",
      data_nascimento: guest?.data_nascimento || "",
      genero: guest?.genero || "",
      nacionalidade: guest?.nacionalidade || "Brasileira",
      profissao: guest?.profissao || "",
      tipo_documento: guest?.tipo_documento || "CPF",
      numero_documento: guest?.numero_documento || guest?.cpf || "",
      orgao_emissor: guest?.orgao_emissor || "",
      uf_emissor: guest?.uf_emissor || "",
      data_emissao_documento: guest?.data_emissao_documento || "",
      cpf: guest?.cpf || "",
      validade_documento: guest?.validade_documento || "",
      telefone: guest?.telefone || "",
      whatsapp: guest?.whatsapp || "",
      email: guest?.email || "",
      cep: guest?.cep || "",
      logradouro: guest?.logradouro || "",
      numero_endereco: guest?.numero_endereco || "",
      complemento: guest?.complemento || "",
      bairro: guest?.bairro || "",
      cidade: guest?.cidade || "",
      uf: guest?.uf || "",
      pais: guest?.pais || "Brasil",
      motivo_viagem: guest?.motivo_viagem || "",
      meio_transporte: guest?.meio_transporte || "",
      procedencia: guest?.procedencia || "",
      destino: guest?.destino || "",
      data_prevista_chegada: guest?.data_prevista_chegada || "",
      data_prevista_saida: guest?.data_prevista_saida || "",
      observacoes_internas: guest?.observacoes_internas || "",
      responsavel_legal_nome: guest?.responsavel_legal_nome || "",
      responsavel_legal_cpf: guest?.responsavel_legal_cpf || "",
      responsavel_legal_documento: guest?.responsavel_legal_documento || "",
      responsavel_legal_telefone: guest?.responsavel_legal_telefone || "",
      responsavel_legal_parentesco: guest?.responsavel_legal_parentesco || "",
      responsavel_legal_observacoes: guest?.responsavel_legal_observacoes || "",
      autorizacao_anexada: Boolean(guest?.autorizacao_anexada),
      consentimento_lgpd: Boolean(guest?.consentimento_lgpd),
      consentimento_lgpd_em: guest?.consentimento_lgpd_em || "",
      finalidade_lgpd: guest?.finalidade_lgpd || "Hospedagem, obrigacao legal e controle operacional",
      documento_conferido: Boolean(guest?.documento_conferido),
      documento_conferido_em: guest?.documento_conferido_em || "",
      documento_conferido_por: guest?.documento_conferido_por || ""
    });
    setUploadForm(initialUpload);
    setActiveTab("personal");
  }, [guest, isOpen]);

  const guestAge = useMemo(() => getAge(form.data_nascimento), [form.data_nascimento]);
  const isMinor = guestAge !== null ? guestAge < 18 : false;

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  async function handleDocumentUpload(event) {
    event.preventDefault();
    if (!guest?.id || !uploadForm.file) {
      return;
    }

    await onUploadDocument({
      file: uploadForm.file,
      documentType: uploadForm.documentType,
      description: uploadForm.description
    });
    setUploadForm(initialUpload);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="drawer-card guest-drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading room-form-heading">
          <div>
            <h2>{mode === "edit" ? "Editar hospede" : "Novo hospede completo"}</h2>
            <p>Cadastro profissional para reserva, check-in, FNRH e guarda documental.</p>
          </div>
          <div className="room-card-actions">
            {guest?.badges ? (
              <div className="guest-badge-row">
                {guest.badges.cadastro_completo ? <span className="status-pill status-hospedado">cadastro completo</span> : null}
                {guest.badges.documento_pendente ? <span className="status-pill status-pendente">documento pendente</span> : null}
                {guest.badges.documento_conferido ? <span className="status-pill status-confirmada">documento conferido</span> : null}
                {guest.badges.menor_idade ? <span className="status-pill status-cancelada">menor de idade</span> : null}
                {guest.badges.lgpd_pendente ? <span className="status-pill status-pre_reserva">LGPD pendente</span> : null}
              </div>
            ) : null}
            <button type="button" className="ghost-button" onClick={onClose}>Fechar</button>
          </div>
        </div>

        <div className="guest-tabs" role="tablist" aria-label="Secoes do cadastro">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ghost-button ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="room-form" onSubmit={handleSubmit}>
          {activeTab === "personal" ? (
            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Dados pessoais</h3>
                <p>Identificacao completa do hospede e dados civis basicos.</p>
              </div>
              <div className="room-form-grid">
                <label className="field span-two"><span>Nome completo</span><input name="nome" value={form.nome || ""} onChange={handleChange} required /></label>
                <label className="field"><span>Nome social</span><input name="nome_social" value={form.nome_social || ""} onChange={handleChange} /></label>
                <label className="field"><span>Data de nascimento</span><input name="data_nascimento" type="date" value={form.data_nascimento || ""} onChange={handleChange} /></label>
                <label className="field"><span>Sexo / genero</span><select name="genero" value={form.genero || ""} onChange={handleChange}><option value="">Selecione</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="nao_informado">Nao informar</option></select></label>
                <label className="field"><span>Nacionalidade</span><input name="nacionalidade" value={form.nacionalidade || ""} onChange={handleChange} /></label>
                <label className="field"><span>Profissao</span><input name="profissao" value={form.profissao || ""} onChange={handleChange} /></label>
              </div>
              {guestAge !== null ? <div className="summary-box"><span>Idade calculada</span><strong>{guestAge} anos</strong></div> : null}
            </section>
          ) : null}

          {activeTab === "documents" ? (
            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Documentos e contato</h3>
                <p>Dados obrigatorios para reserva, check-in e conferencia presencial.</p>
              </div>
              <div className="room-form-grid">
                <label className="field"><span>Tipo de documento</span><select name="tipo_documento" value={form.tipo_documento || ""} onChange={handleChange}><option value="CPF">CPF</option><option value="RG">RG</option><option value="CIN">CIN</option><option value="CNH">CNH</option><option value="Passaporte">Passaporte</option><option value="RNE/CRNM">RNE/CRNM</option><option value="Certidao de nascimento">Certidao de nascimento</option><option value="Outro">Outro</option></select></label>
                <label className="field"><span>Numero do documento</span><input name="numero_documento" value={form.numero_documento || ""} onChange={handleChange} required /></label>
                <label className="field"><span>Orgao emissor</span><input name="orgao_emissor" value={form.orgao_emissor || ""} onChange={handleChange} /></label>
                <label className="field"><span>UF emissor</span><input name="uf_emissor" value={form.uf_emissor || ""} onChange={handleChange} maxLength="2" /></label>
                <label className="field"><span>Data de emissao</span><input name="data_emissao_documento" type="date" value={form.data_emissao_documento || ""} onChange={handleChange} /></label>
                <label className="field"><span>CPF</span><input name="cpf" value={form.cpf || ""} onChange={handleChange} /></label>
                <label className="field"><span>Validade do documento</span><input name="validade_documento" type="date" value={form.validade_documento || ""} onChange={handleChange} /></label>
                <label className="field"><span>Telefone principal</span><input name="telefone" value={form.telefone || ""} onChange={handleChange} required /></label>
                <label className="field"><span>WhatsApp</span><input name="whatsapp" value={form.whatsapp || ""} onChange={handleChange} /></label>
                <label className="field span-two"><span>E-mail</span><input name="email" type="email" value={form.email || ""} onChange={handleChange} /></label>
              </div>
              <div className="summary-box">
                <span>Documento conferido</span>
                <label className="checkbox-line">
                  <input type="checkbox" name="documento_conferido" checked={Boolean(form.documento_conferido)} onChange={handleChange} />
                  <span>Marcado no check-in</span>
                </label>
              </div>
            </section>
          ) : null}

          {activeTab === "address" ? (
            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Endereco</h3>
                <p>Dados cadastrais para localizacao, nota e obrigacoes legais.</p>
              </div>
              <div className="room-form-grid">
                <label className="field"><span>CEP</span><input name="cep" value={form.cep || ""} onChange={handleChange} /></label>
                <label className="field span-two"><span>Logradouro</span><input name="logradouro" value={form.logradouro || ""} onChange={handleChange} /></label>
                <label className="field"><span>Numero</span><input name="numero_endereco" value={form.numero_endereco || ""} onChange={handleChange} /></label>
                <label className="field"><span>Complemento</span><input name="complemento" value={form.complemento || ""} onChange={handleChange} /></label>
                <label className="field"><span>Bairro</span><input name="bairro" value={form.bairro || ""} onChange={handleChange} /></label>
                <label className="field"><span>Cidade</span><input name="cidade" value={form.cidade || ""} onChange={handleChange} /></label>
                <label className="field"><span>UF</span><input name="uf" value={form.uf || ""} onChange={handleChange} maxLength="2" /></label>
                <label className="field"><span>Pais</span><input name="pais" value={form.pais || ""} onChange={handleChange} /></label>
              </div>
            </section>
          ) : null}

          {activeTab === "checkin" ? (
            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Check-in e FNRH</h3>
                <p>Informacoes operacionais de viagem, procedencia e permanencia.</p>
              </div>
              <div className="room-form-grid">
                <label className="field"><span>Motivo da viagem</span><select name="motivo_viagem" value={form.motivo_viagem || ""} onChange={handleChange}><option value="">Selecione</option><option value="lazer">Lazer</option><option value="negocios">Negocios</option><option value="saude">Saude</option><option value="evento">Evento</option><option value="outro">Outro</option></select></label>
                <label className="field"><span>Meio de transporte</span><input name="meio_transporte" value={form.meio_transporte || ""} onChange={handleChange} /></label>
                <label className="field"><span>Procedencia</span><input name="procedencia" value={form.procedencia || ""} onChange={handleChange} /></label>
                <label className="field"><span>Destino</span><input name="destino" value={form.destino || ""} onChange={handleChange} /></label>
                <label className="field"><span>Data prevista de chegada</span><input name="data_prevista_chegada" type="date" value={form.data_prevista_chegada || ""} onChange={handleChange} /></label>
                <label className="field"><span>Data prevista de saida</span><input name="data_prevista_saida" type="date" value={form.data_prevista_saida || ""} onChange={handleChange} /></label>
              </div>
            </section>
          ) : null}

          {activeTab === "attachments" ? (
            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Documentos anexados</h3>
                <p>Upload seguro de arquivos para conferencia e arquivamento operacional.</p>
              </div>
              {guest?.id ? (
                <>
                  <form className="guest-document-upload" onSubmit={handleDocumentUpload}>
                    <select value={uploadForm.documentType} onChange={(event) => setUploadForm((current) => ({ ...current, documentType: event.target.value }))}>
                      <option value="RG/CIN">RG/CIN</option>
                      <option value="CPF">CPF</option>
                      <option value="CNH">CNH</option>
                      <option value="Passaporte">Passaporte</option>
                      <option value="Comprovante de residencia">Comprovante de residencia</option>
                      <option value="Autorizacao de menor">Autorizacao de menor</option>
                      <option value="Documento do responsavel">Documento do responsavel</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <input type="text" placeholder="Descricao do arquivo" value={uploadForm.description} onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))} />
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
                    <button type="submit" className="primary-button" disabled={!uploadForm.file || isSubmitting}>Anexar documento</button>
                  </form>
                  <div className="stack-list">
                    {(documents || []).length ? (documents || []).map((document) => (
                      <div key={document.id} className="guest-document-row">
                        <div>
                          <strong>{document.document_type}</strong>
                          <span>{document.original_filename}</span>
                          <small>{document.description || "Sem descricao"} • {document.uploaded_by} • {new Date(document.uploaded_at).toLocaleString("pt-BR")}</small>
                        </div>
                        <div className="room-card-actions">
                          <button type="button" className="ghost-button" onClick={() => onViewDocument(document)}>Visualizar</button>
                          <button type="button" className="ghost-button" onClick={() => onDownloadDocument(document)}>Baixar</button>
                          <button type="button" className="danger-button" onClick={() => onDeleteDocument(document)}>Remover</button>
                        </div>
                      </div>
                    )) : <div className="empty-state">Nenhum documento anexado ate o momento.</div>}
                  </div>
                </>
              ) : (
                <div className="empty-state">Salve o hospede primeiro para liberar os anexos.</div>
              )}
            </section>
          ) : null}

          {activeTab === "notes" ? (
            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>LGPD, observacoes e responsavel legal</h3>
                <p>Controle de consentimento, pendencias e observacoes internas.</p>
              </div>
              <div className="room-form-grid">
                <label className="field span-two"><span>Observacoes internas</span><textarea name="observacoes_internas" rows="4" value={form.observacoes_internas || ""} onChange={handleChange} /></label>
                <label className="field span-two"><span>Finalidade do armazenamento</span><textarea name="finalidade_lgpd" rows="3" value={form.finalidade_lgpd || ""} onChange={handleChange} /></label>
                <label className="checkbox-line span-two">
                  <input type="checkbox" name="consentimento_lgpd" checked={Boolean(form.consentimento_lgpd)} onChange={handleChange} />
                  <span>Hospede autorizou o armazenamento dos dados e documentos para fins de hospedagem, obrigacao legal e controle operacional.</span>
                </label>
              </div>

              {isMinor ? (
                <div className="guest-guardian-section">
                  <div className="room-form-section-head">
                    <h3>Responsavel legal</h3>
                    <p>Obrigatorio para menores de idade.</p>
                  </div>
                  <div className="room-form-grid">
                    <label className="field"><span>Nome do responsavel</span><input name="responsavel_legal_nome" value={form.responsavel_legal_nome || ""} onChange={handleChange} required={isMinor} /></label>
                    <label className="field"><span>CPF do responsavel</span><input name="responsavel_legal_cpf" value={form.responsavel_legal_cpf || ""} onChange={handleChange} required={isMinor} /></label>
                    <label className="field"><span>Documento do responsavel</span><input name="responsavel_legal_documento" value={form.responsavel_legal_documento || ""} onChange={handleChange} /></label>
                    <label className="field"><span>Telefone do responsavel</span><input name="responsavel_legal_telefone" value={form.responsavel_legal_telefone || ""} onChange={handleChange} required={isMinor} /></label>
                    <label className="field"><span>Grau de parentesco</span><input name="responsavel_legal_parentesco" value={form.responsavel_legal_parentesco || ""} onChange={handleChange} /></label>
                    <label className="checkbox-line">
                      <input type="checkbox" name="autorizacao_anexada" checked={Boolean(form.autorizacao_anexada)} onChange={handleChange} />
                      <span>Autorizacao anexada</span>
                    </label>
                    <label className="field span-two"><span>Observacoes do responsavel</span><textarea name="responsavel_legal_observacoes" rows="3" value={form.responsavel_legal_observacoes || ""} onChange={handleChange} /></label>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

          <div className="room-form-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : mode === "edit" ? "Salvar alteracoes" : "Salvar hospede"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
