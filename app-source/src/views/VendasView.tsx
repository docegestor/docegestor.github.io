import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  Clock3,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Share2,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Venda, StatusPedido, ItemVenda } from '../types';

interface VendasViewProps {
  abrirNovaVenda?: boolean;
  produtoPreSelecionado?: string;
  onNavigate?: (tab: string, extra?: any) => void;
}

export const VendasView: React.FC<VendasViewProps> = ({
  abrirNovaVenda = false,
  produtoPreSelecionado,
  onNavigate,
}) => {
  const { config, produtos, vendas, addVenda, updateVendaStatus, removeVenda, currentTheme } =
    useApp();

  const [mostrarForm, setMostrarForm] = useState(abrirNovaVenda || !!produtoPreSelecionado);
  const [tipo, setTipo] = useState<'pronta_entrega' | 'encomenda'>('pronta_entrega');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteWhatsapp, setClienteWhatsapp] = useState('');
  const [dataEntrega, setDataEntrega] = useState(new Date().toISOString().split('T')[0]);
  const [horaEntrega, setHoraEntrega] = useState('14:00');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'outro'>('pix');
  const [observacoes, setObservacoes] = useState('');

  // Itens da venda
  const [itensCarrinho, setItensCarrinho] = useState<ItemVenda[]>(() => {
    if (produtoPreSelecionado) {
      const p = produtos.find((item) => item.id === produtoPreSelecionado);
      if (p) {
        return [
          {
            produtoId: p.id,
            produtoNome: p.nome,
            quantidade: 1,
            valorUnitario: p.precoSugerido || p.precoCalculado,
            valorTotal: p.precoSugerido || p.precoCalculado,
            custoUnitario: p.custoUnitario,
          },
        ];
      }
    }
    return [];
  });

  // Seletor para adicionar item
  const [prodSelecionadoId, setProdSelecionadoId] = useState('');
  const [prodQtd, setProdQtd] = useState(1);
  const [prodPrecoUnit, setProdPrecoUnit] = useState<number>(0);
  const [valorSinal, setValorSinal] = useState<number>(0);

  // Filtro de listagem
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [expandedVendaId, setExpandedVendaId] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Totais do carrinho atual
  const valorTotalCarrinho = itensCarrinho.reduce((acc, i) => acc + i.valorTotal, 0);
  const custoTotalCarrinho = itensCarrinho.reduce((acc, i) => acc + i.custoUnitario * i.quantidade, 0);
  const lucroTotalCarrinho = valorTotalCarrinho - custoTotalCarrinho;
  const valorRestanteCalculado = Math.max(0, valorTotalCarrinho - valorSinal);

  const handleAddItemAoCarrinho = () => {
    const prod = produtos.find((p) => p.id === prodSelecionadoId);
    if (!prod || prodQtd <= 0) return;

    const precoFinal = prodPrecoUnit > 0 ? prodPrecoUnit : prod.precoSugerido || prod.precoCalculado;
    const novoItem: ItemVenda = {
      produtoId: prod.id,
      produtoNome: prod.nome,
      quantidade: prodQtd,
      valorUnitario: precoFinal,
      valorTotal: precoFinal * prodQtd,
      custoUnitario: prod.custoUnitario,
    };

    setItensCarrinho((prev) => [...prev, novoItem]);
    setProdSelecionadoId('');
    setProdQtd(1);
    setProdPrecoUnit(0);
  };

  const handleRemoverItemCarrinho = (index: number) => {
    setItensCarrinho((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSalvarVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (itensCarrinho.length === 0) {
      alert('Adicione pelo menos 1 produto à venda.');
      return;
    }

    addVenda({
      tipo,
      clienteNome: clienteNome.trim() || (tipo === 'pronta_entrega' ? 'Cliente Balcão' : 'Cliente'),
      clienteWhatsapp: clienteWhatsapp.replace(/\D/g, ''),
      dataVenda: new Date().toISOString().split('T')[0],
      dataEntrega: tipo === 'encomenda' ? dataEntrega : undefined,
      horaEntrega: tipo === 'encomenda' ? horaEntrega : undefined,
      itens: itensCarrinho,
      valorTotal: valorTotalCarrinho,
      valorEntrada: tipo === 'encomenda' ? valorSinal : valorTotalCarrinho,
      valorRestante: tipo === 'encomenda' ? valorRestanteCalculado : 0,
      custoTotalEstimado: custoTotalCarrinho,
      lucroEstimado: lucroTotalCarrinho,
      formaPagamento,
      status: tipo === 'encomenda' ? 'pendente' : 'entregue',
      observacoes: observacoes.trim(),
    });

    confetti({
      particleCount: 70,
      spread: 50,
      origin: { y: 0.8 },
    });

    // Resetar formulário
    setItensCarrinho([]);
    setClienteNome('');
    setClienteWhatsapp('');
    setValorSinal(0);
    setObservacoes('');
    setMostrarForm(false);
  };

  // Gerar mensagem de WhatsApp para o cliente
  const handleEnviarWhatsApp = (venda: Venda) => {
    const itensTexto = venda.itens
      .map((i) => `• ${i.quantidade}x ${i.produtoNome} — ${formatCurrency(i.valorTotal)}`)
      .join('\n');

    let msg = `🧁 *Confirmação de Pedido — ${config.nomeConfeitaria || 'Doce Confeitaria'}*\n\n`;
    msg += `Olá, *${venda.clienteNome}*! Seu pedido foi registrado com sucesso:\n\n`;
    msg += `*Itens:*\n${itensTexto}\n\n`;
    msg += `*Valor Total:* ${formatCurrency(venda.valorTotal)}\n`;

    if (venda.tipo === 'encomenda') {
      msg += `*Sinal Pago:* ${formatCurrency(venda.valorEntrada)}\n`;
      msg += `*Restante na Entrega:* ${formatCurrency(venda.valorRestante)}\n`;
      if (venda.dataEntrega) {
        msg += `📅 *Data de Entrega:* ${venda.dataEntrega.split('-').reverse().join('/')}`;
        if (venda.horaEntrega) msg += ` às ${venda.horaEntrega}`;
        msg += '\n';
      }
    }

    if (config.chavePix) {
      msg += `\n💳 *Chave PIX para pagamento:* ${config.chavePix}\n`;
    }

    msg += `\nMuito obrigado pelo carinho e preferência! ✨`;

    const foneLimpo = (venda.clienteWhatsapp || '').replace(/\D/g, '');
    const url = foneLimpo
      ? `https://wa.me/55${foneLimpo}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  // Filtragem
  const vendasFiltradas = vendas.filter((v) => {
    if (filtroStatus === 'todos') return true;
    if (filtroStatus === 'pendentes')
      return v.status === 'pendente' || v.status === 'em_producao';
    if (filtroStatus === 'entregues') return v.status === 'entregue';
    return v.status === filtroStatus;
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
            Vendas & Encomendas
          </h2>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>
            Registre pedidos e envie comprovantes pelo WhatsApp
          </p>
        </div>

        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Plus size={16} />
          {mostrarForm ? 'Fechar' : 'Nova Venda'}
        </button>
      </div>

      {/* Formulário Nova Venda / Encomenda */}
      {mostrarForm && (
        <form
          onSubmit={handleSalvarVenda}
          className="rounded-3xl p-5 border shadow-md space-y-4 animate-in fade-in duration-200"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: currentTheme.border,
          }}
        >
          <h3 className="font-display font-bold text-base" style={{ color: currentTheme.textMain }}>
            Registrar Nova Venda
          </h3>

          {/* Seletor Tipo: Pronta-Entrega vs Encomenda */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/5 border border-border">
            <button
              type="button"
              onClick={() => setTipo('pronta_entrega')}
              className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                tipo === 'pronta_entrega'
                  ? 'bg-white shadow-xs text-[#3D2314]'
                  : 'text-muted-foreground'
              }`}
            >
              🛍️ Pronta Entrega
            </button>
            <button
              type="button"
              onClick={() => setTipo('encomenda')}
              className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                tipo === 'encomenda'
                  ? 'bg-white shadow-xs text-[#3D2314]'
                  : 'text-muted-foreground'
              }`}
            >
              📅 Encomenda Futura
            </button>
          </div>

          {/* Dados do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: currentTheme.textMain }}>
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Ex: Ana Paula"
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
                WhatsApp do Cliente (com DDD)
              </label>
              <input
                type="tel"
                value={clienteWhatsapp}
                onChange={(e) => setClienteWhatsapp(e.target.value)}
                placeholder="Ex: 11987654321"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              />
            </div>
          </div>

          {/* Campos específicos de Encomenda */}
          {tipo === 'encomenda' && (
            <div
              className="p-4 rounded-2xl border space-y-3"
              style={{
                backgroundColor: currentTheme.bgPrimary + '60',
                borderColor: currentTheme.border,
              }}
            >
              <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: currentTheme.textMain }}>
                <Calendar size={14} className="text-[#C85A6E]" />
                Detalhes da Entrega & Sinal
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium block mb-1">Data de Entrega</label>
                  <input
                    type="date"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-white focus:outline-none"
                    style={{ borderColor: currentTheme.border }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium block mb-1">Horário</label>
                  <input
                    type="time"
                    value={horaEntrega}
                    onChange={(e) => setHoraEntrega(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-white focus:outline-none"
                    style={{ borderColor: currentTheme.border }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium block mb-1">Sinal Pago (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={valorSinal || ''}
                    onChange={(e) => setValorSinal(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 50.00"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-white focus:outline-none"
                    style={{ borderColor: currentTheme.border }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Adicionar Produtos ao Pedido */}
          <div className="space-y-3 border-t pt-3 border-border">
            <label className="text-xs font-bold block" style={{ color: currentTheme.textMain }}>
              Adicionar Produtos ao Pedido:
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={prodSelecionadoId}
                onChange={(e) => {
                  setProdSelecionadoId(e.target.value);
                  const p = produtos.find((item) => item.id === e.target.value);
                  if (p) setProdPrecoUnit(p.precoSugerido || p.precoCalculado);
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none appearance-none"
                style={{
                  backgroundColor: currentTheme.bgPrimary,
                  borderColor: currentTheme.border,
                  color: currentTheme.textMain,
                }}
              >
                <option value="">Selecione um produto do cardápio...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {formatCurrency(p.precoSugerido || p.precoCalculado)}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={prodQtd}
                  onChange={(e) => setProdQtd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-2.5 rounded-xl border text-sm text-center focus:outline-none"
                  style={{
                    backgroundColor: currentTheme.bgPrimary,
                    borderColor: currentTheme.border,
                    color: currentTheme.textMain,
                  }}
                  title="Quantidade"
                />
                <button
                  type="button"
                  onClick={handleAddItemAoCarrinho}
                  disabled={!prodSelecionadoId}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs disabled:opacity-40 transition cursor-pointer"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  + Adicionar
                </button>
              </div>
            </div>

            {/* Itens adicionados */}
            {itensCarrinho.length > 0 ? (
              <div className="space-y-2 mt-2">
                {itensCarrinho.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl border"
                    style={{
                      backgroundColor: currentTheme.bgPrimary,
                      borderColor: currentTheme.border,
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: currentTheme.textMain }}>
                        {item.quantidade}x {item.produtoNome}
                      </p>
                      <p className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                        {formatCurrency(item.valorUnitario)} cada · Custo: {formatCurrency(item.custoUnitario)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: currentTheme.primary }}>
                        {formatCurrency(item.valorTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoverItemCarrinho(idx)}
                        className="p-1 rounded-lg text-red-400 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-1">
                Nenhum produto adicionado à venda ainda.
              </p>
            )}
          </div>

          {/* Resumo da Venda */}
          {itensCarrinho.length > 0 && (
            <div
              className="p-4 rounded-2xl border space-y-1.5 text-xs"
              style={{
                backgroundColor: currentTheme.bgPrimary,
                borderColor: currentTheme.border,
              }}
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Total do Pedido:</span>
                <span className="font-bold text-sm" style={{ color: currentTheme.textMain }}>
                  {formatCurrency(valorTotalCarrinho)}
                </span>
              </div>
              {tipo === 'encomenda' && valorSinal > 0 && (
                <>
                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Sinal / Entrada paga:</span>
                    <span className="font-semibold">- {formatCurrency(valorSinal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-800">
                    <span>Restante a Pagar na Entrega:</span>
                    <span>{formatCurrency(valorRestanteCalculado)}</span>
                  </div>
                </>
              )}
              <div className="border-t border-border pt-1.5 flex justify-between font-bold text-[#2E7D32]">
                <span>Lucro Líquido Estimado:</span>
                <span>{formatCurrency(lucroTotalCarrinho)}</span>
              </div>
            </div>
          )}

          {/* Botões de Ação do Form */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="flex-1 py-3 rounded-2xl border text-xs font-semibold cursor-pointer transition hover:bg-black/5"
              style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={itensCarrinho.length === 0}
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-white shadow-sm transition disabled:opacity-40 hover:opacity-90 active:scale-95 cursor-pointer"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Confirmar e Salvar Venda
            </button>
          </div>
        </form>
      )}

      {/* Filtros de Vendas */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'todos', label: 'Todas as Vendas' },
          { id: 'pendentes', label: '⏳ Encomendas Abertas' },
          { id: 'entregues', label: '✅ Entregues' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltroStatus(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filtroStatus === f.id
                ? 'bg-[#3D2314] text-[#FFF8F0] shadow-xs'
                : 'bg-white border text-[#8C6A54] hover:bg-black/5'
            }`}
            style={{ borderColor: currentTheme.border }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Vendas */}
      <div className="space-y-3">
        {vendasFiltradas.length === 0 ? (
          <div
            className="rounded-3xl p-8 border text-center shadow-sm"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <span className="text-4xl block mb-2">🛍️</span>
            <p className="font-semibold text-sm" style={{ color: currentTheme.textMain }}>
              Nenhuma venda encontrada
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              Toque em "Nova Venda" acima para registrar sua primeira venda ou encomenda!
            </p>
          </div>
        ) : (
          vendasFiltradas.map((venda) => {
            const isExpanded = expandedVendaId === venda.id;

            const statusColors: Record<StatusPedido, { bg: string; text: string; label: string }> = {
              pendente: { bg: '#FEF3C7', text: '#B45309', label: '⏳ Pendente' },
              em_producao: { bg: '#E0E7FF', text: '#3730A3', label: '👩‍🍳 Em Produção' },
              pronto: { bg: '#E0F2FE', text: '#0369A1', label: '📦 Pronto' },
              entregue: { bg: '#E8F5E9', text: '#2E7D32', label: '✅ Entregue' },
              cancelado: { bg: '#FEE2E2', text: '#B91C1C', label: '❌ Cancelado' },
            };

            const st = statusColors[venda.status] || statusColors.pendente;

            return (
              <div
                key={venda.id}
                className="rounded-3xl border shadow-sm overflow-hidden transition"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.border,
                }}
              >
                {/* Main Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base" style={{ color: currentTheme.textMain }}>
                          {venda.clienteNome}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: st.bg, color: st.text }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {venda.itens.map((it) => `${it.quantidade}x ${it.produtoNome}`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-display font-bold text-lg" style={{ color: currentTheme.textMain }}>
                        {formatCurrency(venda.valorTotal)}
                      </p>
                      <p className="text-[10px] text-[#2E7D32] font-semibold">
                        Lucro: +{formatCurrency(venda.lucroEstimado)}
                      </p>
                    </div>
                  </div>

                  {/* Delivery / Date Info */}
                  {venda.tipo === 'encomenda' && venda.dataEntrega && (
                    <div className="flex items-center gap-2 text-xs text-[#C85A6E] font-medium bg-[#FFF0F5] px-3 py-1.5 rounded-xl mb-3 border border-[#F6D5E1]">
                      <Clock size={13} />
                      <span>
                        Entrega: {venda.dataEntrega.split('-').reverse().join('/')}
                        {venda.horaEntrega ? ` às ${venda.horaEntrega}` : ''}
                      </span>
                      {venda.valorRestante > 0 && (
                        <span className="ml-auto font-bold text-amber-900">
                          Resta: {formatCurrency(venda.valorRestante)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-border mt-3">
                    {/* Status Changer */}
                    <div className="flex items-center gap-1">
                      <select
                        value={venda.status}
                        onChange={(e) =>
                          updateVendaStatus(venda.id, e.target.value as StatusPedido)
                        }
                        className="text-[11px] font-semibold px-2 py-1 rounded-xl border bg-white focus:outline-none cursor-pointer"
                        style={{ borderColor: currentTheme.border }}
                      >
                        <option value="pendente">⏳ Pendente</option>
                        <option value="em_producao">👩‍🍳 Em Produção</option>
                        <option value="pronto">📦 Pronto</option>
                        <option value="entregue">✅ Entregue</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>
                    </div>

                    {/* WhatsApp & Details Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEnviarWhatsApp(venda)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366]/25 transition cursor-pointer"
                        title="Enviar comprovante no WhatsApp"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => setExpandedVendaId(isExpanded ? null : venda.id)}
                        className="p-1.5 rounded-xl hover:bg-black/5 text-muted-foreground transition cursor-pointer"
                        title="Detalhes da venda"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Remover venda de "${venda.clienteNome}"?`)) {
                            removeVenda(venda.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-red-400 hover:bg-red-50 transition cursor-pointer"
                        title="Excluir venda"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Financial Breakdown */}
                {isExpanded && (
                  <div
                    className="p-4 border-t text-xs space-y-2 animate-in fade-in duration-150"
                    style={{
                      backgroundColor: currentTheme.bgPrimary + '50',
                      borderColor: currentTheme.border,
                    }}
                  >
                    <p className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Detalhamento Financeiro da Venda:
                    </p>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custo dos Produtos Vendidos:</span>
                        <span className="font-medium text-red-600">
                          - {formatCurrency(venda.custoTotalEstimado)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Faturamento Bruto:</span>
                        <span className="font-semibold">{formatCurrency(venda.valorTotal)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border font-bold text-[#2E7D32] text-sm">
                        <span>LUCRO LÍQUIDO DA VENDA:</span>
                        <span>{formatCurrency(venda.lucroEstimado)}</span>
                      </div>
                    </div>

                    {venda.observacoes && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[11px] font-semibold text-muted-foreground">Observações:</p>
                        <p className="text-xs italic text-foreground">{venda.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Lembrete de apoio ao projeto após vendas */}
        {vendas.length > 0 && onNavigate && (
          <div className="pt-3 text-center">
            <button
              onClick={() => onNavigate('config', { scrollToApoio: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-dashed transition hover:opacity-80 active:scale-95 cursor-pointer"
              style={{
                borderColor: '#D4A574',
                color: currentTheme.textMain,
                backgroundColor: currentTheme.cardBg,
              }}
            >
              <span>🧁 Fez uma boa venda? Apoie a evolução do projeto & criação de apps gratuitos 💖</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
