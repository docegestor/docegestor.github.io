import React from 'react';
import {
  Calculator,
  ShoppingBag,
  Package,
  BookOpen,
  PieChart,
  ArrowUpRight,
  Target,
  Sparkles,
  Clock,
  Send,
  PlusCircle,
  TrendingUp,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Venda } from '../types';

interface HomeViewProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { config, vendas, produtos, currentTheme } = useApp();

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Cálculos do mês atual
  const now = new Date();
  const currentMonthPrefix = now.toISOString().slice(0, 7);
  const currentMonthName = now.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const vendasMes = vendas.filter((v) => v.dataVenda.startsWith(currentMonthPrefix));
  const faturamentoMes = vendasMes.reduce((acc, v) => acc + v.valorTotal, 0);
  const lucroMes = vendasMes.reduce((acc, v) => acc + v.lucroEstimado, 0);
  const custosMes = faturamentoMes - lucroMes;
  const margemReal = faturamentoMes > 0 ? (lucroMes / faturamentoMes) * 100 : 0;

  // Meta mensal
  const meta = config.metaVendasMensal || 3000;
  const percentMeta = Math.min(100, Math.round((faturamentoMes / meta) * 100));

  // Encomendas pendentes
  const encomendasPendentes = vendas.filter(
    (v) => v.tipo === 'encomenda' && (v.status === 'pendente' || v.status === 'em_producao')
  );

  return (
    <div className="space-y-5 pb-6">
      {/* Welcome Banner & Summary */}
      <div
        className="rounded-3xl p-5 sm:p-6 border relative overflow-hidden shadow-sm"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              className="font-display font-bold text-2xl tracking-tight"
              style={{ color: currentTheme.textMain }}
            >
              Olá, {config.nomeResponsavel || 'Confeiteira'} 👋
            </h2>
            <p className="text-xs mt-0.5 capitalize" style={{ color: currentTheme.textMuted }}>
              {currentMonthName} · Gestão em dia
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border"
            style={{
              backgroundColor: currentTheme.bgPrimary,
              borderColor: currentTheme.border,
            }}
          >
            🧁
          </div>
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: currentTheme.bgPrimary,
              borderColor: currentTheme.border,
            }}
          >
            <span className="text-[11px] font-medium" style={{ color: currentTheme.textMuted }}>
              Faturamento do Mês
            </span>
            <p
              className="font-display text-2xl font-bold mt-1"
              style={{ color: currentTheme.textMain }}
            >
              {formatCurrency(faturamentoMes)}
            </p>
            <span className="text-[10px] text-[#2E7D32] flex items-center gap-1 font-medium mt-0.5">
              <TrendingUp size={11} /> {vendasMes.length} vendas registradas
            </span>
          </div>

          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: '#E8F5E9',
              borderColor: '#C8E6C9',
            }}
          >
            <span className="text-[11px] font-medium text-[#2E7D32]">
              Lucro Líquido Real
            </span>
            <p className="font-display text-2xl font-bold text-[#1B5E20] mt-1">
              {formatCurrency(lucroMes)}
            </p>
            <span className="text-[10px] text-[#2E7D32] font-semibold mt-0.5 block">
              Margem média: {margemReal.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Monthly Goal Progress */}
        <div
          className="rounded-2xl p-3.5 border"
          style={{
            backgroundColor: currentTheme.bgPrimary,
            borderColor: currentTheme.border,
          }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium flex items-center gap-1.5" style={{ color: currentTheme.textMain }}>
              <Target size={14} style={{ color: currentTheme.accent }} />
              Meta do Mês: {formatCurrency(meta)}
            </span>
            <span className="font-bold" style={{ color: currentTheme.primary }}>
              {percentMeta}% atingido
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percentMeta}%`,
                backgroundColor: percentMeta >= 100 ? '#2E7D32' : currentTheme.accent,
              }}
            />
          </div>
          {percentMeta < 100 && (
            <p className="text-[10px] text-right mt-1.5" style={{ color: currentTheme.textMuted }}>
              Faltam {formatCurrency(Math.max(0, meta - faturamentoMes))} para a meta
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions (Boutique Bakery Flow) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider px-1 mb-2.5" style={{ color: currentTheme.textMuted }}>
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('calcular')}
            className="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:shadow-md active:scale-95 cursor-pointer"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
              style={{
                backgroundColor: currentTheme.primary + '15',
                color: currentTheme.primary,
              }}
            >
              <Calculator size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug" style={{ color: currentTheme.textMain }}>
                Calcular Preço
              </p>
              <p className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                Lucro e ponto de equilíbrio
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('vendas', { abrirNovaVenda: true })}
            className="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:shadow-md active:scale-95 cursor-pointer"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
              style={{
                backgroundColor: currentTheme.accent + '20',
                color: currentTheme.accent,
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug" style={{ color: currentTheme.textMain }}>
                Nova Venda
              </p>
              <p className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                Pronta-entrega ou encomenda
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('receitas')}
            className="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:shadow-md active:scale-95 cursor-pointer"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
              style={{
                backgroundColor: '#D4A574' + '25',
                color: '#B8834C',
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug" style={{ color: currentTheme.textMain }}>
                Fichas Técnicas
              </p>
              <p className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                Custo de receitas vivas
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('insumos')}
            className="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:shadow-md active:scale-95 cursor-pointer"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
              style={{
                backgroundColor: '#2E7D32' + '20',
                color: '#2E7D32',
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug" style={{ color: currentTheme.textMain }}>
                Estoque Insumos
              </p>
              <p className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                Preços & compras
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Encomendas Pendentes Alert */}
      {encomendasPendentes.length > 0 && (
        <div
          className="rounded-3xl p-5 border shadow-sm"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: currentTheme.border,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-display font-bold text-base flex items-center gap-2"
              style={{ color: currentTheme.textMain }}
            >
              <Clock size={18} className="text-[#D4A574]" />
              Próximas Encomendas ({encomendasPendentes.length})
            </h3>
            <button
              onClick={() => onNavigate('vendas')}
              className="text-xs font-semibold hover:underline"
              style={{ color: currentTheme.accent }}
            >
              Ver todas →
            </button>
          </div>

          <div className="space-y-2.5">
            {encomendasPendentes.slice(0, 3).map((ped) => (
              <div
                key={ped.id}
                className="rounded-2xl p-3.5 border flex items-center justify-between"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: currentTheme.textMain }}>
                      {ped.clienteNome}
                    </p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor:
                          ped.status === 'em_producao' ? '#FEF3C7' : '#E0E7FF',
                        color:
                          ped.status === 'em_producao' ? '#B45309' : '#3730A3',
                      }}
                    >
                      {ped.status === 'em_producao' ? 'Em Produção' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: currentTheme.textMuted }}>
                    {ped.itens.map((i) => `${i.quantidade}x ${i.produtoNome}`).join(', ')}
                  </p>
                  {ped.dataEntrega && (
                    <p className="text-[11px] font-medium text-[#C85A6E] mt-1">
                      📅 Entrega: {ped.dataEntrega.split('-').reverse().join('/')}{' '}
                      {ped.horaEntrega ? `às ${ped.horaEntrega}` : ''}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: currentTheme.textMain }}>
                    {formatCurrency(ped.valorTotal)}
                  </p>
                  {ped.valorRestante > 0 ? (
                    <span className="text-[10px] text-[#C62828] font-medium">
                      Resta: {formatCurrency(ped.valorRestante)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#2E7D32] font-medium">100% Pago</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produtos Cadastrados Highlights */}
      <div
        className="rounded-3xl p-5 border shadow-sm"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-base" style={{ color: currentTheme.textMain }}>
              Produtos Precificados ({produtos.length})
            </h3>
            <p className="text-xs" style={{ color: currentTheme.textMuted }}>
              Prontos para venda com margem calculada
            </p>
          </div>
          <button
            onClick={() => onNavigate('calcular')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1"
            style={{
              borderColor: currentTheme.border,
              backgroundColor: currentTheme.bgPrimary,
              color: currentTheme.textMain,
            }}
          >
            <PlusCircle size={14} /> Novo
          </button>
        </div>

        {produtos.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-3xl block mb-1">🧮</span>
            <p className="text-xs font-medium" style={{ color: currentTheme.textMain }}>
              Nenhum produto cadastrado ainda.
            </p>
            <p className="text-[11px] mt-0.5 mb-3" style={{ color: currentTheme.textMuted }}>
              Calcule seu primeiro doce para saber seu custo real e lucro!
            </p>
            <button
              onClick={() => onNavigate('calcular')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Calcular meu primeiro preço
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {produtos.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl border"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: currentTheme.textMain }}>
                    {p.nome}
                  </p>
                  <p className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                    Custo Unit.: {formatCurrency(p.custoUnitario)} · Margem: {p.margemPct}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: currentTheme.primary }}>
                    {formatCurrency(p.precoSugerido || p.precoCalculado)}
                  </p>
                  <button
                    onClick={() => onNavigate('vendas', { produtoPreSelecionado: p.id })}
                    className="text-[11px] font-semibold text-[#2E7D32] hover:underline"
                  >
                    Vender +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip for Confectioners */}
      <div
        className="rounded-3xl p-4.5 border flex items-start gap-3"
        style={{
          backgroundColor: currentTheme.bgPrimary,
          borderColor: currentTheme.border,
        }}
      >
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: currentTheme.textMain }}>
            Dica de Ouro da Confeitaria:
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: currentTheme.textMuted }}>
            Nunca esqueça de embutir a <strong>mão de obra</strong> e o <strong>tempo de limpeza e compras</strong> no seu preço! Eles são seu salário real.
          </p>
        </div>
      </div>
    </div>
  );
};
