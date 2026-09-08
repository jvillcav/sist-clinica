import mongoose from 'mongoose';

import Expediente from '../models/Expediente.js';
import Paciente from '../models/Paciente.js';
import ConsumoInsumo from '../models/ConsumoInsumo.js';
import Insumo from '../models/Insumo.js';
import Cita from '../models/Cita.js';
import Usuario from '../models/Usuario.js';
import { paginarConsulta } from '../utils/paginacion.js';

const crearErrorOperacion = (
  mensaje,
  statusCode = 400
) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;

  return error;
};

const normalizarTexto = (valor = '') => {
  return String(valor).trim();
};

const validarFecha = (valor) => {
  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime())
    ? null
    : fecha;
};

const crearRangoDia = (fechaTexto) => {
  const fecha = validarFecha(fechaTexto);

  if (!fecha) {
    return null;
  }

  const inicio = new Date(fecha);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(fecha);
  fin.setHours(23, 59, 59, 999);

  return {
    inicio,
    fin
  };
};

const agruparInsumosRepetidos = (
  insumos = []
) => {
  const agrupados = new Map();

  for (const item of insumos) {
    const insumoId = String(
      item.insumoId || ''
    ).trim();

    const cantidad = Number(
      item.cantidadUtilizada
    );

    if (!insumoId) {
      throw crearErrorOperacion(
        'Existe un insumo sin identificador.'
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        insumoId
      )
    ) {
      throw crearErrorOperacion(
        'Uno de los identificadores de insumo no es válido.'
      );
    }

    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      throw crearErrorOperacion(
        'Todas las cantidades de insumos deben ser mayores a cero.'
      );
    }

    const cantidadAnterior =
      agrupados.get(insumoId) || 0;

    agrupados.set(
      insumoId,
      cantidadAnterior + cantidad
    );
  }

  return Array.from(
    agrupados.entries()
  ).map(
    ([
      insumoId,
      cantidadUtilizada
    ]) => ({
      insumoId,
      cantidadUtilizada
    })
  );
};

const obtenerUsuarioAutenticado =
  async (
    req,
    session = null
  ) => {
    const usuarioId =
      req.usuario?.id ||
      req.usuario?._id;

    if (
      !usuarioId ||
      !mongoose.Types.ObjectId.isValid(
        usuarioId
      )
    ) {
      throw crearErrorOperacion(
        'No se encontró el usuario autenticado.',
        401
      );
    }

    let consulta = Usuario.findById(
      usuarioId
    ).select(
      'nombre apellido correo rol estado'
    );

    if (session) {
      consulta = consulta.session(
        session
      );
    }

    const usuario = await consulta;

    if (!usuario) {
      throw crearErrorOperacion(
        'No se encontró el usuario autenticado.',
        404
      );
    }

    if (usuario.estado === false) {
      throw crearErrorOperacion(
        'El usuario se encuentra inactivo.',
        403
      );
    }

    return usuario;
  };

const poblarExpediente = (
  consulta
) => {
  return consulta
    .populate(
      'pacienteId',
      [
        'nombre',
        'apellido',
        'ci',
        'telefono',
        'email',
        'fechaNacimiento',
        'genero',
        'tipoSangre',
        'alergias',
        'condicionesCronicas',
        'estado'
      ].join(' ')
    )
    .populate(
      'odontologoId',
      'nombre apellido correo rol estado'
    )
    .populate(
      'citaId',
      [
        'fecha',
        'hora',
        'motivo',
        'estado',
        'origen',
        'duracionMinutos'
      ].join(' ')
    )
    .populate(
      'anuladoPor',
      'nombre apellido correo'
    )
    .populate(
      'ultimaActualizacionPor',
      'nombre apellido correo'
    );
};

