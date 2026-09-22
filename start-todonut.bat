@echo off
setlocal
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%"

echo Stopping anything listening on port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  echo Stopping PID %%P
  taskkill /PID %%P /F >nul 2>nul
)

echo Starting ToDonut on %URL%...
where pnpm.cmd >nul 2>nul
if errorlevel 1 (
  echo pnpm was not found. Install or enable pnpm, then run this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules\vite\package.json" (
  echo Installing ToDonut dependencies from pnpm-lock.yaml...
  call pnpm.cmd install --frozen-lockfile
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

start "ToDonut dev server" cmd /k "cd /d "%~dp0" && pnpm.cmd run dev -- --port %PORT%"

echo Waiting for the dev server...
timeout /t 3 /nobreak >nul

echo Opening %URL%...
start "" "%URL%"

endlocal
