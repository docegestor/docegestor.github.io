import React from 'react';
import { Download, Share, PlusSquare, Smartphone, CheckCircle, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isIOS, isStandalone, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#FFF8F0] p-6 shadow-2xl border border-[#EEDCCF] text-[#3D2314]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#8C6A54] hover:bg-[#3D2314]/5 transition"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Icon Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#3D2314] shadow-md mb-3 border-2 border-[#D4A574]/40">
            <span className="text-3xl">🧁</span>
          </div>
          <h3 className="font-display text-xl font-bold text-[#3D2314]">
            Instalar DoceGestor
          </h3>
          <p className="text-xs text-[#8C6A54] mt-1">
            Tenha a gestão da sua confeitaria sempre à mão, com acesso rápido e offline!
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-2 mb-5 bg-white/70 rounded-2xl p-3.5 border border-[#EEDCCF]">
          <div className="flex items-center gap-2.5 text-xs text-[#3D2314]">
            <CheckCircle size={15} className="text-[#2E7D32] shrink-0" />
            <span>Funciona <strong>100% offline</strong> sem internet</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#3D2314]">
            <CheckCircle size={15} className="text-[#2E7D32] shrink-0" />
            <span>Ícone na tela de início como aplicativo nativo</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#3D2314]">
            <CheckCircle size={15} className="text-[#2E7D32] shrink-0" />
            <span>Sem ocupar espaço da memória do celular</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#3D2314]">
            <CheckCircle size={15} className="text-[#2E7D32] shrink-0" />
            <span>Seus dados continuam seguros no seu aparelho</span>
          </div>
        </div>

        {/* Action according to OS */}
        {isStandalone ? (
          <div className="p-3 bg-[#E8F5E9] rounded-xl text-center border border-[#C8E6C9] mb-3">
            <p className="text-xs font-semibold text-[#2E7D32]">
              🎉 Você já está usando o aplicativo instalado!
            </p>
          </div>
        ) : isInstallable ? (
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-[#3D2314] text-[#FFF8F0] font-medium text-sm shadow-md hover:bg-[#2C1810] active:scale-[0.98] transition cursor-pointer"
          >
            <Download size={18} className="text-[#D4A574]" />
            <span>Instalar Agora no Celular</span>
          </button>
        ) : isIOS ? (
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EEDCCF]">
            <p className="text-xs font-semibold text-[#3D2314] flex items-center gap-1.5">
              <Smartphone size={14} className="text-[#C85A6E]" />
              Como instalar no iPhone / iPad:
            </p>
            <ol className="text-xs text-[#8C6A54] space-y-2 list-decimal list-inside pl-1">
              <li className="leading-snug">
                Toque no botão de <strong>Compartilhar</strong>{' '}
                <Share size={13} className="inline text-[#007AFF] mx-0.5 align-middle" /> na barra inferior do Safari.
              </li>
              <li className="leading-snug">
                Role para baixo e toque em{' '}
                <strong>Adicionar à Tela de Início</strong>{' '}
                <PlusSquare size={13} className="inline text-[#3D2314] mx-0.5 align-middle" />.
              </li>
              <li className="leading-snug">
                Toque em <strong>Adicionar</strong> no canto superior direito.
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-[#EEDCCF] text-center">
            <p className="text-xs text-[#3D2314] font-medium">
              Para adicionar ao seu celular:
            </p>
            <p className="text-[11px] text-[#8C6A54] leading-relaxed">
              Abra o menu do seu navegador (três pontinhos <strong>⋮</strong> no topo ou na barra) e toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-xs font-medium text-[#8C6A54] hover:text-[#3D2314] transition text-center"
        >
          Agora não, continuar no navegador
        </button>
      </div>
    </div>
  );
};
