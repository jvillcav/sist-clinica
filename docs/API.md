# API

Base predeterminada: `http://localhost:3000/api`. Swagger UI está disponible en `/api/docs`.

## Autenticación y errores

Las rutas protegidas requieren:

```http
Authorization: Bearer <jwt>
```

Los errores usan el formato:

```json
{
  "mensaje": "Descripción segura",
  "codigo": "CODIGO_ESTABLE",
  "requestId": "identificador"
}
```

Incluye `X-Request-Id` al reportar una incidencia.

## Paginación

Los listados admiten `pagina`/`limite` y los alias `page`/`limit`. El límite máximo es 100. Las respuestas publican `X-Total-Count`, `X-Page`, `X-Page-Size` y `X-Total-Pages`.

## Grupos de rutas

| Prefijo | Uso | Roles principales |
|---|---|---|
| `/usuarios` | Login, recuperación y administración de cuentas | Público / administrador |
| `/pacientes` | Fichas y portal del paciente | Personal / paciente propio |
| `/citas` | Agenda, disponibilidad, creación y cambios de estado | Según operación |
| `/solicitudes-citas` | Solicitudes públicas y conversión en citas | Público / recepción |
| `/expedientes` | Atención clínica e historial | Odontólogo / administrador / paciente propio |
| `/insumos` | Inventario y reabastecimiento | Personal autorizado |
| `/consumos-insumos` | Consumo clínico y ajustes | Odontólogo / administrador |
| `/reportes` | Resúmenes administrativos | Personal autorizado |
| `/predicciones` | Estado, dataset y predicciones | Administrador / odontólogo |

## Estado del sistema

- `GET /health`: indica que el proceso API responde.
- `GET /ready`: devuelve 200 únicamente cuando MongoDB y ML están disponibles.
- `GET http://127.0.0.1:5000/health`: estado y versión de ML.

Swagger contiene el catálogo de métodos, rutas, autenticación, roles y respuestas comunes. Los controladores siguen siendo la fuente definitiva de campos específicos mientras se completa el tipado exhaustivo de cada DTO.
