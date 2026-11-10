/**
 * DoceGestor Authentication & Affiliate Client Service
 */

const STORAGE_AUTH_KEY = 'docegestor_auth_license_v3';
const STORAGE_REF_KEY = 'docegestor_ref_afiliado';

export interface UserSession {
  email: string;
  nome?: string;
  license_key: string;
  ref_code: string;
  isActivated: boolean;
  activatedAt: string;
}

export interface PixPaymentInfo {
  payment_id: string;
  qr_code: string;
  qr_base64: string;
}

export interface CadastroResponse {
  ok: boolean;
  order_id?: string;
  token?: string;
  amount?: number;
  pix?: PixPaymentInfo;
  paid?: boolean;
  status?: string;
  license_key?: string;
  msg?: string;
}

export interface StatusPixResponse {
  ok: boolean;
  status?: string;
  paid?: boolean;
  license_key?: string;
  email?: string;
  ref_code?: string;
  msg?: string;
}

export interface AfiliadoData {
  ok: boolean;
  username: string;
  email: string;
  nome: string;
  chave_pix: string;
  total_vendas: number;
  saldo: number;
  comissao_unitaria: number;
  minimo_saque: number;
  pode_sacar: boolean;
  link: string;
  msg?: string;
}

// Captura e armazena o código de indicação vindo da URL (?ref=...)
export function capturarRefDaUrl(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || urlParams.get('afiliado') || urlParams.get('r');
    if (refParam && refParam.trim()) {
      const cleanRef = refParam.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      localStorage.setItem(STORAGE_REF_KEY, cleanRef);
      return cleanRef;
    }
    return localStorage.getItem(STORAGE_REF_KEY) || null;
  } catch {
    return null;
  }
}

// Recupera o ref armazenado
export function getRefAtual(): string {
  try {
    return localStorage.getItem(STORAGE_REF_KEY) || '';
  } catch {
    return '';
  }
}

// Sessão local do usuário
export function getStoredAuth(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.isActivated || parsed.license_key)) {
      return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler auth', e);
  }
  return null;
}

export function saveAuthSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Erro ao salvar auth', e);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_AUTH_KEY);
  } catch (e) {
    console.error('Erro ao remover auth', e);
  }
}

// Helper para chamada ao Google Apps Script
async function callAppsScript(scriptUrl: string, action: string, data: any): Promise<any> {
  const url = (scriptUrl || '').trim();
  if (!url || !url.startsWith('http')) {
    throw new Error('URL do Google Apps Script não configurada.');
  }

  const payload = { action, ...data };

  // Usamos text/plain POST para contornar problemas de CORS preflight
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Servidor respondeu com código ${response.status}`);
  }

  return await response.json();
}

/**
 * 1. Cadastra e gera Pix de R$ 49,99
 */
export async function cadastrarComPix(
  scriptUrl: string,
  email: string,
  senha: string,
  nome: string,
  ref?: string
): Promise<CadastroResponse> {
  const refCode = ref || getRefAtual();
  return await callAppsScript(scriptUrl, 'cadastrar', {
    email: email.trim().toLowerCase(),
    senha,
    nome: nome.trim(),
    ref: refCode,
  });
}

/**
 * 2. Consulta o status do Pix (polling)
 */
export async function verificarStatusPix(
  scriptUrl: string,
  orderId: string,
  token: string
): Promise<StatusPixResponse> {
  return await callAppsScript(scriptUrl, 'status', {
    order_id: orderId,
    token,
  });
}

/**
 * 3. Fazer login com Email + Senha ou Chave DG-...
 */
export async function fazerLoginApp(
  scriptUrl: string,
  email?: string,
  senha?: string,
  chave?: string
): Promise<{ ok: boolean; status?: string; license_key?: string; email?: string; nome?: string; ref_code?: string; msg?: string }> {
  return await callAppsScript(scriptUrl, 'login', {
    email: email ? email.trim().toLowerCase() : undefined,
    senha,
    chave: chave ? chave.trim().toUpperCase() : undefined,
  });
}

/**
 * 4. Alterar Senha ou Chave
 */
export async function alterarSenhaOuChave(
  scriptUrl: string,
  email: string,
  senhaAtual: string,
  novaSenha?: string,
  novaChave?: string
): Promise<{ ok: boolean; msg: string }> {
  return await callAppsScript(scriptUrl, 'alterar_senha', {
    email: email.trim().toLowerCase(),
    senha_atual: senhaAtual,
    nova_senha: novaSenha,
    nova_chave: novaChave,
  });
}

/**
 * 5. Obter dados de afiliado (vendas, comissão, saldo de saque)
 */
export async function obterDadosAfiliado(
  scriptUrl: string,
  usernameOuEmail: string
): Promise<AfiliadoData> {
  return await callAppsScript(scriptUrl, 'dados_revendedor', {
    username: usernameOuEmail,
    email: usernameOuEmail,
  });
}

/**
 * 6. Salvar chave PIX do afiliado
 */
export async function salvarPixAfiliado(
  scriptUrl: string,
  username: string,
  chavePix: string
): Promise<{ ok: boolean; msg: string }> {
  return await callAppsScript(scriptUrl, 'salvar_pix_revendedor', {
    username,
    chave_pix: chavePix,
  });
}

/**
 * 7. Funções de Administração (Master Admin)
 */
export async function adminListarTudo(scriptUrl: string, adminToken: string): Promise<any> {
  return await callAppsScript(scriptUrl, 'admin_list', {
    admin_token: adminToken,
  });
}

export async function adminGerarChaveManual(
  scriptUrl: string,
  adminToken: string,
  email: string,
  nome?: string
): Promise<any> {
  return await callAppsScript(scriptUrl, 'admin_gerar_chave', {
    admin_token: adminToken,
    email,
    nome,
  });
}

export async function adminRevogarChave(
  scriptUrl: string,
  adminToken: string,
  licenseKey: string
): Promise<any> {
  return await callAppsScript(scriptUrl, 'admin_revogar_chave', {
    admin_token: adminToken,
    license_key: licenseKey,
  });
}
