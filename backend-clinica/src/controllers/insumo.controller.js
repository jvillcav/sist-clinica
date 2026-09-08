import mongoose from 'mongoose';

import Insumo from '../models/Insumo.js';
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

const normalizarCodigo = (
  valor = ''
) => {
  return normalizarTexto(valor)
    .toUpperCase();
};

const escaparRegex = (
  texto = ''
) => {
  return String(texto).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};

const convertirNumeroNoNegativo = (
  valor,
  nombreCampo
) => {
  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < 0
  ) {
    const error = new Error(
      `${nombreCampo} debe ser un número igual o mayor que cero.`
    );

    error.statusCode = 400;

    throw error;
  }

  return numero;
};

const convertirNumeroPositivo = (
  valor,
  nombreCampo
) => {
  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    const error = new Error(
      `${nombreCampo} debe ser un número mayor que cero.`
    );

    error.statusCode = 400;

    throw error;
  }

  return numero;
};

const convertirBooleano = (
  valor,
  nombreCampo
) => {
  if (typeof valor === 'boolean') {
    return valor;
  }

  if (
    valor === 1 ||
    valor === '1' ||
    normalizarTexto(valor)
      .toLowerCase() === 'true' ||
    normalizarTexto(valor)
      .toLowerCase() === 'si' ||
    normalizarTexto(valor)
      .toLowerCase() === 'sí'
  ) {
    return true;
  }

  if (
    valor === 0 ||
    valor === '0' ||
    normalizarTexto(valor)
      .toLowerCase() === 'false' ||
    normalizarTexto(valor)
      .toLowerCase() === 'no'
  ) {
    return false;
  }

  const error = new Error(
    `${nombreCampo} debe ser verdadero o falso.`
  );

  error.statusCode = 400;

  throw error;
};

const convertirFechaOpcional = (
  valor
) => {
  if (
    valor === undefined ||
    valor === null ||
    normalizarTexto(valor) === ''
  ) {
    return null;
  }

  const fecha = new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    const error = new Error(
      'La fecha de vencimiento no es válida.'
    );

    error.statusCode = 400;

    throw error;
  }

  return fecha;
};

const validarValorPermitido = (
  valor,
  permitidos,
  nombreCampo
) => {
  const valorNormalizado =
    normalizarTexto(valor)
      .toLowerCase();

  if (
    !permitidos.includes(
      valorNormalizado
    )
  ) {
    const error = new Error(
      `${nombreCampo} no tiene un valor válido.`
    );

    error.statusCode = 400;

    throw error;
  }

  return valorNormalizado;
};

const verificarNombreDuplicado =
  async (
    nombre,
    excluirId = null,
    session = null
  ) => {
    const filtro = {
      nombre: {
        $regex: new RegExp(
          `^${escaparRegex(nombre)}$`,
          'i'
        )
      }
    };

    if (excluirId) {
      filtro._id = {
        $ne: excluirId
      };
    }

    let consulta =
      Insumo.findOne(filtro);

    if (session) {
      consulta =
        consulta.session(session);
    }

    return consulta;
  };

const verificarCodigoDuplicado =
  async (
    codigo,
    excluirId = null
  ) => {
    const filtro = {
      codigo:
        normalizarCodigo(codigo)
    };

    if (excluirId) {
      filtro._id = {
        $ne: excluirId
      };
    }

    return Insumo.findOne(
      filtro
    );
  };

const responderError = (
  res,
  error,
  mensajePredeterminado
) => {
  if (
    error?.code === 11000
  ) {
    const campo =
      Object.keys(
        error.keyPattern || {}
      )[0];

    return res.status(409).json({
      mensaje:
        campo === 'codigo'
          ? 'Ya existe un insumo registrado con ese código.'
          : 'Ya existe un insumo con los mismos datos únicos.'
    });
  }

  if (
    error?.name ===
    'ValidationError'
  ) {
    const primerError =
      Object.values(
        error.errors || {}
      )[0];

    return res.status(400).json({
      mensaje:
        primerError?.message ||
        'Los datos del insumo no son válidos.'
    });
  }

  const estado =
    error.statusCode || 500;

  return res
    .status(estado)
    .json({
      mensaje:
        estado === 500
          ? mensajePredeterminado
          : error.message
    });
};

/* =====================================================
   CREAR INSUMO
===================================================== */

