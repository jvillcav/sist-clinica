import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../api/axios';
import '../../styles/odontologo/citasOdontologo.css';

/* =====================================================
   UTILIDADES
===================================================== */

const obtenerFechaBolivia = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const convertirFechaLocal = (fecha) => {
  if (!fecha) return '';

  const valorFecha =
    typeof fecha === 'string'
      ? fecha.split('T')[0]
      : '';

  if (!valorFecha) return '';

  const [year, month, day] = valorFecha
    .split('-')
    .map(Number);

  return new Date(
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

const obtenerPartesFecha = (fecha) => {
  if (!fecha) {
    return {
      dia: '--',
      mes: '---',
      year: '----'
    };
  }

  const fechaTexto =
    typeof fecha === 'string'
      ? fecha.split('T')[0]
      : '';

  const [year, month, day] = fechaTexto
    .split('-')
    .map(Number);

  const fechaLocal = new Date(
    year,
    month - 1,
    day
  );

  return {
    dia: String(day).padStart(2, '0'),
    mes: fechaLocal
      .toLocaleDateString('es-BO', {
        month: 'short'
      })
      .replace('.', '')
      .slice(0, 3),
    year
  };
};

const capitalizar = (texto = '') => {
  if (!texto) return '';

  return texto.charAt(0).toUpperCase() +
    texto.slice(1);
};

const normalizarTexto = (texto = '') => {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const obtenerNombrePaciente = (paciente) => {
  if (!paciente) return 'Paciente sin información';

  return [
    paciente.nombre,
    paciente.apellido
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Paciente sin información';
};

const obtenerIniciales = (nombre = '') => {
  const partes = nombre
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

const obtenerEtiquetaEstado = (estado) => {
  const etiquetas = {
    pendiente: 'Programada',
    confirmada: 'Confirmada',
    atendido: 'Completada',
    cancelado: 'Cancelada'
  };

  return etiquetas[estado] || 'Sin estado';
};

const obtenerClaseEstado = (estado) => {
  const clases = {
    pendiente: 'programada',
    confirmada: 'confirmada',
    atendido: 'completada',
    cancelado: 'cancelada'
  };

  return clases[estado] || 'sin-estado';
};

const ordenarCitas = (citas = []) => {
  return [...citas].sort((a, b) => {
    const fechaA = String(a.fecha || '')
      .split('T')[0];

    const fechaB = String(b.fecha || '')
      .split('T')[0];

    const fechaHoraA = new Date(
      `${fechaA}T${a.hora || '00:00'}:00`
    );

    const fechaHoraB = new Date(
      `${fechaB}T${b.hora || '00:00'}:00`
    );

    return fechaHoraA - fechaHoraB;
  });
};

const obtenerAlertasClinicas = (paciente) => {
  const alertas = [];

  if (!paciente) return alertas;

  const alergias = paciente.alergias;

  if (
    Array.isArray(alergias) &&
    alergias.length > 0
  ) {
    alertas.push(
      `Alergias: ${alergias.join(', ')}`
    );
  } else if (
    typeof alergias === 'string' &&
    alergias.trim()
  ) {
    alertas.push(`Alergias: ${alergias}`);
  }

  const condiciones =
    paciente.condicionesCronicas;

  if (
    Array.isArray(condiciones) &&
    condiciones.length > 0
  ) {
    alertas.push(
      `Condiciones: ${condiciones.join(', ')}`
    );
  } else if (
    typeof condiciones === 'string' &&
    condiciones.trim()
  ) {
    alertas.push(
      `Condiciones: ${condiciones}`
    );
  }

  return alertas;
};

/* =====================================================
   ICONOS
===================================================== */

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

const IconoExpediente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const IconoAtencion = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v18M3 12h18" />
  </svg>
);

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6.1 8A7 7 0 0 1 18 6l2 2" />
    <path d="M17.9 16A7 7 0 0 1 6 18l-2-2" />
  </svg>
);

const IconoAgendaVacia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

const IconoAlerta = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

/* =====================================================
   COMPONENTE
===================================================== */

const CitasOdontologo = () => {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [odontologo, setOdontologo] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] = useState('');
  const [busqueda, setBusqueda] =
    useState('');

  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState('todos');

  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(obtenerFechaBolivia());

  const [vista, setVista] = useState('hoy');

  useEffect(() => {
    cargarAgenda();
  }, []);

  const cargarAgenda = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get(
        '/citas/odontologo/agenda'
      );

      setOdontologo(data?.odontologo || null);
      setCitas(
        ordenarCitas(data?.citas || [])
      );
    } catch (errorPeticion) {
      console.error(
        'Error al cargar agenda del odontólogo:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo cargar la agenda del odontólogo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const citasFiltradas = useMemo(() => {
    const textoBusqueda =
      normalizarTexto(busqueda);

    return citas.filter((cita) => {
      const fechaCita = String(
        cita.fecha || ''
      ).split('T')[0];

      const nombrePaciente =
        obtenerNombrePaciente(cita.pacienteId);

      const coincideBusqueda =
        !textoBusqueda ||
        normalizarTexto(nombrePaciente).includes(
          textoBusqueda
        ) ||
        normalizarTexto(
          cita.pacienteId?.ci
        ).includes(textoBusqueda) ||
        normalizarTexto(
          cita.pacienteId?.telefono
        ).includes(textoBusqueda) ||
        normalizarTexto(
          cita.motivo
        ).includes(textoBusqueda);

      const coincideEstado =
        estadoSeleccionado === 'todos' ||
        cita.estado === estadoSeleccionado;

      const coincideFecha =
        vista === 'todas' ||
        fechaCita === fechaSeleccionada;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideFecha
      );
    });
  }, [
    citas,
    busqueda,
    estadoSeleccionado,
    fechaSeleccionada,
    vista
  ]);

  const resumen = useMemo(() => {
    const citasBase =
      vista === 'hoy'
        ? citas.filter(
            (cita) =>
              String(cita.fecha || '')
                .split('T')[0] ===
              fechaSeleccionada
          )
        : citas;

    return {
      total: citasBase.length,

      programadas: citasBase.filter(
        (cita) =>
          cita.estado === 'pendiente'
      ).length,

      confirmadas: citasBase.filter(
        (cita) =>
          cita.estado === 'confirmada'
      ).length,

      completadas: citasBase.filter(
        (cita) =>
          cita.estado === 'atendido'
      ).length
    };
  }, [
    citas,
    fechaSeleccionada,
    vista
  ]);

  const abrirExpediente = (cita) => {
    const pacienteId =
      cita.pacienteId?._id;

    if (!pacienteId) {
      window.alert(
        'No se encontró el paciente asociado a esta cita.'
      );

      return;
    }

    navigate(
      `/odontologo/pacientes/${pacienteId}`,
      {
        state: {
          pacienteId,
          citaId: cita._id
        }
      }
    );
  };

  const iniciarAtencion = (cita) => {
    const pacienteId =
      cita.pacienteId?._id;

    if (!pacienteId) {
      window.alert(
        'No se encontró el paciente asociado a esta cita.'
      );

      return;
    }

    navigate('/odontologo/atencion', {
      state: {
        citaId: cita._id,
        pacienteId,
        cita
      }
    });
  };

  if (cargando) {
    return (
      <div className="doctor-agenda-loading">
        <div className="doctor-agenda-spinner" />

        <h2>Cargando agenda clínica</h2>

        <p>
          Estamos preparando las citas del odontólogo.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section className="doctor-agenda-error">
        <div className="doctor-agenda-error-icon">
          !
        </div>

        <h2>No se pudo cargar la agenda</h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={cargarAgenda}
        >
          <IconoActualizar />
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <main className="doctor-agenda-page">
      <header className="doctor-agenda-page-header">
        <div>
          <span className="doctor-agenda-eyebrow">
            Agenda clínica
          </span>

          <h1>Agenda de Citas</h1>

          <p>
            Consulta las citas asignadas al Dr.{' '}
            <strong>
              {odontologo?.nombre ||
                'Odontólogo'}
            </strong>
            .
          </p>
        </div>

        <button
          type="button"
          className="doctor-agenda-refresh-button"
          onClick={cargarAgenda}
        >
          <IconoActualizar />
          Actualizar
        </button>
      </header>

      <section className="doctor-agenda-summary">
        <article className="doctor-agenda-summary-card total">
          <span>Total de citas</span>
          <strong>{resumen.total}</strong>
          <small>
            {vista === 'hoy'
              ? 'Para la fecha seleccionada'
              : 'En toda la agenda'}
          </small>
        </article>

        <article className="doctor-agenda-summary-card programmed">
          <span>Programadas</span>
          <strong>{resumen.programadas}</strong>
          <small>Pendientes de atención</small>
        </article>

        <article className="doctor-agenda-summary-card confirmed">
          <span>Confirmadas</span>
          <strong>{resumen.confirmadas}</strong>
          <small>Pacientes confirmados</small>
        </article>

        <article className="doctor-agenda-summary-card completed">
          <span>Completadas</span>
          <strong>{resumen.completadas}</strong>
          <small>Atenciones finalizadas</small>
        </article>
      </section>

      <section className="doctor-agenda-toolbar">
        <div className="doctor-agenda-view-switch">
          <button
            type="button"
            className={
              vista === 'hoy'
                ? 'active'
                : ''
            }
            onClick={() => setVista('hoy')}
          >
            Hoy
          </button>

          <button
            type="button"
            className={
              vista === 'todas'
                ? 'active'
                : ''
            }
            onClick={() => setVista('todas')}
          >
            Todas
          </button>
        </div>

        {vista === 'hoy' && (
          <label className="doctor-agenda-date-field">
            <span>Fecha</span>

            <div>
              <IconoCalendario />

              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(evento) =>
                  setFechaSeleccionada(
                    evento.target.value
                  )
                }
              />
            </div>
          </label>
        )}

        <label className="doctor-agenda-search-field">
          <span>Buscar cita</span>

          <div>
            <IconoBuscar />

            <input
              type="search"
              placeholder="Paciente, CI, teléfono o tratamiento..."
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
            />
          </div>
        </label>

        <label className="doctor-agenda-status-field">
          <span>Estado</span>

          <select
            value={estadoSeleccionado}
            onChange={(evento) =>
              setEstadoSeleccionado(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="pendiente">
              Programadas
            </option>

            <option value="confirmada">
              Confirmadas
            </option>

            <option value="atendido">
              Completadas
            </option>

            <option value="cancelado">
              Canceladas
            </option>
          </select>
        </label>
      </section>

      <section className="doctor-agenda-content">
        <div className="doctor-agenda-content-heading">
          <div>
            <h2>
              {vista === 'hoy'
                ? capitalizar(
                    convertirFechaLocal(
                      fechaSeleccionada
                    )
                  )
                : 'Agenda completa'}
            </h2>

            <p>
              {citasFiltradas.length}{' '}
              {citasFiltradas.length === 1
                ? 'cita encontrada'
                : 'citas encontradas'}
            </p>
          </div>
        </div>

        {citasFiltradas.length > 0 ? (
          <div className="doctor-agenda-timeline">
            {citasFiltradas.map((cita) => {
              const paciente =
                cita.pacienteId;

              const nombrePaciente =
                obtenerNombrePaciente(paciente);

              const iniciales =
                obtenerIniciales(
                  nombrePaciente
                );

              const partesFecha =
                obtenerPartesFecha(
                  cita.fecha
                );

              const claseEstado =
                obtenerClaseEstado(
                  cita.estado
                );

              const alertas =
                obtenerAlertasClinicas(
                  paciente
                );

              const puedeAtender =
                ![
                  'atendido',
                  'cancelado'
                ].includes(cita.estado);

              return (
                <article
                  className={`doctor-appointment-card ${claseEstado}`}
                  key={cita._id}
                >
                  <div className="doctor-appointment-date">
                    <strong>
                      {partesFecha.dia}
                    </strong>

                    <span>
                      {capitalizar(
                        partesFecha.mes
                      )}
                    </span>

                    <small>
                      {partesFecha.year}
                    </small>
                  </div>

                  <div
                    className={`doctor-appointment-timeline-line ${claseEstado}`}
                  />

                  <div className="doctor-appointment-main">
                    <div className="doctor-appointment-top">
                      <div className="doctor-appointment-patient">
                        <div className="doctor-appointment-avatar">
                          {iniciales}
                        </div>

                        <div>
                          <h3>
                            {nombrePaciente}
                          </h3>

                          <p>
                            {cita.motivo ||
                              'Consulta odontológica'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`doctor-appointment-status ${claseEstado}`}
                      >
                        {obtenerEtiquetaEstado(
                          cita.estado
                        )}
                      </span>
                    </div>

                    <div className="doctor-appointment-information">
                      <span>
                        <strong>Hora:</strong>{' '}
                        {cita.hora || 'Sin hora'}
                      </span>

                      {paciente?.ci && (
                        <span>
                          <strong>CI:</strong>{' '}
                          {paciente.ci}
                        </span>
                      )}

                      {paciente?.telefono && (
                        <span>
                          <strong>Teléfono:</strong>{' '}
                          {paciente.telefono}
                        </span>
                      )}
                    </div>

                    {alertas.length > 0 && (
                      <div className="doctor-appointment-alerts">
                        <IconoAlerta />

                        <div>
                          {alertas.map((alerta) => (
                            <span key={alerta}>
                              {alerta}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="doctor-appointment-actions">
                      <button
                        type="button"
                        className="doctor-appointment-secondary-button"
                        onClick={() =>
                          abrirExpediente(cita)
                        }
                      >
                        <IconoExpediente />
                        Ver expediente
                      </button>

                      {puedeAtender && (
                        <button
                          type="button"
                          className="doctor-appointment-primary-button"
                          onClick={() =>
                            iniciarAtencion(cita)
                          }
                        >
                          <IconoAtencion />
                          Iniciar atención
                        </button>
                      )}

                      {cita.estado ===
                        'atendido' && (
                        <span className="doctor-appointment-finished-message">
                          Atención finalizada
                        </span>
                      )}

                      {cita.estado ===
                        'cancelado' && (
                        <span className="doctor-appointment-cancelled-message">
                          Esta cita fue cancelada
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="doctor-agenda-empty-state">
            <div className="doctor-agenda-empty-icon">
              <IconoAgendaVacia />
            </div>

            <h3>
              No se encontraron citas
            </h3>

            <p>
              No existen citas que coincidan con la fecha,
              búsqueda o estado seleccionado.
            </p>

            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setEstadoSeleccionado('todos');
                setFechaSeleccionada(
                  obtenerFechaBolivia()
                );
                setVista('hoy');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default CitasOdontologo;