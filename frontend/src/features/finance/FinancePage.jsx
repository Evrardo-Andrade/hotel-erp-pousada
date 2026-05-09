import { useEffect, useState } from "react";
import { apiGet } from "../../services/api";
import { MetricCard } from "../../components/cards/MetricCard";

export function FinancePage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    apiGet("/finance/summary").then(setSummary);
  }, []);

  if (!summary) {
    return <div className="panel">Carregando financeiro...</div>;
  }

  return (
    <section className="page-grid">
      <div className="metrics-grid">
        <MetricCard label="Receitas" value={`R$ ${summary.receitas.toFixed(2)}`} helper="Periodo corrente" tone="gold" />
        <MetricCard label="Despesas" value={`R$ ${summary.despesas.toFixed(2)}`} helper="Centro de custo consolidado" />
        <MetricCard label="Saldo" value={`R$ ${summary.saldo.toFixed(2)}`} helper="Resultado operacional" tone="default" />
      </div>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Ultimos lancamentos</h2>
            <p>Integrado com vendas, hospedagem e despesas</p>
          </div>
        </div>
        <div className="table-like">
          {summary.ultimosLancamentos.map((entry) => (
            <div key={entry.id} className="table-row">
              <strong>{entry.categoria}</strong>
              <span>{entry.descricao}</span>
              <span>R$ {Number(entry.valor).toFixed(2)}</span>
              <small>{entry.status}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