export const crearInsumo =
  async (req, res) => {
    try {
      const {
        codigo,
        nombre,
        descripcion = '',
        categoria = 'General',
        unidadMedida,
        stockActual = 0,
        stockMinimo = 0,
        costoUnitario = 0,
        prioridad = 'media',
        especialidad = 'Todas',
        aplicacion = 'base',
        usarEnML = true,
        controlVencimiento = false,
        lote = '',
        fechaVencimiento = null,
        fuenteReferencia = ''
      } = req.body;

      const codigoLimpio =
        normalizarCodigo(codigo);

      const nombreLimpio =
        normalizarTexto(nombre);

      const unidadLimpia =
        normalizarTexto(
          unidadMedida
        );

      if (!codigoLimpio) {
        return res.status(400).json({
          mensaje:
            'El código del insumo es obligatorio.'
        });
      }

      if (!nombreLimpio) {
        return res.status(400).json({
          mensaje:
            'El nombre del insumo es obligatorio.'
        });
      }

      if (!unidadLimpia) {
        return res.status(400).json({
          mensaje:
            'La unidad de medida es obligatoria.'
        });
      }

      const insumoDuplicado =
        await verificarNombreDuplicado(
          nombreLimpio
        );

      const codigoDuplicado =
        await verificarCodigoDuplicado(
          codigoLimpio
        );

      if (codigoDuplicado) {
        return res.status(409).json({
          mensaje:
            'Ya existe un insumo registrado con ese código.'
        });
      }

      if (insumoDuplicado) {
        return res.status(409).json({
          mensaje:
            'Ya existe un insumo registrado con ese nombre.'
        });
      }

      const nuevoInsumo =
        await Insumo.create({
          codigo:
            codigoLimpio,

          nombre:
            nombreLimpio,

          descripcion:
            normalizarTexto(
              descripcion
            ),

          categoria:
            normalizarTexto(
              categoria
            ) || 'General',

          unidadMedida:
            unidadLimpia,

          stockActual:
            convertirNumeroNoNegativo(
              stockActual,
              'El stock actual'
            ),

          stockMinimo:
            convertirNumeroNoNegativo(
              stockMinimo,
              'El stock mínimo'
            ),

          costoUnitario:
            convertirNumeroNoNegativo(
              costoUnitario,
              'El costo unitario'
            ),

          prioridad:
            validarValorPermitido(
              prioridad,
              [
                'critica',
                'alta',
                'media',
                'baja'
              ],
              'La prioridad'
            ),

          especialidad:
            normalizarTexto(
              especialidad
            ) || 'Todas',

          aplicacion:
            validarValorPermitido(
              aplicacion,
              [
                'base',
                'condicional'
              ],
              'La aplicación'
            ),

          usarEnML:
            convertirBooleano(
              usarEnML,
              'El campo usarEnML'
            ),

          controlVencimiento:
            convertirBooleano(
              controlVencimiento,
              'El control de vencimiento'
            ),

          lote:
            normalizarTexto(
              lote
            ),

          fechaVencimiento:
            convertirFechaOpcional(
              fechaVencimiento
            ),

          fuenteReferencia:
            normalizarTexto(
              fuenteReferencia
            ),

          estado:
            'activo'
        });

      return res.status(201).json({
        mensaje:
          'Insumo registrado correctamente.',

        insumo:
          nuevoInsumo
      });
    } catch (error) {
      console.error(
        'Error al crear insumo:',
        error
      );

      return responderError(
        res,
        error,
        'No se pudo registrar el insumo.'
      );
    }
  };

/* =====================================================
   OBTENER INSUMOS

   Filtros opcionales:
   buscar
   estado
   categoria
   stock
===================================================== */

