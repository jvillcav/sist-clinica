import Cita from '../models/Cita.js';
import Paciente from '../models/Paciente.js';
import Usuario from '../models/Usuario.js';
import { paginarConsulta } from '../utils/paginacion.js';

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADOS_CITA = [
  'pendiente',
  'confirmada',
  'atendido',
  'cancelado'
];

/* =====================================================
   UTILIDADES
===================================================== */

const normalizarTexto = (texto = '') => {
  return String(texto).trim();
};

const responderConflictoConcurrente = (res, error) => {
  if (error?.code !== 11000) return false;

  const indice = error?.message?.match(/index: ([^ ]+)/)?.[1] || '';
  const pacienteOcupado = indice.includes('paciente');

  res.status(409).json({
    mensaje: pacienteOcupado
      ? 'El paciente ya tiene otra cita que ocupa ese horario.'
      : 'El horario acaba de ser reservado por otra operación. Selecciona otro horario.'
  });
  return true;
};

const escaparExpresionRegular = (texto = '') => {
  return texto.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};

const crearRangoFecha = (fechaTexto) => {
  return {
    inicio: new Date(
      `${fechaTexto}T00:00:00.000Z`
    ),

    fin: new Date(
      `${fechaTexto}T23:59:59.999Z`
    )
  };
};

const convertirHoraAMinutos = (hora = '') => {
  const [horas, minutos] =
    String(hora)
      .split(':')
      .map(Number);

  if (
    Number.isNaN(horas) ||
    Number.isNaN(minutos)
  ) {
    return null;
  }

  return horas * 60 + minutos;
};

const validarHora = (hora) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    String(hora || '')
  );
};

const comprobarFechaValida = (fecha) => {
  const valor = new Date(
    `${fecha}T00:00:00.000Z`
  );

  return !Number.isNaN(
    valor.getTime()
  );
};

const obtenerPacienteAutenticado = async (
  usuarioId
) => {
  let paciente = await Paciente.findOne({
    usuarioId
  });

  /*
   * Compatibilidad con la relación inversa.
   */
  if (!paciente) {
    const usuario =
      await Usuario.findById(
        usuarioId
      ).select('pacienteId');

    if (usuario?.pacienteId) {
      paciente =
        await Paciente.findById(
          usuario.pacienteId
        );
    }
  }

  return paciente;
};

const obtenerPacienteActivo = async (
  pacienteId
) => {
  const paciente =
    await Paciente.findById(
      pacienteId
    );

  if (!paciente) {
    return {
      error: {
        codigo: 404,
        mensaje:
          'Paciente no encontrado.'
      }
    };
  }

  if (paciente.estado === false) {
    return {
      error: {
        codigo: 400,
        mensaje:
          'No se pueden programar citas para un paciente inactivo.'
      }
    };
  }

  return {
    paciente
  };
};

const obtenerOdontologoActivo = async (
  odontologoId
) => {
  const odontologo =
    await Usuario.findOne({
      _id: odontologoId,
      rol: 'odontologo'
    }).select(
      'nombre email rol estado'
    );

  if (!odontologo) {
    return {
      error: {
        codigo: 404,
        mensaje:
          'Odontólogo no encontrado.'
      }
    };
  }

  if (odontologo.estado === false) {
    return {
      error: {
        codigo: 400,
        mensaje:
          'El odontólogo seleccionado se encuentra inactivo.'
      }
    };
  }

  return {
    odontologo
  };
};

const poblarCita = async (citaId) => {
  return Cita.findById(citaId)
    .populate(
      'pacienteId',
      'nombre apellido ci telefono email fechaNacimiento sexo tipoSangre alergias condicionesCronicas estado'
    )
    .populate(
      'odontologoId',
      'nombre email rol estado'
    )
    .populate(
      'creadoPor',
      'nombre rol'
    )
    .populate(
      'canceladoPor',
      'nombre rol'
    );
};

/*
 * Verifica cruces considerando la duración.
 */
