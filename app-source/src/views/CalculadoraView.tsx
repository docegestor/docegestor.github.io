import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Save,
  Share2,
  Sparkles,
  BookOpen,
  DollarSign,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { InsumoCalculo } from '../types';

interface CalculadoraViewProps {
  receitaIdPreSelecionada?: string;
  onNavigate?: (tab: string, extra?: any) => void;
}

export const CalculadoraView: React.FC<CalculadoraViewProps> = ({
  receitaIdPreSelecionada,
  onNavigate,
}) => {
  const { config, insumos, receitas, addProduto, currentTheme } = useApp();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Doces & Sobremesas');
  const [rendimento, setRendimento] = useState<number>(1);
  const [rendimentoUnidade, setRendimentoUnidade] = useState('unidades');
  const [tempoHoras, setTempoHoras] = useState<number>(1.5);
  const [margemLucroPct, setMargemLucroPct] = useState<number>(80); // 80% lucro
  const [multiplicador, setMultiplicador] = useState<number>(config.multiplicadorPadrao ?? 3.0);
  const [margemDesperdicioPct, setMargemDesperdicioPct] = useState<number>(config.margemSegurancaPct ?? 5.0);
  const [insumosSelecionados, setInsumosSelecionados] = useState<InsumoCalculo[]>([]);

  // Input states para adicionar insumo da despensa
  const [despensaInsumoId, setDespensaInsumoId] = useState('');
  const [despensaQtd, setDespensaQtd] = useState('1');

  // Input states para insumo avulso manual
  const [manualNome, setManualNome] = useState('');
  const [manualQtd, setManualQtd] = useState('1 un');
  const [manualCusto, setManualCusto] = useState<number>(0);

  const [sucessoSalvar, setSucessoSalvar] = useState(false);
  const [showSimuladorDesconto, setShowSimuladorDesconto] = useState(false);
  const [descontoSimulado, setDescontoSimulado] = useState<number>(10); // 10% desconto

  // Se veio de uma receita pré-selecionada, carrega automático
  useEffect(() => {
    if (receitaIdPreSelecionada) {
      const rec = receitas.find((r) => r.id === receitaIdPreSelecionada);
      if (rec) {
        setNome(rec.nome);
        setCategoria(rec.categoria || 'Receitas da Casa');
        setRendimento(rec.rendimentoQtd || 1);
        setRendimentoUnidade(rec.rendimentoUnidade || 'unidades');
        setTempoHoras(rec.tempoPreparoHoras || 1.0);
        const insConvertidos: InsumoCalculo[] = rec.insumos.map((ri) => ({
          id: 'calc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          nome: ri.nome,
          insumoId: ri.insumoId,
          quantidade: ri.quantidade,
          unidade: ri.unidade,
          custo: ri.custo,
        }));
        setInsumosSelecionados(insConvertidos);
      }
    }
  }, [receitaIdPreSelecionada, receitas]);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Cálculos financeiros
  const custoInsumosBruto = insumosSelecionados.reduce((acc, i) => acc + i.custo, 0);
  const custoDesperdicio = custoInsumosBruto * (margemDesperdicioPct / 100);
  const custoInsumosComPerda = custoInsumosBruto + custoDesperdicio;

  // Custos fixos % (ex: 10% para gás, água, energia)
  const custoFixosPctValor = custoInsumosComPerda * ((config.custosFixosPct ?? 10) / 100);

  // Custos fixos em R$ (itens configurados na aba config)
  const custoFixosValor = config.custosFixosPersonais.reduce((acc, c) => acc + c.valor, 0);

  // Mão de obra (Horas de trabalho x valor da hora configurada)
  const custoMaoObra = tempoHoras * (config.horaTrabalho ?? 18);

  // Custo Total e Unitário
  const custoTotal = custoInsumosComPerda + custoFixosPctValor + custoFixosValor + custoMaoObra;
  const custoUnitario = rendimento > 0 ? custoTotal / rendimento : custoTotal;

  // Preço Mínimo (Break-even + 35% de margem mínima de segurança)
  const precoMinimo = custoUnitario * 1.35;

  // Preço Calculado com a margem desejada
  const precoCalculado = custoUnitario * (1 + margemLucroPct / 100);

  // Preço Sugerido pelo multiplicador (regra 3x tradicional)
  const precoSugerido = custoUnitario * multiplicador;

  // Lucro unitário do preço sugerido
  const lucroUnitarioSugerido = precoSugerido - custoUnitario;
  const lucroTotalReceita = lucroUnitarioSugerido * rendimento;

  // Adicionar insumo da despensa
  const handleAddInsumoDespensa = () => {
    if (!despensaInsumoId || parseFloat(despensaQtd) <= 0) return;
    const ins = insumos.find((i) => i.id === despensaInsumoId);
    if (!ins) return;

    const qtd = parseFloat(despensaQtd);
    const custo = ins.precoAtual * qtd;

    const novo: InsumoCalculo = {
      id: 'calc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nome: `${ins.nome} (${qtd} ${ins.unidade})`,
      insumoId: ins.id,
      quantidade: qtd,
      unidade: ins.unidade,
      custo: Number(custo.toFixed(2)),
    };

    setInsumosSelecionados((prev) => [...prev, novo]);
    setDespensaInsumoId('');
    setDespensaQtd('1');
  };

  // Adicionar insumo manual avulso
  const handleAddInsumoManual = () => {
    if (!manualNome.trim() || manualCusto <= 0) return;

    const novo: InsumoCalculo = {
      id: 'calc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nome: manualNome.trim(),
      quantidade: 1,
      unidade: manualQtd || 'un',
      custo: Number(manualCusto.toFixed(2)),
    };

    setInsumosSelecionados((prev) => [...prev, novo]);
    setManualNome('');
    setManualQtd('1 un');
    setManualCusto(0);
  };

  const handleRemoverInsumo = (id: string) => {
    setInsumosSelecionados((prev) => prev.filter((i) => i.id !== id));
  };

  // Carregar receita completa
  const handleCarregarReceita = (recId: string) => {
    const rec = receitas.find((r) => r.id === recId);
    if (!rec) return;

    setNome(rec.nome);
    setCategoria(rec.categoria || 'Receitas da Casa');
    setRendimento(rec.rendimentoQtd || 1);
    setRendimentoUnidade(rec.rendimentoUnidade || 'unidades');
    setTempoHoras(rec.tempoPreparoHoras || 1.0);

    const convertidos: InsumoCalculo[] = rec.insumos.map((ri) => ({
      id: 'calc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nome: ri.nome,
      insumoId: ri.insumoId,
      quantidade: ri.quantidade,
      unidade: ri.unidade,
      custo: ri.custo,
    }));
    setInsumosSelecionados(convertidos);
  };

  // Salvar como produto
  const handleSalvarProduto = () => {
    if (!nome.trim() || insumosSelecionados.length === 0) {
      alert('Preencha o nome do produto e adicione pelo menos um insumo.');
      return;
    }

    addProduto({
      nome: nome.trim(),
      categoria,
      rendimento,
      rendimentoUnidade,
      tempoMaoDeObraHoras: tempoHoras,
      custoInsumos: Number(custoInsumosComPerda.toFixed(2)),
      custoFixosValor: Number(custoFixosValor.toFixed(2)),
      custoFixosPctValor: Number(custoFixosPctValor.toFixed(2)),
      custoMaoObra: Number(custoMaoObra.toFixed(2)),
      custoTotal: Number(custoTotal.toFixed(2)),
      custoUnitario: Number(custoUnitario.toFixed(2)),
      margemPct: margemLucroPct,
      markup: multiplicador,
      precoMinimo: Number(precoMinimo.toFixed(2)),
      precoCalculado: Number(precoCalculado.toFixed(2)),
      precoSugerido: Number(precoSugerido.toFixed(2)),
      insumos: insumosSelecionados,
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#D4A574', '#C85A6E', '#3D2314', '#FFE8B3'],
    });

    setSucessoSalvar(true);
    setTimeout(() => setSucessoSalvar(false), 3000);
  };

  // Compartilhar orçamento no WhatsApp
  const handleCompartilharOrcamento = () => {
    if (!nome.trim()) return;

    const texto = `🧁 *Orçamento Confeitaria — ${config.nomeConfeitaria || 'Doce Confeitaria'}*

*Produto:* ${nome}
*Rendimento/Porção:* ${rendimento} ${rendimentoUnidade}
*Preço:* ${formatCurrency(precoSugerido || precoCalculado)}

✨ Feito com ingredientes nobres e alta qualidade artesanal!
Entre em contato para encomendar.
📱 WhatsApp: ${config.whatsapp || ''}
${config.chavePix ? `💳 Chave PIX: ${config.chavePix}` : ''}`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header View */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-display text-2xl font-bold tracking-tight"
            style={{ color: currentTheme.textMain }}
          >
            Calculadora de Preço
          </h2>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>
            Precifique com precisão sem ter prejuízo
          </p>
        </div>

        {receitas.length > 0 && (
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) handleCarregarReceita(e.target.value);
              }}
              defaultValue=""
              className="text-xs font-semibold px-3 py-2 rounded-xl border appearance-none pr-8 cursor-pointer shadow-xs"
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.border,
                color: currentTheme.textMain,
              }}
            >
              <option value="" disabled>
                📖 Importar de Receita...
              </option>
              {receitas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
            <BookOpen
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
            />
          </div>
        )}
      </div>

      {/* Parâmetros Atuais Badge */}
      <div
        className="rounded-2xl p-3 border flex items-center justify-between text-xs"
        style={{
          backgroundColor: currentTheme.bgPrimary,
          borderColor: currentTheme.border,
        }}
      >
        <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
          <Clock size={14} className="text-[#D4A574]" />
          Valor Hora: <strong>{formatCurrency(config.horaTrabalho)}</strong>
        </span>
        <span>·</span>
        <span className="text-muted-foreground font-medium">
          Mult. Padrão: <strong>{config.multiplicadorPadrao}x</strong>
        </span>
        <span>·</span>
        <span className="text-muted-foreground font-medium">
          Fixos: <strong>{config.custosFixosPct}%</strong>
        </span>
      </div>

      {/* 1. Informações Básicas do Produto */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <span className="w-6 h-6 rounded-full bg-[#3D2314] text-[#FFF8F0] text-xs flex items-center justify-center font-bold">
            1
          </span>
          Dados do Produto
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: currentTheme.textMain }}>
              Nome do Doce / Produto *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bolo Vulcão de Ninho com Nutella 20cm"
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: currentTheme.bgPrimary,
                borderColor: currentTheme.border,
                color: currentTheme.textMain,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: currentTheme.textMain }}>
                Rendimento (Qtd) *
              </label>
              <input
                type="number"
                min="1"
                value={rendimento}
                onChange={(e) => setRendimento(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: currentTheme.textMain }}>
                Tipo de Rendimento
              </label>
              <select
                value={rendimentoUnidade}
                onChange={(e) => setRendimentoUnidade(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 appearance-none"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              >
                <option value="unidades">Unidades / Docinhos</option>
                <option value="bolo">1 Bolo / Torta</option>
                <option value="fatias">Fatias</option>
                <option value="potes">Potes / Copos</option>
                <option value="caixas">Caixas</option>
                <option value="kg">Quilogramas (kg)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: currentTheme.textMain }}>
              Tempo total de Trabalho (Horas) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.1"
                step="0.25"
                value={tempoHoras}
                onChange={(e) => setTempoHoras(Math.max(0.1, parseFloat(e.target.value) || 0.5))}
                className="w-32 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              />
              <span className="text-xs text-muted-foreground">
                = <strong>{formatCurrency(custoMaoObra)}</strong> de mão de obra (
                {tempoHoras}h × {formatCurrency(config.horaTrabalho)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Insumos & Ingredientes */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
            <span className="w-6 h-6 rounded-full bg-[#3D2314] text-[#FFF8F0] text-xs flex items-center justify-center font-bold">
              2
            </span>
            Insumos & Ingredientes Utilizados
          </h3>
          <span className="text-xs font-bold text-[#C85A6E]">
            Total: {formatCurrency(custoInsumosBruto)}
          </span>
        </div>

        {/* Lista de Insumos Adicionados */}
        {insumosSelecionados.length > 0 && (
          <div className="space-y-2">
            {insumosSelecionados.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl border"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                }}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-medium truncate" style={{ color: currentTheme.textMain }}>
                    {item.nome}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: currentTheme.primary }}>
                    {formatCurrency(item.custo)}
                  </span>
                  <button
                    onClick={() => handleRemoverInsumo(item.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                    title="Remover insumo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Adicionar da Despensa */}
        {insumos.length > 0 && (
          <div
            className="p-4 rounded-2xl border space-y-2.5"
            style={{
              backgroundColor: currentTheme.bgPrimary + '80',
              borderColor: currentTheme.border,
            }}
          >
            <p className="text-xs font-semibold" style={{ color: currentTheme.textMain }}>
              📦 Puxar do Estoque de Insumos:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={despensaInsumoId}
                onChange={(e) => setDespensaInsumoId(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 appearance-none"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              >
                <option value="">Selecione um insumo cadastrado...</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} — {formatCurrency(i.precoAtual)} / {i.unidade}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={despensaQtd}
                  onChange={(e) => setDespensaQtd(e.target.value)}
                  placeholder="Qtd"
                  className="w-24 px-3 py-2.5 rounded-xl border text-sm text-center focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: currentTheme.cardBg,
                    borderColor: currentTheme.border,
                    color: currentTheme.textMain,
                  }}
                />
                <button
                  onClick={handleAddInsumoDespensa}
                  disabled={!despensaInsumoId}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-40 transition cursor-pointer"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Adicionar Insumo Manual Avulso */}
        <div
          className="p-4 rounded-2xl border space-y-2.5"
          style={{
            backgroundColor: currentTheme.bgPrimary + '40',
            borderColor: currentTheme.border,
          }}
        >
          <p className="text-xs font-semibold" style={{ color: currentTheme.textMain }}>
            ✏️ Adicionar Insumo Avulso Manual:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={manualNome}
              onChange={(e) => setManualNome(e.target.value)}
              placeholder="Nome (Ex: Morangos frescos 250g)"
              className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.border,
                color: currentTheme.textMain,
              }}
            />
            <input
              type="number"
              step="0.10"
              min="0"
              value={manualCusto || ''}
              onChange={(e) => setManualCusto(parseFloat(e.target.value) || 0)}
              placeholder="Custo Pago R$"
              className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.border,
                color: currentTheme.textMain,
              }}
            />
            <button
              onClick={handleAddInsumoManual}
              disabled={!manualNome.trim() || manualCusto <= 0}
              className="py-2.5 px-4 rounded-xl border text-xs font-bold transition hover:bg-white active:scale-95 disabled:opacity-40 cursor-pointer"
              style={{
                borderColor: currentTheme.border,
                color: currentTheme.textMain,
              }}
            >
              + Insumo Avulso
            </button>
          </div>
        </div>
      </div>

      {/* 3. Margem e Multiplicador */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <span className="w-6 h-6 rounded-full bg-[#3D2314] text-[#FFF8F0] text-xs flex items-center justify-center font-bold">
            3
          </span>
          Margem de Lucro & Multiplicador
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label className="font-semibold" style={{ color: currentTheme.textMain }}>
                Margem de Lucro Desejada
              </label>
              <span className="font-bold text-[#2E7D32]">{margemLucroPct}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={margemLucroPct}
              onChange={(e) => setMargemLucroPct(parseInt(e.target.value))}
              className="w-full accent-[#C85A6E] cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Para produtos artesanais, recomenda-se de 60% a 120%.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label className="font-semibold" style={{ color: currentTheme.textMain }}>
                Multiplicador Tradicional (Markup)
              </label>
              <span className="font-bold text-[#D4A574]">{multiplicador.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0"
              max="5.0"
              step="0.1"
              value={multiplicador}
              onChange={(e) => setMultiplicador(parseFloat(e.target.value))}
              className="w-full accent-[#D4A574] cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Regra clássica de confeitaria (Custo × 3 para cobrir insumo + custos + lucro).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Resultado & Ficha de Precificação */}
      {custoTotal > 0 && (
        <div
          className="rounded-3xl p-6 border shadow-lg text-[#FFF8F0] relative overflow-hidden animate-in fade-in duration-300"
          style={{
            backgroundColor: currentTheme.primary,
            borderColor: currentTheme.border,
          }}
        >
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-white/20">
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Ficha de Precificação
              </h3>
              <p className="text-xs text-[#F5D8C3]">
                {nome || 'Produto sem título'} · Rende {rendimento} {rendimentoUnidade}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#D4A574]/30 border border-[#D4A574]/50 text-xs font-bold text-[#FFE8B3]">
              Calculado
            </span>
          </div>

          {/* Breakdown dos custos */}
          <div className="space-y-2 text-xs mb-5 bg-black/20 rounded-2xl p-4 border border-white/10">
            <div className="flex justify-between">
              <span className="text-[#F5D8C3]">Insumos + Quebra ({margemDesperdicioPct}%):</span>
              <span className="font-semibold text-white">{formatCurrency(custoInsumosComPerda)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F5D8C3]">Custos Fixos (% e R$ embalagem):</span>
              <span className="font-semibold text-white">
                {formatCurrency(custoFixosPctValor + custoFixosValor)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F5D8C3]">Mão de Obra ({tempoHoras}h):</span>
              <span className="font-semibold text-white">{formatCurrency(custoMaoObra)}</span>
            </div>
            <div className="border-t border-white/20 pt-2 flex justify-between font-bold text-sm text-white">
              <span>CUSTO TOTAL DA RECEITA:</span>
              <span>{formatCurrency(custoTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#FFE8B3] font-semibold">
              <span>Custo Real por Unidade:</span>
              <span>{formatCurrency(custoUnitario)}</span>
            </div>
          </div>

          {/* Comparativo dos 3 Preços de Venda */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {/* 1. Preço Mínimo */}
            <div className="rounded-2xl p-3 bg-white/10 border border-white/15 text-center">
              <span className="text-[10px] text-[#F5D8C3] font-medium block">
                Preço Mínimo
              </span>
              <p className="font-display font-bold text-base text-white mt-1">
                {formatCurrency(precoMinimo)}
              </p>
              <span className="text-[9px] text-[#F5D8C3]/80 mt-0.5 block">
                Ponto crítico (+35%)
              </span>
            </div>

            {/* 2. Preço com Margem */}
            <div className="rounded-2xl p-3 bg-white/15 border border-white/25 text-center">
              <span className="text-[10px] text-[#FFE8B3] font-semibold block">
                Com Margem ({margemLucroPct}%)
              </span>
              <p className="font-display font-bold text-lg text-white mt-1">
                {formatCurrency(precoCalculado)}
              </p>
              <span className="text-[9px] text-[#FFE8B3] mt-0.5 block">
                Recomendado
              </span>
            </div>

            {/* 3. Preço Sugerido (3x) */}
            <div className="rounded-2xl p-3 bg-[#D4A574]/30 border-2 border-[#D4A574] text-center shadow-sm">
              <span className="text-[10px] text-white font-bold block">
                Sugerido ({multiplicador}x)
              </span>
              <p className="font-display font-bold text-lg text-white mt-1">
                {formatCurrency(precoSugerido)}
              </p>
              <span className="text-[9px] text-white/90 font-medium mt-0.5 block">
                Lucro: {formatCurrency(lucroUnitarioSugerido)}/un
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSalvarProduto}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#D4A574] hover:bg-[#C58D37] text-[#28140B] font-bold text-sm shadow-md active:scale-95 transition cursor-pointer"
            >
              <Save size={18} />
              {sucessoSalvar ? '✓ Salvo no Cardápio!' : 'Salvar no Cardápio'}
            </button>

            <button
              onClick={handleCompartilharOrcamento}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm border border-white/30 active:scale-95 transition cursor-pointer"
            >
              <Share2 size={18} />
              Enviar Orçamento (WhatsApp)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