export const obtenerInsumos =
  async (req, res) => {
    try {
      const {
        buscar = '',
        estado = 'todos',
        categoria = 'todas',
        stock = 'todos',
        prioridad = 'todas',
        aplicacion = 'todas',
        usarEnML = 'todos',
        controlVencimiento = 'todos',
        sinPaginar = 'false'
      } = req.query;

      const filtro = {};

      const textoBusqueda =
        normalizarTexto(buscar);

      if (textoBusqueda) {
        const expresion =
          new RegExp(
            escaparRegex(
              textoBusqueda
            ),
            'i'
          );

        filtro.$or = [
          {
            codigo:
              expresion
          },
          {
            nombre:
              expresion
          },
          {
            descripcion:
              expresion
          },
          {
            categoria:
              expresion
          },
          {
            unidadMedida:
              expresion
          },
          {
            especialidad:
              expresion
          },
          {
            lote:
              expresion
          }
        ];
      }

      if (
        estado &&
        estado !== 'todos'
      ) {
        filtro.estado =
          estado;
      }

      if (
        categoria &&
        categoria !== 'todas'
      ) {
        filtro.categoria =
          categoria;
      }

      if (
        prioridad &&
        prioridad !== 'todas'
      ) {
        filtro.prioridad =
          prioridad;
      }

      if (
        aplicacion &&
        aplicacion !== 'todas'
      ) {
        filtro.aplicacion =
          aplicacion;
      }

      if (
        usarEnML !== 'todos'
      ) {
        filtro.usarEnML =
          convertirBooleano(
            usarEnML,
            'El filtro usarEnML'
          );
      }

      if (
        controlVencimiento !==
        'todos'
      ) {
        filtro.controlVencimiento =
          convertirBooleano(
            controlVencimiento,
            'El filtro de vencimiento'
          );
      }

      if (stock === 'agotado') {
        filtro.stockActual = {
          $lte: 0
        };
      }

      if (stock === 'bajo') {
        filtro.$expr = {
          $and: [
            {
              $gt: [
                '$stockActual',
                0
              ]
            },
            {
              $lte: [
                '$stockActual',
                '$stockMinimo'
              ]
            }
          ]
        };
      }

      if (
        stock === 'disponible'
      ) {
        filtro.$expr = {
          $gt: [
            '$stockActual',
            '$stockMinimo'
          ]
        };
      }

      const orden = {
        estado: 1,
        nombre: 1
      };

      if (
        normalizarTexto(
          sinPaginar
        ).toLowerCase() ===
        'true'
      ) {
        const insumos =
          await Insumo.find(
            filtro
          )
            .sort(orden)
            .lean();

        return res.json({
          total:
            insumos.length,
          paginacion: null,
          insumos
        });
      }

      const { datos: insumos, paginacion } = await paginarConsulta({
        req,
        res,
        consulta: Insumo.find(filtro)
          .sort(orden)
          .lean(),
        contar: Insumo.countDocuments(filtro)
      });

      return res.json({
        total: paginacion.total,
        paginacion,
        insumos
      });
    } catch (error) {
      console.error(
        'Error al obtener insumos:',
        error
      );

      return responderError(
        res,
        error,
        'No se pudieron obtener los insumos.'
      );
    }
  };

/* =====================================================
   RESUMEN DE INVENTARIO
===================================================== */

export const obtenerResumenInsumos =
  async (req, res) => {
    try {
      const [
        totalInsumos,
        insumosActivos,
        insumosInactivos,
        insumosBajoStock,
        insumosAgotados,
        resultadoValor
      ] = await Promise.all([
        Insumo.countDocuments(),

        /*
         * $ne incluye documentos antiguos
         * que todavía no tienen campo estado.
         */
        Insumo.countDocuments({
          estado: {
            $ne: 'inactivo'
          }
        }),

        Insumo.countDocuments({
          estado: 'inactivo'
        }),

        Insumo.countDocuments({
          estado: {
            $ne: 'inactivo'
          },

          $expr: {
            $and: [
              {
                $gt: [
                  '$stockActual',
                  0
                ]
              },
              {
                $lte: [
                  '$stockActual',
                  '$stockMinimo'
                ]
              }
            ]
          }
        }),

        Insumo.countDocuments({
          estado: {
            $ne: 'inactivo'
          },

          stockActual: {
            $lte: 0
          }
        }),

        Insumo.aggregate([
          {
            $match: {
              estado: {
                $ne: 'inactivo'
              }
            }
          },
          {
            $group: {
              _id: null,

              valorInventario: {
                $sum: {
                  $multiply: [
                    {
                      $ifNull: [
                        '$stockActual',
                        0
                      ]
                    },
                    {
                      $ifNull: [
                        '$costoUnitario',
                        0
                      ]
                    }
                  ]
                }
              },

              unidadesDisponibles: {
                $sum: {
                  $ifNull: [
                    '$stockActual',
                    0
                  ]
                }
              }
            }
          }
        ])
      ]);

      return res.json({
        resumen: {
          totalInsumos,
          insumosActivos,
          insumosInactivos,
          insumosBajoStock,
          insumosAgotados,

          unidadesDisponibles:
            resultadoValor[0]
              ?.unidadesDisponibles ||
            0,

          valorInventario:
            resultadoValor[0]
              ?.valorInventario ||
            0
        }
      });
    } catch (error) {
      console.error(
        'Error al obtener resumen de insumos:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el resumen del inventario.'
      });
    }
  };

/* =====================================================
   OBTENER UN INSUMO
===================================================== */

export const obtenerInsumo =
  async (req, res) => {
    try {
      const insumo =
        await Insumo.findById(
          req.params.id
        ).lean();

      if (!insumo) {
        return res.status(404).json({
          mensaje:
            'Insumo no encontrado.'
        });
      }

      return res.json({
        insumo
      });
    } catch (error) {
      console.error(
        'Error al obtener insumo:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el insumo.'
      });
    }
  };

