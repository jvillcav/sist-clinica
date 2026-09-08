import axios from 'axios';
import mongoose from 'mongoose';
import ConsumoInsumo from '../models/ConsumoInsumo.js';
import Insumo from '../models/Insumo.js';
import { config } from '../config/env.js';
const ML_SERVICE_URL = config.mlServiceUrl;
const ML_TIMEOUT_MS = config.mlTimeoutMs;
const PERIODOS_MINIMOS = 3;
/* =====================================================
   UTILIDADES
===================================================== */
const obtenerMensajeAxios = (
  error,
  mensajePredeterminado
) => {
  if (
    error.code === 'ECONNREFUSED' ||
    error.cause?.code === 'ECONNREFUSED'
  ) {
    return (
      'El servicio de Machine Learning no está disponible. ' +
      'Inicia Flask en el puerto 5000.'
    );
  }
  if (
    error.code === 'ECONNABORTED'
  ) {
    return (
      'El servicio de Machine Learning tardó demasiado ' +
      'en responder.'
    );
  }
  return (
    error.response?.data?.mensaje ||
    mensajePredeterminado
  );
};
const fechaValida = (valor) => {
  const fecha = new Date(valor);
  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
};
const obtenerPeriodo = (fecha) => {
  const valor = fechaValida(fecha);
  if (!valor) {
    return null;
  }
  const anio =
    valor.getUTCFullYear();
  const mes = String(
    valor.getUTCMonth() + 1
  ).padStart(2, '0');
  return `${anio}-${mes}`;
};
const obtenerConsumosValidos =
  async (filtro = {}) => {
    const consumos =
      await ConsumoInsumo.find(
        filtro
      )
        .populate({
          path: 'insumoId',
          select: [
            'nombre',
            'descripcion',
            'categoria',
            'unidadMedida',
            'stockActual',
            'stockMinimo',
            'costoUnitario',
            'estado'
          ].join(' ')
        })
        .populate({
          path: 'expedienteId',
          select:
            'estadoRegistro fechaAtencion'
        })
        .sort({
          fechaConsumo: 1,
          createdAt: 1
        })
        .lean();
    return consumos.filter(
      (consumo) => {
        const insumo =
          consumo.insumoId;
        const expediente =
          consumo.expedienteId;
        const cantidad = Number(
          consumo.cantidadUtilizada
        );
        return (
          Boolean(insumo) &&
          insumo.estado !==
            'inactivo' &&
          expediente?.estadoRegistro !==
            'anulado' &&
          Number.isFinite(
            cantidad
          ) &&
          cantidad > 0 &&
          Boolean(
            fechaValida(
              consumo.fechaConsumo ||
                consumo.createdAt
            )
          )
        );
      }
    );
  };
const transformarDataset = (
  consumos
) => {
  return consumos.map(
    (consumo) => ({
      consumoId:
        consumo._id?.toString(),
      insumoId:
        consumo.insumoId?._id?.toString(),
      insumo:
        consumo.insumoId?.nombre,
      fechaConsumo:
        consumo.fechaConsumo ||
        consumo.createdAt,
      cantidadUtilizada:
        Number(
          consumo.cantidadUtilizada
        )
    })
  );
};
const calcularRiesgo = ({
  stockActual,
  stockMinimo,
  consumoEstimado
}) => {
  const actual = Number(
    stockActual || 0
  );
  const minimo = Number(
    stockMinimo || 0
  );
  const estimado = Number(
    consumoEstimado || 0
  );
  if (actual <= 0) {
    return 'critico';
  }
  if (actual < estimado) {
    return 'alto';
  }
  if (
    actual - estimado <=
    minimo
  ) {
    return 'medio';
  }
  return 'bajo';
};
const enriquecerPrediccion = (
  prediccion,
  insumo
) => {
  const prediccionesMeses =
    Array.isArray(
      prediccion.predicciones
    )
      ? prediccion.predicciones
      : [];
  const consumoPrimerMes =
    Number(
      prediccionesMeses[0]
        ?.cantidadEstimada ??
      prediccion.prediccionConsumo ??
      0
    );
  const consumoHorizonte =
    prediccionesMeses.reduce(
      (total, item) =>
        total +
        Number(
          item.cantidadEstimada ||
            0
        ),
      0
    );
  const stockActual = Number(
    insumo?.stockActual || 0
  );
  const stockMinimo = Number(
    insumo?.stockMinimo || 0
  );
  /*
   * Cantidad sugerida para cubrir el horizonte
   * y conservar el stock mínimo.
   */
  const cantidadSugerida =
    Math.max(
      0,
      consumoHorizonte +
        stockMinimo -
        stockActual
    );
  return {
    ...prediccion,
    inventario: {
      stockActual,
      stockMinimo,
      unidadMedida:
        insumo?.unidadMedida ||
        'unidad',
      costoUnitario:
        Number(
          insumo?.costoUnitario ||
            0
        ),
      categoria:
        insumo?.categoria ||
        'General',
      estado:
        insumo?.estado ||
        'activo'
    },
    riesgoDesabastecimiento:
      calcularRiesgo({
        stockActual,
        stockMinimo,
        consumoEstimado:
          consumoPrimerMes
      }),
    consumoEstimadoHorizonte:
      Math.round(
        consumoHorizonte * 100
      ) / 100,
    cantidadSugeridaReabastecer:
      Math.ceil(
        cantidadSugerida
      )
  };
};
const llamarServicioML =
  async ({
    datos,
    horizonteMeses
  }) => {
    const respuesta =
      await axios.post(
        `${ML_SERVICE_URL}/prediccion-consumo`,
        {
          datos,
          horizonteMeses
        },
        {
          timeout:
            ML_TIMEOUT_MS,
          headers: {
            'Content-Type':
              'application/json'
          }
        }
      );
    return respuesta.data;
  };
