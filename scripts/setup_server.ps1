# Check for administrator privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "This script requires Administrator privileges. Please run as Administrator."
    exit
}

Write-Host "Starting PDF Environment Setup..." -ForegroundColor Cyan

# Function to check command availability
function Test-Command {
    param($command)
    try {
        $null = Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# 1. Install LibreOffice
if (Test-Command "soffice") {
    Write-Host "✅ LibreOffice is already installed." -ForegroundColor Green
} else {
    Write-Host "Installing LibreOffice..." -ForegroundColor Yellow
    winget install --id TheDocumentFoundation.LibreOffice --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -eq 0) { Write-Host "✅ LibreOffice installed successfully." -ForegroundColor Green }
    else { Write-Error "Failed to install LibreOffice." }
}

# 2. Install Ghostscript
if (Test-Command "gswin64c") {
    Write-Host "✅ Ghostscript is already installed." -ForegroundColor Green
} else {
    Write-Host "Installing Ghostscript..." -ForegroundColor Yellow
    winget install --id ArtifexSoftware.Ghostscript --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -eq 0) { Write-Host "✅ Ghostscript installed successfully." -ForegroundColor Green }
    else { Write-Error "Failed to install Ghostscript." }
}

# 3. Install Tesseract OCR
if (Test-Command "tesseract") {
    Write-Host "✅ Tesseract is already installed." -ForegroundColor Green
} else {
    Write-Host "Installing Tesseract OCR..." -ForegroundColor Yellow
    winget install --id UB-Mannheim.TesseractOCR --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -eq 0) { Write-Host "✅ Tesseract installed successfully." -ForegroundColor Green }
    else { Write-Error "Failed to install Tesseract." }
}

Write-Host "---------------------------------------------------"
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "Please restart your terminal/server to verify PATH updates."