export const registrarAtencionCompleta =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      const {
        pacienteId,
        citaId = null,
        motivoConsulta = '',
        diagnostico,
        piezasDentales = '',
        tratamiento,
        prescripcion = '',
        observaciones = '',
        insumos = []
      } = req.body;

      if (
        !pacienteId ||
        !mongoose.Types.ObjectId.isValid(
          pacienteId
        )
      ) {
        throw crearErrorOperacion(
          'Debe seleccionar un paciente válido.'
        );
      }

      if (
        citaId &&
        !mongoose.Types.ObjectId.isValid(
          citaId
        )
      ) {
        throw crearErrorOperacion(
          'El identificador de la cita no es válido.'
        );
      }

      if (
        !normalizarTexto(
          diagnostico
        )
      ) {
        throw crearErrorOperacion(
          'El diagnóstico es obligatorio.'
        );
      }

      if (
        !normalizarTexto(
          tratamiento
        )
      ) {
        throw crearErrorOperacion(
          'El tratamiento es obligatorio.'
        );
      }

      if (!Array.isArray(insumos)) {
        throw crearErrorOperacion(
          'El listado de insumos no es válido.'
        );
      }

      const usuario =
        await obtenerUsuarioAutenticado(
          req,
          session
        );

      if (
        usuario.rol !==
        'odontologo'
      ) {
        throw crearErrorOperacion(
          'Solo un odontólogo puede registrar una atención clínica.',
          403
        );
      }

      const paciente =
        await Paciente.findById(
          pacienteId
        ).session(session);

      if (!paciente) {
        throw crearErrorOperacion(
          'Paciente no encontrado.',
          404
        );
      }

      if (
        paciente.estado === false
      ) {
        throw crearErrorOperacion(
          'No se puede registrar una atención para un paciente inactivo.',
          409
        );
      }

      let cita = null;

      if (citaId) {
        cita =
          await Cita.findById(
            citaId
          ).session(session);

        if (!cita) {
          throw crearErrorOperacion(
            'La cita asociada no fue encontrada.',
            404
          );
        }

        if (
          String(cita.pacienteId) !==
          String(paciente._id)
        ) {
          throw crearErrorOperacion(
            'La cita no corresponde al paciente seleccionado.'
          );
        }

        const odontologoCita =
          cita.odontologoId
            ? String(
                cita.odontologoId
              )
            : '';

        if (
          odontologoCita &&
          odontologoCita !==
            String(usuario._id)
        ) {
          throw crearErrorOperacion(
            'La cita está asignada a otro odontólogo.',
            403
          );
        }

        if (
          cita.estado ===
          'atendido'
        ) {
          throw crearErrorOperacion(
            'Esta cita ya fue registrada como atendida.'
          );
        }

        if (
          cita.estado ===
          'cancelado'
        ) {
          throw crearErrorOperacion(
            'No se puede registrar atención para una cita cancelada.'
          );
        }

        const expedienteExistente =
          await Expediente.findOne({
            citaId: cita._id,
            estadoRegistro: 'activo'
          }).session(session);

        if (expedienteExistente) {
          throw crearErrorOperacion(
            'Ya existe un expediente activo asociado a esta cita.',
            409
          );
        }
      }

      const insumosAgrupados =
        agruparInsumosRepetidos(
          insumos
        );

      /*
       * Validación previa del inventario.
       */
      for (
        const item of
        insumosAgrupados
      ) {
        const insumo =
          await Insumo.findById(
            item.insumoId
          ).session(session);

        if (!insumo) {
          throw crearErrorOperacion(
            'Uno de los insumos seleccionados no existe.',
            404
          );
        }

        if (
          Number(
            insumo.stockActual
          ) <
          Number(
            item.cantidadUtilizada
          )
        ) {
          throw crearErrorOperacion(
            `Stock insuficiente para ${insumo.nombre}. Disponible: ${insumo.stockActual}.`
          );
        }
      }

      const nombreOdontologo =
        [
          usuario.nombre,
          usuario.apellido
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

      const [expediente] =
        await Expediente.create(
          [
            {
              pacienteId:
                paciente._id,

              citaId:
                cita?._id || null,

              odontologoId:
                usuario._id,

              odontologo:
                nombreOdontologo ||
                usuario.nombre,

              motivoConsulta:
                normalizarTexto(
                  motivoConsulta
                ),

              diagnostico:
                normalizarTexto(
                  diagnostico
                ),

              piezasDentales:
                normalizarTexto(
                  piezasDentales
                ),

              tratamiento:
                normalizarTexto(
                  tratamiento
                ),

              prescripcion:
                normalizarTexto(
                  prescripcion
                ),

              observaciones:
                normalizarTexto(
                  observaciones
                ),

              fechaAtencion:
                new Date(),

              estadoRegistro:
                'activo',

              ultimaActualizacionPor:
                usuario._id
            }
          ],
          {
            session
          }
        );

      const consumosRegistrados =
        [];

      /*
       * Descuento de stock protegido.
       */
      for (
        const item of
        insumosAgrupados
      ) {
        const insumoActualizado =
          await Insumo.findOneAndUpdate(
            {
              _id:
                item.insumoId,

              stockActual: {
                $gte:
                  item.cantidadUtilizada
              }
            },
            {
              $inc: {
                stockActual:
                  -Number(
                    item.cantidadUtilizada
                  )
              }
            },
            {
              new: true,
              session
            }
          );

        if (!insumoActualizado) {
          throw crearErrorOperacion(
            'El stock de uno de los insumos cambió durante el registro. Intente nuevamente.'
          );
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
        usuario._id,

      odontologo:
        nombreOdontologo,

      cantidadUtilizada:
        Number(
          item.cantidadUtilizada
        ),

      tipoTratamiento:
        tratamiento,

      fechaConsumo:
        new Date(),

      origenRegistro:
        'atencion_clinica'
    }
  ],
  {
    session
  }
);

        consumosRegistrados.push(
          {
            consumo,

            insumo: {
              _id:
                insumoActualizado._id,

              nombre:
                insumoActualizado.nombre,

              unidad:
                insumoActualizado.unidad,

              stockActual:
                insumoActualizado.stockActual
            }
          }
        );
      }

      if (cita) {
        cita.estado = 'atendido';

        await cita.save({
          session
        });
      }

      await session.commitTransaction();

      const expedienteCompleto =
        await poblarExpediente(
          Expediente.findById(
            expediente._id
          )
        );

      return res
        .status(201)
        .json({
          mensaje:
            'Atención médica registrada correctamente.',

          expediente:
            expedienteCompleto,

          consumos:
            consumosRegistrados,

          citaActualizada:
            cita
              ? {
                  _id: cita._id,
                  estado:
                    cita.estado
                }
              : null
        });
    } catch (error) {
      await session.abortTransaction();

      console.error(
        'Error al registrar atención completa:',
        error
      );

      return res
        .status(
          error.statusCode || 500
        )
        .json({
          mensaje:
            error.statusCode ? error.message :
            'No se pudo registrar la atención médica.'
        });
    } finally {
      await session.endSession();
    }
  };

