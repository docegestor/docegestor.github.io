/**
 * DoceGestor Backend Engine - Google Apps Script & Cloudflare Integration
 * Script unificado, descentralizado e dedicado exclusivamente ao DoceGestor.
 * 
 * Recursos integrados:
 * 1. Checkout Pix Automático Mercado Pago (R$ 49,99)
 * 2. Autenticação e Criptografia Forte de Senhas (SHA-256 + Salt único)
 * 3. Geração e Troca de Chaves de Licença (DG-XXXX-XXXX-XXXX)
 * 4. Sistema Completo de Revendedores/Afiliados (Comissão R$ 29,90 por venda, meta saque R$ 150)
 * 5. Backup em Nuvem e Sincronização de Receitas, Insumos e Vendas
 * 6. Painel Admin para criação de chaves manuais (Mercado Livre / WhatsApp)
 */

export const DEFAULT_SCRIPT_CONFIG = {
  PRECO_APP: 49.99,
  COMISSAO_REVENDEDOR: 29.90,
  VALOR_MINIMO_SAQUE: 150.0,
  WHATSAPP_SAQUE: '5522988195993',
  SENHA_ADMIN_PADRAO: 'SOM9KEYSecretPassX1593570x*',
};

/**
 * Código COMPLETO e MINIFICADO do Google Apps Script.
 * Pronto para colar no editor do Apps Script da planilha do criador.
 */
