import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';

import { HomeView } from './views/HomeView';
import { CalculadoraView } from './views/CalculadoraView';
import { VendasView } from './views/VendasView';
import { ReceitasView } from './views/ReceitasView';
import { InsumosView } from './views/InsumosView';
import { BalancoView } from './views/BalancoView';
import { ConfigView } from './views/ConfigView';

function AppContent() {
  const { currentTheme } = useApp();

  // Parse initial tab from URL hash if available
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'apoio' || hash === 'config-apoio') {
      return 'config';
    }
    if (['inicio', 'calcular', 'vendas', 'receitas', 'insumos', 'balanco', 'config'].includes(hash)) {
      return hash;
    }
    const path = window.location.pathname.replace('/', '').toLowerCase();
    if (['inicio', 'calcular', 'vendas', 'receitas', 'insumos', 'balanco', 'config'].includes(path)) {
      return path;
    }
    return 'inicio';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [navExtra, setNavExtra] = useState<any>(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    return hash === 'apoio' || hash === 'config-apoio' ? { scrollToApoio: true } : null;
  });

  // Sync tab with URL hash for back/forward navigation
  const handleSelectTab = (tab: string, extra?: any) => {
    setCurrentTab(tab);
    setNavExtra(extra || null);
    window.location.hash = extra?.scrollToApoio ? 'config-apoio' : tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'apoio' || hash === 'config-apoio') {
        setCurrentTab('config');
        setNavExtra({ scrollToApoio: true });
        return;
      }
      if (['inicio', 'calcular', 'vendas', 'receitas', 'insumos', 'balanco', 'config'].includes(hash)) {
        setCurrentTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-clip transition-colors duration-200"
      style={{
        backgroundColor: currentTheme.bgPrimary,
        color: currentTheme.textMain,
      }}
    >
      <Header />
      <OfflineIndicator />

      <main className="w-full min-w-0 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-4 pb-28">
        {currentTab === 'inicio' && <HomeView onNavigate={handleSelectTab} />}
        {currentTab === 'calcular' && (
          <CalculadoraView
            receitaIdPreSelecionada={navExtra?.receitaId}
            onNavigate={handleSelectTab}
          />
        )}
        {currentTab === 'vendas' && (
          <VendasView
            abrirNovaVenda={navExtra?.abrirNovaVenda}
            produtoPreSelecionado={navExtra?.produtoPreSelecionado}
            onNavigate={handleSelectTab}
          />
        )}
        {currentTab === 'receitas' && <ReceitasView onNavigate={handleSelectTab} />}
        {currentTab === 'insumos' && <InsumosView />}
        {currentTab === 'balanco' && <BalancoView onNavigate={handleSelectTab} />}
        {currentTab === 'config' && <ConfigView scrollToApoio={navExtra?.scrollToApoio} />}

        {/* Footer solicitado */}
        <footer className="mt-8 pt-4 pb-4 text-center border-t space-y-2.5" style={{ borderColor: currentTheme.border }}>
          <p className="text-xs font-medium" style={{ color: currentTheme.textMuted }}>
            DoceGestor App v2.5 · Privado por padrão · Desenvolvido por{' '}
            <a
              href="https://saulomgg.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:opacity-80 transition cursor-pointer"
              style={{ color: currentTheme.textMain }}
            >
              Saulomgg
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="https://docegestor.github.io/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition hover:scale-105 active:scale-95 shadow-xs border" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, color: currentTheme.textMain }}>
              Site oficial
            </a>
            <a href="https://github.com/docegestor/docegestor.github.io/issues/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition hover:scale-105 active:scale-95 shadow-xs border" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, color: currentTheme.textMain }}>
              Feedback e melhorias
            </a>
            <button
              onClick={() => handleSelectTab('config', { scrollToApoio: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer shadow-xs border"
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: '#D4A574',
                color: currentTheme.textMain,
              }}
              title="Apoie a evolução do projeto e criação de apps gratuitos"
            >
              <span className="text-rose-500">💖</span>
              <span>Apoie a evolução do projeto (Chave PIX & Redes)</span>
            </button>
          </div>
        </footer>
      </main>

      <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
