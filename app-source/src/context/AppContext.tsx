import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Insumo,
  CompraInsumo,
  Receita,
  Produto,
  Venda,
  ConfiguracaoApp,
  CustoFixoPersonalizado,
  StatusPedido,
  ThemeDef,
  InsumoCalculo,
  ItemVenda,
} from '../types';
import {
  enviarBackupGoogleSheets,
  restaurarBackupGoogleSheets,
} from '../services/googleSheetsSync';

export const THEMES: ThemeDef[] = [
  {
    id: 'doce-boutique',
    name: 'Doce Boutique',
    emoji: '🧁',
    primary: '#3D2314',
    primaryDark: '#28140B',
    bgPrimary: '#FFF8F0',
    cardBg: '#FFFFFF',
    textMain: '#3D2314',
    textMuted: '#8C6A54',
    border: '#EEDCCF',
    accent: '#C85A6E',
  },
  {
    id: 'chocolate-nobre',
    name: 'Chocolate Nobre',
    emoji: '🍫',
    primary: '#D4A574',
    primaryDark: '#B8834C',
    bgPrimary: '#24140D',
    cardBg: '#341E14',
    textMain: '#FDF6EE',
    textMuted: '#BA9C85',
    border: '#4D2F20',
    accent: '#E5B25D',
  },
  {
    id: 'rosa-confeitaria',
    name: 'Rosa Confeitaria',
    emoji: '🌸',
    primary: '#8A2B53',
    primaryDark: '#5E1836',
    bgPrimary: '#FFF0F5',
    cardBg: '#FFFFFF',
    textMain: '#4A1942',
    textMuted: '#9B5F8D',
    border: '#F6D5E1',
    accent: '#E91E63',
  },
  {
    id: 'minimalista-clean',
    name: 'Minimalista Clean',
    emoji: '✨',
    primary: '#1F2937',
    primaryDark: '#111827',
    bgPrimary: '#F9FAFB',
    cardBg: '#FFFFFF',
    textMain: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    accent: '#0D9488',
  },
];

const DEFAULT_CONFIG: ConfiguracaoApp = {
  nomeConfeitaria: 'Minha Doce Confeitaria',
  nomeResponsavel: 'Confeiteira',
  whatsapp: '(11) 98765-4321',
  chavePix: 'confeitaria@email.com',
  cidade: 'São Paulo - SP',
  horaTrabalho: 18.0, // R$ 18 por hora
  multiplicadorPadrao: 3.0, // Regra 3x tradicional
  custosFixosPct: 10.0, // 10% sobre insumos (gás, água, energia)
  margemSegurancaPct: 5.0, // 5% de quebra/desperdício
  custosFixosPersonais: [
    { id: 'fixo_1', nome: 'Gás e Energia', valor: 2.5 },
    { id: 'fixo_2', nome: 'Detergente e Higiene', valor: 1.0 },
    { id: 'fixo_3', nome: 'Etiqueta e Fita', valor: 1.5 },
  ],
  metaVendasMensal: 3500.0,
  temaId: 'doce-boutique',
  premium: true, // Totalmente liberado para o usuário
  codigoAtivado: 'DG-PRO-VIP-2026',
  emailAtivado: 'confeiteira@docegestor.com',
  statusOnline: 'active',
};