export const obtenerExpedientes =
  async (req, res) => {
    try {
      const {
        pacienteId,
        odontologoId,
        estadoRegistro,
        desde,
        hasta
      } = req.query;

      const filtro = {};

      if (pacienteId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            pacienteId
          )
        ) {
          return res.status(400).json({
            mensaje:
              'El paciente seleccionado no es válido.'
          });
        }

        filtro.pacienteId =
          pacienteId;
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

      if (
        estadoRegistro &&
        estadoRegistro !== 'todos'
      ) {
        filtro.estadoRegistro =
          estadoRegistro;
      }

      if (desde || hasta) {
        filtro.fechaAtencion = {};

        if (desde) {
          const rango =
            crearRangoDia(desde);

          if (!rango) {
            return res.status(400).json({
              mensaje:
                'La fecha inicial no es válida.'
            });
          }

          filtro.fechaAtencion.$gte =
            rango.inicio;
        }

        if (hasta) {
          const rango =
            crearRangoDia(hasta);

          if (!rango) {
            return res.status(400).json({
              mensaje:
                'La fecha final no es válida.'
            });
          }

          filtro.fechaAtencion.$lte =
            rango.fin;
        }
      }

      const { datos: expedientes, paginacion } = await paginarConsulta({
        req,
        res,
        consulta: poblarExpediente(Expediente.find(filtro))
          .sort({ fechaAtencion: -1, createdAt: -1 })
          .lean(),
        contar: Expediente.countDocuments(filtro)
      });

      return res.json({
        total: paginacion.total,
        paginacion,
        expedientes
      });
    } catch (error) {
      console.error(
        'Error al obtener expedientes:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudieron obtener los expedientes clínicos.'
      });
    }
  };