const buscarChoqueHorario = async ({
  fecha,
  hora,
  duracionMinutos = 30,
  odontologoId,
  odontologoNombre,
  excluirCitaId = null
}) => {
  const { inicio, fin } =
    crearRangoFecha(fecha);

  const filtroOdontologo = [];

  if (odontologoId) {
    filtroOdontologo.push({
      odontologoId
    });
  }

  if (odontologoNombre) {
    filtroOdontologo.push({
      odontologo: new RegExp(
        `^${escaparExpresionRegular(
          odontologoNombre
        )}$`,
        'i'
      )
    });
  }

  const filtro = {
    fecha: {
      $gte: inicio,
      $lte: fin
    },

    estado: {
      $ne: 'cancelado'
    }
  };

  if (filtroOdontologo.length === 1) {
    Object.assign(
      filtro,
      filtroOdontologo[0]
    );
  }

  if (filtroOdontologo.length > 1) {
    filtro.$or =
      filtroOdontologo;
  }

  if (excluirCitaId) {
    filtro._id = {
      $ne: excluirCitaId
    };
  }

  const citasDia =
    await Cita.find(filtro).select(
      'hora duracionMinutos'
    );

  const inicioNueva =
    convertirHoraAMinutos(hora);

  const finNueva =
    inicioNueva +
    Number(duracionMinutos || 30);

  return citasDia.find((cita) => {
    const inicioExistente =
      convertirHoraAMinutos(
        cita.hora
      );

    const finExistente =
      inicioExistente +
      Number(
        cita.duracionMinutos || 30
      );

    return (
      inicioNueva < finExistente &&
      finNueva > inicioExistente
    );
  });
};

const registrarReprogramacion = (
  cita,
  {
    fechaNueva,
    horaNueva,
    odontologoNuevo,
    motivo,
    usuarioId
  }
) => {
  cita.reprogramaciones.push({
    fechaAnterior:
      cita.fecha,

    horaAnterior:
      cita.hora,

    odontologoAnterior:
      cita.odontologo,

    fechaNueva,

    horaNueva,

    odontologoNuevo,

    motivo:
      normalizarTexto(motivo),

    realizadoPor:
      usuarioId || null
  });
};

/* =====================================================
   CREAR CITA
===================================================== */

