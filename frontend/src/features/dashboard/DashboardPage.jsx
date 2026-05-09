import { useEffect, useState } from "react";
import { apiGet } from "../../services/api";
import { MetricCard } from "../../components/cards/MetricCard";
import { StatusBar } from "../../components/charts/StatusBar";

export function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiGet("/dashboard").then(setData);
  }, []);

  if (!data) {
    return <div className="panel">Carregando dashboard...</div>;
  }

  return (
    <section className="page-grid">
      <div className="metrics-grid">
        <MetricCard label="Receita do dia" value={`R$ ${data.receitaDia.toFixed(2)}`} helper="Integrado ao financeiro" tone="gold" />
        <MetricCard label="Check-ins hoje" value={data.operacao.checkins_hoje} helper="Recepcao e reservas" />
        <MetricCard label="Check-outs hoje" value={data.operacao.checkouts_hoje} helper="Prontos para faturamento" />
        <MetricCard label="Alertas ativos" value={data.alertas.length} helper="Certificado, fiscal e operacao" tone="alert" />
      </div>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Status de ocupacao</h2>
            <p>Visao consolidada dos quartos</p>
          </div>
        </div>
        <StatusBar items={data.roomStatus} />
        <div className="legend">
          {data.roomStatus.map((item) => (
            <span key={item.status} className={`legend-item status-${item.status}`}>
              {item.status}: {item.total}
            </span>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Alertas operacionais</h2>
            <p>Prioridades do turno</p>
          </div>
        </div>
        <div className="stack-list">
          {data.alertas.map((alert) => (
            <div key={alert.id} className="list-row">
              <strong>{alert.tipo}</strong>
              <span>{alert.mensagem}</span>
              <small>{alert.severidade}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
