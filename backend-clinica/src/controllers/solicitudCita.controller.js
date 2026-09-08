import mongoose from 'mongoose';
import SolicitudCita from '../models/SolicitudCita.js';
import Cita from '../models/Cita.js';
import Paciente from '../models/Paciente.js';
import Usuario from '../models/Usuario.js';
import { paginarConsulta } from '../utils/paginacion.js';

const crearRangoFecha = (fecha) => {
  return {
    inicio: new Date(
      `${fecha}T00:00:00.000Z`
    ),

    fin: new Date(
      `${fecha}T23:59:59.999Z`
    )
  };
};

const normalizarCorreo = (email = '') => {
  return String(email)
    .trim()
    .toLowerCase();
};

const normalizarTexto = (texto = '') => {
  return String(texto).trim();
};

/* =====================================================
   CREAR SOLICITUD PÚBLICA
===================================================== */

export const crearSolicitudCita =
  async (req, res) => {
    try {
      const {
        nombre,
        apellido,
        ci,
        nombreCompleto,
        email,
        telefono,
        servicio,
        fecha,
        hora,
        mensaje
      } = req.body;

      const nombreLimpio =
        normalizarTexto(nombre);

      const apellidoLimpio =
        normalizarTexto(apellido);

      const ciLimpio =
        normalizarTexto(ci)
          .replace(/\s/g, '');

      const nombreCompletoLimpio =
        normalizarTexto(
          nombreCompleto ||
            `${nombreLimpio} ${apellidoLimpio}`
        );

      if (
        !nombreLimpio ||
        !apellidoLimpio ||
        !ciLimpio ||
        !email?.trim() ||
        !telefono?.trim() ||
        !servicio?.trim() ||
        !fecha ||
        !hora
      ) {
        return res.status(400).json({
          mensaje:
            'Nombre, apellido, carnet de identidad, correo, teléfono, servicio, fecha y hora son obligatorios.'
        });
      }

      if (
        !/^[0-9A-Za-z-]{5,20}$/.test(
          ciLimpio
        )
      ) {
        return res.status(400).json({
          mensaje:
            'El carnet de identidad enviado no es válido.'
        });
      }

      if (
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
          hora
        )
      ) {
        return res.status(400).json({
          mensaje:
            'La hora debe tener el formato HH:mm.'
        });
      }

      const fechaSolicitada =
        new Date(
          `${fecha}T00:00:00.000Z`
        );

      if (
        Number.isNaN(
          fechaSolicitada.getTime()
        )
      ) {
        return res.status(400).json({
          mensaje:
            'La fecha seleccionada no es válida.'
        });
      }

      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);

      if (fechaSolicitada < hoy) {
        return res.status(400).json({
          mensaje:
            'No puedes solicitar una cita en una fecha pasada.'
        });
      }

      /*
       * Evita varias solicitudes pendientes iguales
       * de la misma persona para el mismo horario.
       */
      const { inicio, fin } =
        crearRangoFecha(fecha);

      const solicitudDuplicada =
        await SolicitudCita.findOne({
          ci: ciLimpio,

          fecha: {
            $gte: inicio,
            $lte: fin
          },

          hora,

          estado: 'pendiente'
        });

      if (solicitudDuplicada) {
        return res.status(409).json({
          mensaje:
            'Ya existe una solicitud pendiente con este carnet, fecha y hora.'
        });
      }

      const solicitud =
        await SolicitudCita.create({
          nombreCompleto:
            nombreCompletoLimpio,

          nombre:
            nombreLimpio,

          apellido:
            apellidoLimpio,

          ci:
            ciLimpio,

          email:
            normalizarCorreo(email),

          telefono:
            normalizarTexto(telefono),

          servicio:
            normalizarTexto(servicio),

          fecha:
            fechaSolicitada,

          hora,

          mensaje:
            normalizarTexto(mensaje),

          estado:
            'pendiente'
        });

      return res.status(201).json({
        mensaje:
          'Solicitud de cita registrada correctamente.',
        solicitud
      });
    } catch (error) {
      console.error(
        'Error al crear solicitud:',
        error
      );

      if (error?.code === 11000) {
        return res.status(409).json({
          mensaje: 'Ya existe una solicitud pendiente con este carnet, fecha y hora.'
        });
      }

      return res.status(500).json({
        mensaje:
          'No se pudo registrar la solicitud.',
      });
    }
  };

/* =====================================================
   OBTENER SOLICITUDES
===================================================== */

export const obtenerSolicitudesCita =
  async (req, res) => {
    try {
      const {
        estado
      } = req.query;

      const filtro = {};

      if (
        estado &&
        [
          'pendiente',
          'confirmada',
          'rechazada'
        ].includes(estado)
      ) {
        filtro.estado = estado;
      }

      const { datos: solicitudes, paginacion } = await paginarConsulta({
        req,
        res,
        consulta: SolicitudCita.find(filtro)
          .populate('pacienteId', 'nombre apellido ci telefono email')
          .populate('odontologoId', 'nombre email')
          .populate('procesadoPor', 'nombre rol')
          .populate('citaId')
          .sort({ createdAt: -1 }),
        contar: SolicitudCita.countDocuments(filtro)
      });

      return res.json({
        total: paginacion.total,
        paginacion,
        solicitudes
      });
    } catch (_error) {
      return res.status(500).json({
        mensaje:
          'No se pudieron obtener las solicitudes.',
      });
    }
  };

/* =====================================================
   CONFIRMAR Y CONVERTIR EN CITA
===================================================== */