export const crearCita = async (
  req,
  res
) => {
  try {
    let {
      pacienteId,
      odontologoId,
      fecha,
      hora,
      duracionMinutos = 30,
      motivo,
      observaciones,
      estado
    } = req.body;

    const rol =
      req.usuario?.rol;

    /*
     * El paciente solamente puede crear una cita
     * para su propia ficha.
     */
    if (rol === 'paciente') {
      const pacientePropio =
        await obtenerPacienteAutenticado(
          req.usuario.id
        );

      if (!pacientePropio) {
        return res.status(404).json({
          mensaje:
            'No existe una ficha de paciente vinculada a tu cuenta.'
        });
      }

      pacienteId =
        pacientePropio._id;
    }

    /*
     * El odontólogo solamente puede asignarse
     * citas a sí mismo.
     */
    if (rol === 'odontologo') {
      odontologoId =
        req.usuario.id;
    }

    if (
      !pacienteId ||
      !odontologoId ||
      !fecha ||
      !hora ||
      !motivo
    ) {
      return res.status(400).json({
        mensaje:
          'Paciente, odontólogo, fecha, hora y servicio son obligatorios.'
      });
    }

    if (
      !comprobarFechaValida(fecha)
    ) {
      return res.status(400).json({
        mensaje:
          'La fecha enviada no es válida.'
      });
    }

    if (!validarHora(hora)) {
      return res.status(400).json({
        mensaje:
          'La hora debe tener el formato HH:mm.'
      });
    }

    duracionMinutos =
      Number(duracionMinutos);

    if (
      !Number.isInteger(
        duracionMinutos
      ) ||
      duracionMinutos < 15 ||
      duracionMinutos > 240
    ) {
      return res.status(400).json({
        mensaje:
          'La duración debe estar entre 15 y 240 minutos.'
      });
    }

    const resultadoPaciente =
      await obtenerPacienteActivo(
        pacienteId
      );

    if (resultadoPaciente.error) {
      return res
        .status(
          resultadoPaciente.error.codigo
        )
        .json({
          mensaje:
            resultadoPaciente.error
              .mensaje
        });
    }

    const resultadoOdontologo =
      await obtenerOdontologoActivo(
        odontologoId
      );

    if (
      resultadoOdontologo.error
    ) {
      return res
        .status(
          resultadoOdontologo.error
            .codigo
        )
        .json({
          mensaje:
            resultadoOdontologo.error
              .mensaje
        });
    }

    const odontologo =
      resultadoOdontologo.odontologo;

    const choque =
      await buscarChoqueHorario({
        fecha,
        hora,
        duracionMinutos,
        odontologoId:
          odontologo._id,
        odontologoNombre:
          odontologo.nombre
      });

    if (choque) {
      return res.status(400).json({
        mensaje:
          'El odontólogo ya tiene una cita que ocupa ese horario.'
      });
    }

    let estadoInicial =
      'pendiente';

    if (
      ['administrador', 'recepcionista']
        .includes(rol) &&
      ['pendiente', 'confirmada']
        .includes(estado)
    ) {
      estadoInicial = estado;
    }

    const { inicio } =
      crearRangoFecha(fecha);

    const cita =
      await Cita.create({
        pacienteId:
          resultadoPaciente
            .paciente._id,

        odontologoId:
          odontologo._id,

        odontologo:
          odontologo.nombre,

        fecha: inicio,

        hora,

        duracionMinutos,

        motivo:
          normalizarTexto(motivo),

        observaciones:
          normalizarTexto(
            observaciones
          ),

        estado:
          estadoInicial,

        origen:
          'interna',

        creadoPor:
          req.usuario?.id || null
      });

    const citaCompleta =
      await poblarCita(cita._id);

    return res.status(201).json({
      mensaje:
        'Cita registrada correctamente.',
      cita: citaCompleta
    });
  } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
    console.error(
      'Error al crear cita:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudo registrar la cita.',
    });
  }
};

/* =====================================================
   OBTENER CITAS PARA PERSONAL
===================================================== */

export const obtenerCitas = async (
  req,
  res
) => {
  try {
    const {
      fecha,
      desde,
      hasta,
      estado,
      odontologoId,
      pacienteId,
      origen
    } = req.query;

    const filtro = {};

    if (fecha) {
      const { inicio, fin } =
        crearRangoFecha(fecha);

      filtro.fecha = {
        $gte: inicio,
        $lte: fin
      };
    } else if (desde && hasta) {
      filtro.fecha = {
        $gte: crearRangoFecha(desde)
          .inicio,

        $lte: crearRangoFecha(hasta)
          .fin
      };
    }

    if (
      estado &&
      ESTADOS_CITA.includes(estado)
    ) {
      filtro.estado = estado;
    }

    if (odontologoId) {
      filtro.odontologoId =
        odontologoId;
    }

    if (pacienteId) {
      filtro.pacienteId =
        pacienteId;
    }

    if (
      origen &&
      ['interna', 'solicitud_online']
        .includes(origen)
    ) {
      filtro.origen = origen;
    }

    /*
     * El odontólogo solo puede listar su agenda.
     */
    if (
      req.usuario?.rol ===
      'odontologo'
    ) {
      const usuario =
        await Usuario.findById(
          req.usuario.id
        ).select('nombre');

      filtro.$or = [
        {
          odontologoId:
            req.usuario.id
        },
        {
          odontologo:
            new RegExp(
              `^${escaparExpresionRegular(
                usuario?.nombre || ''
              )}$`,
              'i'
            )
        }
      ];
    }

    const { datos: citas, paginacion } = await paginarConsulta({
      req,
      res,
      consulta: Cita.find(filtro)
        .populate('pacienteId', 'nombre apellido ci telefono email estado')
        .populate('odontologoId', 'nombre email estado')
        .sort({ fecha: -1, hora: 1 }),
      contar: Cita.countDocuments(filtro)
    });

    return res.json({
      total: paginacion.total,
      paginacion,
      citas
    });
  } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
    console.error(
      'Error al obtener citas:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudieron obtener las citas.',
    });
  }
};

