import Paciente from '../models/Paciente.js';
import Cita from '../models/Cita.js';
import Expediente from '../models/Expediente.js';
import Insumo from '../models/Insumo.js';
import ConsumoInsumo from '../models/ConsumoInsumo.js';
import SolicitudCita from '../models/SolicitudCita.js';
import Usuario from '../models/Usuario.js';

export const obtenerResumenGeneral = async (req, res) => {
  try {
    const totalPacientes = await Paciente.countDocuments();
    const totalCitas = await Cita.countDocuments();
    const totalExpedientes = await Expediente.countDocuments();
    const totalInsumos = await Insumo.countDocuments();
    const totalConsumos = await ConsumoInsumo.countDocuments();

    const citasPendientes = await Cita.countDocuments({ estado: 'pendiente' });
    const citasAtendidas = await Cita.countDocuments({ estado: 'atendido' });
    const citasCanceladas = await Cita.countDocuments({ estado: 'cancelado' });

    const insumosBajoStock = await Insumo.find({
      $expr: { $lte: ['$stockActual', '$stockMinimo'] }
    });

    res.json({
      totalPacientes,
      totalCitas,
      totalExpedientes,
      totalInsumos,
      totalConsumos,
      citas: {
        pendientes: citasPendientes,
        atendidas: citasAtendidas,
        canceladas: citasCanceladas
      },
      insumosBajoStock
    });

  } catch (error) {
    console.error('Error al obtener resumen general:', error);
    return res.status(500).json({
      mensaje: 'No se pudo obtener el resumen general.'
    });
  }
};

export const obtenerDatasetConsumo = async (req, res) => {
  try {
    const dataset = await ConsumoInsumo.find()
      .populate('insumoId')
      .populate('expedienteId');

    const datos = dataset.map(item => ({
      fechaConsumo: item.fechaConsumo,
      insumo: item.insumoId?.nombre,
      unidadMedida: item.insumoId?.unidadMedida,
      cantidadUtilizada: item.cantidadUtilizada,
      tipoTratamiento: item.tipoTratamiento,
      odontologo: item.odontologo
    }));

    res.json(datos);
  } catch (error) {
    console.error('Error al obtener dataset de consumo:', error);
    return res.status(500).json({
      mensaje: 'No se pudo obtener el dataset de consumo.'
    });
  }
};

const escaparRegex = (texto = '') => {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const obtenerFechaBolivia = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const crearRangoFechaUTC = (fechaTexto) => {
  return {
    inicio: new Date(`${fechaTexto}T00:00:00.000Z`),
    fin: new Date(`${fechaTexto}T23:59:59.999Z`)
  };
};

const obtenerRangoMesActualBolivia = () => {
  const fechaBolivia = obtenerFechaBolivia();
  const [year, month] = fechaBolivia.split('-');

  const inicio = new Date(
    `${year}-${month}-01T00:00:00.000Z`
  );

  const siguienteMes = new Date(
    Date.UTC(
      Number(year),
      Number(month),
      1,
      0,
      0,
      0,
      0
    )
  );

  return {
    inicio,
    fin: siguienteMes
  };
};

export const obtenerReporteOdontologo = async (req, res) => {
  try {
    const usuario = await Usuario.findById(
      req.usuario?.id
    ).select('nombre email rol estado');

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'No se encontró el odontólogo autenticado.'
      });
    }

    if (usuario.rol !== 'odontologo') {
      return res.status(403).json({
        mensaje:
          'El usuario autenticado no corresponde a un odontólogo.'
      });
    }

    if (usuario.estado === false) {
      return res.status(403).json({
        mensaje: 'El odontólogo se encuentra inactivo.'
      });
    }

    const nombreOdontologo = usuario.nombre.trim();

    /*
     * Se utiliza una expresión regular para tolerar
     * diferencias accidentales de mayúsculas y minúsculas.
     */
    const filtroOdontologo = new RegExp(
      `^${escaparRegex(nombreOdontologo)}$`,
      'i'
    );

    const fechaHoy = obtenerFechaBolivia();
    const rangoHoy = crearRangoFechaUTC(fechaHoy);
    const rangoMes = obtenerRangoMesActualBolivia();

    const [
      citasHoy,
      consultasMes,
      consultasRecientes,
      consumosRecientes
    ] = await Promise.all([
      Cita.find({
        odontologo: filtroOdontologo,
        fecha: {
          $gte: rangoHoy.inicio,
          $lte: rangoHoy.fin
        },
        estado: {
          $ne: 'cancelado'
        }
      })
        .populate('pacienteId')
        .sort({
          hora: 1
        }),

      Expediente.find({
        odontologo: filtroOdontologo,
        fechaAtencion: {
          $gte: rangoMes.inicio,
          $lt: rangoMes.fin
        }
      })
        .populate('pacienteId')
        .sort({
          fechaAtencion: -1
        }),

      Expediente.find({
        odontologo: filtroOdontologo
      })
        .populate('pacienteId')
        .sort({
          fechaAtencion: -1,
          createdAt: -1
        })
        .limit(5),

      ConsumoInsumo.find({
        odontologo: filtroOdontologo
      })
        .populate('insumoId')
        .populate('expedienteId')
        .sort({
          fechaConsumo: -1,
          createdAt: -1
        })
        .limit(5)
    ]);

    const pacientesMes = new Set(
      consultasMes
        .map((consulta) =>
          consulta.pacienteId?._id?.toString()
        )
        .filter(Boolean)
    ).size;

    const citasCompletadasHoy = citasHoy.filter(
      (cita) => cita.estado === 'atendido'
    ).length;

    const citasPendientesHoy = citasHoy.filter(
      (cita) =>
        cita.estado === 'pendiente' ||
        cita.estado === 'confirmada'
    );

    /*
     * Como todavía no existe un estado formal "en_curso",
     * se muestra como próxima consulta la primera cita
     * pendiente o confirmada del día.
     */
    const proximaConsulta =
      citasPendientesHoy.length > 0
        ? citasPendientesHoy[0]
        : null;

    res.json({
      odontologo: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email
      },

      fechaHoy,

      resumen: {
        citasHoy: citasHoy.length,
        citasCompletadasHoy,
        pacientesMes,
        tratamientosMes: consultasMes.length
      },

      proximaConsulta,

      /*
       * Queda explícitamente vacío hasta que el modelo
       * contemple el estado real de una atención en curso.
       */
      consultaEnCurso: null,

      agendaHoy: citasHoy,

      consultasRecientes,

      consumosRecientes
    });
  } catch (error) {
    console.error(
      'Error al obtener dashboard del odontólogo:',
      error
    );

    res.status(500).json({
      mensaje:
        'No se pudo cargar el panel del odontólogo.',
    });
  }
};

