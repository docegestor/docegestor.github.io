import React, { useState } from 'react';
import { Download, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallModal } from './PWAInstallModal';

export const Header: React.FC = () => {
  const { config, currentTheme } = useApp();
  const { isInstallable, isStandalone, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      try {
        const accepted = await install();
        if (accepted) return;
      } catch (error) {
        console.error('Install error', error);
      }
    }
    setShowInstallModal(true);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors"
        style={{
          backgroundColor: currentTheme.bgPrimary + 'EE',
          borderColor: currentTheme.border,
        }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xl shadow-sm"
              style={{ backgroundColor: currentTheme.primary, borderColor: currentTheme.border }}
              aria-hidden="true"
            >
              <span>{currentTheme.emoji}</span>
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <h1
                  className="font-display truncate text-base font-bold leading-tight tracking-tight sm:text-lg"
                  style={{ color: currentTheme.textMain }}
                >
                  DoceGestor
                </h1>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: currentTheme.accent + '25', color: currentTheme.accent }}
                >
                  PWA PRO
                </span>
              </div>
              <p
                className="max-w-[150px] truncate text-[10px] leading-tight sm:max-w-[260px] sm:text-[11px]"
                style={{ color: currentTheme.textMuted }}
                title={config.nomeConfeitaria || 'Minha doceria'}
              >
                {config.nomeConfeitaria || 'Minha doceria'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div
              className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex"
              style={{
                backgroundColor: isOnline ? '#E8F5E9' : '#FEF3C7',
                color: isOnline ? '#2E7D32' : '#B45309',
                borderColor: isOnline ? '#C8E6C9' : '#FDE68A',
              }}
              role="status"
              aria-label={isOnline ? 'Conectado' : 'Sem conexão'}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-95 sm:px-3 sm:text-xs"
                style={{ backgroundColor: currentTheme.primary }}
                title="Instalar aplicativo na tela inicial"
              >
                <Download size={14} />
                <span>Instalar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <PWAInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </>
  );
};