export const obtenerResumenExpedientes =
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
        totalExpedientes,
        expedientesActivos,
        expedientesAnulados,
        atencionesMes,
        pacientesConHistorial,
        odontologosConAtenciones
      ] = await Promise.all([
        Expediente.countDocuments(),

        Expediente.countDocuments({
          estadoRegistro: 'activo'
        }),

        Expediente.countDocuments({
          estadoRegistro: 'anulado'
        }),

        Expediente.countDocuments({
          fechaAtencion: {
            $gte: inicioMes
          },

          estadoRegistro: 'activo'
        }),

        Expediente.distinct(
          'pacienteId',
          {
            estadoRegistro: 'activo'
          }
        ),

        Expediente.distinct(
          'odontologoId',
          {
            estadoRegistro: 'activo',

            odontologoId: {
              $ne: null
            }
          }
        )
      ]);

      return res.json({
        resumen: {
          totalExpedientes,
          expedientesActivos,
          expedientesAnulados,
          atencionesMes,

          pacientesConHistorial:
            pacientesConHistorial.length,

          odontologosConAtenciones:
            odontologosConAtenciones.length
        }
      });
    } catch (error) {
      console.error(
        'Error al obtener resumen de expedientes:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el resumen de expedientes.'
      });
    }
  };

export const obtenerExpediente =
  async (req, res) => {
    try {
      const expediente =
        await poblarExpediente(
          Expediente.findById(
            req.params.id
          )
        ).lean();

      if (!expediente) {
        return res.status(404).json({
          mensaje:
            'Expediente no encontrado.'
        });
      }

      const consumos =
        await ConsumoInsumo.find({
          expedienteId:
            expediente._id
        })
          .populate(
            'insumoId',
            'nombre descripcion unidad stockActual stockMinimo'
          )
          .sort({
            fechaConsumo: -1
          })
          .lean();

      return res.json({
        expediente,
        consumos
      });
    } catch (error) {
      console.error(
        'Error al obtener expediente:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el expediente clínico.'
      });
    }
  };

export const obtenerExpedientesPorPaciente =
  async (req, res) => {
    try {
      const paciente =
        await Paciente.findById(
          req.params.pacienteId
        ).lean();

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'Paciente no encontrado.'
        });
      }

      const expedientes =
        await poblarExpediente(
          Expediente.find({
            pacienteId:
              req.params.pacienteId
          })
        )
          .sort({
            fechaAtencion: -1,
            createdAt: -1
          })
          .lean();

      return res.json({
        paciente,
        total:
          expedientes.length,
        expedientes
      });
    } catch (error) {
      console.error(
        'Error al obtener historial del paciente:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el historial clínico del paciente.'
      });
    }
  };

