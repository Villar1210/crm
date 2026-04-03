#!/usr/bin/env bash
# =============================================================================
# security-fix.sh — Correções automáticas de segurança CRM Ivillar
# Executa: bash scripts/security-fix.sh (a partir da raiz do repositório)
# =============================================================================

set -euo pipefail

# ── Resolver Node.js no Windows/Git Bash/WSL ─────────────────────────────────
# Detecta o ambiente e localiza o Node.js de forma robusta.

NODE_CMD=""

# Função: testa se um binário executa de verdade (não só existe no PATH)
_try_node() {
    local bin="$1"
    if [[ -x "${bin}" ]] && "${bin}" --version >/dev/null 2>&1; then
        NODE_CMD="${bin}"
        return 0
    fi
    return 1
}

# 1. Tentativa direta (PATH normal já tem o node)
if command -v node >/dev/null 2>&1 && node --version >/dev/null 2>&1; then
    NODE_CMD="node"
fi

# 2. Se falhou, detectar ambiente e procurar em caminhos conhecidos
if [[ -z "${NODE_CMD}" ]]; then
    IS_WSL=false
    IS_GITBASH=false
    [[ -f /proc/version ]] && grep -qi microsoft /proc/version 2>/dev/null && IS_WSL=true
    [[ "${OSTYPE:-}" == "msys" || "${OSTYPE:-}" == "cygwin" ]] && IS_GITBASH=true

    if "${IS_WSL}"; then
        # WSL: Node Windows fica em /mnt/c/... (caminhos com espaço precisam de aspas)
        WSL_CANDIDATES=(
            "/mnt/c/Program Files/nodejs/node.exe"
            "/mnt/c/Program Files (x86)/nodejs/node.exe"
            "/mnt/c/Users/${USER}/AppData/Roaming/nvm/current/node.exe"
        )
        # Também procurar node nativo Linux (instalado dentro do WSL)
        for _dir in /usr/local/bin /usr/bin ~/.local/bin ~/.nvm/versions/node/*/bin; do
            WSL_CANDIDATES+=("${_dir}/node")
        done
        for _bin in "${WSL_CANDIDATES[@]}"; do
            _try_node "${_bin}" && break
        done
        unset WSL_CANDIDATES _bin _dir
    else
        # Git Bash / MSYS2: /c/ sem /mnt/
        GITBASH_CANDIDATES=(
            "/c/Program Files/nodejs/node.exe"
            "/c/Program Files (x86)/nodejs/node.exe"
            "${LOCALAPPDATA:-}/Programs/nodejs/node.exe"
            "${APPDATA:-}/nvm/current/node.exe"
        )
        for _bin in "${GITBASH_CANDIDATES[@]}"; do
            _try_node "${_bin}" && break
        done
        unset GITBASH_CANDIDATES _bin
    fi
fi

unset -f _try_node IS_WSL IS_GITBASH 2>/dev/null || true

# ── Cores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ──────────────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[AVISO]${NC} $*"; }
error()   { echo -e "${RED}[ERRO]${NC}  $*" >&2; }
step()    { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
ask()     { echo -e "${YELLOW}[?]${NC}     $*"; }

abort() {
    error "$1"
    exit 1
}

confirm() {
    local msg="$1"
    local answer
    ask "${msg} [s/N]: "
    read -r answer
    [[ "${answer,,}" == "s" || "${answer,,}" == "sim" ]]
}

# ── Verificar diretório raiz do projeto ──────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVER_DIR="${REPO_ROOT}/server"
ENV_FILE="${SERVER_DIR}/.env"
ENV_EXAMPLE="${SERVER_DIR}/.env.example"
GITIGNORE="${REPO_ROOT}/.gitignore"
LOG_FILE="${REPO_ROOT}/scripts/security-fix.log"

cd "${REPO_ROOT}"

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     CRM Ivillar — Script de Correção de Segurança        ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
warn "Este script irá modificar arquivos e o histórico do Git."
warn "Certifique-se de ter um backup antes de continuar."
echo ""

if ! confirm "Deseja continuar?"; then
    info "Operação cancelada pelo usuário."
    exit 0
fi

# ── Pré-requisitos ───────────────────────────────────────────────────────────
step "VERIFICANDO PRÉ-REQUISITOS"

CRYPTO_BACKEND=""

if [[ -n "${NODE_CMD}" ]]; then
    CRYPTO_BACKEND="node"
    NODE_VERSION=$("${NODE_CMD}" --version | sed 's/v//' | cut -d. -f1)
    if [[ "${NODE_VERSION}" -lt 16 ]]; then
        warn "Node.js $("${NODE_CMD}" --version) encontrado mas é antigo (mínimo 16)."
        NODE_CMD=""
        CRYPTO_BACKEND=""
    fi
fi

# Fallback: openssl (disponível em WSL/Linux/macOS/Git Bash)
if [[ -z "${CRYPTO_BACKEND}" ]]; then
    if command -v openssl >/dev/null 2>&1; then
        CRYPTO_BACKEND="openssl"
        warn "Node.js não encontrado — usando openssl para gerar segredos (igualmente seguro)."
    else
        error "Nem Node.js nem openssl foram encontrados."
        error ""
        if [[ -f /proc/version ]] && grep -qi microsoft /proc/version 2>/dev/null; then
            error "Ambiente: WSL — instale o Node.js nativo:"
            error "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
            error "  sudo apt-get install -y nodejs"
        else
            error "Ambiente: Git Bash — instale o Node.js em https://nodejs.org"
        fi
        abort "Instale Node.js ou openssl e tente novamente."
    fi
fi

command -v git >/dev/null 2>&1 || abort "Git não encontrado. Instale em https://git-scm.com"

# ── Função de geração de bytes aleatórios (agnóstica ao backend) ──────────────
gen_hex() {
    local bytes="${1:-32}"
    if [[ "${CRYPTO_BACKEND}" == "node" ]]; then
        "${NODE_CMD}" -e "process.stdout.write(require('crypto').randomBytes(${bytes}).toString('hex'))"
    else
        openssl rand -hex "${bytes}"
    fi
}

gen_password() {
    local length="${1:-32}"
    # Gera base64 aleatório, remove caracteres ambíguos, corta no tamanho
    openssl rand -base64 48 | tr -dc 'A-Za-z0-9!@#$%^&*' | head -c "${length}"
}

[[ -f "${SERVER_DIR}/package.json" ]] || abort "Diretório server/ não encontrado. Execute a partir da raiz do repositório."
[[ -d "${REPO_ROOT}/.git" ]] || abort "Não é um repositório Git."

if [[ "${CRYPTO_BACKEND}" == "node" ]]; then
    success "Node.js $("${NODE_CMD}" --version) ✓"
else
    success "openssl $(openssl version | awk '{print $2}') (modo fallback) ✓"
fi
success "Git $(git --version | awk '{print $3}') ✓"
success "Estrutura do projeto ✓"

# Iniciar log
mkdir -p "${SCRIPT_DIR}"
echo "=== security-fix.sh — $(date '+%Y-%m-%d %H:%M:%S') ===" > "${LOG_FILE}"

# ── PASSO 1: Gerar segredos ──────────────────────────────────────────────────
step "PASSO 1 — GERANDO SEGREDOS CRIPTOGRÁFICOS"

JWT_SECRET=$(gen_hex 64)
ADMIN_RESET_PASSWORD=$(gen_password 32)

success "JWT_SECRET gerado (128 hex chars)"
success "ADMIN_RESET_PASSWORD gerado (32 chars aleatórios)"
echo "  ${YELLOW}Guarde a senha de reset em local seguro:${NC}"
echo "  ${BOLD}ADMIN_RESET_PASSWORD = ${ADMIN_RESET_PASSWORD}${NC}"
echo ""

# Log sem expor valores (apenas confirmação)
echo "[PASSO 1] JWT_SECRET e ADMIN_RESET_PASSWORD gerados com sucesso" >> "${LOG_FILE}"

# ── PASSO 2: Token ConvertAPI ─────────────────────────────────────────────────
step "PASSO 2 — TOKEN CONVERTAPI"

warn "O token ConvertAPI anterior foi exposto no histórico do Git."
warn "Você precisa revogá-lo manualmente em: https://www.convertapi.com → Dashboard → API Keys"
echo ""
ask "Cole o NOVO token ConvertAPI (ou pressione Enter para deixar em branco): "
read -r CONVERT_API_SECRET

if [[ -z "${CONVERT_API_SECRET}" ]]; then
    warn "ConvertAPI token deixado em branco. Lembre-se de atualizar o .env depois."
    CONVERT_API_SECRET="SUBSTITUA_PELO_NOVO_TOKEN_CONVERTAPI"
fi

echo "[PASSO 2] ConvertAPI token processado" >> "${LOG_FILE}"

# ── PASSO 3: Escrever .env ────────────────────────────────────────────────────
step "PASSO 3 — CRIANDO ARQUIVO .env"

# Detectar ALLOWED_ORIGINS existente se .env já existe
EXISTING_ORIGINS="http://localhost:5173,http://localhost:3001"
if [[ -f "${ENV_FILE}" ]]; then
    ORIG=$(grep '^ALLOWED_ORIGINS=' "${ENV_FILE}" | cut -d= -f2- || true)
    [[ -n "${ORIG}" ]] && EXISTING_ORIGINS="${ORIG}"
    info "Arquivo .env existente encontrado — será substituído."
fi

cat > "${ENV_FILE}" << EOF
# ============================================================
# .env — CRM Ivillar
# Gerado automaticamente por security-fix.sh em $(date '+%Y-%m-%d %H:%M:%S')
# NUNCA commite este arquivo no Git
# ============================================================

# JWT — Gerado automaticamente (128 hex chars)
JWT_SECRET=${JWT_SECRET}

# Senha do endpoint de reset de banco
ADMIN_RESET_PASSWORD=${ADMIN_RESET_PASSWORD}

# ConvertAPI — Obtenha em https://www.convertapi.com
CONVERT_API_SECRET=${CONVERT_API_SECRET}

# Banco de dados (SQLite)
DATABASE_URL=file:./dev.db

# Servidor
PORT=3001
NODE_ENV=development

# Origins permitidos pelo CORS (separados por vírgula)
ALLOWED_ORIGINS=${EXISTING_ORIGINS}
EOF

success ".env criado em ${ENV_FILE}"
echo "[PASSO 3] .env criado com sucesso" >> "${LOG_FILE}"

# Verificar permissões (somente owner pode ler)
chmod 600 "${ENV_FILE}"
success "Permissões do .env definidas como 600 (somente dono)"

# ── PASSO 4: Garantir .gitignore ──────────────────────────────────────────────
step "PASSO 4 — VERIFICANDO .gitignore"

add_gitignore_entry() {
    local pattern="$1"
    local file="$2"
    if ! grep -qF "${pattern}" "${file}" 2>/dev/null; then
        echo "${pattern}" >> "${file}"
        success "Adicionado '${pattern}' ao ${file}"
    else
        info "'${pattern}' já está no ${file}"
    fi
}

add_gitignore_entry ".env"          "${GITIGNORE}"
add_gitignore_entry ".env.local"    "${GITIGNORE}"
add_gitignore_entry "server/.env"   "${GITIGNORE}"

echo "[PASSO 4] .gitignore verificado" >> "${LOG_FILE}"

# ── PASSO 5: Remover .env do tracking atual ───────────────────────────────────
step "PASSO 5 — REMOVENDO .env DO TRACKING GIT"

TRACKED_ENV=$(git ls-files --error-unmatch server/.env 2>/dev/null || true)
if [[ -n "${TRACKED_ENV}" ]]; then
    git rm --cached server/.env
    success "server/.env removido do tracking"
else
    info "server/.env já não está sendo rastreado pelo Git"
fi

echo "[PASSO 5] .env removido do tracking" >> "${LOG_FILE}"

# ── PASSO 6: Limpar histórico do Git ─────────────────────────────────────────
step "PASSO 6 — LIMPANDO HISTÓRICO DO GIT"

warn "O arquivo server/.env foi commitado anteriormente e o token antigo"
warn "ainda está no histórico. Isso exige reescrita do histórico Git."
warn ""
warn "CONSEQUÊNCIA: o 'git push --force' será necessário."
warn "Se outros colaboradores usam este repositório, eles precisarão"
warn "fazer 'git clone' novamente após esta operação."
echo ""

if confirm "Deseja limpar o histórico Git agora? (recomendado)"; then
    info "Reescrevendo histórico — pode demorar alguns segundos..."

    # Verificar se há commits para reescrever
    if git log --all --full-history -- "server/.env" 2>/dev/null | grep -q "commit"; then

        # Criar backup da branch atual
        CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
        git branch "backup-before-security-fix-$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

        git filter-branch --force --index-filter \
            'git rm --cached --ignore-unmatch server/.env' \
            --prune-empty --tag-name-filter cat -- --all 2>> "${LOG_FILE}"

        # Limpar referências antigas
        git for-each-ref --format="delete %(refname)" refs/original 2>/dev/null \
            | git update-ref --stdin 2>/dev/null || true
        git reflog expire --expire=now --all 2>/dev/null
        git gc --prune=now --aggressive 2>> "${LOG_FILE}"

        success "Histórico Git limpo — server/.env removido de todos os commits"
        echo "[PASSO 6] Histórico reescrito com sucesso" >> "${LOG_FILE}"

        # ── PASSO 7: Push forçado ─────────────────────────────────────────────
        step "PASSO 7 — PUSH PARA O GITHUB"

        REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
        if [[ -z "${REMOTE_URL}" ]]; then
            warn "Nenhum remote 'origin' configurado. Pulando push."
        else
            info "Remote: ${REMOTE_URL}"
            echo ""
            warn "O push forçado irá reescrever o histórico no GitHub."

            if confirm "Deseja fazer git push --force agora?"; then
                git push origin --force --all 2>&1 | tee -a "${LOG_FILE}"
                git push origin --force --tags 2>&1 | tee -a "${LOG_FILE}" || true
                success "Push realizado com sucesso"
                echo "[PASSO 7] Push forçado realizado" >> "${LOG_FILE}"
            else
                warn "Push pulado. Execute manualmente quando pronto:"
                echo "  git push origin --force --all"
            fi
        fi

    else
        info "server/.env não encontrado no histórico — nada a limpar"
        echo "[PASSO 6] Nenhum commit com .env encontrado" >> "${LOG_FILE}"
    fi

else
    warn "Limpeza do histórico pulada."
    warn "O token antigo permanece no histórico. Execute manualmente:"
    echo ""
    echo "  git filter-branch --force --index-filter \\"
    echo "    'git rm --cached --ignore-unmatch server/.env' \\"
    echo "    --prune-empty --tag-name-filter cat -- --all"
    echo "  git push origin --force --all"
    echo ""
    echo "[PASSO 6] Limpeza de histórico pulada pelo usuário" >> "${LOG_FILE}"
fi

# ── PASSO 8: Commit das correções de código ───────────────────────────────────
step "PASSO 8 — COMMITANDO CORREÇÕES DE CÓDIGO"

# Verificar se há mudanças staged ou unstaged
CHANGED=$(git status --porcelain 2>/dev/null | grep -v "server/.env" || true)
if [[ -n "${CHANGED}" ]]; then
    info "Arquivos modificados pelas correções de segurança:"
    git status --short | grep -v "server/.env" || true
    echo ""

    if confirm "Deseja commitar as correções de segurança?"; then
        git add \
            server/src/controllers/authController.ts \
            server/src/controllers/systemController.ts \
            server/src/routes/authRoutes.ts \
            server/src/routes/systemRoutes.ts \
            server/src/routes/leadRoutes.ts \
            server/src/middleware/auth.ts \
            server/src/index.ts \
            server/.env.example \
            server/package.json \
            server/package-lock.json \
            services/api.ts \
            .gitignore \
            2>/dev/null || true

        git commit -m "$(cat <<'EOF'
security: corrige vulnerabilidades críticas identificadas em auditoria

- Remove JWT_SECRET fallback fraco (dev-secret-123) — servidor aborta se não configurado
- Remove senha hardcoded 'admin' do endpoint de reset de banco
- Remove fallback '123456' no login do frontend
- Adiciona middleware de autenticação JWT com controle de roles
- Protege /api/system/reset-database com JWT + role super_admin
- Configura CORS com whitelist de origins via ALLOWED_ORIGINS
- Adiciona headers de segurança: CSP, X-Frame-Options, X-XSS-Protection
- Adiciona rate limiting: 10 tentativas/15min login, 5 registros/hora
- Adiciona validação de email, força de senha e nome no registro
- Restringe upload a tipos MIME permitidos com limite de 15MB
- Adiciona .env ao .gitignore
- Adiciona .env.example com todas as variáveis documentadas
- Reduz expiração do JWT de 1d para 8h

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
        success "Commit criado com sucesso"
        echo "[PASSO 8] Commit de segurança criado" >> "${LOG_FILE}"

        if confirm "Deseja fazer push do commit de correções?"; then
            git push origin "$(git symbolic-ref --short HEAD)" 2>&1 | tee -a "${LOG_FILE}"
            success "Push das correções realizado"
        fi
    else
        warn "Commit pulado. As correções estão aplicadas mas não commitadas."
    fi
else
    info "Nenhuma mudança pendente para commitar."
fi

# ── PASSO 9: Validação final ──────────────────────────────────────────────────
step "PASSO 9 — VALIDAÇÃO FINAL"

ERRORS=0

# Checar se .env existe e não está vazio
if [[ ! -f "${ENV_FILE}" ]]; then
    error ".env não encontrado em ${ENV_FILE}"
    ((ERRORS++))
else
    success ".env existe ✓"
fi

# Checar se JWT_SECRET está no .env e não é o valor padrão
ENV_JWT=$(grep '^JWT_SECRET=' "${ENV_FILE}" | cut -d= -f2- || true)
if [[ -z "${ENV_JWT}" ]]; then
    error "JWT_SECRET está vazio no .env"
    ((ERRORS++))
elif [[ "${ENV_JWT}" == "dev-secret-123" ]]; then
    error "JWT_SECRET ainda é o valor fraco padrão"
    ((ERRORS++))
elif [[ ${#ENV_JWT} -lt 32 ]]; then
    error "JWT_SECRET muito curto (${#ENV_JWT} chars) — mínimo 32"
    ((ERRORS++))
else
    success "JWT_SECRET configurado (${#ENV_JWT} chars) ✓"
fi

# Checar ADMIN_RESET_PASSWORD
ENV_RESET=$(grep '^ADMIN_RESET_PASSWORD=' "${ENV_FILE}" | cut -d= -f2- || true)
if [[ -z "${ENV_RESET}" ]]; then
    error "ADMIN_RESET_PASSWORD está vazio"
    ((ERRORS++))
elif [[ "${ENV_RESET}" == "admin" ]]; then
    error "ADMIN_RESET_PASSWORD ainda é 'admin'"
    ((ERRORS++))
else
    success "ADMIN_RESET_PASSWORD configurado ✓"
fi

# Checar se .env NÃO está sendo rastreado pelo Git
if git ls-files --error-unmatch server/.env > /dev/null 2>&1; then
    error "server/.env ainda está sendo rastreado pelo Git!"
    ((ERRORS++))
else
    success "server/.env não está rastreado pelo Git ✓"
fi

# Checar se .env está no .gitignore
if grep -qF "server/.env" "${GITIGNORE}" || grep -qF ".env" "${GITIGNORE}"; then
    success ".env está no .gitignore ✓"
else
    error ".env não encontrado no .gitignore"
    ((ERRORS++))
fi

# Checar se express-rate-limit está instalado
if [[ -d "${SERVER_DIR}/node_modules/express-rate-limit" ]]; then
    success "express-rate-limit instalado ✓"
else
    warn "express-rate-limit não encontrado em node_modules — rode 'npm install' no server/"
fi

# Checar se middleware/auth.ts existe
if [[ -f "${SERVER_DIR}/src/middleware/auth.ts" ]]; then
    success "middleware/auth.ts existe ✓"
else
    error "middleware/auth.ts não encontrado"
    ((ERRORS++))
fi

# ── Resultado final ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
if [[ ${ERRORS} -eq 0 ]]; then
    echo -e "${BOLD}${GREEN}║           TODAS AS CORREÇÕES APLICADAS COM SUCESSO       ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    success "Log completo em: ${LOG_FILE}"
    echo ""
    info "Próximos passos:"
    echo "  1. Revogue o token ConvertAPI antigo em https://www.convertapi.com"
    echo "  2. Inicie o servidor: cd server && npm run dev"
    echo "  3. Teste o login para confirmar que tudo funciona"
else
    echo -e "${BOLD}${RED}║     CONCLUÍDO COM ${ERRORS} ERRO(S) — VERIFIQUE ACIMA           ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    warn "Corrija os erros acima antes de fazer deploy."
    warn "Log completo em: ${LOG_FILE}"
fi

echo "[RESULTADO] ${ERRORS} erro(s) na validação final" >> "${LOG_FILE}"
echo "=== Fim: $(date '+%Y-%m-%d %H:%M:%S') ===" >> "${LOG_FILE}"

exit ${ERRORS}
