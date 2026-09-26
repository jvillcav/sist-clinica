import {
  useEffect,
  useMemo,
  useState
} from 'react';

import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { normalizarTexto } from '../../utils/texto';
import '../../styles/admin/citasAdmin.css';

/* =====================================================
   ICONOS
===================================================== */

const IconoCalendario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const IconoPendiente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconoConfirmada = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const IconoAtendida = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 12 11 14 15 9" />
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 3v3M16 3v3" />
  </svg>
);

const IconoCancelada = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 8 8 8" />
  </svg>
);

const IconoSolicitud = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 4h16v16H4z" />
    <path d="m5 7 7 5 7-5" />
  </svg>
);

const IconoBuscar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const IconoAgregar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6.2 8A7 7 0 0 1 18 6l2 2" />
    <path d="M17.8 16A7 7 0 0 1 6 18l-2-2" />
  </svg>
);

const IconoVer = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconoReprogramar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <path d="m15 14 2 2 3-3" />
  </svg>
);

const IconoCancelar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 8 8 8" />
  </svg>
);

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const IconoAnterior = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const IconoSiguiente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/* =====================================================
   CONFIGURACIÓN
===================================================== */

const diasSemana = [
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
  'Dom'
];

const formularioInicial = {
  pacienteId: '',
  odontologoId: '',
  fecha: '',
  hora: '',
  duracionMinutos: 30,
  motivo: '',
  observaciones: '',
  estado: 'pendiente'
};

const reprogramacionInicial = {
  fecha: '',
  hora: '',
  odontologoId: '',
  motivoReprogramacion: ''
};

const confirmacionSolicitudInicial = {
  pacienteId: '',
  odontologoId: '',
  duracionMinutos: 30
};

const pacienteSolicitudInicial = {
  nombre: '',
  apellido: '',
  ci: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  sexo: '',
  direccion: '',
  crearAccesoPortal: false
};

/* =====================================================
   UTILIDADES
===================================================== */