export const actualizarExpediente =
  async (req, res) => {
    try {
      const usuario =
        await obtenerUsuarioAutenticado(
          req
        );

      if (
        usuario.rol !==
        'odontologo'
      ) {
        return res.status(403).json({
          mensaje:
            'Solo un odontólogo puede actualizar un expediente clínico.'
        });
      }

      const expediente =
        await Expediente.findById(
          req.params.id
        );

      if (!expediente) {
        return res.status(404).json({
          mensaje:
            'Expediente no encontrado.'
        });
      }

      if (
        expediente.estadoRegistro ===
        'anulado'
      ) {
        return res.status(409).json({
          mensaje:
            'No se puede modificar un expediente anulado.'
        });
      }

      if (
        expediente.odontologoId &&
        String(
          expediente.odontologoId
        ) !== String(usuario._id)
      ) {
        return res.status(403).json({
          mensaje:
            'Solo el odontólogo que registró la atención puede modificarla.'
        });
      }

      const camposPermitidos = [
        'motivoConsulta',
        'diagnostico',
        'piezasDentales',
        'tratamiento',
        'prescripcion',
        'observaciones'
      ];

      for (
        const campo of
        camposPermitidos
      ) {
        if (
          Object.prototype.hasOwnProperty.call(
            req.body,
            campo
          )
        ) {
          expediente[campo] =
            normalizarTexto(
              req.body[campo]
            );
        }
      }

      if (
        !expediente.diagnostico
      ) {
        return res.status(400).json({
          mensaje:
            'El diagnóstico es obligatorio.'
        });
      }

      if (
        !expediente.tratamiento
      ) {
        return res.status(400).json({
          mensaje:
            'El tratamiento es obligatorio.'
        });
      }

      expediente.ultimaActualizacionPor =
        usuario._id;

      await expediente.save();

      const expedienteActualizado =
        await poblarExpediente(
          Expediente.findById(
            expediente._id
          )
        );

      return res.json({
        mensaje:
          'Expediente actualizado correctamente.',

        expediente:
          expedienteActualizado
      });
    } catch (error) {
      console.error(
        'Error al actualizar expediente:',
        error
      );

      return res
        .status(
          error.statusCode || 500
        )
        .json({
          mensaje:
            error.statusCode ? error.message :
            'No se pudo actualizar el expediente clínico.'
        });
    }
  };

/* =====================================================
   ANULAR EXPEDIENTE

   No elimina físicamente el historial.
===================================================== */

export const anularExpediente =
  async (req, res) => {
    try {
      const usuario =
        await obtenerUsuarioAutenticado(
          req
        );

      if (
        usuario.rol !==
        'administrador'
      ) {
        return res.status(403).json({
          mensaje:
            'Solo un administrador puede anular un expediente.'
        });
      }

      const motivoAnulacion =
        normalizarTexto(
          req.body.motivoAnulacion
        );

      if (
        motivoAnulacion.length < 10
      ) {
        return res.status(400).json({
          mensaje:
            'Debe registrar un motivo de anulación de al menos 10 caracteres.'
        });
      }

      const expediente =
        await Expediente.findById(
          req.params.id
        );

      if (!expediente) {
        return res.status(404).json({
          mensaje:
            'Expediente no encontrado.'
        });
      }

      if (
        expediente.estadoRegistro ===
        'anulado'
      ) {
        return res.status(409).json({
          mensaje:
            'El expediente ya se encuentra anulado.'
        });
      }

      expediente.estadoRegistro =
        'anulado';

      expediente.motivoAnulacion =
        motivoAnulacion;

      expediente.anuladoPor =
        usuario._id;

      expediente.fechaAnulacion =
        new Date();

      expediente.ultimaActualizacionPor =
        usuario._id;

      await expediente.save();

      const expedienteAnulado =
        await poblarExpediente(
          Expediente.findById(
            expediente._id
          )
        );

      return res.json({
        mensaje:
          'Expediente anulado correctamente.',

        expediente:
          expedienteAnulado
      });
    } catch (error) {
      console.error(
        'Error al anular expediente:',
        error
      );

      return res
        .status(
          error.statusCode || 500
        )
        .json({
          mensaje:
            error.statusCode ? error.message :
            'No se pudo anular el expediente.'
        });
    }
  };

/* =====================================================
   EXPEDIENTE DEL PACIENTE AUTENTICADO
===================================================== */

export const obtenerMiExpediente =
  async (req, res) => {
    try {
      const usuarioId =
        req.usuario?.id ||
        req.usuario?._id;

      const paciente =
        await Paciente.findOne({
          usuarioId
        }).lean();

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'No existe un paciente asociado a este usuario.'
        });
      }

      const expedientes =
        await poblarExpediente(
          Expediente.find({
            pacienteId:
              paciente._id,

            estadoRegistro:
              'activo'
          })
        )
          .sort({
            fechaAtencion: -1
          })
          .lean();

      return res.json({
        paciente,
        total:
          expedientes.length,
        expedientes
      });
    } catch (error) {
      console.error(
        'Error al obtener expediente del paciente:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el expediente clínico.'
      });
    }
  };
