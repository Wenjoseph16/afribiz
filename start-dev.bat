@echo off
cd /d %~dp0
title AfriBiz Dev Server

echo ============================================
echo        AfriBiz - Demarrage des serveurs
echo ============================================
echo.

:: Liberer les ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
if errorlevel 1 echo [OK] Ports liberes

:: Verifier que node_modules existe
if not exist "node_modules" (
    echo [INFO] Installation des dependances...
    call npm install
    if errorlevel 1 (
        echo [ERREUR] Echec de npm install
        pause
        exit /b 1
    )
)

:: Synchroniser la base de donnees
echo [INFO] Synchronisation de la base...
cd backend
call npx prisma db push --accept-data-loss
call npx prisma db seed
cd ..
echo.

echo [BACKEND] http://localhost:3001
echo [FRONTEND] http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arreter les deux serveurs.
echo.

:: Lancer les deux serveurs dans une seule fenetre
call npm run dev

echo.
echo [INFO] Les serveurs se sont arretes.
pause
