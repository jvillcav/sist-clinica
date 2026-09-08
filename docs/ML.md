# Servicio de predicción

## Objetivo

Estimar consumo mensual de insumos para apoyar reabastecimiento. No produce decisiones clínicas ni garantiza demanda futura.

## Proceso estadístico

1. Valida esquema, fechas y cantidades positivas.
2. Agrupa consumo por insumo y mes.
3. Completa meses intermedios sin registros con consumo cero y lo declara como advertencia.
4. Con seis meses o más, limita outliers por IQR únicamente para entrenar.
5. Ejecuta validación temporal progresiva.
6. Compara regresión lineal contra último valor observado.
7. Entrena el modelo ganador con todo el historial.
8. Genera predicciones no negativas e intervalos predictivos aproximados al 80%.

## Calidad

El puntaje considera cantidad de periodos, observaciones de backtesting, completitud y error porcentual. Los niveles son `preliminar`, `baja`, `media` y `alta`.

Con solo tres meses no existe backtesting: el resultado es preliminar. Los intervalos se basan en residuos y un piso de incertidumbre; no son garantías ni intervalos de confianza clínicos.

## Límites

- Horizonte: 1 a 12 meses.
- Dataset: máximo 50.000 registros por solicitud.
- Mínimo: tres meses observados por insumo.
- No modela estacionalidad anual de forma confiable con historiales cortos.
- Cambios de proveedores, protocolos o demanda pueden invalidar patrones históricos.
