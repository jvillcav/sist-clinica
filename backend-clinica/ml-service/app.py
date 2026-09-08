from __future__ import annotations
from calendar import monthrange
from datetime import datetime, timezone
from typing import Any
import os
from pathlib import Path
import numpy as np  # type: ignore
import pandas as pd  # type: ignore
from flask import Flask, jsonify, request  # type: ignore
from flask_cors import CORS  # type: ignore
from sklearn.linear_model import LinearRegression  # type: ignore
from sklearn.metrics import mean_absolute_error, r2_score  # type: ignore

def cargar_archivo_entorno() -> None:
    ruta = Path(__file__).with_name(".env")
    if not ruta.exists():
        return
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        nombre, valor = linea.split("=", 1)
        nombre = nombre.strip()
        valor = valor.strip().strip('"').strip("'")
        if nombre:
            os.environ.setdefault(nombre, valor)
cargar_archivo_entorno()
app = Flask(__name__)
ML_HOST = os.getenv("ML_HOST", "127.0.0.1")
try:
    ML_PORT = int(os.getenv("ML_PORT", "5000"))
    ML_MAX_CONTENT_LENGTH = int(
        os.getenv("ML_MAX_CONTENT_LENGTH", str(2 * 1024 * 1024))
    )
except ValueError as error:
    raise RuntimeError(
        "ML_PORT y ML_MAX_CONTENT_LENGTH deben ser números enteros."
    ) from error
if not 1 <= ML_PORT <= 65535 or ML_MAX_CONTENT_LENGTH <= 0:
    raise RuntimeError("La configuración numérica del servicio ML no es válida.")
ML_DEBUG = os.getenv("ML_DEBUG", "false").lower() == "true"
ML_CORS_ORIGINS = [
    origen.strip()
    for origen in os.getenv("ML_CORS_ORIGINS", "http://localhost:3000").split(",")
    if origen.strip()
]
app.config["MAX_CONTENT_LENGTH"] = ML_MAX_CONTENT_LENGTH
CORS(app, resources={r"/*": {"origins": ML_CORS_ORIGINS}})
MIN_PERIODOS = 3
HORIZONTE_PREDETERMINADO = 3
HORIZONTE_MAXIMO = 12
MAX_REGISTROS = 50000
MESES_ES = {
    1: "Ene",
    2: "Feb",
    3: "Mar",
    4: "Abr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Ago",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dic",
}
def respuesta_error(
    mensaje: str,
    estado_http: int = 400,
    detalle: str | None = None,
):
    respuesta: dict[str, Any] = {
        "estado": "error",
        "mensaje": mensaje,
    }
    if detalle and ML_DEBUG:
        respuesta["detalle"] = detalle
    return jsonify(respuesta), estado_http
def normalizar_horizonte(valor: Any) -> int:
    try:
        horizonte = int(valor)
    except (TypeError, ValueError):
        return HORIZONTE_PREDETERMINADO
    return max(1, min(horizonte, HORIZONTE_MAXIMO))
def obtener_payload() -> tuple[list[dict[str, Any]], int]:
    """
    Acepta dos formatos:
    Formato nuevo:
    {
        "datos": [...],
        "horizonteMeses": 3
    }
    Formato antiguo compatible:
    [...]
    """
    payload = request.get_json(silent=True)
    if isinstance(payload, list):
        return payload, HORIZONTE_PREDETERMINADO
    if isinstance(payload, dict):
        datos = payload.get("datos", [])
        horizonte = normalizar_horizonte(
            payload.get("horizonteMeses")
        )
        if isinstance(datos, list):
            return datos, horizonte
    return [], HORIZONTE_PREDETERMINADO
