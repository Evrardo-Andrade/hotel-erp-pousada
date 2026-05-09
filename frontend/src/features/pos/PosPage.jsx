import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  cancelPosSale,
  closeCashSession,
  createCashSupply,
  createCashWithdrawal,
  createPosSale,
  fetchPosOverview,
  openCashSession,
  searchProducts
} from "../../services/api";

const paymentMethodOptions = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_debito", label: "Cartao debito" },
  { value: "cartao_credito", label: "Cartao credito" },
  { value: "voucher", label: "Voucher" },
  { value: "transferencia", label: "Transferencia" },
  { value: "faturado", label: "Faturado" },
  { value: "cortesia", label: "Cortesia" }
];

function getPaymentMethodLabel(value) {
  return paymentMethodOptions.find((item) => item.value === value)?.label || value || "Nao informado";
}

const posSections = [
  { id: "venda", label: "Venda", active: true },
  { id: "pedido", label: "Pedido" }
];

const initialCashForm = {
  valor: "",
  motivo: "",
  observacoes: ""
};

const initialCloseForm = {
  dinheiroContado: "",
  cartaoDebito: "",
  cartaoCredito: "",
  pix: "",
  voucher: "",
  transferencia: "",
  outros: "",
  observacoes: ""
};

const initialLinkState = {
  mode: "avulsa",
  guestId: "",
  reservationId: "",
  roomId: "",
  guestAccountId: "",
  chargeNow: true,
  launchToGuestAccount: false
};

const initialCustomerState = {
  type: "consumidor_final",
  nome: "",
  cpf: "",
  cnpj: "",
  endereco: "",
  ie: "",
  municipio: "",
  uf: "MS"
};

