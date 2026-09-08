# SIST-CLINICA

El sistema se ejecuta como tres servicios: frontend React/Vite, API Node/Express y predicción Flask.

## Versiones requeridas

- Node.js 24.15.0
- npm 11 (incluido con Node 24)
- Python 3.12.3
- MongoDB compatible con transacciones (réplica o MongoDB Atlas)

## Configuración inicial

```bash
cp backend-clinica/.env.example backend-clinica/.env
cp frontend-clinica/.env.example frontend-clinica/.env
cp backend-clinica/ml-service/.env.example backend-clinica/ml-service/.env
```

Completa `MONGO_URI` y genera `JWT_SECRET` con al menos 32 caracteres. Los archivos `.env` no deben versionarse.

## Instalación reproducible

```bash
cd backend-clinica
npm ci

cd ../frontend-clinica
npm ci

cd ../backend-clinica/ml-service
python3.12 -m venv venv
venv/bin/python -m pip install --upgrade pip
venv/bin/pip install --requirement requirements.txt
```

En Windows, activa el entorno Python con `venv\Scripts\activate`.

## Ejecución

Abre tres terminales:

```bash
cd backend-clinica/ml-service
venv/bin/python app.py
```

```bash
cd backend-clinica
npm run dev
```

```bash
cd frontend-clinica
npm run dev
```

Direcciones predeterminadas:

- Frontend: http://localhost:5173
- API viva: http://localhost:3000/api/health
- API lista: http://localhost:3000/api/ready
- Swagger: http://localhost:3000/api/docs
- ML: http://127.0.0.1:5000/health

## Verificación automática

Desde la raíz del repositorio:

```bash
./scripts/verify.sh
```

El comando ejecuta lint y pruebas del backend, lint y build del frontend,
`pip check`, compilación y pruebas unitarias de ML. El mismo proceso se
ejecuta en CI mediante `.github/workflows/quality.yml`.

## Comprobaciones

```bash
cd backend-clinica && npm run check
cd frontend-clinica && npm run build
cd backend-clinica/ml-service && venv/bin/python -m compileall -q app.py
```

En producción configura HTTPS, `NODE_ENV=production`, orígenes CORS explícitos y un gestor de procesos.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Referencia de API](docs/API.md)
- [Operación y despliegue](docs/OPERATIONS.md)
- [Metodología ML](docs/ML.md)
- [Verificación integral](docs/VERIFICATION.md)
