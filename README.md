# AgencyOS

Sistema de gestão de agência com IA integrada.

## Stack
- React + Vite (front-end)
- Google Sheets (banco de dados)
- Railway (hospedagem)

## Como rodar localmente

```bash
npm install
cp .env.example .env
# Preencha o .env com suas credenciais
npm run dev
```

## Como configurar o Google Sheets

1. Crie uma planilha no Google Sheets
2. Crie duas abas: `clients` e `demands`
3. Na aba `clients`, adicione os cabeçalhos na linha 1:
   `id | name | drive | instagram | site | entrou | destino | saldoMax | saldo | createdAt`
4. Na aba `demands`, adicione os cabeçalhos na linha 1:
   `id | clientId | text | prazo | dest | done | createdAt`
5. Copie o ID da planilha (da URL) para `VITE_SHEET_ID` no `.env`
6. No Google Cloud Console, ative a Sheets API e gere uma API Key
7. Cole a API Key em `VITE_SHEETS_API_KEY` no `.env`
8. Torne a planilha pública (ou configure acesso via OAuth para produção)

## Deploy no Railway

1. Suba o código no GitHub
2. No Railway, crie um novo projeto a partir do GitHub
3. Adicione as variáveis de ambiente (`VITE_SHEET_ID` e `VITE_SHEETS_API_KEY`)
4. Railway detecta automaticamente o Vite e faz o build

## Senha de acesso

A senha padrão de todas as seções é `12`.
Para alterar, edite a constante `PASSWORD` em `src/lib/AppContext.jsx`.

## Estrutura do projeto

```
src/
  components/      # Componentes reutilizáveis
  pages/           # Páginas (Ops, Dashboard, Squad, CentrosCriativos)
  lib/             # AppContext (estado global) e sheets.js (integração Sheets)
```