export const DOCEGESTOR_APPS_SCRIPT_SOURCE = `/* DoceGestor Decentralized Engine v3.0 - By Saulomgg (saulomgg.github.io)
 * Unificado: Checkout Pix R$49,99 + Autenticacao + Afiliados R$29,90 + Backup Nuvem
 */
var S_USR="DoceGestor_Usuarios",S_REV="DoceGestor_Revendedores",S_BKP="DoceGestor_Backup",H_U=["order_id","public_token","email","nome","password_record","status","amount","payment_id","license_key","ref_afiliado","created_at","paid_at","updated_at","last_error"],H_R=["email","username","nome","chave_pix","total_vendas","saldo_disponivel","saldo_pago","data_cadastro","status"],MP_API="https://api.mercadopago.com",K_ALPH="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function _p(k,d){return PropertiesService.getScriptProperties().getProperty(k)||d||""}
function _price(){return Number(String(_p("PRICE","49.99")).replace(",","."))||49.99}
function _comm(){return Number(String(_p("COMMISSION","29.90")).replace(",","."))||29.90}
function _adminTk(){return _p("ADMIN_TOKEN","SOM9KEYSecretPassX1593570x*")}
function _ss(){var id=_p("SHEET_ID");return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet()}
function _j(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function _now(){return new Date().toISOString()}
function _hex(b){return b.map(function(x){return("0"+(x&255).toString(16)).slice(-2)}).join("")}
function _sh(n,h){var s=_ss(),x=s.getSheetByName(n);if(!x){x=s.insertSheet(n);x.appendRow(h);x.getRange(1,1,1,h.length).setFontWeight("bold").setBackground("#3D2314").setFontColor("#FFF8F0");x.setFrozenRows(1)}return x}
function _find(sh,col,val){var v=sh.getDataRange().getValues();for(var i=1;i<v.length;i++){if(String(v[i][col]).toLowerCase()===String(val).toLowerCase())return{row:i+1,data:v[i]}}return null}
function _hash(pw,s){var h=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s+pw,Utilities.Charset.UTF_8);for(var i=0;i<1000;i++)h=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,h.concat(Utilities.newBlob(s).getBytes()));return _hex(h)}
function _mkRec(pw){var s=Utilities.getUuid().replace(/-/g,"");return s+"$"+_hash(pw,s)}
function _chkRec(pw,rec){var p=String(rec||"").split("$");if(p.length!==2)return!1;return _hash(pw,p[0])===p[1]}
function _genKey(sh){var u=new Set(sh.getDataRange().getValues().map(function(r){return String(r[8])}));for(var t=0;t<30;t++){var b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,Utilities.getUuid()+Date.now()+t),s="";for(var i=0;i<16;i++)s+=K_ALPH[(b[i]&255)%32];var k="DG-"+s.match(/.{4}/g).join("-");if(!u.has(k))return k}throw new Error("Erro chave")}
function _uName(e){return String(e).split("@")[0].replace(/[^a-zA-Z0-9_-]/g,"").toLowerCase()||"afiliado"}
function doGet(e){return _route(e)}
function doPost(e){return _route(e)}
function _route(e){try{var p=(e&&e.parameter)||{},action=p.action||"",body={};if(e&&e.postData&&e.postData.contents){try{body=JSON.parse(e.postData.contents);if(body.action)action=body.action}catch(x){}}var d=Object.keys(body).length?body:(p.dados?JSON.parse(p.dados):p);
if(action==="cadastrar")return _j(apiCadastrar(d));
if(action==="status")return _j(apiStatus(d));
if(action==="login")return _j(apiLogin(d));
if(action==="alterar_senha")return _j(apiAlterarSenha(d));
if(action==="dados_revendedor")return _j(apiDadosRevendedor(d));
if(action==="salvar_pix_revendedor")return _j(apiSalvarPix(d));
if(action==="admin_list")return _j(apiAdminList(d));
if(action==="admin_gerar_chave")return _j(apiAdminGerar(d));
if(action==="admin_revogar_chave")return _j(apiAdminRevogar(d));
if(action==="backup_enviar")return _j(apiBackupEnviar(d));
if(action==="backup_restaurar")return _j(apiBackupRestaurar(d));
if(p.action==="webhook")return _j(apiWebhook(e));
return _j({ok:!0,app:"DoceGestor Engine v3.0",price:_price(),commission:_comm()})}catch(err){return _j({ok:!1,error:err.toString()})}}
function _mp(m,path,b){var opt={method:m,muteHttpExceptions:!0,headers:{Authorization:"Bearer "+_p("MP_ACCESS_TOKEN")}};if(b){opt.contentType="application/json";opt.payload=JSON.stringify(b);opt.headers["X-Idempotency-Key"]=Utilities.getUuid()}var r=UrlFetchApp.fetch(MP_API+path,opt),d={};try{d=JSON.parse(r.getContentText())}catch(x){}return{code:r.getResponseCode(),data:d}}
function apiCadastrar(d){var email=String(d.email||"").trim().toLowerCase(),senha=String(d.senha||""),nome=String(d.nome||"Confeiteira(o)").trim(),ref=String(d.ref||d.ref_afiliado||"").trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\\.[^\s@]{2,}$/.test(email))return{ok:!1,msg:"E-mail inválido."};if(senha.length<6)return{ok:!1,msg:"Senha deve ter no mínimo 6 caracteres."};var sh=_sh(S_USR,H_U),ex=_find(sh,2,email);if(ex){var row=ex.data;if(!_chkRec(senha,row[4]))return{ok:!1,msg:"E-mail já cadastrado. Insira a senha cadastrada para continuar."};if(row[5]==="PAID")return{ok:!0,paid:!0,status:"PAID",license_key:row[8],msg:"Este e-mail já tem licença liberada!"};var pix=null;if(row[7]){var old=_mp("get","/v1/payments/"+row[7]);if(old.code===200&&old.data.status==="pending"){var t=(old.data.point_of_interaction||{}).transaction_data||{};pix={payment_id:String(old.data.id),qr_code:t.qr_code||"",qr_base64:t.qr_code_base64||""}}}if(!pix)pix=_createPix(row[0],email);return{ok:!0,order_id:row[0],token:row[1],amount:_price(),pix:pix}}var ord="DG"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),tok=Utilities.getUuid().replace(/-/g,""),px=_createPix(ord,email),n=_now();sh.appendRow([ord,tok,email,nome,_mkRec(senha),"PENDING",_price(),px?px.payment_id:"", "",ref,n,"",n,""]);_ensureRevendedor(email,nome,ref);return{ok:!0,order_id:ord,token:tok,amount:_price(),pix:px}}
function _createPix(ord,email){var r=_mp("post","/v1/payments",{transaction_amount:_price(),description:"DoceGestor App - Licenca Vitalicia",payment_method_id:"pix",payer:{email:email},external_reference:ord});if(r.code>=300||!r.data.id)return null;var t=(r.data.point_of_interaction||{}).transaction_data||{};return{payment_id:String(r.data.id),qr_code:t.qr_code||"",qr_base64:t.qr_code_base64||""}}
function apiStatus(d){var ord=String(d.order_id||""),tok=String(d.token||""),sh=_sh(S_USR,H_U),f=_find(sh,0,ord);if(!f||String(f.data[1])!==tok)return{ok:!1,msg:"Pedido não encontrado."};if(f.data[5]!=="PAID"&&f.data[7]){_verifyPayment(f.data[7]);f=_find(sh,0,ord)}var paid=f.data[5]==="PAID";return{ok:!0,status:f.data[5],paid:paid,license_key:paid?f.data[8]:"",email:f.data[2],ref_code:_uName(f.data[2])}}
function _verifyPayment(pid){var r=_mp("get","/v1/payments/"+pid);if(r.code!==200||r.data.status!=="approved")return!1;var ord=r.data.external_reference;if(!ord)return!1;var sh=_sh(S_USR,H_U),f=_find(sh,0,ord);if(!f)return!1;if(f.data[5]==="PAID")return!0;var key=f.data[8]||_genKey(sh);sh.getRange(f.row,6).setValue("PAID");sh.getRange(f.row,9).setValue(key);sh.getRange(f.row,12).setValue(_now());sh.getRange(f.row,13).setValue(_now());var ref=f.data[9];if(ref)_creditCommission(ref,f.data[2],ord);return!0}
function _ensureRevendedor(email,nome,origemRef){var sh=_sh(S_REV,H_R),un=_uName(email),f=_find(sh,0,email);if(!f){sh.appendRow([email,un,nome||un,"",0,0,0,new Date().toLocaleString("pt-BR"),"ATIVO"])}return un}
function _creditCommission(refCode,compradorEmail,ord){try{var sh=_sh(S_REV,H_R),f=_find(sh,1,refCode);if(!f)f=_find(sh,0,refCode);if(!f)return;var c=_comm(),tot=Number(f.data[4]||0)+1,saldo=Number(f.data[5]||0)+c;sh.getRange(f.row,5).setValue(tot);sh.getRange(f.row,6).setValue(saldo);var logSh=_ss().getSheetByName("DoceGestor_Comissoes");if(!logSh){logSh=_ss().insertSheet("DoceGestor_Comissoes");logSh.appendRow(["Data","Revendedor","Comprador","Pedido","Comissao_R$"]);logSh.getRange(1,1,1,5).setFontWeight("bold")}logSh.appendRow([new Date().toLocaleString("pt-BR"),refCode,compradorEmail,ord,c])}catch(x){}}
function apiLogin(d){var email=String(d.email||"").trim().toLowerCase(),senha=String(d.senha||""),key=String(d.license_key||d.chave||"").trim().toUpperCase(),sh=_sh(S_USR,H_U);if(key&&!senha){var fK=_find(sh,8,key);if(fK&&fK.data[5]==="PAID")return{ok:!0,status:"PAID",license_key:fK.data[8],email:fK.data[2],nome:fK.data[3],ref_code:_uName(fK.data[2])}}var fE=_find(sh,2,email);if(!fE)return{ok:!1,msg:"E-mail não cadastrado."};if(!_chkRec(senha,fE.data[4]))return{ok:!1,msg:"Senha incorreta."};if(fE.data[5]!=="PAID"&&fE.data[7]){_verifyPayment(fE.data[7]);fE=_find(sh,2,email)}if(fE.data[5]!=="PAID")return{ok:!1,status:"PENDING",msg:"Pagamento pendente. Finalize o Pix."};_ensureRevendedor(email,fE.data[3]);return{ok:!0,status:"PAID",license_key:fE.data[8],email:fE.data[2],nome:fE.data[3],ref_code:_uName(fE.data[2])}}
function apiAlterarSenha(d){var email=String(d.email||"").trim().toLowerCase(),senhaAtual=String(d.senha_atual||""),novaSenha=String(d.nova_senha||""),novaChave=String(d.nova_chave||"").trim().toUpperCase(),sh=_sh(S_USR,H_U),f=_find(sh,2,email);if(!f)return{ok:!1,msg:"Usuário não encontrado."};if(!_chkRec(senhaAtual,f.data[4]))return{ok:!1,msg:"Senha atual incorreta."};if(novaSenha&&novaSenha.length>=6){sh.getRange(f.row,5).setValue(_mkRec(novaSenha))}if(novaChave&&novaChave.startsWith("DG-")){sh.getRange(f.row,9).setValue(novaChave)}sh.getRange(f.row,13).setValue(_now());return{ok:!0,msg:"Dados de acesso atualizados com sucesso!"}}
function apiDadosRevendedor(d){var u=String(d.username||d.ref_code||"").trim().toLowerCase(),e=String(d.email||"").trim().toLowerCase(),sh=_sh(S_REV,H_R),f=u?_find(sh,1,u):null;if(!f&&e)f=_find(sh,0,e);if(!f){if(e){var nome=String(d.nome||"");_ensureRevendedor(e,nome);f=_find(sh,0,e)}}if(!f)return{ok:!1,msg:"Revendedor não encontrado."};var un=f.data[1],totVendas=Number(f.data[4]||0),saldo=Number(f.data[5]||0),minSaque=Number(_p("MIN_WITHDRAW","150.00")),podeSacar=saldo>=minSaque;return{ok:!0,username:un,email:f.data[0],nome:f.data[2],chave_pix:f.data[3]||"",total_vendas:totVendas,saldo:saldo,comissao_unitaria:_comm(),minimo_saque:minSaque,pode_sacar:podeSacar,link:"https://docegestor.pages.dev/?ref="+un}}
function apiSalvarPix(d){var u=String(d.username||d.ref_code||"").trim().toLowerCase(),pix=String(d.chave_pix||"").trim(),sh=_sh(S_REV,H_R),f=_find(sh,1,u);if(!f)f=_find(sh,0,String(d.email||""));if(!f)return{ok:!1,msg:"Revendedor não localizado."};sh.getRange(f.row,4).setValue(pix);return{ok:!0,msg:"Chave PIX atualizada com sucesso!"}}
function apiAdminList(d){if(String(d.admin_token||"")!==_adminTk())return{ok:!1,msg:"Não autorizado."};var sU=_sh(S_USR,H_U).getDataRange().getValues().slice(1),sR=_sh(S_REV,H_R).getDataRange().getValues().slice(1);var users=sU.map(function(r){return{order_id:r[0],email:r[2],nome:r[3],status:r[5],amount:r[6],license_key:r[8],ref:r[9],created_at:r[10]}}),revs=sR.map(function(r){return{email:r[0],username:r[1],nome:r[2],pix:r[3],vendas:r[4],saldo:r[5],status:r[8]}});return{ok:!0,users:users,revendedores:revs}}
function apiAdminGerar(d){if(String(d.admin_token||"")!==_adminTk())return{ok:!1,msg:"Não autorizado."};var email=String(d.email||"").trim().toLowerCase(),nome=String(d.nome||"Cliente").trim(),sh=_sh(S_USR,H_U),key=_genKey(sh),ord="ML"+Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase(),n=_now();sh.appendRow([ord,Utilities.getUuid().replace(/-/g,""),email,nome,_mkRec("123456"),"PAID",_price(),"MANUAL",key,"admin",n,n,n,"Liberado Manual"]);_ensureRevendedor(email,nome);return{ok:!0,msg:"Chave gerada com sucesso!",license_key:key,email:email,senha_provisoria:"123456"}}
function apiAdminRevogar(d){if(String(d.admin_token||"")!==_adminTk())return{ok:!1,msg:"Não autorizado."};var key=String(d.license_key||"").trim(),sh=_sh(S_USR,H_U),f=_find(sh,8,key);if(!f)return{ok:!1,msg:"Chave não encontrada."};sh.getRange(f.row,6).setValue("REVOKED");sh.getRange(f.row,13).setValue(_now());return{ok:!0,msg:"Chave revogada com sucesso."}}
function apiBackupEnviar(d){var s=_ss(),b=_sh(S_BKP,["Data_Envio","Payload_JSON","Insumos","Receitas","Produtos","Vendas"]);var dt=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),"dd/MM/yyyy HH:mm:ss");b.getRange(2,1,1,6).setValues([[dt,JSON.stringify(d),(d.insumos||[]).length,(d.receitas||[]).length,(d.produtos||[]).length,(d.vendas||[]).length]]);return{ok:!0,success:!0,dataHora:dt}}
function apiBackupRestaurar(d){var s=_ss(),b=s.getSheetByName(S_BKP);if(!b)return{ok:!1,success:!1,message:"Vazio"};var c=b.getRange(2,2).getValue();return c?{ok:!0,success:!0,data:JSON.parse(c),updatedAt:b.getRange(2,1).getValue()}:{ok:!1,success:!1,message:"Vazio"}}
function apiWebhook(e){try{var p=JSON.parse(e.postData.contents),id=(p.data&&p.data.id)||p.id;if(id)_verifyPayment(String(id));return{ok:!0}}catch(x){return{ok:!1}}}`;
