export type CategoriaInsumo =
  | 'laticinios'
  | 'chocolates'
  | 'farinhas'
  | 'acucares'
  | 'ovos'
  | 'embalagens'
  | 'frutas'
  | 'confeitos'
  | 'outros';

export interface CompraInsumo {
  id: string;
  data: string; // YYYY-MM-DD
  localFornecedor: string;
  precoPago: number;
  quantidadeComprada: string; // e.g. "1 kg", "395 g", "1 caixa com 27 un"
  precoUnitario: number; // Preço normalizado por unidade base
}

export interface Insumo {
  id: string;
  nome: string;
  categoria: CategoriaInsumo;
  unidade: string; // 'kg', 'g', 'L', 'ml', 'un', 'lata', 'pacote'
  precoAtual: number; // R$ por unidade
  estoqueAtual?: number;
  estoqueMinimo?: number;
  compras: CompraInsumo[];
}

export interface InsumoCalculo {
  id: string;
  nome: string;
  insumoId?: string; // Link para insumo da despensa se houver
  quantidade: number;
  unidade: string;
  custo: number;
}

export interface ReceitaInsumo {
  id: string;
  insumoId?: string;
  nome: string;
  quantidade: number;
  unidade: string;
  custo: number;
}

export interface Receita {
  id: string;
  nome: string;
  categoria: string;
  rendimentoQtd: number;
  rendimentoUnidade: string; // 'unidades', 'fatias', 'kg', 'potes'
  tempoPreparoHoras: number;
  tempoFornoMinutos?: number;
  validadeDias?: number;
  modoPreparo?: string;
  dicasArmazenamento?: string;
  insumos: ReceitaInsumo[];
  createdAt: string;
}

export interface CustoFixoPersonalizado {
  id: string;
  nome: string;
  valor: number; // R$ por receita/produção
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  receitaId?: string;
  rendimento: number;
  rendimentoUnidade: string;
  tempoMaoDeObraHoras: number;
  custoInsumos: number;
  custoFixosValor: number;
  custoFixosPctValor: number;
  custoMaoObra: number;
  custoTotal: number;
  custoUnitario: number;
  margemPct: number;
  markup: number;
  precoMinimo: number;
  precoCalculado: number; // Com margem %
  precoSugerido: number; // Com multiplicador
  insumos: InsumoCalculo[];
  createdAt: string;
}

export type StatusPedido = 'pendente' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado';

export interface ItemVenda {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  custoUnitario: number;
}

export interface Venda {
  id: string;
  tipo: 'pronta_entrega' | 'encomenda';
  clienteNome: string;
  clienteWhatsapp?: string;
  dataVenda: string; // YYYY-MM-DD
  dataEntrega?: string; // YYYY-MM-DD
  horaEntrega?: string; // HH:mm
  itens: ItemVenda[];
  valorTotal: number;
  valorEntrada: number; // Sinal pago
  valorRestante: number;
  custoTotalEstimado: number;
  lucroEstimado: number;
  formaPagamento: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'outro';
  status: StatusPedido;
  observacoes?: string;
  createdAt: string;
}

export interface ConfiguracaoApp {
  nomeConfeitaria: string;
  nomeResponsavel: string;
  whatsapp: string;
  chavePix: string;
  cidade: string;
  horaTrabalho: number; // R$/hora
  multiplicadorPadrao: number; // ex: 3.0
  custosFixosPct: number; // ex: 10%
  margemSegurancaPct: number; // 5% para quebras/desperdício
  custosFixosPersonais: CustoFixoPersonalizado[];
  metaVendasMensal: number; // R$
  temaId: string;
  premium: boolean;
  codigoAtivado: string;
  emailAtivado: string;
  ultimaVerificacao?: string;
  statusOnline?: string;
  googleScriptUrl?: string;
  ultimaSincronizacaoNuvem?: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  emoji: string;
  primary: string;
  primaryDark: string;
  bgPrimary: string;
  cardBg: string;
  textMain: string;
  textMuted: string;
  border: string;
  accent: string;
}
