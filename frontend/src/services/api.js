const API_URL = import.meta.env.VITE_API_URL || "/api";
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL, window.location.origin).origin;
  } catch (_error) {
    return window.location.origin;
  }
})();

const AUTH_STORAGE_KEY = "hotel-erp-auth";
const AUTH_STORAGE_MODE_KEY = "hotel-erp-auth-storage";

function getAuthStorage(mode = null) {
  const storageMode = mode || window.localStorage.getItem(AUTH_STORAGE_MODE_KEY) || "local";
  return storageMode === "session" ? window.sessionStorage : window.localStorage;
}

export function getStoredAuthSession() {
  const localValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  const sessionValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  const raw = sessionValue || localValue;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export function setStoredAuthSession(session, remember = true) {
  const storageMode = remember === null
    ? window.localStorage.getItem(AUTH_STORAGE_MODE_KEY) || "local"
    : remember
      ? "local"
      : "session";
  const storage = getAuthStorage(storageMode);
  const serialized = JSON.stringify(session);

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.setItem(AUTH_STORAGE_MODE_KEY, storageMode);
  storage.setItem(AUTH_STORAGE_KEY, serialized);
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_MODE_KEY);
}

const fallbackStore = {
  "/dashboard": {
    roomStatus: [
      { status: "ocupado", total: 18 },
      { status: "livre", total: 7 },
      { status: "limpeza", total: 3 },
      { status: "manutencao", total: 1 }
    ],
    receitaDia: 8420,
    operacao: {
      checkins_hoje: 9,
      checkouts_hoje: 6
    },
    alertas: [
      {
        id: "1",
        tipo: "certificado",
        mensagem: "Certificado A1 vence em 20 dias",
        severidade: "alta"
      },
      {
        id: "2",
        tipo: "financeiro",
        mensagem: "3 despesas aguardando classificacao",
        severidade: "media"
      }
    ]
  },

  "/rooms": [
    {
      id: "1",
      numero: "101",
      tipo_acomodacao_id: "ta-1",
      tipo_quarto_id: "tq-1",
      tipo_acomodacao: "Apartamento",
      tipo_quarto: "Luxo",
      status: "ocupado",
      capacidade: 2,
      andar: 1,
      descricao: "Suite premium com varanda e vista para piscina.",
      comodidades: [
        { id: "am-1", nome: "Ar Condicionado" },
        { id: "am-2", nome: "Frigobar" },
        { id: "am-13", nome: "Varanda" },
        { id: "am-14", nome: "Vista piscina" }
      ]
    },
    {
      id: "2",
      numero: "102",
      tipo_acomodacao_id: "ta-1",
      tipo_quarto_id: "tq-2",
      tipo_acomodacao: "Apartamento",
      tipo_quarto: "Standard",
      status: "livre",
      capacidade: 2,
      andar: 1,
      descricao: "",
      comodidades: [
        { id: "am-5", nome: "Wi-Fi" },
        { id: "am-3", nome: "TV" }
      ]
    },
    {
      id: "3",
      numero: "201",
      tipo_acomodacao_id: "ta-2",
      tipo_quarto_id: "tq-3",
      tipo_acomodacao: "Chale",
      tipo_quarto: "Familia",
      status: "limpeza",
      capacidade: 5,
      andar: 2,
      descricao: "Chale familiar com mais espaco interno.",
      comodidades: [
        { id: "am-5", nome: "Wi-Fi" },
        { id: "am-8", nome: "Cama casal" },
        { id: "am-9", nome: "Sofa-cama" },
        { id: "am-15", nome: "Vista jardim" }
      ]
    },
    {
      id: "4",
      numero: "202",
      tipo_acomodacao_id: "ta-2",
      tipo_quarto_id: "tq-1",
      tipo_acomodacao: "Chale",
      tipo_quarto: "Luxo",
      status: "manutencao",
      capacidade: 4,
      andar: 2,
      descricao: "",
      comodidades: []
    }
  ],

  "/rooms/metadata": {
    tiposAcomodacao: [
      { id: "ta-1", nome: "Apartamento", descricao: "Unidade padrao em bloco principal", ativo: true },
      { id: "ta-2", nome: "Chale", descricao: "Unidade externa com mais privacidade", ativo: true },
      { id: "ta-3", nome: "Dormitorio", descricao: "Acomodacao coletiva", ativo: true }
    ],
    tiposQuarto: [
      { id: "tq-1", nome: "Luxo", descricao: "Categoria superior", ativo: true },
      { id: "tq-2", nome: "Standard", descricao: "Categoria funcional", ativo: true },
      { id: "tq-3", nome: "Familia", descricao: "Categoria para familias", ativo: true }
    ],
    comodidades: [
      { id: "am-1", nome: "Ar Condicionado", ativo: true },
      { id: "am-2", nome: "Frigobar", ativo: true },
      { id: "am-3", nome: "TV", ativo: true },
      { id: "am-4", nome: "Smart TV", ativo: true },
      { id: "am-5", nome: "Wi-Fi", ativo: true },
      { id: "am-6", nome: "Chuveiro quente", ativo: true },
      { id: "am-7", nome: "Cama king", ativo: true },
      { id: "am-8", nome: "Cama casal", ativo: true },
      { id: "am-9", nome: "Sofa-cama", ativo: true },
      { id: "am-10", nome: "Cofre", ativo: true },
      { id: "am-11", nome: "Secador", ativo: true },
      { id: "am-12", nome: "Micro-ondas", ativo: true },
      { id: "am-13", nome: "Varanda", ativo: true },
      { id: "am-14", nome: "Vista piscina", ativo: true },
      { id: "am-15", nome: "Vista jardim", ativo: true },
      { id: "am-16", nome: "Acessivel PCD", ativo: true }
    ]
  },

  "/reservations": [
    {
      id: "1",
      hospede_nome: "Marina Costa",
      quarto_numero: "101",
      data_checkin: "2026-04-21",
      data_checkout: "2026-04-25",
      status: "confirmada"
    },
    {
      id: "2",
      hospede_nome: "Joao Prado",
      quarto_numero: "201",
      data_checkin: "2026-04-21",
      data_checkout: "2026-04-23",
      status: "checkin_realizado"
    }
  ],

  "/guests": [
    {
      id: "1",
      nome: "Marina Costa",
      cpf: "123.456.789-00",
      nome_social: "",
      data_nascimento: "1990-08-12",
      genero: "feminino",
      nacionalidade: "Brasileira",
      profissao: "Arquiteta",
      tipo_documento: "CPF",
      numero_documento: "123.456.789-00",
      orgao_emissor: "SSP",
      uf_emissor: "SP",
      data_emissao_documento: "2018-02-18",
      validade_documento: "",
      email: "marina@email.com",
      telefone: "(11) 99999-9999",
      whatsapp: "(11) 99999-9999",
      cep: "01001-000",
      logradouro: "Rua das Flores",
      numero_endereco: "120",
      complemento: "Apto 45",
      bairro: "Centro",
      cidade: "Sao Paulo",
      uf: "SP",
      pais: "Brasil",
      motivo_viagem: "lazer",
      meio_transporte: "Carro",
      procedencia: "Sao Paulo/SP",
      destino: "Bonito/MS",
      data_prevista_chegada: "2026-05-12",
      data_prevista_saida: "2026-05-15",
      observacoes_internas: "Prefere apartamento silencioso.",
      responsavel_legal_nome: "",
      responsavel_legal_cpf: "",
      responsavel_legal_documento: "",
      responsavel_legal_telefone: "",
      responsavel_legal_parentesco: "",
      responsavel_legal_observacoes: "",
      autorizacao_anexada: false,
      consentimento_lgpd: true,
      consentimento_lgpd_em: "2026-05-08T10:00:00",
      finalidade_lgpd: "Hospedagem, obrigacao legal e controle operacional",
      documento_conferido: true,
      documento_conferido_em: "2026-05-08T10:15:00",
      documento_conferido_por: "Recepcao Manha",
      documents: [
        {
          id: "gd-1",
          guest_id: "1",
          document_type: "RG/CIN",
          original_filename: "rg-marina.pdf",
          stored_filename: "guest-gd-1.pdf",
          file_path: "/api/guests/1/documents/gd-1/view",
          mime_type: "application/pdf",
          file_size: 234567,
          description: "Documento principal apresentado no check-in",
          uploaded_by: "Recepcao Manha",
          uploaded_at: "2026-05-08T10:05:00",
          deleted_at: null,
          preview_url: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr",
          download_url: "/api/guests/1/documents/gd-1/download"
        }
      ]
    },
    {
      id: "2",
      nome: "Joao Prado",
      cpf: "987.654.321-00",
      nome_social: "",
      data_nascimento: "2012-06-21",
      genero: "masculino",
      nacionalidade: "Brasileira",
      profissao: "",
      tipo_documento: "Certidao de nascimento",
      numero_documento: "CERT-99881",
      orgao_emissor: "Cartorio Central",
      uf_emissor: "RJ",
      data_emissao_documento: "2012-06-25",
      validade_documento: "",
      email: "joao@email.com",
      telefone: "(21) 98888-8888",
      whatsapp: "(21) 98888-8888",
      cep: "20000-000",
      logradouro: "Avenida Atlantica",
      numero_endereco: "90",
      complemento: "",
      bairro: "Copacabana",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      pais: "Brasil",
      motivo_viagem: "lazer",
      meio_transporte: "Aviao",
      procedencia: "Rio de Janeiro/RJ",
      destino: "Corumba/MS",
      data_prevista_chegada: "2026-05-08",
      data_prevista_saida: "2026-05-11",
      observacoes_internas: "Hospede menor acompanhado da mae.",
      responsavel_legal_nome: "Fernanda Prado",
      responsavel_legal_cpf: "321.654.987-00",
      responsavel_legal_documento: "RG 44.555.666-7",
      responsavel_legal_telefone: "(21) 97777-0000",
      responsavel_legal_parentesco: "Mae",
      responsavel_legal_observacoes: "Autorizacao anexada na ficha digital.",
      autorizacao_anexada: true,
      consentimento_lgpd: false,
      consentimento_lgpd_em: "",
      finalidade_lgpd: "",
      documento_conferido: false,
      documento_conferido_em: "",
      documento_conferido_por: "",
      documents: [
        {
          id: "gd-2",
          guest_id: "2",
          document_type: "Autorizacao de menor",
          original_filename: "autorizacao-joao.png",
          stored_filename: "guest-gd-2.png",
          file_path: "/api/guests/2/documents/gd-2/view",
          mime_type: "image/png",
          file_size: 84532,
          description: "Autorizacao assinada pelo responsavel legal",
          uploaded_by: "Recepcao Manha",
          uploaded_at: "2026-05-08T14:18:00",
          deleted_at: null,
          preview_url: buildProductPlaceholder("Autorizacao"),
          download_url: "/api/guests/2/documents/gd-2/download"
        }
      ]
    }
  ],

  "/people/users": [
    {
      id: "user-1",
      nome: "Recepcao Manha",
      usuario: "recepcao.manha",
      perfil: "recepcao",
      ativo: true
    },
    {
      id: "user-2",
      nome: "Supervisor Caixa",
      usuario: "supervisor.caixa",
      perfil: "supervisor",
      ativo: true
    }
  ],

  "/people/sellers": [
    {
      id: "seller-1",
      nome: "Atendente Balcao",
      apelido: "Balcao 1",
      tipo: "atendente",
      ativo: true
    },
    {
      id: "seller-2",
      nome: "Garcom Piscina",
      apelido: "Piscina",
      tipo: "garcom",
      ativo: true
    }
  ],

  "/products": [
    {
      id: "1",
      nome: "Agua Mineral",
      categoria: "Bebidas",
      preco: 7.5,
      quantidade_atual: 94,
      internal_code: "BEB-001",
      codigo_barras: "7891000100101",
      tipo_produto: "consumo",
      permite_combo: true,
      image_url: buildProductPlaceholder("Agua Mineral"),
      image_filename: null
    },
    {
      id: "2",
      nome: "Sanduiche Natural",
      categoria: "Room Service",
      preco: 24.9,
      quantidade_atual: 21,
      internal_code: "FOOD-002",
      codigo_barras: "7891000100102",
      tipo_produto: "consumo",
      permite_combo: true,
      image_url: buildProductPlaceholder("Sanduiche"),
      image_filename: null
    },
    {
      id: "3",
      nome: "Colete salva-vidas",
      categoria: "Aventura",
      preco: 35,
      quantidade_atual: 16,
      internal_code: "AVT-003",
      codigo_barras: "7891000100103",
      tipo_produto: "insumo",
      permite_combo: true,
      image_url: buildProductPlaceholder("Colete"),
      image_filename: null
    },
    {
      id: "4",
      nome: "Combustivel barco",
      categoria: "Operacao",
      preco: 12,
      quantidade_atual: 400,
      internal_code: "OPS-004",
      codigo_barras: "7891000100104",
      tipo_produto: "insumo",
      permite_combo: true,
      image_url: buildProductPlaceholder("Combustivel"),
      image_filename: null
    },
    {
      id: "5",
      nome: "Vinho da casa",
      categoria: "Bebidas",
      preco: 88,
      quantidade_atual: 18,
      internal_code: "BEB-005",
      codigo_barras: "7891000100105",
      tipo_produto: "consumo",
      permite_combo: true,
      image_url: buildProductPlaceholder("Vinho"),
      image_filename: null
    }
  ],

  "/combos": [
    {
      id: "cb-1",
      nome: "Passeio de Barco Premium",
      descricao: "Passeio nautico com bebidas e itens de apoio.",
      preco: 320,
      duracao_minutos: 180,
      ativo: true,
      limite_por_dia: 4,
      observacoes: "Executar com agenda confirmada",
      itens: [
        { id: "cbi-1", produto_id: "1", quantidade: 2, produto_nome: "Agua Mineral" },
        { id: "cbi-2", produto_id: "3", quantidade: 2, produto_nome: "Colete salva-vidas" },
        { id: "cbi-3", produto_id: "4", quantidade: 10, produto_nome: "Combustivel barco" }
      ]
    },
    {
      id: "cb-2",
      nome: "Jantar Romantico",
      descricao: "Experiencia gourmet com ambientacao especial.",
      preco: 280,
      duracao_minutos: 120,
      ativo: true,
      limite_por_dia: 3,
      observacoes: "Confirmar ate as 16h",
      itens: [
        { id: "cbi-4", produto_id: "5", quantidade: 1, produto_nome: "Vinho da casa" },
        { id: "cbi-5", produto_id: "2", quantidade: 2, produto_nome: "Sanduiche Natural" }
      ]
    }
  ],

  "/orders": [
    {
      id: "1",
      hospede_nome: "Marina Costa",
      quarto_numero: "101",
      area_entrega: "Piscina",
      valor_total: 58.8,
      status: "novo"
    },
    {
      id: "2",
      hospede_nome: "Joao Prado",
      quarto_numero: "201",
      area_entrega: "Quarto",
      valor_total: 32.0,
      status: "em_preparo"
    }
  ],

  "/finance/summary": {
    receitas: 42300,
    despesas: 16740,
    saldo: 25560,
    ultimosLancamentos: [
      {
        id: "1",
        tipo: "receita",
        categoria: "Hospedagem",
        descricao: "Check-out Marina Costa",
        valor: 1820,
        status: "liquidado",
        data_lancamento: "2026-04-21T13:20:00"
      },
      {
        id: "2",
        tipo: "despesa",
        categoria: "Lavanderia",
        descricao: "Fornecedor terceirizado",
        valor: 460,
        status: "aberto",
        data_lancamento: "2026-04-21T10:15:00"
      }
    ]
  },

  "/settings": [
    {
      chave: "empresa",
      secao: "geral",
      valor: {
        razaoSocial: "Pousada Exemplo",
        cnpj: "00.000.000/0001-00"
      }
    },
    {
      chave: "fiscal_nfce",
      secao: "fiscal",
      valor: {
        serie: "1",
        cfop: "5102",
        csc_id: "000001"
      }
    },
    {
      chave: "tema_visual",
      secao: "aparencia",
      valor: {
        tema: "classic-light"
      }
    }
  ],

  "/settings/company": {
    id: "company-1",
    trade_name: "Pousada Serra Clara",
    legal_name: "Pousada Serra Clara LTDA",
    cnpj: "12.345.678/0001-99",
    state_registration: "ISENTO",
    municipal_registration: "12345",
    cnae: "5510-8/01",
    tax_regime: "Simples Nacional",
    phone: "(67) 3231-1000",
    whatsapp: "(67) 99999-0000",
    email: "contato@serraclara.com.br",
    zip_code: "79300-000",
    street: "Rua Principal",
    number: "941",
    complement: "",
    district: "Centro",
    city: "Corumba",
    state: "MS",
    country: "Brasil",
    logo_url: "/click7-logo.svg",
    logo_filename: "click7-logo.svg",
    primary_color: "#00A846",
    default_theme: "classic-light",
    admin_name: "Administrador Geral",
    admin_email: "admin@serraclara.com.br",
    admin_phone: "(67) 99999-1111",
    admin_user_id: "user-1",
    admin_access_profile: "admin",
    subtitle: "Hotel ERP - Operacao e fiscal"
  },

  "/reservations": [
    {
      id: "res-1",
      codigo_reserva: "RES-20260508-A1B2",
      hospede_id: "1",
      hospede_nome: "Marina Costa",
      hospede_documento: "123.456.789-00",
      hospede_telefone: "(11) 99999-9999",
      hospede_email: "marina@email.com",
      quarto_id: "1",
      quarto_numero: "101",
      quarto_capacidade: 2,
      tipo_acomodacao: "Apartamento",
      tipo_quarto: "Luxo",
      data_checkin: "2026-05-12",
      data_checkout: "2026-05-15",
      adultos: 2,
      criancas: 0,
      quantidade_hospedes: 2,
      numero_diarias: 3,
      valor_diaria: 320,
      subtotal_hospedagem: 960,
      taxas_adicionais: 60,
      desconto: 0,
      valor_total: 1340,
      forma_pagamento: "pix",
      status_pagamento: "parcial",
      valor_pago: 400,
      saldo_pendente: 940,
      origem: "WhatsApp",
      status: "confirmada",
      observacoes: "Chegada prevista para 16h",
      observacoes_internas: "Enviar mapa de acesso um dia antes",
      preferencias_hospede: "Quarto silencioso",
      acompanhantes: [],
      combos: [
        {
          id: "rc-1",
          reservation_id: "res-1",
          combo_definition_id: "cb-1",
          combo_nome: "Passeio de Barco Premium",
          quantidade: 1,
          preco_unitario: 320,
          valor_total: 320,
          status: "agendado",
          data_agendada: "2026-05-13T10:00:00",
          observacoes: "Levar protetor solar"
        }
      ],
      pagamentos: [
        {
          id: "rp-1",
          reservation_id: "res-1",
          forma_pagamento: "pix",
          status: "pago",
          valor: 400,
          pago_em: "2026-05-08T09:30:00",
          observacoes: "Sinal"
        }
      ]
    },
    {
      id: "res-2",
      codigo_reserva: "RES-20260508-C3D4",
      hospede_id: "2",
      hospede_nome: "Joao Prado",
      hospede_documento: "987.654.321-00",
      hospede_telefone: "(21) 98888-8888",
      hospede_email: "joao@email.com",
      quarto_id: "3",
      quarto_numero: "201",
      quarto_capacidade: 5,
      tipo_acomodacao: "Chale",
      tipo_quarto: "Familia",
      data_checkin: "2026-05-08",
      data_checkout: "2026-05-11",
      adultos: 2,
      criancas: 2,
      quantidade_hospedes: 4,
      numero_diarias: 3,
      valor_diaria: 390,
      subtotal_hospedagem: 1170,
      taxas_adicionais: 0,
      desconto: 70,
      valor_total: 1380,
      forma_pagamento: "cartao",
      status_pagamento: "pago",
      valor_pago: 1380,
      saldo_pendente: 0,
      origem: "Booking",
      status: "hospedado",
      observacoes: "",
      observacoes_internas: "",
      preferencias_hospede: "Berco extra",
      acompanhantes: [],
      combos: [
        {
          id: "rc-2",
          reservation_id: "res-2",
          combo_definition_id: "cb-2",
          combo_nome: "Jantar Romantico",
          quantidade: 1,
          preco_unitario: 280,
          valor_total: 280,
          status: "contratado",
          data_agendada: "2026-05-09T20:00:00",
          observacoes: ""
        }
      ],
      pagamentos: [
        {
          id: "rp-2",
          reservation_id: "res-2",
          forma_pagamento: "cartao",
          status: "pago",
          valor: 1380,
          pago_em: "2026-05-07T14:10:00",
          observacoes: "Pagamento integral"
        }
      ]
    }
  ],

  "/reservations/metadata": {
    hospedes: [],
    quartos: [],
    produtos: [],
    combos: [],
    origensReserva: ["WhatsApp", "Booking", "Airbnb", "Site proprio", "Telefone", "Presencial", "Agencia"],
    statusesReserva: ["pre_reserva", "pendente", "confirmada", "checkin_realizado", "hospedado", "checkout_realizado", "cancelada", "no_show"],
    statusesCombo: ["contratado", "agendado", "em_andamento", "concluido", "cancelado"]
  },

  "/guest-accounts": [
    {
      id: "ga-1",
      reserva_id: "res-1",
      hospede_id: "1",
      hospede_nome: "Marina Costa",
      quarto_id: "1",
      quarto_numero: "101",
      status: "aberta",
      saldo_atual: 320
    },
    {
      id: "ga-2",
      reserva_id: "res-2",
      hospede_id: "2",
      hospede_nome: "Joao Prado",
      quarto_id: "3",
      quarto_numero: "201",
      status: "aberta",
      saldo_atual: 280
    }
  ],

  "/pos/cash-sessions": [
    {
      id: "cs-1",
      operador_id: "user-1",
      operador_nome: "Caixa Manha",
      status: "aberto",
      opened_at: "2026-05-08T08:00:00",
      valor_inicial: 300,
      total_vendido: 0,
      total_suprimentos: 0,
      total_sangrias: 0,
      diferenca_caixa: 0,
      observacoes: "Turno da recepcao"
    }
  ],

  "/pos/cash-movements": [
    {
      id: "cm-1",
      cash_session_id: "cs-1",
      tipo: "abertura",
      valor: 300,
      motivo: "Abertura de caixa",
      operador_id: "user-1",
      observacoes: "Turno da recepcao",
      created_at: "2026-05-08T08:00:00"
    }
  ],

  "/pos/sales": [
    {
      id: "sale-1",
      codigo: "VEN-20260508-001",
      origem_venda: "balcao",
      tipo: "balcao",
      hospede_id: null,
      hospede_nome: "",
      quarto_id: null,
      quarto_numero: "",
      reserva_id: null,
      conta_hospedagem_id: null,
      caixa_sessao_id: "cs-1",
      operador_nome: "Caixa Manha",
      usuario_sistema_id: "user-1",
      usuario_sistema_nome: "Recepcao Manha",
      vendedor_id: "seller-1",
      vendedor_nome: "Atendente Balcao",
      valor_total: 42.4,
      subtotal: 42.4,
      desconto_geral: 0,
      acrescimo: 0,
      status: "concluida",
      status_fiscal: "pendente",
      documento_tipo: null,
      lancar_na_conta: false,
      cobrar_imediatamente: true,
      observacoes: "",
      created_at: "2026-05-08T10:20:00",
      itens: [
        {
          id: "sale-item-1",
          produto_id: "1",
          produto_nome: "Agua Mineral",
          quantidade: 2,
          preco_unitario: 7.5,
          desconto: 0
        },
        {
          id: "sale-item-2",
          produto_id: "2",
          produto_nome: "Sanduiche Natural",
          quantidade: 1,
          preco_unitario: 27.4,
          desconto: 0
        }
      ],
      pagamentos: [
        { id: "sp-1", metodo: "pix", valor: 42.4, status: "confirmado" }
      ],
      refunds: []
    },
    {
      id: "sale-2",
      codigo: "VEN-20260508-002",
      origem_venda: "room_service",
      tipo: "room_service",
      hospede_id: "1",
      hospede_nome: "Marina Costa",
      quarto_id: "1",
      quarto_numero: "101",
      reserva_id: "res-1",
      conta_hospedagem_id: "ga-1",
      caixa_sessao_id: "cs-1",
      operador_nome: "Caixa Manha",
      usuario_sistema_id: "user-1",
      usuario_sistema_nome: "Recepcao Manha",
      vendedor_id: "seller-2",
      vendedor_nome: "Garcom Piscina",
      valor_total: 58.8,
      subtotal: 58.8,
      desconto_geral: 0,
      acrescimo: 0,
      status: "concluida",
      status_fiscal: "sem_documento",
      documento_tipo: null,
      lancar_na_conta: true,
      cobrar_imediatamente: false,
      observacoes: "Lancado na comanda do hospede",
      created_at: "2026-05-08T11:10:00",
      itens: [
        {
          id: "sale-item-3",
          produto_id: "2",
          produto_nome: "Sanduiche Natural",
          quantidade: 2,
          preco_unitario: 24.9,
          desconto: 0
        }
      ],
      pagamentos: [],
      refunds: []
    }
  ]
};