/* =====================================================
   ESTADO DEL SERVICIO ML
===================================================== */
export const obtenerEstadoServicioML =
  async (req, res) => {
    try {
      const respuesta =
        await axios.get(
          `${ML_SERVICE_URL}/health`,
          {
            timeout: 5000
          }
        );
      return res.json({
        disponible: true,
        servicio:
          respuesta.data
      });
    } catch (error) {
      console.error(
        'Servicio ML no disponible:',
        error.message
      );
      return res
        .status(503)
        .json({
          disponible: false,
          mensaje:
            obtenerMensajeAxios(
              error,
              'No se pudo consultar el servicio de Machine Learning.'
            )
        });
    }
  };
/* =====================================================
   RESUMEN DEL DATASET
===================================================== */
export const obtenerResumenDataset =
  async (req, res) => {
    try {
      const consumos =
        await obtenerConsumosValidos();
      const agrupados =
        new Map();
      let fechaInicial = null;
      let fechaFinal = null;
      for (
        const consumo of consumos
      ) {
        const insumoId =
          consumo.insumoId?._id?.toString();
        if (!insumoId) {
          continue;
        }
        const fecha =
          fechaValida(
            consumo.fechaConsumo ||
              consumo.createdAt
          );
        const periodo =
          obtenerPeriodo(fecha);
        if (!fecha || !periodo) {
          continue;
        }
        if (
          !fechaInicial ||
          fecha < fechaInicial
        ) {
          fechaInicial = fecha;
        }
        if (
          !fechaFinal ||
          fecha > fechaFinal
        ) {
          fechaFinal = fecha;
        }
        if (
          !agrupados.has(
            insumoId
          )
        ) {
          agrupados.set(
            insumoId,
            {
              insumoId,
              insumo:
                consumo.insumoId
                  ?.nombre ||
                'Sin nombre',
              unidadMedida:
                consumo.insumoId
                  ?.unidadMedida ||
                'unidad',
              registros: 0,
              periodos: new Set(),
              cantidadTotal: 0
            }
          );
        }
        const item =
          agrupados.get(
            insumoId
          );
        item.registros += 1;
        item.periodos.add(
          periodo
        );
        item.cantidadTotal +=
          Number(
            consumo.cantidadUtilizada ||
              0
          );
      }
      const detalle = Array.from(
        agrupados.values()
      )
        .map((item) => ({
          insumoId:
            item.insumoId,
          insumo:
            item.insumo,
          unidadMedida:
            item.unidadMedida,
          registros:
            item.registros,
          periodos:
            item.periodos.size,
          cantidadTotal:
            Math.round(
              item.cantidadTotal *
                100
            ) / 100,
          suficiente:
            item.periodos.size >=
            PERIODOS_MINIMOS
        }))
        .sort(
          (a, b) =>
            b.registros -
            a.registros
        );
      const insumosSuficientes =
        detalle.filter(
          (item) =>
            item.suficiente
        ).length;
      return res.json({
        resumen: {
          totalRegistros:
            consumos.length,
          totalInsumos:
            detalle.length,
          insumosSuficientes,
          insumosInsuficientes:
            detalle.length -
            insumosSuficientes,
          periodosMinimos:
            PERIODOS_MINIMOS,
          fechaInicial,
          fechaFinal
        },
        insumos:
          detalle
      });
    } catch (error) {
      console.error(
        'Error al obtener resumen del dataset:',
        error
      );
      return res.status(500).json({
        mensaje:
          'No se pudo obtener el resumen del dataset.'
      });
    }
  };
