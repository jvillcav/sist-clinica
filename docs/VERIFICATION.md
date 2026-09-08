# Verificación integral

Fecha de referencia: 2026-07-26.

## Cobertura automatizada

- Backend: lint estricto y 10 pruebas.
- ML: compilación, `pip check` y 11 pruebas.
- Frontend: lint sin errores y build de producción.
- Instalación Node: validada con `npm ci`.
- Dependencias npm: auditoría sin vulnerabilidades reportadas durante la revisión.
- CI: matriz para backend/frontend y trabajo independiente para Python.

Ejecutar:

```bash
./scripts/verify.sh
```

## Capacidades verificadas

- Sesiones expiradas, cuentas inactivas y cambios de contraseña/rol.
- Bloqueo de citas concurrentes e integridad de solicitudes.
- Transacciones de atención y descuento condicional de inventario.
- Errores normalizados sin stack ni mensajes internos.
- Paginación limitada.
- Configuración reproducible.
- Series mensuales, outliers, selección temporal e intervalos ML.
- Compilación de producción del frontend.

## Validaciones operativas pendientes antes de producción

- Rotar todas las credenciales reales.
- Ejecutar pruebas de restauración del respaldo.
- Probar creación de índices sobre una copia de datos productivos.
- Realizar pruebas de carga concurrente con MongoDB real.
- Validar SMTP con el proveedor definitivo.
- Configurar HTTPS, dominio, proxy, monitoreo y retención de logs.
- Revisar las advertencias no bloqueantes actuales de hooks y código no usado del frontend.
- Completar pruebas end-to-end por cada rol con datos anonimizados.

La suite local no reemplaza pruebas de carga, recuperación ante desastres ni validación de infraestructura.
