import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../api/axios';
import '../../styles/odontologo/dashboardOdontologo.css';

const obtenerUsuarioLocal = () => {
  try {
    const valor = localStorage.getItem('usuario');
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
};

const formatearFechaBolivia = (fechaTexto) => {
  if (!fechaTexto) return '';

  const [year, month, day] = fechaTexto.split('-');

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const capitalizar = (texto = '') => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const obtenerSaludo = () => {
  const horaBolivia = Number(
    new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      hour: '2-digit',
      hour12: false
    }).format(new Date())
  );

  if (horaBolivia < 12) {
    return {
      mensaje: 'Buenos días',
      periodo: 'mañana'
    };
  }

  if (horaBolivia < 19) {
    return {
      mensaje: 'Buenas tardes',
      periodo: 'tarde'
    };
  }

  return {
    mensaje: 'Buenas noches',
    periodo: 'noche'
  };
};

const etiquetaEstado = (estado) => {
  const etiquetas = {
    pendiente: 'Programada',
    confirmada: 'Confirmada',
    atendido: 'Completada',
    cancelado: 'Cancelada'
  };

  return etiquetas[estado] || estado;
};

const ContadorAnimado = ({
  valor = 0,
  duracion = 650
}) => {
  const [numeroVisible, setNumeroVisible] = useState(0);
  const animacionRef = useRef(null);

  useEffect(() => {
    const valorFinal = Number(valor) || 0;

    if (window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches) {
      setNumeroVisible(valorFinal);
      return undefined;
    }

    const inicio = performance.now();

    const animar = (tiempoActual) => {
      const progreso = Math.min(
        (tiempoActual - inicio) / duracion,
        1
      );

      const progresoSuavizado =
        1 - Math.pow(1 - progreso, 3);

      setNumeroVisible(
        Math.round(valorFinal * progresoSuavizado)
      );

      if (progreso < 1) {
        animacionRef.current =
          requestAnimationFrame(animar);
      }
    };

    animacionRef.current =
      requestAnimationFrame(animar);

    return () => {
      if (animacionRef.current) {
        cancelAnimationFrame(animacionRef.current);
      }
    };
  }, [valor, duracion]);

  return numeroVisible;
};

const IconoCalendario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const IconoCompletadas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
);

const IconoPacientes = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="4" />
    <path d="M3 20c0-4 2.5-7 6-7s6 3 6 7" />
    <path d="M16 11c2.8.3 5 2.7 5 6" />
  </svg>
);

const IconoTratamiento = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3.5h6M9 9h6M9 13h6M9 17h4" />
  </svg>
);

const IconoActividad = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </svg>
);

const IconoAgendaVacia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

