@echo off
setlocal

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%"

echo Stopping anything listening on port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  echo Stopping PID %%P
  taskkill /PID %%P /F >nul 2>nul
)

echo Starting ToDonut on %URL%...
start "ToDonut dev server" cmd /k "cd /d "%~dp0" && npm.cmd run dev -- --port %PORT%"

echo Waiting for the dev server...
timeout /t 3 /nobreak >nul

echo Opening %URL%...
start "" "%URL%"

endlocal
