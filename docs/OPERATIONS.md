# Operación y despliegue

## Arranque

1. Inicia ML.
2. Inicia la API y espera `MongoDB conectado`.
3. Inicia o publica el frontend.
4. Comprueba `/api/health`, `/api/ready` y `/health` de ML.

Usa `npm start` para API en producción. Coloca API y frontend detrás de HTTPS y un proxy inverso. No publiques directamente Flask.

## Variables sensibles

- Usa un `JWT_SECRET` aleatorio de 32 bytes o más.
- No versionar archivos `.env`.
- Rota credenciales de MongoDB y SMTP si fueron compartidas.
- Define CORS con orígenes exactos; no utilices `*` en producción.
- Desactiva `ML_DEBUG`.

Cambiar `JWT_SECRET` cierra todas las sesiones. Cambiar la contraseña de un usuario invalida sus tokens anteriores.

## MongoDB

Se requiere un replica set o Atlas por las transacciones. Antes de desplegar índices nuevos:

1. Realiza respaldo.
2. Busca citas históricas duplicadas.
3. Despliega en una ventana controlada.
4. Comprueba la creación de índices en `citas`, `solicitudCitas` y `expedientes`.

Respaldo y restauración deben realizarse con herramientas oficiales `mongodump` y `mongorestore`, probando periódicamente la restauración en un entorno aislado.

## Observabilidad

Los errores incluyen `requestId` y la API registra el mismo ID en errores internos. Registra códigos HTTP, latencia y disponibilidad sin guardar contraseñas, JWT, tokens de recuperación ni datos clínicos completos.

Alertas recomendadas:

- `/api/ready` distinto de 200.
- Tasa elevada de 401, 409, 429 o 500.
- Latencia ML superior a `ML_TIMEOUT_MS`.
- Stock negativo, que debe permanecer siempre en cero ocurrencias.
- Fallos de transacciones o creación de índices.

## Diagnóstico rápido

| Síntoma | Comprobación |
|---|---|
| API no arranca | `MONGO_URI`, `JWT_SECRET`, conectividad y réplica |
| Frontend no conecta | `VITE_API_URL` y CORS |
| Predicciones 503 | ML activo, `ML_SERVICE_URL` y timeout |
| Cita devuelve 409 | El horario o paciente fue reservado concurrentemente |
| Recuperación no envía correo | Configuración SMTP y contraseña de aplicación |
| Transacción no soportada | MongoDB debe ejecutarse como replica set |