const DEFAULT_INSUMOS: Insumo[] = [
  {
    id: 'ins_1',
    nome: 'Leite Condensado 395g',
    categoria: 'laticinios',
    unidade: 'un',
    precoAtual: 6.8,
    estoqueAtual: 14,
    estoqueMinimo: 6,
    compras: [
      {
        id: 'cp_1',
        data: '2026-09-18',
        localFornecedor: 'Atacadão',
        precoPago: 6.8,
        quantidadeComprada: '1 caixa com 27 un',
        precoUnitario: 6.8,
      },
      {
        id: 'cp_2',
        data: '2026-08-28',
        localFornecedor: 'Assaí Atacadista',
        precoPago: 6.5,
        quantidadeComprada: '12 un',
        precoUnitario: 6.5,
      },
    ],
  },
  {
    id: 'ins_2',
    nome: 'Creme de Leite 200g',
    categoria: 'laticinios',
    unidade: 'un',
    precoAtual: 3.5,
    estoqueAtual: 18,
    estoqueMinimo: 8,
    compras: [
      {
        id: 'cp_3',
        data: '2026-09-18',
        localFornecedor: 'Atacadão',
        precoPago: 3.5,
        quantidadeComprada: '24 un',
        precoUnitario: 3.5,
      },
    ],
  },
  {
    id: 'ins_3',
    nome: 'Chocolate Nobre em Gotas 50% (kg)',
    categoria: 'chocolates',
    unidade: 'kg',
    precoAtual: 44.9,
    estoqueAtual: 4,
    estoqueMinimo: 2,
    compras: [
      {
        id: 'cp_4',
        data: '2026-09-12',
        localFornecedor: 'Loja Santo Antônio',
        precoPago: 44.9,
        quantidadeComprada: '2 kg',
        precoUnitario: 44.9,
      },
    ],
  },
  {
    id: 'ins_4',
    nome: 'Cacau em Pó 100% (kg)',
    categoria: 'chocolates',
    unidade: 'kg',
    precoAtual: 52.0,
    estoqueAtual: 2,
    estoqueMinimo: 1,
    compras: [
      {
        id: 'cp_5',
        data: '2026-09-02',
        localFornecedor: 'Distribuidora Doce Mania',
        precoPago: 52.0,
        quantidadeComprada: '1 kg',
        precoUnitario: 52.0,
      },
    ],
  },
  {
    id: 'ins_5',
    nome: 'Farinha de Trigo Especial (kg)',
    categoria: 'farinhas',
    unidade: 'kg',
    precoAtual: 4.8,
    estoqueAtual: 8,
    estoqueMinimo: 4,
    compras: [
      {
        id: 'cp_6',
        data: '2026-09-15',
        localFornecedor: 'Supermercado Dia',
        precoPago: 4.8,
        quantidadeComprada: '5 kg',
        precoUnitario: 4.8,
      },
    ],
  },
  {
    id: 'ins_6',
    nome: 'Manteiga Extra sem Sal (kg)',
    categoria: 'laticinios',
    unidade: 'kg',
    precoAtual: 39.9,
    estoqueAtual: 3,
    estoqueMinimo: 1,
    compras: [
      {
        id: 'cp_7',
        data: '2026-09-14',
        localFornecedor: 'Atacadão',
        precoPago: 39.9,
        quantidadeComprada: '2 kg',
        precoUnitario: 39.9,
      },
    ],
  },
  {
    id: 'ins_7',
    nome: 'Ovos Médios (dz)',
    categoria: 'ovos',
    unidade: 'dz',
    precoAtual: 11.5,
    estoqueAtual: 4,
    estoqueMinimo: 2,
    compras: [
      {
        id: 'cp_8',
        data: '2026-09-20',
        localFornecedor: 'Granja Local',
        precoPago: 11.5,
        quantidadeComprada: '3 dz',
        precoUnitario: 11.5,
      },
    ],
  },
  {
    id: 'ins_8',
    nome: 'Caixa Kraft para 6 Brigadeiros',
    categoria: 'embalagens',
    unidade: 'un',
    precoAtual: 2.8,
    estoqueAtual: 30,
    estoqueMinimo: 10,
    compras: [
      {
        id: 'cp_9',
        data: '2026-09-10',
        localFornecedor: 'Embalagens Ideal',
        precoPago: 2.8,
        quantidadeComprada: '50 un',
        precoUnitario: 2.8,
      },
    ],
  },
  {
    id: 'ins_9',
    nome: 'Forminhas 4 Pétalas Kraft (cento)',
    categoria: 'embalagens',
    unidade: 'un',
    precoAtual: 0.12,
    estoqueAtual: 250,
    estoqueMinimo: 100,
    compras: [
      {
        id: 'cp_10',
        data: '2026-09-10',
        localFornecedor: 'Embalagens Ideal',
        precoPago: 12.0,
        quantidadeComprada: '100 un',
        precoUnitario: 0.12,
      },
    ],
  },
];