/* =====================================================
   REPORTE ESTADÍSTICO DEL ODONTÓLOGO
===================================================== */

const obtenerNombreMes = (fecha) => {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    month: 'short'
  })
    .format(fecha)
    .replace('.', '')
    .replace(/^./, (letra) => letra.toUpperCase());
};

const obtenerClaveMes = (fecha) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit'
  }).format(fecha);
};

const crearPeriodoMesesBolivia = (cantidadMeses = 6) => {
  const fechaActualTexto = obtenerFechaBolivia();
  const [yearActual, monthActual] =
    fechaActualTexto.split('-').map(Number);

  const inicio = new Date(
    Date.UTC(
      yearActual,
      monthActual - cantidadMeses,
      1,
      0,
      0,
      0,
      0
    )
  );

  const fin = new Date(
    Date.UTC(
      yearActual,
      monthActual,
      1,
      0,
      0,
      0,
      0
    )
  );

  const meses = [];

  for (let indice = 0; indice < cantidadMeses; indice += 1) {
    const fechaMes = new Date(
      Date.UTC(
        inicio.getUTCFullYear(),
        inicio.getUTCMonth() + indice,
        1
      )
    );

    meses.push({
      clave: obtenerClaveMes(fechaMes),
      nombre: obtenerNombreMes(fechaMes),
      pacientes: new Set(),
      tratamientos: 0,
      citasAtendidas: 0,
      citasCanceladas: 0,
      insumosUtilizados: 0
    });
  }

  return {
    inicio,
    fin,
    meses
  };
};

const obtenerCantidadMesesReporte = (valor) => {
  const meses = Number(valor);

  if ([3, 6, 12].includes(meses)) {
    return meses;
  }

  return 6;
};

const obtenerNombreServicio = (cita) => {
  return (
    cita?.servicio ||
    cita?.motivo ||
    cita?.tipoTratamiento ||
    'Otros'
  ).trim();
};