/* =====================================================
   INSUMOS CON BAJO STOCK
===================================================== */

export const obtenerInsumosBajoStock =
  async (req, res) => {
    try {
      const insumos =
        await Insumo.find({
          estado: {
            $ne: 'inactivo'
          },

          $expr: {
            $lte: [
              '$stockActual',
              '$stockMinimo'
            ]
          }
        })
          .sort({
            stockActual: 1,
            nombre: 1
          })
          .lean();

      return res.json({
        total:
          insumos.length,

        insumos
      });
    } catch (error) {
      console.error(
        'Error al obtener insumos con bajo stock:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudieron obtener las alertas de stock.'
      });
    }
  };

/* =====================================================
   ACTUALIZAR INSUMO

   No se modifica el stock aquí.
   El stock cambia mediante reabastecimientos o consumos.
===================================================== */

export const actualizarInsumo =
  async (req, res) => {
    try {
      const insumo =
        await Insumo.findById(
          req.params.id
        );

      if (!insumo) {
        return res.status(404).json({
          mensaje:
            'Insumo no encontrado.'
        });
      }

      const {
        codigo,
        nombre,
        descripcion,
        categoria,
        unidadMedida,
        stockMinimo,
        costoUnitario,
        prioridad,
        especialidad,
        aplicacion,
        usarEnML,
        controlVencimiento,
        lote,
        fechaVencimiento,
        fuenteReferencia
      } = req.body;

      if (
        codigo !== undefined
      ) {
        const codigoLimpio =
          normalizarCodigo(
            codigo
          );

        if (!codigoLimpio) {
          return res.status(400).json({
            mensaje:
              'El código del insumo es obligatorio.'
          });
        }

        const codigoDuplicado =
          await verificarCodigoDuplicado(
            codigoLimpio,
            insumo._id
          );

        if (codigoDuplicado) {
          return res.status(409).json({
            mensaje:
              'Ya existe otro insumo registrado con ese código.'
          });
        }

        insumo.codigo =
          codigoLimpio;
      }

      if (
        nombre !== undefined
      ) {
        const nombreLimpio =
          normalizarTexto(nombre);

        if (!nombreLimpio) {
          return res.status(400).json({
            mensaje:
              'El nombre del insumo es obligatorio.'
          });
        }

        const duplicado =
          await verificarNombreDuplicado(
            nombreLimpio,
            insumo._id
          );

        if (duplicado) {
          return res.status(409).json({
            mensaje:
              'Ya existe otro insumo registrado con ese nombre.'
          });
        }

        insumo.nombre =
          nombreLimpio;
      }

      if (
        descripcion !== undefined
      ) {
        insumo.descripcion =
          normalizarTexto(
            descripcion
          );
      }

      if (
        categoria !== undefined
      ) {
        insumo.categoria =
          normalizarTexto(
            categoria
          ) || 'General';
      }

      if (
        unidadMedida !==
        undefined
      ) {
        const unidadLimpia =
          normalizarTexto(
            unidadMedida
          );

        if (!unidadLimpia) {
          return res.status(400).json({
            mensaje:
              'La unidad de medida es obligatoria.'
          });
        }

        insumo.unidadMedida =
          unidadLimpia;
      }

      if (
        stockMinimo !== undefined
      ) {
        insumo.stockMinimo =
          convertirNumeroNoNegativo(
            stockMinimo,
            'El stock mínimo'
          );
      }

      if (
        costoUnitario !==
        undefined
      ) {
        insumo.costoUnitario =
          convertirNumeroNoNegativo(
            costoUnitario,
            'El costo unitario'
          );
      }

      if (
        prioridad !== undefined
      ) {
        insumo.prioridad =
          validarValorPermitido(
            prioridad,
            [
              'critica',
              'alta',
              'media',
              'baja'
            ],
            'La prioridad'
          );
      }

      if (
        especialidad !==
        undefined
      ) {
        insumo.especialidad =
          normalizarTexto(
            especialidad
          ) || 'Todas';
      }

      if (
        aplicacion !== undefined
      ) {
        insumo.aplicacion =
          validarValorPermitido(
            aplicacion,
            [
              'base',
              'condicional'
            ],
            'La aplicación'
          );
      }

      if (
        usarEnML !== undefined
      ) {
        insumo.usarEnML =
          convertirBooleano(
            usarEnML,
            'El campo usarEnML'
          );
      }

      if (
        controlVencimiento !==
        undefined
      ) {
        insumo.controlVencimiento =
          convertirBooleano(
            controlVencimiento,
            'El control de vencimiento'
          );
      }

      if (
        lote !== undefined
      ) {
        insumo.lote =
          normalizarTexto(
            lote
          );
      }

      if (
        fechaVencimiento !==
        undefined
      ) {
        insumo.fechaVencimiento =
          convertirFechaOpcional(
            fechaVencimiento
          );
      }

      if (
        fuenteReferencia !==
        undefined
      ) {
        insumo.fuenteReferencia =
          normalizarTexto(
            fuenteReferencia
          );
      }

      await insumo.save();

      return res.json({
        mensaje:
          'Insumo actualizado correctamente.',

        insumo
      });
    } catch (error) {
      console.error(
        'Error al actualizar insumo:',
        error
      );

      return responderError(
        res,
        error,
        'No se pudo actualizar el insumo.'
      );
    }
  };

