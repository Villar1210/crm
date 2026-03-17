# Arquitetura PDF (Hybrid Local + API)

Este documento descreve a arquitetura de ferramentas PDF implementada no sistema.

## 1. Visão Geral
O sistema utiliza uma abordagem **Híbrida**, priorizando ferramentas locais (Gratuitas) instaladas no servidor, mas com estrutura pronta para integrar APIs pagas (CloudConvert) ou Microsoft Graph no futuro.

### Stack Tecnológica
-   **Node.js / Express:** Backend API.
-   **pdf-lib (NPM):** Manipulação nativa de PDF (Merge, Split, Rotate, etc.). Rápido e leve.
-   **LibreOffice (Cli):** Conversão de formatos Office (Word, Excel, PPT) para PDF e vice-versa.
-   **Ghostscript (Cli):** Compressão avançada e Reparo de arquivos.
-   **Tesseract OCR (Cli):** Reconhecimento de texto (OCR).

## 2. Requisitos de Instalação (Servidor)
Para que todas as funções funcionem, o servidor Windows deve ter os seguintes softwares no PATH:

1.  **LibreOffice:** (`soffice` no terminal).
2.  **Ghostscript:** (`gswin64c` no terminal).
3.  **Tesseract:** (`tesseract` no terminal).

**Automação:**
Execute o script `scripts/setup_server.ps1` como Administrador para instalar tudo automaticamente.

## 3. Fluxo de Dados

### Conversão (Word -> PDF)
1.  Usuário envia `.docx`.
2.  Backend salva em `uploads/`.
3.  Backend chama `soffice --headless --convert-to pdf ...`.
4.  LibreOffice gera o PDF.
5.  Backend envia PDF para o usuário e deleta temporários.

### Backup / Fallback (CloudConvert)
O arquivo `server/src/services/pdfService.ts` contém uma função comentada `convertToPdfApi`.
Caso deseje ativar o CloudConvert (ex: se o LibreOffice falhar):
1.  Obtenha uma API Key no site CloudConvert.
2.  Descomente a função e adicione a chave.
3.  Altere o `pdfController` para chamar essa função no `catch` do erro local.

## 4. Integração Futura: Microsoft Graph API
Para replicar o motor exato da Microsoft (CloudConvert Style):

1.  **Azure AD:** Crie um App no Azure Portal com permissão `Files.ReadWrite.All`.
2.  **OneDrive:** O arquivo deve ser enviado para o OneDrive Business.
3.  **Chamada:**
    -   `PUT /drive/root:/nome.docx:/content` (Upload)
    -   `GET /drive/items/{id}/content?format=pdf` (Download convertido)
4.  **Implementação:** Use a SDK `@microsoft/microsoft-graph-client` no `pdfService.ts`.

## 5. Solução de Problemas
-   **Erro "Command not found" ou Timeout (500):** 
    -   Certifique-se de que os caminhos absolutos no `pdfService.ts` apontam para os executáveis corretos instalados.
    -   **Erro de "User Profile" (LibreOffice):** O sistema usa `C:\Temp` para perfis temporários para evitar conflitos de bloqueio de arquivo. Certifique-se de que o sistema pode escrever em `C:\`.
-   **Arquivos "Baixados como PDF" mas conteúdo incorreto:**
    -   Isso foi corrigido no frontend (`PDFTools.tsx`) ajustando a extensão do download. Se persistir, limpe o cache do navegador.
-   **Erro de Permissão:** O Node.js precisa de permissão de escrita nas pastas `uploads/` e `C:\Temp`.
-   **Arquivos Complexos:** Se o layout quebrar no LibreOffice, considere ativar a API Fallback para esses casos específicos.
