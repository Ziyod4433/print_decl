@echo off
chcp 65001 >nul
rem Установка и запуск проекта на Windows: двойной щелчок по этому файлу (или setup.bat в терминале).
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Не найден Node.js. Установите LTS-версию с https://nodejs.org и запустите setup.bat ещё раз.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Устанавливаю зависимости для проверок...
  call npm install --no-fund --no-audit
)
echo.
echo Запускаю проект: откроется браузер. Остановить - Ctrl+C.
call npm start
