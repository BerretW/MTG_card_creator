@echo off
REM Tento skript spusti vyvojove prostredi pro MTG Card Creator.

echo.
echo =======================================================
echo ==         Spoustim MTG Card Creator (Dev Mode)      ==
echo =======================================================
echo.

REM Zkontrolujeme, zda existuje node_modules v serveru
IF NOT EXIST "server/node_modules" (
    echo Chybi node_modules ve slozce 'server'. Spoustim 'npm install'...
    cd server
    call npm install
    cd ..
)

REM Zkontrolujeme, zda existuje node_modules v klientu
IF NOT EXIST "client/node_modules" (
    echo Chybi node_modules ve slozce 'client'. Spoustim 'npm install'...
    cd client
    call npm install
    cd ..
)

echo Spoustim back-end server v novem okne...
REM Otevre nove okno, pojmenuje ho "Backend" a spusti server
start "Backend Server" cmd /k "cd server && npm start"

echo Spoustim front-end klienta v novem okne...
REM Otevre nove okno, pojmenuje ho "Frontend" a spusti Vite dev server
start "Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo Hotovo! Obe sluzby byly spusteny v samostatnych oknech.
echo Aplikace bude dostupna v prohlizeci na adrese, kterou vypise "Frontend Client" okno (obvykle http://localhost:5173).
echo.