const DEFAULT_RECEITAS: Receita[] = [
  {
    id: 'rec_1',
    nome: 'Brigadeiro Gourmet Belga Tradicional',
    categoria: 'Docinhos Gourmet',
    rendimentoQtd: 25,
    rendimentoUnidade: 'unidades',
    tempoPreparoHoras: 1.2,
    validadeDias: 5,
    modoPreparo:
      '1. Na panela de fundo grosso, junte o leite condensado, creme de leite e cacau 100% peneirado.\n2. Adicione o chocolate nobre picado e a manteiga.\n3. Cozinhe em fogo médio-baixo mexendo sem parar até desgrudar do fundo da panela (ponto de bloco/moisés).\n4. Despeje em prato untado, cubra com plástico filme em contato e deixe esfriar por 4h.\n5. Boleie bolinhas de 20g e passe no confeito nobre.',
    dicasArmazenamento:
      'Mantenha em local fresco e arejado. Não refrigerar se possível para não umedecer o confeito.',
    insumos: [
      { id: 'ri_1', insumoId: 'ins_1', nome: 'Leite Condensado 395g', quantidade: 1, unidade: 'lata', custo: 6.8 },
      { id: 'ri_2', insumoId: 'ins_2', nome: 'Creme de Leite 200g', quantidade: 0.5, unidade: 'cx', custo: 1.75 },
      { id: 'ri_3', insumoId: 'ins_3', nome: 'Chocolate Nobre 50%', quantidade: 0.1, unidade: 'kg', custo: 4.49 },
      { id: 'ri_4', insumoId: 'ins_4', nome: 'Cacau em Pó 100%', quantidade: 0.03, unidade: 'kg', custo: 1.56 },
      { id: 'ri_5', insumoId: 'ins_6', nome: 'Manteiga Extra', quantidade: 0.02, unidade: 'kg', custo: 0.8 },
      { id: 'ri_6', insumoId: 'ins_9', nome: 'Forminhas 4 Pétalas', quantidade: 25, unidade: 'un', custo: 3.0 },
    ],
    createdAt: '2026-09-10',
  },
  {
    id: 'rec_2',
    nome: 'Bolo Caseiro de Cenoura com Vulcão de Chocolate',
    categoria: 'Bolos Caseiros',
    rendimentoQtd: 1,
    rendimentoUnidade: 'bolo (20cm)',
    tempoPreparoHoras: 1.8,
    tempoFornoMinutos: 45,
    validadeDias: 4,
    modoPreparo:
      'Massa:\n1. Bata no liquidificador cenouras raladas, ovos e óleo.\n2. Incorpore o açúcar e depois a farinha de trigo peneirada.\n3. Misture o fermento delicadamente.\n4. Asse em forma redonda com furo central (20cm) a 180°C por 40-45 min.\n\nCobertura Vulcão:\n1. Faça um brigadeiro cremoso mais fluido com leite condensado, creme de leite e cacau.\n2. Despeje no centro do bolo desenformado até transbordar.',
    dicasArmazenamento: 'Embalar em cúpula protetora para transporte seguro.',
    insumos: [
      { id: 'ri_7', insumoId: 'ins_5', nome: 'Farinha de Trigo', quantidade: 0.3, unidade: 'kg', custo: 1.44 },
      { id: 'ri_8', insumoId: 'ins_7', nome: 'Ovos', quantidade: 0.33, unidade: 'dz', custo: 3.8 },
      { id: 'ri_9', insumoId: 'ins_1', nome: 'Leite Condensado (cobertura)', quantidade: 1, unidade: 'lata', custo: 6.8 },
      { id: 'ri_10', insumoId: 'ins_2', nome: 'Creme de Leite', quantidade: 1, unidade: 'cx', custo: 3.5 },
      { id: 'ri_11', insumoId: 'ins_4', nome: 'Cacau em Pó 100%', quantidade: 0.05, unidade: 'kg', custo: 2.6 },
    ],
    createdAt: '2026-09-12',
  },
];