const fallbackAuthUsers = [
  {
    id: "user-admin-1",
    nome: "Administrador ERP",
    email: "admin@erp.com",
    password: "Admin@123456",
    role: "admin",
    ativo: true,
    permissions: ["*"]
  }
];

fallbackStore["/room-amenities"] = fallbackStore["/rooms/metadata"].comodidades;
fallbackStore["/room-accommodation-types"] = fallbackStore["/rooms/metadata"].tiposAcomodacao;
fallbackStore["/room-types"] = fallbackStore["/rooms/metadata"].tiposQuarto;

fallbackStore["/reservations/metadata"].hospedes = normalizeGuestCollection(fallbackStore["/guests"]);
fallbackStore["/reservations/metadata"].quartos = fallbackStore["/rooms"].map((room) => ({
  id: room.id,
  numero: room.numero,
  capacidade: room.capacidade,
  status: room.status,
  tipo_acomodacao: room.tipo_acomodacao,
  tipo_quarto: room.tipo_quarto,
  tipo_acomodacao_id: room.tipo_acomodacao_id,
  tipo_quarto_id: room.tipo_quarto_id
}));
fallbackStore["/reservations/metadata"].produtos = fallbackStore["/products"];
fallbackStore["/reservations/metadata"].combos = fallbackStore["/combos"];
syncFallbackAmenities();
syncFallbackRoomTypeMetadata();

