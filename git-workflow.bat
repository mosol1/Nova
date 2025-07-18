@echo off
REM Nova Project Git Workflow Helper
REM Usage: git-workflow.bat [command]

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="status" goto status
if "%1"=="dev" goto dev
if "%1"=="release" goto release
if "%1"=="main" goto main
if "%1"=="push" goto push
if "%1"=="pull" goto pull
if "%1"=="commit" goto commit
goto help

:help
echo.
echo Nova Project Git Workflow Helper
echo ================================
echo.
echo Commands:
echo   status    - Show current Git status
echo   dev       - Switch to development branch
echo   release   - Switch to release branch
echo   main      - Switch to main branch
echo   push      - Push current branch to origin
echo   pull      - Pull latest changes from origin
echo   commit    - Stage all changes and commit with message
echo.
echo Usage Examples:
echo   git-workflow.bat dev
echo   git-workflow.bat commit "Add new feature"
echo   git-workflow.bat push
goto end

:status
echo.
echo === Current Git Status ===
git status
git branch --all
goto end

:dev
echo.
echo === Switching to Development Branch ===
git checkout development
git pull origin development
goto end

:release
echo.
echo === Switching to Release Branch ===
git checkout release/v1.0
git pull origin release/v1.0
goto end

:main
echo.
echo === Switching to Main Branch ===
git checkout main
git pull origin main
goto end

:push
echo.
echo === Pushing Current Branch ===
git push origin HEAD
goto end

:pull
echo.
echo === Pulling Latest Changes ===
git pull
goto end

:commit
if "%2"=="" (
    echo Error: Please provide a commit message
    echo Usage: git-workflow.bat commit "Your commit message"
    goto end
)
echo.
echo === Committing Changes ===
git add .
git commit -m "%~2"
echo Commit completed! Use 'git-workflow.bat push' to push to remote.
goto end

:end 