/* =====================================================
   CAMBIAR ESTADO

   Sustituye la eliminación física.
===================================================== */

export const cambiarEstadoInsumo =
  async (req, res) => {
    try {
      const estado =
        normalizarTexto(
          req.body.estado
        ).toLowerCase();

      if (
        ![
          'activo',
          'inactivo'
        ].includes(estado)
      ) {
        return res.status(400).json({
          mensaje:
            'El estado debe ser activo o inactivo.'
        });
      }

      const insumo =
        await Insumo.findById(
          req.params.id
        );

      if (!insumo) {
        return res.status(404).json({
          mensaje:
            'Insumo no encontrado.'
        });
      }

      insumo.estado =
        estado;

      await insumo.save();

      return res.json({
        mensaje:
          estado === 'activo'
            ? 'Insumo activado correctamente.'
            : 'Insumo desactivado correctamente.',

        insumo
      });
    } catch (error) {
      console.error(
        'Error al cambiar estado del insumo:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo cambiar el estado del insumo.'
      });
    }
  };

/* =====================================================
   COMPATIBILIDAD CON DELETE ANTIGUO

   No elimina el documento.
   Solo lo marca como inactivo.
===================================================== */

export const eliminarInsumo =
  async (req, res) => {
    try {
      const insumo =
        await Insumo.findById(
          req.params.id
        );

      if (!insumo) {
        return res.status(404).json({
          mensaje:
            'Insumo no encontrado.'
        });
      }

      insumo.estado =
        'inactivo';

      await insumo.save();

      return res.json({
        mensaje:
          'Insumo desactivado correctamente.',

        insumo
      });
    } catch (error) {
      console.error(
        'Error al desactivar insumo:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo desactivar el insumo.'
      });
    }
  };

/* =====================================================
   REABASTECER INSUMO

   Actualiza el stock y guarda el historial
   dentro de una misma transacción.
===================================================== */

export const reabastecerInsumo =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    const abortarTransaccion =
      async () => {
        if (
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }
      };

    try {
      session.startTransaction();

      const {
        cantidad,
        proveedor = '',
        observacion = ''
      } = req.body;

      const cantidadNumerica =
        convertirNumeroPositivo(
          cantidad,
          'La cantidad'
        );

      const insumo =
        await Insumo.findById(
          req.params.id
        ).session(session);

      if (!insumo) {
        await abortarTransaccion();

        return res.status(404).json({
          mensaje:
            'Insumo no encontrado.'
        });
      }

      if (
        insumo.estado ===
        'inactivo'
      ) {
        await abortarTransaccion();

        return res.status(409).json({
          mensaje:
            'No se puede reabastecer un insumo inactivo.'
        });
      }

      insumo.stockActual =
        Number(
          insumo.stockActual || 0
        ) +
        cantidadNumerica;

      await insumo.save({
        session
      });

      const [
        reabastecimiento
      ] =
        await Reabastecimiento.create(
          [
            {
              insumoId:
                insumo._id,

              cantidad:
                cantidadNumerica,

              proveedor:
                normalizarTexto(
                  proveedor
                ),

              observacion:
                normalizarTexto(
                  observacion
                )
            }
          ],
          {
            session
          }
        );

      await session.commitTransaction();

      return res.json({
        mensaje:
          'Insumo reabastecido correctamente.',

        insumo,

        reabastecimiento
      });
    } catch (error) {
      await abortarTransaccion();

      console.error(
        'Error al reabastecer insumo:',
        error
      );

      return responderError(
        res,
        error,
        'No se pudo reabastecer el insumo.'
      );
    } finally {
      await session.endSession();
    }
  };
