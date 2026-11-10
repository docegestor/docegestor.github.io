import React, { useState } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  DollarSign,
  Award,
  Share2,
  FileSpreadsheet,
  Download,
  Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BalancoViewProps {
  onNavigate?: (tab: string, extra?: any) => void;
}

export const BalancoView: React.FC<BalancoViewProps> = ({ onNavigate }) => {
  const { config, vendas, produtos, currentTheme } = useApp();

  const now = new Date();
  const [anoFiltro, setAnoFiltro] = useState(String(now.getFullYear()));
  const [mesFiltro, setMesFiltro] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filtroPrefixo = `${anoFiltro}-${mesFiltro}`;

  // Vendas filtradas do período selecionado
  const vendasPeriodo = vendas.filter((v) => v.dataVenda.startsWith(filtroPrefixo));

  // Cálculos financeiros do período
  const faturamentoPeriodo = vendasPeriodo.reduce((acc, v) => acc + v.valorTotal, 0);
  const custosPeriodo = vendasPeriodo.reduce((acc, v) => acc + v.custoTotalEstimado, 0);
  const lucroPeriodo = faturamentoPeriodo - custosPeriodo;
  const margemPeriodo = faturamentoPeriodo > 0 ? (lucroPeriodo / faturamentoPeriodo) * 100 : 0;
  const ticketMedio =
    vendasPeriodo.length > 0 ? faturamentoPeriodo / vendasPeriodo.length : 0;

  // Breakdown por produto
  const rankingProdutos = vendasPeriodo.reduce(
    (acc: Record<string, { total: number; qtd: number; lucro: number }>, v) => {
      v.itens.forEach((item) => {
        if (!acc[item.produtoNome]) {
          acc[item.produtoNome] = { total: 0, qtd: 0, lucro: 0 };
        }
        acc[item.produtoNome].total += item.valorTotal;
        acc[item.produtoNome].qtd += item.quantidade;
        acc[item.produtoNome].lucro +=
          item.valorTotal - item.custoUnitario * item.quantidade;
      });
      return acc;
    },
    {}
  );

  const produtosOrdenados = Object.entries(rankingProdutos).sort(
    (a, b) => b[1].total - a[1].total
  );

  // Breakdown por forma de pagamento
  const formasPagamento = vendasPeriodo.reduce(
    (acc: Record<string, number>, v) => {
      acc[v.formaPagamento] = (acc[v.formaPagamento] || 0) + v.valorTotal;
      return acc;
    },
    {}
  );

  const labelsPagamento: Record<string, string> = {
    pix: '💳 PIX',
    cartao_credito: '💳 Cartão de Crédito',
    cartao_debito: '💳 Cartão de Débito',
    dinheiro: '💵 Dinheiro',
    outro: 'Outro',
  };

  // Gerar relatório em texto para WhatsApp ou anotações
  const handleExportarRelatorio = () => {
    const nomeMes = new Date(parseInt(anoFiltro), parseInt(mesFiltro) - 1).toLocaleDateString(
      'pt-BR',
      { month: 'long', year: 'numeric' }
    );

    let texto = `📊 *Balanço Financeiro Confeitaria — ${nomeMes}*\n`;
    texto += `*${config.nomeConfeitaria || 'DoceGestor'}*\n\n`;
    texto += `💰 *Faturamento Total:* ${formatCurrency(faturamentoPeriodo)}\n`;
    texto += `📉 *Custos Totais:* ${formatCurrency(custosPeriodo)}\n`;
    texto += `✨ *Lucro Líquido Real:* ${formatCurrency(lucroPeriodo)}\n`;
    texto += `📈 *Margem de Lucro Média:* ${margemPeriodo.toFixed(1)}%\n`;
    texto += `🛍️ *Total de Vendas:* ${vendasPeriodo.length}\n`;
    texto += `🎯 *Ticket Médio:* ${formatCurrency(ticketMedio)}\n\n`;

    if (produtosOrdenados.length > 0) {
      texto += `*Top Produtos Vendidos:*\n`;
      produtosOrdenados.slice(0, 5).forEach(([nome, dados], idx) => {
        texto += `${idx + 1}. ${nome} — ${dados.qtd} un (${formatCurrency(dados.total)})\n`;
      });
    }

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const meses = [
    { num: '01', nome: 'Janeiro' },
    { num: '02', nome: 'Fevereiro' },
    { num: '03', nome: 'Março' },
    { num: '04', nome: 'Abril' },
    { num: '05', nome: 'Maio' },
    { num: '06', nome: 'Junho' },
    { num: '07', nome: 'Julho' },
    { num: '08', nome: 'Agosto' },
    { num: '09', nome: 'Setembro' },
    { num: '10', nome: 'Outubro' },
    { num: '11', nome: 'Novembro' },
    { num: '12', nome: 'Dezembro' },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-display text-2xl font-bold tracking-tight"
            style={{ color: currentTheme.textMain }}
          >
            Balanço Financeiro
          </h2>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>
            Acompanhe seu lucro real e faturamento mensal
          </p>
        </div>

        <button
          onClick={handleExportarRelatorio}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
          title="Exportar relatório para o WhatsApp"
        >
          <Share2 size={14} />
          <span>Exportar</span>
        </button>
      </div>

      {/* Seletores de Mês e Ano */}
      <div
        className="rounded-2xl p-3 border flex items-center gap-2"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <Calendar size={16} className="text-muted-foreground ml-1" />
        <select
          value={mesFiltro}
          onChange={(e) => setMesFiltro(e.target.value)}
          className="flex-1 py-1 px-2 rounded-xl text-xs font-semibold bg-transparent focus:outline-none cursor-pointer"
          style={{ color: currentTheme.textMain }}
        >
          {meses.map((m) => (
            <option key={m.num} value={m.num}>
              {m.nome}
            </option>
          ))}
        </select>

        <select
          value={anoFiltro}
          onChange={(e) => setAnoFiltro(e.target.value)}
          className="w-24 py-1 px-2 rounded-xl text-xs font-semibold bg-transparent focus:outline-none cursor-pointer text-right"
          style={{ color: currentTheme.textMain }}
        >
          {['2025', '2026', '2027'].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Main KPI Card */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Faturamento do Período
          </span>
          <span className="text-xs font-bold text-muted-foreground">
            {vendasPeriodo.length} vendas
          </span>
        </div>

        <p
          className="font-display font-bold text-3xl sm:text-4xl"
          style={{ color: currentTheme.textMain }}
        >
          {formatCurrency(faturamentoPeriodo)}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Card Lucro */}
          <div
            className="p-3.5 rounded-2xl border"
            style={{ backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }}
          >
            <span className="text-[11px] font-semibold text-[#2E7D32] flex items-center gap-1">
              <TrendingUp size={12} /> Lucro Líquido
            </span>
            <p className="font-display font-bold text-xl text-[#1B5E20] mt-1">
              {formatCurrency(lucroPeriodo)}
            </p>
            <span className="text-[10px] text-[#2E7D32] font-semibold">
              Margem: {margemPeriodo.toFixed(0)}%
            </span>
          </div>

          {/* Card Custos */}
          <div
            className="p-3.5 rounded-2xl border"
            style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
          >
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <TrendingDown size={12} /> Custos Totais
            </span>
            <p className="font-display font-bold text-xl text-red-600 mt-1">
              {formatCurrency(custosPeriodo)}
            </p>
            <span className="text-[10px] text-muted-foreground">
              Insumos + fixos + M.O.
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
          <span className="text-muted-foreground">Ticket Médio por Venda:</span>
          <strong style={{ color: currentTheme.textMain }}>{formatCurrency(ticketMedio)}</strong>
        </div>
      </div>

      {/* Banner de Celebração de Lucro Positivo / Apoio ao Projeto */}
      {lucroPeriodo > 0 && onNavigate && (
        <div
          className="rounded-3xl p-4.5 border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: '#D4A574',
            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.12) 0%, rgba(200, 90, 110, 0.1) 100%)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-2xl mt-0.5">🧁</span>
            <div>
              <p className="font-bold text-sm" style={{ color: currentTheme.textMain }}>
                Saldo Positivo de {formatCurrency(lucroPeriodo)}! Parabéns pelas vendas!
              </p>
              <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                Quando fechar no positivo, apoie o DoceGestor! Sua doação ajuda a construir e liberar mais aplicativos 100% gratuitos para a comunidade.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('config', { scrollToApoio: true })}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs shrink-0 transition hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#C85A6E' }}
          >
            <Heart size={14} className="fill-white" />
            <span>💖 Fazer Doação PIX</span>
          </button>
        </div>
      )}

      {/* Ranking de Produtos Mais Vendidos */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base" style={{ color: currentTheme.textMain }}>
            Mais Vendidos no Período
          </h3>
          <Award size={18} className="text-[#D4A574]" />
        </div>

        {produtosOrdenados.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3 text-center">
            Nenhuma venda neste mês selecionado.
          </p>
        ) : (
          <div className="space-y-3">
            {produtosOrdenados.map(([nomeProd, stats], idx) => {
              const percTotal =
                faturamentoPeriodo > 0 ? (stats.total / faturamentoPeriodo) * 100 : 0;

              return (
                <div key={nomeProd} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground w-4">{idx + 1}.</span>
                      <strong className="text-foreground">{nomeProd}</strong>
                      <span className="text-[11px] text-muted-foreground">
                        ({stats.qtd}x)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{formatCurrency(stats.total)}</span>
                      <span className="text-[10px] text-[#2E7D32] ml-1.5 font-medium">
                        +{formatCurrency(stats.lucro)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percTotal}%`,
                        backgroundColor: currentTheme.primary,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formas de Pagamento Utilizadas */}
      {Object.keys(formasPagamento).length > 0 && (
        <div
          className="rounded-3xl p-5 border shadow-sm space-y-3"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: currentTheme.border,
          }}
        >
          <h3 className="font-display font-bold text-base" style={{ color: currentTheme.textMain }}>
            Formas de Pagamento
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(formasPagamento).map(([forma, valor]) => (
              <div
                key={forma}
                className="p-3 rounded-2xl border flex flex-col justify-between"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                }}
              >
                <span className="text-xs font-semibold text-muted-foreground">
                  {labelsPagamento[forma] || forma}
                </span>
                <p className="font-display font-bold text-sm mt-1" style={{ color: currentTheme.textMain }}>
                  {formatCurrency(valor)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
