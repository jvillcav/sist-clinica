import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useLocation,
  useNavigate
} from 'react-router-dom';

import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { normalizarTexto } from '../../utils/texto';
import '../../styles/admin/pacientesAdmin.css';

/* =====================================================
   ICONOS
===================================================== */

const IconoPacientes = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8" cy="8" r="4" />
    <circle cx="17" cy="9" r="3" />
    <path d="M2 21c0-4.6 2.7-7 6-7s6 2.4 6 7" />
    <path d="M14 15c4 0 7 2 7 6" />
  </svg>
);

const IconoActivo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const IconoInactivo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 8 8 8" />
  </svg>
);

const IconoPortal = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 7h8M8 11h8M8 15h4" />
  </svg>
);

const IconoCalendario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
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

const IconoEditar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
  </svg>
);

const IconoEstado = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v9" />
    <path d="M7 5a8 8 0 1 0 10 0" />
  </svg>
);

const IconoEliminar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8" />
    <path d="M6 7l1 14h10l1-14" />
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

/* =====================================================
   CONFIGURACIÓN
===================================================== */

const formularioInicial = {
  nombre: '',
  apellido: '',
  ci: '',
  telefono: '',
  direccion: '',
  email: '',
  fechaNacimiento: '',
  sexo: '',
  tipoSangre: '',
  alergias: '',
  condicionesCronicas: '',

  contactoEmergencia: {
    nombre: '',
    telefono: '',
    parentesco: ''
  },

  estado: true,
  crearAccesoPortal: false
};

const tiposSangre = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-'
];

/* =====================================================
   UTILIDADES
===================================================== */

const obtenerUsuarioLocal = () => {
  try {
    return JSON.parse(
      localStorage.getItem('usuario')
    );
  } catch {
    return null;
  }
};

const obtenerIniciales = (
  nombre = '',
  apellido = ''
) => {
  return `${nombre?.[0] || ''}${
    apellido?.[0] || ''
  }`.toUpperCase() || 'PA';
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return 'Sin registro';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return 'Sin registro';
  }

  return valor.toLocaleDateString(
    'es-BO',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );
};

const formatearFechaInput = (fecha) => {
  if (!fecha) {
    return '';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  return valor
    .toISOString()
    .slice(0, 10);
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) {
    return null;
  }

  const nacimiento =
    new Date(fechaNacimiento);

  if (
    Number.isNaN(
      nacimiento.getTime()
    )
  ) {
    return null;
  }

  const hoy = new Date();

  let edad =
    hoy.getFullYear() -
    nacimiento.getFullYear();

  const diferenciaMes =
    hoy.getMonth() -
    nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (
      diferenciaMes === 0 &&
      hoy.getDate() <
        nacimiento.getDate()
    )
  ) {
    edad -= 1;
  }

  return edad;
};

const listaATexto = (lista) => {
  return Array.isArray(lista)
    ? lista.join(', ')
    : '';
};

/* =====================================================
   COMPONENTE
===================================================== */

