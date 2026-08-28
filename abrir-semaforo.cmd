@echo off
rem ============================================================
rem  Abre o simulador do semáforo via HTTP estável (sem Live Server).
rem  O Live Server (VS Code) recarrega a página em loop no Windows;
rem  este atalho serve a pasta com o servidor PHP embutido (sem hot-reload),
rem  então a página fica 100% estável para a apresentação.
rem ============================================================
setlocal

set PROJ=%~dp0
set PORT=5501
set URL=http://127.0.0.1:%PORT%/application/simulador/

rem A porta pode estar ocupada por um servidor anterior. Tenta matar o antigo.
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >NUL 2>&1

rem Sobe o servidor em background apontando para a raiz do projeto.
start "" "C:\xampp\php\php.exe" -S 127.0.0.1:%PORT% "%PROJ%serve.php"

rem Espera o servidor ficar no ar e abre o navegador.
timeout /t 1 /nobreak >NUL
start "" "%URL%"

endlocal
