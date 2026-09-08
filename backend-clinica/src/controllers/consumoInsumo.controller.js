import mongoose from 'mongoose';

import ConsumoInsumo from '../models/ConsumoInsumo.js';
import Insumo from '../models/Insumo.js';
import Usuario from '../models/Usuario.js';
import Expediente from '../models/Expediente.js';
import { paginarConsulta } from '../utils/paginacion.js';

const obtenerUsuarioId = (req) => {
  return (
    req.usuario?.id ||
    req.usuario?._id ||
    null
  );
};

const escaparRegex = (texto = '') => {
  return String(texto).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};

const normalizarTexto = (valor = '') => {
  return String(valor).trim();
};

const obtenerNombreCompleto = (usuario) => {
  if (!usuario) {
    return '';
  }

  return [
    usuario.nombre,
    usuario.apellido
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const obtenerUsuarioAutenticado = async (
  req,
  session = null
) => {
  const usuarioId = obtenerUsuarioId(req);

  if (
    !usuarioId ||
    !mongoose.Types.ObjectId.isValid(usuarioId)
  ) {
    const error = new Error(
      'No se encontró el usuario autenticado.'
    );

    error.statusCode = 401;
    throw error;
  }

  let consulta = Usuario.findById(usuarioId).select(
    'nombre apellido correo rol estado'
  );

  if (session) {
    consulta = consulta.session(session);
  }

  const usuario = await consulta;

  if (!usuario) {
    const error = new Error(
      'Usuario autenticado no encontrado.'
    );

    error.statusCode = 404;
    throw error;
  }

  if (usuario.estado === false) {
    const error = new Error(
      'El usuario se encuentra inactivo.'
    );

    error.statusCode = 403;
    throw error;
  }

  return usuario;
};

const poblarConsumos = (consulta) => {
  return consulta
    .populate({
      path: 'insumoId',
      select: [
        'nombre',
        'descripcion',
        'unidadMedida',
        'unidad',
        'stockActual',
        'stockMinimo',
        'estado'
      ].join(' ')
    })
    .populate({
      path: 'odontologoId',
      select:
        'nombre apellido correo rol estado'
    })
    .populate({
      path: 'expedienteId',
      select: [
        'pacienteId',
        'odontologoId',
        'odontologo',
        'diagnostico',
        'tratamiento',
        'motivoConsulta',
        'fechaAtencion',
        'estadoRegistro'
      ].join(' '),

      populate: [
        {
          path: 'pacienteId',
          select:
            'nombre apellido ci telefono email estado'
        },
        {
          path: 'odontologoId',
          select:
            'nombre apellido correo rol estado'
        }
      ]
    });
};

export const registrarConsumo = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const usuario =
      await obtenerUsuarioAutenticado(
        req,
        session
      );

    if (usuario.rol !== 'administrador') {
      await session.abortTransaction();

      return res.status(403).json({
        mensaje:
          'El consumo manual solo puede registrarlo un administrador. Los odontólogos deben registrar los insumos desde la atención médica.'
      });
    }

    const {
      insumoId,
      expedienteId,
      cantidadUtilizada,
      tipoTratamiento,
      odontologoId = null,
      observacion = ''
    } = req.body;

    if (
      !insumoId ||
      !mongoose.Types.ObjectId.isValid(insumoId)
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        mensaje:
          'Debe seleccionar un insumo válido.'
      });
    }

    if (
      !expedienteId ||
      !mongoose.Types.ObjectId.isValid(expedienteId)
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        mensaje:
          'Debe seleccionar un expediente válido.'
      });
    }

    const cantidad =
      Number(cantidadUtilizada);

    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        mensaje:
          'La cantidad utilizada debe ser mayor que cero.'
      });
    }

    const expediente =
      await Expediente.findById(
        expedienteId
      ).session(session);

    if (!expediente) {
      await session.abortTransaction();

      return res.status(404).json({
        mensaje:
          'El expediente seleccionado no existe.'
      });
    }

    if (
      expediente.estadoRegistro ===
      'anulado'
    ) {
      await session.abortTransaction();

      return res.status(409).json({
        mensaje:
          'No se puede registrar un consumo en un expediente anulado.'
      });
    }

    let odontologo = null;

    const idOdontologo =
      odontologoId ||
      expediente.odontologoId ||
      null;

    if (
      idOdontologo &&
      mongoose.Types.ObjectId.isValid(
        idOdontologo
      )
    ) {
      odontologo =
        await Usuario.findById(
          idOdontologo
        )
          .select(
            'nombre apellido rol estado'
          )
          .session(session);

      if (!odontologo) {
        await session.abortTransaction();

        return res.status(404).json({
          mensaje:
            'El odontólogo asociado no fue encontrado.'
        });
      }

      if (
        odontologo.rol !==
        'odontologo'
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          mensaje:
            'El usuario seleccionado no corresponde a un odontólogo.'
        });
      }
    }

    const nombreOdontologo =
      obtenerNombreCompleto(odontologo) ||
      normalizarTexto(
        expediente.odontologo
      ) ||
      'Odontólogo no identificado';

    const tratamiento =
      normalizarTexto(tipoTratamiento) ||
      normalizarTexto(
        expediente.tratamiento
      );

    if (!tratamiento) {
      await session.abortTransaction();

      return res.status(400).json({
        mensaje:
          'Debe registrar el tipo de tratamiento.'
      });
    }

    const insumoActualizado =
      await Insumo.findOneAndUpdate(
        {
          _id: insumoId,

          stockActual: {
            $gte: cantidad
          }
        },
        {
          $inc: {
            stockActual: -cantidad
          }
        },
        {
          new: true,
          session
        }
      );

    if (!insumoActualizado) {
      const insumoExistente =
        await Insumo.findById(
          insumoId
        ).session(session);

      await session.abortTransaction();

      if (!insumoExistente) {
        return res.status(404).json({
          mensaje:
            'El insumo seleccionado no existe.'
        });
      }

      return res.status(400).json({
        mensaje: `Stock insuficiente para ${insumoExistente.nombre}. Disponible: ${insumoExistente.stockActual}.`
      });
    }

    const [consumo] =
      await ConsumoInsumo.create(
        [
          {
            insumoId:
              insumoActualizado._id,

            expedienteId:
              expediente._id,

            odontologoId:
              odontologo?._id ||
              expediente.odontologoId ||
              null,

            odontologo:
              nombreOdontologo,

            cantidadUtilizada:
              cantidad,

            tipoTratamiento:
              tratamiento,

            fechaConsumo:
              new Date(),

            origenRegistro:
              'ajuste_administrativo',

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

    const consumoCompleto =
      await poblarConsumos(
        ConsumoInsumo.findById(
          consumo._id
        )
      );

    return res.status(201).json({
      mensaje:
        'Consumo registrado correctamente.',

      consumo:
        consumoCompleto,

      stockActualizado:
        insumoActualizado.stockActual
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(
      'Error al registrar consumo:',
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        mensaje:
          error.statusCode ? error.message :
          'No se pudo registrar el consumo.'
      });
  } finally {
    await session.endSession();
  }
};

export const obtenerConsumos = async (
  req,
  res
) => {
  try {
    const usuario =
      await obtenerUsuarioAutenticado(req);

    if (
      ![
        'administrador',
        'odontologo'
      ].includes(usuario.rol)
    ) {
      return res.status(403).json({
        mensaje:
          'No tiene permisos para consultar los consumos.'
      });
    }

    const {
      desde,
      hasta,
      insumoId,
      expedienteId,
      odontologoId
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
            'El insumo seleccionado no es válido.'
        });
      }

      filtro.insumoId = insumoId;
    }

    if (expedienteId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          expedienteId
        )
      ) {
        return res.status(400).json({
          mensaje:
            'El expediente seleccionado no es válido.'
        });
      }

      filtro.expedienteId =
        expedienteId;
    }

    if (odontologoId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          odontologoId
        )
      ) {
        return res.status(400).json({
          mensaje:
            'El odontólogo seleccionado no es válido.'
        });
      }

      filtro.odontologoId =
        odontologoId;
    }

    if (desde || hasta) {
      filtro.fechaConsumo = {};

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
          return res.status(400).json({
            mensaje:
              'La fecha inicial no es válida.'
          });
        }

        filtro.fechaConsumo.$gte =
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
          return res.status(400).json({
            mensaje:
              'La fecha final no es válida.'
          });
        }

        filtro.fechaConsumo.$lte =
          fechaHasta;
      }
    }

    if (usuario.rol === 'odontologo') {
      const nombreCompleto =
        obtenerNombreCompleto(usuario);

      const nombresCompatibles = [
        usuario.nombre,
        nombreCompleto
      ]
        .filter(Boolean)
        .map(
          (nombre) =>
            new RegExp(
              `^${escaparRegex(
                nombre.trim()
              )}$`,
              'i'
            )
        );

      filtro.$or = [
        {
          odontologoId:
            usuario._id
        },

        ...nombresCompatibles.map(
          (regex) => ({
            odontologo: regex
          })
        )
      ];
    }

    const { datos: consumos, paginacion } = await paginarConsulta({
      req,
      res,
      consulta: poblarConsumos(ConsumoInsumo.find(filtro))
        .sort({ fechaConsumo: -1, createdAt: -1 })
        .lean(),
      contar: ConsumoInsumo.countDocuments(filtro)
    });

    return res.json({
      total: paginacion.total,
      paginacion,
      consumos
    });
  } catch (error) {
    console.error(
      'Error al obtener consumos:',
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        mensaje:
          error.statusCode ? error.message :
          'No se pudieron obtener los consumos.'
      });
  }
};

