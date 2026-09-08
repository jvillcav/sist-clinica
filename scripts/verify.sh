#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/3] Backend: lint y pruebas"
cd "$ROOT_DIR/backend-clinica"
npm run check

echo "[2/3] Frontend: lint y compilación"
cd "$ROOT_DIR/frontend-clinica"
npm run check

echo "[3/3] ML: dependencias, compilación y pruebas"
cd "$ROOT_DIR/backend-clinica/ml-service"
venv/bin/pip check
venv/bin/python -m compileall -q app.py tests
venv/bin/python -m unittest discover -s tests -v

echo "Verificación completa."
