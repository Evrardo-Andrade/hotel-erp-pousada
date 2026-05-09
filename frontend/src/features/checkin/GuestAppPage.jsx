import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { createGuestAppOrder, fetchGuestAppData } from "../../services/api";

function toCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

export function GuestAppPage() {
  const { accountId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [cart, setCart] = useState([]);
  const [areaEntrega, setAreaEntrega] = useState("Quarto");
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGuestData();
  }, [accountId]);

  const categories = useMemo(() => {
    return Array.from(new Set((data?.menuProducts || []).map((product) => product.categoria).filter(Boolean)));
  }, [data]);

  const saldo = useMemo(() => Number(data?.account?.saldo_atual || 0), [data]);
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.valor_total || 0), 0);
  }, [cart]);

  async function loadGuestData() {
    try {
      setIsLoading(true);
      const result = await fetchGuestAppData(accountId);
      setData(result);
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel carregar o cardapio do hospede." });
    } finally {
      setIsLoading(false);
    }
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.produtoId === product.id);

      if (existing) {
        return current.map((item) =>
          item.produtoId === product.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                valor_total: Number(((item.quantidade + 1) * item.preco_unitario).toFixed(2))
              }
            : item
        );
      }

      return [
        ...current,
        {
          produtoId: product.id,
          nome: product.nome,
          quantidade: 1,
          preco_unitario: Number(product.preco || 0),
          valor_total: Number(product.preco || 0)
        }
      ];
    });
  }

  function updateCartItem(productId, delta) {
    setCart((current) =>
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
            valor_total: Number((nextQuantity * item.preco_unitario).toFixed(2))
          };
        })
        .filter(Boolean)
    );
  }

  async function submitOrder() {
    if (!cart.length) {
      setFeedback({ type: "error", message: "Adicione pelo menos um item ao pedido." });
      return;
    }

    try {
      setIsSubmitting(true);
      await createGuestAppOrder(accountId, {
        areaEntrega,
        observacoes,
        itens: cart.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade
        }))
      });
      setFeedback({ type: "success", message: "Pedido enviado para a recepcao da pousada." });
      setCart([]);
      setObservacoes("");
      await loadGuestData();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel enviar o pedido." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <main className="guest-app"><div className="empty-state">Carregando app do hospede...</div></main>;
  }

  return (
    <main className="guest-app">
      <section className="guest-hero">
        <span className="eyebrow">Conta de hospedagem</span>
        <h1>Bem-vindo, {data?.guest?.nome || "Hospede"}</h1>
        <p>Quarto {data?.room?.numero || "--"} • Conta #{accountId}</p>
      </section>

      {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}

      <section className="guest-panels">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Consumo atual</h2>
              <p>Pedidos enviados para a recepcao</p>
            </div>
          </div>
          <div className="stack-list">
            {(data?.orders || []).length ? (
              data.orders.map((order) => (
                <div key={order.id} className="list-row">
                  <strong>{order.area_entrega}</strong>
                  <span>{order.status}</span>
                  <small>{toCurrency(order.valor_total)}</small>
                </div>
              ))
            ) : (
              <div className="empty-state">Nenhum pedido registrado ainda.</div>
            )}
          </div>
          <div className="summary-box">
            <strong>Saldo parcial</strong>
            <span>{toCurrency(saldo)}</span>
          </div>
        </article>

        <article className="panel guest-menu-panel">
          <div className="panel-heading">
            <div>
              <h2>Cardapio do hospede</h2>
              <p>Escolha itens e envie para a recepcao</p>
            </div>
          </div>

          {categories.length ? (
            <div className="guest-category-row">
              {categories.map((category) => (
                <span key={category} className="amenity-badge">{category}</span>
              ))}
            </div>
          ) : null}

          <div className="guest-menu-grid">
            {(data?.menuProducts || []).map((product) => (
              <button key={product.id} type="button" className="catalog-item guest-menu-item" onClick={() => addToCart(product)}>
                <strong>{product.nome}</strong>
                <span>{product.categoria}</span>
                <small>{toCurrency(product.preco)}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Seu pedido</h2>
              <p>Recepcao recebe em tempo real</p>
            </div>
            <strong>{toCurrency(cartTotal)}</strong>
          </div>
          <div className="stack-list">
            {cart.length ? (
              cart.map((item) => (
                <div key={item.produtoId} className="list-row">
                  <div>
                    <strong>{item.nome}</strong>
                    <small>{toCurrency(item.preco_unitario)}</small>
                  </div>
                  <div className="room-card-actions">
                    <button type="button" className="ghost-button" onClick={() => updateCartItem(item.produtoId, -1)}>-</button>
                    <span>{item.quantidade}</span>
                    <button type="button" className="ghost-button" onClick={() => updateCartItem(item.produtoId, 1)}>+</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Toque em um item do cardapio para montar o pedido.</div>
            )}
          </div>

          <div className="room-form">
            <label className="field">
              <span>Local de entrega</span>
              <select value={areaEntrega} onChange={(event) => setAreaEntrega(event.target.value)}>
                <option value="Quarto">Quarto</option>
                <option value="Recepcao">Recepcao</option>
                <option value="Piscina">Piscina</option>
                <option value="Restaurante">Restaurante</option>
              </select>
            </label>
            <label className="field">
              <span>Observacoes</span>
              <textarea rows="3" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Ex.: sem gelo, entregar com guardanapos." />
            </label>
            <button type="button" className="primary-button" onClick={submitOrder} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar pedido para a recepcao"}
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
