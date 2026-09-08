import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import api from '../../api/axios';
import '../../styles/admin/dashboardAdmin.css';

/* =====================================================
   ICONOS
===================================================== */

const IconoUsuarios = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-4.5 3-7 7-7" />
    <circle cx="17" cy="10" r="3" />
    <path d="M14 21c0-3.5 2.3-5.5 5.5-5.5" />
  </svg>
);

const IconoPacientes = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8" cy="8" r="4" />
    <circle cx="17" cy="9" r="3" />
    <path d="M2 21c0-4.6 2.7-7 6-7s6 2.4 6 7" />
    <path d="M14 15c4 0 7 2 7 6" />
  </svg>
);

const IconoCitas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <path d="M8 14h3M13 14h3M8 18h3" />
  </svg>
);

const IconoExpediente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v4h6V3" />
    <path d="M9 11h6M9 15h6M9 19h4" />
  </svg>
);

const IconoInsumos = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 7 8-4 8 4-8 4-8-4Z" />
    <path d="M4 7v10l8 4 8-4V7" />
    <path d="M12 11v10" />
  </svg>
);

const IconoPrediccion = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 19V9" />
    <path d="M10 19V5" />
    <path d="M16 19v-7" />
    <path d="m3 8 6-5 6 5 6-5" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoPendiente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconoAtendida = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const IconoCancelada = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
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

const IconoFlecha = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/* =====================================================
   UTILIDADES
===================================================== */

const obtenerUsuarioLocal = () => {
  try {
    const usuarioGuardado =
      localStorage.getItem('usuario');

    return usuarioGuardado
      ? JSON.parse(usuarioGuardado)
      : null;
  } catch {
    return null;
  }
};

const obtenerPrimerNombre = (nombre = '') => {
  return String(nombre)
    .trim()
    .split(/\s+/)[0] || 'Administrador';
};

const obtenerSaludo = () => {
  const hora = new Date().getHours();

  if (hora < 12) {
    return 'Buenos días';
  }

  if (hora < 19) {
    return 'Buenas tardes';
  }

  return 'Buenas noches';
};

const obtenerFechaActual = () => {
  const fecha = new Date();

  const texto = fecha.toLocaleDateString(
    'es-BO',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );

  return texto.charAt(0).toUpperCase() +
    texto.slice(1);
};

/* =====================================================
   COMPONENTE
===================================================== */

