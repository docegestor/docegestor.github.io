import React from 'react';
import {
  Home,
  Calculator,
  ShoppingBag,
  BookOpen,
  Package,
  PieChart,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { currentTheme, vendas } = useApp();

  // Contar encomendas pendentes/em produção
  const pedidosPendentes = vendas.filter(
    (v) => v.tipo === 'encomenda' && (v.status === 'pendente' || v.status === 'em_producao')
  ).length;

  const navItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'calcular', label: 'Calcular', icon: Calculator },
    {
      id: 'vendas',
      label: 'Vendas',
      icon: ShoppingBag,
      badge: pedidosPendentes > 0 ? pedidosPendentes : undefined,
    },
    { id: 'receitas', label: 'Receitas', icon: BookOpen },
    { id: 'insumos', label: 'Insumos', icon: Package },
    { id: 'balanco', label: 'Balanço', icon: PieChart },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t pb-safe backdrop-blur-xl transition-colors shadow-lg"
      style={{
        backgroundColor: currentTheme.bgPrimary + 'F2',
        borderColor: currentTheme.border,
      }}
      aria-label="Navegação Principal"
    >
      <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-between px-2 py-1.5 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[48px] py-1.5 px-2 rounded-2xl transition-all duration-150 cursor-pointer active:scale-95 ${
                isActive ? 'font-semibold' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                color: isActive ? currentTheme.textMain : currentTheme.textMuted,
                backgroundColor: isActive ? currentTheme.cardBg : 'transparent',
                boxShadow: isActive
                  ? `0 2px 8px -1px ${currentTheme.primary}20`
                  : 'none',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  style={{
                    color: isActive ? currentTheme.primary : currentTheme.textMuted,
                  }}
                />
                {item.badge !== undefined && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: currentTheme.accent }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