const Pacientes = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const usuarioSesion = useMemo(
    () => obtenerUsuarioLocal(),
    []
  );

  const rolActual =
    usuarioSesion?.rol || '';

  const esAdministrador =
    rolActual === 'administrador';

  const esRecepcionista =
    rolActual === 'recepcionista';

  const esOdontologo =
    rolActual === 'odontologo';

  const puedeRegistrar =
    esAdministrador ||
    esRecepcionista;

  const puedeEditar =
    esAdministrador ||
    esRecepcionista;

  const [pacientes, setPacientes] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState('todos');

  const [filtroAcceso, setFiltroAcceso] =
    useState('todos');

  const [paginaActual, setPaginaActual] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(10);

  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false);

  const [
    pacienteEditando,
    setPacienteEditando
  ] = useState(null);

  const [
    pacienteSeleccionado,
    setPacienteSeleccionado
  ] = useState(null);

  const [
    estadisticasSeleccionadas,
    setEstadisticasSeleccionadas
  ] = useState(null);

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [
    cargandoDetalle,
    setCargandoDetalle
  ] = useState(false);

  const [
    pacienteProcesando,
    setPacienteProcesando
  ] = useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  useEffect(() => {
    obtenerPacientes();
  }, []);

  /* ===================================================
     CONSULTAS
  =================================================== */

  const obtenerPacientes = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get(
        '/pacientes',
        {
          params: {
            sinPaginar: true
          }
        }
      );

      setPacientes(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (errorPeticion) {
      console.error(
        'Error al obtener pacientes:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudieron cargar los pacientes.'
      );
    } finally {
      setCargando(false);
    }
  };

  const abrirDetalle = async (
    paciente
  ) => {
    try {
      setCargandoDetalle(true);
      setError('');

      const { data } = await api.get(
        `/pacientes/${paciente._id}`
      );

      setPacienteSeleccionado(
        data.paciente
      );

      setEstadisticasSeleccionadas(
        data.estadisticas
      );
    } catch (errorPeticion) {
      console.error(
        'Error al obtener paciente:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudo consultar el paciente.'
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  /* ===================================================
     FILTROS Y RESUMEN
  =================================================== */

  const pacientesFiltrados =
    useMemo(() => {
      const texto =
        normalizarTexto(busqueda);

      return pacientes.filter(
        (paciente) => {
          const coincideBusqueda =
            !texto ||
            normalizarTexto(
              `${
                paciente.nombre || ''
              } ${
                paciente.apellido || ''
              } ${
                paciente.ci || ''
              }`
            ).includes(texto);

          const coincideEstado =
            filtroEstado === 'todos' ||
            (
              filtroEstado ===
                'activo' &&
              paciente.estado !== false
            ) ||
            (
              filtroEstado ===
                'inactivo' &&
              paciente.estado === false
            );

          const tieneAcceso =
            Boolean(
              paciente.usuarioId
            );

          const coincideAcceso =
            filtroAcceso === 'todos' ||
            (
              filtroAcceso ===
                'con-acceso' &&
              tieneAcceso
            ) ||
            (
              filtroAcceso ===
                'sin-acceso' &&
              !tieneAcceso
            );

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideAcceso
          );
        }
      );
    }, [
      pacientes,
      busqueda,
      filtroEstado,
      filtroAcceso
    ]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado, filtroAcceso]);

  const pacientesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * tamanoPagina;
    return pacientesFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [pacientesFiltrados, paginaActual, tamanoPagina]);

  const resumen = useMemo(() => {
    const ahora = new Date();

    return {
      total: pacientes.length,

      activos: pacientes.filter(
        (paciente) =>
          paciente.estado !== false
      ).length,

      inactivos: pacientes.filter(
        (paciente) =>
          paciente.estado === false
      ).length,

      conAcceso: pacientes.filter(
        (paciente) =>
          Boolean(paciente.usuarioId)
      ).length,

      sinAcceso: pacientes.filter(
        (paciente) =>
          !paciente.usuarioId
      ).length,

      nuevosMes: pacientes.filter(
        (paciente) => {
          const fecha =
            new Date(
              paciente.fechaRegistro ||
                paciente.createdAt
            );

          return (
            !Number.isNaN(
              fecha.getTime()
            ) &&
            fecha.getMonth() ===
              ahora.getMonth() &&
            fecha.getFullYear() ===
              ahora.getFullYear()
          );
        }
      ).length
    };
  }, [pacientes]);

  /* ===================================================
     FORMULARIO
  =================================================== */

  const limpiarMensajes = () => {
    setMensaje('');
    setError('');
  };

  const abrirNuevoPaciente = () => {
    limpiarMensajes();

    setPacienteEditando(null);
    setFormulario(formularioInicial);
    setMostrarFormulario(true);
  };

  const abrirEditarPaciente = (
    paciente
  ) => {
    limpiarMensajes();

    setPacienteEditando(paciente);

    setFormulario({
      nombre:
        paciente.nombre || '',

      apellido:
        paciente.apellido || '',

      ci:
        paciente.ci || '',

      telefono:
        paciente.telefono || '',

      direccion:
        paciente.direccion || '',

      email:
        paciente.email || '',

      fechaNacimiento:
        formatearFechaInput(
          paciente.fechaNacimiento
        ),

      sexo:
        paciente.sexo || '',

      tipoSangre:
        paciente.tipoSangre || '',

      alergias:
        listaATexto(
          paciente.alergias
        ),

      condicionesCronicas:
        listaATexto(
          paciente.condicionesCronicas
        ),

      contactoEmergencia: {
        nombre:
          paciente
            .contactoEmergencia
            ?.nombre || '',

        telefono:
          paciente
            .contactoEmergencia
            ?.telefono || '',

        parentesco:
          paciente
            .contactoEmergencia
            ?.parentesco || ''
      },

      estado:
        paciente.estado !== false,

      crearAccesoPortal: false
    });

    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setPacienteEditando(null);
    setFormulario(formularioInicial);
    limpiarMensajes();
  };

  const cambiarFormulario = (
    campo,
    valor
  ) => {
    setMensaje('');
    setError('');

    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  };

  const cambiarContacto = (
    campo,
    valor
  ) => {
    setMensaje('');
    setError('');

    setFormulario((anterior) => ({
      ...anterior,

      contactoEmergencia: {
        ...anterior.contactoEmergencia,
        [campo]: valor
      }
    }));
  };

  const guardarPaciente = async (
    evento
  ) => {
    evento.preventDefault();

    limpiarMensajes();

    if (
      !formulario.nombre.trim()
    ) {
      setError(
        'El nombre es obligatorio.'
      );
      return;
    }

    if (
      !formulario.apellido.trim()
    ) {
      setError(
        'El apellido es obligatorio.'
      );
      return;
    }

    if (!formulario.ci.trim()) {
      setError(
        'El carnet de identidad es obligatorio.'
      );
      return;
    }

    if (
      !pacienteEditando &&
      formulario.crearAccesoPortal &&
      !formulario.email.trim()
    ) {
      setError(
        'Debes registrar un correo para crear el acceso al portal.'
      );
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        nombre:
          formulario.nombre.trim(),

        apellido:
          formulario.apellido.trim(),

        ci:
          formulario.ci.trim(),

        telefono:
          formulario.telefono.trim(),

        direccion:
          formulario.direccion.trim(),

        email:
          formulario.email.trim(),

        fechaNacimiento:
          formulario.fechaNacimiento ||
          null,

        sexo:
          formulario.sexo,

        tipoSangre:
          formulario.tipoSangre,

        alergias:
          formulario.alergias,

        condicionesCronicas:
          formulario
            .condicionesCronicas,

        contactoEmergencia:
          formulario.contactoEmergencia,

        estado:
          formulario.estado
      };

      let respuesta;

      if (pacienteEditando) {
        respuesta = await api.put(
          `/pacientes/${pacienteEditando._id}`,
          payload
        );
      } else {
        respuesta = await api.post(
          '/pacientes',
          {
            ...payload,

            crearAccesoPortal:
              formulario
                .crearAccesoPortal
          }
        );
      }

      const mensajeRespuesta =
        respuesta.data?.mensaje ||
        (
          pacienteEditando
            ? 'Paciente actualizado correctamente.'
            : 'Paciente registrado correctamente.'
        );

      setMensaje(mensajeRespuesta);

      if (pacienteEditando) {
        const pacienteActualizado =
          respuesta.data?.paciente || {
            ...pacienteEditando,
            ...payload
          };

        setPacientes((anteriores) =>
          anteriores.map((paciente) =>
            paciente._id === pacienteEditando._id
              ? pacienteActualizado
              : paciente
          )
        );

        setPacienteEditando(
          pacienteActualizado
        );

        return;
      }

      setMostrarFormulario(false);
      setPacienteEditando(null);
      setFormulario(formularioInicial);

      await obtenerPacientes();
    } catch (errorPeticion) {
      console.error(
        'Error al guardar paciente:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data
          ?.mensaje ||
          'No se pudo guardar el paciente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  /* ===================================================
     ESTADO DEL PACIENTE
  =================================================== */

  const cambiarEstadoPaciente =
    async (paciente) => {
      limpiarMensajes();

      const nuevoEstado =
        paciente.estado === false;

      const accion = nuevoEstado
        ? 'activar'
        : 'inactivar';

      const confirmar =
        window.confirm(
          `¿Confirmas que deseas ${accion} a ${paciente.nombre} ${paciente.apellido}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setPacienteProcesando(
          paciente._id
        );

        const { data } =
          await api.put(
            `/pacientes/${paciente._id}`,
            {
              estado: nuevoEstado
            }
          );

        setMensaje(
          data?.mensaje ||
            'Estado actualizado correctamente.'
        );

        await obtenerPacientes();
      } catch (errorPeticion) {
        console.error(
          'Error al cambiar estado:',
          errorPeticion
        );

        setError(
          errorPeticion.response?.data
            ?.mensaje ||
            'No se pudo actualizar el estado.'
        );
      } finally {
        setPacienteProcesando('');
      }
    };

  /* ===================================================
     ACCESO AL PORTAL
  =================================================== */

  const crearAccesoPortal =
    async (paciente) => {
      limpiarMensajes();

      let email =
        paciente.email || '';

      if (!email) {
        email =
          window.prompt(
            'Introduce el correo que utilizará el paciente para iniciar sesión:'
          ) || '';
      }

      if (!email.trim()) {
        return;
      }

      const confirmar =
        window.confirm(
          `Se creará una cuenta para ${paciente.nombre} ${paciente.apellido}. La contraseña inicial será su CI. ¿Continuar?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setPacienteProcesando(
          paciente._id
        );

        const { data } =
          await api.post(
            `/pacientes/${paciente._id}/acceso`,
            {
              email: email.trim()
            }
          );

        setMensaje(
          data?.mensaje ||
            'Acceso creado correctamente.'
        );

        await obtenerPacientes();
      } catch (errorPeticion) {
        console.error(
          'Error al crear acceso:',
          errorPeticion
        );

        setError(
          errorPeticion.response?.data
            ?.mensaje ||
            'No se pudo crear el acceso.'
        );
      } finally {
        setPacienteProcesando('');
      }
    };

  const cambiarEstadoAcceso =
    async (paciente) => {
      const cuenta =
        paciente.usuarioId;

      if (!cuenta) {
        return;
      }

      limpiarMensajes();

      const estadoActual =
        cuenta.estado !== false;

      const nuevoEstado =
        !estadoActual;

      const confirmar =
        window.confirm(
          `¿Deseas ${
            nuevoEstado
              ? 'activar'
              : 'desactivar'
          } el acceso al portal de ${paciente.nombre}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setPacienteProcesando(
          paciente._id
        );

        const { data } =
          await api.put(
            `/pacientes/${paciente._id}/acceso/estado`,
            {
              estado: nuevoEstado
            }
          );

        setMensaje(
          data?.mensaje ||
            'Acceso actualizado correctamente.'
        );

        await obtenerPacientes();
      } catch (errorPeticion) {
        console.error(
          'Error al cambiar acceso:',
          errorPeticion
        );

        setError(
          errorPeticion.response?.data
            ?.mensaje ||
            'No se pudo cambiar el acceso.'
        );
      } finally {
        setPacienteProcesando('');
      }
    };

  /* ===================================================
     ELIMINAR
  =================================================== */

  const eliminarPaciente =
    async (paciente) => {
      limpiarMensajes();

      const confirmar =
        window.confirm(
          `Esta acción intentará eliminar definitivamente a ${paciente.nombre} ${paciente.apellido}. Si tiene citas o expedientes, el sistema rechazará la eliminación. ¿Continuar?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setPacienteProcesando(
          paciente._id
        );

        const { data } =
          await api.delete(
            `/pacientes/${paciente._id}`
          );

        setMensaje(
          data?.mensaje ||
            'Paciente eliminado correctamente.'
        );

        await obtenerPacientes();
      } catch (errorPeticion) {
        console.error(
          'Error al eliminar paciente:',
          errorPeticion
        );

        setError(
          errorPeticion.response?.data
            ?.mensaje ||
            'No se pudo eliminar el paciente.'
        );
      } finally {
        setPacienteProcesando('');
      }
    };

  /* ===================================================
     NAVEGACIÓN SEGÚN ROL
  =================================================== */

  const abrirExpediente = (
    paciente
  ) => {
    if (esOdontologo) {
      navigate(
        `/odontologo/pacientes?paciente=${paciente._id}`
      );

      return;
    }

    navigate(
      `/expedientes?paciente=${paciente._id}`
    );
  };

  const abrirCitas = (
    paciente
  ) => {
    const ruta = esRecepcionista
      ? '/recepcionista/citas'
      : '/citas';

    navigate(
      `${ruta}?paciente=${paciente._id}`
    );
  };

  /* ===================================================
     CARGA
  =================================================== */

  if (cargando) {
    return (
      <section className="admin-patients-loading">
        <div className="admin-patients-spinner" />

        <h2>
          Cargando pacientes
        </h2>

        <p>
          Consultando fichas, estados y accesos.
        </p>
      </section>
    );
  }

  return (
    <main className="admin-patients-page">
      <header className="admin-patients-header">
        <div>
          <span className="admin-patients-eyebrow">
            Gestión asistencial
          </span>

          <h1>Pacientes</h1>

          <p>
            Administra la información personal,
            clínica básica y el acceso al portal.
          </p>
        </div>

        <div className="admin-patients-header-actions">
          <button
            type="button"
            className="patients-refresh"
            onClick={obtenerPacientes}
          >
            <IconoActualizar />
            Actualizar
          </button>

          {puedeRegistrar && (
            <button
              type="button"
              className="patients-new"
              onClick={abrirNuevoPaciente}
            >
              <IconoAgregar />
              Nuevo paciente
            </button>
          )}
        </div>
      </header>

      {mensaje && !mostrarFormulario && (
        <div className="admin-patients-message success">
          <IconoCheck />
          <span>{mensaje}</span>
        </div>
      )}

      {error && !mostrarFormulario && (
        <div className="admin-patients-message error">
          <IconoAdvertencia />
          <span>{error}</span>
        </div>
      )}

      <section className="admin-patients-summary">
        <article className="total">
          <div>
            <span>Total pacientes</span>
            <strong>{resumen.total}</strong>
          </div>

          <IconoPacientes />
        </article>

        <article className="active">
          <div>
            <span>Pacientes activos</span>
            <strong>{resumen.activos}</strong>
          </div>

          <IconoActivo />
        </article>

        <article className="new">
          <div>
            <span>Nuevos este mes</span>
            <strong>
              {resumen.nuevosMes}
            </strong>
          </div>

          <IconoCalendario />
        </article>

        <article className="portal">
          <div>
            <span>Con acceso</span>
            <strong>
              {resumen.conAcceso}
            </strong>
          </div>

          <IconoPortal />
        </article>

        <article className="without-access">
          <div>
            <span>Sin acceso</span>
            <strong>
              {resumen.sinAcceso}
            </strong>
          </div>

          <IconoPacientes />
        </article>

        <article className="inactive">
          <div>
            <span>Inactivos</span>
            <strong>
              {resumen.inactivos}
            </strong>
          </div>

          <IconoInactivo />
        </article>
      </section>

      <section className="admin-patients-toolbar">
        <label className="admin-patients-search">
          <span>Buscar paciente</span>

          <div>
            <IconoBuscar />

            <input
              type="search"
              value={busqueda}
              placeholder="Nombre, apellido o carnet..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
            />
          </div>
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
              Todos los estados
            </option>

            <option value="activo">
              Activos
            </option>

            <option value="inactivo">
              Inactivos
            </option>
          </select>
        </label>

        <label>
          <span>Acceso al portal</span>

          <select
            value={filtroAcceso}
            onChange={(evento) =>
              setFiltroAcceso(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos los accesos
            </option>

            <option value="con-acceso">
              Con acceso
            </option>

            <option value="sin-acceso">
              Sin acceso
            </option>
          </select>
        </label>
      </section>

      <section className="admin-patients-table-card">
        <header>
          <div>
            <h2>
              Listado de pacientes
            </h2>

            <p>
              {pacientesFiltrados.length}{' '}
              {pacientesFiltrados.length === 1
                ? 'paciente encontrado'
                : 'pacientes encontrados'}
            </p>
          </div>
        </header>

        {pacientesFiltrados.length > 0 ? (
          <div className="admin-patients-table-wrapper">
            <table className="admin-patients-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>CI / género</th>
                  <th>Contacto</th>
                  <th>Grupo sanguíneo</th>
                  <th>Acceso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pacientesPaginados.map(
                  (paciente) => {
                    const procesando =
                      pacienteProcesando ===
                      paciente._id;

                    const acceso =
                      paciente.usuarioId;

                    return (
                      <tr key={paciente._id}>
                        <td>
                          <div className="admin-patient-identity">
                            <span>
                              {obtenerIniciales(
                                paciente.nombre,
                                paciente.apellido
                              )}
                            </span>

                            <div>
                              <strong>
                                {paciente.nombre}{' '}
                                {paciente.apellido}
                              </strong>

                              <small>
                                Registrado:{' '}
                                {formatearFecha(
                                  paciente.fechaRegistro ||
                                    paciente.createdAt
                                )}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong className="patient-ci">
                            {paciente.ci}
                          </strong>

                          <small className="patient-secondary">
                            {paciente.sexo ||
                              'Sin género registrado'}
                          </small>
                        </td>

                        <td>
                          <strong className="patient-contact">
                            {paciente.telefono ||
                              'Sin teléfono'}
                          </strong>

                          <small className="patient-secondary">
                            {paciente.email ||
                              'Sin correo'}
                          </small>
                        </td>

                        <td>
                          <span className="patient-blood">
                            {paciente.tipoSangre ||
                              'Sin registro'}
                          </span>
                        </td>

                        <td>
                          {acceso ? (
                            <span
                              className={`patient-access ${
                                acceso.estado ===
                                false
                                  ? 'inactive'
                                  : 'active'
                              }`}
                            >
                              {acceso.estado ===
                              false
                                ? 'Deshabilitado'
                                : 'Habilitado'}
                            </span>
                          ) : (
                            <span className="patient-access none">
                              Sin cuenta
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`patient-status ${
                              paciente.estado ===
                              false
                                ? 'inactive'
                                : 'active'
                            }`}
                          >
                            {paciente.estado ===
                            false
                              ? 'Inactivo'
                              : 'Activo'}
                          </span>
                        </td>

                        <td>
                          <div className="admin-patient-actions">
                            <button
                              type="button"
                              title="Ver detalles"
                              onClick={() =>
                                abrirDetalle(
                                  paciente
                                )
                              }
                              disabled={procesando}
                            >
                              <IconoVer />
                            </button>

                            {puedeEditar && (
                              <button
                                type="button"
                                title="Editar paciente"
                                onClick={() =>
                                  abrirEditarPaciente(
                                    paciente
                                  )
                                }
                                disabled={procesando}
                              >
                                <IconoEditar />
                              </button>
                            )}

                            {esAdministrador && (
                              <>
                                <button
                                  type="button"
                                  className="status"
                                  title={
                                    paciente.estado ===
                                    false
                                      ? 'Activar paciente'
                                      : 'Inactivar paciente'
                                  }
                                  onClick={() =>
                                    cambiarEstadoPaciente(
                                      paciente
                                    )
                                  }
                                  disabled={procesando}
                                >
                                  <IconoEstado />
                                </button>

                                <button
                                  type="button"
                                  className={
                                    acceso
                                      ? 'portal'
                                      : 'portal-create'
                                  }
                                  title={
                                    acceso
                                      ? acceso.estado ===
                                        false
                                        ? 'Activar acceso'
                                        : 'Desactivar acceso'
                                      : 'Crear acceso'
                                  }
                                  onClick={() =>
                                    acceso
                                      ? cambiarEstadoAcceso(
                                          paciente
                                        )
                                      : crearAccesoPortal(
                                          paciente
                                        )
                                  }
                                  disabled={procesando}
                                >
                                  <IconoPortal />
                                </button>

                                <button
                                  type="button"
                                  className="delete"
                                  title="Eliminar paciente"
                                  onClick={() =>
                                    eliminarPaciente(
                                      paciente
                                    )
                                  }
                                  disabled={procesando}
                                >
                                  <IconoEliminar />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-patients-empty">
            <div>
              <IconoPacientes />
            </div>

            <h3>
              No se encontraron pacientes
            </h3>

            <p>
              No existen registros que coincidan
              con los filtros seleccionados.
            </p>

            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('todos');
                setFiltroAcceso('todos');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
        <Pagination
          currentPage={paginaActual}
          pageSize={tamanoPagina}
          totalItems={pacientesFiltrados.length}
          onPageChange={setPaginaActual}
          onPageSizeChange={(size) => {
            setTamanoPagina(size);
            setPaginaActual(1);
          }}
          label="pacientes"
        />
      </section>

      {/* =================================================
          MODAL DE FORMULARIO
      ================================================= */}

      {mostrarFormulario && (
        <div
          className="admin-patient-modal-overlay"
          onMouseDown={(evento) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              cerrarFormulario();
            }
          }}
        >
          <section className="admin-patient-modal form-modal">
            <header>
              <div>
                <span>
                  {pacienteEditando
                    ? 'Edición de ficha'
                    : 'Nueva ficha'}
                </span>

                <h2>
                  {pacienteEditando
                    ? 'Editar paciente'
                    : 'Registrar paciente'}
                </h2>

                <p>
                  Completa la información personal,
                  de contacto y clínica básica.
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                <IconoCerrar />
              </button>
            </header>

            <form onSubmit={guardarPaciente}>
              <h3 className="form-section-title">
                Información personal
              </h3>

              <label>
                <span>Nombre *</span>

                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(evento) =>
                    cambiarFormulario(
                      'nombre',
                      evento.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Apellido *</span>

                <input
                  type="text"
                  value={formulario.apellido}
                  onChange={(evento) =>
                    cambiarFormulario(
                      'apellido',
                      evento.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>CI *</span>

                <input
                  type="text"
                  value={formulario.ci}
                  onChange={(evento) =>
                    cambiarFormulario(
                      'ci',
                      evento.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Fecha de nacimiento</span>

                <input
                  type="date"
                  value={
                    formulario.fechaNacimiento
                  }
                  onChange={(evento) =>
                    cambiarFormulario(
                      'fechaNacimiento',
                      evento.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>Sexo</span>

                <select
                  value={formulario.sexo}
                  onChange={(evento) =>
                    cambiarFormulario(
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
                <span>Grupo sanguíneo</span>

                <select
                  value={
                    formulario.tipoSangre
                  }
                  onChange={(evento) =>
                    cambiarFormulario(
                      'tipoSangre',
                      evento.target.value
                    )
                  }
                >
                  <option value="">
                    Sin registro
                  </option>

                  {tiposSangre.map(
                    (tipo) => (
                      <option
                        key={tipo}
                        value={tipo}
                      >
                        {tipo}
                      </option>
                    )
                  )}
                </select>
              </label>

              <h3 className="form-section-title">
                Información de contacto
              </h3>

              <label>
                <span>Teléfono</span>

                <input
                  type="text"
                  value={
                    formulario.telefono
                  }
                  onChange={(evento) =>
                    cambiarFormulario(
                      'telefono',
                      evento.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>Correo electrónico</span>

                <input
                  type="email"
                  value={formulario.email}
                  onChange={(evento) =>
                    cambiarFormulario(
                      'email',
                      evento.target.value
                    )
                  }
                />
              </label>

              <label className="full">
                <span>Dirección</span>

                <input
                  type="text"
                  value={
                    formulario.direccion
                  }
                  onChange={(evento) =>
                    cambiarFormulario(
                      'direccion',
                      evento.target.value
                    )
                  }
                />
              </label>

              <h3 className="form-section-title">
                Información clínica básica
              </h3>

              <label className="full">
                <span>
                  Alergias
                </span>

                <textarea
                  value={
                    formulario.alergias
                  }
                  placeholder="Separar con comas. Ejemplo: Penicilina, látex"
                  onChange={(evento) =>
                    cambiarFormulario(
                      'alergias',
                      evento.target.value
                    )
                  }
                />
              </label>

              <label className="full">
                <span>
                  Condiciones crónicas
                </span>

                <textarea
                  value={
                    formulario
                      .condicionesCronicas
                  }
                  placeholder="Separar con comas. Ejemplo: Diabetes, hipertensión"
                  onChange={(evento) =>
                    cambiarFormulario(
                      'condicionesCronicas',
                      evento.target.value
                    )
                  }
                />
              </label>

              <h3 className="form-section-title">
                Contacto de emergencia
              </h3>

              <label>
                <span>Nombre</span>

                <input
                  type="text"
                  value={
                    formulario
                      .contactoEmergencia
                      .nombre
                  }
                  onChange={(evento) =>
                    cambiarContacto(
                      'nombre',
                      evento.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>Teléfono</span>

                <input
                  type="text"
                  value={
                    formulario
                      .contactoEmergencia
                      .telefono
                  }
                  onChange={(evento) =>
                    cambiarContacto(
                      'telefono',
                      evento.target.value
                    )
                  }
                />
              </label>

              <label className="full">
                <span>Parentesco</span>

                <input
                  type="text"
                  value={
                    formulario
                      .contactoEmergencia
                      .parentesco
                  }
                  onChange={(evento) =>
                    cambiarContacto(
                      'parentesco',
                      evento.target.value
                    )
                  }
                />
              </label>

              <h3 className="form-section-title">
                Estado y acceso
              </h3>

              <label>
                <span>Estado del paciente</span>

                <select
                  value={String(
                    formulario.estado
                  )}
                  onChange={(evento) =>
                    cambiarFormulario(
                      'estado',
                      evento.target.value ===
                        'true'
                    )
                  }
                >
                  <option value="true">
                    Activo
                  </option>

                  <option value="false">
                    Inactivo
                  </option>
                </select>
              </label>

              {!pacienteEditando && (
                <label className="patient-access-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      formulario
                        .crearAccesoPortal
                    }
                    onChange={(evento) =>
                      cambiarFormulario(
                        'crearAccesoPortal',
                        evento.target.checked
                      )
                    }
                  />

                  <span>
                    Crear también una cuenta para
                    acceder al portal del paciente
                  </span>
                </label>
              )}

              {!pacienteEditando &&
                formulario.crearAccesoPortal && (
                  <div className="patient-password-note">
                    <IconoAdvertencia />

                    <p>
                      El correo será utilizado para
                      iniciar sesión y la contraseña
                      inicial será el carnet de identidad.
                    </p>
                  </div>
                )}

              {mensaje && pacienteEditando && (
                <div
                  className="admin-patients-message success form-feedback"
                  role="status"
                  aria-live="polite"
                >
                  <IconoCheck />
                  <span>{mensaje}</span>
                </div>
              )}

              {error && (
                <div
                  className="admin-patients-message error form-feedback"
                  role="alert"
                >
                  <IconoAdvertencia />
                  <span>{error}</span>
                </div>
              )}

              <footer>
                <button
                  type="button"
                  className="cancel"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="save"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : pacienteEditando
                      ? 'Actualizar paciente'
                      : 'Registrar paciente'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* =================================================
          MODAL DE DETALLE
      ================================================= */}

      {(pacienteSeleccionado ||
        cargandoDetalle) && (
        <div className="admin-patient-modal-overlay">
          <section className="admin-patient-modal detail-modal">
            <header>
              <div>
                <span>
                  Ficha del paciente
                </span>

                <h2>
                  Información detallada
                </h2>
              </div>

              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => {
                  setPacienteSeleccionado(null);
                  setEstadisticasSeleccionadas(null);
                }}
              >
                <IconoCerrar />
              </button>
            </header>

            {cargandoDetalle ? (
              <div className="patient-detail-loading">
                <div className="admin-patients-spinner" />
                <p>Cargando información...</p>
              </div>
            ) : (
              pacienteSeleccionado && (
                <div className="patient-detail-content">
                  <section className="patient-detail-profile">
                    <span>
                      {obtenerIniciales(
                        pacienteSeleccionado.nombre,
                        pacienteSeleccionado.apellido
                      )}
                    </span>

                    <div>
                      <h3>
                        {pacienteSeleccionado.nombre}{' '}
                        {pacienteSeleccionado.apellido}
                      </h3>

                      <p>
                        CI:{' '}
                        {pacienteSeleccionado.ci}
                      </p>

                      <div>
                        <span
                          className={`patient-status ${
                            pacienteSeleccionado.estado ===
                            false
                              ? 'inactive'
                              : 'active'
                          }`}
                        >
                          {pacienteSeleccionado.estado ===
                          false
                            ? 'Inactivo'
                            : 'Activo'}
                        </span>

                        <span
                          className={`patient-access ${
                            pacienteSeleccionado.usuarioId
                              ? 'active'
                              : 'none'
                          }`}
                        >
                          {pacienteSeleccionado.usuarioId
                            ? 'Con acceso al portal'
                            : 'Sin acceso al portal'}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="patient-detail-stats">
                    <article>
                      <strong>
                        {estadisticasSeleccionadas
                          ?.totalCitas || 0}
                      </strong>
                      <span>Citas</span>
                    </article>

                    <article>
                      <strong>
                        {estadisticasSeleccionadas
                          ?.totalExpedientes || 0}
                      </strong>
                      <span>Atenciones</span>
                    </article>

                    <article>
                      <strong>
                        {calcularEdad(
                          pacienteSeleccionado
                            .fechaNacimiento
                        ) ?? '--'}
                      </strong>
                      <span>Edad</span>
                    </article>
                  </section>

                  <section className="patient-detail-grid">
                    <article>
                      <span>Teléfono</span>
                      <strong>
                        {pacienteSeleccionado.telefono ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Correo</span>
                      <strong>
                        {pacienteSeleccionado.email ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Dirección</span>
                      <strong>
                        {pacienteSeleccionado.direccion ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Sexo</span>
                      <strong>
                        {pacienteSeleccionado.sexo ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Grupo sanguíneo</span>
                      <strong>
                        {pacienteSeleccionado.tipoSangre ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Fecha de nacimiento</span>
                      <strong>
                        {formatearFecha(
                          pacienteSeleccionado
                            .fechaNacimiento
                        )}
                      </strong>
                    </article>
                  </section>

                  <section className="patient-detail-clinical">
                    <article>
                      <h4>Alergias</h4>

                      <p>
                        {pacienteSeleccionado
                          .alergias?.length
                          ? pacienteSeleccionado
                              .alergias
                              .join(', ')
                          : 'Ninguna registrada'}
                      </p>
                    </article>

                    <article>
                      <h4>
                        Condiciones crónicas
                      </h4>

                      <p>
                        {pacienteSeleccionado
                          .condicionesCronicas
                          ?.length
                          ? pacienteSeleccionado
                              .condicionesCronicas
                              .join(', ')
                          : 'Ninguna registrada'}
                      </p>
                    </article>
                  </section>

                  <section className="patient-detail-emergency">
                    <h4>
                      Contacto de emergencia
                    </h4>

                    <p>
                      <strong>Nombre:</strong>{' '}
                      {pacienteSeleccionado
                        .contactoEmergencia
                        ?.nombre ||
                        'Sin registro'}
                    </p>

                    <p>
                      <strong>Teléfono:</strong>{' '}
                      {pacienteSeleccionado
                        .contactoEmergencia
                        ?.telefono ||
                        'Sin registro'}
                    </p>

                    <p>
                      <strong>Parentesco:</strong>{' '}
                      {pacienteSeleccionado
                        .contactoEmergencia
                        ?.parentesco ||
                        'Sin registro'}
                    </p>
                  </section>

                  <footer className="patient-detail-actions">
                    <button
                      type="button"
                      onClick={() =>
                        abrirCitas(
                          pacienteSeleccionado
                        )
                      }
                    >
                      <IconoCalendario />
                      Ver citas
                    </button>

                    <button
                      type="button"
                      className="primary"
                      onClick={() =>
                        abrirExpediente(
                          pacienteSeleccionado
                        )
                      }
                    >
                      <IconoVer />
                      Ver expediente
                    </button>
                  </footer>
                </div>
              )
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default Pacientes;
