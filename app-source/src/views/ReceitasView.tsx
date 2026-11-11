import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Clock,
  Flame,
  Calendar,
  Calculator,
  Eye,
  FileText,
  Sparkles,
  Search,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Receita, ReceitaInsumo } from '../types';

interface ReceitasViewProps {
  onNavigate?: (tab: string, extra?: any) => void;
}

export const ReceitasView: React.FC<ReceitasViewProps> = ({ onNavigate }) => {
  const { config, receitas, insumos, addReceita, removeReceita, currentTheme } = useApp();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [receitaVisualizando, setReceitaVisualizando] = useState<Receita | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Docinhos Gourmet');
  const [rendimentoQtd, setRendimentoQtd] = useState(25);
  const [rendimentoUnidade, setRendimentoUnidade] = useState('unidades');
  const [tempoPreparoHoras, setTempoPreparoHoras] = useState(1.0);
  const [tempoFornoMinutos, setTempoFornoMinutos] = useState<number | undefined>(undefined);
  const [validadeDias, setValidadeDias] = useState<number | undefined>(5);
  const [modoPreparo, setModoPreparo] = useState('');
  const [dicasArmazenamento, setDicasArmazenamento] = useState('');
  const [insumosReceita, setInsumosReceita] = useState<ReceitaInsumo[]>([]);

  // Adicionar ingrediente no form
  const [selInsumoId, setSelInsumoId] = useState('');
  const [selQtd, setSelQtd] = useState<number>(1);
  const [manualNome, setManualNome] = useState('');
  const [manualQtd, setManualQtd] = useState(1);
  const [manualUnidade, setManualUnidade] = useState('un');
  const [manualCusto, setManualCusto] = useState(0);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Categorias disponíveis
  const categorias = [
    'Todas',
    'Docinhos Gourmet',
    'Bolos Caseiros',
    'Bolos de Festa',
    'Sobremesas & Potes',
    'Brownies & Cookies',
    'Recheios & Coberturas',
  ];

  const handleAddInsumoDaDespensa = () => {
    const ins = insumos.find((i) => i.id === selInsumoId);
    if (!ins || selQtd <= 0) return;

    const custo = ins.precoAtual * selQtd;
    const novo: ReceitaInsumo = {
      id: 'ri_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      insumoId: ins.id,
      nome: ins.nome,
      quantidade: selQtd,
      unidade: ins.unidade,
      custo: Number(custo.toFixed(2)),
    };

    setInsumosReceita((prev) => [...prev, novo]);
    setSelInsumoId('');
    setSelQtd(1);
  };

  const handleAddInsumoManual = () => {
    if (!manualNome.trim() || manualCusto <= 0) return;

    const novo: ReceitaInsumo = {
      id: 'ri_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      nome: manualNome.trim(),
      quantidade: manualQtd,
      unidade: manualUnidade,
      custo: Number(manualCusto.toFixed(2)),
    };

    setInsumosReceita((prev) => [...prev, novo]);
    setManualNome('');
    setManualQtd(1);
    setManualCusto(0);
  };

  const handleRemoverInsumoReceita = (id: string) => {
    setInsumosReceita((prev) => prev.filter((i) => i.id !== id));
  };

  const totalCustoInsumosForm = insumosReceita.reduce((acc, i) => acc + i.custo, 0);

  const handleSalvarReceita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || insumosReceita.length === 0) {
      alert('Preencha o nome da receita e adicione pelo menos um ingrediente.');
      return;
    }

    addReceita({
      nome: nome.trim(),
      categoria,
      rendimentoQtd,
      rendimentoUnidade,
      tempoPreparoHoras,
      tempoFornoMinutos: tempoFornoMinutos || undefined,
      validadeDias: validadeDias || undefined,
      modoPreparo: modoPreparo.trim() || undefined,
      dicasArmazenamento: dicasArmazenamento.trim() || undefined,
      insumos: insumosReceita,
    });

    // Reset
    setNome('');
    setInsumosReceita([]);
    setModoPreparo('');
    setDicasArmazenamento('');
    setMostrarForm(false);
  };

  // Filtragem
  const receitasFiltradas = receitas.filter((r) => {
    const matchBusca = r.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoriaFiltro === 'Todas' || r.categoria === categoriaFiltro;
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
            Livro de Receitas
          </h2>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>
            Fichas técnicas com recálculo automático de custos
          </p>
        </div>

        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Plus size={16} />
          {mostrarForm ? 'Fechar' : 'Nova Receita'}
        </button>
      </div>

      {/* Formulário Nova Receita */}
      {mostrarForm && (
        <form
          onSubmit={handleSalvarReceita}
          className="rounded-3xl p-5 border shadow-md space-y-4 animate-in fade-in duration-200"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: currentTheme.border,
          }}
        >
          <h3 className="font-display font-bold text-base" style={{ color: currentTheme.textMain }}>
            Nova Ficha Técnica de Receita
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: currentTheme.textMain }}>
                Nome da Receita *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Torta Holandesa Nobre"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: currentTheme.textMain }}>
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none appearance-none"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              >
                {categorias.filter((c) => c !== 'Todas').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Rendimento *</label>
              <input
                type="number"
                min="1"
                value={rendimentoQtd}
                onChange={(e) => setRendimentoQtd(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Unidade</label>
              <input
                type="text"
                value={rendimentoUnidade}
                onChange={(e) => setRendimentoUnidade(e.target.value)}
                placeholder="unidades, fatias"
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Horas Trabalho</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={tempoPreparoHoras}
                onChange={(e) => setTempoPreparoHoras(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Forno (Min)</label>
              <input
                type="number"
                min="0"
                value={tempoFornoMinutos || ''}
                onChange={(e) => setTempoFornoMinutos(parseInt(e.target.value) || undefined)}
                placeholder="Ex: 40"
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
            </div>
          </div>

          {/* Ingredientes Adicionados */}
          <div className="space-y-2 border-t pt-3 border-border">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold" style={{ color: currentTheme.textMain }}>
                Ingredientes ({insumosReceita.length}):
              </label>
              <span className="text-xs font-bold text-[#C85A6E]">
                Custo Insumos: {formatCurrency(totalCustoInsumosForm)}
              </span>
            </div>

            {insumosReceita.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                }}
              >
                <span>
                  {item.quantidade} {item.unidade} de <strong>{item.nome}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(item.custo)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoverInsumoReceita(item.id)}
                    className="text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {/* Inserir da despensa */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <select
                value={selInsumoId}
                onChange={(e) => setSelInsumoId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border text-xs bg-white focus:outline-none appearance-none"
                style={{ borderColor: currentTheme.border }}
              >
                <option value="">+ Selecionar da despensa...</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} ({formatCurrency(i.precoAtual)}/{i.unidade})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={selQtd}
                  onChange={(e) => setSelQtd(parseFloat(e.target.value) || 1)}
                  className="w-20 px-2 py-2 rounded-xl border text-xs text-center bg-white"
                  style={{ borderColor: currentTheme.border }}
                  placeholder="Qtd"
                />
                <button
                  type="button"
                  onClick={handleAddInsumoDaDespensa}
                  disabled={!selInsumoId}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Modo de Preparo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold block" style={{ color: currentTheme.textMain }}>
              Modo de Preparo & Passo a Passo
            </label>
            <textarea
              rows={3}
              value={modoPreparo}
              onChange={(e) => setModoPreparo(e.target.value)}
              placeholder="Descreva as etapas, temperatura de forno, ponto da massa..."
              className="w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none"
              style={{
                backgroundColor: currentTheme.bgPrimary,
                borderColor: currentTheme.border,
                color: currentTheme.textMain,
              }}
            />
          </div>

          {/* Botões Form */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="flex-1 py-3 rounded-2xl border text-xs font-semibold hover:bg-black/5"
              style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim() || insumosReceita.length === 0}
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-white shadow-sm disabled:opacity-40"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Salvar Receita
            </button>
          </div>
        </form>
      )}

      {/* Barra de Busca & Categorias */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar receita por nome..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm bg-white focus:outline-none focus:ring-2 shadow-xs"
            style={{ borderColor: currentTheme.border, color: currentTheme.textMain }}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                categoriaFiltro === cat
                  ? 'bg-[#3D2314] text-[#FFF8F0] font-semibold'
                  : 'bg-white border text-muted-foreground hover:bg-black/5'
              }`}
              style={{ borderColor: currentTheme.border }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Receitas */}
      <div className="space-y-3">
        {receitasFiltradas.length === 0 ? (
          <div
            className="rounded-3xl p-8 border text-center shadow-sm"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <span className="text-4xl block mb-2">📖</span>
            <p className="font-semibold text-sm" style={{ color: currentTheme.textMain }}>
              Nenhuma receita encontrada
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              Toque em "Nova Receita" para cadastrar sua receita artesanal!
            </p>
          </div>
        ) : (
          receitasFiltradas.map((rec) => {
            // Calcular custo atual dos insumos usando os preços mais recentes da despensa!
            const custoInsumosAtualizado = rec.insumos.reduce((acc, item) => {
              if (item.insumoId) {
                const insumoGlobal = insumos.find((g) => g.id === item.insumoId);
                if (insumoGlobal) {
                  return acc + insumoGlobal.precoAtual * item.quantidade;
                }
              }
              return acc + item.custo;
            }, 0);

            const custoMaoObraRec = rec.tempoPreparoHoras * (config.horaTrabalho ?? 18);
            const custoTotalRec = custoInsumosAtualizado + custoMaoObraRec;
            const custoUnitarioRec = rec.rendimentoQtd > 0 ? custoTotalRec / rec.rendimentoQtd : custoTotalRec;

            return (
              <div
                key={rec.id}
                className="rounded-3xl border shadow-sm p-4 sm:p-5 transition"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.border,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: currentTheme.primary + '15',
                        color: currentTheme.primary,
                      }}
                    >
                      {rec.categoria}
                    </span>
                    <h3
                      className="font-display font-bold text-lg mt-1"
                      style={{ color: currentTheme.textMain }}
                    >
                      {rec.nome}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Rende: <strong>{rec.rendimentoQtd} {rec.rendimentoUnidade}</strong> · {rec.tempoPreparoHoras}h de preparo
                      {rec.tempoFornoMinutos ? ` · ${rec.tempoFornoMinutos} min forno` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Custo Unitário:</span>
                    <p className="font-display font-bold text-base text-[#2E7D32]">
                      {formatCurrency(custoUnitarioRec)}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Total: {formatCurrency(custoTotalRec)}
                    </span>
                  </div>
                </div>

                {/* Tags de Ingredientes principais */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {rec.insumos.map((i, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-xl border bg-black/5 text-[#3D2314]"
                      style={{ borderColor: currentTheme.border }}
                    >
                      {i.quantidade} {i.unidade} {i.nome}
                    </span>
                  ))}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    onClick={() => setReceitaVisualizando(rec)}
                    className="flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: currentTheme.textMain }}
                  >
                    <FileText size={14} />
                    <span>Ver Ficha Completa</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('calcular', { receitaId: rec.id })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: currentTheme.accent }}
                      >
                        <Calculator size={13} />
                        <span>Precificar</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Excluir a receita "${rec.nome}"?`)) {
                          removeReceita(rec.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-red-400 hover:bg-red-50 transition cursor-pointer"
                      title="Excluir receita"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Visualização de Ficha Técnica Completa */}
      {receitaVisualizando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <div className="flex items-start justify-between border-b pb-3 border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Ficha Técnica de Confeitaria
                </span>
                <h3
                  className="font-display font-bold text-xl"
                  style={{ color: currentTheme.textMain }}
                >
                  {receitaVisualizando.nome}
                </h3>
              </div>
              <button
                onClick={() => setReceitaVisualizando(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/5 border border-border">
                <span className="text-muted-foreground block">Rendimento:</span>
                <strong className="text-sm">{receitaVisualizando.rendimentoQtd} {receitaVisualizando.rendimentoUnidade}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/5 border border-border">
                <span className="text-muted-foreground block">Tempo de Preparo:</span>
                <strong className="text-sm">{receitaVisualizando.tempoPreparoHoras} horas</strong>
              </div>
            </div>

            {/* Ingredientes detalhados */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                Ingredientes & Quantidades:
              </p>
              <div className="space-y-1.5 text-xs">
                {receitaVisualizando.insumos.map((i, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span>
                      {i.quantidade} {i.unidade} de <strong>{i.nome}</strong>
                    </span>
                    <span className="font-semibold">{formatCurrency(i.custo)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modo de preparo */}
            {receitaVisualizando.modoPreparo && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">
                  Modo de Preparo:
                </p>
                <div className="p-3 rounded-2xl bg-black/5 text-xs leading-relaxed whitespace-pre-line text-foreground">
                  {receitaVisualizando.modoPreparo}
                </div>
              </div>
            )}

            {/* Dicas de armazenamento */}
            {receitaVisualizando.dicasArmazenamento && (
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
                <strong>Dica de Armazenamento:</strong> {receitaVisualizando.dicasArmazenamento}
              </div>
            )}

            <button
              onClick={() => setReceitaVisualizando(null)}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Fechar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