function getHeaders(extraHeaders = {}) {
  const token = getStoredAuthSession()?.token || "";
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Falha na requisicao.");
    error.status = response.status;
    error.code = data?.code || null;
    error.details = data?.details || null;

    if (
      response.status === 401 &&
      ["AUTH_TOKEN_MISSING", "AUTH_TOKEN_INVALID", "AUTH_TOKEN_EXPIRED"].includes(data?.code)
    ) {
      clearStoredAuthSession();
      window.dispatchEvent(new CustomEvent("hotel-erp-auth-expired"));
    }

    throw error;
  }

  return data;
}

function cloneFallback(path) {
  const value = fallbackStore[path];
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function buildProductPlaceholder(label = "Sem imagem") {
  const safeLabel = String(label)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
      <rect width="480" height="320" rx="28" fill="#f4ead6"/>
      <rect x="38" y="38" width="404" height="244" rx="22" fill="#fff9ef" stroke="#d9cdb6" stroke-width="3"/>
      <circle cx="162" cy="132" r="28" fill="#f0c979"/>
      <path d="M96 232l72-74 54 46 64-70 100 98H96z" fill="#193126" opacity=".8"/>
      <text x="240" y="274" text-anchor="middle" font-family="Segoe UI, Arial" font-size="24" fill="#6f7e76">${safeLabel}</text>
    </svg>`
  )}`;
}

function toAbsoluteAssetUrl(url) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

function normalizeProductRecord(product) {
  if (!product) {
    return product;
  }

  return {
    ...product,
    image_url: toAbsoluteAssetUrl(product.image_url)
  };
}

function normalizeProductCollection(products) {
  return (products || []).map(normalizeProductRecord);
}

function normalizePosOverview(overview) {
  if (!overview) {
    return overview;
  }

  return {
    ...overview,
    products: normalizeProductCollection(overview.products || []),
    guests: normalizeGuestCollection(overview.guests || [])
  };
}

function normalizeCompanyRecord(company) {
  if (!company) {
    return company;
  }

  return {
    ...company,
    logo_url: toAbsoluteAssetUrl(company.logo_url)
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

function calculateGuestAge(dateString) {
  if (!dateString) {
    return null;
  }

  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

function normalizeGuestRecord(guest) {
  if (!guest) {
    return guest;
  }

  const documents = (guest.documents || []).filter((item) => !item.deleted_at);
  const age = calculateGuestAge(guest.data_nascimento);
  const isMinor = age !== null ? age < 18 : false;
  const hasPrimaryDocument = Boolean(guest.cpf || guest.numero_documento);
  const hasResponsible = !isMinor || Boolean(guest.responsavel_legal_nome && guest.responsavel_legal_cpf);
  const documentPending = !hasPrimaryDocument || (isMinor && !guest.autorizacao_anexada);
  const profileComplete = Boolean(
    guest.nome &&
    hasPrimaryDocument &&
    guest.telefone &&
    guest.data_nascimento &&
    guest.tipo_documento &&
    guest.cidade &&
    guest.uf &&
    hasResponsible
  );

  return {
    ...guest,
    documents,
    age,
    is_minor: isMinor,
    badges: {
      cadastro_completo: profileComplete,
      documento_pendente: documentPending,
      documento_conferido: Boolean(guest.documento_conferido),
      menor_idade: isMinor,
      lgpd_pendente: !guest.consentimento_lgpd
    }
  };
}

function normalizeGuestCollection(guests) {
  return (guests || []).map(normalizeGuestRecord);
}

function buildFallbackGuestRecord(payload, current = null) {
  const age = calculateGuestAge(payload.data_nascimento || current?.data_nascimento || "");
  const isMinor = age !== null ? age < 18 : false;

  return normalizeGuestRecord({
    id: current?.id || createFallbackId(),
    nome: payload.nome || payload.nomeCompleto || "",
    nome_social: payload.nome_social || "",
    data_nascimento: payload.data_nascimento || "",
    genero: payload.genero || "",
    nacionalidade: payload.nacionalidade || "Brasileira",
    profissao: payload.profissao || "",
    tipo_documento: payload.tipo_documento || (payload.cpf ? "CPF" : ""),
    numero_documento: payload.numero_documento || payload.cpf || "",
    orgao_emissor: payload.orgao_emissor || "",
    uf_emissor: payload.uf_emissor || "",
    data_emissao_documento: payload.data_emissao_documento || "",
    cpf: payload.cpf || "",
    validade_documento: payload.validade_documento || "",
    email: payload.email || "",
    telefone: payload.telefone || "",
    whatsapp: payload.whatsapp || payload.telefone || "",
    cep: payload.cep || "",
    logradouro: payload.logradouro || payload.endereco || "",
    numero_endereco: payload.numero_endereco || "",
    complemento: payload.complemento || "",
    bairro: payload.bairro || "",
    cidade: payload.cidade || "",
    uf: payload.uf || "",
    pais: payload.pais || "Brasil",
    motivo_viagem: payload.motivo_viagem || "",
    meio_transporte: payload.meio_transporte || "",
    procedencia: payload.procedencia || "",
    destino: payload.destino || "",
    data_prevista_chegada: payload.data_prevista_chegada || "",
    data_prevista_saida: payload.data_prevista_saida || "",
    observacoes_internas: payload.observacoes_internas || "",
    responsavel_legal_nome: isMinor ? payload.responsavel_legal_nome || "" : "",
    responsavel_legal_cpf: isMinor ? payload.responsavel_legal_cpf || "" : "",
    responsavel_legal_documento: isMinor ? payload.responsavel_legal_documento || "" : "",
    responsavel_legal_telefone: isMinor ? payload.responsavel_legal_telefone || "" : "",
    responsavel_legal_parentesco: isMinor ? payload.responsavel_legal_parentesco || "" : "",
    responsavel_legal_observacoes: isMinor ? payload.responsavel_legal_observacoes || "" : "",
    autorizacao_anexada: Boolean(payload.autorizacao_anexada || current?.autorizacao_anexada),
    consentimento_lgpd: Boolean(payload.consentimento_lgpd),
    consentimento_lgpd_em: payload.consentimento_lgpd ? payload.consentimento_lgpd_em || new Date().toISOString() : "",
    finalidade_lgpd: payload.finalidade_lgpd || "",
    documento_conferido: Boolean(payload.documento_conferido || current?.documento_conferido),
    documento_conferido_em: payload.documento_conferido ? payload.documento_conferido_em || new Date().toISOString() : current?.documento_conferido_em || "",
    documento_conferido_por: payload.documento_conferido_por || current?.documento_conferido_por || "",
    documents: current?.documents || []
  });
}

function getFallbackRoomLabels(room) {
  const metadata = fallbackStore["/rooms/metadata"];
  const accommodation = metadata.tiposAcomodacao.find(
    (item) => item.id === room.tipo_acomodacao_id
  );
  const roomType = metadata.tiposQuarto.find(
    (item) => item.id === room.tipo_quarto_id
  );

  return {
    tipo_acomodacao: accommodation?.nome || "",
    tipo_quarto: roomType?.nome || "",
    comodidades:
      metadata.comodidades.filter((item) =>
        (room.comodidade_ids || []).includes(item.id)
      ) || []
  };
}

function syncFallbackAmenities() {
  const activeAmenities = fallbackStore["/room-amenities"]
    .filter((amenity) => amenity.ativo !== false)
    .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));

  fallbackStore["/room-amenities"] = activeAmenities;
  fallbackStore["/rooms/metadata"].comodidades = activeAmenities;
}

function syncFallbackRoomTypeMetadata() {
  fallbackStore["/rooms/metadata"].tiposAcomodacao = fallbackStore["/room-accommodation-types"]
    .sort((left, right) => {
      if ((left.ativo ?? true) !== (right.ativo ?? true)) {
        return left.ativo === false ? 1 : -1;
      }
      return left.nome.localeCompare(right.nome, "pt-BR");
    });

  fallbackStore["/rooms/metadata"].tiposQuarto = fallbackStore["/room-types"]
    .sort((left, right) => {
      if ((left.ativo ?? true) !== (right.ativo ?? true)) {
        return left.ativo === false ? 1 : -1;
      }
      return left.nome.localeCompare(right.nome, "pt-BR");
    });
}

function createFallbackId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getCurrentCashSession() {
  return fallbackStore["/pos/cash-sessions"].find((session) => session.status === "aberto") || null;
}

function buildPosReports() {
  const sales = fallbackStore["/pos/sales"];
  const reports = {
    vendasPorOperador: {},
    vendasPorFormaPagamento: {},
    cancelamentos: 0,
    sangrias: fallbackStore["/pos/cash-movements"]
      .filter((movement) => movement.tipo === "sangria")
      .reduce((sum, movement) => sum + Number(movement.valor || 0), 0),
    suprimentos: fallbackStore["/pos/cash-movements"]
      .filter((movement) => movement.tipo === "suprimento")
      .reduce((sum, movement) => sum + Number(movement.valor || 0), 0),
    ticketMedio: 0,
    faturamentoHospedagem: 0,
    faturamentoConsumo: 0,
    roomService: 0,
    combosVendidos: 0
  };

  let total = 0;

  for (const sale of sales) {
    const amount = Number(sale.valor_total || 0);
    total += amount;

    reports.vendasPorOperador[sale.operador_nome || "Sem operador"] =
      Number(reports.vendasPorOperador[sale.operador_nome || "Sem operador"] || 0) + amount;

    (sale.pagamentos || []).forEach((payment) => {
      reports.vendasPorFormaPagamento[payment.metodo] =
        Number(reports.vendasPorFormaPagamento[payment.metodo] || 0) + Number(payment.valor || 0);
    });

    if (sale.status === "cancelada") {
      reports.cancelamentos += 1;
    }

    if (sale.origem_venda === "hospedagem") {
      reports.faturamentoHospedagem += amount;
    } else if (sale.origem_venda === "room_service") {
      reports.roomService += amount;
    } else {
      reports.faturamentoConsumo += amount;
    }
  }

  reports.ticketMedio = sales.length ? Number((total / sales.length).toFixed(2)) : 0;

  return reports;
}

function buildPosOverview() {
  return {
    products: cloneFallback("/products"),
    guests: cloneFallback("/guests"),
    systemUsers: cloneFallback("/people/users"),
    sellers: cloneFallback("/people/sellers"),
    reservations: cloneFallback("/reservations"),
    rooms: cloneFallback("/rooms"),
    guestAccounts: cloneFallback("/guest-accounts"),
    currentSessions: cloneFallback("/pos/cash-sessions"),
    sales: cloneFallback("/pos/sales"),
    roomServiceOrders: cloneFallback("/orders"),
    reports: buildPosReports()
  };
}

function buildGuestAppPayload(accountId) {
  const account = cloneFallback("/guest-accounts").find((item) => item.id === accountId);

  if (!account) {
    throw new Error("Conta de hospedagem nao encontrada.");
  }

  const guest = cloneFallback("/guests").find((item) => item.id === account.hospede_id) || null;
  const room = cloneFallback("/rooms").find((item) => item.id === account.quarto_id) || null;
  const reservation = cloneFallback("/reservations").find((item) => item.id === account.reserva_id) || null;
  const orders = cloneFallback("/orders").filter((item) => item.conta_hospedagem_id === account.id);
  const menuProducts = cloneFallback("/products").filter((item) => Number(item.quantidade_atual || 0) > 0);

  return {
    account,
    guest,
    room,
    reservation,
    orders,
    menuProducts
  };
}

function createReservationCode() {
  return `RES-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function calculateNights(checkin, checkout) {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function buildReservationRecord(payload, current = null) {
  const guest = fallbackStore["/guests"].find((item) => item.id === payload.hospede_id) || {};
  const room = fallbackStore["/rooms"].find((item) => item.id === payload.quarto_id) || {};
  const numberOfNights = calculateNights(payload.data_checkin, payload.data_checkout);
  const combos = (payload.combos || []).map((combo) => {
    const definition = fallbackStore["/combos"].find((item) => item.id === combo.combo_definition_id) || {};
    const quantity = Number(combo.quantidade || 1);
    const unitPrice = Number(combo.preco_unitario ?? definition.preco ?? 0);

    return {
      id: combo.id || createFallbackId(),
      reservation_id: current?.id || "",
      combo_definition_id: combo.combo_definition_id,
      combo_nome: definition.nome || combo.combo_nome || "",
      quantidade: quantity,
      preco_unitario: unitPrice,
      valor_total: Number(combo.valor_total ?? quantity * unitPrice),
      status: combo.status || "contratado",
      data_agendada: combo.data_agendada || null,
      observacoes: combo.observacoes || ""
    };
  });

  const subtotal = numberOfNights * Number(payload.valor_diaria || 0);
  const comboTotal = combos.reduce((sum, item) => sum + Number(item.valor_total || 0), 0);
  const taxes = Number(payload.taxas_adicionais || 0);
  const discount = Number(payload.desconto || 0);
  const total = subtotal + taxes - discount + comboTotal;
  const amountPaid = Number(payload.valor_pago || 0);

  return {
    id: current?.id || createFallbackId(),
    codigo_reserva: payload.codigo_reserva || current?.codigo_reserva || createReservationCode(),
    hospede_id: payload.hospede_id,
    hospede_nome: guest.nome || "",
    hospede_documento: payload.documento || guest.cpf || "",
    hospede_telefone: payload.telefone || guest.telefone || "",
    hospede_email: payload.email || guest.email || "",
    quarto_id: payload.quarto_id,
    quarto_numero: room.numero || "",
    quarto_capacidade: room.capacidade || 0,
    tipo_acomodacao: room.tipo_acomodacao || "",
    tipo_quarto: room.tipo_quarto || "",
    data_checkin: payload.data_checkin,
    data_checkout: payload.data_checkout,
    adultos: Number(payload.adultos || 0),
    criancas: Number(payload.criancas || 0),
    quantidade_hospedes: Number(payload.quantidade_hospedes || payload.adultos + payload.criancas || 1),
    numero_diarias: numberOfNights,
    valor_diaria: Number(payload.valor_diaria || 0),
    subtotal_hospedagem: subtotal,
    taxas_adicionais: taxes,
    desconto: discount,
    valor_total: total,
    forma_pagamento: payload.forma_pagamento || "",
    status_pagamento:
      amountPaid >= total ? "pago" : amountPaid > 0 ? "parcial" : payload.status_pagamento || "pendente",
    valor_pago: amountPaid,
    saldo_pendente: total - amountPaid,
    origem: payload.origem || "WhatsApp",
    status: payload.status || "pendente",
    observacoes: payload.observacoes || "",
    observacoes_internas: payload.observacoes_internas || "",
    preferencias_hospede: payload.preferencias_hospede || "",
    acompanhantes: current?.acompanhantes || [],
    combos,
    pagamentos:
      amountPaid > 0
        ? [
            {
              id: createFallbackId(),
              reservation_id: current?.id || "",
              forma_pagamento: payload.forma_pagamento || "nao_informado",
              status: "pago",
              valor: amountPaid,
              pago_em: new Date().toISOString(),
              observacoes: "Pagamento da reserva"
            }
          ]
        : []
  };
}

function filterAvailableRooms(payload) {
  const start = new Date(payload.checkin || payload.data_checkin);
  const end = new Date(payload.checkout || payload.data_checkout);

  return fallbackStore["/rooms"].filter((room) => {
    if (room.status === "manutencao") {
      return false;
    }

    if (payload.tipoAcomodacaoId && room.tipo_acomodacao_id !== payload.tipoAcomodacaoId) {
      return false;
    }

    if (payload.tipoQuartoId && room.tipo_quarto_id !== payload.tipoQuartoId) {
      return false;
    }

    return !fallbackStore["/reservations"].some((reservation) => {
      if (payload.ignoreReservationId && reservation.id === payload.ignoreReservationId) {
        return false;
      }

      if (reservation.quarto_id !== room.id) {
        return false;
      }

      if (!["pre_reserva", "pendente", "confirmada", "checkin_realizado", "hospedado"].includes(reservation.status)) {
        return false;
      }

      const reservationStart = new Date(reservation.data_checkin);
      const reservationEnd = new Date(reservation.data_checkout);
      return reservationStart <= end && reservationEnd >= start;
    });
  }).map((room) => ({
    id: room.id,
    numero: room.numero,
    capacidade: room.capacidade,
    status: room.status,
    tipo_acomodacao: room.tipo_acomodacao,
    tipo_quarto: room.tipo_quarto
  }));
}

async function request(path, options = {}) {
  const [routePath] = path.split("?");
  const method = String(options.method || "GET").toUpperCase();
  const config = {
    ...options,
    headers: getHeaders(options.headers)
  };

  if (
    config.body &&
    !(config.body instanceof FormData) &&
    !config.headers["Content-Type"]
  ) {
    config.headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_URL}${path}`, config);
    return await parseResponse(response);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw error;
    }

    const isRoomWrite =
      method !== "GET" &&
      (
        routePath === "/rooms" ||
        routePath.startsWith("/rooms/") ||
        routePath.startsWith("/room-amenities") ||
        routePath.startsWith("/room-accommodation-types") ||
        routePath.startsWith("/room-types")
      );

    if (isRoomWrite) {
      throw new Error("Nao foi possivel salvar a acomodacao no servidor. Verifique a conexao com a API e tente novamente.");
    }

    if (
      routePath in fallbackStore ||
      routePath.startsWith("/rooms") ||
      routePath.startsWith("/reservations") ||
      routePath.startsWith("/combos") ||
      routePath.startsWith("/guests") ||
      routePath.startsWith("/people") ||
      routePath.startsWith("/products") ||
      routePath.startsWith("/pos") ||
      routePath.startsWith("/settings") ||
      routePath.startsWith("/auth") ||
      routePath.startsWith("/room-amenities") ||
      routePath.startsWith("/room-accommodation-types") ||
      routePath.startsWith("/room-types")
    ) {
      return fallbackRequest(path, config);
    }

    throw error;
  }
}