const Dashboard = () => {
  const navigate = useNavigate();

  const usuario = useMemo(
    () => obtenerUsuarioLocal(),
    []
  );

  const [resumen, setResumen] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    obtenerResumen();
  }, []);

  const obtenerResumen = async (
    mostrarIndicador = false
  ) => {
    try {
      if (mostrarIndicador) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError('');

      const { data } = await api.get(
        '/reportes/resumen'
      );

      setResumen(data);
    } catch (errorPeticion) {
      console.error(
        'Error al cargar dashboard:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo cargar el resumen administrativo.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  const insumosCriticos =
    resumen?.insumosBajoStock || [];

  const citasPendientes =
    resumen?.citas?.pendientes || 0;

  const citasAtendidas =
    resumen?.citas?.atendidas || 0;

  const citasCanceladas =
    resumen?.citas?.canceladas || 0;

  const resumenTexto = () => {
    const cantidadInsumos =
      insumosCriticos.length;

    const textoInsumos =
      cantidadInsumos === 1
        ? '1 insumo requiere revisión'
        : `${cantidadInsumos} insumos requieren revisión`;

    const textoCitas =
      citasPendientes === 1
        ? '1 cita pendiente'
        : `${citasPendientes} citas pendientes`;

    return `${textoInsumos} · ${textoCitas}`;
  };

  if (cargando) {
    return (
      <section className="admin-dashboard-loading">
        <div className="admin-dashboard-spinner" />

        <h2>
          Preparando panel administrativo
        </h2>

        <p>
          Consultando el resumen general de la clínica.
        </p>
      </section>
    );
  }

  if (error && !resumen) {
    return (
      <section className="admin-dashboard-error">
        <div className="admin-dashboard-error-icon">
          <IconoAdvertencia />
        </div>

        <h2>
          No se pudo cargar el dashboard
        </h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={() =>
            obtenerResumen()
          }
        >
          <IconoActualizar />
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <main className="admin-dashboard-page">
      {error && (
        <div className="admin-dashboard-inline-error">
          <IconoAdvertencia />
          <span>{error}</span>
        </div>
      )}

      <section className="admin-dashboard-hero">
        <div className="admin-dashboard-hero-content">
          <span className="admin-dashboard-date">
            {obtenerFechaActual()}
          </span>

          <h1>
            {obtenerSaludo()},{' '}
            {obtenerPrimerNombre(
              usuario?.nombre
            )}
          </h1>

          <p className="admin-dashboard-hero-title">
            Panel General de Administración
          </p>

          <p className="admin-dashboard-hero-status">
            <IconoAdvertencia />
            {resumenTexto()}
          </p>

          <div className="admin-dashboard-hero-actions">
            <button
              type="button"
              className="primary"
              onClick={() =>
                navigate('/admin/usuarios')
              }
            >
              <IconoUsuarios />
              Gestionar usuarios
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() =>
                navigate('/admin/predicciones')
              }
            >
              <IconoPrediccion />
              Predicción ML
            </button>
          </div>
        </div>

        <div className="admin-dashboard-hero-decoration large" />
        <div className="admin-dashboard-hero-decoration small" />
      </section>

      <section className="admin-dashboard-section-heading">
        <div>
          <h2>Resumen general</h2>

          <p>
            Indicadores principales del sistema clínico
          </p>
        </div>

        <button
          type="button"
          className="admin-dashboard-refresh"
          onClick={() =>
            obtenerResumen(true)
          }
          disabled={actualizando}
        >
          <IconoActualizar />

          {actualizando
            ? 'Actualizando...'
            : 'Actualizar'}
        </button>
      </section>

      <section className="admin-dashboard-stats">
        <article className="admin-dashboard-stat patients">
          <div className="admin-dashboard-stat-header">
            <div className="admin-dashboard-stat-icon">
              <IconoPacientes />
            </div>

            <span className="admin-dashboard-stat-link">
              Clínica
            </span>
          </div>

          <strong>
            {resumen?.totalPacientes || 0}
          </strong>

          <h3>
            Pacientes registrados
          </h3>

          <p>
            Total de pacientes en el sistema
          </p>
        </article>

        <article className="admin-dashboard-stat appointments">
          <div className="admin-dashboard-stat-header">
            <div className="admin-dashboard-stat-icon">
              <IconoCitas />
            </div>

            <span className="admin-dashboard-stat-link">
              Agenda
            </span>
          </div>

          <strong>
            {resumen?.totalCitas || 0}
          </strong>

          <h3>
            Citas registradas
          </h3>

          <p>
            Programadas en el sistema
          </p>
        </article>

        <article className="admin-dashboard-stat records">
          <div className="admin-dashboard-stat-header">
            <div className="admin-dashboard-stat-icon">
              <IconoExpediente />
            </div>

            <span className="admin-dashboard-stat-link">
              Clínica
            </span>
          </div>

          <strong>
            {resumen?.totalExpedientes || 0}
          </strong>

          <h3>
            Expedientes clínicos
          </h3>

          <p>
            Atenciones documentadas
          </p>
        </article>

        <article className="admin-dashboard-stat supplies">
          <div className="admin-dashboard-stat-header">
            <div className="admin-dashboard-stat-icon">
              <IconoInsumos />
            </div>

            <span className="admin-dashboard-stat-link">
              Inventario
            </span>
          </div>

          <strong>
            {resumen?.totalConsumos || 0}
          </strong>

          <h3>
            Consumos registrados
          </h3>

          <p>
            Movimientos de insumos clínicos
          </p>
        </article>
      </section>

      <section
        className={`admin-stock-panel ${
          insumosCriticos.length > 0
            ? 'has-alerts'
            : 'without-alerts'
        }`}
      >
        <header className="admin-stock-panel-header">
          <div>
            <span className="admin-stock-panel-icon">
              <IconoAdvertencia />
            </span>

            <div>
              <h2>
                Insumos con stock crítico
              </h2>

              <p>
                Materiales que llegaron o se encuentran por debajo del mínimo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/admin/insumos')
            }
          >
            Ver inventario
            <IconoFlecha />
          </button>
        </header>

        {insumosCriticos.length === 0 ? (
          <div className="admin-stock-empty">
            <div>
              <IconoInsumos />
            </div>

            <section>
              <strong>
                Inventario en estado estable
              </strong>

              <p>
                No existen alertas de stock en este momento.
              </p>
            </section>
          </div>
        ) : (
          <div className="admin-stock-list">
            {insumosCriticos.map(
              (insumo) => {
                const stockActual =
                  Number(
                    insumo.stockActual || 0
                  );

                const stockMinimo =
                  Number(
                    insumo.stockMinimo || 0
                  );

                const porcentaje =
                  stockMinimo > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (
                            stockActual /
                            stockMinimo
                          ) * 100
                        )
                      )
                    : 0;

                return (
                  <article
                    className="admin-stock-item"
                    key={insumo._id}
                  >
                    <span className="admin-stock-indicator" />

                    <div className="admin-stock-item-main">
                      <strong>
                        {insumo.nombre}
                      </strong>

                      <p>
                        {stockActual}{' '}
                        {insumo.unidadMedida ||
                          'unidades'}{' '}
                        disponibles · mínimo{' '}
                        {stockMinimo}
                      </p>

                      <div className="admin-stock-progress">
                        <span
                          style={{
                            width: `${porcentaje}%`
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate('/insumos')
                      }
                    >
                      Gestionar
                    </button>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="admin-dashboard-bottom-grid">
        <article className="admin-appointments-panel">
          <header>
            <div>
              <h2>
                Estado general de citas
              </h2>

              <p>
                Distribución de citas según su estado actual
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/admin/citas')
              }
            >
              Ver citas
              <IconoFlecha />
            </button>
          </header>

          <div className="admin-appointment-status-grid">
            <article className="pending">
              <span>
                <IconoPendiente />
              </span>

              <strong>
                {citasPendientes}
              </strong>

              <h3>Pendientes</h3>

              <p>
                Requieren seguimiento
              </p>
            </article>

            <article className="attended">
              <span>
                <IconoAtendida />
              </span>

              <strong>
                {citasAtendidas}
              </strong>

              <h3>Atendidas</h3>

              <p>
                Consultas completadas
              </p>
            </article>

            <article className="cancelled">
              <span>
                <IconoCancelada />
              </span>

              <strong>
                {citasCanceladas}
              </strong>

              <h3>Canceladas</h3>

              <p>
                Citas no realizadas
              </p>
            </article>
          </div>
        </article>

        <article className="admin-quick-access-panel">
          <header>
            <h2>
              Accesos rápidos
            </h2>

            <p>
              Funciones administrativas frecuentes
            </p>
          </header>

          <div className="admin-quick-access-list">
            <button
              type="button"
              onClick={() =>
                navigate('/admin/usuarios')
              }
            >
              <span className="users">
                <IconoUsuarios />
              </span>

              <div>
                <strong>
                  Gestionar usuarios
                </strong>

                <small>
                  Cuentas, roles y estados
                </small>
              </div>

              <IconoFlecha />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/admin/pacientes')
              }
            >
              <span className="patients">
                <IconoPacientes />
              </span>

              <div>
                <strong>
                  Revisar pacientes
                </strong>

                <small>
                  Información y registros
                </small>
              </div>

              <IconoFlecha />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/admin/insumos')
              }
            >
              <span className="inventory">
                <IconoInsumos />
              </span>

              <div>
                <strong>
                  Controlar inventario
                </strong>

                <small>
                  Stock y reabastecimiento
                </small>
              </div>

              <IconoFlecha />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/admin/predicciones')
              }
            >
              <span className="prediction">
                <IconoPrediccion />
              </span>

              <div>
                <strong>
                  Predicción de consumo
                </strong>

                <small>
                  Proyecciones mediante ML
                </small>
              </div>

              <IconoFlecha />
            </button>
          </div>
        </article>
      </section>
    </main>
  );
};

export default Dashboard;