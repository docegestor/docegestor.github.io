import React, { useState } from 'react';
import { Download, Sparkles, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallModal } from './PWAInstallModal';

interface HeaderProps {
  onNavigate?: (tab: string, extra?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { config, currentTheme } = useApp();
  const { isInstallable, isIOS, isStandalone, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      try {
        const accepted = await install();
        if (accepted) return;
      } catch (e) {
        console.error('Install error', e);
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
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border text-xl"
              style={{
                backgroundColor: currentTheme.primary,
                borderColor: currentTheme.border,
              }}
            >
              <span>{currentTheme.emoji}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1
                  className="font-display font-bold text-lg leading-tight tracking-tight"
                  style={{ color: currentTheme.textMain }}
                >
                  DoceGestor
                </h1>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                  style={{
                    backgroundColor: currentTheme.accent + '25',
                    color: currentTheme.accent,
                  }}
                >
                  PWA Pro
                </span>
              </div>
              <p
                className="text-[11px] truncate max-w-[180px] sm:max-w-[260px]"
                style={{ color: currentTheme.textMuted }}
              >
                {config.nomeConfeitaria || 'Gestão para Confeitarias'}
              </p>
            </div>
          </div>

          {/* Right Action: Online/Offline Badge & Install App */}
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
              style={{
                backgroundColor: isOnline ? '#E8F5E9' : '#FEF3C7',
                color: isOnline ? '#2E7D32' : '#B45309',
                borderColor: isOnline ? '#C8E6C9' : '#FDE68A',
              }}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Install PWA Button */}
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: currentTheme.primary,
                }}
                title="Instalar aplicativo na tela inicial"
              >
                <Download size={14} className="text-[#D4A574]" />
                <span className="hidden xs:inline">Instalar App</span>
                <span className="xs:hidden">App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Install Modal */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </>
  );
};