def preparar_dataframe(
    datos: list[dict[str, Any]],
) -> pd.DataFrame:
    if len(datos) > MAX_REGISTROS:
        raise ValueError(
            f"El dataset supera el máximo de {MAX_REGISTROS} registros."
        )
    if not all(
        isinstance(registro, dict)
        for registro in datos
    ):
        raise ValueError(
            "Cada registro del dataset debe ser un objeto."
        )
    df = pd.DataFrame(datos)
    columnas_obligatorias = {
        "fechaConsumo",
        "cantidadUtilizada",
        "insumo",
    }
    columnas_faltantes = columnas_obligatorias.difference(
        df.columns
    )
    if columnas_faltantes:
        raise ValueError(
            "Faltan columnas obligatorias: "
            + ", ".join(sorted(columnas_faltantes))
        )
    df = df.copy()
    df["fechaConsumo"] = pd.to_datetime(
        df["fechaConsumo"],
        errors="coerce",
        utc=True,
    )
    df["cantidadUtilizada"] = pd.to_numeric(
        df["cantidadUtilizada"],
        errors="coerce",
    )
    df["insumo"] = (
        df["insumo"]
        .astype(str)
        .str.strip()
    )
    if "insumoId" not in df.columns:
        df["insumoId"] = ""
    df["insumoId"] = (
        df["insumoId"]
        .fillna("")
        .astype(str)
        .str.strip()
    )
    df = df.dropna(
        subset=[
            "fechaConsumo",
            "cantidadUtilizada",
        ]
    )
    df = df[
        (df["cantidadUtilizada"] > 0)
        & (df["insumo"] != "")
        & (df["insumo"].str.lower() != "none")
        & (df["insumo"].str.lower() != "nan")
    ].copy()
    if df.empty:
        raise ValueError(
            "No existen registros válidos después de limpiar los datos."
        )
    df["fechaConsumo"] = (
        df["fechaConsumo"]
        .dt.tz_convert(None)
    )
    df["periodo"] = (
        df["fechaConsumo"]
        .dt.to_period("M")
    )
    return df
def clasificar_tendencia(
    pendiente: float,
    promedio: float,
) -> str:
    referencia = max(abs(promedio), 1.0)
    variacion_relativa = pendiente / referencia
    if variacion_relativa > 0.05:
        return "creciente"
    if variacion_relativa < -0.05:
        return "decreciente"
    return "estable"
def completar_serie_mensual(
    consumo_observado: pd.Series,
) -> tuple[pd.Series, int]:
    periodo_inicial = consumo_observado.index.min()
    periodo_final = consumo_observado.index.max()
    indice_completo = pd.period_range(
        periodo_inicial,
        periodo_final,
        freq="M",
    )
    meses_sin_registros = int(
        len(indice_completo) - len(consumo_observado)
    )
    return (
        consumo_observado.reindex(
            indice_completo,
            fill_value=0.0,
        ).astype(float),
        meses_sin_registros,
    )
def suavizar_atipicos(
    valores: np.ndarray,
) -> tuple[np.ndarray, int]:
    ajustados = valores.astype(float).copy()
    if len(ajustados) < 6:
        return ajustados, 0
    q1, q3 = np.quantile(
        ajustados,
        [0.25, 0.75],
    )
    rango_intercuartil = float(q3 - q1)
    if rango_intercuartil <= 0:
        return ajustados, 0
    limite_inferior = max(0.0, float(q1 - 1.5 * rango_intercuartil))
    limite_superior = float(q3 + 1.5 * rango_intercuartil)
    recortados = np.clip(
        ajustados,
        limite_inferior,
        limite_superior,
    )
    cantidad = int(
        np.count_nonzero(
            ~np.isclose(recortados, ajustados)
        )
    )
    return recortados, cantidad
def ajustar_lineal(
    valores: np.ndarray,
) -> LinearRegression:
    modelo = LinearRegression()
    modelo.fit(
        np.arange(
            len(valores),
            dtype=float,
        ).reshape(-1, 1),
        valores,
    )
    return modelo
def validar_temporalmente(
    valores: np.ndarray,
) -> dict[str, Any]:
    reales: list[float] = []
    lineales: list[float] = []
    ingenuas: list[float] = []
    for posicion in range(
        MIN_PERIODOS,
        len(valores),
    ):
        entrenamiento = valores[:posicion]
        modelo = ajustar_lineal(
            entrenamiento
        )
        prediccion_lineal = float(
            modelo.predict(
                np.array(
                    [[float(posicion)]]
                )
            )[0]
        )
        reales.append(
            float(valores[posicion])
        )
        lineales.append(
            max(0.0, prediccion_lineal)
        )
        ingenuas.append(
            max(
                0.0,
                float(
                    entrenamiento[-1]
                ),
            )
        )
    if not reales:
        return {
            "observaciones": 0,
            "reales": np.array([]),
            "lineales": np.array([]),
            "ingenuas": np.array([]),
            "maeLineal": None,
            "maeIngenuo": None,
        }
    reales_np = np.asarray(
        reales,
        dtype=float,
    )
    lineales_np = np.asarray(
        lineales,
        dtype=float,
    )
    ingenuas_np = np.asarray(
        ingenuas,
        dtype=float,
    )
    return {
        "observaciones": len(reales),
        "reales": reales_np,
        "lineales": lineales_np,
        "ingenuas": ingenuas_np,
        "maeLineal": float(
            mean_absolute_error(
                reales_np,
                lineales_np,
            )
        ),
        "maeIngenuo": float(
            mean_absolute_error(
                reales_np,
                ingenuas_np,
            )
        ),
    }
