function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export class DanfeService {
  generateHtml(document, sefazResponse) {
    const itemsRows = document.itens
      .map(
        (item) => `
          <tr>
            <td>${item.itemNumber}</td>
            <td>${item.descricao}</td>
            <td>${item.quantidade}</td>
            <td>${formatCurrency(item.valorUnitario)}</td>
            <td>${formatCurrency(item.valorTotal)}</td>
          </tr>`
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>DANFE ${document.ide.numero}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #222; margin: 24px; }
      .header, .box { border: 1px solid #bbb; padding: 14px; margin-bottom: 12px; border-radius: 8px; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
      th { background: #f6f6f6; text-align: left; }
      h1, h2, h3 { margin: 0 0 8px; }
      .muted { color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <section class="header">
      <h1>${document.tipo} - DANFE</h1>
      <p class="muted">Documento auxiliar gerado para impressao operacional.</p>
    </section>
    <section class="grid">
      <div class="box">
        <h3>Emitente</h3>
        <div>${document.emitente.razaoSocial}</div>
        <div>CNPJ: ${document.emitente.cnpj}</div>
        <div>Telefone: ${document.emitente.telefone}</div>
      </div>
      <div class="box">
        <h3>Autorizacao</h3>
        <div>Numero: ${document.ide.numero}</div>
        <div>Serie: ${document.ide.serie}</div>
        <div>Protocolo: ${sefazResponse.protocolo}</div>
        <div>Chave: ${sefazResponse.chaveAcesso}</div>
      </div>
    </section>
    <section class="box">
      <h3>Destinatario</h3>
      <div>${document.destinatario?.nome || "Consumidor final"}</div>
      <div>CPF/CNPJ: ${document.destinatario?.cpf || "-"}</div>
      <div>Email: ${document.destinatario?.email || "-"}</div>
    </section>
    <section class="box">
      <h3>Itens</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Descricao</th>
            <th>Qtd</th>
            <th>Vlr Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
    </section>
    <section class="box">
      <h3>Totais</h3>
      <div>Produtos: ${formatCurrency(document.totais.valorProdutos)}</div>
      <div>Desconto: ${formatCurrency(document.totais.valorDesconto)}</div>
      <div>Nota: ${formatCurrency(document.totais.valorNota)}</div>
    </section>
  </body>
</html>`;
  }
}
