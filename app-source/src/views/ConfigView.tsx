import React, { useState } from 'react';
import {
  Settings,
  Palette,
  Clock,
  DollarSign,
  Download,
  Upload,
  Trash2,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Share2,
  Cloud,
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Heart,
  Gift,
  Coffee,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp, THEMES } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from '../components/PWAInstallModal';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/googleSheetsSync';

type SettingsSection = 'nuvem' | 'apoio' | 'negocio' | 'precificacao' | 'custos' | 'temas' | 'instalacao';

const SETTINGS_SECTIONS = [
  { id: 'negocio', label: 'Sua confeitaria', icon: Sparkles },
  { id: 'precificacao', label: 'Precificação', icon: Clock },
  { id: 'custos', label: 'Custos fixos', icon: DollarSign },
  { id: 'temas', label: 'Temas e cores', icon: Palette },
  { id: 'instalacao', label: 'App instalável', icon: Smartphone },
  { id: 'nuvem', label: 'Nuvem e backup', icon: Cloud },
  { id: 'apoio', label: 'Apoio', icon: Heart },
] as const;

interface ConfigViewProps {
  scrollToApoio?: boolean;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ scrollToApoio = false }) => {
  const {
    config,
    updateConfig,
    addCustoFixo,
    removeCustoFixo,
    setTheme,
    exportBackup,
    importBackup,
    resetToDefaults,
    sincronizarComGoogleSheets,
    restaurarDeGoogleSheets,
    currentTheme,
  } = useApp();

  const { isInstallable, isStandalone, isIOS, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('negocio');

  // Apoio ao Projeto
  const apoioRef = React.useRef<HTMLDivElement>(null);
  const [highlightApoio, setHighlightApoio] = useState(false);
  const [copiouPix, setCopiouPix] = useState(false);

  // States para novo custo fixo
  const [novoFixoNome, setNovoFixoNome] = useState('');
  const [novoFixoValor, setNovoFixoValor] = useState<number>(0);

  // States para Sincronização Google Apps Script / Google Sheets
  const [googleUrl, setGoogleUrl] = useState(config.googleScriptUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [copiouCodigo, setCopiouCodigo] = useState(false);
  const [mostrarGuiaAppsScript, setMostrarGuiaAppsScript] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'sucesso' | 'erro' | 'info'; texto: string } | null>(null);

  // Scroll automático para a área de apoio quando requisitado
  React.useEffect(() => {
    if (scrollToApoio || window.location.hash === '#apoio' || window.location.hash === '#config-apoio') {
      setActiveSection('apoio');
      setTimeout(() => {
        apoioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightApoio(true);
        setTimeout(() => setHighlightApoio(false), 3000);
      }, 150);
    }
  }, [scrollToApoio]);

  // Copiar Chave PIX
  const handleCopiarPix = async () => {
    const linkApoio = 'https://link.mercadopago.com.br/saulomgg';
    try {
      window.open(linkApoio, '_blank', 'noopener,noreferrer');
      setCopiouPix(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      setTimeout(() => setCopiouPix(false), 3500);
    } catch {
      window.location.href = linkApoio;
      setCopiouPix(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      setTimeout(() => setCopiouPix(false), 3500);
    }
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAddFixo = () => {
    if (!novoFixoNome.trim() || novoFixoValor <= 0) return;
    addCustoFixo(novoFixoNome.trim(), novoFixoValor);
    setNovoFixoNome('');
    setNovoFixoValor(0);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackup(content);
        if (ok) {
          alert('✓ Backup importado com sucesso!');
        } else {
          alert('Arquivo de backup inválido ou corrompido.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Instalação PWA Direta no Celular
  const handleInstallClick = async () => {
    if (isInstallable) {
      try {
        const aceito = await install();
        if (aceito) return;
      } catch (err) {
        console.error('Erro ao acionar prompt de instalação:', err);
      }
    }
    setShowInstallModal(true);
  };

  // Copiar o código do Google Apps Script para a área de transferência
  const handleCopiarCodigoAppsScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiouCodigo(true);
      setTimeout(() => setCopiouCodigo(false), 3000);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = GOOGLE_APPS_SCRIPT_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiouCodigo(true);
      setTimeout(() => setCopiouCodigo(false), 3000);
    }
  };

  // Salvar Backup na Planilha Google Sheets via Apps Script
  const handleSalvarNuvem = async () => {
    if (!googleUrl.trim()) {
      setStatusMsg({
        tipo: 'erro',
        texto: 'Por favor, insira a URL do seu App da Web do Google Apps Script antes de sincronizar.',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMsg({ tipo: 'info', texto: 'Enviando dados para sua planilha do Google Sheets...' });

    try {
      const res = await sincronizarComGoogleSheets(googleUrl.trim());
      updateConfig({ googleScriptUrl: googleUrl.trim() });
      setStatusMsg({
        tipo: 'sucesso',
        texto: `✓ Backup salvo com sucesso no Google Sheets em ${res.dataHora || new Date().toLocaleTimeString()}!`,
      });

      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.8 },
      });
    } catch (err: any) {
      setStatusMsg({
        tipo: 'erro',
        texto: `Erro ao sincronizar: ${err.message || 'Verifique a URL e sua conexão.'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Restaurar Backup da Planilha Google Sheets via Apps Script
  const handleRestaurarNuvem = async () => {
    if (!googleUrl.trim()) {
      setStatusMsg({
        tipo: 'erro',
        texto: 'Por favor, insira a URL do seu App da Web do Google Apps Script antes de restaurar.',
      });
      return;
    }

    const confirmar = confirm(
      'Atenção: A restauração substituirá os dados atuais deste aparelho pelos dados salvos na sua planilha do Google Sheets. Deseja continuar?'
    );
    if (!confirmar) return;

    setIsRestoring(true);
    setStatusMsg({ tipo: 'info', texto: 'Buscando backup na sua planilha...' });

    try {
      const res = await restaurarDeGoogleSheets(googleUrl.trim());
      updateConfig({ googleScriptUrl: googleUrl.trim() });
      setStatusMsg({
        tipo: 'sucesso',
        texto: `✓ Dados sincronizados e restaurados com sucesso da planilha (${res.updatedAt || 'recente'})!`,
      });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err: any) {
      setStatusMsg({
        tipo: 'erro',
        texto: `Erro ao restaurar: ${err.message || 'Verifique se há um backup válido na planilha.'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-display text-2xl font-bold tracking-tight"
            style={{ color: currentTheme.textMain }}
          >
            Configurações
          </h2>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>
            Personalize sua confeitaria, valores e sincronização
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold" style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}>
          <ShieldCheck size={13} className="text-emerald-700" />
          <span>Seus dados ficam com você</span>
        </div>
      </div>


      <nav className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Seções de configuração">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const selected = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveSection(section.id)}
              className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors"
              style={{
                backgroundColor: selected ? currentTheme.primary : currentTheme.cardBg,
                borderColor: selected ? currentTheme.primary : currentTheme.border,
                color: selected ? '#FFFFFF' : currentTheme.textMuted,
              }}
            >
              <Icon size={13} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>

      {activeSection === 'nuvem' && <>
      {/* 1. Sincronização & Backup na Nuvem (Google Sheets + Apps Script) */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <FileSpreadsheet size={18} />
              </span>
              <h3 className="text-base font-bold" style={{ color: currentTheme.textMain }}>
                Backup na Nuvem (Google Sheets)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Salve uma cópia na sua planilha do Google Sheets e restaure em outros aparelhos usando a mesma URL.
              O envio e a restauração são iniciados por você, quando quiser.
            </p>
          </div>
        </div>

        {/* Input da URL do Apps Script */}
        <div className="space-y-2">
          <label className="text-xs font-bold block" style={{ color: currentTheme.textMain }}>
            URL do App da Web do Google Apps Script:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 px-3.5 py-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:ring-2 font-mono"
              style={{ borderColor: currentTheme.border, color: currentTheme.textMain }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cole aqui a URL gerada na implantação do Apps Script na sua planilha.
          </p>
        </div>

        {/* Feedback de Status */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium border flex items-center gap-2 ${
              statusMsg.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusMsg.tipo === 'erro'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {statusMsg.tipo === 'sucesso' && <CheckCircle size={15} className="shrink-0" />}
            {statusMsg.tipo === 'erro' && <Info size={15} className="shrink-0" />}
            {statusMsg.tipo === 'info' && <RefreshCw size={15} className="shrink-0 animate-spin" />}
            <span>{statusMsg.texto}</span>
          </div>
        )}

        {/* Botões de Sincronização */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleSalvarNuvem}
            disabled={isSyncing || isRestoring}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#2E7D32] hover:bg-[#256829] text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSyncing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <CloudUpload size={16} />
            )}
            <span>{isSyncing ? 'Sincronizando...' : '☁️ Enviar Backup para Google Sheets'}</span>
          </button>

          <button
            onClick={handleRestaurarNuvem}
            disabled={isSyncing || isRestoring}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-bold transition hover:bg-black/5 active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{
              borderColor: currentTheme.border,
              backgroundColor: currentTheme.bgPrimary,
              color: currentTheme.textMain,
            }}
          >
            {isRestoring ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <CloudDownload size={16} />
            )}
            <span>{isRestoring ? 'Restaurando...' : '📥 Restaurar Dados do Google Sheets'}</span>
          </button>
        </div>

        {/* Última Sincronização */}
        {config.ultimaSincronizacaoNuvem && (
          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border">
            <span>Última sincronização na nuvem:</span>
            <strong className="text-foreground">{config.ultimaSincronizacaoNuvem}</strong>
          </div>
        )}

        {/* Botão para Exibir/Ocultar Instruções e Código */}
        <div className="pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => setMostrarGuiaAppsScript(!mostrarGuiaAppsScript)}
            className="w-full flex items-center justify-between p-3 rounded-2xl border bg-black/5 text-xs font-bold transition hover:bg-black/10 cursor-pointer"
            style={{ borderColor: currentTheme.border, color: currentTheme.textMain }}
          >
            <span className="flex items-center gap-2">
              <HelpCircle size={16} className="text-[#D4A574]" />
              📖 Como Configurar o Google Apps Script (Passo a Passo & Código)
            </span>
            {mostrarGuiaAppsScript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {mostrarGuiaAppsScript && (
            <div
              className="mt-3 p-4 rounded-2xl border space-y-4 text-xs animate-in fade-in duration-200"
              style={{
                backgroundColor: currentTheme.bgPrimary,
                borderColor: currentTheme.border,
              }}
            >
              <div>
                <p className="font-bold text-sm text-foreground mb-1">
                  Guia Rápido: Como Conectar sua Planilha em 2 Minutos
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground mt-2 leading-relaxed">
                  <li>
                    Acesse o Google Sheets (
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-[#2E7D32]"
                    >
                      sheets.new <ExternalLink size={11} className="inline" />
                    </a>
                    ) e crie uma nova planilha vazia com o nome <strong>DoceGestor Backup</strong>.
                  </li>
                  <li>
                    No menu superior da planilha, clique em <strong>Extensões</strong> ➔{' '}
                    <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Apague qualquer código que estiver lá e <strong>cole o código abaixo</strong>.
                  </li>
                  <li>
                    Clique no botão azul <strong>"Implantar"</strong> (no topo direito) ➔{' '}
                    <strong>"Nova implantação"</strong>.
                  </li>
                  <li>
                    Clique na engrenagem ao lado de "Selecione o tipo" e escolha <strong>"App da Web"</strong>.
                  </li>
                  <li>
                    Configure:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                      <li>Executar como: <strong>Eu</strong> (sua conta Google)</li>
                      <li>Quem pode acessar: <strong>Qualquer pessoa (Anyone)</strong></li>
                    </ul>
                  </li>
                  <li>
                    Clique em <strong>Implantar</strong>, autorize o acesso com sua conta Google e <strong>copie a URL do app da Web</strong> (termina com <code>/exec</code>).
                  </li>
                  <li>
                    Cole a URL no campo acima no DoceGestor e clique em <strong>"Salvar Backup na Nuvem"</strong>!
                  </li>
                  <li>
                    <strong>Sincronização em múltiplos aparelhos:</strong> Abra o DoceGestor no seu outro celular ou computador, vá em Configurações, cole a mesma URL e clique em <strong>"Restaurar Dados do Google Sheets"</strong>!
                  </li>
                </ol>
              </div>

              {/* Bloco com o Código do Apps Script */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">
                    Código do Google Apps Script (Copie e cole):
                  </span>
                  <button
                    onClick={handleCopiarCodigoAppsScript}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer"
                    style={{ backgroundColor: copiouCodigo ? '#2E7D32' : currentTheme.primary }}
                  >
                    {copiouCodigo ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiouCodigo ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={8}
                    value={GOOGLE_APPS_SCRIPT_CODE}
                    className="w-full p-3 rounded-xl border bg-black text-[#FFF8F0] font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
                    style={{ borderColor: currentTheme.border }}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      </>}

      {activeSection === 'apoio' && <>
      {/* 2. Apoie a Evolução do Projeto & Criação de Apps Gratuitos (Área Especial de Doação PIX) */}
      <div
        ref={apoioRef}
        id="apoie-projeto"
        className={`rounded-3xl p-5 sm:p-6 border shadow-md space-y-4 transition-all duration-500 relative overflow-hidden ${
          highlightApoio ? 'ring-4 ring-rose-400 ring-offset-2 scale-[1.01]' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.12) 0%, rgba(200, 90, 110, 0.14) 100%)',
          backgroundColor: currentTheme.cardBg,
          borderColor: highlightApoio ? '#C85A6E' : '#D4A574',
        }}
      >
        {/* Elemento visual decorativo */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br from-rose-300/20 to-amber-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <Heart size={13} className="fill-rose-500 text-rose-500 animate-pulse" />
              <span>Apoie a Evolução do DoceGestor</span>
            </div>
            <h3
              className="text-base sm:text-lg font-bold font-display tracking-tight flex items-center gap-2 pt-1"
              style={{ color: currentTheme.textMain }}
            >
              <span>Apoie o WebApp & Criação de Novos Apps Gratuitos</span>
            </h3>
          </div>
          <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 shrink-0">
            <Gift size={22} className="text-[#C85A6E]" />
          </span>
        </div>

        {/* Mensagem de Apelo Confeiteira / Empreendedor */}
        <div className="space-y-2 text-xs sm:text-sm leading-relaxed" style={{ color: currentTheme.textMain }}>
          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-950 font-medium">
            🧁 <strong>Se o DoceGestor fez diferença na sua rotina, considere apoiar o projeto quando puder.</strong>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            O DoceGestor é um projeto independente e de código aberto, feito para oferecer ferramentas úteis a confeiteiros, doceiras artesanais e pequenos negócios — sem mensalidade para usar os recursos gratuitos.
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Apoios voluntários ajudam a dedicar tempo ao desenvolvimento, corrigir problemas e <strong>criar novos aplicativos gratuitos</strong>. Você também pode contribuir enviando feedback ou compartilhando o projeto.
          </p>
        </div>

        {/* Caixa de Doação PIX em Destaque */}
        <div
          className="p-4 rounded-2xl border space-y-3 bg-white/90 shadow-xs"
          style={{ borderColor: '#D4A574' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Coffee size={13} className="text-[#D4A574]" />
                <span>Link de apoio oficial · Mercado Pago</span>
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-gray-900 select-all tracking-wide mt-0.5">
                link.mercadopago.com.br/saulomgg
              </div>
              <p className="text-[11px] text-muted-foreground">
                O apoio é voluntário e acontece pelo Mercado Pago. O app continua gratuito para todos.
              </p>
            </div>

            <button
              onClick={handleCopiarPix}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
              style={{ backgroundColor: copiouPix ? '#2E7D32' : '#C85A6E' }}
            >
              {copiouPix ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiouPix ? '✓ Link aberto' : 'Abrir Link de apoio'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-100 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-amber-900">
              <Sparkles size={13} className="text-[#D4A574]" />
              Doe qualquer valor: R$ 5, R$ 10, R$ 20, R$ 50 ou quanto o coração mandar!
            </span>
            <span className="font-semibold text-emerald-800">
              💚 100% reinvestido em soluções gratuitas
            </span>
          </div>
        </div>

        {/* Links: Redes Sociais & Portfólio do Desenvolvedor */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 text-xs">
          <a
            href="https://saulomgg.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-bold transition hover:bg-black/5 active:scale-95"
            style={{
              borderColor: currentTheme.border,
              backgroundColor: currentTheme.cardBg,
              color: currentTheme.textMain,
            }}
          >
            <Globe size={15} className="text-[#D4A574]" />
            <span>Conheça meus projetos</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          <div className="w-full sm:w-auto flex flex-col items-center sm:items-start gap-1 text-center sm:text-left">
            <a href="https://docegestor.github.io/" target="_blank" rel="noopener noreferrer" className="font-bold underline" style={{ color: currentTheme.textMain }}>
              Site oficial do DoceGestor
            </a>
            <a href="https://github.com/docegestor/docegestor.github.io/issues/new" target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: currentTheme.textMuted }}>
              Feedback, melhorias e dicas
            </a>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              'Estou usando o DoceGestor, um app PWA gratuito incrível para confeitaria calcular custos de receitas, fichas técnicas e pedidos! Dá uma olhada: ' +
                window.location.origin
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white transition hover:opacity-90 active:scale-95 cursor-pointer"
            style={{ backgroundColor: '#25D366' }}
          >
            <Share2 size={14} />
            <span>Indicar para outras confeiteiras</span>
          </a>
        </div>
      </div>

      </>}

      {activeSection === 'negocio' && <>
      {/* 3. Identidade da Confeitaria */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-3"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <Sparkles size={16} className="text-[#D4A574]" />
          Dados da Sua Confeitaria
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Nome da Confeitaria</label>
            <input
              type="text"
              value={config.nomeConfeitaria}
              onChange={(e) => updateConfig({ nomeConfeitaria: e.target.value })}
              placeholder="Ex: Ateliê dos Doces"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Seu Nome / Confeiteira Responsável</label>
            <input
              type="text"
              value={config.nomeResponsavel}
              onChange={(e) => updateConfig({ nomeResponsavel: e.target.value })}
              placeholder="Ex: Maria Eduarda"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">WhatsApp para Contato & Pedidos</label>
            <input
              type="tel"
              value={config.whatsapp}
              onChange={(e) => updateConfig({ whatsapp: e.target.value })}
              placeholder="Ex: (11) 98765-4321"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Chave PIX (para orçamentos)</label>
            <input
              type="text"
              value={config.chavePix}
              onChange={(e) => updateConfig({ chavePix: e.target.value })}
              placeholder="Ex: seuemail@gmail.com ou celular"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
            />
          </div>
        </div>
      </div>

      </>}

      {activeSection === 'precificacao' && <>
      {/* 3. Parâmetros da Calculadora de Preços */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <Clock size={16} className="text-[#C85A6E]" />
          Parâmetros de Precificação
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold block mb-1">
              Valor da sua Hora de Trabalho (R$/h)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={config.horaTrabalho}
                onChange={(e) =>
                  updateConfig({ horaTrabalho: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="w-32 px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
              <span className="text-xs text-muted-foreground">
                = {formatCurrency(config.horaTrabalho * 8)} por dia (8h)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Seu salário por hora dedicada à produção, decoração e limpeza.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Multiplicador Padrão de Venda (Markup)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="6"
                step="0.1"
                value={config.multiplicadorPadrao}
                onChange={(e) =>
                  updateConfig({
                    multiplicadorPadrao: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-32 px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none"
                style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
              />
              <span className="text-xs text-muted-foreground font-semibold">
                {config.multiplicadorPadrao}x o custo total
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Padrão da confeitaria artesanal: 2.5x a 3.5x para lucro garantido.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Custos Fixos Indiretos (% sobre insumos)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={config.custosFixosPct}
              onChange={(e) =>
                updateConfig({ custosFixosPct: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-32 px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none"
              style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Gás, luz, água e detergente rateados (recomenda-se 10% a 15%).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Meta de Faturamento Mensal (R$)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={config.metaVendasMensal}
              onChange={(e) =>
                updateConfig({ metaVendasMensal: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none"
              style={{ backgroundColor: currentTheme.bgPrimary, borderColor: currentTheme.border }}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Para acompanhar o progresso na tela inicial.
            </p>
          </div>
        </div>
      </div>

      </>}

      {activeSection === 'custos' && <>
      {/* 4. Custos Fixos em R$ por Produção */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-3"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <DollarSign size={16} className="text-[#2E7D32]" />
          Custos Fixos em R$ por Produção
        </h3>
        <p className="text-xs text-muted-foreground">
          Itens adicionados automaticamente em toda receita (ex: embalagem padrão, laço, cakeboard):
        </p>

        <div className="space-y-2">
          {config.custosFixosPersonais.map((cf) => (
            <div
              key={cf.id}
              className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
              style={{
                backgroundColor: currentTheme.bgPrimary,
                borderColor: currentTheme.border,
              }}
            >
              <span className="font-semibold">{cf.nome}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#3D2314]">{formatCurrency(cf.valor)}</span>
                <button
                  onClick={() => removeCustoFixo(cf.id)}
                  className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Remover custo fixo"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Adicionar novo custo fixo */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border sm:flex-row">
          <input
            type="text"
            value={novoFixoNome}
            onChange={(e) => setNovoFixoNome(e.target.value)}
            placeholder="Nome (Ex: Caixa + Laço)"
            className="flex-1 px-3 py-2 rounded-xl border text-xs bg-white focus:outline-none"
            style={{ borderColor: currentTheme.border }}
          />
          <input
            type="number"
            step="0.5"
            min="0"
            value={novoFixoValor || ''}
            onChange={(e) => setNovoFixoValor(parseFloat(e.target.value) || 0)}
            placeholder="R$"
            className="w-20 px-2 py-2 rounded-xl border text-xs text-center bg-white focus:outline-none"
            style={{ borderColor: currentTheme.border }}
          />
          <button
            onClick={handleAddFixo}
            disabled={!novoFixoNome.trim() || novoFixoValor <= 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: currentTheme.primary }}
          >
            Adicionar
          </button>
        </div>
      </div>

      </>}

      {activeSection === 'temas' && <>
      {/* 5. Temas Visuais */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-3"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <Palette size={16} className="text-[#D4A574]" />
          Temas & Cores do App
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {THEMES.map((theme) => {
            const isSelected = theme.id === currentTheme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition active:scale-95 cursor-pointer ${
                  isSelected ? 'ring-2 ring-[#D4A574] shadow-sm' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: theme.bgPrimary,
                  borderColor: theme.border,
                  color: theme.textMain,
                }}
              >
                <span className="text-2xl">{theme.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate">{theme.name}</p>
                  <div className="flex gap-1 mt-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                </div>
                {isSelected && <CheckCircle size={16} className="text-[#2E7D32] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      </>}

      {activeSection === 'instalacao' && <>
      {/* 6. Instalação & Status PWA */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-3"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <Smartphone size={16} className="text-[#C85A6E]" />
          Aplicativo Instalável (PWA)
        </h3>

        <div className="p-3.5 rounded-2xl bg-black/5 border border-border text-xs space-y-1">
          <p className="font-medium text-foreground">
            Status do App:{' '}
            <strong>
              {isStandalone
                ? '✅ Instalado na tela inicial (Modo Standalone)'
                : '🌐 Rodando no navegador web'}
            </strong>
          </p>
          <p className="text-muted-foreground text-[11px]">
            O DoceGestor funciona sem internet, armazena seus dados em segurança localmente e atualiza automaticamente.
          </p>
        </div>

        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Download size={16} className="text-[#D4A574]" />
          <span>Instalar Agora no Celular (Download Direto)</span>
        </button>
      </div>

      </>}

      {activeSection === 'nuvem' && <>
      {/* 7. Gestão de Dados & Backup em Arquivo JSON Local */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-3"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: currentTheme.textMain }}>
          <Download size={16} className="text-[#2E7D32]" />
          Backup Local (Arquivo JSON)
        </h3>
        <p className="text-xs text-muted-foreground">
          Baixe um arquivo de segurança no formato JSON ou restaure um arquivo salvo no seu computador/celular:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={exportBackup}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-bold transition hover:bg-black/5 active:scale-95 cursor-pointer"
            style={{ borderColor: currentTheme.border, color: currentTheme.textMain }}
          >
            <Download size={15} />
            <span>Exportar Arquivo (JSON)</span>
          </button>

          <label
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-bold transition hover:bg-black/5 active:scale-95 cursor-pointer"
            style={{ borderColor: currentTheme.border, color: currentTheme.textMain }}
          >
            <Upload size={15} />
            <span>Importar Arquivo (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-2 border-t border-border flex justify-between items-center">
          <button
            onClick={() => {
              if (
                confirm(
                  'Deseja restaurar as receitas e insumos de exemplo padrão? Seus dados existentes serão substituídos.'
                )
              ) {
                resetToDefaults();
                alert('✓ Dados restaurados para os exemplos padrão.');
              }
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Restaurar dados de exemplo</span>
          </button>
        </div>
      </div>

      </>}

      {/* Modal PWA */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