const fechaLocalTexto = (fecha) => {
  if (!fecha) return '';

  if (
    typeof fecha === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return fecha;
  }

  if (
    typeof fecha === 'string' &&
    fecha.includes('T')
  ) {
    return fecha.split('T')[0];
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  const year = valor.getFullYear();

  const month = String(
    valor.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    valor.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const crearFechaLocal = (
  year,
  month,
  day
) => {
  return new Date(
    year,
    month,
    day,
    12,
    0,
    0
  );
};

const formatearFechaVisible = (fecha) => {
  const texto = fechaLocalTexto(fecha);

  if (!texto) return 'Sin fecha';

  const [year, month, day] =
    texto.split('-').map(Number);

  return crearFechaLocal(
    year,
    month - 1,
    day
  ).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatearFechaLarga = (fecha) => {
  const texto = fechaLocalTexto(fecha);

  if (!texto) return 'Sin fecha';

  const [year, month, day] =
    texto.split('-').map(Number);

  return crearFechaLocal(
    year,
    month - 1,
    day
  ).toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const obtenerNombrePaciente = (cita) => {
  const paciente = cita?.pacienteId;

  if (!paciente) {
    return 'Paciente no disponible';
  }

  return `${paciente.nombre || ''} ${
    paciente.apellido || ''
  }`.trim();
};

const obtenerNombreOdontologo = (cita) => {
  return (
    cita?.odontologoId?.nombre ||
    cita?.odontologo ||
    'Sin odontólogo'
  );
};

const obtenerIniciales = (nombre = '') => {
  const partes = String(nombre)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return 'PA';

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`
    .toUpperCase();
};

const etiquetaEstado = (estado) => {
  const etiquetas = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    atendido: 'Atendida',
    cancelado: 'Cancelada',
    rechazada: 'Rechazada'
  };

  return etiquetas[estado] || estado;
};

const etiquetaOrigen = (origen) => {
  return origen === 'solicitud_online'
    ? 'Solicitud online'
    : 'Cita interna';
};

const separarNombreCompleto = (
  nombreCompleto = ''
) => {
  const partes = String(nombreCompleto)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return {
      nombre: '',
      apellido: ''
    };
  }

  if (partes.length === 1) {
    return {
      nombre: partes[0],
      apellido: ''
    };
  }

  return {
    nombre: partes[0],
    apellido: partes.slice(1).join(' ')
  };
};

const limpiarTelefono = (telefono = '') => {
  return String(telefono).replace(/\D/g, '');
};

/* =====================================================
   COMPONENTE
===================================================== */

const Citas = () => {
  const hoy = useMemo(() => new Date(), []);

  const [citas, setCitas] = useState([]);
  const [solicitudes, setSolicitudes] =
    useState([]);

  const [odontologos, setOdontologos] =
    useState([]);

  const [pacientes, setPacientes] =
    useState([]);

  const [
    fechaSeleccionada,
    setFechaSeleccionada
  ] = useState(hoy);

  const [mesVisible, setMesVisible] =
    useState(
      new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      )
    );

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState('todos');

  const [
    filtroOdontologo,
    setFiltroOdontologo
  ] = useState('todos');

  const [filtroOrigen, setFiltroOrigen] =
    useState('todos');

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [tamanoPagina, setTamanoPagina] =
    useState(10);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  const [modal, setModal] =
    useState(null);

  const [citaSeleccionada, setCitaSeleccionada] =
    useState(null);

  const [
    solicitudSeleccionada,
    setSolicitudSeleccionada
  ] = useState(null);

  const [nuevaCita, setNuevaCita] =
    useState(formularioInicial);

  const [
    reprogramacion,
    setReprogramacion
  ] = useState(reprogramacionInicial);

  const [
    motivoCancelacion,
    setMotivoCancelacion
  ] = useState('');

  const [
    confirmacionSolicitud,
    setConfirmacionSolicitud
  ] = useState(
    confirmacionSolicitudInicial
  );

  const [
    motivoRechazo,
    setMotivoRechazo
  ] = useState('');

  const [
    modoPacienteSolicitud,
    setModoPacienteSolicitud
  ] = useState('existente');

  const [
    pacienteSolicitud,
    setPacienteSolicitud
  ] = useState(pacienteSolicitudInicial);

  const [
    registrandoPacienteSolicitud,
    setRegistrandoPacienteSolicitud
  ] = useState(false);

  const [
    mensajeSolicitudModal,
    setMensajeSolicitudModal
  ] = useState('');

  const [
    errorSolicitudModal,
    setErrorSolicitudModal
  ] = useState('');

  useEffect(() => {
    cargarInformacion();
  }, []);

  /* ===================================================
     CARGA DE DATOS
  =================================================== */

  const cargarInformacion = async () => {
    try {
      setCargando(true);
      setError('');

      const [
        respuestaCitas,
        respuestaSolicitudes,
        respuestaOdontologos,
        respuestaPacientes
      ] = await Promise.all([
        api.get('/citas'),
        api.get('/solicitudes-citas'),
        api.get('/usuarios/odontologos'),
        api.get('/pacientes')
      ]);

      const datosCitas =
        respuestaCitas.data?.citas ??
        respuestaCitas.data;

      const datosSolicitudes =
        respuestaSolicitudes.data
          ?.solicitudes ??
        respuestaSolicitudes.data;

      setCitas(
        Array.isArray(datosCitas)
          ? datosCitas
          : []
      );

      setSolicitudes(
        Array.isArray(datosSolicitudes)
          ? datosSolicitudes
          : []
      );

      setOdontologos(
        Array.isArray(
          respuestaOdontologos.data
        )
          ? respuestaOdontologos.data
          : []
      );

      setPacientes(
        Array.isArray(
          respuestaPacientes.data
        )
          ? respuestaPacientes.data
          : []
      );
    } catch (errorPeticion) {
      console.error(
        'Error al cargar agenda:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudo cargar la agenda de citas.'
      );
    } finally {
      setCargando(false);
    }
  };

  const limpiarMensajes = () => {
    setMensaje('');
    setError('');
  };

  /* ===================================================
     RESUMEN Y FILTROS
  =================================================== */

  const citasFiltradas = useMemo(() => {
    const texto =
      normalizarTexto(busqueda);

    return citas.filter((cita) => {
      const paciente =
        cita.pacienteId;

      const odontologoId =
        cita.odontologoId?._id ||
        cita.odontologoId ||
        '';

      const coincideBusqueda =
        !texto ||
        normalizarTexto(
          `${obtenerNombrePaciente(cita)} ${
            paciente?.ci || ''
          } ${
            paciente?.telefono || ''
          } ${cita.motivo || ''}`
        ).includes(texto);

      const coincideEstado =
        filtroEstado === 'todos' ||
        cita.estado === filtroEstado;

      const coincideOdontologo =
        filtroOdontologo === 'todos' ||
        String(odontologoId) ===
          String(filtroOdontologo);

      const coincideOrigen =
        filtroOrigen === 'todos' ||
        cita.origen === filtroOrigen;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideOdontologo &&
        coincideOrigen
      );
    });
  }, [
    citas,
    busqueda,
    filtroEstado,
    filtroOdontologo,
    filtroOrigen
  ]);

  const resumen = useMemo(() => {
    const fechaHoy =
      fechaLocalTexto(hoy);

    return {
      total: citas.length,

      hoy: citas.filter(
        (cita) =>
          fechaLocalTexto(cita.fecha) ===
          fechaHoy
      ).length,

      pendientes: citas.filter(
        (cita) =>
          cita.estado === 'pendiente'
      ).length,

      confirmadas: citas.filter(
        (cita) =>
          cita.estado === 'confirmada'
      ).length,

      atendidas: citas.filter(
        (cita) =>
          cita.estado === 'atendido'
      ).length,

      canceladas: citas.filter(
        (cita) =>
          cita.estado === 'cancelado'
      ).length,

      solicitudesPendientes:
        solicitudes.filter(
          (solicitud) =>
            solicitud.estado ===
            'pendiente'
        ).length
    };
  }, [citas, solicitudes, hoy]);

  const fechaSeleccionadaTexto =
    fechaLocalTexto(fechaSeleccionada);

  const citasDelDia = useMemo(() => {
    return citasFiltradas
      .filter(
        (cita) =>
          fechaLocalTexto(cita.fecha) ===
          fechaSeleccionadaTexto
      )
      .sort((a, b) =>
        String(a.hora).localeCompare(
          String(b.hora)
        )
      );
  }, [
    citasFiltradas,
    fechaSeleccionadaTexto
  ]);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    fechaSeleccionadaTexto,
    busqueda,
    filtroEstado,
    filtroOdontologo,
    filtroOrigen
  ]);

  const citasDelDiaPaginadas = useMemo(() => {
    const inicio =
      (paginaActual - 1) * tamanoPagina;

    return citasDelDia.slice(
      inicio,
      inicio + tamanoPagina
    );
  }, [citasDelDia, paginaActual, tamanoPagina]);

  const solicitudesPendientes =
    useMemo(() => {
      return solicitudes
        .filter(
          (solicitud) =>
            solicitud.estado ===
            'pendiente'
        )
        .sort((a, b) => {
          const fechaA = `${fechaLocalTexto(
            a.fecha
          )} ${a.hora}`;

          const fechaB = `${fechaLocalTexto(
            b.fecha
          )} ${b.hora}`;

          return fechaA.localeCompare(fechaB);
        });
    }, [solicitudes]);

  const citasRecientes = useMemo(() => {
    return [...citas]
      .sort((a, b) => {
        const fechaA = `${fechaLocalTexto(
          a.fecha
        )} ${a.hora}`;

        const fechaB = `${fechaLocalTexto(
          b.fecha
        )} ${b.hora}`;

        return fechaB.localeCompare(fechaA);
      })
      .slice(0, 8);
  }, [citas]);

  /* ===================================================
     CALENDARIO
  =================================================== */

  const anioVisible =
    mesVisible.getFullYear();

  const numeroMesVisible =
    mesVisible.getMonth();

  const nombreMesVisible =
    mesVisible.toLocaleDateString(
      'es-BO',
      {
        month: 'long',
        year: 'numeric'
      }
    );

  const diasDelMes = new Date(
    anioVisible,
    numeroMesVisible + 1,
    0
  ).getDate();

  const primerDia = new Date(
    anioVisible,
    numeroMesVisible,
    1
  ).getDay();

  const espaciosIniciales =
    primerDia === 0
      ? 6
      : primerDia - 1;

  const cambiarMes = (cantidad) => {
    setMesVisible(
      new Date(
        anioVisible,
        numeroMesVisible + cantidad,
        1
      )
    );
  };

  const obtenerCitasDiaCalendario = (
    dia
  ) => {
    const fecha = fechaLocalTexto(
      crearFechaLocal(
        anioVisible,
        numeroMesVisible,
        dia
      )
    );

    return citasFiltradas.filter(
      (cita) =>
        fechaLocalTexto(cita.fecha) ===
        fecha
    );
  };

  const seleccionarDia = (dia) => {
    setFechaSeleccionada(
      crearFechaLocal(
        anioVisible,
        numeroMesVisible,
        dia
      )
    );
  };

  /* ===================================================
     MODALES
  =================================================== */

  const cerrarModal = (forzar = false) => {
    if (
      procesando &&
      forzar !== true
    ) {
      return;
    }

    setModal(null);
    setCitaSeleccionada(null);
    setSolicitudSeleccionada(null);
    setNuevaCita(formularioInicial);
    setReprogramacion(
      reprogramacionInicial
    );
    setMotivoCancelacion('');
    setConfirmacionSolicitud(
      confirmacionSolicitudInicial
    );
    setMotivoRechazo('');
    setModoPacienteSolicitud('existente');
    setPacienteSolicitud(
      pacienteSolicitudInicial
    );
    setMensajeSolicitudModal('');
    setErrorSolicitudModal('');
  };

  const abrirNuevaCita = () => {
    limpiarMensajes();

    setNuevaCita({
      ...formularioInicial,
      fecha:
        fechaSeleccionadaTexto,
      estado: 'pendiente'
    });

    setModal('nueva');
  };

  const abrirDetalle = (cita) => {
    setCitaSeleccionada(cita);
    setModal('detalle');
  };

  const abrirReprogramacion = (cita) => {
    limpiarMensajes();

    setCitaSeleccionada(cita);

    setReprogramacion({
      fecha:
        fechaLocalTexto(cita.fecha),

      hora:
        cita.hora || '',

      odontologoId:
        cita.odontologoId?._id ||
        cita.odontologoId ||
        '',

      motivoReprogramacion: ''
    });

    setModal('reprogramar');
  };

  const abrirCancelacion = (cita) => {
    limpiarMensajes();

    setCitaSeleccionada(cita);
    setMotivoCancelacion('');
    setModal('cancelar');
  };

  const abrirConfirmarSolicitud = (
    solicitud
  ) => {
    limpiarMensajes();
    setMensajeSolicitudModal('');
    setErrorSolicitudModal('');

  const datosNombre =
    solicitud.nombre &&
    solicitud.apellido
    ? {
        nombre: solicitud.nombre,
        apellido: solicitud.apellido
      }
    : separarNombreCompleto(
        solicitud.nombreCompleto
  );

const { nombre, apellido } =
  datosNombre;

    const correoSolicitud =
      normalizarTexto(
        solicitud.email
      );

    const telefonoSolicitud =
      limpiarTelefono(
        solicitud.telefono
      );

    const ciSolicitud =
  String(solicitud.ci || '')
    .replace(/\s/g, '')
    .toLowerCase();

    const coincidencia = pacientes.find(
      (paciente) => {
        const mismoCorreo =
          correoSolicitud &&
          normalizarTexto(
            paciente.email
          ) === correoSolicitud;

        const mismoTelefono =
          telefonoSolicitud &&
          limpiarTelefono(
            paciente.telefono
          ) === telefonoSolicitud;

        const mismoCi =
         ciSolicitud &&
  String(paciente.ci || '')
    .replace(/\s/g, '')
    .toLowerCase() === ciSolicitud;

return (
  mismoCi ||
  mismoCorreo ||
  mismoTelefono
);
      }
    );

    setSolicitudSeleccionada(
      solicitud
    );

    setConfirmacionSolicitud({
      ...confirmacionSolicitudInicial,
      pacienteId:
        coincidencia?._id || ''
    });

setPacienteSolicitud({
  ...pacienteSolicitudInicial,
  nombre,
  apellido,
  ci: solicitud.ci || '',
  telefono: solicitud.telefono || '',
  email: solicitud.email || ''
});

    setModoPacienteSolicitud(
      coincidencia
        ? 'existente'
        : 'nuevo'
    );

    if (coincidencia) {
      setMensajeSolicitudModal(
        `Se encontró una posible coincidencia: ${coincidencia.nombre} ${coincidencia.apellido}. Verifica la información antes de continuar.`
      );
    }

    setModal('confirmar-solicitud');
  };

  const abrirRechazarSolicitud = (
    solicitud
  ) => {
    limpiarMensajes();

    setSolicitudSeleccionada(
      solicitud
    );

    setMotivoRechazo('');
    setModal('rechazar-solicitud');
  };

  /* ===================================================
     CREAR CITA
  =================================================== */

  const guardarCita = async (evento) => {
    evento.preventDefault();
    limpiarMensajes();

    try {
      setProcesando(true);

      const payload = {
        ...nuevaCita,

        duracionMinutos: Number(
          nuevaCita.duracionMinutos
        )
      };

      const { data } = await api.post(
        '/citas',
        payload
      );

      setMensaje(
        data?.mensaje ||
          'Cita registrada correctamente.'
      );

      cerrarModal(true);
      await cargarInformacion();
    } catch (errorPeticion) {
      console.error(
        'Error al registrar cita:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudo registrar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  /* ===================================================
     CONFIRMAR CITA
  =================================================== */

  const confirmarCita = async (cita) => {
    limpiarMensajes();

    const confirmar = window.confirm(
      `¿Confirmas la cita de ${obtenerNombrePaciente(
        cita
      )}?`
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      const { data } = await api.patch(
        `/citas/${cita._id}/confirmar`
      );

      setMensaje(
        data?.mensaje ||
          'Cita confirmada correctamente.'
      );

      await cargarInformacion();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudo confirmar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  /* ===================================================
     REPROGRAMAR CITA
  =================================================== */

  const guardarReprogramacion = async (
    evento
  ) => {
    evento.preventDefault();
    limpiarMensajes();

    try {
      setProcesando(true);

      const { data } = await api.patch(
        `/citas/${citaSeleccionada._id}/reprogramar`,
        reprogramacion
      );

      setMensaje(
        data?.mensaje ||
          'Cita reprogramada correctamente.'
      );

      cerrarModal(true);
      await cargarInformacion();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudo reprogramar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  /* ===================================================
     CANCELAR CITA
  =================================================== */

  const guardarCancelacion = async (
    evento
  ) => {
    evento.preventDefault();
    limpiarMensajes();

    try {
      setProcesando(true);

      const { data } = await api.patch(
        `/citas/${citaSeleccionada._id}/cancelar`,
        {
          motivoCancelacion:
            motivoCancelacion.trim()
        }
      );

      setMensaje(
        data?.mensaje ||
          'Cita cancelada correctamente.'
      );

      cerrarModal(true);
      await cargarInformacion();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudo cancelar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  /* ===================================================
     REGISTRAR PACIENTE DESDE SOLICITUD
  =================================================== */

  const cambiarPacienteSolicitud = (
    campo,
    valor
  ) => {
    setPacienteSolicitud(
      (anterior) => ({
        ...anterior,
        [campo]: valor
      })
    );
  };

  const registrarPacienteDesdeSolicitud =
    async () => {
      setErrorSolicitudModal('');
      setMensajeSolicitudModal('');

      if (
        !pacienteSolicitud.nombre.trim() ||
        !pacienteSolicitud.apellido.trim() ||
        !pacienteSolicitud.ci.trim()
      ) {
        setErrorSolicitudModal(
          'Nombre, apellido y carnet de identidad son obligatorios.'
        );
        return;
      }

      if (
        pacienteSolicitud.crearAccesoPortal &&
        !pacienteSolicitud.email.trim()
      ) {
        setErrorSolicitudModal(
          'Debes registrar un correo para crear el acceso al portal.'
        );
        return;
      }

      try {
        setRegistrandoPacienteSolicitud(
          true
        );

        const { data } = await api.post(
          '/pacientes',
          {
            nombre:
              pacienteSolicitud.nombre.trim(),

            apellido:
              pacienteSolicitud.apellido.trim(),

            ci:
              pacienteSolicitud.ci.trim(),

            telefono:
              pacienteSolicitud.telefono.trim(),

            email:
              pacienteSolicitud.email.trim(),

            fechaNacimiento:
              pacienteSolicitud.fechaNacimiento ||
              null,

            sexo:
              pacienteSolicitud.sexo,

            direccion:
              pacienteSolicitud.direccion.trim(),

            crearAccesoPortal:
              pacienteSolicitud
                .crearAccesoPortal,

            estado: true
          }
        );

        const pacienteCreado =
          data?.paciente || data;

        if (!pacienteCreado?._id) {
          throw new Error(
            'El servidor no devolvió el paciente creado.'
          );
        }

        setPacientes(
          (anteriores) => [
            pacienteCreado,
            ...anteriores.filter(
              (paciente) =>
                paciente._id !==
                pacienteCreado._id
            )
          ]
        );

        setConfirmacionSolicitud(
          (anterior) => ({
            ...anterior,
            pacienteId:
              pacienteCreado._id
          })
        );

        setModoPacienteSolicitud(
          'existente'
        );

        setMensajeSolicitudModal(
          `${pacienteCreado.nombre} ${pacienteCreado.apellido} fue registrado y vinculado. Ahora selecciona al odontólogo y crea la cita.`
        );
      } catch (errorPeticion) {
        console.error(
          'Error al registrar paciente desde solicitud:',
          errorPeticion
        );

        setErrorSolicitudModal(
          errorPeticion.response?.data
            ?.mensaje ||
            errorPeticion.message ||
            'No se pudo registrar el paciente.'
        );
      } finally {
        setRegistrandoPacienteSolicitud(
          false
        );
      }
    };

  /* ===================================================
     CONFIRMAR SOLICITUD
  =================================================== */

  const guardarConfirmacionSolicitud =
    async (evento) => {
      evento.preventDefault();
      limpiarMensajes();

      if (
        !confirmacionSolicitud.pacienteId
      ) {
        setErrorSolicitudModal(
          'Debes vincular o registrar un paciente antes de crear la cita.'
        );
        return;
      }

      if (
        !confirmacionSolicitud.odontologoId
      ) {
        setErrorSolicitudModal(
          'Debes seleccionar un odontólogo.'
        );
        return;
      }

      try {
        setProcesando(true);
        setErrorSolicitudModal('');

        const { data } = await api.patch(
          `/solicitudes-citas/${solicitudSeleccionada._id}/confirmar`,
          {
            ...confirmacionSolicitud,

            duracionMinutos: Number(
              confirmacionSolicitud
                .duracionMinutos
            )
          }
        );

        setMensaje(
          data?.mensaje ||
            'Solicitud convertida en cita.'
        );

        cerrarModal();
        await cargarInformacion();
      } catch (errorPeticion) {
        setError(
          errorPeticion.response?.data
            ?.mensaje ||
            'No se pudo confirmar la solicitud.'
        );
      } finally {
        setProcesando(false);
      }
    };

  /* ===================================================
     RECHAZAR SOLICITUD
  =================================================== */

  const guardarRechazoSolicitud =
    async (evento) => {
      evento.preventDefault();
      limpiarMensajes();

      try {
        setProcesando(true);

        const { data } = await api.patch(
          `/solicitudes-citas/${solicitudSeleccionada._id}/rechazar`,
          {
            motivoRechazo:
              motivoRechazo.trim()
          }
        );

        setMensaje(
          data?.mensaje ||
            'Solicitud rechazada correctamente.'
        );

        cerrarModal();
        await cargarInformacion();
      } catch (errorPeticion) {
        setError(
          errorPeticion.response?.data
            ?.mensaje ||
            'No se pudo rechazar la solicitud.'
        );
      } finally {
        setProcesando(false);
      }
    };

  /* ===================================================
     CARGA
  =================================================== */

  if (cargando) {
    return (
      <section className="admin-appointments-loading">
        <div className="admin-appointments-spinner" />

        <h2>Cargando agenda</h2>

        <p>
          Consultando citas, solicitudes y
          disponibilidad.
        </p>
      </section>
    );
  }

  return (
    <main className="admin-appointments-page">
      {/* ENCABEZADO */}

      <header className="admin-appointments-header">
        <div>
          <span className="admin-appointments-eyebrow">
            Gestión asistencial
          </span>

          <h1>Agenda de citas</h1>

          <p>
            Supervisa la programación, solicitudes
            y estados de atención.
          </p>
        </div>

        <div className="admin-appointments-header-actions">
          <button
            type="button"
            className="appointments-refresh"
            onClick={cargarInformacion}
          >
            <IconoActualizar />
            Actualizar
          </button>

          <button
            type="button"
            className="appointments-new"
            onClick={abrirNuevaCita}
          >
            <IconoAgregar />
            Nueva cita
          </button>
        </div>
      </header>

      {/* MENSAJES */}

      {mensaje && (
        <div className="admin-appointments-message success">
          <IconoCheck />
          <span>{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="admin-appointments-message error">
          <IconoAdvertencia />
          <span>{error}</span>
        </div>
      )}

      {/* INDICADORES */}

      <section className="admin-appointments-summary">
        <article className="total">
          <div>
            <span>Total de citas</span>
            <strong>{resumen.total}</strong>
          </div>

          <IconoCalendario />
        </article>

        <article className="today">
          <div>
            <span>Citas de hoy</span>
            <strong>{resumen.hoy}</strong>
          </div>

          <IconoCalendario />
        </article>

        <article className="pending">
          <div>
            <span>Pendientes</span>
            <strong>
              {resumen.pendientes}
            </strong>
          </div>

          <IconoPendiente />
        </article>

        <article className="confirmed">
          <div>
            <span>Confirmadas</span>
            <strong>
              {resumen.confirmadas}
            </strong>
          </div>

          <IconoConfirmada />
        </article>

        <article className="attended">
          <div>
            <span>Atendidas</span>
            <strong>
              {resumen.atendidas}
            </strong>
          </div>

          <IconoAtendida />
        </article>

        <article className="requests">
          <div>
            <span>Solicitudes online</span>
            <strong>
              {resumen.solicitudesPendientes}
            </strong>
          </div>

          <IconoSolicitud />
        </article>
      </section>

      {/* FILTROS */}

      <section className="admin-appointments-toolbar">
        <label className="appointments-search">
          <span>Buscar cita</span>

          <div>
            <IconoBuscar />

            <input
              type="search"
              value={busqueda}
              placeholder="Paciente, CI, teléfono o servicio..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
            />
          </div>
        </label>

        <label>
          <span>Odontólogo</span>

          <select
            value={filtroOdontologo}
            onChange={(evento) =>
              setFiltroOdontologo(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            {odontologos.map(
              (odontologo) => (
                <option
                  key={odontologo._id}
                  value={odontologo._id}
                >
                  {odontologo.nombre}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span>Estado</span>

          <select
            value={filtroEstado}
            onChange={(evento) =>
              setFiltroEstado(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="pendiente">
              Pendientes
            </option>

            <option value="confirmada">
              Confirmadas
            </option>

            <option value="atendido">
              Atendidas
            </option>

            <option value="cancelado">
              Canceladas
            </option>
          </select>
        </label>

        <label>
          <span>Origen</span>

          <select
            value={filtroOrigen}
            onChange={(evento) =>
              setFiltroOrigen(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="interna">
              Cita interna
            </option>

            <option value="solicitud_online">
              Solicitud online
            </option>
          </select>
        </label>
      </section>

      {/* CALENDARIO Y SOLICITUDES */}

      <section className="appointments-main-grid">
        <article className="appointments-calendar-card">
          <header className="appointments-calendar-header">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => cambiarMes(-1)}
            >
              <IconoAnterior />
            </button>

            <div>
              <span>Calendario mensual</span>

              <h2>
                {nombreMesVisible
                  .charAt(0)
                  .toUpperCase() +
                  nombreMesVisible.slice(1)}
              </h2>
            </div>

            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => cambiarMes(1)}
            >
              <IconoSiguiente />
            </button>
          </header>

          <div className="appointments-calendar-grid">
            {diasSemana.map((dia) => (
              <strong key={dia}>
                {dia}
              </strong>
            ))}

            {Array.from({
              length: espaciosIniciales
            }).map((_, indice) => (
              <span
                key={`empty-${indice}`}
                className="calendar-empty"
              />
            ))}

            {Array.from(
              {
                length: diasDelMes
              },
              (_, indice) => {
                const dia = indice + 1;

                const fechaDia =
                  fechaLocalTexto(
                    crearFechaLocal(
                      anioVisible,
                      numeroMesVisible,
                      dia
                    )
                  );

                const citasDia =
                  obtenerCitasDiaCalendario(
                    dia
                  );

                const seleccionado =
                  fechaDia ===
                  fechaSeleccionadaTexto;

                const esHoy =
                  fechaDia ===
                  fechaLocalTexto(hoy);

                return (
                  <button
                    type="button"
                    key={dia}
                    className={[
                      'calendar-day',
                      seleccionado
                        ? 'selected'
                        : '',
                      esHoy ? 'today' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      seleccionarDia(dia)
                    }
                  >
                    <span>{dia}</span>

                    {citasDia.length > 0 && (
                      <small>
                        {citasDia.length}{' '}
                        {citasDia.length === 1
                          ? 'cita'
                          : 'citas'}
                      </small>
                    )}

                    {citasDia.length > 0 && (
                      <i>
                        {citasDia
                          .slice(0, 3)
                          .map((cita) => (
                            <b
                              key={cita._id}
                              className={
                                cita.estado
                              }
                            />
                          ))}
                      </i>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </article>

        <aside className="appointments-requests-card">
          <header>
            <div>
              <span>Portal público</span>
              <h2>
                Solicitudes pendientes
              </h2>
            </div>

            <strong>
              {solicitudesPendientes.length}
            </strong>
          </header>

          {solicitudesPendientes.length ===
          0 ? (
            <div className="requests-empty">
              <IconoSolicitud />

              <h3>
                No existen solicitudes pendientes
              </h3>

              <p>
                Las nuevas solicitudes del portal
                aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="requests-list">
              {solicitudesPendientes
                .slice(0, 7)
                .map((solicitud) => (
                  <article
                    key={solicitud._id}
                    className="request-item"
                  >
                    <div className="request-main">
                      <span>
                        {obtenerIniciales(
                          solicitud.nombreCompleto
                        )}
                      </span>

                      <div>
                        <strong>
                          {
                            solicitud.nombreCompleto
                          }
                        </strong>

                        <small>
                          {formatearFechaVisible(
                            solicitud.fecha
                          )}{' '}
                          · {solicitud.hora}
                        </small>

                        <p>
                          {solicitud.servicio}
                        </p>

                        <em>
                          {solicitud.telefono}
                        </em>
                      </div>
                    </div>

                    <div className="request-actions">
                      <button
                        type="button"
                        className="accept"
                        onClick={() =>
                          abrirConfirmarSolicitud(
                            solicitud
                          )
                        }
                      >
                        Confirmar
                      </button>

                      <button
                        type="button"
                        className="reject"
                        onClick={() =>
                          abrirRechazarSolicitud(
                            solicitud
                          )
                        }
                      >
                        Rechazar
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </aside>
      </section>

      {/* CITAS DEL DÍA */}

      <section className="daily-agenda-card">
        <header>
          <div>
            <span>Agenda seleccionada</span>

            <h2>
              {formatearFechaLarga(
                fechaSeleccionada
              )}
            </h2>

            <p>
              {citasDelDia.length}{' '}
              {citasDelDia.length === 1
                ? 'cita encontrada'
                : 'citas encontradas'}
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNuevaCita}
          >
            <IconoAgregar />
            Agendar en este día
          </button>
        </header>

        {citasDelDia.length === 0 ? (
          <div className="daily-agenda-empty">
            <IconoCalendario />

            <h3>
              No existen citas para esta fecha
            </h3>

            <p>
              Selecciona otra fecha o registra una
              nueva cita.
            </p>
          </div>
        ) : (
          <>
          <div className="daily-agenda-table-wrapper">
            <table className="daily-agenda-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Odontólogo</th>
                  <th>Servicio</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {citasDelDiaPaginadas.map((cita) => (
                  <tr key={cita._id}>
                    <td>
                      <div className="appointment-time">
                        <strong>
                          {cita.hora}
                        </strong>

                        <small>
                          {cita.duracionMinutos ||
                            30}{' '}
                          min
                        </small>
                      </div>
                    </td>

                    <td>
                      <div className="appointment-patient">
                        <span>
                          {obtenerIniciales(
                            obtenerNombrePaciente(
                              cita
                            )
                          )}
                        </span>

                        <div>
                          <strong>
                            {obtenerNombrePaciente(
                              cita
                            )}
                          </strong>

                          <small>
                            CI:{' '}
                            {cita.pacienteId
                              ?.ci ||
                              'Sin registro'}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {obtenerNombreOdontologo(
                        cita
                      )}
                    </td>

                    <td>
                      <strong className="appointment-service">
                        {cita.motivo}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`appointment-origin ${
                          cita.origen ||
                          'interna'
                        }`}
                      >
                        {etiquetaOrigen(
                          cita.origen
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`appointment-status ${cita.estado}`}
                      >
                        {etiquetaEstado(
                          cita.estado
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="appointment-actions">
                        <button
                          type="button"
                          title="Ver detalles"
                          onClick={() =>
                            abrirDetalle(cita)
                          }
                        >
                          <IconoVer />
                        </button>

                        {cita.estado ===
                          'pendiente' && (
                          <button
                            type="button"
                            className="confirm"
                            title="Confirmar cita"
                            onClick={() =>
                              confirmarCita(cita)
                            }
                          >
                            <IconoConfirmada />
                          </button>
                        )}

                        {![
                          'atendido',
                          'cancelado'
                        ].includes(
                          cita.estado
                        ) && (
                          <button
                            type="button"
                            className="reschedule"
                            title="Reprogramar"
                            onClick={() =>
                              abrirReprogramacion(
                                cita
                              )
                            }
                          >
                            <IconoReprogramar />
                          </button>
                        )}

                        {![
                          'atendido',
                          'cancelado'
                        ].includes(
                          cita.estado
                        ) && (
                          <button
                            type="button"
                            className="cancel"
                            title="Cancelar cita"
                            onClick={() =>
                              abrirCancelacion(
                                cita
                              )
                            }
                          >
                            <IconoCancelar />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={paginaActual}
            pageSize={tamanoPagina}
            totalItems={citasDelDia.length}
            onPageChange={setPaginaActual}
            onPageSizeChange={(size) => {
              setTamanoPagina(size);
              setPaginaActual(1);
            }}
            label="citas"
          />
          </>
        )}
      </section>

      {/* HISTORIAL RECIENTE */}

      <section className="recent-appointments-card">
        <header>
          <div>
            <span>Actividad clínica</span>
            <h2>Historial reciente</h2>
          </div>
        </header>

        <div className="recent-appointments-list">
          {citasRecientes.map((cita) => (
            <article key={cita._id}>
              <div className="recent-date">
                <strong>
                  {
                    fechaLocalTexto(
                      cita.fecha
                    ).split('-')[2]
                  }
                </strong>

                <span>
                  {new Date(
                    cita.fecha
                  ).toLocaleDateString(
                    'es-BO',
                    {
                      month: 'short'
                    }
                  )}
                </span>
              </div>

              <div className="recent-content">
                <strong>
                  {obtenerNombrePaciente(
                    cita
                  )}
                </strong>

                <p>
                  {cita.hora} · {cita.motivo}
                </p>

                <small>
                  {obtenerNombreOdontologo(
                    cita
                  )}{' '}
                  · {etiquetaOrigen(cita.origen)}
                </small>
              </div>

              <span
                className={`appointment-status ${cita.estado}`}
              >
                {etiquetaEstado(cita.estado)}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* =================================================
          MODAL NUEVA CITA
      ================================================= */}

      {modal === 'nueva' && (
        <div
          className="appointment-modal-overlay"
          onMouseDown={(evento) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              cerrarModal();
            }
          }}
        >
          <section className="appointment-modal">
            <header>
              <div>
                <span>
                  Programación interna
                </span>

                <h2>Registrar nueva cita</h2>

                <p>
                  Selecciona al paciente, odontólogo
                  y horario de atención.
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar"
                onClick={cerrarModal}
                disabled={procesando}
              >
                <IconoCerrar />
              </button>
            </header>

            <form onSubmit={guardarCita}>
              <label className="full">
                <span>Paciente *</span>

                <select
                  value={
                    nuevaCita.pacienteId
                  }
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        pacienteId:
                          evento.target
                            .value
                      })
                    )
                  }
                  required
                >
                  <option value="">
                    Seleccionar paciente
                  </option>

                  {pacientes
                    .filter(
                      (paciente) =>
                        paciente.estado !==
                        false
                    )
                    .map((paciente) => (
                      <option
                        key={paciente._id}
                        value={paciente._id}
                      >
                        {paciente.nombre}{' '}
                        {paciente.apellido} ·
                        CI: {paciente.ci}
                      </option>
                    ))}
                </select>
              </label>

              <label className="full">
                <span>Odontólogo *</span>

                <select
                  value={
                    nuevaCita.odontologoId
                  }
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        odontologoId:
                          evento.target
                            .value
                      })
                    )
                  }
                  required
                >
                  <option value="">
                    Seleccionar odontólogo
                  </option>

                  {odontologos
                    .filter(
                      (odontologo) =>
                        odontologo.estado !==
                        false
                    )
                    .map((odontologo) => (
                      <option
                        key={odontologo._id}
                        value={odontologo._id}
                      >
                        {odontologo.nombre}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                <span>Fecha *</span>

                <input
                  type="date"
                  value={nuevaCita.fecha}
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        fecha:
                          evento.target
                            .value
                      })
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Hora *</span>

                <input
                  type="time"
                  value={nuevaCita.hora}
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        hora:
                          evento.target
                            .value
                      })
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Duración estimada
                </span>

                <select
                  value={
                    nuevaCita.duracionMinutos
                  }
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        duracionMinutos:
                          evento.target
                            .value
                      })
                    )
                  }
                >
                  <option value="15">
                    15 minutos
                  </option>

                  <option value="30">
                    30 minutos
                  </option>

                  <option value="45">
                    45 minutos
                  </option>

                  <option value="60">
                    60 minutos
                  </option>

                  <option value="90">
                    90 minutos
                  </option>

                  <option value="120">
                    120 minutos
                  </option>
                </select>
              </label>

              <label>
                <span>Estado inicial</span>

                <select
                  value={nuevaCita.estado}
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        estado:
                          evento.target
                            .value
                      })
                    )
                  }
                >
                  <option value="pendiente">
                    Pendiente
                  </option>

                  <option value="confirmada">
                    Confirmada
                  </option>
                </select>
              </label>

              <label className="full">
                <span>
                  Servicio o motivo *
                </span>

                <input
                  type="text"
                  value={nuevaCita.motivo}
                  placeholder="Ejemplo: Limpieza dental"
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        motivo:
                          evento.target
                            .value
                      })
                    )
                  }
                  required
                />
              </label>

              <label className="full">
                <span>Observaciones</span>

                <textarea
                  value={
                    nuevaCita.observaciones
                  }
                  placeholder="Información adicional para la atención..."
                  onChange={(evento) =>
                    setNuevaCita(
                      (anterior) => ({
                        ...anterior,
                        observaciones:
                          evento.target
                            .value
                      })
                    )
                  }
                />
              </label>

              <footer>
                <button
                  type="button"
                  className="secondary"
                  onClick={cerrarModal}
                  disabled={procesando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary"
                  disabled={procesando}
                >
                  {procesando
                    ? 'Registrando...'
                    : 'Registrar cita'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DETALLE */}

      {modal === 'detalle' &&
        citaSeleccionada && (
          <div className="appointment-modal-overlay">
            <section className="appointment-modal detail">
              <header>
                <div>
                  <span>Información de cita</span>
                  <h2>Detalle de atención</h2>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
                >
                  <IconoCerrar />
                </button>
              </header>

              <div className="appointment-detail-content">
                <section className="appointment-detail-person">
                  <span>
                    {obtenerIniciales(
                      obtenerNombrePaciente(
                        citaSeleccionada
                      )
                    )}
                  </span>

                  <div>
                    <h3>
                      {obtenerNombrePaciente(
                        citaSeleccionada
                      )}
                    </h3>

                    <p>
                      CI:{' '}
                      {citaSeleccionada
                        .pacienteId?.ci ||
                        'Sin registro'}
                    </p>

                    <span
                      className={`appointment-status ${citaSeleccionada.estado}`}
                    >
                      {etiquetaEstado(
                        citaSeleccionada.estado
                      )}
                    </span>
                  </div>
                </section>

                <section className="appointment-detail-grid">
                  <article>
                    <span>Fecha</span>
                    <strong>
                      {formatearFechaVisible(
                        citaSeleccionada.fecha
                      )}
                    </strong>
                  </article>

                  <article>
                    <span>Hora</span>
                    <strong>
                      {citaSeleccionada.hora}
                    </strong>
                  </article>

                  <article>
                    <span>Duración</span>
                    <strong>
                      {citaSeleccionada
                        .duracionMinutos ||
                        30}{' '}
                      minutos
                    </strong>
                  </article>

                  <article>
                    <span>Odontólogo</span>
                    <strong>
                      {obtenerNombreOdontologo(
                        citaSeleccionada
                      )}
                    </strong>
                  </article>

                  <article>
                    <span>Servicio</span>
                    <strong>
                      {
                        citaSeleccionada.motivo
                      }
                    </strong>
                  </article>

                  <article>
                    <span>Origen</span>
                    <strong>
                      {etiquetaOrigen(
                        citaSeleccionada.origen
                      )}
                    </strong>
                  </article>
                </section>

                <section className="appointment-detail-note">
                  <h4>Observaciones</h4>

                  <p>
                    {citaSeleccionada
                      .observaciones ||
                      'Sin observaciones registradas.'}
                  </p>
                </section>

                {citaSeleccionada.estado ===
                  'cancelado' && (
                  <section className="appointment-cancel-note">
                    <h4>
                      Motivo de cancelación
                    </h4>

                    <p>
                      {citaSeleccionada
                        .motivoCancelacion ||
                        'No se registró un motivo.'}
                    </p>
                  </section>
                )}

                {citaSeleccionada
                  .reprogramaciones?.length >
                  0 && (
                  <section className="appointment-reschedule-history">
                    <h4>
                      Historial de reprogramaciones
                    </h4>

                    {citaSeleccionada.reprogramaciones.map(
                      (
                        reprogramacionItem,
                        indice
                      ) => (
                        <article key={indice}>
                          <strong>
                            {formatearFechaVisible(
                              reprogramacionItem.fechaAnterior
                            )}{' '}
                            ·{' '}
                            {
                              reprogramacionItem.horaAnterior
                            }
                          </strong>

                          <span>→</span>

                          <strong>
                            {formatearFechaVisible(
                              reprogramacionItem.fechaNueva
                            )}{' '}
                            ·{' '}
                            {
                              reprogramacionItem.horaNueva
                            }
                          </strong>
                        </article>
                      )
                    )}
                  </section>
                )}
              </div>
            </section>
          </div>
        )}

      {/* MODAL REPROGRAMAR */}

      {modal === 'reprogramar' &&
        citaSeleccionada && (
          <div className="appointment-modal-overlay">
            <section className="appointment-modal small">
              <header>
                <div>
                  <span>Cambio de agenda</span>
                  <h2>Reprogramar cita</h2>
                  <p>
                    Registra la nueva fecha, hora y
                    motivo del cambio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
                >
                  <IconoCerrar />
                </button>
              </header>

              <form
                onSubmit={
                  guardarReprogramacion
                }
              >
                <label>
                  <span>Nueva fecha *</span>

                  <input
                    type="date"
                    value={
                      reprogramacion.fecha
                    }
                    onChange={(evento) =>
                      setReprogramacion(
                        (anterior) => ({
                          ...anterior,
                          fecha:
                            evento.target
                              .value
                        })
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>Nueva hora *</span>

                  <input
                    type="time"
                    value={
                      reprogramacion.hora
                    }
                    onChange={(evento) =>
                      setReprogramacion(
                        (anterior) => ({
                          ...anterior,
                          hora:
                            evento.target
                              .value
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="full">
                  <span>Odontólogo *</span>

                  <select
                    value={
                      reprogramacion
                        .odontologoId
                    }
                    onChange={(evento) =>
                      setReprogramacion(
                        (anterior) => ({
                          ...anterior,
                          odontologoId:
                            evento.target
                              .value
                        })
                      )
                    }
                    required
                  >
                    <option value="">
                      Seleccionar
                    </option>

                    {odontologos.map(
                      (odontologo) => (
                        <option
                          key={odontologo._id}
                          value={
                            odontologo._id
                          }
                        >
                          {odontologo.nombre}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="full">
                  <span>
                    Motivo de reprogramación
                  </span>

                  <textarea
                    value={
                      reprogramacion
                        .motivoReprogramacion
                    }
                    onChange={(evento) =>
                      setReprogramacion(
                        (anterior) => ({
                          ...anterior,
                          motivoReprogramacion:
                            evento.target
                              .value
                        })
                      )
                    }
                    placeholder="Ejemplo: Solicitud del paciente"
                  />
                </label>

                <footer>
                  <button
                    type="button"
                    className="secondary"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={procesando}
                  >
                    {procesando
                      ? 'Guardando...'
                      : 'Reprogramar'}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}

      {/* MODAL CANCELAR */}

      {modal === 'cancelar' &&
        citaSeleccionada && (
          <div className="appointment-modal-overlay">
            <section className="appointment-modal small">
              <header>
                <div>
                  <span>Cancelación</span>
                  <h2>Cancelar cita</h2>
                  <p>
                    La cita permanecerá en el
                    historial clínico.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
                >
                  <IconoCerrar />
                </button>
              </header>

              <form
                onSubmit={guardarCancelacion}
              >
                <div className="appointment-warning full">
                  <IconoAdvertencia />

                  <p>
                    Estás cancelando la cita de{' '}
                    <strong>
                      {obtenerNombrePaciente(
                        citaSeleccionada
                      )}
                    </strong>
                    .
                  </p>
                </div>

                <label className="full">
                  <span>
                    Motivo de cancelación *
                  </span>

                  <textarea
                    value={motivoCancelacion}
                    onChange={(evento) =>
                      setMotivoCancelacion(
                        evento.target.value
                      )
                    }
                    required
                  />
                </label>

                <footer>
                  <button
                    type="button"
                    className="secondary"
                    onClick={cerrarModal}
                  >
                    Volver
                  </button>

                  <button
                    type="submit"
                    className="danger"
                    disabled={procesando}
                  >
                    {procesando
                      ? 'Cancelando...'
                      : 'Cancelar cita'}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}

      {/* MODAL CONFIRMAR SOLICITUD */}

      {modal === 'confirmar-solicitud' &&
        solicitudSeleccionada && (
          <div className="appointment-modal-overlay">
            <section className="appointment-modal request-conversion-modal">
              <header>
                <div>
                  <span>
                    Solicitud del portal
                  </span>

                  <h2>
                    Convertir en cita
                  </h2>

                  <p>
                    Vincula a una persona registrada o
                    crea su ficha sin perder los datos
                    enviados desde el portal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={
                    procesando ||
                    registrandoPacienteSolicitud
                  }
                >
                  <IconoCerrar />
                </button>
              </header>

              <div className="request-conversion-content">
                <div className="request-summary request-summary-expanded">
                  <div>
                    <strong>
                      {
                        solicitudSeleccionada.nombreCompleto
                      }
                    </strong>

                    <span>
                      {
                        solicitudSeleccionada.servicio
                      }
                    </span>

                    <small>
                      {formatearFechaVisible(
                        solicitudSeleccionada.fecha
                      )}{' '}
                      ·{' '}
                      {
                        solicitudSeleccionada.hora
                      }
                    </small>
                  </div>

                  <div className="request-contact-data">
                    <small>
                      Teléfono
                    </small>

                    <strong>
                      {
                        solicitudSeleccionada.telefono
                      }
                    </strong>

                    <small>
                      Correo
                    </small>

                    <strong>
                      {
                        solicitudSeleccionada.email ||
                        'Sin correo'
                      }
                    </strong>
                  </div>
                </div>

                {mensajeSolicitudModal && (
                  <div className="request-inline-message success">
                    <IconoCheck />
                    <span>
                      {mensajeSolicitudModal}
                    </span>
                  </div>
                )}

                {errorSolicitudModal && (
                  <div className="request-inline-message error">
                    <IconoAdvertencia />
                    <span>
                      {errorSolicitudModal}
                    </span>
                  </div>
                )}

                <div className="request-patient-mode">
                  <button
                    type="button"
                    className={
                      modoPacienteSolicitud ===
                      'existente'
                        ? 'active'
                        : ''
                    }
                    onClick={() => {
                      setModoPacienteSolicitud(
                        'existente'
                      );
                      setErrorSolicitudModal('');
                    }}
                  >
                    Paciente existente
                  </button>

                  <button
                    type="button"
                    className={
                      modoPacienteSolicitud ===
                      'nuevo'
                        ? 'active'
                        : ''
                    }
                    onClick={() => {
                      setModoPacienteSolicitud(
                        'nuevo'
                      );
                      setErrorSolicitudModal('');
                    }}
                  >
                    Registrar nuevo paciente
                  </button>
                </div>

                {modoPacienteSolicitud ===
                'nuevo' ? (
                  <section className="request-new-patient-panel">
                    <div className="request-step-heading">
                      <span>Paso 1</span>

                      <div>
                        <h3>
                          Registrar ficha del paciente
                        </h3>

                        <p>
                          Los datos disponibles fueron
                          precargados desde la solicitud.
                          Revisa el nombre y completa la
                          información faltante.
                        </p>
                      </div>
                    </div>

                    <div className="request-patient-form">
                      <label>
                        <span>Nombre *</span>

                        <input
                          type="text"
                          value={
                            pacienteSolicitud.nombre
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'nombre',
                              evento.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>Apellido *</span>

                        <input
                          type="text"
                          value={
                            pacienteSolicitud.apellido
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'apellido',
                              evento.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>CI *</span>

                        <input
                          type="text"
                          value={
                            pacienteSolicitud.ci
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'ci',
                              evento.target.value
                            )
                          }
                          placeholder="Carnet de identidad"
                        />
                      </label>

                      <label>
                        <span>Teléfono</span>

                        <input
                          type="text"
                          value={
                            pacienteSolicitud.telefono
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'telefono',
                              evento.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>Correo</span>

                        <input
                          type="email"
                          value={
                            pacienteSolicitud.email
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'email',
                              evento.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Fecha de nacimiento
                        </span>

                        <input
                          type="date"
                          value={
                            pacienteSolicitud
                              .fechaNacimiento
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'fechaNacimiento',
                              evento.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>Sexo</span>

                        <select
                          value={
                            pacienteSolicitud.sexo
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'sexo',
                              evento.target.value
                            )
                          }
                        >
                          <option value="">
                            Seleccionar
                          </option>

                          <option value="Masculino">
                            Masculino
                          </option>

                          <option value="Femenino">
                            Femenino
                          </option>

                          <option value="Otro">
                            Otro
                          </option>
                        </select>
                      </label>

                      <label>
                        <span>Dirección</span>

                        <input
                          type="text"
                          value={
                            pacienteSolicitud.direccion
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'direccion',
                              evento.target.value
                            )
                          }
                        />
                      </label>

                      <label className="request-access-option">
                        <input
                          type="checkbox"
                          checked={
                            pacienteSolicitud
                              .crearAccesoPortal
                          }
                          onChange={(evento) =>
                            cambiarPacienteSolicitud(
                              'crearAccesoPortal',
                              evento.target.checked
                            )
                          }
                        />

                        <span>
                          Crear también acceso al portal
                          del paciente
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      className="request-register-patient"
                      onClick={
                        registrarPacienteDesdeSolicitud
                      }
                      disabled={
                        registrandoPacienteSolicitud ||
                        procesando
                      }
                    >
                      <IconoAgregar />

                      {registrandoPacienteSolicitud
                        ? 'Registrando paciente...'
                        : 'Registrar paciente y continuar'}
                    </button>
                  </section>
                ) : (
                  <form
                    className="request-confirmation-form"
                    onSubmit={
                      guardarConfirmacionSolicitud
                    }
                  >
                    <div className="request-step-heading full">
                      <span>Paso 1</span>

                      <div>
                        <h3>
                          Vincular paciente
                        </h3>

                        <p>
                          Selecciona una ficha existente.
                          Si la persona es nueva, utiliza
                          la opción “Registrar nuevo
                          paciente”.
                        </p>
                      </div>
                    </div>

                    <label className="full">
                      <span>Paciente *</span>

                      <select
                        value={
                          confirmacionSolicitud
                            .pacienteId
                        }
                        onChange={(evento) =>
                          setConfirmacionSolicitud(
                            (anterior) => ({
                              ...anterior,
                              pacienteId:
                                evento.target.value
                            })
                          )
                        }
                        required
                      >
                        <option value="">
                          Seleccionar paciente
                        </option>

                        {pacientes
                          .filter(
                            (paciente) =>
                              paciente.estado !==
                              false
                          )
                          .map((paciente) => (
                            <option
                              key={paciente._id}
                              value={
                                paciente._id
                              }
                            >
                              {paciente.nombre}{' '}
                              {paciente.apellido} ·
                              CI: {paciente.ci}
                            </option>
                          ))}
                      </select>
                    </label>

                    <div className="request-step-heading full second">
                      <span>Paso 2</span>

                      <div>
                        <h3>
                          Asignar atención
                        </h3>

                        <p>
                          Selecciona al odontólogo y la
                          duración estimada.
                        </p>
                      </div>
                    </div>

                    <label>
                      <span>Odontólogo *</span>

                      <select
                        value={
                          confirmacionSolicitud
                            .odontologoId
                        }
                        onChange={(evento) =>
                          setConfirmacionSolicitud(
                            (anterior) => ({
                              ...anterior,
                              odontologoId:
                                evento.target.value
                            })
                          )
                        }
                        required
                      >
                        <option value="">
                          Seleccionar odontólogo
                        </option>

                        {odontologos
                          .filter(
                            (odontologo) =>
                              odontologo.estado !==
                              false
                          )
                          .map((odontologo) => (
                            <option
                              key={odontologo._id}
                              value={
                                odontologo._id
                              }
                            >
                              {odontologo.nombre}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      <span>Duración</span>

                      <select
                        value={
                          confirmacionSolicitud
                            .duracionMinutos
                        }
                        onChange={(evento) =>
                          setConfirmacionSolicitud(
                            (anterior) => ({
                              ...anterior,
                              duracionMinutos:
                                evento.target.value
                            })
                          )
                        }
                      >
                        <option value="30">
                          30 minutos
                        </option>

                        <option value="45">
                          45 minutos
                        </option>

                        <option value="60">
                          60 minutos
                        </option>

                        <option value="90">
                          90 minutos
                        </option>
                      </select>
                    </label>

                    <footer>
                      <button
                        type="button"
                        className="secondary"
                        onClick={cerrarModal}
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="primary"
                        disabled={
                          procesando ||
                          !confirmacionSolicitud
                            .pacienteId ||
                          !confirmacionSolicitud
                            .odontologoId
                        }
                      >
                        {procesando
                          ? 'Creando cita...'
                          : 'Confirmar y crear cita'}
                      </button>
                    </footer>
                  </form>
                )}
              </div>
            </section>
          </div>
        )}

      {/* MODAL RECHAZAR SOLICITUD */}

      {modal === 'rechazar-solicitud' &&
        solicitudSeleccionada && (
          <div className="appointment-modal-overlay">
            <section className="appointment-modal small">
              <header>
                <div>
                  <span>
                    Solicitud del portal
                  </span>

                  <h2>Rechazar solicitud</h2>

                  <p>
                    La solicitud permanecerá en el
                    historial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
                >
                  <IconoCerrar />
                </button>
              </header>

              <form
                onSubmit={
                  guardarRechazoSolicitud
                }
              >
                <label className="full">
                  <span>
                    Motivo del rechazo *
                  </span>

                  <textarea
                    value={motivoRechazo}
                    onChange={(evento) =>
                      setMotivoRechazo(
                        evento.target.value
                      )
                    }
                    required
                  />
                </label>

                <footer>
                  <button
                    type="button"
                    className="secondary"
                    onClick={cerrarModal}
                  >
                    Volver
                  </button>

                  <button
                    type="submit"
                    className="danger"
                    disabled={procesando}
                  >
                    {procesando
                      ? 'Procesando...'
                      : 'Rechazar solicitud'}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}
    </main>
  );
};

export default Citas;