const DashboardOdontologo = () => {
  const navigate = useNavigate();

  const usuarioLocal = useMemo(
    () => obtenerUsuarioLocal(),
    []
  );

  const [dashboard, setDashboard] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerDashboard();
  }, []);

  const obtenerDashboard = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get(
        '/reportes/odontologo'
      );

      setDashboard(data);
    } catch (errorPeticion) {
      console.error(
        'Error al obtener dashboard odontólogo:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo cargar el panel del odontólogo.'
      );
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="doctor-dashboard-state">
        <div className="doctor-dashboard-loader" />
        <p>Cargando tu jornada clínica...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-dashboard-error">
        <h2>No se pudo cargar el panel</h2>
        <p>{error}</p>

        <button
          type="button"
          onClick={obtenerDashboard}
        >
          Volver a intentar
        </button>
      </div>
    );
  }

  const nombreOdontologo =
    dashboard?.odontologo?.nombre ||
    usuarioLocal?.nombre ||
    'Odontólogo';

  const primerNombre =
    nombreOdontologo.split(' ')[0] ||
    nombreOdontologo;

  const saludo = obtenerSaludo();
  const resumen = dashboard?.resumen || {};
  const agendaHoy = dashboard?.agendaHoy || [];
  const proximaConsulta =
    dashboard?.proximaConsulta;

  const tarjetas = [
    {
      titulo: 'Citas hoy',
      descripcion: 'Programadas para la jornada',
      valor: resumen.citasHoy || 0,
      color: 'blue',
      Icono: IconoCalendario
    },
    {
      titulo: 'Completadas hoy',
      descripcion: 'Atenciones finalizadas',
      valor: resumen.citasCompletadasHoy || 0,
      color: 'green',
      Icono: IconoCompletadas
    },
    {
      titulo: 'Pacientes del mes',
      descripcion: 'Pacientes únicos atendidos',
      valor: resumen.pacientesMes || 0,
      color: 'purple',
      Icono: IconoPacientes
    },
    {
      titulo: 'Tratamientos del mes',
      descripcion: 'Registros clínicos realizados',
      valor: resumen.tratamientosMes || 0,
      color: 'orange',
      Icono: IconoTratamiento
    }
  ];

  return (
    <main className="doctor-dashboard-page">
      <section className="doctor-welcome-banner">
        <div className="doctor-welcome-content">
          <span className="doctor-current-date">
            {capitalizar(
              formatearFechaBolivia(
                dashboard?.fechaHoy
              )
            )}
          </span>

          <h1>
            {saludo.mensaje}, Dr. {primerNombre}
          </h1>

          <p>
            Tienes {resumen.citasHoy || 0}{' '}
            {(resumen.citasHoy || 0) === 1
              ? 'cita programada'
              : 'citas programadas'}{' '}
            para hoy y{' '}
            {resumen.citasCompletadasHoy || 0}{' '}
            {(resumen.citasCompletadasHoy || 0) === 1
              ? 'completada'
              : 'completadas'}.
          </p>

          <div className="doctor-welcome-actions">
            <button
              type="button"
              className="doctor-action-light"
              onClick={() =>
                navigate('/odontologo/citas')
              }
            >
              Ver agenda
            </button>

            <button
              type="button"
              className="doctor-action-dark"
              onClick={() =>
                navigate('/odontologo/atencion')
              }
            >
              Registrar atención
            </button>
          </div>
        </div>

        <div className="doctor-banner-circle circle-one" />
        <div className="doctor-banner-circle circle-two" />
      </section>

      <section className="doctor-dashboard-stats">
        {tarjetas.map(
          ({
            titulo,
            descripcion,
            valor,
            color,
            Icono
          }, indice) => (
            <article
              className={`doctor-summary-card ${color}`}
              key={titulo}
              style={{
                '--doctor-card-delay':
                  `${indice * 90}ms`
              }}
            >
              <div
                className={`doctor-summary-icon ${color}`}
              >
                <Icono />
              </div>

              <strong>
                <ContadorAnimado valor={valor} />
              </strong>

              <span>{titulo}</span>
              <small>{descripcion}</small>
            </article>
          )
        )}
      </section>

      {proximaConsulta ? (
        <section className="doctor-next-appointment">
          <div className="doctor-next-icon">
            <IconoActividad />
          </div>

          <div className="doctor-next-information">
            <strong>Próxima consulta</strong>

            <span>
              {proximaConsulta.pacienteId?.nombre}{' '}
              {proximaConsulta.pacienteId?.apellido} ·{' '}
              {proximaConsulta.motivo} ·{' '}
              {proximaConsulta.hora}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/odontologo/atencion', {
                state: {
                  citaId: proximaConsulta._id,
                  pacienteId:
                    proximaConsulta.pacienteId?._id
                }
              })
            }
          >
            Ir a atención
          </button>
        </section>
      ) : (
        <section className="doctor-no-next-appointment">
          <div className="doctor-empty-state-icon">
            <IconoAgendaVacia />
          </div>

          <div className="doctor-empty-state-copy">
            <strong>
              No tienes consultas pendientes hoy
            </strong>

            <span>
              Puedes aprovechar este momento para revisar
              expedientes o actualizar historiales clínicos.
            </span>
          </div>
        </section>
      )}

      <section className="doctor-today-agenda">
        <div className="doctor-agenda-heading">
          <div>
            <h2>Agenda de hoy</h2>

            <p>
              Consulta rápidamente tus próximas atenciones
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/odontologo/citas')
            }
          >
            Ver agenda completa
          </button>
        </div>

        <div className="doctor-agenda-list">
          {agendaHoy.map((cita) => (
            <article
              className="doctor-agenda-item"
              key={cita._id}
            >
              <div className="doctor-agenda-time">
                <strong>{cita.hora}</strong>
              </div>

              <div
                className={`doctor-agenda-line ${cita.estado}`}
              />

              <div className="doctor-agenda-patient">
                <h3>
                  {cita.pacienteId?.nombre ||
                    'Paciente'}{' '}
                  {cita.pacienteId?.apellido || ''}
                </h3>

                <p>
                  {cita.motivo ||
                    'Consulta odontológica'}
                </p>

                {cita.pacienteId?.telefono && (
                  <span>
                    Teléfono:{' '}
                    {cita.pacienteId.telefono}
                  </span>
                )}
              </div>

              <span
                className={`doctor-agenda-status ${cita.estado}`}
              >
                {etiquetaEstado(cita.estado)}
              </span>

              {!['atendido', 'cancelado'].includes(
                cita.estado
              ) && (
                <button
                  type="button"
                  className="doctor-start-care-button"
                  onClick={() =>
                    navigate(
                      '/odontologo/atencion',
                      {
                        state: {
                          citaId: cita._id,
                          pacienteId:
                            cita.pacienteId?._id
                        }
                      }
                    )
                  }
                >
                  Atender
                </button>
              )}
            </article>
          ))}

          {agendaHoy.length === 0 && (
            <div className="doctor-empty-agenda">
              <div className="doctor-empty-agenda-icon">
                <IconoAgendaVacia />
              </div>

              <h3>
                No hay citas registradas para hoy
              </h3>

              <p>
                Cuando se agenden citas a tu nombre,
                aparecerán en esta sección.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default DashboardOdontologo;