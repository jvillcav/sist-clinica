# AUDITORÍA FINAL — SIST-CLINICA

**Proyecto:** Sistema web de gestión de pacientes, citas y expedientes clínicos con módulo de predicción de consumo de insumos mediante Machine Learning  
**Institución:** Clínica Odontológica Orellana, Shinahota, Cochabamba  
**Fecha de auditoría:** 12 de agosto de 2026  
**Alcance:** auditoría estática completa y pruebas locales seguras, sin cambios de dependencias ni acceso de escritura a MongoDB.

## 1. Resumen ejecutivo

El sistema presenta una arquitectura de tres servicios bien separada, autorización por rol aplicada en backend, protección de rutas en frontend, validaciones de inventario y concurrencia de citas mediante índices únicos. El servicio ML incorpora serie mensual, tratamiento de meses faltantes, ajuste de atípicos, validación temporal, comparación de modelos e intervalos aproximados. Son fortalezas relevantes para la defensa.

El resultado global es **APTO CON CONDICIONES PARA DEFENSA**. No se detectó evidencia estática de una vulnerabilidad crítica, pero quedan bloqueantes de verificación: Node/npm no están disponibles en el entorno de ejecución, la carpeta `.git` está vacía, no se pudo conectar de forma no invasiva a MongoDB ni probar credenciales/roles reales, el frontend no está configurado realmente como PWA y una prueba ML está desactualizada. Antes de la defensa deben completarse los P1 del plan.

No se mostraron secretos ni datos reales de pacientes. No se creó, modificó ni eliminó ningún registro.

## 2. Estado general del sistema

| Área | Estado | Diagnóstico |
|---|---|---|
| Arquitectura | APROBADA | Frontend, API y ML están separados y documentados. |
| Backend | NO EJECUTADA | Inspección estática favorable; Node/npm no disponible para lint/test/start. |
| Frontend | FALLIDA | React existe, pero `vite.config.js` no registra PWA, manifiesto ni service worker. |
| ML | FALLIDA | 10/11 tests pasan; 1 test contradice el comportamiento preliminar actual. |
| Seguridad | APROBADA (estática) | JWT, RBAC, hash, rate limit y errores seguros presentes; faltan pruebas dinámicas. |
| MongoDB | NO EJECUTADA | No se accedió a Atlas para evitar alteraciones y exposición de datos. |
| Git | FALLIDA | `.git` existe pero está vacía; `git status` no puede ejecutarse. |

## 3. Componentes y tecnologías encontradas