export const obtenerEstadisticasOdontologo = async (
  req,
  res
) => {
  try {
    const usuario = await Usuario.findById(
      req.usuario?.id
    ).select('nombre email rol estado');

    if (!usuario) {
      return res.status(404).json({
        mensaje:
          'No se encontró el odontólogo autenticado.'
      });
    }

    if (usuario.rol !== 'odontologo') {
      return res.status(403).json({
        mensaje:
          'El usuario autenticado no corresponde a un odontólogo.'
      });
    }

    if (usuario.estado === false) {
      return res.status(403).json({
        mensaje:
          'El odontólogo se encuentra inactivo.'
      });
    }

    const cantidadMeses =
      obtenerCantidadMesesReporte(
        req.query.meses
      );

    const nombreOdontologo =
      usuario.nombre.trim();

    const filtroOdontologo = new RegExp(
      `^${escaparRegex(nombreOdontologo)}$`,
      'i'
    );

    const periodo =
      crearPeriodoMesesBolivia(cantidadMeses);

    const [
      expedientes,
      citas,
      consumos
    ] = await Promise.all([
      Expediente.find({
        odontologo: filtroOdontologo,
        fechaAtencion: {
          $gte: periodo.inicio,
          $lt: periodo.fin
        }
      })
        .select(
          'pacienteId diagnostico tratamiento motivoConsulta fechaAtencion createdAt'
        )
        .populate(
          'pacienteId',
          'nombre apellido ci'
        )
        .lean(),

      Cita.find({
        odontologo: filtroOdontologo,
        fecha: {
          $gte: periodo.inicio,
          $lt: periodo.fin
        }
      })
        .select(
          'pacienteId servicio motivo tipoTratamiento estado fecha'
        )
        .populate(
          'pacienteId',
          'nombre apellido ci'
        )
        .lean(),

      ConsumoInsumo.find({
        odontologo: filtroOdontologo,
        fechaConsumo: {
          $gte: periodo.inicio,
          $lt: periodo.fin
        }
      })
        .select(
          'cantidadUtilizada tipoTratamiento fechaConsumo'
        )
        .lean()
    ]);

    const mapaMeses = new Map(
      periodo.meses.map((mes) => [
        mes.clave,
        mes
      ])
    );

    /*
     * Evolución mensual de pacientes y tratamientos.
     */
    for (const expediente of expedientes) {
      const fecha =
        expediente.fechaAtencion ||
        expediente.createdAt;

      if (!fecha) continue;

      const claveMes =
        obtenerClaveMes(new Date(fecha));

      const mes = mapaMeses.get(claveMes);

      if (!mes) continue;

      mes.tratamientos += 1;

      const pacienteId =
        expediente.pacienteId?._id?.toString() ||
        expediente.pacienteId?.toString();

      if (pacienteId) {
        mes.pacientes.add(pacienteId);
      }
    }

    /*
     * Asistencia mensual.
     * Solo se consideran citas cerradas:
     * atendidas o canceladas.
     */
    for (const cita of citas) {
      if (!cita.fecha) continue;

      const claveMes =
        obtenerClaveMes(new Date(cita.fecha));

      const mes = mapaMeses.get(claveMes);

      if (!mes) continue;

      if (cita.estado === 'atendido') {
        mes.citasAtendidas += 1;
      }

      if (cita.estado === 'cancelado') {
        mes.citasCanceladas += 1;
      }
    }

    /*
     * Consumo mensual.
     */
    for (const consumo of consumos) {
      if (!consumo.fechaConsumo) continue;

      const claveMes =
        obtenerClaveMes(
          new Date(consumo.fechaConsumo)
        );

      const mes = mapaMeses.get(claveMes);

      if (!mes) continue;

      mes.insumosUtilizados += Number(
        consumo.cantidadUtilizada || 0
      );
    }

    const pacientesUnicos = new Set(
      expedientes
        .map((expediente) =>
          expediente.pacienteId?._id?.toString()
        )
        .filter(Boolean)
    );

    const totalCitasAtendidas =
      citas.filter(
        (cita) => cita.estado === 'atendido'
      ).length;

    const totalCitasCanceladas =
      citas.filter(
        (cita) => cita.estado === 'cancelado'
      ).length;

    const totalCitasCerradas =
      totalCitasAtendidas +
      totalCitasCanceladas;

    const tasaAsistencia =
      totalCitasCerradas === 0
        ? 0
        : Math.round(
            (
              totalCitasAtendidas /
              totalCitasCerradas
            ) * 100
          );

    const totalInsumosUtilizados =
      consumos.reduce(
        (total, consumo) =>
          total +
          Number(
            consumo.cantidadUtilizada || 0
          ),
        0
      );

    /*
     * Distribución real de servicios.
     * Se toman citas atendidas para evitar incluir
     * solicitudes canceladas o aún pendientes.
     */
    const conteoServicios = new Map();

    citas
      .filter(
        (cita) => cita.estado === 'atendido'
      )
      .forEach((cita) => {
        const servicio =
          obtenerNombreServicio(cita);

        conteoServicios.set(
          servicio,
          (conteoServicios.get(servicio) || 0) +
            1
        );
      });

    const totalServicios = Array.from(
      conteoServicios.values()
    ).reduce(
      (total, cantidad) =>
        total + cantidad,
      0
    );

    const distribucionCompleta =
      Array.from(
        conteoServicios.entries()
      )
        .map(([servicio, cantidad]) => ({
          servicio,
          cantidad,
          porcentaje:
            totalServicios === 0
              ? 0
              : Math.round(
                  (
                    cantidad /
                    totalServicios
                  ) * 100
                )
        }))
        .sort(
          (a, b) =>
            b.cantidad - a.cantidad
        );

    /*
     * Muestra los cinco servicios más frecuentes
     * y agrupa el resto como "Otros".
     */
    const principalesServicios =
      distribucionCompleta.slice(0, 5);

    const serviciosRestantes =
      distribucionCompleta.slice(5);

    if (serviciosRestantes.length > 0) {
      const cantidadOtros =
        serviciosRestantes.reduce(
          (total, servicio) =>
            total + servicio.cantidad,
          0
        );

      principalesServicios.push({
        servicio: 'Otros',
        cantidad: cantidadOtros,
        porcentaje:
          totalServicios === 0
            ? 0
            : Math.round(
                (
                  cantidadOtros /
                  totalServicios
                ) * 100
              )
      });
    }

    const evolucionMensual =
      periodo.meses.map((mes) => {
        const totalCitasMes =
          mes.citasAtendidas +
          mes.citasCanceladas;

        return {
          clave: mes.clave,
          mes: mes.nombre,
          pacientes: mes.pacientes.size,
          tratamientos: mes.tratamientos,
          insumosUtilizados:
            mes.insumosUtilizados,
          tasaAsistencia:
            totalCitasMes === 0
              ? 0
              : Math.round(
                  (
                    mes.citasAtendidas /
                    totalCitasMes
                  ) * 100
                )
        };
      });

    return res.json({
      odontologo: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email
      },

      periodo: {
        meses: cantidadMeses,
        desde: periodo.inicio,
        hasta: periodo.fin
      },

      resumen: {
        pacientesAtendidos:
          pacientesUnicos.size,

        tratamientosRealizados:
          expedientes.length,

        tasaAsistencia,

        insumosUtilizados:
          totalInsumosUtilizados
      },

      evolucionMensual,

      distribucionServicios:
        principalesServicios,

      tratamientosPorMes:
        evolucionMensual.map((item) => ({
          mes: item.mes,
          cantidad: item.tratamientos
        }))
    });
  } catch (error) {
    console.error(
      'Error al obtener estadísticas del odontólogo:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudieron cargar las estadísticas del odontólogo.',
    });
  }
};