/* =====================================================
   PREDICCIÓN GENERAL
===================================================== */
export const predecirConsumoInsumos =
  async (req, res) => {
    try {
      const horizonteMeses =
        Math.max(
          1,
          Math.min(
            Number(
              req.query.horizonteMeses ||
                3
            ),
            12
          )
        );
      const consumos =
        await obtenerConsumosValidos();
      if (
        consumos.length === 0
      ) {
        return res.json({
          mensaje:
            'No existen consumos válidos para generar predicciones.',
          generadoEn:
            new Date(),
          totalPredicciones:
            0,
          predicciones: [],
          datosInsuficientes:
            []
        });
      }
      const datos =
        transformarDataset(
          consumos
        );
      const resultadoML =
        await llamarServicioML({
          datos,
          horizonteMeses
        });
      const insumos =
        await Insumo.find({
          estado: {
            $ne: 'inactivo'
          }
        }).lean();
      const mapaInsumos =
        new Map(
          insumos.map(
            (insumo) => [
              insumo._id.toString(),
              insumo
            ]
          )
        );
      const predicciones =
        (
          resultadoML.predicciones ||
          []
        ).map(
          (prediccion) =>
            enriquecerPrediccion(
              prediccion,
              mapaInsumos.get(
                prediccion.insumoId
              )
            )
        );
      return res.json({
        mensaje:
          resultadoML.mensaje ||
          'Predicción generada correctamente.',
        modelo:
          resultadoML.modelo,
        generadoEn:
          resultadoML.generadoEn ||
          new Date(),
        totalPredicciones:
          predicciones.length,
        totalPrediccionesML:
          Number(
            resultadoML
              .totalPrediccionesML ||
            0
          ),
        totalEstimacionesPreliminares:
          Number(
            resultadoML
              .totalEstimacionesPreliminares ||
            0
          ),
        totalInsuficientes:
          (
            resultadoML
              .datosInsuficientes ||
            []
          ).length,
        predicciones,
        datosInsuficientes:
          resultadoML
            .datosInsuficientes ||
          []
      });
    } catch (error) {
      console.error(
        'Error al generar predicción general:',
        error
      );
      const status =
        error.response?.status ===
          400
          ? 400
          : 503;
      return res
        .status(status)
        .json({
          mensaje:
            obtenerMensajeAxios(
              error,
              'No se pudo generar la predicción de consumo.'
            )
        });
    }
  };
/* =====================================================
   PREDICCIÓN POR INSUMO
===================================================== */
export const predecirConsumoPorInsumo =
  async (req, res) => {
    try {
      const {
        insumoId
      } = req.params;
      if (
        !mongoose.Types.ObjectId.isValid(
          insumoId
        )
      ) {
        return res.status(400).json({
          mensaje:
            'El identificador del insumo no es válido.'
        });
      }
      const insumo =
        await Insumo.findById(
          insumoId
        ).lean();
      if (!insumo) {
        return res.status(404).json({
          mensaje:
            'Insumo no encontrado.'
        });
      }
      if (
        insumo.estado ===
        'inactivo'
      ) {
        return res.status(409).json({
          mensaje:
            'No se puede generar una predicción para un insumo inactivo.'
        });
      }
      const consumos =
        await obtenerConsumosValidos({
          insumoId
        });
      if (
        consumos.length === 0
      ) {
        return res.status(400).json({
          mensaje:
            'No existen consumos válidos para este insumo.'
        });
      }
      const horizonteMeses =
        Math.max(
          1,
          Math.min(
            Number(
              req.query.horizonteMeses ||
                3
            ),
            12
          )
        );
      const resultadoML =
        await llamarServicioML({
          datos:
            transformarDataset(
              consumos
            ),
          horizonteMeses
        });
      const prediccionBase =
        resultadoML
          .predicciones?.[0];
      if (!prediccionBase) {
        const insuficiente =
          resultadoML
            .datosInsuficientes?.[0];
        return res.status(400).json({
          mensaje:
            insuficiente?.mensaje ||
            'No existen suficientes periodos para predecir este insumo.',
          datos:
            insuficiente || null
        });
      }
      const prediccion =
        enriquecerPrediccion(
          prediccionBase,
          insumo
        );
      const esPreliminar =
        Boolean(
          prediccion.esPreliminar
        ) ||
        prediccion.tipoResultado ===
          'estimacion_preliminar';
      return res.json({
        mensaje:
          esPreliminar
            ? 'Estimación preliminar generada con los registros disponibles.'
            : 'Predicción del insumo generada correctamente.',
        modelo:
          resultadoML.modelo,
        generadoEn:
          resultadoML.generadoEn ||
          new Date(),
        prediccion
      });
    } catch (error) {
      console.error(
        'Error al generar predicción por insumo:',
        error
      );
      const status =
        error.response?.status ===
          400
          ? 400
          : 503;
      return res
        .status(status)
        .json({
          mensaje:
            obtenerMensajeAxios(
              error,
              'No se pudo generar la predicción del insumo.'
            )
        });
    }
  };
