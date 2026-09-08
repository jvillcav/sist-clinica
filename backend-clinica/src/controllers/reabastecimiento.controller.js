import mongoose from 'mongoose';

import Reabastecimiento from '../models/Reabastecimiento.js';
import { paginarConsulta } from '../utils/paginacion.js';


/* =====================================================
   UTILIDADES
===================================================== */

const normalizarTexto = (
  valor = ''
) => {
  return String(valor).trim();
};

const escaparRegex = (
  valor = ''
) => {
  return String(valor).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};

const crearRangoFecha = (
  desde,
  hasta
) => {
  const filtro = {};

  if (desde) {
    const fechaDesde =
      new Date(
        `${desde}T00:00:00`
      );

    if (
      Number.isNaN(
        fechaDesde.getTime()
      )
    ) {
      const error =
        new Error(
          'La fecha inicial no es válida.'
        );

      error.statusCode = 400;

      throw error;
    }

    filtro.$gte =
      fechaDesde;
  }

  if (hasta) {
    const fechaHasta =
      new Date(
        `${hasta}T23:59:59.999`
      );

    if (
      Number.isNaN(
        fechaHasta.getTime()
      )
    ) {
      const error =
        new Error(
          'La fecha final no es válida.'
        );

      error.statusCode = 400;

      throw error;
    }

    filtro.$lte =
      fechaHasta;
  }

  return filtro;
};

const poblarReabastecimientos = (
  consulta
) => {
  return consulta.populate({
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
  });
};


/* =====================================================
   LISTADO GENERAL

   Filtros:
   insumoId
   proveedor
   desde
   hasta
===================================================== */

export const obtenerReabastecimientos =
  async (req, res) => {
    try {
      const {
        insumoId,
        proveedor = '',
        desde,
        hasta
      } = req.query;

      const filtro = {};

      if (insumoId) {
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

        filtro.insumoId =
          insumoId;
      }

      const proveedorLimpio =
        normalizarTexto(
          proveedor
        );

      if (proveedorLimpio) {
        filtro.proveedor = {
          $regex:
            new RegExp(
              escaparRegex(
                proveedorLimpio
              ),
              'i'
            )
        };
      }

      if (desde || hasta) {
        filtro.fechaReabastecimiento =
          crearRangoFecha(
            desde,
            hasta
          );
      }

      const { datos: reabastecimientos, paginacion } = await paginarConsulta({
        req,
        res,
        consulta: poblarReabastecimientos(Reabastecimiento.find(filtro))
          .sort({ fechaReabastecimiento: -1, createdAt: -1 })
          .lean(),
        contar: Reabastecimiento.countDocuments(filtro)
      });

      return res.json({
        total: paginacion.total,
        paginacion,
        reabastecimientos
      });
    } catch (error) {
      console.error(
        'Error al obtener reabastecimientos:',
        error
      );

      return res
        .status(
          error.statusCode || 500
        )
        .json({
          mensaje:
            error.statusCode ? error.message :
            'No se pudieron obtener los reabastecimientos.'
        });
    }
  };


/* =====================================================
   REABASTECIMIENTOS POR INSUMO
===================================================== */

export const obtenerReabastecimientosPorInsumo =
  async (req, res) => {
    try {
      const {
        insumoId
      } = req.params;

      const {
        desde,
        hasta
      } = req.query;

      const filtro = {
        insumoId
      };

      if (desde || hasta) {
        filtro.fechaReabastecimiento =
          crearRangoFecha(
            desde,
            hasta
          );
      }

      const reabastecimientos =
        await poblarReabastecimientos(
          Reabastecimiento.find(
            filtro
          )
        )
          .sort({
            fechaReabastecimiento:
              -1,
            createdAt: -1
          })
          .lean();

      return res.json({
        insumoId,

        total:
          reabastecimientos.length,

        reabastecimientos
      });
    } catch (error) {
      console.error(
        'Error al obtener reabastecimientos del insumo:',
        error
      );

      return res
        .status(
          error.statusCode || 500
        )
        .json({
          mensaje:
            error.statusCode ? error.message :
            'No se pudieron obtener los reabastecimientos del insumo.'
        });
    }
  };


/* =====================================================
   RESUMEN DE REABASTECIMIENTOS
===================================================== */

export const obtenerResumenReabastecimientos =
  async (req, res) => {
    try {
      const ahora = new Date();

      const inicioMes =
        new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          1
        );

      const [
        totalMovimientos,
        movimientosMes,
        resultadoGeneral,
        resultadoMes,
        insumosReabastecidos
      ] = await Promise.all([
        Reabastecimiento.countDocuments(),

        Reabastecimiento.countDocuments({
          fechaReabastecimiento: {
            $gte: inicioMes
          }
        }),

        Reabastecimiento.aggregate([
          {
            $group: {
              _id: null,

              cantidadTotal: {
                $sum: {
                  $ifNull: [
                    '$cantidad',
                    0
                  ]
                }
              },

              ultimaFecha: {
                $max:
                  '$fechaReabastecimiento'
              }
            }
          }
        ]),

        Reabastecimiento.aggregate([
          {
            $match: {
              fechaReabastecimiento: {
                $gte: inicioMes
              }
            }
          },
          {
            $group: {
              _id: null,

              cantidadMes: {
                $sum: {
                  $ifNull: [
                    '$cantidad',
                    0
                  ]
                }
              }
            }
          }
        ]),

        Reabastecimiento.distinct(
          'insumoId'
        )
      ]);

      return res.json({
        resumen: {
          totalMovimientos,

          movimientosMes,

          cantidadTotal:
            resultadoGeneral[0]
              ?.cantidadTotal ||
            0,

          cantidadMes:
            resultadoMes[0]
              ?.cantidadMes ||
            0,

          insumosReabastecidos:
            insumosReabastecidos.length,

          ultimaFecha:
            resultadoGeneral[0]
              ?.ultimaFecha ||
            null
        }
      });
    } catch (error) {
      console.error(
        'Error al obtener resumen de reabastecimientos:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el resumen de reabastecimientos.'
      });
    }
  };