async function fallbackRequest(path, options) {
  const [routePath, queryString = ""] = path.split("?");
  const searchParams = new URLSearchParams(queryString);
  const method = (options.method || "GET").toUpperCase();

  if (routePath === "/auth/login" && method === "POST") {
    const payload = JSON.parse(options.body);
    const user = fallbackAuthUsers.find(
      (item) => item.email.toLowerCase() === String(payload.email || "").toLowerCase() && item.ativo
    );

    if (!user || user.password !== payload.password) {
      const error = new Error("Credenciais invalidas.");
      error.status = 401;
      throw error;
    }

    return {
      token: "mock-admin-token",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        permissions: user.permissions
      }
    };
  }

  if (routePath === "/auth/me" && method === "GET") {
    const session = getStoredAuthSession();

    if (!session?.token) {
      const error = new Error("Token nao informado.");
      error.status = 401;
      throw error;
    }

    const user = fallbackAuthUsers.find((item) => item.email.toLowerCase() === String(session.user?.email || "").toLowerCase());

    if (!user) {
      const error = new Error("Usuario nao encontrado.");
      error.status = 404;
      throw error;
    }

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        permissions: user.permissions
      }
    };
  }

  if (routePath === "/auth/profile" && method === "PUT") {
    const payload = JSON.parse(options.body);
    const session = getStoredAuthSession();
    const user = fallbackAuthUsers.find((item) => item.email.toLowerCase() === String(session?.user?.email || "").toLowerCase());

    if (!user) {
      const error = new Error("Usuario nao encontrado.");
      error.status = 404;
      throw error;
    }

    const duplicate = fallbackAuthUsers.find((item) => item.email.toLowerCase() === String(payload.email || "").toLowerCase() && item.id !== user.id);
    if (duplicate) {
      const error = new Error("Ja existe um usuario com este e-mail.");
      error.status = 409;
      throw error;
    }

    user.nome = payload.nome;
    user.email = String(payload.email || "").toLowerCase();

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        permissions: user.permissions
      }
    };
  }

  if (routePath === "/auth/logout" && method === "POST") {
    return null;
  }

  if (routePath === "/auth/register" && method === "POST") {
    const payload = JSON.parse(options.body);
    const existing = fallbackAuthUsers.find((item) => item.email.toLowerCase() === String(payload.email || "").toLowerCase());

    if (existing) {
      throw new Error("Ja existe um usuario com este e-mail.");
    }

    const user = {
      id: createFallbackId(),
      nome: payload.nome,
      email: String(payload.email || "").toLowerCase(),
      password: payload.password,
      role: payload.role || "recepcao",
      ativo: payload.ativo ?? true,
      permissions: []
    };
    fallbackAuthUsers.push(user);

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        permissions: user.permissions
      }
    };
  }

  if (routePath === "/auth/change-password" && method === "PUT") {
    const payload = JSON.parse(options.body);
    const session = getStoredAuthSession();
    const user = fallbackAuthUsers.find((item) => item.email.toLowerCase() === String(session?.user?.email || "").toLowerCase());

    if (!user || user.password !== payload.currentPassword) {
      const error = new Error("Senha atual invalida.");
      error.status = 401;
      throw error;
    }

    user.password = payload.newPassword;
    return { ok: true };
  }

  if (method === "GET" && routePath === "/rooms") {
    const status = searchParams.get("status");
    const rooms = cloneFallback("/rooms") || [];

    if (!status) {
      return rooms;
    }

    return rooms.filter((room) => room.status === status);
  }

  if (method === "GET" && routePath === "/room-accommodation-types") {
    const includeInactive = searchParams.get("include_inactive") !== "false";
    const items = cloneFallback("/room-accommodation-types") || [];
    return includeInactive ? items : items.filter((item) => item.ativo !== false);
  }

  if (method === "GET" && routePath === "/room-types") {
    const includeInactive = searchParams.get("include_inactive") !== "false";
    const items = cloneFallback("/room-types") || [];
    return includeInactive ? items : items.filter((item) => item.ativo !== false);
  }

  if (method === "GET" && path === "/pos/overview") {
    return buildPosOverview();
  }

  if (method === "GET" && path === "/settings/company") {
    return normalizeCompanyRecord(cloneFallback("/settings/company"));
  }

  if (method === "GET" && path.startsWith("/guest-app/")) {
    const accountId = path.split("/")[2];
    return buildGuestAppPayload(accountId);
  }

  if (method === "POST" && path.startsWith("/guest-app/") && path.endsWith("/orders")) {
    const accountId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const account = fallbackStore["/guest-accounts"].find((item) => item.id === accountId);
    const guest = fallbackStore["/guests"].find((item) => item.id === account?.hospede_id);
    const room = fallbackStore["/rooms"].find((item) => item.id === account?.quarto_id);

    if (!account || !guest || !room) {
      throw new Error("Conta de hospedagem invalida para o pedido.");
    }

    const total = (payload.itens || []).reduce((sum, item) => {
      const product = fallbackStore["/products"].find((productItem) => productItem.id === item.produtoId);
      return sum + (Number(item.quantidade || 0) * Number(product?.preco || 0));
    }, 0);

    const order = {
      id: createFallbackId(),
      hospede_id: guest.id,
      hospede_nome: guest.nome,
      quarto_id: room.id,
      quarto_numero: room.numero,
      conta_hospedagem_id: account.id,
      area_entrega: payload.areaEntrega || "Quarto",
      valor_total: Number(total.toFixed(2)),
      status: "novo",
      observacoes: payload.observacoes || "",
      created_at: new Date().toISOString(),
      itens: (payload.itens || []).map((item) => {
        const product = fallbackStore["/products"].find((productItem) => productItem.id === item.produtoId) || {};
        if (product.id) {
          product.quantidade_atual = Number(product.quantidade_atual || 0) - Number(item.quantidade || 0);
        }

        return {
          id: createFallbackId(),
          produto_id: item.produtoId,
          produto_nome: product.nome || "",
          quantidade: Number(item.quantidade || 0),
          preco_unitario: Number(product.preco || 0),
          valor_total: Number((Number(item.quantidade || 0) * Number(product.preco || 0)).toFixed(2))
        };
      })
    };

    account.saldo_atual = Number(account.saldo_atual || 0) + order.valor_total;
    fallbackStore["/orders"] = [order, ...fallbackStore["/orders"]];
    return order;
  }

  if (method === "GET" && (path === "/pos/cash-register/current" || path === "/pos/current")) {
    return getCurrentCashSession();
  }

  if (method === "GET" && path.startsWith("/products/search")) {
    const [, queryString] = path.split("?");
    const params = new URLSearchParams(queryString || "");
    const term = String(params.get("q") || "").trim().toLowerCase();

    if (term.length < 2) {
      return [];
    }

    return cloneFallback("/products").filter((product) =>
      product.nome.toLowerCase().includes(term) ||
      String(product.internal_code || "").toLowerCase().includes(term) ||
      String(product.codigo_barras || "").toLowerCase().includes(term) ||
      String(product.categoria || "").toLowerCase().includes(term)
    );
  }

  if (method === "GET" && path === "/pos/reports") {
    return buildPosReports();
  }

  if (method === "GET" && path === "/pos/sales") {
    return cloneFallback("/pos/sales");
  }

  if (method === "GET" && path.startsWith("/pos/sales/")) {
    const saleId = path.split("/")[3];
    return cloneFallback("/pos/sales").find((sale) => sale.id === saleId) || null;
  }

  if (method === "GET" && path.startsWith("/pos/fiscal/") && path.endsWith("/reprint")) {
    const documentId = path.split("/")[3];
    const sale = cloneFallback("/pos/sales").find((item) => item.documento_id === documentId);
    return {
      id: documentId,
      referencia_id: sale?.id || null,
      tipo: sale?.documento_tipo || "NFCe",
      status: "autorizado",
      danfe_html: "<html><body><h1>DANFE Mock</h1></body></html>"
    };
  }

  if (method === "GET" && routePath !== "/guests" && !routePath.startsWith("/guests/")) {
    return cloneFallback(routePath);
  }

  if (path === "/guests" && method === "GET") {
    return normalizeGuestCollection(cloneFallback("/guests"));
  }

  if (path.startsWith("/guests/") && path.endsWith("/documents") && method === "GET") {
    const guestId = path.split("/")[2];
    const guest = fallbackStore["/guests"].find((item) => item.id === guestId);

    if (!guest) {
      throw new Error("Hospede nao encontrado.");
    }

    return (guest.documents || []).filter((item) => !item.deleted_at);
  }

  if (path.startsWith("/guests/") && path.includes("/documents/") && path.endsWith("/view") && method === "GET") {
    const [, , guestId, , documentId] = path.split("/");
    const guest = fallbackStore["/guests"].find((item) => item.id === guestId);
    const document = guest?.documents?.find((item) => item.id === documentId && !item.deleted_at);

    if (!document) {
      throw new Error("Documento nao encontrado.");
    }

    return {
      ...document,
      content_url: document.preview_url || document.file_path
    };
  }

  if (path.startsWith("/guests/") && path.includes("/documents/") && path.endsWith("/download") && method === "GET") {
    const [, , guestId, , documentId] = path.split("/");
    const guest = fallbackStore["/guests"].find((item) => item.id === guestId);
    const document = guest?.documents?.find((item) => item.id === documentId && !item.deleted_at);

    if (!document) {
      throw new Error("Documento nao encontrado.");
    }

    return {
      ...document,
      content_url: document.preview_url || document.file_path
    };
  }

  if (path.startsWith("/guests/") && path.endsWith("/documents") && method === "POST") {
    const guestId = path.split("/")[2];
    const guest = fallbackStore["/guests"].find((item) => item.id === guestId);

    if (!guest) {
      throw new Error("Hospede nao encontrado.");
    }

    const file = options.body instanceof FormData ? options.body.get("file") : null;
    const documentType = options.body instanceof FormData ? options.body.get("document_type") : "Outro";
    const description = options.body instanceof FormData ? options.body.get("description") : "";

    if (!file) {
      throw new Error("Selecione um documento para anexar.");
    }

    const previewUrl = await fileToDataUrl(file);
    const document = {
      id: createFallbackId(),
      guest_id: guestId,
      document_type: documentType || "Outro",
      original_filename: file.name || "documento",
      stored_filename: `guest-${Date.now()}-${file.name || "documento"}`,
      file_path: `/api/guests/${guestId}/documents/${Date.now()}/view`,
      mime_type: file.type || "application/octet-stream",
      file_size: Number(file.size || 0),
      description: description || "",
      uploaded_by: "Recepcao Manha",
      uploaded_at: new Date().toISOString(),
      deleted_at: null,
      preview_url: previewUrl,
      download_url: `/api/guests/${guestId}/documents/${Date.now()}/download`
    };

    guest.documents = [document, ...(guest.documents || [])];
    if (document.document_type === "Autorizacao de menor") {
      guest.autorizacao_anexada = true;
    }
    return document;
  }

  if (path.startsWith("/guests/") && path.includes("/documents/") && method === "DELETE") {
    const [, , guestId, , documentId] = path.split("/");
    const guest = fallbackStore["/guests"].find((item) => item.id === guestId);
    const document = guest?.documents?.find((item) => item.id === documentId);

    if (!document) {
      throw new Error("Documento nao encontrado.");
    }

    document.deleted_at = new Date().toISOString();
    return null;
  }

  if (path === "/rooms" && method === "POST") {
    const payload = JSON.parse(options.body);

    const room = {
      id: createFallbackId(),
      status: payload.status || "livre",
      ...payload,
      descricao: payload.descricao || "",
      ...getFallbackRoomLabels(payload)
    };

    fallbackStore["/rooms"] = [room, ...fallbackStore["/rooms"]];
    return room;
  }

  if (path.startsWith("/rooms/") && method === "PUT") {
    const roomId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/rooms"].find(
      (item) => item.id === roomId
    );

    if (!current) {
      throw new Error("Quarto nao encontrado.");
    }

    const updated = {
      ...current,
      ...payload,
      status: payload.status || current.status || "livre",
      descricao: payload.descricao || "",
      ...getFallbackRoomLabels(payload)
    };

    fallbackStore["/rooms"] = fallbackStore["/rooms"].map((item) =>
      item.id === roomId ? updated : item
    );

    return updated;
  }

  if (path.startsWith("/rooms/") && path.endsWith("/status") && method === "PATCH") {
    const roomId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/rooms"].find((item) => item.id === roomId);

    if (!current) {
      throw new Error("Quarto nao encontrado.");
    }

    current.status = payload.status || current.status;
    return current;
  }

  if (path.startsWith("/rooms/") && method === "DELETE") {
    const roomId = path.split("/")[2];
    fallbackStore["/rooms"] = fallbackStore["/rooms"].filter(
      (item) => item.id !== roomId
    );

    return null;
  }

  if (path === "/room-amenities" && method === "POST") {
    const payload = JSON.parse(options.body);
    const name = String(payload.nome || "").trim();

    if (!name) {
      throw new Error("Informe o nome da comodidade.");
    }

    const existing = fallbackStore["/room-amenities"].find(
      (item) => item.nome.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      existing.ativo = true;
      existing.nome = name;
      syncFallbackAmenities();
      return existing;
    }

    const amenity = {
      id: createFallbackId(),
      nome: name,
      icone: payload.icone || null,
      ativo: true
    };

    fallbackStore["/room-amenities"] = [...fallbackStore["/room-amenities"], amenity];
    syncFallbackAmenities();

    return amenity;
  }

  if (path.startsWith("/room-amenities/") && method === "PUT") {
    const amenityId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const amenity = fallbackStore["/room-amenities"].find((item) => item.id === amenityId);

    if (!amenity) {
      throw new Error("Comodidade nao encontrada.");
    }

    amenity.nome = String(payload.nome || amenity.nome).trim() || amenity.nome;
    amenity.icone = payload.icone ?? amenity.icone ?? null;
    amenity.ativo = payload.ativo ?? amenity.ativo ?? true;

    fallbackStore["/rooms"] = fallbackStore["/rooms"].map((room) => ({
      ...room,
      comodidades: (room.comodidades || []).map((item) =>
        item.id === amenityId ? { ...item, nome: amenity.nome, icone: amenity.icone } : item
      )
    }));

    syncFallbackAmenities();

    return amenity;
  }

  if (path.startsWith("/room-amenities/") && method === "DELETE") {
    const amenityId = path.split("/")[2];
    const amenity = fallbackStore["/room-amenities"].find((item) => item.id === amenityId);

    if (!amenity) {
      throw new Error("Comodidade nao encontrada.");
    }

    amenity.ativo = false;
    syncFallbackAmenities();

    return null;
  }

  if (path === "/room-accommodation-types" && method === "POST") {
    const payload = JSON.parse(options.body);
    const name = String(payload.nome || "").trim();

    if (!name) {
      throw new Error("Informe o nome do tipo de acomodacao.");
    }

    const existing = fallbackStore["/room-accommodation-types"].find(
      (item) => item.nome.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      existing.ativo = true;
      existing.nome = name;
      existing.descricao = payload.descricao || existing.descricao || "";
      syncFallbackRoomTypeMetadata();
      return existing;
    }

    const record = {
      id: createFallbackId(),
      nome: name,
      descricao: payload.descricao || "",
      ativo: true
    };

    fallbackStore["/room-accommodation-types"] = [
      ...fallbackStore["/room-accommodation-types"],
      record
    ];
    syncFallbackRoomTypeMetadata();
    return record;
  }

  if (path.startsWith("/room-accommodation-types/") && method === "PUT") {
    const typeId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/room-accommodation-types"].find((item) => item.id === typeId);

    if (!current) {
      throw new Error("Tipo de acomodacao nao encontrado.");
    }

    current.nome = String(payload.nome || current.nome).trim() || current.nome;
    current.descricao = payload.descricao ?? current.descricao ?? "";
    current.ativo = payload.ativo ?? current.ativo ?? true;
    fallbackStore["/rooms"] = fallbackStore["/rooms"].map((room) => (
      room.tipo_acomodacao_id === typeId
        ? { ...room, tipo_acomodacao: current.nome }
        : room
    ));
    syncFallbackRoomTypeMetadata();
    return current;
  }

  if (path.startsWith("/room-accommodation-types/") && path.endsWith("/active") && method === "PATCH") {
    const typeId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/room-accommodation-types"].find((item) => item.id === typeId);

    if (!current) {
      throw new Error("Tipo de acomodacao nao encontrado.");
    }

    current.ativo = payload.ativo ?? current.ativo ?? true;
    syncFallbackRoomTypeMetadata();
    return current;
  }

  if (path.startsWith("/room-accommodation-types/") && method === "DELETE") {
    const typeId = path.split("/")[2];
    const inUse = fallbackStore["/rooms"].some((room) => room.tipo_acomodacao_id === typeId);

    if (inUse) {
      throw new Error("Nao e possivel excluir um tipo de acomodacao em uso.");
    }

    fallbackStore["/room-accommodation-types"] = fallbackStore["/room-accommodation-types"].filter((item) => item.id !== typeId);
    syncFallbackRoomTypeMetadata();
    return null;
  }

  if (path === "/room-types" && method === "POST") {
    const payload = JSON.parse(options.body);
    const name = String(payload.nome || "").trim();

    if (!name) {
      throw new Error("Informe o nome do tipo de quarto.");
    }

    const existing = fallbackStore["/room-types"].find(
      (item) => item.nome.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      existing.ativo = true;
      existing.nome = name;
      existing.descricao = payload.descricao || existing.descricao || "";
      syncFallbackRoomTypeMetadata();
      return existing;
    }

    const record = {
      id: createFallbackId(),
      nome: name,
      descricao: payload.descricao || "",
      ativo: true
    };

    fallbackStore["/room-types"] = [...fallbackStore["/room-types"], record];
    syncFallbackRoomTypeMetadata();
    return record;
  }

  if (path.startsWith("/room-types/") && method === "PUT") {
    const typeId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/room-types"].find((item) => item.id === typeId);

    if (!current) {
      throw new Error("Tipo de quarto nao encontrado.");
    }

    current.nome = String(payload.nome || current.nome).trim() || current.nome;
    current.descricao = payload.descricao ?? current.descricao ?? "";
    current.ativo = payload.ativo ?? current.ativo ?? true;
    fallbackStore["/rooms"] = fallbackStore["/rooms"].map((room) => (
      room.tipo_quarto_id === typeId
        ? { ...room, tipo_quarto: current.nome }
        : room
    ));
    syncFallbackRoomTypeMetadata();
    return current;
  }

  if (path.startsWith("/room-types/") && path.endsWith("/active") && method === "PATCH") {
    const typeId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/room-types"].find((item) => item.id === typeId);

    if (!current) {
      throw new Error("Tipo de quarto nao encontrado.");
    }

    current.ativo = payload.ativo ?? current.ativo ?? true;
    syncFallbackRoomTypeMetadata();
    return current;
  }

  if (path.startsWith("/room-types/") && method === "DELETE") {
    const typeId = path.split("/")[2];
    const inUse = fallbackStore["/rooms"].some((room) => room.tipo_quarto_id === typeId);

    if (inUse) {
      throw new Error("Nao e possivel excluir um tipo de quarto em uso.");
    }

    fallbackStore["/room-types"] = fallbackStore["/room-types"].filter((item) => item.id !== typeId);
    syncFallbackRoomTypeMetadata();
    return null;
  }

  if (path === "/people/users" && method === "POST") {
    const payload = JSON.parse(options.body);
    const user = {
      id: createFallbackId(),
      nome: String(payload.nome || "").trim(),
      usuario: String(payload.usuario || "").trim(),
      perfil: payload.perfil || "recepcao",
      ativo: payload.ativo ?? true
    };

    if (!user.nome || !user.usuario) {
      throw new Error("Informe nome e usuario do sistema.");
    }

    fallbackStore["/people/users"] = [user, ...fallbackStore["/people/users"]];
    return user;
  }

  if (path.startsWith("/people/users/") && method === "PUT") {
    const userId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/people/users"].find((item) => item.id === userId);

    if (!current) {
      throw new Error("Usuario do sistema nao encontrado.");
    }

    const updated = {
      ...current,
      nome: String(payload.nome || current.nome).trim(),
      usuario: String(payload.usuario || current.usuario).trim(),
      perfil: payload.perfil || current.perfil,
      ativo: payload.ativo ?? current.ativo
    };

    fallbackStore["/people/users"] = fallbackStore["/people/users"].map((item) => item.id === userId ? updated : item);
    return updated;
  }

  if (path.startsWith("/people/users/") && method === "DELETE") {
    const userId = path.split("/")[3];
    fallbackStore["/people/users"] = fallbackStore["/people/users"].filter((item) => item.id !== userId);
    return null;
  }

  if (path === "/people/sellers" && method === "POST") {
    const payload = JSON.parse(options.body);
    const seller = {
      id: createFallbackId(),
      nome: String(payload.nome || "").trim(),
      apelido: String(payload.apelido || "").trim(),
      tipo: payload.tipo || "garcom",
      ativo: payload.ativo ?? true
    };

    if (!seller.nome) {
      throw new Error("Informe o nome do vendedor.");
    }

    fallbackStore["/people/sellers"] = [seller, ...fallbackStore["/people/sellers"]];
    return seller;
  }

  if (path.startsWith("/people/sellers/") && method === "PUT") {
    const sellerId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/people/sellers"].find((item) => item.id === sellerId);

    if (!current) {
      throw new Error("Vendedor nao encontrado.");
    }

    const updated = {
      ...current,
      nome: String(payload.nome || current.nome).trim(),
      apelido: String(payload.apelido || current.apelido).trim(),
      tipo: payload.tipo || current.tipo,
      ativo: payload.ativo ?? current.ativo
    };

    fallbackStore["/people/sellers"] = fallbackStore["/people/sellers"].map((item) => item.id === sellerId ? updated : item);
    return updated;
  }

  if (path.startsWith("/people/sellers/") && method === "DELETE") {
    const sellerId = path.split("/")[3];
    fallbackStore["/people/sellers"] = fallbackStore["/people/sellers"].filter((item) => item.id !== sellerId);
    return null;
  }

  if (path === "/pos/cash-session/open" && method === "POST") {
    const payload = JSON.parse(options.body);
    const current = getCurrentCashSession();

    if (current) {
      throw new Error("Ja existe um caixa aberto para este operador.");
    }

    const session = {
      id: createFallbackId(),
      operador_id: payload.operadorId || "user-1",
      operador_nome: "Operador Atual",
      status: "aberto",
      opened_at: new Date().toISOString(),
      valor_inicial: Number(payload.valorInicial || 0),
      total_vendido: 0,
      total_suprimentos: 0,
      total_sangrias: 0,
      diferenca_caixa: 0,
      observacoes: payload.observacoes || ""
    };

    fallbackStore["/pos/cash-sessions"] = [session, ...fallbackStore["/pos/cash-sessions"]];
    fallbackStore["/pos/cash-movements"] = [
      {
        id: createFallbackId(),
        cash_session_id: session.id,
        tipo: "abertura",
        valor: session.valor_inicial,
        motivo: "Abertura de caixa",
        operador_id: session.operador_id,
        observacoes: session.observacoes,
        created_at: session.opened_at
      },
      ...fallbackStore["/pos/cash-movements"]
    ];

    return session;
  }

  if (path === "/pos/cash-register/open" && method === "POST") {
    return fallbackRequest("/pos/cash-session/open", options);
  }

  if (path.startsWith("/pos/cash-session/") && path.endsWith("/supply") && method === "POST") {
    const sessionId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const movement = {
      id: createFallbackId(),
      cash_session_id: sessionId,
      tipo: "suprimento",
      valor: Number(payload.valor || 0),
      motivo: payload.motivo,
      operador_id: payload.operadorId || "user-1",
      observacoes: payload.observacoes || "",
      created_at: new Date().toISOString()
    };
    fallbackStore["/pos/cash-movements"] = [movement, ...fallbackStore["/pos/cash-movements"]];
    const session = fallbackStore["/pos/cash-sessions"].find((item) => item.id === sessionId);
    if (session) {
      session.total_suprimentos = Number(session.total_suprimentos || 0) + movement.valor;
    }
    return movement;
  }

  if (path === "/pos/cash-register/supply" && method === "POST") {
    const session = getCurrentCashSession();
    return fallbackRequest(`/pos/cash-session/${session?.id}/supply`, options);
  }

  if (path.startsWith("/pos/cash-session/") && path.endsWith("/withdraw") && method === "POST") {
    const sessionId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const movement = {
      id: createFallbackId(),
      cash_session_id: sessionId,
      tipo: "sangria",
      valor: Number(payload.valor || 0),
      motivo: payload.motivo,
      operador_id: payload.operadorId || "user-1",
      observacoes: payload.observacoes || "",
      created_at: new Date().toISOString()
    };
    fallbackStore["/pos/cash-movements"] = [movement, ...fallbackStore["/pos/cash-movements"]];
    const session = fallbackStore["/pos/cash-sessions"].find((item) => item.id === sessionId);
    if (session) {
      session.total_sangrias = Number(session.total_sangrias || 0) + movement.valor;
    }
    return movement;
  }

  if (path === "/pos/cash-register/withdraw" && method === "POST") {
    const session = getCurrentCashSession();
    return fallbackRequest(`/pos/cash-session/${session?.id}/withdraw`, options);
  }

  if (path.startsWith("/pos/cash-session/") && path.endsWith("/close") && method === "POST") {
    const sessionId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const session = fallbackStore["/pos/cash-sessions"].find((item) => item.id === sessionId);

    if (!session) {
      throw new Error("Sessao de caixa nao encontrada.");
    }

    const sales = fallbackStore["/pos/sales"].filter((item) => item.caixa_sessao_id === sessionId && item.status !== "cancelada");
    const totalVendido = sales.reduce((sum, item) => sum + Number(item.valor_total || 0), 0);
    const expectedCash =
      Number(session.valor_inicial || 0) +
      sales.flatMap((sale) => sale.pagamentos || []).filter((payment) => payment.metodo === "dinheiro").reduce((sum, payment) => sum + Number(payment.valor || 0), 0) +
      Number(session.total_suprimentos || 0) -
      Number(session.total_sangrias || 0);

    session.status = "fechado";
    session.closed_at = new Date().toISOString();
    session.total_vendido = Number(totalVendido.toFixed(2));
    session.dinheiro_contado = Number(payload.dinheiroContado || 0);
    session.total_cartao_debito = Number(payload.cartaoDebito || 0);
    session.total_cartao_credito = Number(payload.cartaoCredito || 0);
    session.total_pix = Number(payload.pix || 0);
    session.total_voucher = Number(payload.voucher || 0);
    session.total_transferencia = Number(payload.transferencia || 0);
    session.total_faturado = Number(payload.faturado || 0);
    session.total_cortesia = Number(payload.cortesia || 0);
    session.total_outros = Number(payload.outros || 0);
    session.diferenca_caixa = Number((Number(payload.dinheiroContado || 0) - expectedCash).toFixed(2));
    session.fechamento_resumo = {
      expectedCash: Number(expectedCash.toFixed(2)),
      counted: payload
    };
    return session;
  }

  if (path === "/pos/cash-register/close" && method === "POST") {
    const session = getCurrentCashSession();
    return fallbackRequest(`/pos/cash-session/${session?.id}/close`, options);
  }

  if (path === "/pos/sales" && method === "POST") {
    const payload = JSON.parse(options.body);
    const session = getCurrentCashSession();
    const productsMap = new Map(fallbackStore["/products"].map((item) => [item.id, item]));
    const systemUser = fallbackStore["/people/users"].find((item) => item.id === payload.usuarioSistemaId) || fallbackStore["/people/users"][0] || null;
    const seller = fallbackStore["/people/sellers"].find((item) => item.id === payload.vendedorId) || fallbackStore["/people/sellers"][0] || null;
    const subtotal = (payload.itens || []).reduce(
      (sum, item) => sum + Number(item.quantidade || 0) * Number(item.precoUnitario || 0),
      0
    );
    const totalItemDiscount = (payload.itens || []).reduce(
      (sum, item) => sum + Number(item.desconto || 0),
      0
    );
    const total = Number(
      (subtotal - totalItemDiscount - Number(payload.descontoGeral || 0) + Number(payload.acrescimo || 0)).toFixed(2)
    );
    const reservation = fallbackStore["/reservations"].find((item) => item.id === payload.reservaId);
    const guest = fallbackStore["/guests"].find((item) => item.id === payload.hospedeId);
    const room = fallbackStore["/rooms"].find((item) => item.id === payload.quartoId);
    const account = fallbackStore["/guest-accounts"].find((item) => item.id === payload.contaHospedagemId);
    const saleId = createFallbackId();
    const sale = {
      id: saleId,
      codigo: `VEN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      origem_venda: payload.origemVenda,
      tipo: payload.origemVenda,
      hospede_id: payload.hospedeId || null,
      hospede_nome: guest?.nome || "",
      quarto_id: payload.quartoId || null,
      quarto_numero: room?.numero || "",
      reserva_id: payload.reservaId || null,
      conta_hospedagem_id: payload.contaHospedagemId || null,
      caixa_sessao_id: session?.id || null,
      operador_nome: systemUser?.nome || "Operador Atual",
      usuario_sistema_id: systemUser?.id || null,
      usuario_sistema_nome: systemUser?.nome || "Operador Atual",
      vendedor_id: seller?.id || null,
      vendedor_nome: seller?.nome || "Atendimento interno",
      valor_total: total,
      subtotal: Number(subtotal.toFixed(2)),
      desconto_geral: Number(payload.descontoGeral || 0),
      acrescimo: Number(payload.acrescimo || 0),
      status: "concluida",
      status_fiscal:
        payload.emitirDocumento === "nfce" || payload.emitirDocumento === "nfe"
          ? "autorizado"
          : payload.emitirDocumento === "conta_hospede"
            ? "sem_documento"
            : "sem_documento",
      documento_tipo:
        payload.emitirDocumento === "nfce" ? "NFCe" :
        payload.emitirDocumento === "nfe" ? "NFe" :
        null,
      documento_id:
        payload.emitirDocumento === "nfce" || payload.emitirDocumento === "nfe"
          ? createFallbackId()
          : null,
      lancar_na_conta: Boolean(payload.lancarNaConta),
      cobrar_imediatamente: Boolean(payload.cobrarImediatamente),
      observacoes: payload.observacoes || "",
      created_at: new Date().toISOString(),
      itens: (payload.itens || []).map((item) => {
        const product = productsMap.get(item.produtoId) || {};
        if (product.id) {
          product.quantidade_atual = Number(product.quantidade_atual || 0) - Number(item.quantidade || 0);
        }
        return {
          id: createFallbackId(),
          produto_id: item.produtoId,
          produto_nome: product.nome || "",
          quantidade: Number(item.quantidade || 0),
          preco_unitario: Number(item.precoUnitario || 0),
          desconto: Number(item.desconto || 0),
          observacoes: item.observacoes || ""
        };
      }),
      pagamentos: (payload.pagamentos || []).map((payment) => ({
        id: createFallbackId(),
        metodo: payment.metodo,
        valor: Number(payment.valor || 0),
        status: "confirmado",
        observacoes: payment.observacoes || ""
      })),
      refunds: []
    };

    if (account && payload.lancarNaConta) {
      account.saldo_atual = Number(account.saldo_atual || 0) + total;
    }

    if (reservation && payload.lancarNaConta) {
      reservation.saldo_pendente = Number(reservation.saldo_pendente || 0) + total;
    }

    fallbackStore["/pos/sales"] = [sale, ...fallbackStore["/pos/sales"]];
    fallbackStore["/finance/summary"].receitas += total;
    fallbackStore["/finance/summary"].saldo += total;
    fallbackStore["/finance/summary"].ultimosLancamentos = [
      {
        id: createFallbackId(),
        tipo: "receita",
        categoria: payload.origemVenda,
        descricao: `Venda ${sale.codigo}`,
        valor: total,
        status: payload.cobrarImediatamente ? "liquidado" : "aberto",
        data_lancamento: sale.created_at
      },
      ...fallbackStore["/finance/summary"].ultimosLancamentos
    ].slice(0, 20);
    return sale;
  }

  if (path.startsWith("/pos/sales/") && path.endsWith("/cancel") && method === "POST") {
    const saleId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const sale = fallbackStore["/pos/sales"].find((item) => item.id === saleId);

    if (!sale) {
      throw new Error("Venda nao encontrada.");
    }

    sale.status = "cancelada";
    sale.motivo_cancelamento = payload.motivo;
    (sale.itens || []).forEach((item) => {
      const product = fallbackStore["/products"].find((productItem) => productItem.id === item.produto_id);
      if (product) {
        product.quantidade_atual = Number(product.quantidade_atual || 0) + Number(item.quantidade || 0);
      }
    });
    if (sale.conta_hospedagem_id && sale.lancar_na_conta) {
      const account = fallbackStore["/guest-accounts"].find((item) => item.id === sale.conta_hospedagem_id);
      if (account) {
        account.saldo_atual = Number(account.saldo_atual || 0) - Number(sale.valor_total || 0);
      }
    }
    return sale;
  }

  if (path.startsWith("/pos/sales/") && path.endsWith("/refund") && method === "POST") {
    const saleId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const sale = fallbackStore["/pos/sales"].find((item) => item.id === saleId);

    if (!sale) {
      throw new Error("Venda nao encontrada.");
    }

    for (const refundItem of payload.itens || []) {
      const saleItem = (sale.itens || []).find((item) => item.id === refundItem.saleItemId);
      if (!saleItem) {
        throw new Error("Item da venda nao encontrado.");
      }
      const refund = {
        id: createFallbackId(),
        item_venda_id: refundItem.saleItemId,
        quantidade: Number(refundItem.quantidade || 0),
        valor: Number(((Number(saleItem.preco_unitario || 0) - Number(saleItem.desconto || 0)) * Number(refundItem.quantidade || 0)).toFixed(2)),
        motivo: payload.motivo
      };
      sale.refunds = [refund, ...(sale.refunds || [])];
      const product = fallbackStore["/products"].find((item) => item.id === saleItem.produto_id);
      if (product) {
        product.quantidade_atual = Number(product.quantidade_atual || 0) + Number(refundItem.quantidade || 0);
      }
    }

    return sale;
  }

  if (path.startsWith("/pos/sales/") && path.includes("/fiscal/") && method === "POST") {
    const [, , , saleId, , type] = path.split("/");
    const sale = fallbackStore["/pos/sales"].find((item) => item.id === saleId);
    if (!sale) {
      throw new Error("Venda nao encontrada.");
    }
    sale.documento_tipo = type === "nfce" ? "NFCe" : "NFe";
    sale.status_fiscal = "autorizado";
    sale.documento_id = createFallbackId();
    return {
      id: sale.documento_id,
      tipo: sale.documento_tipo,
      numero: `${sale.documento_tipo}-${sale.codigo}`,
      serie: "1",
      protocolo: `135${Date.now()}`,
      chaveAcesso: `MOCK${Date.now()}`,
      danfeHtml: "<html><body><h1>DANFE Mock</h1></body></html>"
    };
  }

  if (path === "/pos/room-service" && method === "POST") {
    const payload = JSON.parse(options.body);
    const guest = fallbackStore["/guests"].find((item) => item.id === payload.hospedeId);
    const room = fallbackStore["/rooms"].find((item) => item.id === payload.quartoId);
    const account = fallbackStore["/guest-accounts"].find((item) => item.id === payload.contaHospedagemId);
    const total = (payload.itens || []).reduce(
      (sum, item) => sum + Number(item.quantidade || 0) * Number(item.precoUnitario || 0),
      0
    );
    const order = {
      id: createFallbackId(),
      hospede_id: payload.hospedeId,
      hospede_nome: guest?.nome || "",
      quarto_id: payload.quartoId,
      quarto_numero: room?.numero || "",
      conta_hospedagem_id: payload.contaHospedagemId,
      area_entrega: payload.areaEntrega,
      valor_total: Number(total.toFixed(2)),
      status: "novo",
      observacoes: payload.observacoes || "",
      created_at: new Date().toISOString()
    };

    (payload.itens || []).forEach((item) => {
      const product = fallbackStore["/products"].find((productItem) => productItem.id === item.produtoId);
      if (product) {
        product.quantidade_atual = Number(product.quantidade_atual || 0) - Number(item.quantidade || 0);
      }
    });

    if (account) {
      account.saldo_atual = Number(account.saldo_atual || 0) + order.valor_total;
    }

    fallbackStore["/orders"] = [order, ...fallbackStore["/orders"]];
    return order;
  }

  if (path.startsWith("/pos/room-service/") && path.endsWith("/status") && method === "PATCH") {
    const orderId = path.split("/")[3];
    const payload = JSON.parse(options.body);
    const order = fallbackStore["/orders"].find((item) => item.id === orderId);
    if (!order) {
      throw new Error("Pedido nao encontrado.");
    }
    order.status = payload.status;
    order.observacoes = payload.observacoes || order.observacoes;
    return order;
  }

  if (path === "/reservations" && method === "POST") {
    const payload = JSON.parse(options.body);
    const reservation = buildReservationRecord(payload);
    reservation.combos = reservation.combos.map((item) => ({ ...item, reservation_id: reservation.id }));
    reservation.pagamentos = reservation.pagamentos.map((item) => ({ ...item, reservation_id: reservation.id }));
    fallbackStore["/reservations"] = [reservation, ...fallbackStore["/reservations"]];
    return reservation;
  }

  if (path.startsWith("/reservations/availability") && method === "GET") {
    const [, queryString] = path.split("?");
    const params = new URLSearchParams(queryString || "");
    return filterAvailableRooms({
      checkin: params.get("checkin"),
      checkout: params.get("checkout"),
      tipoAcomodacaoId: params.get("tipoAcomodacaoId"),
      tipoQuartoId: params.get("tipoQuartoId"),
      ignoreReservationId: params.get("ignoreReservationId")
    });
  }

  if (path === "/reservations/metadata" && method === "GET") {
    return cloneFallback(path);
  }

  if (path === "/reservations" && method === "GET") {
    return cloneFallback(path);
  }

  if (path.startsWith("/reservations/") && path.endsWith("/consumption") && method === "GET") {
    const reservationId = path.split("/")[2];
    const reservation = fallbackStore["/reservations"].find((item) => item.id === reservationId);
    return {
      vendas: [],
      combos: reservation?.combos || [],
      estoque: (reservation?.combos || [])
        .filter((item) => item.status === "concluido")
        .map((item) => ({
          id: createFallbackId(),
          produto_nome: item.combo_nome,
          quantidade: item.quantidade,
          created_at: new Date().toISOString()
        }))
    };
  }

  if (path.startsWith("/reservations/") && path.endsWith("/add-combo") && method === "POST") {
    const reservationId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const reservation = fallbackStore["/reservations"].find((item) => item.id === reservationId);
    const definition = fallbackStore["/combos"].find((item) => item.id === payload.combo_definition_id);

    if (!reservation || !definition) {
      throw new Error("Reserva ou combo nao encontrado.");
    }

    const combo = {
      id: createFallbackId(),
      reservation_id: reservationId,
      combo_definition_id: payload.combo_definition_id,
      combo_nome: definition.nome,
      quantidade: Number(payload.quantidade || 1),
      preco_unitario: Number(payload.preco_unitario ?? definition.preco),
      valor_total: Number(payload.valor_total ?? Number(payload.quantidade || 1) * Number(payload.preco_unitario ?? definition.preco)),
      status: payload.status || "contratado",
      data_agendada: payload.data_agendada || null,
      observacoes: payload.observacoes || ""
    };

    reservation.combos = [...reservation.combos, combo];
    reservation.valor_total += combo.valor_total;
    reservation.saldo_pendente = reservation.valor_total - reservation.valor_pago;
    return combo;
  }

  if (path.startsWith("/reservations/") && path.endsWith("/execute-combo") && method === "POST") {
    const reservationId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const reservation = fallbackStore["/reservations"].find((item) => item.id === reservationId);
    const combo = reservation?.combos.find((item) => item.id === payload.reservation_combo_item_id);

    if (!combo) {
      throw new Error("Combo contratado nao encontrado.");
    }

    combo.status = "concluido";
    return combo;
  }

  if (path.startsWith("/reservations/") && path.endsWith("/status") && method === "PATCH") {
    const reservationId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const reservation = fallbackStore["/reservations"].find((item) => item.id === reservationId);

    if (!reservation) {
      throw new Error("Reserva nao encontrada.");
    }

    reservation.status = payload.status;
    return reservation;
  }

  if (path.startsWith("/reservations/") && method === "PUT") {
    const reservationId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/reservations"].find((item) => item.id === reservationId);

    if (!current) {
      throw new Error("Reserva nao encontrada.");
    }

    const updated = buildReservationRecord(payload, current);
    updated.id = reservationId;
    updated.combos = updated.combos.map((item) => ({ ...item, reservation_id: reservationId }));
    updated.pagamentos = updated.pagamentos.map((item) => ({ ...item, reservation_id: reservationId }));
    fallbackStore["/reservations"] = fallbackStore["/reservations"].map((item) => item.id === reservationId ? updated : item);
    return updated;
  }

  if (path.startsWith("/reservations/") && method === "DELETE") {
    const reservationId = path.split("/")[2];
    fallbackStore["/reservations"] = fallbackStore["/reservations"].filter((item) => item.id !== reservationId);
    return null;
  }

  if (path.startsWith("/reservations/") && method === "GET") {
    const reservationId = path.split("/")[2];
    return cloneFallback("/reservations").find((item) => item.id === reservationId);
  }

  if (path === "/combos" && method === "GET") {
    return cloneFallback(path);
  }

  if (path === "/combos" && method === "POST") {
    const payload = JSON.parse(options.body);
    const combo = {
      id: createFallbackId(),
      ...payload,
      itens: (payload.itens || []).map((item) => {
        const product = fallbackStore["/products"].find((productItem) => productItem.id === item.produto_id) || {};
        return {
          id: createFallbackId(),
          ...item,
          produto_nome: product.nome || ""
        };
      })
    };
    fallbackStore["/combos"] = [combo, ...fallbackStore["/combos"]];
    fallbackStore["/reservations/metadata"].combos = fallbackStore["/combos"];
    return combo;
  }

  if (path.startsWith("/combos/") && method === "PUT") {
    const comboId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const updated = {
      id: comboId,
      ...payload,
      itens: (payload.itens || []).map((item) => {
        const product = fallbackStore["/products"].find((productItem) => productItem.id === item.produto_id) || {};
        return {
          id: item.id || createFallbackId(),
          ...item,
          produto_nome: product.nome || ""
        };
      })
    };
    fallbackStore["/combos"] = fallbackStore["/combos"].map((item) => item.id === comboId ? updated : item);
    fallbackStore["/reservations/metadata"].combos = fallbackStore["/combos"];
    return updated;
  }

  if (path.startsWith("/combos/") && method === "DELETE") {
    const comboId = path.split("/")[2];
    fallbackStore["/combos"] = fallbackStore["/combos"].filter((item) => item.id !== comboId);
    fallbackStore["/reservations/metadata"].combos = fallbackStore["/combos"];
    return null;
  }

  if (path === "/guests" && method === "POST") {
    const payload = JSON.parse(options.body);
    const guest = buildFallbackGuestRecord(payload);
    fallbackStore["/guests"] = [...fallbackStore["/guests"], guest];
    fallbackStore["/reservations/metadata"].hospedes = normalizeGuestCollection(fallbackStore["/guests"]);
    return guest;
  }

  if (path.startsWith("/guests/") && method === "PUT") {
    const guestId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/guests"].find((item) => item.id === guestId);

    if (!current) {
      throw new Error("Hospede nao encontrado.");
    }

    const updated = buildFallbackGuestRecord(payload, current);
    updated.id = guestId;
    updated.documents = current.documents || [];
    fallbackStore["/guests"] = fallbackStore["/guests"].map((item) => item.id === guestId ? updated : item);
    fallbackStore["/reservations/metadata"].hospedes = normalizeGuestCollection(fallbackStore["/guests"]);
    return updated;
  }

  if (path.startsWith("/guests/") && method === "DELETE") {
    const guestId = path.split("/")[2];
    fallbackStore["/guests"] = fallbackStore["/guests"].filter((item) => item.id !== guestId);
    fallbackStore["/reservations/metadata"].hospedes = normalizeGuestCollection(fallbackStore["/guests"]);
    return null;
  }

  if (path.startsWith("/guests/") && method === "GET") {
    const guestId = path.split("/")[2];
    const guest = fallbackStore["/guests"].find((item) => item.id === guestId);
    if (!guest) {
      throw new Error("Hospede nao encontrado.");
    }
    return normalizeGuestRecord(guest);
  }

  if (path === "/products" && method === "POST") {
    const payload = JSON.parse(options.body);
    const product = {
      id: createFallbackId(),
      nome: payload.nome,
      categoria: payload.categoria,
      preco: Number(payload.preco || 0),
      codigo_barras: payload.codigoBarras || "",
      internal_code: payload.codigoInterno || "",
      quantidade_atual: Number(payload.estoqueInicial || 0),
      tipo_produto: payload.tipoProduto || "consumo",
      permite_combo: Boolean(payload.permiteCombo),
      image_url: buildProductPlaceholder(payload.nome || "Sem imagem"),
      image_filename: null
    };

    fallbackStore["/products"] = [product, ...fallbackStore["/products"]];
    fallbackStore["/reservations/metadata"].produtos = fallbackStore["/products"];
    return product;
  }

  if (path.startsWith("/settings/") && method === "PUT") {
    const settingKey = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/settings"].find((item) => item.chave === settingKey);

    if (!current) {
      throw new Error("Configuracao nao encontrada.");
    }

    current.valor = payload.valor ?? current.valor;
    current.secao = payload.secao || current.secao;
    return current;
  }

  if (path === "/settings/company" && method === "PUT") {
    const payload = JSON.parse(options.body);
    fallbackStore["/settings/company"] = {
      ...fallbackStore["/settings/company"],
      ...payload,
      subtitle: "Hotel ERP - Operacao e fiscal"
    };
    return normalizeCompanyRecord(fallbackStore["/settings/company"]);
  }

  if (path === "/settings/company/logo" && method === "POST") {
    const file = options.body instanceof FormData ? options.body.get("logo") : null;
    if (!file) {
      throw new Error("Selecione uma logomarca para upload.");
    }

    fallbackStore["/settings/company"].logo_url = await fileToDataUrl(file);
    fallbackStore["/settings/company"].logo_filename = file.name || "logo.png";
    return normalizeCompanyRecord(fallbackStore["/settings/company"]);
  }

  if (path === "/settings/company/logo" && method === "DELETE") {
    fallbackStore["/settings/company"].logo_url = "";
    fallbackStore["/settings/company"].logo_filename = "";
    return normalizeCompanyRecord(fallbackStore["/settings/company"]);
  }

  if (path.startsWith("/products/") && method === "PUT") {
    const productId = path.split("/")[2];
    const payload = JSON.parse(options.body);
    const current = fallbackStore["/products"].find((item) => item.id === productId);

    if (!current) {
      throw new Error("Produto nao encontrado.");
    }

    const updated = {
      ...current,
      nome: payload.nome,
      categoria: payload.categoria,
      preco: Number(payload.preco || 0),
      codigo_barras: payload.codigoBarras || "",
      internal_code: payload.codigoInterno || "",
      quantidade_atual: typeof payload.estoqueInicial === "number" ? payload.estoqueInicial : current.quantidade_atual,
      tipo_produto: payload.tipoProduto || current.tipo_produto,
      permite_combo: Boolean(payload.permiteCombo),
      image_url: current.image_url || buildProductPlaceholder(payload.nome || current.nome)
    };

    fallbackStore["/products"] = fallbackStore["/products"].map((item) => item.id === productId ? updated : item);
    fallbackStore["/reservations/metadata"].produtos = fallbackStore["/products"];
    return updated;
  }

  if (path.startsWith("/products/") && path.endsWith("/image") && method === "POST") {
    const productId = path.split("/")[2];
    const current = fallbackStore["/products"].find((item) => item.id === productId);

    if (!current) {
      throw new Error("Produto nao encontrado.");
    }

    const file = options.body instanceof FormData ? options.body.get("image") : null;

    if (!file) {
      throw new Error("Selecione uma imagem para upload.");
    }

    current.image_url = await fileToDataUrl(file);
    current.image_filename = file.name || `mock-${productId}.jpg`;
    return current;
  }

  if (path.startsWith("/products/") && path.endsWith("/image") && method === "DELETE") {
    const productId = path.split("/")[2];
    const current = fallbackStore["/products"].find((item) => item.id === productId);

    if (!current) {
      throw new Error("Produto nao encontrado.");
    }

    current.image_url = null;
    current.image_filename = null;
    return null;
  }

  throw new Error("Operacao indisponivel no fallback.");
}

export async function apiGet(path) {
  return request(path);
}

export async function apiPost(path, payload) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function apiPut(path, payload) {
  return request(path, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function apiDelete(path) {
  return request(path, {
    method: "DELETE"
  });
}

export async function apiPatch(path, payload) {
  return request(path, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function loginRequest(payload) {
  return apiPost("/auth/login", payload);
}

export async function logoutRequest() {
  return request("/auth/logout", { method: "POST" });
}

export async function fetchCurrentUser() {
  return apiGet("/auth/me");
}

export async function updateCurrentUserProfile(payload) {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  });
}

export async function registerUser(payload) {
  return apiPost("/auth/register", payload);
}

export async function changePassword(payload) {
  return request("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  });
}

export async function fetchRooms(status = "") {
  return apiGet(`/rooms${status ? `?status=${encodeURIComponent(status)}` : ""}`);
}

export async function fetchRoomMetadata() {
  return apiGet("/rooms/metadata");
}

export async function fetchRoomAccommodationTypes(includeInactive = true) {
  return apiGet(`/room-accommodation-types?include_inactive=${includeInactive ? "true" : "false"}`);
}

export async function createRoomAccommodationType(payload) {
  return apiPost("/room-accommodation-types", payload);
}

export async function updateRoomAccommodationType(typeId, payload) {
  return apiPut(`/room-accommodation-types/${typeId}`, payload);
}

export async function toggleRoomAccommodationType(typeId, ativo) {
  return apiPatch(`/room-accommodation-types/${typeId}/active`, { ativo });
}

export async function deleteRoomAccommodationType(typeId) {
  return apiDelete(`/room-accommodation-types/${typeId}`);
}

export async function fetchRoomTypes(includeInactive = true) {
  return apiGet(`/room-types?include_inactive=${includeInactive ? "true" : "false"}`);
}

export async function createRoomType(payload) {
  return apiPost("/room-types", payload);
}

export async function updateRoomType(typeId, payload) {
  return apiPut(`/room-types/${typeId}`, payload);
}

export async function toggleRoomType(typeId, ativo) {
  return apiPatch(`/room-types/${typeId}/active`, { ativo });
}

export async function deleteRoomType(typeId) {
  return apiDelete(`/room-types/${typeId}`);
}

export async function fetchRoomAmenities() {
  return apiGet("/room-amenities");
}

export async function createRoomAmenity(payload) {
  return apiPost("/room-amenities", payload);
}

export async function updateRoomAmenity(amenityId, payload) {
  return apiPut(`/room-amenities/${amenityId}`, payload);
}

export async function deleteRoomAmenity(amenityId) {
  return apiDelete(`/room-amenities/${amenityId}`);
}

export async function createRoom(payload) {
  return apiPost("/rooms", payload);
}

export async function updateRoom(roomId, payload) {
  return apiPut(`/rooms/${roomId}`, payload);
}

export async function deleteRoom(roomId) {
  return apiDelete(`/rooms/${roomId}`);
}

export async function updateRoomStatus(roomId, status) {
  return apiPatch(`/rooms/${roomId}/status`, { status });
}

export async function fetchProducts() {
  return normalizeProductCollection(await apiGet("/products"));
}

export async function searchProducts(queryText) {
  return normalizeProductCollection(await apiGet(`/products/search?q=${encodeURIComponent(queryText)}`));
}

export async function createProduct(payload) {
  return normalizeProductRecord(await apiPost("/products", payload));
}

export async function updateProduct(productId, payload) {
  return normalizeProductRecord(await apiPut(`/products/${productId}`, payload));
}

export async function uploadProductImage(productId, file) {
  const formData = new FormData();
  formData.append("image", file);

  return normalizeProductRecord(await request(`/products/${productId}/image`, {
    method: "POST",
    body: formData
  }));
}

export async function deleteProductImage(productId) {
  return apiDelete(`/products/${productId}/image`);
}

export async function fetchPosOverview() {
  return normalizePosOverview(await apiGet("/pos/overview"));
}

export async function fetchPosReports() {
  return apiGet("/pos/reports");
}

export async function fetchPosSales() {
  return apiGet("/pos/sales");
}

export async function fetchPosSale(id) {
  return apiGet(`/pos/sales/${id}`);
}

export async function openCashSession(payload) {
  return apiPost("/pos/cash-session/open", payload);
}

export async function createCashSupply(sessionId, payload) {
  return apiPost(`/pos/cash-session/${sessionId}/supply`, payload);
}

export async function createCashWithdrawal(sessionId, payload) {
  return apiPost(`/pos/cash-session/${sessionId}/withdraw`, payload);
}

export async function closeCashSession(sessionId, payload) {
  return apiPost(`/pos/cash-session/${sessionId}/close`, payload);
}

export async function createPosSale(payload) {
  return apiPost("/pos/sales", payload);
}

export async function cancelPosSale(id, payload) {
  return apiPost(`/pos/sales/${id}/cancel`, payload);
}

export async function refundPosSale(id, payload) {
  return apiPost(`/pos/sales/${id}/refund`, payload);
}

export async function emitPosFiscal(id, type) {
  return apiPost(`/pos/sales/${id}/fiscal/${type}`, {});
}

export async function reprintFiscalDocument(documentId) {
  return apiGet(`/pos/fiscal/${documentId}/reprint`);
}

export async function createPosRoomService(payload) {
  return apiPost("/pos/room-service", payload);
}

export async function updatePosRoomServiceStatus(id, payload) {
  return apiPatch(`/pos/room-service/${id}/status`, payload);
}

export async function fetchReservations() {
  return apiGet("/reservations");
}

export async function fetchReservation(id) {
  return apiGet(`/reservations/${id}`);
}

export async function fetchReservationMetadata() {
  return apiGet("/reservations/metadata");
}

export async function fetchReservationAvailability(filters) {
  const params = new URLSearchParams(filters).toString();
  return apiGet(`/reservations/availability${params ? `?${params}` : ""}`);
}

export async function createReservation(payload) {
  return apiPost("/reservations", payload);
}

export async function updateReservation(id, payload) {
  return apiPut(`/reservations/${id}`, payload);
}

export async function updateReservationStatus(id, status) {
  return request(`/reservations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    headers: { "Content-Type": "application/json" }
  });
}

