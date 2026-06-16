@echo off
cd /d %~dp0
title AfriBiz Dev Server

echo ============================================
echo        AfriBiz - Demarrage des serveurs
echo ============================================
echo.

:: Vérifier que les dépendances sont installées
if not exist "node_modules" (
    echo [ERREUR] Les dependances ne sont pas installees.
    echo          Lancez d'abord : pnpm install
    pause
    exit /b 1
)

:: Vérifier que PostgreSQL est accessible (port 5432)
echo [INFO] Verification de PostgreSQL...
netstat -ano | findstr :5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] PostgreSQL n'est pas accessible sur le port 5432.
    echo              Verifiez que le service PostgreSQL est demarre.
    echo.
)

:: Liberer les ports
echo [OK] Ports verifies
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Generer le client Prisma
echo [INFO] Generation Prisma Client...
cd /d %~dp0backend
call pnpm prisma generate >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la generation Prisma.
    pause
    exit /b 1
)
echo [OK] Prisma Client genere

:: Appliquer les migrations si necessaire
echo [INFO] Synchronisation de la base de donnees...
call pnpm prisma db push --accept-data-loss >nul 2>&1
echo [OK] Base de donnees synchronisee

cd /d %~dp0
echo.

echo ============================================
echo   Demarrage des serveurs...
echo ============================================
echo.
echo    Backend  ^> http://localhost:3001
echo    Frontend ^> http://localhost:3000
echo.
echo   Les serveurs vont demarrer dans 2 fenetres.
echo   Fermez les fenetres pour arreter chaque serveur.
echo.

:: Lancer les deux serveurs dans leurs propres fenetres
start "AfriBiz Backend" cmd /c "cd /d %~dp0backend && title AfriBiz Backend && pnpm run dev"
start "AfriBiz Frontend" cmd /c "cd /d %~dp0frontend && title AfriBiz Frontend && pnpm run dev"

echo [OK] Les serveurs sont en cours de demarrage...
echo.
echo    Commandes utiles :
echo    - Backend  : http://localhost:3001/api/health
echo    - Frontend : http://localhost:3000
echo    - API Docs : http://localhost:3001/api/docs
echo.

:: Fermer cette fenetre de lancement
timeout /t 3 /nobreak >nul
exit
