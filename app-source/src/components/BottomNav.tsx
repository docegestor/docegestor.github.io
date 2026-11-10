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

  const pedidosPendentes = vendas.filter(
    (v) => v.tipo === 'encomenda' && (v.status === 'pendente' || v.status === 'em_producao')
  ).length;

  const navItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'calcular', label: 'Calcular', icon: Calculator },
    { id: 'vendas', label: 'Vendas', icon: ShoppingBag, badge: pedidosPendentes > 0 ? pedidosPendentes : undefined },
    { id: 'receitas', label: 'Receitas', icon: BookOpen },
    { id: 'insumos', label: 'Insumos', icon: Package },
    { id: 'balanco', label: 'Balanço', icon: PieChart },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t pb-safe shadow-lg backdrop-blur-xl transition-colors"
      style={{ backgroundColor: currentTheme.bgPrimary + 'F2', borderColor: currentTheme.border }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex w-full max-w-2xl items-stretch justify-between gap-0 px-1 py-1.5 sm:px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 transition-colors duration-150 active:scale-95 ${isActive ? 'font-semibold' : 'opacity-75 hover:opacity-100'}`}
              style={{
                color: isActive ? currentTheme.textMain : currentTheme.textMuted,
                backgroundColor: isActive ? currentTheme.cardBg : 'transparent',
                boxShadow: isActive ? `0 2px 8px -1px ${currentTheme.primary}20` : 'none',
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.badge ? `${item.label}, ${item.badge} pedidos pendentes` : item.label}
            >
              <span className="relative">
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  style={{ color: isActive ? currentTheme.primary : currentTheme.textMuted }}
                />
                {item.badge !== undefined && (
                  <span
                    className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: currentTheme.accent }}
                    aria-hidden="true"
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="mt-1 max-w-full truncate text-[9px] leading-none tracking-tight sm:text-[10px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
