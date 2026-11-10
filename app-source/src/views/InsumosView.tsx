import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Calendar,
  Store,
  TrendingUp,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Insumo, CategoriaInsumo } from '../types';

export const InsumosView: React.FC = () => {
  const { insumos, addInsumo, addCompraInsumo, removeCompraInsumo, removeInsumo, currentTheme } =
    useApp();

  const [mostrarNovoInsumo, setMostrarNovoInsumo] = useState(false);
  const [insumoIdParaCompra, setInsumoIdParaCompra] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [expandedInsumoId, setExpandedInsumoId] = useState<string | null>(null);

  // Form Novo Insumo
  const [novoNome, setNovoNome] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<CategoriaInsumo>('laticinios');
  const [novaUnidade, setNovaUnidade] = useState('kg');
  const [novoPreco, setNovoPreco] = useState<number>(0);
  const [novoEstoque, setNovoEstoque] = useState<number>(0);
  const [novoEstoqueMinimo, setNovoEstoqueMinimo] = useState<number>(1);

  // Form Registrar Compra
  const [compraPreco, setCompraPreco] = useState<number>(0);
  const [compraQtdTexto, setCompraQtdTexto] = useState('');
  const [compraLocal, setCompraLocal] = useState('');
  const [compraData, setCompraData] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const categorias: { id: string; label: string }[] = [
    { id: 'todas', label: 'Todos' },
    { id: 'laticinios', label: '🥛 Laticínios' },
    { id: 'chocolates', label: '🍫 Chocolates' },
    { id: 'farinhas', label: '🌾 Farinhas' },
    { id: 'acucares', label: '🍬 Açúcares' },
    { id: 'ovos', label: '🥚 Ovos' },
    { id: 'embalagens', label: '📦 Embalagens' },
    { id: 'frutas', label: '🍓 Frutas' },
    { id: 'confeitos', label: '✨ Confeitos' },
  ];

  const handleSalvarNovoInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    addInsumo({
      nome: novoNome.trim(),
      categoria: novaCategoria,
      unidade: novaUnidade.trim() || 'un',
      precoAtual: novoPreco || 0,
      estoqueAtual: novoEstoque || undefined,
      estoqueMinimo: novoEstoqueMinimo || undefined,
    });

    setNovoNome('');
    setNovoPreco(0);
    setNovoEstoque(0);
    setMostrarNovoInsumo(false);
  };

  const handleSalvarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoIdParaCompra || compraPreco <= 0) return;

    addCompraInsumo(insumoIdParaCompra, {
      data: compraData,
      localFornecedor: compraLocal.trim() || 'Fornecedor padrão',
      precoPago: compraPreco,
      quantidadeComprada: compraQtdTexto.trim() || '1 un',
      precoUnitario: compraPreco,
    });

    setCompraPreco(0);
    setCompraQtdTexto('');
    setCompraLocal('');
    setInsumoIdParaCompra(null);
  };

  // Filtragem
  const insumosFiltrados = insumos.filter((i) => {
    const matchBusca = i.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoriaFiltro === 'todas' || i.categoria === categoriaFiltro;
    return matchBusca && matchCat;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-display text-2xl font-bold tracking-tight"
            style={{ color: currentTheme.textMain }}
          >
            Estoque & Insumos
          </h2>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>
            Preços atualizados e histórico de compras
          </p>
        </div>

        <button
          onClick={() => setMostrarNovoInsumo(!mostrarNovoInsumo)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Plus size={16} />
          {mostrarNovoInsumo ? 'Fechar' : 'Novo Insumo'}
        </button>
      </div>

      {/* Modal / Form Novo Insumo */}
      {mostrarNovoInsumo && (
        <form
          onSubmit={handleSalvarNovoInsumo}
          className="rounded-3xl p-5 border shadow-md space-y-4 animate-in fade-in duration-200"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: currentTheme.border,
          }}
        >
          <h3 className="font-display font-bold text-base" style={{ color: currentTheme.textMain }}>
            Cadastrar Novo Insumo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Nome do Ingrediente *</label>
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Leite Ninho Integral em Pó 400g"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Categoria</label>
              <select
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value as CategoriaInsumo)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none appearance-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              >
                <option value="laticinios">🥛 Laticínios</option>
                <option value="chocolates">🍫 Chocolates & Cacau</option>
                <option value="farinhas">🌾 Farinhas & Grãos</option>
                <option value="acucares">🍬 Açúcares & Adoçantes</option>
                <option value="ovos">🥚 Ovos</option>
                <option value="embalagens">📦 Embalagens</option>
                <option value="frutas">🍓 Frutas</option>
                <option value="confeitos">✨ Confeitos & Decoração</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Unidade</label>
              <input
                type="text"
                value={novaUnidade}
                onChange={(e) => setNovaUnidade(e.target.value)}
                placeholder="kg, lata, un"
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Preço Atual (R$)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={novoPreco || ''}
                onChange={(e) => setNovoPreco(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 15.90"
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Estoque Mínimo</label>
              <input
                type="number"
                min="1"
                value={novoEstoqueMinimo}
                onChange={(e) => setNovoEstoqueMinimo(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarNovoInsumo(false)}
              className="flex-1 py-3 rounded-2xl border text-xs font-semibold hover:bg-black/5"
              style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!novoNome.trim()}
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-white shadow-sm disabled:opacity-40"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Cadastrar Insumo
            </button>
          </div>
        </form>
      )}

      {/* Modal Registrar Compra de Insumo */}
      {insumoIdParaCompra && (
        <form
          onSubmit={handleSalvarCompra}
          className="rounded-3xl p-5 border shadow-md space-y-3 animate-in fade-in duration-150"
          style={{
            backgroundColor: '#FFF8F0',
            borderColor: '#D4A574',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-[#3D2314]">
              Registrar Compra: {insumos.find((i) => i.id === insumoIdParaCompra)?.nome}
            </h3>
            <button
              type="button"
              onClick={() => setInsumoIdParaCompra(null)}
              className="text-xs text-muted-foreground p-1 hover:bg-black/5 rounded-full"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1">Preço Pago (R$) *</label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={compraPreco || ''}
                onChange={(e) => setCompraPreco(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 6.80"
                className="w-full px-3 py-2 rounded-xl border text-sm bg-white focus:outline-none"
                style={{ borderColor: currentTheme.border }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1">Local / Fornecedor</label>
              <input
                type="text"
                value={compraLocal}
                onChange={(e) => setCompraLocal(e.target.value)}
                placeholder="Ex: Atacadão, Assaí, Doceria..."
                className="w-full px-3 py-2 rounded-xl border text-sm bg-white focus:outline-none"
                style={{ borderColor: currentTheme.border }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1">Quantidade Comprada</label>
              <input
                type="text"
                value={compraQtdTexto}
                onChange={(e) => setCompraQtdTexto(e.target.value)}
                placeholder="Ex: 1 caixa com 27 un"
                className="w-full px-3 py-2 rounded-xl border text-sm bg-white focus:outline-none"
                style={{ borderColor: currentTheme.border }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1">Data da Compra</label>
              <input
                type="date"
                value={compraData}
                onChange={(e) => setCompraData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm bg-white focus:outline-none"
                style={{ borderColor: currentTheme.border }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={compraPreco <= 0}
            className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-sm disabled:opacity-40"
            style={{ backgroundColor: currentTheme.primary }}
          >
            Salvar Compra & Atualizar Preço
          </button>
        </form>
      )}

      {/* Busca & Categorias */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar ingrediente ou insumo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm bg-white focus:outline-none shadow-xs"
            style={{ borderColor: currentTheme.border }}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaFiltro(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                categoriaFiltro === cat.id
                  ? 'bg-[#3D2314] text-[#FFF8F0] font-semibold'
                  : 'bg-white border text-muted-foreground hover:bg-black/5'
              }`}
              style={{ borderColor: currentTheme.border }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Insumos */}
      <div className="space-y-3">
        {insumosFiltrados.length === 0 ? (
          <div
            className="rounded-3xl p-8 border text-center shadow-sm"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <span className="text-4xl block mb-2">📦</span>
            <p className="font-semibold text-sm" style={{ color: currentTheme.textMain }}>
              Nenhum insumo encontrado
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              Cadastre seus insumos para ter controle de preços e calcular receitas!
            </p>
          </div>
        ) : (
          insumosFiltrados.map((insumo) => {
            const isExpanded = expandedInsumoId === insumo.id;

            return (
              <div
                key={insumo.id}
                className="rounded-3xl border shadow-sm p-4 sm:p-5 transition"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.border,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-semibold text-base"
                        style={{ color: currentTheme.textMain }}
                      >
                        {insumo.nome}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unidade base: <strong>{insumo.unidade}</strong>
                      {insumo.compras.length > 0 &&
                        ` · ${insumo.compras.length} compra${
                          insumo.compras.length > 1 ? 's' : ''
                        } no histórico`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Preço Atual:</span>
                    <p className="font-display font-bold text-lg" style={{ color: currentTheme.primary }}>
                      {formatCurrency(insumo.precoAtual)}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                  <button
                    onClick={() => setExpandedInsumoId(isExpanded ? null : insumo.id)}
                    className="flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: currentTheme.textMain }}
                  >
                    <History size={14} />
                    <span>Histórico ({insumo.compras.length})</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInsumoIdParaCompra(insumo.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: currentTheme.accent }}
                    >
                      + Registrar Compra
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remover "${insumo.nome}"?`)) {
                          removeInsumo(insumo.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-red-400 hover:bg-red-50 transition cursor-pointer"
                      title="Excluir insumo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Histórico de Compras Expandido */}
                {isExpanded && (
                  <div
                    className="mt-3 p-3 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-150"
                    style={{
                      backgroundColor: currentTheme.bgPrimary + '60',
                      borderColor: currentTheme.border,
                    }}
                  >
                    <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                      Histórico de Compras Realizadas:
                    </p>

                    {insumo.compras.length === 0 ? (
                      <p className="italic text-muted-foreground">Nenhuma compra registrada ainda.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {insumo.compras.map((cp) => (
                          <div
                            key={cp.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white border border-border"
                          >
                            <div>
                              <p className="font-medium text-xs text-foreground">
                                {cp.localFornecedor}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {cp.data.split('-').reverse().join('/')} · Qtd: {cp.quantidadeComprada}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#3D2314]">
                                {formatCurrency(cp.precoPago)}
                              </span>
                              <button
                                onClick={() => removeCompraInsumo(insumo.id, cp.id)}
                                className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                title="Remover este registro"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
