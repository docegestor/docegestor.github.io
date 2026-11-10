import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  DollarSign,
  TrendingUp,
  HelpCircle,
  Smartphone,
  ExternalLink,
  Wallet,
  Sparkles,
  Gift,
  ArrowRight,
  RefreshCw,
  Award,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import {
  getStoredAuth,
  obterDadosAfiliado,
  salvarPixAfiliado,
  AfiliadoData,
} from '../services/authService';
import { DEFAULT_SCRIPT_CONFIG } from '../services/docegestorBackendScript';

interface AfiliadosViewProps {
  onNavigate?: (tab: string, extra?: any) => void;
}

export const AfiliadosView: React.FC<AfiliadosViewProps> = ({ onNavigate }) => {
  const { config, currentTheme } = useApp();
  const session = getStoredAuth();

  const scriptUrl = config.googleScriptUrl || '';
  const userIdentifier = session?.ref_code || session?.email?.split('@')[0] || config.nomeResponsavel?.toLowerCase().replace(/\s+/g, '') || 'minhaconfeitaria';

  const [copiouLink, setCopiouLink] = useState(false);
  const [copiouChave, setCopiouChave] = useState(false);
  const [chavePixInput, setChavePixInput] = useState(config.chavePix || '');
  const [salvandoPix, setSalvandoPix] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [dadosAfiliado, setDadosAfiliado] = useState<AfiliadoData>({
    ok: true,
    username: userIdentifier,
    email: session?.email || config.nomeResponsavel || 'usuario@docegestor.com',
    nome: session?.nome || config.nomeResponsavel || 'Confeiteira(o)',
    chave_pix: config.chavePix || '',
    total_vendas: 0,
    saldo: 0,
    comissao_unitaria: DEFAULT_SCRIPT_CONFIG.COMISSAO_REVENDEDOR,
    minimo_saque: DEFAULT_SCRIPT_CONFIG.VALOR_MINIMO_SAQUE,
    pode_sacar: false,
    link: `https://docegestor.pages.dev/?ref=${userIdentifier}`,
  });

  // URL base dinâmica
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?ref=${userIdentifier}`;
    }
    return `https://docegestor.pages.dev/?ref=${userIdentifier}`;
  };

  const linkIndicacao = getBaseUrl();

  // Buscar dados em tempo real se houver URL do Google Apps Script
  const carregarDadosNuvem = async () => {
    if (!scriptUrl) return;
    setCarregandoDados(true);
    try {
      const res = await obterDadosAfiliado(scriptUrl, userIdentifier);
      if (res && res.ok) {
        setDadosAfiliado((prev) => ({
          ...prev,
          total_vendas: res.total_vendas,
          saldo: res.saldo,
          chave_pix: res.chave_pix || prev.chave_pix,
          pode_sacar: res.pode_sacar,
        }));
        if (res.chave_pix) setChavePixInput(res.chave_pix);
      }
    } catch (e) {
      console.warn('Não foi possível sincronizar dados de afiliado', e);
    } finally {
      setCarregandoDados(false);
    }
  };

  useEffect(() => {
    carregarDadosNuvem();
  }, [scriptUrl]);

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkIndicacao);
      setCopiouLink(true);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
      setTimeout(() => setCopiouLink(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = linkIndicacao;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiouLink(true);
      setTimeout(() => setCopiouLink(false), 3000);
    }
  };

  const handleSalvarPix = async () => {
    if (!chavePixInput.trim()) return;
    setSalvandoPix(true);
    setFeedbackMsg(null);
    try {
      if (scriptUrl) {
        await salvarPixAfiliado(scriptUrl, userIdentifier, chavePixInput.trim());
      }
      setDadosAfiliado((prev) => ({ ...prev, chave_pix: chavePixInput.trim() }));
      setFeedbackMsg({ tipo: 'sucesso', texto: 'Chave PIX atualizada com sucesso!' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e: any) {
      setFeedbackMsg({ tipo: 'erro', texto: e.message || 'Erro ao salvar PIX' });
    } finally {
      setSalvandoPix(false);
    }
  };

  const handleCompartilharWhatsApp = () => {
    const texto = encodeURIComponent(
      `🎂 Olá! Conhece o DoceGestor? É o aplicativo definitivo para quem trabalha com doces, bolos e confeitaria!\n\n` +
      `✨ Ele calcula o preço exato de cada receita automaticamente, controla seus custos de gás e embalagens, organiza suas encomendas e gera orçamentos profissionais no WhatsApp!\n\n` +
      `Aproveite para garantir seu acesso vitalício aqui no meu link exclusivo:\n` +
      `${linkIndicacao}`
    );
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  const handleSolicitarSaque = () => {
    const mensagem = encodeURIComponent(
      `Olá Saulo! Solicitação de Saque DoceGestor:\n` +
      `• Afiliado(a): ${dadosAfiliado.nome} (@${dadosAfiliado.username})\n` +
      `• E-mail: ${dadosAfiliado.email}\n` +
      `• Total de Vendas: ${dadosAfiliado.total_vendas} vendas\n` +
      `• Saldo a Receber: R$ ${dadosAfiliado.saldo.toFixed(2).replace('.', ',')}\n` +
      `• Minha Chave PIX: ${chavePixInput.trim() || dadosAfiliado.chave_pix || 'A informar'}\n\n` +
      `Por favor, realize o envio do meu Pix!`
    );
    window.open(`https://wa.me/${DEFAULT_SCRIPT_CONFIG.WHATSAPP_SAQUE}?text=${mensagem}`, '_blank');
  };

  const pctProgresso = Math.min(
    100,
    Math.round((dadosAfiliado.saldo / dadosAfiliado.minimo_saque) * 100)
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: currentTheme.textMain }}
          >
            <Gift size={26} className="text-[#C85A6E]" />
            Indicação & Revenda
          </h2>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>
            Ganhe <strong className="text-[#2E7D32]">R$ 29,90 no PIX</strong> por cada confeiteira que indicar!
          </p>
        </div>

        <button
          onClick={carregarDadosNuvem}
          disabled={carregandoDados}
          className="p-2 rounded-xl border transition hover:bg-black/5 active:scale-95 cursor-pointer text-xs flex items-center gap-1.5"
          style={{ borderColor: currentTheme.border, color: currentTheme.textMain }}
          title="Atualizar saldo"
        >
          <RefreshCw size={14} className={carregandoDados ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Card Destaque: Ganhe R$ 29,90 por venda */}
      <div
        className="rounded-3xl p-6 border shadow-sm relative overflow-hidden space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Programa de Afiliados DoceGestor
            </span>
            <h3 className="font-display text-xl font-bold mt-2" style={{ color: currentTheme.textMain }}>
              Seu Link Exclusivo de Indicação
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compartilhe com amigas confeiteiras, alunas ou em grupos de confeitaria. O comprador paga R$ 49,99 e você recebe <strong className="text-foreground">R$ 29,90</strong> direto no seu Pix!
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/5 border text-center shrink-0">
            <span className="text-[11px] text-muted-foreground block">Sua Comissão</span>
            <strong className="text-2xl font-display text-[#2E7D32]">
              R$ 29,90
            </strong>
            <span className="text-[10px] text-muted-foreground block">por venda</span>
          </div>
        </div>

        {/* Campo com Link e Ações Rápidas */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={linkIndicacao}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono bg-white focus:outline-none select-all"
              style={{ borderColor: currentTheme.border, color: currentTheme.textMain }}
            />
            <button
              onClick={handleCopiarLink}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: copiouLink ? '#2E7D32' : currentTheme.primary }}
            >
              {copiouLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiouLink ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>

          <button
            onClick={handleCompartilharWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20BA59] text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Share2 size={16} />
            <span>Compartilhar Mensagem Pronta no WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Painel Financeiro de Comissões e Saque */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base flex items-center gap-2" style={{ color: currentTheme.textMain }}>
            <Wallet size={18} className="text-[#D4A574]" />
            Seu Saldo & Solicitação de Saque
          </h3>
          <span className="text-xs font-semibold text-muted-foreground">
            Saque mínimo: R$ {dadosAfiliado.minimo_saque.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-black/5 border border-border text-center">
            <span className="text-[11px] text-muted-foreground block">Vendas Realizadas</span>
            <strong className="text-2xl font-display" style={{ color: currentTheme.textMain }}>
              {dadosAfiliado.total_vendas}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/5 border border-border text-center">
            <span className="text-[11px] text-muted-foreground block">Saldo Acumulado</span>
            <strong className="text-2xl font-display text-[#2E7D32]">
              R$ {dadosAfiliado.saldo.toFixed(2).replace('.', ',')}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/5 border border-border text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] text-muted-foreground block">Status de Saque</span>
            <strong
              className={`text-sm font-bold block mt-1 ${
                dadosAfiliado.pode_sacar ? 'text-[#2E7D32]' : 'text-[#C85A6E]'
              }`}
            >
              {dadosAfiliado.pode_sacar ? '✓ Liberado para Saque' : `Falta R$ ${(Math.max(0, dadosAfiliado.minimo_saque - dadosAfiliado.saldo)).toFixed(2).replace('.', ',')}`}
            </strong>
          </div>
        </div>

        {/* Barra de Progresso até o Saque */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Progresso da meta de saque (R$ 150,00)</span>
            <span>{pctProgresso}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pctProgresso}%`,
                backgroundColor: pctProgresso >= 100 ? '#2E7D32' : currentTheme.primary,
              }}
            />
          </div>
        </div>

        {/* Configuração da Chave PIX do Afiliado */}
        <div className="p-4 rounded-2xl bg-black/5 border border-border space-y-2.5">
          <label className="text-xs font-bold block" style={{ color: currentTheme.textMain }}>
            Sua Chave PIX para Receber Comissões:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={chavePixInput}
              onChange={(e) => setChavePixInput(e.target.value)}
              placeholder="Ex: CPF, celular, e-mail ou chave aleatória"
              className="flex-1 px-3.5 py-2 rounded-xl border text-xs bg-white focus:outline-none"
              style={{ borderColor: currentTheme.border }}
            />
            <button
              onClick={handleSalvarPix}
              disabled={salvandoPix || !chavePixInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-95 disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: currentTheme.primary }}
            >
              {salvandoPix ? 'Salvando...' : 'Salvar PIX'}
            </button>
          </div>
          {feedbackMsg && (
            <p className={`text-xs font-medium ${feedbackMsg.tipo === 'sucesso' ? 'text-emerald-700' : 'text-red-600'}`}>
              {feedbackMsg.texto}
            </p>
          )}
        </div>

        {/* Botão de Solicitação de Saque no WhatsApp */}
        <button
          onClick={handleSolicitarSaque}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#2E7D32] hover:bg-[#256829] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
        >
          <Smartphone size={16} />
          <span>Solicitar Saque no WhatsApp (22) 98819-5993</span>
        </button>
      </div>

      {/* Dicas Estratégicas para Bater a Meta Rapidamente */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-3"
        style={{
          backgroundColor: currentTheme.bgPrimary,
          borderColor: currentTheme.border,
        }}
      >
        <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <Sparkles size={16} className="text-[#D4A574]" />
          Como fazer 5 vendas e sacar R$ 150,00 esta semana:
        </h4>

        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            1. <strong>Grupos de Confeitaria no WhatsApp e Facebook:</strong> Muitas confeiteiras têm dificuldade em saber quanto cobrar no cento de doces ou no bolo de aniversário. Mostre como o app calcula em segundos!
          </p>
          <p>
            2. <strong>Stories do Instagram:</strong> Faça um vídeo rápido calculando o preço de um brigadeiro gourmet ou bolo caseiro e coloque seu link na figurinha de Link!
          </p>
          <p>
            3. <strong>Venda Direta:</strong> Ofereça para colegas que também vendem doces no pote, brownies, cookies ou bolos. Com apenas 5 pessoas você já garante <strong>R$ 149,50</strong> líquidos direto na sua conta!
          </p>
        </div>
      </div>
    </div>
  );
};