/* =====================================================
   AGENDA DEL ODONTÓLOGO
===================================================== */

export const obtenerAgendaOdontologo =
  async (req, res) => {
    try {
      const usuario =
        await Usuario.findById(
          req.usuario?.id
        ).select(
          'nombre rol estado'
        );

      if (!usuario) {
        return res.status(404).json({
          mensaje:
            'No se encontró el usuario autenticado.'
        });
      }

      if (
        usuario.rol !== 'odontologo'
      ) {
        return res.status(403).json({
          mensaje:
            'El usuario autenticado no corresponde a un odontólogo.'
        });
      }

      if (
        usuario.estado === false
      ) {
        return res.status(403).json({
          mensaje:
            'El odontólogo se encuentra inactivo.'
        });
      }

      const {
        fecha,
        desde,
        hasta,
        estado
      } = req.query;

      const filtro = {
        $or: [
          {
            odontologoId:
              usuario._id
          },
          {
            odontologo:
              new RegExp(
                `^${escaparExpresionRegular(
                  usuario.nombre
                )}$`,
                'i'
              )
          }
        ]
      };

      if (fecha) {
        const { inicio, fin } =
          crearRangoFecha(fecha);

        filtro.fecha = {
          $gte: inicio,
          $lte: fin
        };
      } else if (
        desde &&
        hasta
      ) {
        filtro.fecha = {
          $gte:
            crearRangoFecha(desde)
              .inicio,

          $lte:
            crearRangoFecha(hasta)
              .fin
        };
      }

      if (
        estado &&
        ESTADOS_CITA.includes(estado)
      ) {
        filtro.estado = estado;
      }

      const citas =
        await Cita.find(filtro)
          .populate(
            'pacienteId',
            'nombre apellido ci telefono fechaNacimiento sexo alergias condicionesCronicas estado'
          )
          .sort({
            fecha: 1,
            hora: 1
          });

      return res.json({
        odontologo: {
          id: usuario._id,
          nombre:
            usuario.nombre
        },

        total: citas.length,
        citas
      });
    } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
      console.error(
        'Error al obtener agenda:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo cargar la agenda del odontólogo.',
      });
    }
  };

/* =====================================================
   MIS CITAS
===================================================== */

export const obtenerMisCitas =
  async (req, res) => {
    try {
      const paciente =
        await obtenerPacienteAutenticado(
          req.usuario.id
        );

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'No existe un paciente asociado a este usuario.'
        });
      }

      const citas =
        await Cita.find({
          pacienteId:
            paciente._id
        })
          .populate(
            'odontologoId',
            'nombre email'
          )
          .sort({
            fecha: -1,
            hora: 1
          });

      return res.json(citas);
    } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
      return res.status(500).json({
        mensaje:
          'No se pudieron obtener tus citas.',
      });
    }
  };

/* =====================================================
   DISPONIBILIDAD
===================================================== */