function buildSaleNumber() {
  return `TMP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function toCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function ModalFrame({ title, subtitle, isOpen, onClose, children, size = "large-modal" }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className={`modal-card ${size}`} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading room-form-heading">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function buildReceiptHtml({ sale, items, total, subtitle, title }) {
  const createdAt = sale?.created_at
    ? new Date(sale.created_at).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");
  const paymentRows = (sale?.pagamentos || [])
    .map((payment) => `<p><strong>${getPaymentMethodLabel(payment.metodo)}:</strong> ${toCurrency(payment.valor || 0)}</p>`)
    .join("");
  const rows = (items || [])
    .map((item) => {
      const name = item.produto_nome || item.nome || "Item";
      const quantity = Number(item.quantidade || 0);
      const unitPrice = toCurrency(item.preco_unitario ?? item.precoUnitario ?? 0);
      const lineTotal = toCurrency(item.valor_total ?? item.total ?? (quantity * Number(item.preco_unitario ?? item.precoUnitario ?? 0)));
      return `
        <tr>
          <td>${name}</td>
          <td>${quantity}</td>
          <td>${unitPrice}</td>
          <td>${lineTotal}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title || "Comprovante de venda"}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          p { margin: 0 0 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border: 1px solid #d5dce3; padding: 8px; text-align: left; }
          th { background: #f0f4f7; }
          .meta p { margin: 0 0 6px; }
          .section-title { margin-top: 24px; font-size: 16px; font-weight: 700; }
          .total { margin-top: 18px; font-size: 22px; font-weight: 700; text-align: right; }
        </style>
      </head>
      <body>
        <h1>${title || "Comprovante de venda"}</h1>
        <p>${subtitle || "Venda concluida com sucesso."}</p>
        <div class="meta">
          <p><strong>Venda:</strong> ${sale?.codigo || "--"}</p>
          <p><strong>Data:</strong> ${createdAt}</p>
          <p><strong>Usuario do sistema:</strong> ${sale?.usuario_sistema_nome || sale?.operador_nome || "Nao informado"}</p>
          <p><strong>Vendedor:</strong> ${sale?.vendedor_nome || "Nao informado"}</p>
          <p><strong>Status:</strong> ${sale?.status || "--"}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtde</th>
              <th>Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="section-title">Pagamento</div>
        ${paymentRows || "<p><strong>Forma de pagamento:</strong> Nao informado</p>"}
        <div class="total">Total: ${toCurrency(total || sale?.valor_total || 0)}</div>
      </body>
    </html>
  `;
}

export function PosPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [pageError, setPageError] = useState("");
  const [clock, setClock] = useState(new Date());
  const [saleNumber, setSaleNumber] = useState(buildSaleNumber());
  const [saleStatus, setSaleStatus] = useState("Pronto para nova venda");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [cartItems, setCartItems] = useState([]);
  const [saleDiscount, setSaleDiscount] = useState("0");
  const [saleSurcharge, setSaleSurcharge] = useState("0");
  const [couponCode, setCouponCode] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [saleLink, setSaleLink] = useState(initialLinkState);
  const [customerData, setCustomerData] = useState(initialCustomerState);
  const [payments, setPayments] = useState([{ metodo: "dinheiro", valor: "", observacoes: "" }]);
  const [serviceTeam, setServiceTeam] = useState({ systemUserId: "", sellerId: "" });
  const [cashAction, setCashAction] = useState("");
  const [cashForm, setCashForm] = useState(initialCashForm);
  const [closeForm, setCloseForm] = useState(initialCloseForm);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showGuestQrModal, setShowGuestQrModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCancelFinalizedModal, setShowCancelFinalizedModal] = useState(false);
  const [selectedFinalizedSale, setSelectedFinalizedSale] = useState(null);
  const [finalizedReceipt, setFinalizedReceipt] = useState(null);
  const [selectedQrAccountId, setSelectedQrAccountId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [supervisorPassword, setSupervisorPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadOverview();
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      focusSearch();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!overview) {
      return;
    }

    setServiceTeam((current) => ({
      systemUserId: current.systemUserId || overview.systemUsers?.[0]?.id || "",
      sellerId: current.sellerId || overview.sellers?.[0]?.id || ""
    }));
  }, [overview]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await searchProducts(search);
        setSearchResults(data || []);
      } catch (error) {
        setFeedback({ type: "error", message: error.message || "Nao foi possivel buscar produtos." });
      }
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    function handleShortcuts(event) {
      if (event.key === "F2") {
        event.preventDefault();
        startNewSale();
      }

      if (event.key === "F3") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "F4") {
        event.preventDefault();
        setShowLinkModal(true);
      }

      if (event.key === "F6") {
        event.preventDefault();
        cancelCurrentSale();
      }

      if (event.key === "F10") {
        event.preventDefault();
        openFinalizeModal();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (showFinalizeModal) {
          setShowFinalizeModal(false);
          return;
        }

        if (showReceiptModal) {
          setShowReceiptModal(false);
          return;
        }

        if (showGuestQrModal) {
          setShowGuestQrModal(false);
          return;
        }

        if (showLinkModal) {
          setShowLinkModal(false);
          return;
        }

        if (showCashModal) {
          setShowCashModal(false);
          return;
        }

        navigate(-1);
      }
    }

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [navigate, showCashModal, showFinalizeModal, showLinkModal, showReceiptModal, showGuestQrModal]);

  const currentSession = useMemo(() => {
    return overview?.currentSessions?.find((session) => session.status === "aberto") || null;
  }, [overview]);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set((overview?.products || []).map((product) => product.categoria).filter(Boolean))
    );

    return ["Todos", ...categories];
  }, [overview]);

  const categoryCards = useMemo(() => {
    return categoryOptions.map((category) => {
      if (category === "Todos") {
        return {
          id: category,
          label: category,
          imageUrl: (overview?.products || []).find((product) => product.image_url)?.image_url || null
        };
      }

      const product = (overview?.products || []).find((item) => item.categoria === category);
      return {
        id: category,
        label: category,
        imageUrl: product?.image_url || null
      };
    });
  }, [categoryOptions, overview]);

  const selectedGuestAccounts = useMemo(() => {
    return (overview?.guestAccounts || []).filter((account) => {
      if (saleLink.reservationId && account.reserva_id === saleLink.reservationId) {
        return true;
      }

      return saleLink.guestId ? account.hospede_id === saleLink.guestId : false;
    });
  }, [overview, saleLink]);

  const selectedSystemUser = useMemo(() => {
    return (overview?.systemUsers || []).find((item) => item.id === serviceTeam.systemUserId) || null;
  }, [overview, serviceTeam.systemUserId]);

  const selectedSeller = useMemo(() => {
    return (overview?.sellers || []).find((item) => item.id === serviceTeam.sellerId) || null;
  }, [overview, serviceTeam.sellerId]);

  const productTotal = useMemo(() => {
    if (!selectedProduct) {
      return 0;
    }

    return Number((Number(quantity || 0) * Number(selectedProduct.preco || 0)).toFixed(2));
  }, [selectedProduct, quantity]);

  const saleSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [cartItems]);

  const saleTotal = useMemo(() => {
    return Number((
      saleSubtotal -
      Number(saleDiscount || 0) +
      Number(saleSurcharge || 0)
    ).toFixed(2));
  }, [saleSubtotal, saleDiscount, saleSurcharge]);

  const paidAmount = useMemo(() => {
    return Number(
      payments.reduce((sum, payment) => sum + Number(payment.valor || 0), 0).toFixed(2)
    );
  }, [payments]);

  const remainingAmount = useMemo(() => {
    return Number(Math.max(0, saleTotal - paidAmount).toFixed(2));
  }, [saleTotal, paidAmount]);

  const changeAmount = useMemo(() => {
    const cashAmount = payments
      .filter((payment) => payment.metodo === "dinheiro")
      .reduce((sum, payment) => sum + Number(payment.valor || 0), 0);

    if (cashAmount <= 0 || paidAmount <= saleTotal) {
      return 0;
    }

    return Number((paidAmount - saleTotal).toFixed(2));
  }, [payments, paidAmount, saleTotal]);

  const visibleCatalog = useMemo(() => {
    const source = search.trim().length >= 2
      ? searchResults
      : (overview?.products || []).filter((product) => (
          activeCategory === "Todos" ? true : product.categoria === activeCategory
        ));

    return source.slice(0, 24);
  }, [activeCategory, overview, search, searchResults]);

  const selectedQrAccount = useMemo(() => {
    const accountId = selectedQrAccountId || overview?.guestAccounts?.[0]?.id;
    return (overview?.guestAccounts || []).find((item) => item.id === accountId) || null;
  }, [overview, selectedQrAccountId]);

  const guestQrLink = useMemo(() => {
    if (!selectedQrAccount) {
      return "";
    }

    return `${window.location.origin}/guest/${selectedQrAccount.id}`;
  }, [selectedQrAccount]);

  const guestQrImageUrl = useMemo(() => {
    if (!guestQrLink) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(guestQrLink)}`;
  }, [guestQrLink]);

  async function loadOverview() {
    try {
      setIsLoading(true);
      setPageError("");
      const data = await fetchPosOverview();
      setOverview(data || null);
      setSelectedQrAccountId((current) => current || data?.guestAccounts?.[0]?.id || "");
    } catch (error) {
      setPageError(error.message || "Nao foi possivel carregar o PDV.");
    } finally {
      setIsLoading(false);
    }
  }

  function focusSearch() {
    window.setTimeout(() => searchInputRef.current?.focus(), 40);
  }

  function startNewSale() {
    setSaleNumber(buildSaleNumber());
    setSaleStatus("Venda em andamento");
    setSearch("");
    setSearchResults([]);
    setActiveCategory("Todos");
    setSelectedProduct(null);
    setQuantity("1");
    setCartItems([]);
    setSaleDiscount("0");
    setSaleSurcharge("0");
    setCouponCode("");
    setSaleNotes("");
    setSaleLink(initialLinkState);
    setCustomerData(initialCustomerState);
    setPayments([{ metodo: "dinheiro", valor: "", observacoes: "" }]);
    setServiceTeam((current) => ({
      systemUserId: current.systemUserId || overview?.systemUsers?.[0]?.id || "",
      sellerId: current.sellerId || overview?.sellers?.[0]?.id || ""
    }));
    setFeedback({ type: "success", message: "Nova venda iniciada." });
    focusSearch();
  }

  function selectProduct(product) {
    setSelectedProduct(product);
    setQuantity("1");
    setSearch(product.nome);
    setSearchResults([]);
    window.setTimeout(() => quantityInputRef.current?.focus(), 40);
  }

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (searchResults.length) {
      selectProduct(searchResults[0]);
      return;
    }

    if (selectedProduct) {
      addSelectedProduct();
    }
  }

  function handleQuantityKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addSelectedProduct();
    }
  }

  function adjustQuantity(delta) {
    const current = Number(quantity || 1);
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  }

  function openPrintWindow(html) {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setFeedback({ type: "error", message: "O navegador bloqueou a janela de impressao." });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function finalizeAfterReceipt() {
    setShowReceiptModal(false);
    setFinalizedReceipt(null);
    startNewSale();
  }

  async function copyGuestQrLink() {
    if (!guestQrLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(guestQrLink);
      setFeedback({ type: "success", message: "Link do cardapio copiado para compartilhar com o hospede." });
    } catch (_error) {
      setFeedback({ type: "error", message: "Nao foi possivel copiar o link do hospede." });
    }
  }

  function addSelectedProduct() {
    if (!selectedProduct) {
      setFeedback({ type: "error", message: "Selecione um produto antes de adicionar." });
      return;
    }

    const nextQuantity = Number(quantity || 0);

    if (nextQuantity <= 0) {
      setFeedback({ type: "error", message: "Informe uma quantidade valida." });
      return;
    }

    if (nextQuantity > Number(selectedProduct.quantidade_atual || 0)) {
      setFeedback({ type: "error", message: "Quantidade maior que o estoque disponivel." });
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.produtoId === selectedProduct.id);

      if (existing) {
        return current.map((item) =>
          item.produtoId === selectedProduct.id
            ? {
                ...item,
                quantidade: item.quantidade + nextQuantity,
                total: Number(((item.quantidade + nextQuantity) * item.precoUnitario).toFixed(2))
              }
            : item
        );
      }

      return [
        ...current,
        {
          produtoId: selectedProduct.id,
          nome: selectedProduct.nome,
          quantidade: nextQuantity,
          precoUnitario: Number(selectedProduct.preco || 0),
          total: Number((nextQuantity * Number(selectedProduct.preco || 0)).toFixed(2))
        }
      ];
    });

    setSaleStatus("Venda em andamento");
    setFeedback({ type: "success", message: `${selectedProduct.nome} adicionado ao cupom.` });
    setQuantity("1");
    focusSearch();
  }

  function updateItemQuantity(productId, delta) {
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.produtoId !== productId) {
            return item;
          }

          const nextQuantity = item.quantidade + delta;

          if (nextQuantity <= 0) {
            return null;
          }

          return {
            ...item,
            quantidade: nextQuantity,
            total: Number((nextQuantity * item.precoUnitario).toFixed(2))
          };
        })
        .filter(Boolean)
    );
  }

  function removeCartItem(productId) {
    setCartItems((current) => current.filter((item) => item.produtoId !== productId));
  }

  function cancelCurrentSale() {
    if (!cartItems.length) {
      setFeedback({ type: "success", message: "Nenhuma venda em andamento para cancelar." });
      return;
    }

    const confirmed = window.confirm("Deseja cancelar a venda em andamento e limpar o cupom?");

    if (!confirmed) {
      return;
    }

    startNewSale();
    setFeedback({ type: "success", message: "Venda em andamento cancelada." });
  }

  function openFinalizeModal() {
    if (!cartItems.length) {
      setFeedback({ type: "error", message: "Adicione pelo menos um item antes de finalizar." });
      return;
    }

    setShowFinalizeModal(true);
  }

  function updatePayment(index, field, value) {
    setPayments((current) =>
      current.map((payment, paymentIndex) =>
        paymentIndex === index
          ? { ...payment, [field]: value }
          : payment
      )
    );
  }

  function addPaymentLine() {
    setPayments((current) => [...current, { metodo: "pix", valor: "", observacoes: "" }]);
  }

  function removePaymentLine(index) {
    setPayments((current) => current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function finalizeSale(mode) {
    if (!cartItems.length) {
      setFeedback({ type: "error", message: "Nao e possivel finalizar uma venda vazia." });
      return;
    }

    if (saleLink.chargeNow && paidAmount < saleTotal && mode !== "pedido" && !saleLink.launchToGuestAccount) {
      setFeedback({ type: "error", message: "O valor pago ainda nao cobre o total da venda." });
      return;
    }

    if (mode === "nfe" && !customerData.nome) {
      setFeedback({ type: "error", message: "NF-e exige identificacao completa do cliente." });
      return;
    }

    try {
      setIsSubmitting(true);
      const cartSnapshot = cartItems.map((item) => ({ ...item }));
      const payload = {
        origemVenda:
          saleLink.mode === "avulsa"
            ? "balcao"
            : saleLink.launchToGuestAccount
              ? "hospede"
              : "balcao",
        hospedeId: saleLink.mode === "avulsa" ? null : saleLink.guestId || null,
        reservaId: saleLink.mode === "avulsa" ? null : saleLink.reservationId || null,
        quartoId: saleLink.mode === "avulsa" ? null : saleLink.roomId || null,
        contaHospedagemId: saleLink.launchToGuestAccount ? saleLink.guestAccountId || null : null,
        usuarioSistemaId: serviceTeam.systemUserId || null,
        vendedorId: serviceTeam.sellerId || null,
        itens: cartItems.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: 0,
          observacoes: ""
        })),
        pagamentos:
          saleLink.launchToGuestAccount && !saleLink.chargeNow
            ? []
            : payments.map((payment) => ({
                metodo: payment.metodo,
                valor: Number(payment.valor || 0),
                observacoes: payment.observacoes || ""
              })),
        descontoGeral: Number(saleDiscount || 0),
        acrescimo: Number(saleSurcharge || 0),
        cupomCodigo: couponCode || null,
        observacoes: saleNotes || null,
        lancarNaConta: saleLink.launchToGuestAccount,
        cobrarImediatamente: saleLink.chargeNow && !saleLink.launchToGuestAccount,
        emitirDocumento: mode,
        documentoCliente: {
          nome: customerData.nome || null,
          cpf: customerData.cpf || null,
          cnpj: customerData.cnpj || null,
          endereco: customerData.endereco || null,
          ie: customerData.ie || null,
          municipio: customerData.municipio || null,
          uf: customerData.uf || null,
          consumidorFinal: customerData.type !== "empresa"
        }
      };

      const result = await createPosSale(payload);
      const saleData = result.sale || result;
      const printableHtml =
        result?.danfeHtml ||
        buildReceiptHtml({
          sale: saleData,
          items: saleData?.itens || cartSnapshot,
          total: saleData?.valor_total ?? saleTotal,
          title: mode === "pedido" ? "Pedido interno" : "Comprovante de venda",
          subtitle:
            mode === "nfce" || mode === "nfe"
              ? `Documento ${mode.toUpperCase()} emitido em homologacao.`
              : mode === "pedido"
                ? "Pedido gerado para atendimento interno."
                : "Venda concluida sem documento fiscal."
        });

      setFinalizedReceipt({
        sale: saleData,
        html: printableHtml,
        total: saleData?.valor_total ?? saleTotal,
        mode
      });
      setFeedback({ type: "success", message: `Venda ${result.sale?.codigo || result.codigo} finalizada.` });
      setShowFinalizeModal(false);
      setShowReceiptModal(true);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel finalizar a venda." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCashOperation(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);

      if (cashAction === "open") {
        await openCashSession({
          valorInicial: Number(cashForm.valor || 0),
          observacoes: cashForm.observacoes
        });
        setFeedback({ type: "success", message: "Caixa aberto com sucesso." });
      }

      if (cashAction === "supply" && currentSession) {
        await createCashSupply(currentSession.id, {
          valor: Number(cashForm.valor || 0),
          motivo: cashForm.motivo,
          observacoes: cashForm.observacoes
        });
        setFeedback({ type: "success", message: "Suprimento registrado." });
      }

      if (cashAction === "withdraw" && currentSession) {
        await createCashWithdrawal(currentSession.id, {
          valor: Number(cashForm.valor || 0),
          motivo: cashForm.motivo,
          observacoes: cashForm.observacoes
        });
        setFeedback({ type: "success", message: "Sangria registrada." });
      }

      if (cashAction === "close" && currentSession) {
        await closeCashSession(currentSession.id, {
          dinheiroContado: Number(closeForm.dinheiroContado || 0),
          cartaoDebito: Number(closeForm.cartaoDebito || 0),
          cartaoCredito: Number(closeForm.cartaoCredito || 0),
          pix: Number(closeForm.pix || 0),
          voucher: Number(closeForm.voucher || 0),
          transferencia: Number(closeForm.transferencia || 0),
          faturado: 0,
          cortesia: 0,
          outros: Number(closeForm.outros || 0),
          observacoes: closeForm.observacoes
        });
        setFeedback({ type: "success", message: "Caixa fechado com sucesso." });
      }

      setShowCashModal(false);
      setCashForm(initialCashForm);
      setCloseForm(initialCloseForm);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel processar a operacao de caixa." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitFinalizedCancellation(event) {
    event.preventDefault();

    if (!selectedFinalizedSale) {
      return;
    }

    try {
      setIsSubmitting(true);
      await cancelPosSale(selectedFinalizedSale.id, {
        motivo: cancelReason,
        supervisorSenha: supervisorPassword,
        cancelarDocumentoFiscal: true
      });
      setFeedback({ type: "success", message: `Venda ${selectedFinalizedSale.codigo} cancelada.` });
      setShowCancelFinalizedModal(false);
      setSelectedFinalizedSale(null);
      setCancelReason("");
      setSupervisorPassword("");
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel cancelar a venda finalizada." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="empty-state">Carregando PDV...</div>;
  }

  const customerLabel =
    saleLink.mode === "avulsa"
      ? "Consumidor avulso"
      : saleLink.guestId
        ? overview?.guests?.find((guest) => guest.id === saleLink.guestId)?.nome || "Hospede vinculado"
        : "Hospedagem vinculada";

  return (
    <section className="page-grid">
      <article className="panel pdv-shell">
        <header className="pdv-retail-topbar">
          <div>
            <p className="eyebrow">Pousada Exemplo</p>
            <h2>PDV operacional</h2>
          </div>
          <div className="pdv-retail-meta">
            <span><strong>Venda:</strong> {saleNumber}</span>
            <span><strong>Usuario:</strong> {selectedSystemUser?.nome || "Atual"}</span>
            <span><strong>Vendedor:</strong> {selectedSeller?.nome || "Nao informado"}</span>
            <span><strong>Caixa:</strong> {currentSession ? "Aberto" : "Fechado"}</span>
            <span><strong>Fiscal:</strong> Homologacao</span>
            <span><strong>Data/hora:</strong> {clock.toLocaleDateString("pt-BR")} {clock.toLocaleTimeString("pt-BR")}</span>
          </div>
        </header>

        <nav className="pdv-retail-nav" aria-label="Secoes do PDV">
          {posSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`pdv-retail-nav-item ${section.active ? "active" : ""}`}
              onClick={() => {
                if (section.id === "pedido") {
                  setShowGuestQrModal(true);
                }
              }}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}
        {pageError ? <div className="form-feedback error">{pageError}</div> : null}

        <div className="pdv-retail-layout">
          <section className="pdv-retail-catalog">
            <div className="pdv-retail-categories">
              {categoryCards.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`pdv-retail-category ${activeCategory === category.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory(category.id);
                    if (search.trim().length < 2) {
                      setSearch("");
                    }
                  }}
                >
                  <span>{category.label}</span>
                </button>
              ))}
            </div>

            <div className="pdv-retail-products">
              {visibleCatalog.length ? (
                visibleCatalog.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`pdv-retail-product-card ${selectedProduct?.id === product.id ? "active" : ""}`}
                    onClick={() => selectProduct(product)}
                  >
                    <div className="pdv-retail-product-image">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.nome} />
                      ) : (
                        <div>Sem imagem</div>
                      )}
                    </div>
                    <div className="pdv-retail-product-copy">
                      <strong>{product.nome}</strong>
                      <span>{product.categoria}</span>
                      <small>{toCurrency(product.preco)}</small>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty-state">Nenhum produto encontrado nesta selecao.</div>
              )}
            </div>
          </section>

          <aside className="pdv-retail-sale-panel">
            <div className="pdv-retail-sale-head">
              <label className="field">
                <span>Codigo</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Codigo, nome ou barras"
                />
              </label>
              <label className="field pdv-qty-field">
                <span>Qtde</span>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  onKeyDown={handleQuantityKeyDown}
                />
              </label>
              <div className="pdv-qty-actions">
                <button type="button" className="ghost-button" onClick={() => adjustQuantity(-1)}>-</button>
                <button type="button" className="ghost-button" onClick={() => adjustQuantity(1)}>+</button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={addSelectedProduct}
                  disabled={!selectedProduct}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="pdv-retail-selected">
              <div className="pdv-retail-selected-thumb">
                {selectedProduct?.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.nome} />
                ) : (
                  <div>Sem imagem</div>
                )}
              </div>
              <div className="pdv-retail-selected-copy">
                <strong>{selectedProduct?.nome || "Produto nao selecionado"}</strong>
                <span>{selectedProduct?.categoria || "Selecione um item no catalogo"}</span>
                <small>Estoque: {selectedProduct ? selectedProduct.quantidade_atual : "--"} • {customerLabel}</small>
                <div className="pdv-retail-item-values">
                  <span>Unitario: {selectedProduct ? toCurrency(selectedProduct.preco) : "R$ 0,00"}</span>
                  <strong>Total item: {toCurrency(productTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="pdv-retail-receipt">
              <div className="pdv-retail-receipt-head">
                <span>Produto</span>
                <span>Qtde</span>
                <span>Unitario</span>
                <span>Total</span>
              </div>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div key={item.produtoId} className="pdv-retail-receipt-row">
                    <strong>{item.nome}</strong>
                    <span>{item.quantidade}</span>
                    <span>{toCurrency(item.precoUnitario)}</span>
                    <div className="pdv-retail-receipt-total">
                      <strong>{toCurrency(item.total)}</strong>
                      <div className="pdv-ticket-actions">
                        <button type="button" className="ghost-button" onClick={() => updateItemQuantity(item.produtoId, 1)}>+</button>
                        <button type="button" className="ghost-button" onClick={() => updateItemQuantity(item.produtoId, -1)}>-</button>
                        <button type="button" className="danger-button" onClick={() => removeCartItem(item.produtoId)}>X</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Inicie a venda e adicione os itens do cupom.</div>
              )}
            </div>

            <div className="pdv-retail-total-panel">
              <div className="pdv-retail-total-copy">
                <strong>Valor total</strong>
                <span>{saleStatus}</span>
              </div>
              <div className="pdv-retail-total-value">{toCurrency(saleTotal)}</div>
            </div>

            <div className="pdv-retail-adjustments">
              <label className="field">
                <span>Desconto</span>
                <input type="number" min="0" step="0.01" value={saleDiscount} onChange={(event) => setSaleDiscount(event.target.value)} />
              </label>
              <label className="field">
                <span>Acrescimo</span>
                <input type="number" min="0" step="0.01" value={saleSurcharge} onChange={(event) => setSaleSurcharge(event.target.value)} />
              </label>
              <label className="field">
                <span>Cupom</span>
                <input type="text" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Opcional" />
              </label>
            </div>
          </aside>
        </div>

        <footer className="pdv-function-bar">
          <button type="button" className="primary-button" onClick={startNewSale}>F2 - Nova Venda</button>
          <button type="button" className="danger-button" onClick={cancelCurrentSale}>F6 - Cancelar Venda</button>
          <button type="button" className="primary-button" onClick={openFinalizeModal}>F10 - Finalizar Venda</button>
          <button type="button" className="ghost-button" onClick={() => searchInputRef.current?.focus()}>F3 - Consultar Produto</button>
          <button type="button" className="ghost-button" onClick={() => setShowLinkModal(true)}>F4 - Cliente/Hospede</button>
          <button type="button" className="ghost-button" onClick={() => setShowCashModal(true)}>Operacoes de Caixa</button>
          <button type="button" className="ghost-button" onClick={() => navigate(-1)}>Esc - Voltar</button>
        </footer>
      </article>

      <ModalFrame
        title="Pedido via QR Code"
        subtitle="Compartilhe o acesso do cardapio do hospede para pedidos pelo celular."
        isOpen={showGuestQrModal}
        onClose={() => setShowGuestQrModal(false)}
      >
        <div className="room-form">
          <section className="room-form-section">
            <label className="field">
              <span>Conta de hospedagem</span>
              <select value={selectedQrAccount?.id || ""} onChange={(event) => setSelectedQrAccountId(event.target.value)}>
                {(overview?.guestAccounts || []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.hospede_nome} • Quarto {account.quarto_numero}
                  </option>
                ))}
              </select>
            </label>

            {selectedQrAccount ? (
              <div className="pdv-qr-card">
                <div className="pdv-qr-preview">
                  {guestQrImageUrl ? (
                    <img src={guestQrImageUrl} alt="QR Code do cardapio do hospede" />
                  ) : (
                    <div className="empty-state">QR Code indisponivel.</div>
                  )}
                </div>
                <div className="pdv-qr-copy">
                  <strong>{selectedQrAccount.hospede_nome}</strong>
                  <span>Quarto {selectedQrAccount.quarto_numero}</span>
                  <small>O hospede abre o cardapio no celular e envia o pedido para a recepcao.</small>
                  <label className="field">
                    <span>Link do cardapio</span>
                    <input type="text" readOnly value={guestQrLink} />
                  </label>
                  <div className="room-card-actions">
                    <button type="button" className="ghost-button" onClick={copyGuestQrLink}>Copiar link</button>
                    <button type="button" className="primary-button" onClick={() => window.open(guestQrLink, "_blank")}>Abrir cardapio</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">Nenhuma conta de hospedagem ativa para gerar o QR Code.</div>
            )}
          </section>
        </div>
      </ModalFrame>

      <ModalFrame
        title="Comprovante da venda"
        subtitle="Visualize a impressao ou envie direto para a impressora."
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      >
        <div className="room-form">
          <section className="room-form-section">
            <div className="summary-box">
              <span>Venda: {finalizedReceipt?.sale?.codigo || "--"}</span>
              <span>Status: {finalizedReceipt?.mode || "--"}</span>
              <strong>Total: {toCurrency(finalizedReceipt?.total || 0)}</strong>
            </div>
            <div className="pdv-print-preview">
              <iframe
                title="Preview do comprovante"
                srcDoc={finalizedReceipt?.html || ""}
              />
            </div>
          </section>
          <div className="pdv-finalize-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => finalizedReceipt?.html && window.open(`data:text/html;charset=utf-8,${encodeURIComponent(finalizedReceipt.html)}`, "_blank")}
            >
              Visualizar impressao
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => finalizedReceipt?.html && openPrintWindow(finalizedReceipt.html)}
            >
              Imprimir agora
            </button>
            <button type="button" className="primary-button" onClick={finalizeAfterReceipt}>
              Fechar e nova venda
            </button>
          </div>
        </div>
      </ModalFrame>

      <ModalFrame
        title="Cliente / Hospede"
        subtitle="Defina se a venda e avulsa ou vinculada a hospedagem."
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        size="compact-modal"
      >
        <div className="room-form">
          <section className="room-form-section">
            <div className="room-form-grid">
              <label className="field">
                <span>Tipo</span>
                <select value={saleLink.mode} onChange={(event) => setSaleLink((current) => ({ ...current, mode: event.target.value }))}>
                  <option value="avulsa">Venda avulsa</option>
                  <option value="hospede">Vincular a hospede</option>
                  <option value="quarto">Vincular a quarto</option>
                  <option value="reserva">Vincular a reserva</option>
                </select>
              </label>
              <label className="field">
                <span>Hospede</span>
                <select value={saleLink.guestId} onChange={(event) => setSaleLink((current) => ({ ...current, guestId: event.target.value }))} disabled={saleLink.mode === "avulsa"}>
                  <option value="">Selecione</option>
                  {(overview?.guests || []).map((guest) => (
                    <option key={guest.id} value={guest.id}>{guest.nome}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Reserva</span>
                <select value={saleLink.reservationId} onChange={(event) => setSaleLink((current) => ({ ...current, reservationId: event.target.value }))} disabled={saleLink.mode === "avulsa"}>
                  <option value="">Selecione</option>
                  {(overview?.reservations || [])
                    .filter((reservation) => !saleLink.guestId || reservation.hospede_id === saleLink.guestId)
                    .map((reservation) => (
                      <option key={reservation.id} value={reservation.id}>
                        {reservation.codigo_reserva} • Quarto {reservation.quarto_numero}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                <span>Quarto</span>
                <select value={saleLink.roomId} onChange={(event) => setSaleLink((current) => ({ ...current, roomId: event.target.value }))} disabled={saleLink.mode === "avulsa"}>
                  <option value="">Selecione</option>
                  {(overview?.rooms || []).map((room) => (
                    <option key={room.id} value={room.id}>Quarto {room.numero}</option>
                  ))}
                </select>
              </label>
              <label className="checkbox-line span-two">
                <input type="checkbox" checked={saleLink.chargeNow} onChange={(event) => setSaleLink((current) => ({ ...current, chargeNow: event.target.checked }))} disabled={saleLink.launchToGuestAccount} />
                <span>Cobrar agora</span>
              </label>
              <label className="checkbox-line span-two">
                <input type="checkbox" checked={saleLink.launchToGuestAccount} onChange={(event) => setSaleLink((current) => ({ ...current, launchToGuestAccount: event.target.checked, chargeNow: event.target.checked ? false : current.chargeNow }))} disabled={saleLink.mode === "avulsa"} />
                <span>Lancar na conta do hospede</span>
              </label>
              <label className="field span-two">
                <span>Conta hospedagem</span>
                <select value={saleLink.guestAccountId} onChange={(event) => setSaleLink((current) => ({ ...current, guestAccountId: event.target.value }))} disabled={!saleLink.launchToGuestAccount}>
                  <option value="">Selecione</option>
                  {selectedGuestAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.hospede_nome} • Quarto {account.quarto_numero} • Saldo {toCurrency(account.saldo_atual)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="room-form-actions">
            <button type="button" className="ghost-button" onClick={() => setShowLinkModal(false)}>Concluir</button>
          </div>
        </div>
      </ModalFrame>

      <ModalFrame
        title="Finalizacao da venda"
        subtitle="Resumo, cliente e pagamentos antes de concluir."
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
      >
        <div className="room-form">
          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Resumo da venda</h3>
              <p>Itens, total e observacoes operacionais.</p>
            </div>
            <div className="stack-list">
              {cartItems.map((item) => (
                <div key={item.produtoId} className="list-row">
                  <strong>{item.nome}</strong>
                  <span>{item.quantidade}x</span>
                  <small>{toCurrency(item.total)}</small>
                </div>
              ))}
            </div>
            <label className="field">
              <span>Observacoes</span>
              <textarea rows="3" value={saleNotes} onChange={(event) => setSaleNotes(event.target.value)} />
            </label>
            <div className="summary-box">
              <span>Subtotal: {toCurrency(saleSubtotal)}</span>
              <span>Desconto: {toCurrency(saleDiscount)}</span>
              <span>Acrescimo: {toCurrency(saleSurcharge)}</span>
              <strong>Total final: {toCurrency(saleTotal)}</strong>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Atendimento</h3>
              <p>Defina o usuario logado e o vendedor/garcom responsavel pela venda.</p>
            </div>
            <div className="room-form-grid">
              <label className="field">
                <span>Usuario do sistema</span>
                <select value={serviceTeam.systemUserId} onChange={(event) => setServiceTeam((current) => ({ ...current, systemUserId: event.target.value }))}>
                  <option value="">Selecione</option>
                  {(overview?.systemUsers || []).map((user) => (
                    <option key={user.id} value={user.id}>{user.nome} • {user.usuario}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Vendedor / garcom</span>
                <select value={serviceTeam.sellerId} onChange={(event) => setServiceTeam((current) => ({ ...current, sellerId: event.target.value }))}>
                  <option value="">Selecione</option>
                  {(overview?.sellers || []).map((seller) => (
                    <option key={seller.id} value={seller.id}>{seller.nome} • {seller.tipo}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Cliente</h3>
              <p>Consumidor final, cliente cadastrado ou hospede vinculado.</p>
            </div>
            <div className="room-form-grid">
              <label className="field">
                <span>Perfil do destinatario</span>
                <select value={customerData.type} onChange={(event) => setCustomerData((current) => ({ ...current, type: event.target.value }))}>
                  <option value="consumidor_final">Consumidor nao identificado</option>
                  <option value="pessoa_fisica">Pessoa fisica</option>
                  <option value="empresa">Pessoa juridica</option>
                </select>
              </label>
              <label className="field">
                <span>Nome</span>
                <input type="text" value={customerData.nome} onChange={(event) => setCustomerData((current) => ({ ...current, nome: event.target.value }))} />
              </label>
              <label className="field">
                <span>CPF</span>
                <input type="text" value={customerData.cpf} onChange={(event) => setCustomerData((current) => ({ ...current, cpf: event.target.value }))} />
              </label>
              <label className="field">
                <span>CNPJ</span>
                <input type="text" value={customerData.cnpj} onChange={(event) => setCustomerData((current) => ({ ...current, cnpj: event.target.value }))} />
              </label>
              <label className="field span-two">
                <span>Endereco</span>
                <input type="text" value={customerData.endereco} onChange={(event) => setCustomerData((current) => ({ ...current, endereco: event.target.value }))} />
              </label>
              <label className="field">
                <span>IE</span>
                <input type="text" value={customerData.ie} onChange={(event) => setCustomerData((current) => ({ ...current, ie: event.target.value }))} />
              </label>
              <label className="field">
                <span>Municipio</span>
                <input type="text" value={customerData.municipio} onChange={(event) => setCustomerData((current) => ({ ...current, municipio: event.target.value }))} />
              </label>
              <label className="field">
                <span>UF</span>
                <input type="text" value={customerData.uf} onChange={(event) => setCustomerData((current) => ({ ...current, uf: event.target.value }))} />
              </label>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Meios de pagamento</h3>
              <p>Multiplas formas, saldo restante e troco automatico.</p>
            </div>
            <div className="stack-list">
              {payments.map((payment, index) => (
                <div key={`${payment.metodo}-${index}`} className="reservation-combo-grid">
                  <select value={payment.metodo} onChange={(event) => updatePayment(index, "metodo", event.target.value)}>
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <input type="number" min="0" step="0.01" value={payment.valor} onChange={(event) => updatePayment(index, "valor", event.target.value)} placeholder="Valor" />
                  <input type="text" value={payment.observacoes} onChange={(event) => updatePayment(index, "observacoes", event.target.value)} placeholder="Observacoes" />
                  <button type="button" className="ghost-button" onClick={() => removePaymentLine(index)}>Remover</button>
                </div>
              ))}
            </div>
            <button type="button" className="ghost-button" onClick={addPaymentLine}>Adicionar pagamento</button>
            <div className="summary-box">
              <span>Valor pago: {toCurrency(paidAmount)}</span>
              <span>Saldo restante: {toCurrency(remainingAmount)}</span>
              <strong>Troco: {toCurrency(changeAmount)}</strong>
            </div>
          </section>

          <div className="pdv-finalize-actions">
            <button type="button" className="ghost-button" onClick={() => finalizeSale("pedido")} disabled={isSubmitting}>Imprimir pedido</button>
            <button type="button" className="primary-button" onClick={() => finalizeSale("sem_documento")} disabled={isSubmitting}>Finalizar sem documento fiscal</button>
            <button type="button" className="primary-button" onClick={() => finalizeSale("nfce")} disabled={isSubmitting}>Emitir NFC-e</button>
            <button type="button" className="primary-button" onClick={() => finalizeSale("nfe")} disabled={isSubmitting}>Emitir NF-e</button>
            <button type="button" className="ghost-button" onClick={() => setShowFinalizeModal(false)} disabled={isSubmitting}>Cancelar</button>
          </div>
        </div>
      </ModalFrame>

      <ModalFrame
        title="Operacoes de caixa"
        subtitle="Abertura, suprimento, sangria e fechamento fora da venda principal."
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        size="compact-modal"
      >
        <div className="room-form">
          <section className="room-form-section">
            <div className="room-card-actions">
              <button type="button" className="primary-button" onClick={() => setCashAction("open")} disabled={Boolean(currentSession)}>Abrir Caixa</button>
              <button type="button" className="ghost-button" onClick={() => setCashAction("supply")} disabled={!currentSession}>Suprimento</button>
              <button type="button" className="ghost-button" onClick={() => setCashAction("withdraw")} disabled={!currentSession}>Sangria</button>
              <button type="button" className="danger-button" onClick={() => setCashAction("close")} disabled={!currentSession}>Fechar Caixa</button>
            </div>
          </section>

          {cashAction ? (
            <form className="room-form" onSubmit={submitCashOperation}>
              {cashAction === "close" ? (
                <section className="room-form-section">
                  <div className="room-form-grid">
                    <label className="field"><span>Dinheiro contado</span><input type="number" min="0" step="0.01" value={closeForm.dinheiroContado} onChange={(event) => setCloseForm((current) => ({ ...current, dinheiroContado: event.target.value }))} required /></label>
                    <label className="field"><span>Cartao debito</span><input type="number" min="0" step="0.01" value={closeForm.cartaoDebito} onChange={(event) => setCloseForm((current) => ({ ...current, cartaoDebito: event.target.value }))} /></label>
                    <label className="field"><span>Cartao credito</span><input type="number" min="0" step="0.01" value={closeForm.cartaoCredito} onChange={(event) => setCloseForm((current) => ({ ...current, cartaoCredito: event.target.value }))} /></label>
                    <label className="field"><span>PIX</span><input type="number" min="0" step="0.01" value={closeForm.pix} onChange={(event) => setCloseForm((current) => ({ ...current, pix: event.target.value }))} /></label>
                    <label className="field"><span>Voucher</span><input type="number" min="0" step="0.01" value={closeForm.voucher} onChange={(event) => setCloseForm((current) => ({ ...current, voucher: event.target.value }))} /></label>
                    <label className="field"><span>Transferencia</span><input type="number" min="0" step="0.01" value={closeForm.transferencia} onChange={(event) => setCloseForm((current) => ({ ...current, transferencia: event.target.value }))} /></label>
                    <label className="field"><span>Outros</span><input type="number" min="0" step="0.01" value={closeForm.outros} onChange={(event) => setCloseForm((current) => ({ ...current, outros: event.target.value }))} /></label>
                    <label className="field span-two"><span>Observacoes</span><textarea rows="3" value={closeForm.observacoes} onChange={(event) => setCloseForm((current) => ({ ...current, observacoes: event.target.value }))} /></label>
                  </div>
                </section>
              ) : (
                <section className="room-form-section">
                  <label className="field">
                    <span>Valor</span>
                    <input type="number" min="0" step="0.01" value={cashForm.valor} onChange={(event) => setCashForm((current) => ({ ...current, valor: event.target.value }))} required />
                  </label>
                  {cashAction !== "open" ? (
                    <label className="field">
                      <span>Motivo</span>
                      <input type="text" value={cashForm.motivo} onChange={(event) => setCashForm((current) => ({ ...current, motivo: event.target.value }))} required />
                    </label>
                  ) : null}
                  <label className="field">
                    <span>Observacoes</span>
                    <textarea rows="3" value={cashForm.observacoes} onChange={(event) => setCashForm((current) => ({ ...current, observacoes: event.target.value }))} />
                  </label>
                </section>
              )}

              <div className="room-form-actions">
                <button type="submit" className="primary-button" disabled={isSubmitting}>Confirmar</button>
              </div>
            </form>
          ) : null}
        </div>
      </ModalFrame>

      <ModalFrame
        title="Cancelar venda finalizada"
        subtitle="Informe o motivo e a senha do supervisor para auditoria."
        isOpen={showCancelFinalizedModal}
        onClose={() => setShowCancelFinalizedModal(false)}
        size="compact-modal"
      >
        <form className="room-form" onSubmit={submitFinalizedCancellation}>
          <section className="room-form-section">
            <div className="summary-box">
              <span>Venda: {selectedFinalizedSale?.codigo || "--"}</span>
              <strong>Total: {toCurrency(selectedFinalizedSale?.valor_total || 0)}</strong>
            </div>
            <label className="field">
              <span>Motivo</span>
              <textarea rows="3" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
            </label>
            <label className="field">
              <span>Senha supervisor</span>
              <input type="password" value={supervisorPassword} onChange={(event) => setSupervisorPassword(event.target.value)} required />
            </label>
          </section>
          <div className="room-form-actions">
            <button type="submit" className="danger-button" disabled={isSubmitting}>Cancelar venda</button>
          </div>
        </form>
      </ModalFrame>
    </section>
  );
}
