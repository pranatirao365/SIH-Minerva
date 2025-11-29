# Quick Start Script for Video Generation Module
# Run this from the project root

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Video Generation Module - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "📝 Please edit .env file and add your API keys:" -ForegroundColor Yellow
    Write-Host "   - GEMINI_API_KEY" -ForegroundColor White
    Write-Host "   - HF_TOKEN" -ForegroundColor White
    Write-Host "   - ELEVENLABS_API_KEY" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to continue after updating .env file..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.8 or higher" -ForegroundColor Red
    exit 1
}

# Check if Python packages are installed
Write-Host "Checking Python dependencies..." -ForegroundColor Cyan
$packagesToCheck = @("google.generativeai", "PIL", "cv2", "numpy")
$missingPackages = @()

foreach ($package in $packagesToCheck) {
    $result = python -c "import $package" 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host "⚠️  Some Python packages are missing" -ForegroundColor Yellow
    Write-Host "Installing required packages..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Python packages" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Python packages installed" -ForegroundColor Green
} else {
    Write-Host "✓ All Python packages found" -ForegroundColor Green
}

# Check if backend dependencies are installed
Write-Host "Checking backend dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies found" -ForegroundColor Green
}

# Create required directories
Write-Host "Creating required directories..." -ForegroundColor Cyan
$directories = @("output", "images", "audio", "animations", "icons")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "✓ Created $dir/" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the system:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. In a new terminal, start Expo:" -ForegroundColor White
Write-Host "   npx expo start" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Access the Video Generation Module:" -ForegroundColor White
Write-Host "   - Login as Safety Officer" -ForegroundColor Yellow
Write-Host "   - Navigate to Dashboard" -ForegroundColor Yellow
Write-Host "   - Click 'AI Video Generator'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to start the backend server now..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Start backend
Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Cyan
Push-Location backend
npm start