- `frontend-clinica`: React 19, Vite 8, React Router 7, Axios, Chart.js, jsPDF; páginas públicas y layouts para cuatro roles.
- `backend-clinica`: Node 24, Express 5, Mongoose 9, JWT, bcryptjs, CORS, rate limiting, Swagger y Nodemailer.
- `backend-clinica/ml-service`: Flask 3, pandas, NumPy, scikit-learn, SciPy y pruebas `unittest`.
- Modelos: Usuario, Paciente, Cita, SolicitudCita, Expediente, Insumo, ConsumoInsumo y Reabastecimiento.
- API real: `/api/health`, `/api/ready`, `/api/usuarios`, `/api/pacientes`, `/api/citas`, `/api/solicitudes-citas`, `/api/expedientes`, `/api/insumos`, `/api/consumos-insumos`, `/api/reportes`, `/api/predicciones`, `/api/reabastecimiento` y `/api/docs` ([app.js](backend-clinica/src/app.js#L58)).
- No existe `AGENTS.md`. Hay documentación en `docs/`, CI en `.github/workflows/quality.yml` y verificación en `scripts/verify.sh`.

## 4. Comandos ejecutados y resultados

| Comando | Resultado | Efecto sobre datos |
|---|---|---|
| Inventario con `find`, lectura con `nl/sed/grep` | Estructura y código inspeccionados | Solo lectura |
| `git status --short --branch` | Falló: `.git` no es repositorio válido | Ninguno |
| `./scripts/verify.sh` | Se detuvo: `npm: command not found` | Ninguno |
| `venv/bin/pip check` | `No broken requirements found` | Solo lectura |
| `python -m compileall -q app.py tests` | Compilación correcta | Solo caché Python |
| `python -m unittest discover -s tests -v` | 11 ejecutadas: 10 aprobadas, 1 fallida | Datos sintéticos en memoria |

## 5. Matriz de permisos real por rol

La matriz deriva de los middlewares de rutas, no de responsabilidades supuestas ([usuario.routes.js](backend-clinica/src/routes/usuario.routes.js#L95), [cita.routes.js](backend-clinica/src/routes/cita.routes.js#L37), [paciente.routes.js](backend-clinica/src/routes/paciente.routes.js#L36)).

| Recurso/acción | Administrador | Recepcionista | Odontólogo | Paciente | Público |
|---|---:|---:|---:|---:|---:|
| Usuarios CRUD/roles | Sí | No | No | No | Login/recuperación |
| Pacientes listar/detalle | Sí | Sí | Sí | Solo `mi-perfil` | No |
| Pacientes crear/editar | Sí | Sí | No | Solo perfil propio | No |
| Pacientes desactivar | Sí | No | No | No | No |
| Citas listar | Sí | Sí | Sí | Solo `mis-citas` | No |
| Citas crear | Sí | Sí | Sí | Sí | Solicitud pública separada |
| Confirmar/cancelar cita de personal | Sí | Sí | No | Solo propia | No |
| Reprogramar cita de personal | Sí | Sí | Sí | Solo propia | No |
| Expedientes listar/ver | Sí | No | Sí | Solo `mi-expediente` | No |
| Atención clínica completa | No | No | Sí | No | No |
| Editar expediente | No | No | Solo propietario (controlador) | No | No |
| Anular expediente | Sí | No | No | No | No |
| Insumos listar | Sí | Sí | Sí | No | No |
| Insumos crear/editar/reabastecer | Sí | No | No | No | No |
| Consumos listar | Sí | No | Propios | No | No |
| Consumo manual | Sí | No | Vía atención completa | No | No |
| Predicción/reabastecimiento | Sí | No | Sí | No | No |
| Reportes | Sí | Recepción/resumen | Propios/resumen | No | No |

## 6. Resultados de pruebas del administrador

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|
| ADM-01 | Autenticación | Administrador | Login/logout real | Acceso y cierre correctos | No probado sin credencial; login altera `ultimoAcceso` | NO EJECUTADA | [usuario.controller.js](backend-clinica/src/controllers/usuario.controller.js#L612) | Media |
| ADM-02 | Usuarios | Administrador | CRUD y roles | Solo administrador | Rutas restringidas estáticamente | APROBADA | [usuario.routes.js](backend-clinica/src/routes/usuario.routes.js#L119) | — |
| ADM-03 | Gestión | Administrador | Pacientes/citas/expedientes/insumos | Acceso autorizado | RBAC presente; operación real no ejecutada | NO EJECUTADA | [App.jsx](frontend-clinica/src/App.jsx#L60) | Media |
| ADM-04 | Predicción | Administrador | Consultar ML/reabastecimiento | Acceso autorizado | Rutas autorizadas; integración no ejecutada | NO EJECUTADA | [prediccion.routes.js](backend-clinica/src/routes/prediccion.routes.js#L31) | Alta |

## 7. Resultados de pruebas de la recepcionista

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|
| REC-01 | Pacientes | Recepcionista | Crear, buscar y editar | Permitido | RBAC correcto; flujo real no ejecutado | NO EJECUTADA | [paciente.routes.js](backend-clinica/src/routes/paciente.routes.js#L61) | Media |
| REC-02 | Citas | Recepcionista | Crear/confirmar/reprogramar/cancelar | Permitido con conflictos impedidos | Índices de minutos previenen cruces; no probado contra Atlas | NO EJECUTADA | [Cita.js](backend-clinica/src/models/Cita.js#L235) | Alta |
| REC-03 | Privilegios | Recepcionista | Administrar roles/expedientes | Debe rechazarse | Middleware no incluye rol | APROBADA | [usuario.routes.js](backend-clinica/src/routes/usuario.routes.js#L140) | — |

## 8. Resultados de pruebas del odontólogo

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|
| ODO-01 | Agenda | Odontólogo | Ver agenda propia | Solo citas correspondientes | Endpoint específico por rol; no probado con datos | NO EJECUTADA | [cita.routes.js](backend-clinica/src/routes/cita.routes.js#L56) | Alta |
| ODO-02 | Atención | Odontólogo | Expediente + consumo + cierre | Transacción íntegra | Implementación y ruta presentes; no ejecutada | NO EJECUTADA | [expediente.routes.js](backend-clinica/src/routes/expediente.routes.js#L36) | Alta |
| ODO-03 | Privilegios | Odontólogo | Usuarios/roles | Debe rechazarse | RBAC no autoriza | APROBADA | [usuario.routes.js](backend-clinica/src/routes/usuario.routes.js#L140) | — |
| ODO-04 | ML | Odontólogo | Predicción y reportes | Permitido | RBAC presente; integración no ejecutada | NO EJECUTADA | [prediccion.routes.js](backend-clinica/src/routes/prediccion.routes.js#L63) | Media |

## 9. Resultados de pruebas del paciente

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|
| PAC-01 | Perfil | Paciente | Ver/editar propios datos | Solo perfil propio | API no acepta ID en estas rutas | APROBADA | [paciente.routes.js](backend-clinica/src/routes/paciente.routes.js#L36) | — |
| PAC-02 | Citas | Paciente | Ver/cancelar/reprogramar propias | Solo registros propios | Endpoints propios presentes; control dinámico no probado | NO EJECUTADA | [cita.routes.js](backend-clinica/src/routes/cita.routes.js#L37) | Alta |
| PAC-03 | Expediente | Paciente | Ver historial propio | Sin ID ajeno | Endpoint `mi-expediente`; control dinámico no probado | NO EJECUTADA | [expediente.routes.js](backend-clinica/src/routes/expediente.routes.js#L65) | Alta |
| PAC-04 | IDOR | Paciente | Cambiar ID para acceder a otro | 403/404 | Rutas generales excluyen paciente; no hubo petición autenticada | NO EJECUTADA | [paciente.routes.js](backend-clinica/src/routes/paciente.routes.js#L124) | Alta |

## 10. Resultados del usuario no autenticado

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|---|
| PUB-01 | Frontend | Público | Inicio/servicios/nosotros/contacto/login | Acceso público | Rutas declaradas | APROBADA | [App.jsx](frontend-clinica/src/App.jsx#L52) | — |
| PUB-02 | Frontend | Público | URL privada manual | Redirección a login | `ProtectedRoute` valida expiración y rol | APROBADA | [ProtectedRoute.jsx](frontend-clinica/src/components/ProtectedRoute.jsx#L14) | — |
| PUB-03 | API | Público | API privada sin token | 401 | Middleware aplicado en todas las rutas privadas; no ejecutado por falta de Node | NO EJECUTADA | [auth.middleware.js](backend-clinica/src/middlewares/auth.middleware.js#L7) | Media |
| PUB-04 | Solicitudes | Público | Crear solicitud de cita | Permitido y validado | Ruta pública intencional; escritura no autorizada | NO EJECUTADA | [solicitudCita.routes.js](backend-clinica/src/routes/solicitudCita.routes.js#L31) | Media |

## 11. Resultados por módulo

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|
| MOD-01 | Pacientes | Personal | CI duplicado | Rechazo | Índice único definido; no probado en DB | NO EJECUTADA | [Paciente.js](backend-clinica/src/models/Paciente.js#L43) | Alta |
| MOD-02 | Pacientes | Personal | Email/contacto emergencia | Validación consistente | Email no es único ni validado en esquema; contacto permite campos parciales | FALLIDA | [Paciente.js](backend-clinica/src/models/Paciente.js#L62) | Media |
| MOD-03 | Citas | Todos autorizados | Cruces paciente/odontólogo | Rechazo concurrente | Dos índices únicos por minuto definidos | APROBADA | [Cita.js](backend-clinica/src/models/Cita.js#L235) | — |
| MOD-04 | Citas | Todos autorizados | Fecha pasada/estados | Rechazo/transición válida | Requiere prueba de controladores con DB | NO EJECUTADA | [Cita.js](backend-clinica/src/models/Cita.js#L146) | Alta |
| MOD-05 | Expedientes | Clínico | Historial y asociación | Integridad transaccional | Estructura presente; no ejecutada contra réplica | NO EJECUTADA | [ARCHITECTURE.md](docs/ARCHITECTURE.md#L31) | Alta |
| MOD-06 | Insumos | Administrador | Valores negativos | Rechazo | `min: 0` en stock, mínimo y costo | APROBADA | [Insumo.js](backend-clinica/src/models/Insumo.js#L63) | — |
| MOD-07 | Insumos | Administrador | Código duplicado | 409 | Índice único sparse; no probado en DB | NO EJECUTADA | [Insumo.js](backend-clinica/src/models/Insumo.js#L203) | Alta |
| MOD-08 | Consumo | Clínico | Consumo superior a stock | Rechazo atómico | Se requiere MongoDB transaccional; no ejecutado | NO EJECUTADA | [ARCHITECTURE.md](docs/ARCHITECTURE.md#L31) | Alta |
| MOD-09 | Reportes | Roles | Filtros/paginación | Resultados acotados | Utilidad limita a 100 y test pasó en memoria | APROBADA | [core.test.js](backend-clinica/test/core.test.js#L88) | — |

## 12. Auditoría específica del Machine Learning

El servicio no carga un artefacto preentrenado: entrena por solicitud sobre consumos agregados. Esta separación es coherente con historiales cambiantes, pero no existe persistencia/versionado de cada modelo entrenado. Las variables efectivamente usadas por el modelo son fecha/periodo, cantidad consumida e identidad/nombre del insumo; no se usan pacientes, tratamiento, especialidad, duración u odontólogo como variables predictoras.

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|
| ML-01 | Flask | Sistema | `/health` | 200 | 200 en cliente Flask | APROBADA | [test_app.py](backend-clinica/ml-service/tests/test_app.py#L138) | — |
| ML-02 | Flask | Sistema | Payload vacío | 400 controlado | 400 | APROBADA | [test_app.py](backend-clinica/ml-service/tests/test_app.py#L143) | — |
| ML-03 | Modelo | Sistema | Tendencia y horizonte | 3 periodos no negativos | Test aprobado | APROBADA | [test_app.py](backend-clinica/ml-service/tests/test_app.py#L24) | — |
| ML-04 | Modelo | Sistema | Historial insuficiente | Contrato consistente | Código devuelve estimación preliminar, test espera insuficiencia | FALLIDA | [app.py](backend-clinica/ml-service/app.py#L639), [test_app.py](backend-clinica/ml-service/tests/test_app.py#L38) | Media |
| ML-05 | Modelo | Sistema | Meses faltantes | Completar y advertir | Test aprobado | APROBADA | [test_app.py](backend-clinica/ml-service/tests/test_app.py#L69) | — |
| ML-06 | Modelo | Sistema | Outliers | Limitar solo entrenamiento | Test aprobado | APROBADA | [test_app.py](backend-clinica/ml-service/tests/test_app.py#L99) | — |
| ML-07 | Modelo | Sistema | Fuga temporal | Backtesting progresivo | Diseño documentado; no auditado con dataset real | NO EJECUTADA | [ML.md](docs/ML.md#L13) | Alta |
| ML-08 | Node-Flask | Sistema | Timeout/servicio caído | 503/mensaje claro | Timeout configurado; servicio integrado no ejecutado | NO EJECUTADA | [prediccion.controller.js](backend-clinica/src/controllers/prediccion.controller.js#L246) | Alta |
| ML-09 | Predicción | Administrador | Registros actuales | Resultado preliminar o definitivo honesto | No se consultó Atlas | NO EJECUTADA | Restricción de no alterar/exponer datos | Alta |

No se afirma precisión alguna. El código calcula MAE comparativo y calidad, pero las métricas actuales de producción no fueron obtenidas. El límite es 50.000 registros y 1–12 meses ([ML.md](docs/ML.md#L24)).

## 13. Seguridad

Fortalezas: JWT HS256 con issuer, audience y expiración; reconsulta de usuario; invalida token al cambiar rol/contraseña; bcrypt costo 12; contraseña excluida por defecto; rate limit; CORS por lista; límite JSON; cabeceras básicas; mensajes 5xx normalizados ([auth.middleware.js](backend-clinica/src/middlewares/auth.middleware.js#L15), [app.js](backend-clinica/src/app.js#L43)).

| ID | Módulo | Usuario/Rol | Prueba | Resultado esperado | Resultado obtenido | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|---|---|---|
| SEG-01 | JWT | Autenticado | Token inválido/vencido | 401 seguro | Lógica implementada; no ejecutada | NO EJECUTADA | [auth.middleware.js](backend-clinica/src/middlewares/auth.middleware.js#L27) | Alta |
| SEG-02 | Contraseña | Administrador | Alta sin contraseña | Secreto inicial fuerte | Usa CI como contraseña temporal | FALLIDA | [usuario.controller.js](backend-clinica/src/controllers/usuario.controller.js#L346) | Alta |
| SEG-03 | Sesión web | Todos | Persistencia segura | Reducir exposición a XSS | JWT se guarda en `localStorage` | FALLIDA | [axios.js](frontend-clinica/src/api/axios.js#L5) | Media |
| SEG-04 | Cabeceras | Público | CSP/HSTS | Defensa web completa en producción | Cabeceras básicas, sin CSP/HSTS | FALLIDA | [app.js](backend-clinica/src/app.js#L36) | Media |
| SEG-05 | NoSQL | API | Operadores maliciosos | Rechazo/sanitización global | No se encontró middleware global contra claves `$`/`.` | FALLIDA | [app.js](backend-clinica/src/app.js#L56) | Media |
| SEG-06 | Recuperación | Público | Secreto en logs | Nunca registrar enlace/token | En desarrollo imprime enlace completo | FALLIDA | [usuario.controller.js](backend-clinica/src/controllers/usuario.controller.js#L174) | Media |

## 14. Integridad de base de datos

Los esquemas usan referencias, timestamps, enums e índices. Destacan los índices de solapamiento de citas y el histórico lógico. Riesgos: `Usuario.ci` no es único, `Paciente.email` no es único, varias relaciones aceptan `null` por compatibilidad y no existe evidencia de auditoría de huérfanos/duplicados sobre Atlas. Tampoco puede confirmarse que los índices declarados estén creados en producción.

No se ejecutaron consultas de datos, migraciones, `syncIndexes`, cargas ni escrituras.

## 15. Usabilidad y accesibilidad

La navegación por rol y los estados de error/carga aparecen ampliamente en componentes. Hay confirmaciones en cancelación y acciones sensibles. Sin navegador ejecutable no se verificaron responsive, contraste, teclado o foco.

Hallazgos estáticos: varios componentes superan 1.500–3.000 líneas, dificultando consistencia; no existe una ruta comodín 404 en React; la auditoría automatizada de etiquetas/ARIA no existe. Las imágenes públicas revisadas suelen tener `alt`, pero no puede declararse cumplimiento WCAG.

## 16. Calidad del código

- Buena separación backend por capas y utilidad central de paginación/error.
- Componentes frontend excesivamente grandes: `CitasAdmin.jsx` (3.490 líneas), `InsumosAdmin.jsx` (3.028) y `PacientesAdmin.jsx` (2.264).
- Controladores backend también grandes (`cita.controller.js` 1.596, `insumo.controller.js` 1.420), con validación repetida y `try/catch` local que puede ocultar clasificación uniforme de errores.
- Hay numerosos `console.error` de interfaz; útiles para diagnóstico, pero conviene telemetría controlada en producción.
- Cobertura automatizada insuficiente: 8 pruebas backend y 11 ML; no hay pruebas frontend ni E2E.
- Versiones están fijadas y `pip check` no detectó incompatibilidades. No se auditó obsolescencia online ni se recomienda cambio de versión sin validación.

## 17. Problemas encontrados

| ID | Archivo y línea | Problema | Evidencia | Severidad | Impacto | Solución recomendada |
|---|---|---|---|---|---|---|
| P-01 | [vite.config.js](frontend-clinica/vite.config.js#L5) | PWA no configurada | Solo plugin React; no manifest/SW/iconos PWA | Alta | Requisito declarado no funciona | Configurar manifest, iconos 192/512, SW y estrategia offline; probar instalación. |
| P-02 | [usuario.controller.js](backend-clinica/src/controllers/usuario.controller.js#L346) | CI usado como contraseña inicial | Fallback directo a `String(ci)` | Alta | Credencial predecible y dato personal reutilizado | Generar secreto aleatorio de un solo uso o flujo de activación con expiración. |
| P-03 | [test_app.py](backend-clinica/ml-service/tests/test_app.py#L38) | Test ML desalineado | Espera `datos_insuficientes`, código ofrece estimación preliminar | Media | CI rojo y contrato ambiguo | Actualizar test y documentar formalmente estados preliminares. |
| P-04 | [.git](.git) | Metadatos Git ausentes | Git informa “not a git repository” | Alta | No hay trazabilidad ni verificación de secretos versionados | Restaurar/clonar `.git` correcto y revisar historial con detector de secretos. |
| P-05 | [axios.js](frontend-clinica/src/api/axios.js#L5) | JWT persistido en localStorage | Lectura/escritura directa | Media | Robo de sesión ante XSS | Evaluar cookie HttpOnly Secure SameSite y CSRF; como mínimo CSP estricta. |
| P-06 | [app.js](backend-clinica/src/app.js#L36) | Cabeceras incompletas | Sin CSP/HSTS | Media | Menor resistencia XSS/MITM | Añadir política CSP y HSTS en HTTPS, idealmente con Helmet configurado. |
| P-07 | [app.js](backend-clinica/src/app.js#L56) | Sin sanitización NoSQL global | Solo parser JSON | Media | Riesgo si controladores incorporan objetos no validados en filtros | Rechazar claves `$` y `.` y usar DTO/allowlists por endpoint. |
| P-08 | [usuario.controller.js](backend-clinica/src/controllers/usuario.controller.js#L174) | Enlace de recuperación en log de desarrollo | `console.log(enlace)` | Media | Token expuesto en logs compartidos | No registrar token completo; usar correo simulado o valor truncado. |
| P-09 | [Paciente.js](backend-clinica/src/models/Paciente.js#L62) | Email/contacto con validación débil | Sin formato/índice y contacto parcial permitido | Media | Duplicados y datos administrativos inconsistentes | Validar formato y regla “todos o ninguno”; decidir unicidad de email. |
| P-10 | [App.jsx](frontend-clinica/src/App.jsx#L119) | Sin ruta 404 frontend | No existe `path="*"` | Baja | Pantalla vacía ante URL desconocida | Añadir página 404 accesible. |
| P-11 | [CitasAdmin.jsx](frontend-clinica/src/pages/admin/CitasAdmin.jsx#L1) | Componentes monolíticos | 3.490 líneas en una página | Media | Alta dificultad de prueba/mantenimiento | Extraer hooks, formularios, tabla, agenda y modales incrementalmente. |
| P-12 | [Usuario.js](backend-clinica/src/models/Usuario.js#L22) | CI de usuario no único | No hay índice `unique` | Baja | Posible duplicidad de identidad | Definir política y, tras auditar datos, índice único si corresponde. |

## 18. Pruebas que no pudieron ejecutarse y motivo

- Lint, tests backend, build y ejecución React/Express: `npm` no existe en WSL y el shell Windows no pudo inicializar herramientas Node.
- Health real de Express, Swagger servido y Node→Flask: backend no pudo arrancar.
- Login válido/inválido y permisos dinámicos: no se proporcionaron cuentas de prueba y el login actualiza `ultimoAcceso`/intentos.
- CRUD, conflictos reales, transacciones, índices y datos actuales: implican conexión y potencial escritura a MongoDB; requieren autorización y base de prueba aislada.
- Predicción preliminar con registros actuales: requiere leer información operativa de Atlas mediante backend autenticado.
- UI visual, responsive, PWA, teclado y contraste: frontend no pudo construirse/servirse.
- Dependencias obsoletas/vulnerables (`npm audit`): no disponible y requeriría red; no se modificaron paquetes.

## 19. Recomendaciones

1. Preparar una base de staging anonimizada y cuatro cuentas ficticias por rol.
2. Restaurar Git y ejecutar el pipeline completo con Node 24.15/npm 11.
3. Corregir el test ML o el contrato, preservando la etiqueta explícita de estimación preliminar.
4. Implementar PWA real y validarla con Lighthouse/offline/instalación.
5. Eliminar contraseña basada en CI y fortalecer sesión/CSP/sanitización.
6. Añadir pruebas API por endpoint y rol, incluidas IDOR y transacciones.
7. Verificar índices reales de Atlas mediante operaciones de solo lectura antes de defensa.

## 20. Plan de corrección priorizado

| Prioridad | Correcciones | Criterio de cierre |
|---|---|---|
| P0 | Ninguna vulnerabilidad crítica confirmada. Si producción usa CI como contraseña activa, tratar P-02 como P0. | Todas las cuentas temporales obligan activación segura. |
| P1 | PWA real; credencial inicial segura; restaurar Git; pipeline verde; prueba integral Node-Flask-Mongo; RBAC/IDOR dinámico. | Build y tests 100%; evidencias por cuatro roles; `/ready` 200. |
| P2 | Alinear contrato ML; CSP/HSTS; sanitización NoSQL; validaciones Paciente; pruebas frontend/E2E; modularizar páginas grandes. | Tests de seguridad y accesibilidad pasan. |
| P3 | Ruta 404, limpieza de logs, documentación DTO Swagger exhaustiva y mejoras visuales menores. | Revisión UX y documentación completa. |

## 21. Veredicto final para la defensa

**APTO CON CONDICIONES.** La base técnica es defendible y el módulo ML es más sólido que una regresión demostrativa simple, pero hoy no existe evidencia dinámica suficiente para afirmar que login, roles, MongoDB Atlas, flujos CRUD, transacción clínica, PWA e integración Node-Flask funcionan de extremo a extremo. La defensa debe posponerse si los P1 no pueden demostrarse en un entorno controlado con datos ficticios y pipeline verde.

La siguiente etapa debe comenzar únicamente con autorización expresa del propietario. Este informe no aplicó correcciones.