export const confirmarSolicitudCita = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { pacienteId, odontologoId } = req.body;
    const duracionMinutos = Number(req.body.duracionMinutos ?? 30);

    if (!pacienteId || !odontologoId) {
      return res.status(400).json({
        mensaje: 'Debe seleccionar un paciente y un odontólogo.'
      });
    }

    if (!Number.isInteger(duracionMinutos) || duracionMinutos < 15 || duracionMinutos > 240) {
      return res.status(400).json({
        mensaje: 'La duración debe estar entre 15 y 240 minutos.'
      });
    }

    let resultado = null;

    await session.withTransaction(async () => {
      const solicitud = await SolicitudCita.findOne({
        _id: req.params.id,
        estado: 'pendiente'
      }).session(session);

      if (!solicitud) {
        const existe = await SolicitudCita.exists({ _id: req.params.id }).session(session);
        const error = new Error(existe ? 'La solicitud ya fue procesada anteriormente.' : 'Solicitud no encontrada.');
        error.statusCode = existe ? 409 : 404;
        throw error;
      }

      const paciente = await Paciente.findOne({
        _id: pacienteId,
        estado: { $ne: false }
      }).session(session);

      if (!paciente) {
        const error = new Error('Paciente no encontrado o inactivo.');
        error.statusCode = 404;
        throw error;
      }

      const odontologo = await Usuario.findOne({
        _id: odontologoId,
        rol: 'odontologo',
        estado: true
      }).session(session);

      if (!odontologo) {
        const error = new Error('Odontólogo no encontrado o inactivo.');
        error.statusCode = 404;
        throw error;
      }

      const fechaTexto = solicitud.fecha.toISOString().slice(0, 10);
      const { inicio, fin } = crearRangoFecha(fechaTexto);
      const inicioNuevo = Number(solicitud.hora.slice(0, 2)) * 60 + Number(solicitud.hora.slice(3));
      const finNuevo = inicioNuevo + duracionMinutos;

      if (finNuevo > 24 * 60) {
        const error = new Error('La duración de la cita excede el día seleccionado.');
        error.statusCode = 400;
        throw error;
      }

      const citasDia = await Cita.find({
        fecha: { $gte: inicio, $lte: fin },
        estado: { $in: ['pendiente', 'confirmada'] },
        $or: [{ odontologoId: odontologo._id }, { odontologo: odontologo.nombre }]
      }).select('hora duracionMinutos').session(session);

      const choque = citasDia.some((cita) => {
        const inicioExistente = Number(cita.hora.slice(0, 2)) * 60 + Number(cita.hora.slice(3));
        return inicioNuevo < inicioExistente + Number(cita.duracionMinutos || 30)
          && finNuevo > inicioExistente;
      });

      if (choque) {
        const error = new Error('El odontólogo ya tiene una cita que ocupa ese horario.');
        error.statusCode = 409;
        throw error;
      }

      const [cita] = await Cita.create([{
        pacienteId: paciente._id,
        odontologoId: odontologo._id,
        odontologo: odontologo.nombre,
        fecha: inicio,
        hora: solicitud.hora,
        duracionMinutos,
        motivo: solicitud.servicio,
        observaciones: solicitud.mensaje || '',
        estado: 'confirmada',
        origen: 'solicitud_online',
        solicitudId: solicitud._id,
        creadoPor: req.usuario?.id || null
      }], { session });

      solicitud.estado = 'confirmada';
      solicitud.pacienteId = paciente._id;
      solicitud.odontologoId = odontologo._id;
      solicitud.citaId = cita._id;
      solicitud.procesadoPor = req.usuario?.id || null;
      solicitud.fechaProcesamiento = new Date();
      solicitud.motivoRechazo = '';
      await solicitud.save({ session });

      resultado = { citaId: cita._id, solicitudId: solicitud._id };
    });

    const [cita, solicitud] = await Promise.all([
      Cita.findById(resultado.citaId)
        .populate('pacienteId', 'nombre apellido ci telefono')
        .populate('odontologoId', 'nombre email'),
      SolicitudCita.findById(resultado.solicitudId)
    ]);

    return res.json({
      mensaje: 'Solicitud confirmada y convertida en cita.',
      cita,
      solicitud
    });
  } catch (error) {
    console.error('Error al confirmar solicitud:', error);

    if (error?.code === 11000) {
      return res.status(409).json({
        mensaje: 'La solicitud o el horario acaba de ser procesado por otra operación.'
      });
    }

    return res.status(error.statusCode || 500).json({
      mensaje: error.statusCode ? error.message : 'No se pudo confirmar la solicitud.'
    });
  } finally {
    await session.endSession();
  }
};

/* =====================================================
   RECHAZAR SOLICITUD
===================================================== */

export const rechazarSolicitudCita =
  async (req, res) => {
    try {
      const {
        motivoRechazo
      } = req.body;

      if (
        !motivoRechazo?.trim()
      ) {
        return res.status(400).json({
          mensaje:
            'Debe indicar el motivo del rechazo.'
        });
      }

      const solicitud =
        await SolicitudCita.findById(
          req.params.id
        );

      if (!solicitud) {
        return res.status(404).json({
          mensaje:
            'Solicitud no encontrada.'
        });
      }

      if (
        solicitud.estado !==
        'pendiente'
      ) {
        return res.status(400).json({
          mensaje:
            'La solicitud ya fue procesada anteriormente.'
        });
      }

      solicitud.estado =
        'rechazada';

      solicitud.motivoRechazo =
        motivoRechazo.trim();

      solicitud.procesadoPor =
        req.usuario?.id || null;

      solicitud.fechaProcesamiento =
        new Date();

      await solicitud.save();

      return res.json({
        mensaje:
          'Solicitud rechazada correctamente.',
        solicitud
      });
    } catch (_error) {
      return res.status(500).json({
        mensaje:
          'No se pudo rechazar la solicitud.',
      });
    }
  };
