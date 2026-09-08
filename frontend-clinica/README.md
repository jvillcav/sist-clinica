# Frontend de SIST-CLINICA

## Requisitos

Node.js 24.15.0 y npm 11.6.x. La versión está declarada en `.nvmrc` y `package.json`.

## Configuración

```bash
cp .env.example .env
npm ci
npm run dev
```

`VITE_API_URL` debe apuntar al prefijo `/api` del backend. Solo las variables con prefijo `VITE_` se incluyen en el navegador; nunca guardes secretos aquí.

## Verificación y producción

```bash
npm run lint
npm run build
npm run preview
```

El resultado de producción se genera en `dist/`.
