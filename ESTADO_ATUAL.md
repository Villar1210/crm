# Estado Atual do CRM Ivillar — 08/06/2026

## 🌐 URLs de Produção
- **Site público:** https://ivillar.com.br
- **Painel admin:** https://ivillar.com.br/admin
- **Login:** https://ivillar.com.br/login
- **VPS:** root@187.77.225.184

## 👤 Credenciais Super Admin
- **Email:** admin@ivillar.com.br
- **Senha:** Ivillar@2026
- **Role:** super_admin

## 🏗️ Infraestrutura
- **VPS Hostinger:** 187.77.225.184
- **Frontend:** /var/www/ivillar.com.br (Vite build → dist/)
- **Backend:** /var/www/crm/server (Node.js + Express + Prisma + SQLite)
- **PM2 processos:** ivillar-crm (id 4), crm-backend (id 5, porta 8081)
- **Nginx:** /etc/nginx/sites-available/ivillar.com.br (proxy /api → 8081)
- **Deploy automático:** GitHub Actions → push na main → build na VPS

## 📦 Repositório
- **GitHub:** https://github.com/Villar1210/crm
- **Token:** [salvo nos Secrets do GitHub Actions] (scope: repo + workflow)
- **Branch principal:** main
- **Local:** C:\laragon\www\ivillar\crm

## 🗄️ Banco de Dados
- **SQLite:** /var/www/crm/server/prisma/dev.db
- **Colunas adicionadas manualmente na VPS:**
  - User: settings, accountId, cpf, creci, mustChangePassword
  - Lead: tenantId
  - Property: tenantId
  - Task: tenantId
  - Person: tenantId
  - EmailCampaign: tenantId
  - SystemSettings: criada manualmente com id, branding, integrations, security, api, notifications, features

## 🔐 Sistema de Permissões
| Ação | Corretor (agent) | Super Admin |
|------|-----------------|-------------|
| Ver/criar/editar leads | ✅ | ✅ |
| Excluir leads | ❌ | ✅ |
| Ver/criar/editar imóveis | ✅ | ✅ |
| Excluir imóveis | ❌ | ✅ |
| Criar usuários | ❌ | ✅ |
| Excluir usuários | ❌ | ✅ |
| Configurações do site | 🔒 readOnly | ✅ |
| Dashboard completo | ❌ | ✅ |
| Painel Super Admin | ❌ | ✅ |

## ✅ O que está funcionando
- Login limpo em /login (sem #)
- Fluxo de primeira senha obrigatória (/change-password)
- Dashboard com dados reais do banco
- CRM com kanban, modal sem sobreposição do sidebar
- Criar novo lead salva nome, telefone e interesse
- Botão Salvar dados do cliente na aba Dados do Cliente
- Deploy automático via GitHub Actions
- Lazy loading (bundle 60% menor)
- Design system (índigo, animações, glassmorphism)
- Super Admin completo (perfil, usuários, login social, site, banco, segurança)
- Configurações do site salvas no banco via /api/settings/site
- Rodapé "Desenvolvido por Daniel Villar"

## ⚠️ Pendências / Problemas conhecidos
- Configurações do site (/admin/settings) — salvar ainda sendo testado
- WhatsApp não conectado (QR code pendente de scan)
- Backend às vezes sobe na porta 8081 em vez de 8080 (porta em uso)
- package-lock.json do backend desatualizado (usar npm install em vez de npm ci)
- GitHub Actions às vezes dá timeout SSH (Hostinger bloqueia IPs do runner)

## 🔧 Comandos úteis na VPS
```bash
# Reiniciar backend
cd /var/www/crm/server && npm run build && pm2 restart crm-backend

# Atualizar frontend
cd /var/www/ivillar.com.br && git fetch origin main && git reset --hard origin/main && VITE_API_URL=https://ivillar.com.br/api npm run build

# Ver logs do backend
pm2 logs crm-backend --lines 20

# Adicionar coluna ao banco
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$executeRawUnsafe('ALTER TABLE X ADD COLUMN y TEXT').then(()=>console.log('OK')).finally(()=>p.\$disconnect())"

# Ver porta do backend
pm2 show crm-backend | grep port
```

## 📁 Estrutura de arquivos chave
```
pages/admin/
  Dashboard.tsx      — Dashboard com dados reais
  CRM.tsx            — CRM Kanban (4671 linhas)
  SuperAdmin.tsx     — Painel super admin completo
  Settings.tsx       — Configurações (contato, redes sociais)
  AdminConfig.tsx    — Gestão de usuários

components/
  AdminLayout.tsx    — Layout do painel (sidebar, header)
  Layout.tsx         — Layout do site público

hooks/
  useSiteConfig.ts   — Hook que busca configs do banco

server/src/
  controllers/
    authController.ts      — Login, registro, troca de senha
    dashboardController.ts — Dados reais do dashboard
    leadController.ts      — CRUD de leads
    settingsController.ts  — Configurações do site (SQL direto)
    userController.ts      — CRUD de usuários + avatar
  routes/
    settingsRoutes.ts      — /api/settings/site protegido
    leadRoutes.ts          — DELETE protegido (super_admin)
    userRoutes.ts          — DELETE/POST protegido (super_admin)
```