export async function deleteReservation(id) {
  return apiDelete(`/reservations/${id}`);
}

export async function fetchCombos() {
  return apiGet("/combos");
}

export async function createCombo(payload) {
  return apiPost("/combos", payload);
}

export async function updateCombo(comboId, payload) {
  return apiPut(`/combos/${comboId}`, payload);
}

export async function deleteCombo(comboId) {
  return apiDelete(`/combos/${comboId}`);
}

export async function addReservationCombo(reservationId, payload) {
  return apiPost(`/reservations/${reservationId}/add-combo`, payload);
}

export async function executeReservationCombo(reservationId, reservationComboItemId) {
  return apiPost(`/reservations/${reservationId}/execute-combo`, {
    reservation_combo_item_id: reservationComboItemId
  });
}

export async function fetchReservationConsumption(reservationId) {
  return apiGet(`/reservations/${reservationId}/consumption`);
}

export async function fetchGuests() {
  return normalizeGuestCollection(await apiGet("/guests"));
}

export async function fetchGuest(id) {
  return normalizeGuestRecord(await apiGet(`/guests/${id}`));
}

export async function createGuest(payload) {
  return normalizeGuestRecord(await apiPost("/guests", payload));
}

export async function updateGuest(id, payload) {
  return normalizeGuestRecord(await apiPut(`/guests/${id}`, payload));
}