export const obtenerDisponibilidad =
  async (req, res) => {
    try {
      const {
        fecha,
        odontologoId
      } = req.query;

      if (
        !fecha ||
        !odontologoId
      ) {
        return res.status(400).json({
          mensaje:
            'La fecha y el odontólogo son obligatorios.'
        });
      }

      const resultadoOdontologo =
        await obtenerOdontologoActivo(
          odontologoId
        );

      if (
        resultadoOdontologo.error
      ) {
        return res
          .status(
            resultadoOdontologo.error
              .codigo
          )
          .json({
            mensaje:
              resultadoOdontologo.error
                .mensaje
          });
      }

      const { inicio, fin } =
        crearRangoFecha(fecha);

      const citas =
        await Cita.find({
          fecha: {
            $gte: inicio,
            $lte: fin
          },

          estado: {
            $ne: 'cancelado'
          },

          $or: [
            {
              odontologoId
            },
            {
              odontologo:
                resultadoOdontologo
                  .odontologo.nombre
            }
          ]
        }).select(
          'hora duracionMinutos'
        );

      return res.json({
        fecha,

        odontologo: {
          id:
            resultadoOdontologo
              .odontologo._id,

          nombre:
            resultadoOdontologo
              .odontologo.nombre
        },

        horariosOcupados:
          citas.map((cita) => ({
            hora: cita.hora,

            duracionMinutos:
              cita.duracionMinutos ||
              30
          }))
      });
    } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
      return res.status(500).json({
        mensaje:
          'No se pudo consultar la disponibilidad.',
      });
    }
  };

/* =====================================================
   OBTENER UNA CITA
===================================================== */

export const obtenerCita = async (
  req,
  res
) => {
  try {
    const cita =
      await poblarCita(
        req.params.id
      );

    if (!cita) {
      return res.status(404).json({
        mensaje:
          'Cita no encontrada.'
      });
    }

    if (
      req.usuario?.rol ===
      'odontologo'
    ) {
      const pertenece =
        String(
          cita.odontologoId?._id ||
            cita.odontologoId
        ) ===
        String(req.usuario.id);

      const coincideNombre =
        cita.odontologo ===
        req.usuario.nombre;

      if (
        !pertenece &&
        !coincideNombre
      ) {
        return res.status(403).json({
          mensaje:
            'No tienes permiso para consultar esta cita.'
        });
      }
    }

    return res.json(cita);
  } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
    return res.status(500).json({
      mensaje:
        'No se pudo obtener la cita.',
    });
  }
};

/* =====================================================
   ACTUALIZACIÓN SEGURA
===================================================== */

export const actualizarCita = async (
  req,
  res
) => {
  try {
    const cita =
      await Cita.findById(
        req.params.id
      );

    if (!cita) {
      return res.status(404).json({
        mensaje:
          'Cita no encontrada.'
      });
    }

    /*
     * Fecha, hora y odontólogo deben modificarse
     * mediante la función de reprogramación.
     */
    const camposPermitidos = [
      'motivo',
      'observaciones',
      'duracionMinutos'
    ];

    for (
      const campo of
      camposPermitidos
    ) {
      if (
        req.body[campo] !==
        undefined
      ) {
        cita[campo] =
          req.body[campo];
      }
    }

    await cita.save();

    const citaActualizada =
      await poblarCita(cita._id);

    return res.json({
      mensaje:
        'Cita actualizada correctamente.',
      cita: citaActualizada
    });
  } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
    return res.status(500).json({
      mensaje:
        'No se pudo actualizar la cita.',
    });
  }
};

/* =====================================================
   CONFIRMAR
===================================================== */

export const confirmarCita = async (
  req,
  res
) => {
  try {
    const cita =
      await Cita.findById(
        req.params.id
      );

    if (!cita) {
      return res.status(404).json({
        mensaje:
          'Cita no encontrada.'
      });
    }

    if (
      cita.estado === 'cancelado'
    ) {
      return res.status(400).json({
        mensaje:
          'Una cita cancelada no puede confirmarse.'
      });
    }

    if (
      cita.estado === 'atendido'
    ) {
      return res.status(400).json({
        mensaje:
          'La cita ya fue atendida.'
      });
    }

    cita.estado = 'confirmada';

    await cita.save();

    return res.json({
      mensaje:
        'Cita confirmada correctamente.',

      cita:
        await poblarCita(
          cita._id
        )
    });
  } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
    return res.status(500).json({
      mensaje:
        'No se pudo confirmar la cita.',
    });
  }
};

/* =====================================================
   REPROGRAMAR POR PERSONAL
===================================================== */

