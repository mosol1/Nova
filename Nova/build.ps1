# Nova Build Script
param(
    [string]$Configuration = "Debug",
    [switch]$Clean,
    [switch]$Restore,
    [switch]$Rebuild,
    [switch]$Help
)

function Show-Help {
    Write-Host "Nova Build Script" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\build.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Configuration <config>  Build configuration (Debug/Release, default: Debug)"
    Write-Host "  -Clean                   Clean before building"
    Write-Host "  -Restore                 Restore NuGet packages only"
    Write-Host "  -Rebuild                 Clean and rebuild"
    Write-Host "  -Help                    Show this help"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\build.ps1                     # Build Debug"
    Write-Host "  .\build.ps1 -Configuration Release"
    Write-Host "  .\build.ps1 -Clean -Configuration Release"
    Write-Host "  .\build.ps1 -Rebuild"
}

function Write-StatusMessage {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "🔥 $Message" -ForegroundColor $Color
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-StatusMessage "Checking prerequisites..."
    
    # Check if dotnet is available
    try {
        $dotnetVersion = dotnet --version
        Write-Host "✅ .NET SDK: $dotnetVersion" -ForegroundColor Green
    }
    catch {
        Write-ErrorMessage ".NET SDK not found. Please install .NET Framework 4.8 SDK and .NET 6+ SDK"
        return $false
    }
    
    # Check if solution file exists
    if (-not (Test-Path "Nova.sln")) {
        Write-ErrorMessage "Nova.sln not found in current directory"
        return $false
    }
    
    Write-Host "✅ All prerequisites met" -ForegroundColor Green
    return $true
}

function Invoke-Clean {
    Write-StatusMessage "Cleaning solution..."
    try {
        dotnet clean Nova.sln --configuration $Configuration --verbosity minimal
        
        # Remove bin and obj directories
        Get-ChildItem -Path . -Recurse -Directory -Name "bin" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path . -Recurse -Directory -Name "obj" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        
        Write-Host "✅ Clean completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-ErrorMessage "Clean failed: $($_.Exception.Message)"
        return $false
    }
}

function Invoke-Restore {
    Write-StatusMessage "Restoring NuGet packages..."
    try {
        dotnet restore Nova.sln --verbosity minimal
        Write-Host "✅ Restore completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-ErrorMessage "Restore failed: $($_.Exception.Message)"
        return $false
    }
}

function Invoke-Build {
    Write-StatusMessage "Building Nova solution ($Configuration)..."
    try {
        dotnet build Nova.sln --configuration $Configuration --no-restore --verbosity minimal
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-ErrorMessage "Build failed: $($_.Exception.Message)"
        return $false
    }
}

function Show-BuildSummary {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "             BUILD SUMMARY" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    
    $binPath = ".\bin\$Configuration"
    if (Test-Path $binPath) {
        Write-Host "Output Directory: $binPath" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Built Executables:" -ForegroundColor Yellow
        
        $exeFiles = Get-ChildItem -Path $binPath -Filter "*.exe" -ErrorAction SilentlyContinue
        foreach ($exe in $exeFiles) {
            $size = [math]::Round($exe.Length / 1KB, 2)
            Write-Host "  📦 $($exe.Name) ($size KB)" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "Built Libraries:" -ForegroundColor Yellow
        $dllFiles = Get-ChildItem -Path $binPath -Filter "Nova.*.dll" -ErrorAction SilentlyContinue
        foreach ($dll in $dllFiles) {
            $size = [math]::Round($dll.Length / 1KB, 2)
            Write-Host "  📚 $($dll.Name) ($size KB)" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Install service: .\bin\$Configuration\NovaService.exe -install"
    Write-Host "  2. Start service:   .\bin\$Configuration\NovaService.exe -start"
    Write-Host "  3. Launch Hub:      .\bin\$Configuration\NovaHub.exe"
    Write-Host ""
}

# Main execution
try {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-Host ""
    Write-Host "🚀 Nova Ecosystem Build Script" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host "Configuration: $Configuration" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    $success = $true
    
    if ($Restore) {
        $success = Invoke-Restore
        if ($success) {
            Write-Host "✅ Package restore completed successfully!" -ForegroundColor Green
        }
        exit ($success ? 0 : 1)
    }
    
    if ($Clean -or $Rebuild) {
        $success = Invoke-Clean
        if (-not $success) { exit 1 }
    }
    
    if ($success) {
        $success = Invoke-Restore
    }
    
    if ($success) {
        $success = Invoke-Build
    }
    
    if ($success) {
        Show-BuildSummary
        Write-Host "🎉 Nova ecosystem built successfully!" -ForegroundColor Green
    } else {
        Write-ErrorMessage "Build failed. Check the output above for details."
        exit 1
    }
}
catch {
    Write-ErrorMessage "Unexpected error: $($_.Exception.Message)"
    exit 1
}