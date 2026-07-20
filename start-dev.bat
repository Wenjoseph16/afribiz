@echo off
cd /d %~dp0
title AfriBiz Dev Server

setlocal enabledelayedexpansion

echo ============================================
echo        AfriBiz - Demarrage des serveurs
echo ============================================
echo.

:: ---------------------------------------------------------------------
:: 1. Verifier que npm est installe
:: ---------------------------------------------------------------------
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas installe.
    echo          Installez Node.js depuis https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo [OK] npm trouve (Node.js installe)

:: ---------------------------------------------------------------------
:: 2. Creer backend/.env si absent
:: ---------------------------------------------------------------------
if not exist "backend\.env" (
    echo [INFO] Creation de backend\.env...
    (
        echo # Backend environment variables
        echo NODE_ENV=development
        echo PORT=3001
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/afribiz
        for /f "delims=" %%a in ('powershell -NoProfile -Command "[Convert]::ToBase64String((Get-Random -Count 32 -InputObject (0..255)))"') do set "JWT_SECRET=%%a"
        echo JWT_SECRET=!JWT_SECRET!
        for /f "delims=" %%a in ('powershell -NoProfile -Command "[Convert]::ToBase64String((Get-Random -Count 32 -InputObject (0..255)))"') do set "JWT_REFRESH_SECRET=%%a"
        echo JWT_REFRESH_SECRET=!JWT_REFRESH_SECRET!
        echo JWT_EXPIRES_IN=15m
        echo JWT_REFRESH_EXPIRES_IN=7d
        echo FRONTEND_URL=http://localhost:3000
        echo SMTP_HOST=smtp.mailtrap.io
        echo SMTP_PORT=2525
        echo SMTP_USER=
        echo SMTP_PASS=
        echo SMTP_FROM=noreply@afribiz.com
        echo SMTP_FROM_NAME=AfriBiz
        echo MAX_LOGIN_ATTEMPTS=5
        echo ACCOUNT_LOCK_TIME_MS=900000
        echo OTP_LENGTH=6
        echo OTP_EXPIRES_IN_MINUTES=10
        echo OTP_MAX_ATTEMPTS=3
        echo BCRYPT_ROUNDS=10
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo AUTH_RATE_LIMIT_WINDOW_MS=900000
        echo AUTH_RATE_LIMIT_MAX_REQUESTS=5
        echo ALLOWED_ORIGINS=http://localhost:3000
        echo MAX_FILE_SIZE=5242880
        echo UPLOAD_DIR=./uploads
        echo SENTRY_DSN=
    ) > backend\.env
    echo [OK] backend\.env cree
    echo [INFO] Modifiez DATABASE_URL dans backend\.env si necessaire
    echo        (ex: postgresql://postgres:VOTRE_MDP@localhost:5432/afribiz)
    echo.
) else (
    echo [OK] backend\.env trouve
)

:: ---------------------------------------------------------------------
:: 3. Creer frontend/.env si absent
:: ---------------------------------------------------------------------
if not exist "frontend\.env" (
    echo [INFO] Creation de frontend\.env...
    (
        echo # Frontend environment variables
        echo NEXT_PUBLIC_API_URL=http://localhost:3001/api
        echo NEXT_PUBLIC_APP_NAME=AfriBiz
        echo NEXT_PUBLIC_APP_VERSION=1.0.0
        echo NEXT_PUBLIC_SENTRY_DSN=
    ) > frontend\.env
    echo [OK] frontend\.env cree
    echo.
) else (
    echo [OK] frontend\.env trouve
)

:: ---------------------------------------------------------------------
:: 4. Verifier les dependances
:: ---------------------------------------------------------------------
if not exist "node_modules" (
    echo [INFO] Installation des dependances...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation des dependances.
        pause
        exit /b 1
    )
    echo [OK] Dependances installees
) else (
    echo [OK] Dependances deja installees
)

:: ---------------------------------------------------------------------
:: 5. Verifier PostgreSQL
:: ---------------------------------------------------------------------
echo [INFO] Verification de PostgreSQL...
netstat -ano | findstr :5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] PostgreSQL n'est pas accessible sur le port 5432.
    echo              Verifiez que le service PostgreSQL est demarre.
    echo.
) else (
    echo [OK] PostgreSQL accessible
)

:: ---------------------------------------------------------------------
:: 6. Liberer les ports 3000 (frontend) et 3001 (backend)
:: ---------------------------------------------------------------------
echo [INFO] Liberation des ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Ports 3000 et 3001 liberes

:: ---------------------------------------------------------------------
:: 7. Generer le client Prisma
:: ---------------------------------------------------------------------
echo [INFO] Generation Prisma Client...
cd /d %~dp0backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la generation Prisma.
    echo          Verifiez que DATABASE_URL dans backend\.env est correct.
    pause
    exit /b 1
)
echo [OK] Prisma Client genere

:: ---------------------------------------------------------------------
:: 8. Synchroniser la base de donnees (push schema)
:: ---------------------------------------------------------------------
echo [INFO] Mise a jour de la base de donnees...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la synchronisation.
    echo          Verifiez PostgreSQL et DATABASE_URL.
    pause
    exit /b 1
)
echo [OK] Base de donnees synchronisee

:: ---------------------------------------------------------------------
:: 9. Seed (optionnel, ignore si deja fait)
:: ---------------------------------------------------------------------
echo [INFO] Seed de la base de donnees (config)...
cd /d %~dp0
call npm run db:seed
if %errorlevel% neq 0 (
    echo [ATTENTION] Le seed config a rencontre une erreur.
)
echo [INFO] Seed des donnees de test...
call npm run db:seed:test
if %errorlevel% neq 0 (
    echo [ATTENTION] Le seed test a rencontre une erreur.
)
echo [OK] Base de donnees initialisee

cd /d %~dp0
echo.

:: ---------------------------------------------------------------------
:: 10. Demarrer les serveurs
:: ---------------------------------------------------------------------
echo ============================================
echo      Demarrage des serveurs
echo ============================================
echo.
echo    Backend  ^> http://localhost:3001
echo    Frontend ^> http://localhost:3000
echo    API Docs ^> http://localhost:3001/api/docs
echo.
echo   Appuyez sur Ctrl+C pour arreter les deux serveurs.
echo.

npm run dev

:: ---------------------------------------------------------------------
:: Nettoyage apres arret
:: ---------------------------------------------------------------------
echo.
echo [INFO] Serveurs arretes.
pause