const DEFAULT_PRODUTOS: Produto[] = [
  {
    id: 'prod_1',
    nome: 'Cento de Brigadeiro Gourmet Belga',
    categoria: 'Docinhos Gourmet',
    receitaId: 'rec_1',
    rendimento: 100,
    rendimentoUnidade: 'unidades',
    tempoMaoDeObraHoras: 4.0,
    custoInsumos: 73.6,
    custoFixosValor: 6.0,
    custoFixosPctValor: 7.36,
    custoMaoObra: 72.0, // 4h x R$ 18
    custoTotal: 158.96,
    custoUnitario: 1.59,
    margemPct: 80,
    markup: 2.8,
    precoMinimo: 2.39,
    precoCalculado: 2.86,
    precoSugerido: 4.45,
    insumos: [],
    createdAt: '2026-09-10',
  },
  {
    id: 'prod_2',
    nome: 'Caixa Degustação com 6 Brigadeiros',
    categoria: 'Presentes & Caixas',
    receitaId: 'rec_1',
    rendimento: 1,
    rendimentoUnidade: 'caixa',
    tempoMaoDeObraHoras: 0.5,
    custoInsumos: 7.3,
    custoFixosValor: 3.5,
    custoFixosPctValor: 0.73,
    custoMaoObra: 9.0,
    custoTotal: 20.53,
    custoUnitario: 20.53,
    margemPct: 90,
    markup: 2.5,
    precoMinimo: 30.8,
    precoCalculado: 39.0,
    precoSugerido: 45.0,
    insumos: [],
    createdAt: '2026-09-14',
  },
  {
    id: 'prod_3',
    nome: 'Bolo Vulcão de Cenoura com Brigadeiro',
    categoria: 'Bolos Caseiros',
    receitaId: 'rec_2',
    rendimento: 1,
    rendimentoUnidade: 'bolo',
    tempoMaoDeObraHoras: 1.8,
    custoInsumos: 18.14,
    custoFixosValor: 5.0,
    custoFixosPctValor: 1.81,
    custoMaoObra: 32.4,
    custoTotal: 57.35,
    custoUnitario: 57.35,
    margemPct: 65,
    markup: 2.2,
    precoMinimo: 86.0,
    precoCalculado: 94.6,
    precoSugerido: 120.0,
    insumos: [],
    createdAt: '2026-09-12',
  },
];

const DEFAULT_VENDAS: Venda[] = [
  {
    id: 'ven_1',
    tipo: 'encomenda',
    clienteNome: 'Mariana Souza',
    clienteWhatsapp: '11998877665',
    dataVenda: '2026-09-21',
    dataEntrega: '2026-09-24',
    horaEntrega: '15:30',
    itens: [
      {
        produtoId: 'prod_1',
        produtoNome: 'Cento de Brigadeiro Gourmet Belga',
        quantidade: 1,
        valorUnitario: 320.0,
        valorTotal: 320.0,
        custoUnitario: 158.96,
      },
    ],
    valorTotal: 320.0,
    valorEntrada: 160.0,
    valorRestante: 160.0,
    custoTotalEstimado: 158.96,
    lucroEstimado: 161.04,
    formaPagamento: 'pix',
    status: 'em_producao',
    observacoes: 'Entregar com fita dourada para aniversário.',
    createdAt: '2026-09-21',
  },
  {
    id: 'ven_2',
    tipo: 'pronta_entrega',
    clienteNome: 'Carlos Eduardo',
    clienteWhatsapp: '11977665544',
    dataVenda: '2026-09-22',
    itens: [
      {
        produtoId: 'prod_3',
        produtoNome: 'Bolo Vulcão de Cenoura com Brigadeiro',
        quantidade: 1,
        valorUnitario: 120.0,
        valorTotal: 120.0,
        custoUnitario: 57.35,
      },
    ],
    valorTotal: 120.0,
    valorEntrada: 120.0,
    valorRestante: 0,
    custoTotalEstimado: 57.35,
    lucroEstimado: 62.65,
    formaPagamento: 'cartao_credito',
    status: 'entregue',
    createdAt: '2026-09-22',
  },
  {
    id: 'ven_3',
    tipo: 'pronta_entrega',
    clienteNome: 'Juliana Castro',
    clienteWhatsapp: '11988112233',
    dataVenda: '2026-09-23',
    itens: [
      {
        produtoId: 'prod_2',
        produtoNome: 'Caixa Degustação com 6 Brigadeiros',
        quantidade: 2,
        valorUnitario: 45.0,
        valorTotal: 90.0,
        custoUnitario: 20.53,
      },
    ],
    valorTotal: 90.0,
    valorEntrada: 90.0,
    valorRestante: 0,
    custoTotalEstimado: 41.06,
    lucroEstimado: 48.94,
    formaPagamento: 'pix',
    status: 'pronto',
    createdAt: '2026-09-23',
  },
];

