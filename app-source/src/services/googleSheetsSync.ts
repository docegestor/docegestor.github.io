/**
 * Google Apps Script Cloud Backup & Sync Service
 * Permite sincronizar os dados do DoceGestor com uma planilha do Google Sheets.
 */

export interface CloudBackupData {
  versao: string;
  dataHora: string;
  config: any;
  insumos: any[];
  receitas: any[];
  produtos: any[];
  vendas: any[];
}

/**
 * Código pronto para o Google Apps Script.
 * A doceira/confeiteira só precisa abrir o Google Sheets, ir em
 * Extensões > Apps Script, colar este código e clicar em Implantar > Nova Implantação (Web App).
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 *  DOCEGESTOR PWA — SCRIPT DE SINCRONIZAÇÃO E BACKUP NO GOOGLE SHEETS
 *  Desenvolvido por Saulomgg (saulomgg.github.io)
 * =========================================================================
 * 
 * INSTRUÇÕES RÁPIDAS DE INSTALAÇÃO:
 * 1. Crie uma nova planilha no Google Sheets (ex: "DoceGestor - Backup Confeitaria").
 * 2. No menu superior da planilha, clique em: Extensões > Apps Script.
 * 3. Apague todo o código que estiver lá e cole este código completo.
 * 4. Clique no ícone de disquete (Salvar) ou Ctrl+S.
 * 5. Clique no botão azul "Implantar" (topo direito) > "Nova implantação".
 * 6. Na engrenagem ao lado de "Selecione o tipo", escolha "App da Web".
 * 7. Preencha:
 *    - Descrição: DoceGestor Backup API
 *    - Executar como: Eu (seu email)
 *    - Quem tem acesso: Qualquer pessoa (Anyone)
 * 8. Clique em "Implantar", autorize o acesso com sua conta Google.
 * 9. Copie o link "URL do app da Web" (termina em /exec) e cole no seu DoceGestor!
 * =========================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var backupSheet = ss.getSheetByName("DoceGestor_Backup");
    
    if (!backupSheet) {
      return jsonResponse({
        success: false,
        message: "Nenhum backup encontrado nesta planilha ainda. Faça seu primeiro envio pelo app!"
      });
    }
    
    var jsonCell = backupSheet.getRange(2, 2).getValue();
    if (!jsonCell) {
      return jsonResponse({
        success: false,
        message: "Planilha de backup vazia."
      });
    }
    
    var parsed = JSON.parse(jsonCell);
    return jsonResponse({
      success: true,
      data: parsed,
      updatedAt: backupSheet.getRange(2, 1).getValue()
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

function doPost(e) {
  try {
    var postData = "";
    if (e && e.postData && e.postData.contents) {
      postData = e.postData.contents;
    } else {
      return jsonResponse({ success: false, message: "Nenhum dado enviado." });
    }
    
    var payload = JSON.parse(postData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Atualizar ou Criar Aba de Backup Geral (JSON)
    var backupSheet = ss.getSheetByName("DoceGestor_Backup");
    if (!backupSheet) {
      backupSheet = ss.insertSheet("DoceGestor_Backup");
      backupSheet.getRange(1, 1, 1, 6).setValues([[
        "Último Envio", "Dados_JSON", "Total Insumos", "Total Receitas", "Total Produtos", "Total Vendas"
      ]]);
      backupSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#3D2314").setFontColor("#FFF8F0");
    }
    
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    var qtdInsumos = (payload.insumos || []).length;
    var qtdReceitas = (payload.receitas || []).length;
    var qtdProdutos = (payload.produtos || []).length;
    var qtdVendas = (payload.vendas || []).length;
    
    backupSheet.getRange(2, 1, 1, 6).setValues([[
      nowStr, JSON.stringify(payload), qtdInsumos, qtdReceitas, qtdProdutos, qtdVendas
    ]]);
    
    // 2. Criar ou Atualizar Aba Visual de Vendas
    atualizarAbaVendas(ss, payload.vendas || []);
    
    // 3. Criar ou Atualizar Aba Visual de Insumos
    atualizarAbaInsumos(ss, payload.insumos || []);
    
    return jsonResponse({
      success: true,
      message: "Backup sincronizado com sucesso na nuvem!",
      dataHora: nowStr,
      totais: {
        insumos: qtdInsumos,
        receitas: qtdReceitas,
        produtos: qtdProdutos,
        vendas: qtdVendas
      }
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

function atualizarAbaVendas(ss, vendas) {
  var sheet = ss.getSheetByName("Vendas_DoceGestor");
  if (!sheet) {
    sheet = ss.insertSheet("Vendas_DoceGestor");
  } else {
    sheet.clear();
  }
  
  sheet.getRange(1, 1, 1, 9).setValues([[
    "Data", "Cliente", "WhatsApp", "Tipo", "Itens", "Valor Total (R$)", "Lucro (R$)", "Status", "Forma Pagamento"
  ]]).setFontWeight("bold").setBackground("#C85A6E").setFontColor("#FFFFFF");
  
  if (vendas.length === 0) return;
  
  var rows = vendas.map(function(v) {
    var itensTexto = (v.itens || []).map(function(i) {
      return i.quantidade + "x " + i.produtoNome;
    }).join(", ");
    
    return [
      v.dataVenda || "",
      v.clienteNome || "Cliente",
      v.clienteWhatsapp || "",
      v.tipo === "encomenda" ? "Encomenda" : "Pronta Entrega",
      itensTexto,
      v.valorTotal || 0,
      v.lucroEstimado || 0,
      v.status || "entregue",
      v.formaPagamento || "pix"
    ];
  });
  
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  sheet.autoResizeColumns(1, 9);
}

function atualizarAbaInsumos(ss, insumos) {
  var sheet = ss.getSheetByName("Insumos_DoceGestor");
  if (!sheet) {
    sheet = ss.insertSheet("Insumos_DoceGestor");
  } else {
    sheet.clear();
  }
  
  sheet.getRange(1, 1, 1, 5).setValues([[
    "Nome do Insumo", "Categoria", "Unidade", "Preço Atual (R$)", "Última Compra"
  ]]).setFontWeight("bold").setBackground("#D4A574").setFontColor("#3D2314");
  
  if (insumos.length === 0) return;
  
  var rows = insumos.map(function(i) {
    var ult = (i.compras && i.compras.length > 0) ? i.compras[0].data : "-";
    return [
      i.nome || "",
      i.categoria || "",
      i.unidade || "",
      i.precoAtual || 0,
      ult
    ];
  });
  
  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  sheet.autoResizeColumns(1, 5);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Envia o backup completo para a URL do Web App do Google Apps Script
 */
