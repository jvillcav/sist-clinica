# Recarga de insumos — Clínica Odontológica Orellana

Este paquete únicamente contiene el cargador y los datos del catálogo. No
reemplaza el modelo, controlador, rutas ni archivos del frontend.

## Ubicación

Copie la carpeta `scripts` en la raíz de `backend-clinica`:

```text
backend-clinica/
├── scripts/
│   ├── cargarInsumos.js
│   └── datos/
│       ├── insumos-base.json
│       └── insumos-todos.json
└── src/
    └── models/
        └── Insumo.js
```

El script importa el modelo desde `../src/models/Insumo.js`, por lo que debe
ejecutarse desde la raíz de `backend-clinica`.

## Recarga recomendada

Primero valide los 196 insumos base:

```bash
node scripts/cargarInsumos.js --grupo=base --validar-datos
```

Después simule la comparación con MongoDB sin escribir datos:

```bash
node scripts/cargarInsumos.js --grupo=base --simular
```

Finalmente, realice la carga:

```bash
node scripts/cargarInsumos.js --grupo=base
```

## Catálogo completo opcional

Para cargar los 256 insumos:

```bash
node scripts/cargarInsumos.js --grupo=todos --simular
node scripts/cargarInsumos.js --grupo=todos
```

Los 60 insumos condicionales quedarán inactivos.

## Seguridad de la recarga

- Detecta insumos existentes por `codigo`.
- Para registros antiguos sin código, compara `nombre + unidadMedida`.
- No duplica registros al ejecutarse nuevamente.
- No sobrescribe el stock, costo ni estado de registros existentes.
- En registros existentes solo completa o actualiza los metadatos del catálogo.

El archivo `.env` del backend debe contener `MONGO_URI`, `MONGODB_URI` o
`MONGODB_ATLAS_URI`.

Si los insumos anteriores fueron eliminados, MongoDB generará nuevos `_id`.
Antes de recargarlos, compruebe que no existan consumos o reabastecimientos que
todavía hagan referencia a los `_id` eliminados.