interface AppContextType {
  config: ConfiguracaoApp;
  insumos: Insumo[];
  receitas: Receita[];
  produtos: Produto[];
  vendas: Venda[];
  currentTheme: ThemeDef;
  // Métodos
  updateConfig: (novosDados: Partial<ConfiguracaoApp>) => void;
  addCustoFixo: (nome: string, valor: number) => void;
  removeCustoFixo: (id: string) => void;
  // Insumos
  addInsumo: (dados: Omit<Insumo, 'id' | 'compras'>) => string;
  updateInsumo: (id: string, dados: Partial<Insumo>) => void;
  removeInsumo: (id: string) => void;
  addCompraInsumo: (
    insumoId: string,
    compra: Omit<CompraInsumo, 'id'>
  ) => void;
  removeCompraInsumo: (insumoId: string, compraId: string) => void;
  // Receitas
  addReceita: (receita: Omit<Receita, 'id' | 'createdAt'>) => string;
  updateReceita: (id: string, receita: Partial<Receita>) => void;
  removeReceita: (id: string) => void;
  // Produtos
  addProduto: (produto: Omit<Produto, 'id' | 'createdAt'>) => string;
  updateProduto: (id: string, produto: Partial<Produto>) => void;
  removeProduto: (id: string) => void;
  // Vendas / Encomendas
  addVenda: (venda: Omit<Venda, 'id' | 'createdAt'>) => string;
  updateVendaStatus: (id: string, novoStatus: StatusPedido) => void;
  removeVenda: (id: string) => void;
  // Temas e backup
  setTheme: (themeId: string) => void;
  exportBackup: () => void;
  importBackup: (jsonContent: string) => boolean;
  resetToDefaults: () => void;
  sincronizarComGoogleSheets: (customUrl?: string) => Promise<{ success: boolean; message: string; dataHora?: string }>;
  restaurarDeGoogleSheets: (customUrl?: string) => Promise<{ success: boolean; message: string; updatedAt?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'docegestor_pwa_state_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfiguracaoApp>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.config) return { ...DEFAULT_CONFIG, ...parsed.config };
      }
    } catch (e) {
      console.error('Error loading config from localStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  const [insumos, setInsumos] = useState<Insumo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.insumos)) return parsed.insumos;
      }
    } catch (e) {
      console.error('Error loading insumos', e);
    }
    return DEFAULT_INSUMOS;
  });

  const [receitas, setReceitas] = useState<Receita[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.receitas)) return parsed.receitas;
      }
    } catch (e) {
      console.error('Error loading receitas', e);
    }
    return DEFAULT_RECEITAS;
  });

  const [produtos, setProdutos] = useState<Produto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.produtos)) return parsed.produtos;
      }
    } catch (e) {
      console.error('Error loading produtos', e);
    }
    return DEFAULT_PRODUTOS;
  });

  const [vendas, setVendas] = useState<Venda[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.vendas)) return parsed.vendas;
      }
    } catch (e) {
      console.error('Error loading vendas', e);
    }
    return DEFAULT_VENDAS;
  });

  // Salvar alterações no localStorage
  useEffect(() => {
    try {
      const payload = {
        config,
        insumos,
        receitas,
        produtos,
        vendas,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }, [config, insumos, receitas, produtos, vendas]);

  // Tema ativo
  const currentTheme = THEMES.find((t) => t.id === config.temaId) || THEMES[0];

  const updateConfig = useCallback((novosDados: Partial<ConfiguracaoApp>) => {
    setConfig((prev) => ({ ...prev, ...novosDados }));
  }, []);

  const addCustoFixo = useCallback((nome: string, valor: number) => {
    const novo: CustoFixoPersonalizado = {
      id: 'fixo_' + Date.now().toString(36),
      nome,
      valor,
    };
    setConfig((prev) => ({
      ...prev,
      custosFixosPersonais: [...prev.custosFixosPersonais, novo],
    }));
  }, []);

  const removeCustoFixo = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      custosFixosPersonais: prev.custosFixosPersonais.filter((c) => c.id !== id),
    }));
  }, []);

  const addInsumo = useCallback((dados: Omit<Insumo, 'id' | 'compras'>) => {
    const id = 'ins_' + Date.now().toString(36);
    const novo: Insumo = {
      ...dados,
      id,
      compras: [],
    };
    setInsumos((prev) => [...prev, novo]);
    return id;
  }, []);

  const updateInsumo = useCallback((id: string, dados: Partial<Insumo>) => {
    setInsumos((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, ...dados } : ins))
    );
  }, []);

  const removeInsumo = useCallback((id: string) => {
    setInsumos((prev) => prev.filter((ins) => ins.id !== id));
  }, []);

  const addCompraInsumo = useCallback(
    (insumoId: string, compraData: Omit<CompraInsumo, 'id'>) => {
      const compraId = 'cp_' + Date.now().toString(36);
      const novaCompra: CompraInsumo = {
        ...compraData,
        id: compraId,
      };

      setInsumos((prev) =>
        prev.map((ins) => {
          if (ins.id === insumoId) {
            return {
              ...ins,
              precoAtual: compraData.precoPago, // Atualiza preço de referência
              compras: [novaCompra, ...ins.compras],
            };
          }
          return ins;
        })
      );
    },
    []
  );

  const removeCompraInsumo = useCallback(
    (insumoId: string, compraId: string) => {
      setInsumos((prev) =>
        prev.map((ins) => {
          if (ins.id === insumoId) {
            const restantes = ins.compras.filter((c) => c.id !== compraId);
            const precoMaisRecente =
              restantes.length > 0 ? restantes[0].precoPago : ins.precoAtual;
            return {
              ...ins,
              compras: restantes,
              precoAtual: precoMaisRecente,
            };
          }
          return ins;
        })
      );
    },
    []
  );

  const addReceita = useCallback(
    (receitaData: Omit<Receita, 'id' | 'createdAt'>) => {
      const id = 'rec_' + Date.now().toString(36);
      const nova: Receita = {
        ...receitaData,
        id,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setReceitas((prev) => [nova, ...prev]);
      return id;
    },
    []
  );

  const updateReceita = useCallback(
    (id: string, receitaData: Partial<Receita>) => {
      setReceitas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...receitaData } : r))
      );
    },
    []
  );

  const removeReceita = useCallback((id: string) => {
    setReceitas((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addProduto = useCallback(
    (produtoData: Omit<Produto, 'id' | 'createdAt'>) => {
      const id = 'prod_' + Date.now().toString(36);
      const novo: Produto = {
        ...produtoData,
        id,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProdutos((prev) => [novo, ...prev]);
      return id;
    },
    []
  );

  const updateProduto = useCallback(
    (id: string, produtoData: Partial<Produto>) => {
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...produtoData } : p))
      );
    },
    []
  );

  const removeProduto = useCallback((id: string) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addVenda = useCallback(
    (vendaData: Omit<Venda, 'id' | 'createdAt'>) => {
      const id = 'ven_' + Date.now().toString(36);
      const nova: Venda = {
        ...vendaData,
        id,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setVendas((prev) => [nova, ...prev]);
      return id;
    },
    []
  );

  const updateVendaStatus = useCallback(
    (id: string, novoStatus: StatusPedido) => {
      setVendas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: novoStatus } : v))
      );
    },
    []
  );

  const removeVenda = useCallback((id: string) => {
    setVendas((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const setTheme = useCallback((themeId: string) => {
    setConfig((prev) => ({ ...prev, temaId: themeId }));
  }, []);

  const exportBackup = useCallback(() => {
    const data = {
      config,
      insumos,
      receitas,
      produtos,
      vendas,
      exportedAt: new Date().toISOString(),
      appVersion: '2.5.0-pwa',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docegestor_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, insumos, receitas, produtos, vendas]);

  const importBackup = useCallback((jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.config) setConfig(parsed.config);
      if (Array.isArray(parsed.insumos)) setInsumos(parsed.insumos);
      if (Array.isArray(parsed.receitas)) setReceitas(parsed.receitas);
      if (Array.isArray(parsed.produtos)) setProdutos(parsed.produtos);
      if (Array.isArray(parsed.vendas)) setVendas(parsed.vendas);
      return true;
    } catch (e) {
      console.error('Error importing JSON backup:', e);
      return false;
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setInsumos(DEFAULT_INSUMOS);
    setReceitas(DEFAULT_RECEITAS);
    setProdutos(DEFAULT_PRODUTOS);
    setVendas(DEFAULT_VENDAS);
  }, []);

  const sincronizarComGoogleSheets = useCallback(
    async (customUrl?: string) => {
      const url = customUrl || config.googleScriptUrl;
      if (!url || !url.trim()) {
        throw new Error('Insira a URL do seu App da Web do Google Apps Script.');
      }

      const backupData = {
        versao: '2.5.0-pwa',
        dataHora: new Date().toISOString(),
        config,
        insumos,
        receitas,
        produtos,
        vendas,
      };

      const resultado = await enviarBackupGoogleSheets(url, backupData);

      setConfig((prev) => ({
        ...prev,
        googleScriptUrl: url.trim(),
        ultimaSincronizacaoNuvem: resultado.dataHora || new Date().toLocaleString('pt-BR'),
      }));

      return resultado;
    },
    [config, insumos, receitas, produtos, vendas]
  );

  const restaurarDeGoogleSheets = useCallback(
    async (customUrl?: string) => {
      const url = customUrl || config.googleScriptUrl;
      if (!url || !url.trim()) {
        throw new Error('Insira a URL do seu App da Web do Google Apps Script.');
      }

      const resultado = await restaurarBackupGoogleSheets(url);

      if (resultado.data) {
        const d = resultado.data;
        if (d.config) {
          setConfig({
            ...d.config,
            googleScriptUrl: url.trim(),
            ultimaSincronizacaoNuvem: resultado.updatedAt || new Date().toLocaleString('pt-BR'),
          });
        } else {
          setConfig((prev) => ({
            ...prev,
            googleScriptUrl: url.trim(),
            ultimaSincronizacaoNuvem: resultado.updatedAt || new Date().toLocaleString('pt-BR'),
          }));
        }

        if (Array.isArray(d.insumos)) setInsumos(d.insumos);
        if (Array.isArray(d.receitas)) setReceitas(d.receitas);
        if (Array.isArray(d.produtos)) setProdutos(d.produtos);
        if (Array.isArray(d.vendas)) setVendas(d.vendas);

        return {
          success: true,
          message: 'Dados restaurados com sucesso da planilha!',
          updatedAt: resultado.updatedAt,
        };
      }

      throw new Error('Nenhum dado válido retornado da planilha.');
    },
    [config.googleScriptUrl]
  );

  return (
    <AppContext.Provider
      value={{
        config,
        insumos,
        receitas,
        produtos,
        vendas,
        currentTheme,
        updateConfig,
        addCustoFixo,
        removeCustoFixo,
        addInsumo,
        updateInsumo,
        removeInsumo,
        addCompraInsumo,
        removeCompraInsumo,
        addReceita,
        updateReceita,
        removeReceita,
        addProduto,
        updateProduto,
        removeProduto,
        addVenda,
        updateVendaStatus,
        removeVenda,
        setTheme,
        exportBackup,
        importBackup,
        resetToDefaults,
        sincronizarComGoogleSheets,
        restaurarDeGoogleSheets,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