export const obtenerResumenRecepcion = async (req, res) => {
  try {
    const fechaBolivia = obtenerFechaBolivia();
    const { inicio, fin } = crearRangoFechaUTC(fechaBolivia);

    const [year, month] = fechaBolivia.split('-');

    const inicioMes = new Date(
      `${year}-${month}-01T00:00:00.000Z`
    );

const siguienteMes =
  Number(month) === 12
    ? `${Number(year) + 1}-01-01`
    : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`;

const inicioMesSiguiente = new Date(
  `${siguienteMes}T00:00:00.000Z`
);

    const [
      pacientesActivos,
      nuevosPacientesMes,
      citasHoy,
      solicitudesPendientes
    ] = await Promise.all([
      Paciente.countDocuments({
        estado: { $ne: false }
      }),

      Paciente.countDocuments({
        fechaRegistro: {
          $gte: inicioMes,
          $lt: inicioMesSiguiente
        }
      }),

      Cita.find({
        fecha: {
          $gte: inicio,
          $lte: fin
        }
      })
        .populate('pacienteId')
        .sort({ hora: 1 }),

      SolicitudCita.find({
        estado: 'pendiente'
      })
        .sort({ fecha: 1, hora: 1 })
        .limit(6)
    ]);

    const citasPendientesHoy = citasHoy.filter(
      (cita) => cita.estado === 'pendiente'
    ).length;

    res.json({
      fecha: fechaBolivia,

      resumen: {
        citasHoy: citasHoy.length,
        pendientesConfirmacion:
          solicitudesPendientes.length,
        pacientesActivos,
        nuevosPacientesMes
      },

      citasHoy,

      solicitudesPendientes,

      citasPendientesHoy
    });
  } catch (_error) {
    res.status(500).json({
      mensaje: 'No se pudo cargar el panel de recepción.',
    });
  }
};
