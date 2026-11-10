import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-[#3D2314]/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-[#FFF8F0] shadow-lg border border-[#D4A574]/40 animate-pulse"
    >
      <WifiOff size={13} className="text-[#D4A574]" />
      <span>Modo Offline</span>
      <span className="text-[#D4A574]/60">·</span>
      <span className="flex items-center gap-1 text-[11px] text-[#F5D8C3]">
        <Database size={11} /> Dados salvos no celular
      </span>
    </div>
  );
};
