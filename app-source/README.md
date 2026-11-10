# 🧁 DoceGestor App v2.5 — Gestão Inteligente para Confeitarias (PWA)

> **Aplicativo PWA completo, moderno e offline para confeitarias artesanais, doceiras e autônomos.**  
> Desenvolvido por **[Saulomgg](https://saulomgg.github.io)**.

---

## 🚀 Sobre o Projeto

O **DoceGestor** foi criado para resolver a maior dor de quem trabalha com confeitaria: **precificar corretamente, controlar custos e gerenciar pedidos sem perder tempo com planilhas complicadas**.

Funciona 100% no celular (instalável como aplicativo nativo via PWA) e no computador, grava tudo localmente sem necessidade de internet e conta com sincronização em nuvem gratuita via Google Sheets.

---

## ✨ Principais Funcionalidades

- **🧮 Calculadora de Preço de Venda Automatizada:**
  - Cálculo por peso ou unidade.
  - Custo real de insumos por grama/ml.
  - Rateio de hora trabalhada (mão de obra).
  - Custos fixos indiretos (gás, luz, água) e embalagens.
  - Margem de lucro garantida (Markup configurável).

- **📖 Fichas Técnicas & Receitas:**
  - Cadastro de rendimento, modo de preparo e foto/emoji.
  - Recálculo automático de custo quando o preço do insumo muda.
  - Conversão direta da receita para produto vendável.

- **📦 Estoque de Insumos & Histórico de Compras:**
  - Cadastro de ingredientes com embalagem comprada e preço pago.
  - Cálculo automático do custo unitário (R$/g, R$/ml, R$/un).
  - Alerta de compras e atualização de preços.

- **🛍️ Gestão de Vendas & Encomendas:**
  - Controle de pedidos de pronta entrega e encomendas com data/hora.
  - Cálculo de sinal e valor restante na entrega.
  - **Envio de comprovante/orçamento formatado diretamente no WhatsApp do cliente com 1 clique**.

- **📊 Balanço Financeiro & Métricas:**
  - Faturamento total, custos reais e lucro líquido do mês.
  - Ticket médio e ranking dos produtos mais vendidos.
  - Exportação de relatório mensal para WhatsApp.

- **☁️ Backup na Nuvem (Google Sheets + Apps Script):**
  - Sincronização entre múltiplos celulares/aparelhos sem pagar servidor.
  - Exportação e importação manual de arquivo `.json`.

- **📱 PWA 100% Offline & Instalável:**
  - Funciona sem internet através de Service Worker.
  - Botão de instalação direta no Android, iOS e Computador.

- **💖 Área de Apoio ao Projeto:**
  - Chave PIX oficial para doações voluntárias (`saulomg2@hotmail.com`).
  - Incentivo para doação ao fechar vendas ou saldo positivo.

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Vite 8**
- **Tailwind CSS 4**
- **Lucide Icons**
- **Canvas Confetti**
- **PWA (Vite PWA Plugin & Service Workers)**

---

## 📦 Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/docegestor.git
   cd docegestor
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Para gerar a versão de produção:**
   ```bash
   npm run build
   ```

---

## 💖 Apoie o Projeto

O DoceGestor é um projeto de código aberto e livre. Quando fizer uma boa venda ou fechar o mês no positivo, considere apoiar a evolução contínua da ferramenta:

- **Chave PIX (E-mail):** `saulomg2@hotmail.com`
- **Desenvolvedor:** [Saulomgg](https://saulomgg.github.io)

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