export const reprogramarCitaPersonal =
  async (req, res) => {
    try {
      const {
        fecha,
        hora,
        odontologoId,
        motivoReprogramacion
      } = req.body;

      if (!fecha || !hora) {
        return res.status(400).json({
          mensaje:
            'La nueva fecha y hora son obligatorias.'
        });
      }

      const cita =
        await Cita.findById(
          req.params.id
        );

      if (!cita) {
        return res.status(404).json({
          mensaje:
            'Cita no encontrada.'
        });
      }

      if (
        ['atendido', 'cancelado']
          .includes(cita.estado)
      ) {
        return res.status(400).json({
          mensaje:
            'Una cita atendida o cancelada no puede reprogramarse.'
        });
      }

      let odontologoSeleccionado;

      if (odontologoId) {
        const resultado =
          await obtenerOdontologoActivo(
            odontologoId
          );

        if (resultado.error) {
          return res
            .status(
              resultado.error.codigo
            )
            .json({
              mensaje:
                resultado.error
                  .mensaje
            });
        }

        odontologoSeleccionado =
          resultado.odontologo;
      } else {
        odontologoSeleccionado =
          await Usuario.findById(
            cita.odontologoId
          ).select(
            'nombre estado rol'
          );

        if (
          !odontologoSeleccionado
        ) {
          return res.status(400).json({
            mensaje:
              'Debes seleccionar nuevamente al odontólogo.'
          });
        }
      }

      const choque =
        await buscarChoqueHorario({
          fecha,
          hora,

          duracionMinutos:
            cita.duracionMinutos,

          odontologoId:
            odontologoSeleccionado._id,

          odontologoNombre:
            odontologoSeleccionado.nombre,

          excluirCitaId:
            cita._id
        });

      if (choque) {
        return res.status(400).json({
          mensaje:
            'El odontólogo ya tiene otra cita que ocupa ese horario.'
        });
      }

      const { inicio } =
        crearRangoFecha(fecha);

      registrarReprogramacion(
        cita,
        {
          fechaNueva: inicio,

          horaNueva: hora,

          odontologoNuevo:
            odontologoSeleccionado
              .nombre,

          motivo:
            motivoReprogramacion,

          usuarioId:
            req.usuario?.id
        }
      );

      cita.fecha = inicio;
      cita.hora = hora;

      cita.odontologoId =
        odontologoSeleccionado._id;

      cita.odontologo =
        odontologoSeleccionado.nombre;

      cita.estado = 'pendiente';

      cita.motivoCancelacion = '';
      cita.fechaCancelacion = null;
      cita.canceladoPor = null;

      await cita.save();

      return res.json({
        mensaje:
          'Cita reprogramada correctamente.',

        cita:
          await poblarCita(
            cita._id
          )
      });
    } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
      return res.status(500).json({
        mensaje:
          'No se pudo reprogramar la cita.',
      });
    }
  };

/* =====================================================
   CANCELAR POR PERSONAL
===================================================== */

export const cancelarCitaPersonal =
  async (req, res) => {
    try {
      const {
        motivoCancelacion
      } = req.body;

      if (
        !motivoCancelacion?.trim()
      ) {
        return res.status(400).json({
          mensaje:
            'Debe indicar el motivo de cancelación.'
        });
      }

      const cita =
        await Cita.findById(
          req.params.id
        );

      if (!cita) {
        return res.status(404).json({
          mensaje:
            'Cita no encontrada.'
        });
      }

      if (
        cita.estado === 'atendido'
      ) {
        return res.status(400).json({
          mensaje:
            'Una cita atendida no puede cancelarse.'
        });
      }

      if (
        cita.estado === 'cancelado'
      ) {
        return res.status(400).json({
          mensaje:
            'La cita ya está cancelada.'
        });
      }

      cita.estado = 'cancelado';

      cita.motivoCancelacion =
        motivoCancelacion.trim();

      cita.fechaCancelacion =
        new Date();

      cita.canceladoPor =
        req.usuario?.id || null;

      await cita.save();

      return res.json({
        mensaje:
          'Cita cancelada correctamente.',

        cita:
          await poblarCita(
            cita._id
          )
      });
    } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
      return res.status(500).json({
        mensaje:
          'No se pudo cancelar la cita.',
      });
    }
  };