def error_porcentual_absoluto(
    reales: np.ndarray,
    predichos: np.ndarray,
) -> float | None:
    denominador = float(
        np.sum(np.abs(reales))
    )
    if denominador <= 0:
        return None
    return float(
        np.sum(
            np.abs(
                reales - predichos
            )
        )
        / denominador
        * 100
    )
def clasificar_calidad(
    periodos: int,
    validaciones: int,
    error_porcentual: float | None,
    completitud: float,
) -> tuple[str, int]:
    puntos_periodos = min(
        periodos / 12,
        1.0,
    ) * 40
    puntos_validacion = min(
        validaciones / 6,
        1.0,
    ) * 30
    puntos_completitud = completitud * 15
    if error_porcentual is None:
        puntos_error = 5
    else:
        puntos_error = max(
            0.0,
            15
            * (
                1
                - min(
                    error_porcentual,
                    100,
                )
                / 100
            ),
        )
    puntaje = int(
        round(
            puntos_periodos
            + puntos_validacion
            + puntos_completitud
            + puntos_error
        )
    )
    if validaciones == 0:
        return "preliminar", min(
            puntaje,
            49,
        )
    if puntaje >= 75:
        return "alta", puntaje
    if puntaje >= 55:
        return "media", puntaje
    return "baja", puntaje
