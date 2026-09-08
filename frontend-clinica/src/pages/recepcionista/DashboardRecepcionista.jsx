import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const DashboardRecepcionista = () => {
  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem('usuario') || 'null'
  );

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerResumen();
  }, []);

  const obtenerResumen = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get('/reportes/recepcion');

      setDatos(data);
    } catch (error) {
      console.error(
        'Error al cargar el panel de recepción:',
        error
      );

      setError(
        error.response?.data?.mensaje ||
          'No se pudo cargar el panel de recepción.'
      );
    } finally {
      setCargando(false);
    }
  };

  const fechaBonita = (fecha) => {
    if (!fecha) return '';

    const [year, month, day] = fecha.split('-');

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

  const fechaCorta = (fecha) => {
    if (!fecha) return '';

    const texto = String(fecha).split('T')[0];
    const [year, month, day] = texto.split('-');

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short'
    });
  };

  const nombreRecepcionista = useMemo(() => {
    return usuario?.nombre?.split(' ')[0] || 'Recepcionista';
  }, [usuario]);

  const etiquetaEstado = (estado) => {
    const etiquetas = {
      pendiente: 'Pendiente',
      atendido: 'Atendida',
      cancelado: 'Cancelada'
    };

    return etiquetas[estado] || estado;
  };

  if (cargando) {
    return (
      <main className="reception-dashboard-page">
        <p>Cargando panel de recepción...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="reception-dashboard-page">
        <div className="error-message">{error}</div>
      </main>
    );
  }

  return (
    <main className="reception-dashboard-page">
      <section className="reception-welcome-card">
        <div className="reception-welcome-content">
          <span>{fechaBonita(datos?.fecha)}</span>

          <h1>Bienvenida, {nombreRecepcionista}</h1>

          <p>
            {datos?.resumen?.citasHoy || 0} citas para hoy ·{' '}
            {datos?.resumen?.pendientesConfirmacion || 0}{' '}
            solicitudes pendientes de confirmación
          </p>

          <div className="reception-welcome-actions">
            <button
              type="button"
              onClick={() =>
                navigate('/recepcionista/citas')
              }
            >
              Agendar cita
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() =>
                navigate('/recepcionista/registrar')
              }
            >
              Registrar paciente
            </button>
          </div>
        </div>

        <div className="reception-decoration circle-one" />
        <div className="reception-decoration circle-two" />
      </section>

      <section className="reception-dashboard-stats">
        <article>
          <strong>{datos?.resumen?.citasHoy || 0}</strong>
          <span>Citas hoy</span>
          <small>programadas</small>
        </article>

        <article>
          <strong>
            {datos?.resumen?.pendientesConfirmacion || 0}
          </strong>
          <span>Por confirmar</span>
          <small>solicitudes pendientes</small>
        </article>

        <article>
          <strong>
            {datos?.resumen?.pacientesActivos || 0}
          </strong>
          <span>Pacientes registrados</span>
          <small>total activos</small>
        </article>

        <article>
          <strong>
            {datos?.resumen?.nuevosPacientesMes || 0}
          </strong>
          <span>Nuevos este mes</span>
          <small>registros recientes</small>
        </article>
      </section>

      {datos?.solicitudesPendientes?.length > 0 && (
        <section className="reception-pending-alert">
          <div className="reception-alert-heading">
            <strong>
              {datos.solicitudesPendientes.length}{' '}
              solicitudes requieren confirmación
            </strong>

            <button
              type="button"
              onClick={() =>
                navigate('/recepcionista/citas')
              }
            >
              Ver todas
            </button>
          </div>

          <div className="reception-request-list">
            {datos.solicitudesPendientes.map((solicitud) => (
              <article
                className="reception-request-item"
                key={solicitud._id}
              >
                <div>
                  <strong>{solicitud.nombreCompleto}</strong>

                  <span>
                    {solicitud.servicio} ·{' '}
                    {fechaCorta(solicitud.fecha)} ·{' '}
                    {solicitud.hora}
                  </span>
                </div>

                <a href={`tel:${solicitud.telefono}`}>
                  Llamar
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="reception-today-card">
        <div className="reception-section-heading">
          <div>
            <h2>Citas de hoy</h2>
            <p>Agenda programada para la jornada</p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/recepcionista/citas')
            }
          >
            Gestionar
          </button>
        </div>

        <div className="reception-today-list">
          {datos?.citasHoy?.length === 0 ? (
            <div className="reception-empty-state">
              <h3>No hay citas programadas para hoy</h3>
              <p>
                La agenda está despejada por el momento.
              </p>
            </div>
          ) : (
            datos.citasHoy.map((cita) => (
              <article
                className="reception-today-item"
                key={cita._id}
              >
                <div className="reception-time-box">
                  {cita.hora}
                </div>

                <div className="reception-appointment-info">
                  <strong>
                    {cita.pacienteId?.nombre}{' '}
                    {cita.pacienteId?.apellido}
                  </strong>

                  <span>
                    {cita.motivo} · {cita.odontologo}
                  </span>
                </div>

                <span
                  className={`reception-status ${cita.estado}`}
                >
                  {etiquetaEstado(cita.estado)}
                </span>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

export default DashboardRecepcionista;