export const obtenerConsumosOdontologo =
  async (req, res) => {
    try {
      const usuario =
        await obtenerUsuarioAutenticado(req);

      if (
        usuario.rol !==
        'odontologo'
      ) {
        return res.status(403).json({
          mensaje:
            'El usuario autenticado no corresponde a un odontólogo.'
        });
      }

      const nombreCompleto =
        obtenerNombreCompleto(usuario);

      const nombresCompatibles = [
        usuario.nombre,
        nombreCompleto
      ]
        .filter(Boolean)
        .map(
          (nombre) =>
            new RegExp(
              `^${escaparRegex(
                nombre.trim()
              )}$`,
              'i'
            )
        );

      const filtroOdontologo = {
        $or: [
          {
            odontologoId:
              usuario._id
          },

          ...nombresCompatibles.map(
            (regex) => ({
              odontologo: regex
            })
          )
        ]
      };

      const consumos =
        await poblarConsumos(
          ConsumoInsumo.find(
            filtroOdontologo
          )
        )
          .sort({
            fechaConsumo: -1,
            createdAt: -1
          })
          .lean();

      const unidadesUtilizadas =
        consumos.reduce(
          (total, consumo) =>
            total +
            Number(
              consumo.cantidadUtilizada ||
                0
            ),
          0
        );

      const pacientesUnicos =
        new Set(
          consumos
            .map((consumo) =>
              consumo.expedienteId
                ?.pacienteId?._id
                ?.toString()
            )
            .filter(Boolean)
        ).size;

      const insumosBajoStock =
        new Set(
          consumos
            .filter((consumo) => {
              const insumo =
                consumo.insumoId;

              if (!insumo) {
                return false;
              }

              return (
                Number(
                  insumo.stockActual || 0
                ) <=
                Number(
                  insumo.stockMinimo || 0
                )
              );
            })
            .map((consumo) =>
              consumo.insumoId?._id
                ?.toString()
            )
            .filter(Boolean)
        ).size;

      return res.json({
        odontologo: {
          id: usuario._id,
          nombre: usuario.nombre,
          apellido:
            usuario.apellido || '',
          nombreCompleto:
            nombreCompleto ||
            usuario.nombre
        },

        resumen: {
          totalRegistros:
            consumos.length,

          unidadesUtilizadas,

          pacientesAtendidos:
            pacientesUnicos,

          insumosBajoStock
        },

        consumos
      });
    } catch (error) {
      console.error(
        'Error al obtener consumos del odontólogo:',
        error
      );

      return res
        .status(
          error.statusCode || 500
        )
        .json({
          mensaje:
            error.statusCode ? error.message :
            'No se pudo cargar el historial de consumos.'
        });
    }
  };