export async function deleteGuest(id) {
  return apiDelete(`/guests/${id}`);
}

export async function fetchGuestDocuments(guestId) {
  return apiGet(`/guests/${guestId}/documents`);
}

export async function uploadGuestDocument(guestId, payload) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("document_type", payload.documentType || "Outro");
  formData.append("description", payload.description || "");

  return request(`/guests/${guestId}/documents`, {
    method: "POST",
    body: formData
  });
}

export async function viewGuestDocument(guestId, documentId) {
  return apiGet(`/guests/${guestId}/documents/${documentId}/view`);
}

export async function downloadGuestDocument(guestId, documentId) {
  return apiGet(`/guests/${guestId}/documents/${documentId}/download`);
}

export async function deleteGuestDocument(guestId, documentId) {
  return apiDelete(`/guests/${guestId}/documents/${documentId}`);
}

export async function fetchSystemUsers() {
  return apiGet("/people/users");
}

export async function createSystemUser(payload) {
  return apiPost("/people/users", payload);
}

export async function updateSystemUser(id, payload) {
  return apiPut(`/people/users/${id}`, payload);
}

export async function deleteSystemUser(id) {
  return apiDelete(`/people/users/${id}`);
}

export async function fetchSellers() {
  return apiGet("/people/sellers");
}

export async function createSeller(payload) {
  return apiPost("/people/sellers", payload);
}

export async function updateSeller(id, payload) {
  return apiPut(`/people/sellers/${id}`, payload);
}

export async function deleteSeller(id) {
  return apiDelete(`/people/sellers/${id}`);
}

export async function fetchGuestAppData(accountId) {
  return apiGet(`/guest-app/${accountId}`);
}

export async function createGuestAppOrder(accountId, payload) {
  return apiPost(`/guest-app/${accountId}/orders`, payload);
}

export async function updateSetting(settingKey, payload) {
  return apiPut(`/settings/${settingKey}`, payload);
}

export async function fetchCompanySettings() {
  return normalizeCompanyRecord(await apiGet("/settings/company"));
}

export async function updateCompanySettings(payload) {
  return normalizeCompanyRecord(await apiPut("/settings/company", payload));
}

export async function uploadCompanyLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);

  return normalizeCompanyRecord(await request("/settings/company/logo", {
    method: "POST",
    body: formData
  }));
}

export async function deleteCompanyLogo() {
  return normalizeCompanyRecord(await apiDelete("/settings/company/logo"));
}