def construir_estimacion_preliminar(
    df_insumo: pd.DataFrame,
    horizonte_meses: int,
) -> dict[str, Any]:
    """
    Genera una estimación referencial cuando todavía no existen los tres
    meses requeridos para ejecutar el modelo de Machine Learning.

    La estimación usa exclusivamente los consumos reales recibidos: calcula
    el promedio diario del intervalo observado y lo multiplica por los días
    calendario de cada mes futuro. No entrena ni sustituye el modelo ML.
    """
    nombre_insumo = str(
        df_insumo["insumo"].iloc[0]
    ).strip()
    insumo_id = str(
        df_insumo["insumoId"].iloc[0]
    ).strip()
    registros_utilizados = int(
        len(df_insumo)
    )
    fechas = df_insumo[
        "fechaConsumo"
    ].sort_values()
    fecha_inicial = pd.Timestamp(
        fechas.iloc[0]
    ).normalize()
    fecha_final = pd.Timestamp(
        fechas.iloc[-1]
    ).normalize()
    dias_observados = max(
        int(
            (
                fecha_final
                - fecha_inicial
            ).days
        ) + 1,
        1,
    )
    cantidad_total = float(
        df_insumo[
            "cantidadUtilizada"
        ].sum()
    )
    promedio_diario = (
        cantidad_total
        / dias_observados
    )
    consumo_observado = (
        df_insumo.groupby("periodo")[
            "cantidadUtilizada"
        ]
        .sum()
        .sort_index()
        .astype(float)
    )
    periodos_observados = int(
        len(consumo_observado)
    )
    consumo_mensual, meses_sin_registros = (
        completar_serie_mensual(
            consumo_observado
        )
    )
    ultimo_periodo = (
        consumo_mensual.index.max()
    )
    periodos_futuros = [
        ultimo_periodo + desplazamiento
        for desplazamiento in range(
            1,
            horizonte_meses + 1,
        )
    ]
    if dias_observados < 7:
        margen_referencial = 0.50
    elif dias_observados < 30:
        margen_referencial = 0.35
    else:
        margen_referencial = 0.25
    predicciones = []
    for periodo in periodos_futuros:
        dias_del_mes = monthrange(
            int(periodo.year),
            int(periodo.month),
        )[1]
        estimado = max(
            0.0,
            promedio_diario
            * dias_del_mes,
        )
        predicciones.append(
            {
                "periodo": str(periodo),
                "anio": int(periodo.year),
                "mesNumero": int(periodo.month),
                "mes": MESES_ES.get(
                    int(periodo.month),
                    str(periodo.month),
                ),
                "diasDelMes": dias_del_mes,
                "cantidadEstimada": round(
                    estimado,
                    2,
                ),
                "intervaloReferencial": {
                    "inferior": round(
                        max(
                            0.0,
                            estimado
                            * (
                                1
                                - margen_referencial
                            ),
                        ),
                        2,
                    ),
                    "superior": round(
                        estimado
                        * (
                            1
                            + margen_referencial
                        ),
                        2,
                    ),
                },
            }
        )
    historial = [
        {
            "periodo": str(periodo),
            "anio": int(periodo.year),
            "mesNumero": int(periodo.month),
            "mes": MESES_ES.get(
                int(periodo.month),
                str(periodo.month),
            ),
            "cantidadConsumida": round(
                float(cantidad),
                2,
            ),
            "mesSinRegistros": (
                periodo
                not in consumo_observado.index
            ),
        }
        for periodo, cantidad
        in consumo_mensual.items()
    ]
    primera_estimacion = (
        predicciones[0][
            "cantidadEstimada"
        ]
        if predicciones
        else 0
    )
    return {
        "estado": "estimacion_preliminar_generada",
        "tipoResultado": "estimacion_preliminar",
        "esPreliminar": True,
        "metodoEstimacion": "promedio_diario_proyectado",
        "insumoId": insumo_id,
        "insumo": nombre_insumo,
        "registrosUtilizados": registros_utilizados,
        "periodosObservados": periodos_observados,
        "periodosUtilizados": periodos_observados,
        "periodosMinimos": MIN_PERIODOS,
        "diasObservados": dias_observados,
        "mesesSinRegistros": meses_sin_registros,
        "valoresAtipicosAjustados": 0,
        "fechaInicialObservada": fecha_inicial.isoformat(),
        "fechaFinalObservada": fecha_final.isoformat(),
        "periodoInicial": str(
            consumo_mensual.index.min()
        ),
        "periodoFinal": str(
            consumo_mensual.index.max()
        ),
        "cantidadTotalObservada": round(
            cantidad_total,
            2,
        ),
        "promedioDiarioObservado": round(
            promedio_diario,
            4,
        ),
        "promedioMensualHistorico": round(
            promedio_diario * 30.4375,
            2,
        ),
        "ultimoConsumoMensual": round(
            float(
                consumo_observado.iloc[-1]
            ),
            2,
        ),
        "pendienteMensual": 0.0,
        "tendencia": "estable",
        "modeloSeleccionado": "promedio_diario",
        "calidad": {
            "nivel": "preliminar",
            "puntaje": None,
            "completitudPorcentual": round(
                min(
                    dias_observados / 90,
                    1.0,
                ) * 100,
                2,
            ),
            "observacionesValidacion": 0,
        },
        "metricas": {
            "r2": None,
            "mae": None,
            "maeEntrenamiento": None,
            "maeValidacionTemporal": None,
            "errorPorcentualValidacion": None,
            "rmseResidual": None,
            "maeRegresionLineal": None,
            "maeUltimoValor": None,
        },
        "advertencias": [
            (
                "Estimación preliminar basada en "
                f"{registros_utilizados} registros disponibles "
                f"durante {dias_observados} día(s)."
            ),
            (
                "Todavía no se ejecuta el modelo de Machine Learning "
                f"porque no se han completado los {MIN_PERIODOS} "
                "meses mínimos de consumo."
            ),
            (
                "El resultado es referencial y su precisión mejorará "
                "con la incorporación de nuevos datos históricos."
            ),
        ],
        "historialMensual": historial,
        "predicciones": predicciones,
        "prediccionConsumo": primera_estimacion,
        "periodo": (
            predicciones[0][
                "periodo"
            ]
            if predicciones
            else None
        ),
    }
