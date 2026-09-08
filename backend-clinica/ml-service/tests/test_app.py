import unittest

import pandas as pd  # type: ignore

from app import (
    app,
    construir_prediccion,
    normalizar_horizonte,
    preparar_dataframe,
)


class ConfiguracionTests(unittest.TestCase):
    def test_horizonte_se_limita(self):
        self.assertEqual(normalizar_horizonte(None), 3)
        self.assertEqual(normalizar_horizonte(0), 1)
        self.assertEqual(normalizar_horizonte(99), 12)

    def test_dataframe_rechaza_columnas_faltantes(self):
        with self.assertRaisesRegex(ValueError, "Faltan columnas"):
            preparar_dataframe([{"insumo": "Guantes"}])


class PrediccionTests(unittest.TestCase):
    def test_genera_prediccion_con_tres_periodos(self):
        datos = [
            {"fechaConsumo": "2026-01-10", "cantidadUtilizada": 10, "insumo": "Guantes", "insumoId": "1"},
            {"fechaConsumo": "2026-02-10", "cantidadUtilizada": 12, "insumo": "Guantes", "insumoId": "1"},
            {"fechaConsumo": "2026-03-10", "cantidadUtilizada": 14, "insumo": "Guantes", "insumoId": "1"},
        ]
        dataframe = preparar_dataframe(datos)
        resultado = construir_prediccion(dataframe, 3)

        self.assertEqual(resultado["estado"], "prediccion_generada")
        self.assertEqual(len(resultado["predicciones"]), 3)
        self.assertEqual(resultado["tendencia"], "creciente")

    def test_reporta_datos_insuficientes(self):
        dataframe = pd.DataFrame({
            "fechaConsumo": pd.to_datetime(["2026-01-10"], utc=True).tz_convert(None),
            "cantidadUtilizada": [10],
            "insumo": ["Guantes"],
            "insumoId": ["1"],
            "periodo": pd.PeriodIndex(["2026-01"], freq="M"),
        })
        resultado = construir_prediccion(dataframe, 3)
        self.assertEqual(resultado["estado"], "datos_insuficientes")


class RobustezEstadisticaTests(unittest.TestCase):
    @staticmethod
    def dataframe_mensual(valores, meses=None):
        if meses is None:
            meses = [
                f"2025-{mes:02d}-10"
                for mes in range(1, len(valores) + 1)
            ]

        return preparar_dataframe([
            {
                "fechaConsumo": fecha,
                "cantidadUtilizada": cantidad,
                "insumo": "Guantes",
                "insumoId": "1",
            }
            for fecha, cantidad in zip(meses, valores)
        ])

    def test_completa_meses_sin_registros(self):
        dataframe = self.dataframe_mensual(
            [10, 12, 14],
            ["2025-01-10", "2025-03-10", "2025-04-10"],
        )
        resultado = construir_prediccion(dataframe, 2)

        self.assertEqual(resultado["mesesSinRegistros"], 1)
        self.assertEqual(resultado["periodosObservados"], 3)
        self.assertEqual(resultado["periodosUtilizados"], 4)
        febrero = next(
            item
            for item in resultado["historialMensual"]
            if item["periodo"] == "2025-02"
        )
        self.assertEqual(febrero["cantidadConsumida"], 0)
        self.assertTrue(febrero["mesSinRegistros"])

    def test_selecciona_modelo_ingenuo_si_supera_al_lineal(self):
        dataframe = self.dataframe_mensual(
            [10, 10, 10, 20, 20, 20]
        )
        resultado = construir_prediccion(dataframe, 2)

        self.assertEqual(resultado["modeloSeleccionado"], "ultimo_valor")
        self.assertLess(
            resultado["metricas"]["maeUltimoValor"],
            resultado["metricas"]["maeRegresionLineal"],
        )

    def test_detecta_y_limita_valores_atipicos(self):
        valores = [10, 11, 9, 10, 12, 10, 11, 1000, 9, 10, 11, 10]
        dataframe = self.dataframe_mensual(valores)
        resultado = construir_prediccion(dataframe, 3)

        self.assertGreater(resultado["valoresAtipicosAjustados"], 0)
        self.assertTrue(
            any("atípicos" in aviso for aviso in resultado["advertencias"])
        )

    def test_intervalo_crece_con_el_horizonte(self):
        dataframe = self.dataframe_mensual(
            [10, 12, 11, 14, 13, 16, 15, 18]
        )
        resultado = construir_prediccion(dataframe, 4)
        intervalos = [
            item["intervaloPrediccion80"]
            for item in resultado["predicciones"]
        ]
        amplitudes = [
            item["superior"] - item["inferior"]
            for item in intervalos
        ]

        self.assertGreater(amplitudes[-1], amplitudes[0])
        self.assertIn(
            resultado["calidad"]["nivel"],
            {"baja", "media", "alta"},
        )

    def test_rechaza_registros_que_no_son_objetos(self):
        with self.assertRaisesRegex(ValueError, "debe ser un objeto"):
            preparar_dataframe([{"insumo": "Guantes"}, "incorrecto"])


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        respuesta = self.client.get("/health")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.get_json()["estado"], "activo")

    def test_payload_vacio(self):
        respuesta = self.client.post("/prediccion-consumo", json={"datos": []})
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(respuesta.get_json()["estado"], "error")


if __name__ == "__main__":
    unittest.main()
