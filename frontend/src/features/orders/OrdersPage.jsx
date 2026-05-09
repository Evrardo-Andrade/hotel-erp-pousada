import { useEffect, useState } from "react";
import { apiGet } from "../../services/api";

export function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    apiGet("/orders").then(setOrders);
  }, []);

  return (
    <section className="page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Room service</h2>
            <p>Pedidos em tempo real com confirmacao do hospede</p>
          </div>
        </div>

        <div className="table-like">
          {orders.map((order) => (
            <div key={order.id} className="table-row">
              <strong>{order.hospede_nome}</strong>
              <span>Quarto {order.quarto_numero}</span>
              <span>{order.area_entrega}</span>
              <small>{order.status}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