def construir_prediccion(
    df_insumo: pd.DataFrame,
    horizonte_meses: int,
) -> dict[str, Any]:
    nombre_insumo = str(
        df_insumo["insumo"].iloc[0]
    ).strip()
    insumo_id = str(
        df_insumo["insumoId"].iloc[0]
    ).strip()
    registros_originales = int(
        len(df_insumo)
    )
    consumo_observado = (
        df_insumo.groupby("periodo")[
            "cantidadUtilizada"
        ]
        .sum()
        .sort_index()
        .astype(float)
    )
    periodos_observados = int(
        len(consumo_observado)
    )
    if periodos_observados < MIN_PERIODOS:
        return construir_estimacion_preliminar(
            df_insumo,
            horizonte_meses,
        )
    consumo_mensual, meses_sin_registros = (
        completar_serie_mensual(
            consumo_observado
        )
    )
    valores_reales = (
        consumo_mensual.to_numpy(
            dtype=float
        )
    )
    valores_modelo, atipicos_ajustados = (
        suavizar_atipicos(
            valores_reales
        )
    )
    periodos_totales = len(
        valores_modelo
    )
    validacion = validar_temporalmente(
        valores_modelo
    )
    usar_lineal = (
        validacion["observaciones"] == 0
        or validacion["maeLineal"]
        <= validacion["maeIngenuo"]
        * 0.98
    )
    modelo_seleccionado = (
        "regresion_lineal"
        if usar_lineal
        else "ultimo_valor"
    )
    modelo_lineal = ajustar_lineal(
        valores_modelo
    )
    indice_historico = np.arange(
        periodos_totales,
        dtype=float,
    ).reshape(-1, 1)
    ajuste_lineal = np.maximum(
        modelo_lineal.predict(
            indice_historico
        ),
        0,
    )
    ajuste_elegido = (
        ajuste_lineal
        if usar_lineal
        else np.concatenate(
            (
                valores_modelo[:1],
                valores_modelo[:-1],
            )
        )
    )
    mae_entrenamiento = float(
        mean_absolute_error(
            valores_modelo,
            ajuste_elegido,
        )
    )
    if usar_lineal:
        predicciones_validacion = (
            validacion["lineales"]
        )
    else:
        predicciones_validacion = (
            validacion["ingenuas"]
        )
    mae_validacion = (
        float(
            mean_absolute_error(
                validacion["reales"],
                predicciones_validacion,
            )
        )
        if validacion["observaciones"]
        else None
    )
    error_porcentual = (
        error_porcentual_absoluto(
            validacion["reales"],
            predicciones_validacion,
        )
        if validacion["observaciones"]
        else None
    )
    indices_futuros = np.arange(
        periodos_totales,
        periodos_totales
        + horizonte_meses,
        dtype=float,
    ).reshape(-1, 1)
    if usar_lineal:
        valores_futuros = np.maximum(
            modelo_lineal.predict(
                indices_futuros
            ),
            0,
        )
    else:
        valores_futuros = np.full(
            horizonte_meses,
            max(
                0.0,
                float(
                    valores_modelo[-1]
                ),
            ),
        )
    residuos = (
        validacion["reales"]
        - predicciones_validacion
        if validacion["observaciones"]
        else valores_modelo
        - ajuste_elegido
    )
    rmse = float(
        np.sqrt(
            np.mean(
                np.square(
                    residuos
                )
            )
        )
    )
    piso_incertidumbre = max(
        float(
            np.std(
                valores_modelo
            )
        )
        * 0.15,
        float(
            np.mean(
                valores_modelo
            )
        )
        * 0.05,
        0.01,
    )
    desviacion_base = max(
        rmse,
        piso_incertidumbre,
    )
    ultimo_periodo = (
        consumo_mensual.index.max()
    )
    periodos_futuros = [
        ultimo_periodo + desplazamiento
        for desplazamiento in range(
            1,
            horizonte_meses + 1,
        )
    ]
    predicciones = []
    for posicion, (
        periodo,
        cantidad,
    ) in enumerate(
        zip(
            periodos_futuros,
            valores_futuros,
        ),
        start=1,
    ):
        amplitud = (
            1.2816
            * desviacion_base
            * np.sqrt(
                1
                + posicion
                / max(
                    periodos_totales,
                    1,
                )
            )
        )
        estimado = max(
            0.0,
            float(cantidad),
        )
        predicciones.append(
            {
                "periodo": str(periodo),
                "anio": int(periodo.year),
                "mesNumero": int(periodo.month),
                "mes": MESES_ES.get(
                    int(periodo.month),
                    str(periodo.month),
                ),
                "cantidadEstimada": round(
                    estimado,
                    2,
                ),
                "intervaloPrediccion80": {
                    "inferior": round(
                        max(
                            0.0,
                            estimado
                            - amplitud,
                        ),
                        2,
                    ),
                    "superior": round(
                        estimado
                        + amplitud,
                        2,
                    ),
                },
            }
        )
    promedio_historico = float(
        np.mean(
            valores_reales
        )
    )
    pendiente = float(
        modelo_lineal.coef_[0]
    )
    completitud = (
        periodos_observados
        / periodos_totales
    )
    nivel_calidad, puntaje_calidad = (
        clasificar_calidad(
            periodos_totales,
            validacion["observaciones"],
            error_porcentual,
            completitud,
        )
    )
    advertencias = []
    if meses_sin_registros:
        advertencias.append(
            f"{meses_sin_registros} meses sin registros "
            "se interpretaron como consumo cero."
        )
    if atipicos_ajustados:
        advertencias.append(
            f"{atipicos_ajustados} valores mensuales atípicos "
            "fueron limitados para entrenar el modelo."
        )
    if nivel_calidad in {
        "preliminar",
        "baja",
    }:
        advertencias.append(
            "La predicción tiene evidencia histórica limitada; "
            "debe utilizarse como referencia y no como valor exacto."
        )
    historial = [
        {
            "periodo": str(periodo),
            "anio": int(periodo.year),
            "mesNumero": int(periodo.month),
            "mes": MESES_ES.get(
                int(periodo.month),
                str(periodo.month),
            ),
            "cantidadConsumida": round(
                float(cantidad),
                2,
            ),
            "mesSinRegistros": (
                periodo
                not in consumo_observado.index
            ),
        }
        for periodo, cantidad
        in consumo_mensual.items()
    ]
    r2 = (
        float(
            r2_score(
                valores_modelo,
                ajuste_lineal,
            )
        )
        if len(valores_modelo) > 1
        and not np.allclose(
            valores_modelo,
            valores_modelo[0],
        )
        else None
    )
    primera_prediccion = (
        predicciones[0][
            "cantidadEstimada"
        ]
        if predicciones
        else 0
    )
    return {
        "estado": "prediccion_generada",
        "insumoId": insumo_id,
        "insumo": nombre_insumo,
        "registrosUtilizados": registros_originales,
        "periodosObservados": periodos_observados,
        "periodosUtilizados": periodos_totales,
        "mesesSinRegistros": meses_sin_registros,
        "valoresAtipicosAjustados": atipicos_ajustados,
        "periodoInicial": str(
            consumo_mensual.index.min()
        ),
        "periodoFinal": str(
            consumo_mensual.index.max()
        ),
        "promedioMensualHistorico": round(
            promedio_historico,
            2,
        ),
        "ultimoConsumoMensual": round(
            float(
                valores_reales[-1]
            ),
            2,
        ),
        "pendienteMensual": round(
            pendiente,
            4,
        ),
        "tendencia": clasificar_tendencia(
            pendiente,
            promedio_historico,
        ),
        "modeloSeleccionado": modelo_seleccionado,
        "calidad": {
            "nivel": nivel_calidad,
            "puntaje": puntaje_calidad,
            "completitudPorcentual": round(
                completitud * 100,
                2,
            ),
            "observacionesValidacion": validacion[
                "observaciones"
            ],
        },
        "metricas": {
            "r2": (
                round(
                    r2,
                    4,
                )
                if r2 is not None
                else None
            ),
            "mae": round(
                mae_validacion
                if mae_validacion
                is not None
                else mae_entrenamiento,
                4,
            ),
            "maeEntrenamiento": round(
                mae_entrenamiento,
                4,
            ),
            "maeValidacionTemporal": (
                round(
                    mae_validacion,
                    4,
                )
                if mae_validacion
                is not None
                else None
            ),
            "errorPorcentualValidacion": (
                round(
                    error_porcentual,
                    2,
                )
                if error_porcentual
                is not None
                else None
            ),
            "rmseResidual": round(
                rmse,
                4,
            ),
            "maeRegresionLineal": (
                round(
                    validacion[
                        "maeLineal"
                    ],
                    4,
                )
                if validacion[
                    "maeLineal"
                ]
                is not None
                else None
            ),
            "maeUltimoValor": (
                round(
                    validacion[
                        "maeIngenuo"
                    ],
                    4,
                )
                if validacion[
                    "maeIngenuo"
                ]
                is not None
                else None
            ),
        },
        "advertencias": advertencias,
        "historialMensual": historial,
        "predicciones": predicciones,
        "prediccionConsumo": primera_prediccion,
        "periodo": (
            predicciones[0][
                "periodo"
            ]
            if predicciones
            else None
        ),
    }