export async function enviarBackupGoogleSheets(
  scriptUrl: string,
  backupData: CloudBackupData
): Promise<{ success: boolean; message: string; dataHora?: string }> {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
    throw new Error('URL do Google Apps Script inválida. Insira a URL que termina em /exec');
  }

  const url = scriptUrl.trim();

  try {
    // Usamos text/plain para contornar restrições de CORS Preflight (OPTIONS)
    // O Apps Script receberá e fará o parse de e.postData.contents normalmente.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(backupData),
    });

    if (!response.ok) {
      throw new Error(`Servidor respondeu com status ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      return {
        success: true,
        message: result.message || 'Backup salvo no Google Sheets com sucesso!',
        dataHora: result.dataHora || new Date().toLocaleString('pt-BR'),
      };
    } else {
      throw new Error(result.error || result.message || 'Erro ao processar no Google Apps Script');
    }
  } catch (err: any) {
    console.error('Erro ao enviar backup para Google Sheets:', err);
    throw new Error(
      err.message || 'Falha ao conectar com o Google Sheets. Verifique a URL e a permissão do App da Web.'
    );
  }
}

/**
 * Restaura o backup mais recente do Google Sheets usando a URL do Apps Script
 */
export async function restaurarBackupGoogleSheets(
  scriptUrl: string
): Promise<{ success: boolean; data: any; updatedAt?: string }> {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
    throw new Error('URL do Google Apps Script inválida. Insira a URL que termina em /exec');
  }

  const url = scriptUrl.trim();

  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Servidor respondeu com status ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
        updatedAt: result.updatedAt,
      };
    } else {
      throw new Error(result.error || result.message || 'Nenhum dado retornado da planilha.');
    }
  } catch (err: any) {
    console.error('Erro ao restaurar backup do Google Sheets:', err);
    throw new Error(
      err.message || 'Falha ao buscar dados do Google Sheets. Verifique sua conexão e a URL.'
    );
  }
}
