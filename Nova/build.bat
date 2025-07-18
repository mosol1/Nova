@echo off
echo ========================================
echo          Nova Build Script
echo ========================================
echo.

echo Step 1: Cleaning solution...
if exist "Nova.sln" (
    dotnet clean "Nova.sln"
) else (
    echo Warning: Nova.sln not found - continuing anyway
)

echo.
echo Step 2: Restoring NuGet packages...
if exist "Nova.sln" (
    dotnet restore "Nova.sln"
) else (
    echo Warning: Nova.sln not found - restoring individual projects
    for %%p in (Nova.Shared Nova.Core Nova.Service Nova.Hub Nova.Updater) do (
        if exist "%%p\%%p.csproj" (
            echo Restoring %%p...
            dotnet restore "%%p\%%p.csproj"
        )
    )
)

echo.
echo Step 3: Building solution...
echo Building Nova.Shared...
if exist "Nova.Shared\Nova.Shared.csproj" (
    dotnet build "Nova.Shared\Nova.Shared.csproj" --configuration Release --no-restore
    if errorlevel 1 (
        echo ERROR: Failed to build Nova.Shared
        pause
        exit /b 1
    )
) else (
    echo ERROR: Nova.Shared project not found
    pause
    exit /b 1
)

echo Building Nova.Core...
if exist "Nova.Core\Nova.Core.csproj" (
    dotnet build "Nova.Core\Nova.Core.csproj" --configuration Release --no-restore
    if errorlevel 1 (
        echo ERROR: Failed to build Nova.Core
        pause
        exit /b 1
    )
) else (
    echo ERROR: Nova.Core project not found
    pause
    exit /b 1
)

echo Building Nova.Service...
if exist "Nova.Service\Nova.Service.csproj" (
    dotnet build "Nova.Service\Nova.Service.csproj" --configuration Release --no-restore
    if errorlevel 1 (
        echo ERROR: Failed to build Nova.Service
        pause
        exit /b 1
    )
) else (
    echo ERROR: Nova.Service project not found
    pause
    exit /b 1
)

echo Building Nova.Hub...
if exist "Nova.Hub\Nova.Hub.csproj" (
    dotnet build "Nova.Hub\Nova.Hub.csproj" --configuration Release --no-restore
    if errorlevel 1 (
        echo ERROR: Failed to build Nova.Hub
        pause
        exit /b 1
    )
) else (
    echo ERROR: Nova.Hub project not found
    pause
    exit /b 1
)

echo Building Nova.Updater...
if exist "Nova.Updater\Nova.Updater.csproj" (
    dotnet build "Nova.Updater\Nova.Updater.csproj" --configuration Release --no-restore
    if errorlevel 1 (
        echo ERROR: Failed to build Nova.Updater
        pause
        exit /b 1
    )
) else (
    echo ERROR: Nova.Updater project not found
    pause
    exit /b 1
)

echo.
echo ========================================
echo          BUILD SUCCESSFUL!
echo ========================================
echo.
echo Next steps:
echo 1. Install service: Nova.Service\bin\Release\NovaService.exe -install
echo 2. Start service:   Nova.Service\bin\Release\NovaService.exe -start
echo 3. Run Nova Hub:    Nova.Hub\bin\Release\NovaHub.exe
echo.
echo Press any key to continue...
pause > nul