/* =====================================================
   CANCELAR CITA PROPIA
===================================================== */

export const cancelarMiCita =
  async (req, res) => {
    try {
      const {
        motivoCancelacion
      } = req.body;

      if (
        !motivoCancelacion?.trim()
      ) {
        return res.status(400).json({
          mensaje:
            'Debes indicar el motivo de cancelación.'
        });
      }

      const paciente =
        await obtenerPacienteAutenticado(
          req.usuario.id
        );

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'Paciente no encontrado.'
        });
      }

      const cita =
        await Cita.findOne({
          _id: req.params.id,

          pacienteId:
            paciente._id
        });

      if (!cita) {
        return res.status(404).json({
          mensaje:
            'La cita no existe o no te pertenece.'
        });
      }

      if (
        cita.estado === 'atendido'
      ) {
        return res.status(400).json({
          mensaje:
            'Una cita atendida no puede cancelarse.'
        });
      }

      if (
        cita.estado === 'cancelado'
      ) {
        return res.status(400).json({
          mensaje:
            'La cita ya está cancelada.'
        });
      }

      cita.estado = 'cancelado';

      cita.motivoCancelacion =
        motivoCancelacion.trim();

      cita.fechaCancelacion =
        new Date();

      cita.canceladoPor =
        req.usuario.id;

      await cita.save();

      return res.json({
        mensaje:
          'Cita cancelada correctamente.',
        cita
      });
    } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
      return res.status(500).json({
        mensaje:
          'No se pudo cancelar la cita.',
      });
    }
  };

/* =====================================================
   REPROGRAMAR CITA PROPIA
===================================================== */

export const reprogramarMiCita =
  async (req, res) => {
    try {
      const {
        fecha,
        hora,
        motivoReprogramacion
      } = req.body;

      if (!fecha || !hora) {
        return res.status(400).json({
          mensaje:
            'La nueva fecha y hora son obligatorias.'
        });
      }

      const paciente =
        await obtenerPacienteAutenticado(
          req.usuario.id
        );

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'Paciente no encontrado.'
        });
      }

      const cita =
        await Cita.findOne({
          _id: req.params.id,

          pacienteId:
            paciente._id
        });

      if (!cita) {
        return res.status(404).json({
          mensaje:
            'La cita no existe o no te pertenece.'
        });
      }

      if (
        ['atendido', 'cancelado']
          .includes(cita.estado)
      ) {
        return res.status(400).json({
          mensaje:
            'Esta cita ya no puede reprogramarse.'
        });
      }

      const choque =
        await buscarChoqueHorario({
          fecha,
          hora,

          duracionMinutos:
            cita.duracionMinutos,

          odontologoId:
            cita.odontologoId,

          odontologoNombre:
            cita.odontologo,

          excluirCitaId:
            cita._id
        });

      if (choque) {
        return res.status(400).json({
          mensaje:
            'El odontólogo ya está ocupado durante ese horario.'
        });
      }

      const { inicio } =
        crearRangoFecha(fecha);

      registrarReprogramacion(
        cita,
        {
          fechaNueva: inicio,
          horaNueva: hora,

          odontologoNuevo:
            cita.odontologo,

          motivo:
            motivoReprogramacion,

          usuarioId:
            req.usuario.id
        }
      );

      cita.fecha = inicio;
      cita.hora = hora;
      cita.estado = 'pendiente';

      await cita.save();

      return res.json({
        mensaje:
          'Cita reprogramada correctamente.',
        cita
      });
    } catch (error) {
    if (responderConflictoConcurrente(res, error)) return;
      return res.status(500).json({
        mensaje:
          'No se pudo reprogramar la cita.',
      });
    }
  };