@app.get("/health")
def health():
    return jsonify(
        {
            "estado": "activo",
            "servicio": "ml-consumo-insumos",
            "modelo": "seleccion_temporal_lineal_ingenua",
            "version": "3.1.0",
            "periodosMinimos": MIN_PERIODOS,
            "estimacionPreliminarDisponible": True,
            "metodoPreliminar": "promedio_diario_proyectado",
            "horizontePredeterminado": HORIZONTE_PREDETERMINADO,
            "maxRegistros": MAX_REGISTROS,
            "fechaServidor": datetime.now(timezone.utc).isoformat(),
        }
    )
@app.post("/prediccion-consumo")
def prediccion_consumo():
    try:
        datos, horizonte_meses = obtener_payload()
        if not datos:
            return respuesta_error(
                "No se enviaron datos de consumo.",
                400,
            )
        df = preparar_dataframe(datos)
        resultados = []
        insuficientes = []
        grupos = df.groupby(
            ["insumoId", "insumo"],
            dropna=False,
        )
        for _, df_insumo in grupos:
            resultado = construir_prediccion(
                df_insumo.copy(),
                horizonte_meses,
            )
            if (
                resultado["estado"]
                in {
                    "prediccion_generada",
                    "estimacion_preliminar_generada",
                }
            ):
                resultados.append(resultado)
            else:
                insuficientes.append(resultado)
        total_preliminares = sum(
            1
            for resultado in resultados
            if resultado.get("esPreliminar")
        )
        total_predicciones_ml = (
            len(resultados)
            - total_preliminares
        )
        if total_preliminares and total_predicciones_ml:
            mensaje_resultado = (
                "Se generaron predicciones ML y estimaciones "
                "preliminares según el historial disponible."
            )
        elif total_preliminares:
            mensaje_resultado = (
                "Estimaciones preliminares generadas con los "
                "registros de consumo disponibles. La precisión "
                "mejorará al completar el historial mínimo."
            )
        elif total_predicciones_ml:
            mensaje_resultado = (
                "Predicciones de Machine Learning procesadas "
                "correctamente."
            )
        else:
            mensaje_resultado = (
                "No existen consumos válidos para generar resultados."
            )
        return jsonify(
            {
                "estado": "correcto",
                "mensaje": mensaje_resultado,
                "modelo": {
                    "nombre": "ML con estimación preliminar automática",
                    "objetivo": "Consumo total mensual por insumo",
                    "periodosMinimos": MIN_PERIODOS,
                    "horizonteMeses": horizonte_meses,
                    "modeloPrincipal": "Selección temporal entre regresión lineal y último valor",
                    "metodoPreliminar": "Promedio diario proyectado",
                },
                "totalPredicciones": len(resultados),
                "totalPrediccionesML": total_predicciones_ml,
                "totalEstimacionesPreliminares": total_preliminares,
                "totalInsuficientes": len(insuficientes),
                "predicciones": resultados,
                "datosInsuficientes": insuficientes,
                "generadoEn": datetime.now(timezone.utc).isoformat(),
            }
        )
    except ValueError as error:
        return respuesta_error(
            str(error),
            400,
        )
    except Exception as error:
        app.logger.exception(
            "Error al procesar la predicción"
        )
        return respuesta_error(
            "Ocurrió un error interno al generar la predicción.",
            500,
            str(error),
        )
if __name__ == "__main__":
    app.run(
        host=ML_HOST,
        port=ML_PORT,
        debug=ML_DEBUG,
    )
