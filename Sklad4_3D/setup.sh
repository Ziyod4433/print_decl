#!/usr/bin/env bash
# Установка и запуск проекта на macOS / Linux: ./setup.sh
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Не найден Node.js — установите LTS с https://nodejs.org"; exit 1; }
[ -d node_modules ] || npm install --no-fund --no-audit
echo "Запускаю проект: откроется браузер. Остановить — Ctrl+C."
npm start
