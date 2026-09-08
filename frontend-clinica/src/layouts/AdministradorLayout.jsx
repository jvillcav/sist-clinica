import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from 'react-router-dom';

import logo from '../assets/inicio/logo-orellana.png';
import '../styles/admin/administradorLayout.css';

/* =====================================================
   ICONOS
===================================================== */

const IconoInicio = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

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

const IconoExpedientes = () => (
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

const IconoCampana = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const IconoMenu = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const IconoChevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 10 5 5 5-5" />
  </svg>
);

const IconoPerfil = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-5 3.5-8 8-8s8 3 8 8" />
  </svg>
);

const IconoSalir = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
    <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
  </svg>
);

/* =====================================================
   NAVEGACIÓN
===================================================== */

const enlacesAdministrador = [
  {
    to: '/admin/dashboard',
    texto: 'Inicio',
    icono: <IconoInicio />
  },
  {
    to: '/admin/usuarios',
    texto: 'Usuarios',
    icono: <IconoUsuarios />
  },
  {
    to: '/admin/pacientes',
    texto: 'Pacientes',
    icono: <IconoPacientes />
  },
  {
    to: '/admin/citas',
    texto: 'Citas',
    icono: <IconoCitas />
  },
  {
    to: '/admin/expedientes',
    texto: 'Expedientes',
    icono: <IconoExpedientes />
  },
  {
    to: '/admin/insumos',
    texto: 'Inventario',
    icono: <IconoInsumos />
  },
  {
    to: '/admin/predicciones',
    texto: 'Predicción ML',
    icono: <IconoPrediccion />
  }
];

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
  } catch (error) {
    console.error(
      'No se pudo leer el usuario almacenado:',
      error
    );

    return null;
  }
};

const obtenerIniciales = (nombre = '') => {
  const partes = String(nombre)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return 'AD';
  }

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`
    .toUpperCase();
};

/* =====================================================
   COMPONENTE
===================================================== */

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuPerfilRef = useRef(null);

  const usuario = useMemo(
    () => obtenerUsuarioLocal(),
    []
  );

  const [menuMovilAbierto, setMenuMovilAbierto] =
    useState(false);

  const [menuPerfilAbierto, setMenuPerfilAbierto] =
    useState(false);

  /*
   * Más adelante este valor puede venir de un endpoint
   * real de alertas o notificaciones administrativas.
   */
  const notificacionesPendientes = 0;

  const iniciales = obtenerIniciales(
    usuario?.nombre
  );

  useEffect(() => {
    setMenuMovilAbierto(false);
    setMenuPerfilAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    const cerrarMenuExterior = (evento) => {
      if (
        menuPerfilRef.current &&
        !menuPerfilRef.current.contains(
          evento.target
        )
      ) {
        setMenuPerfilAbierto(false);
      }
    };

    document.addEventListener(
      'mousedown',
      cerrarMenuExterior
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        cerrarMenuExterior
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      menuMovilAbierto ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuMovilAbierto]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    navigate('/login', {
      replace: true
    });
  };

  const irAlPerfil = () => {
    /*
     * Esta ruta todavía no existe.
     * Mientras tanto, se mantiene al usuario
     * dentro del panel administrativo.
     */
    setMenuPerfilAbierto(false);
  };

  return (
    <div className="admin-portal">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-brand">
            <img
              src={logo}
              alt="Logo Clínica Orellana"
              className="admin-brand-logo"
            />
          </div>

          <nav
            className={`admin-navigation ${
              menuMovilAbierto
                ? 'is-open'
                : ''
            }`}
            aria-label="Navegación administrativa"
          >
            <div className="admin-mobile-menu-header">
              <div>
                <strong>
                  Menú administrativo
                </strong>

                <span>
                  Clínica Orellana
                </span>
              </div>

              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() =>
                  setMenuMovilAbierto(false)
                }
              >
                <IconoCerrar />
              </button>
            </div>

            {enlacesAdministrador.map(
              (enlace) => (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  className={({ isActive }) =>
                    `admin-nav-link ${
                      isActive ? 'active' : ''
                    }`
                  }
                >
                  {enlace.icono}

                  <span>
                    {enlace.texto}
                  </span>
                </NavLink>
              )
            )}
          </nav>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-notification-button"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <IconoCampana />

              {notificacionesPendientes > 0 && (
                <span className="admin-notification-dot">
                  {notificacionesPendientes >
                  9
                    ? '9+'
                    : notificacionesPendientes}
                </span>
              )}
            </button>

            <div
              className="admin-profile-wrapper"
              ref={menuPerfilRef}
            >
              <button
                type="button"
                className="admin-profile-trigger"
                aria-expanded={
                  menuPerfilAbierto
                }
                onClick={() =>
                  setMenuPerfilAbierto(
                    (estadoActual) =>
                      !estadoActual
                  )
                }
              >
                <span className="admin-avatar">
                  {iniciales}
                </span>

                <span className="admin-profile-summary">
                  <strong>
                    {usuario?.nombre ||
                      'Administrador'}
                  </strong>

                  <small>
                    Administrador
                  </small>
                </span>

                <IconoChevron />
              </button>

              {menuPerfilAbierto && (
                <div className="admin-profile-menu">
                  <header>
                    <span className="admin-avatar large">
                      {iniciales}
                    </span>

                    <div>
                      <strong>
                        {usuario?.nombre ||
                          'Administrador'}
                      </strong>

                      <small>
                        {usuario?.email ||
                          'Sin correo registrado'}
                      </small>
                    </div>
                  </header>

                  <button
                    type="button"
                    onClick={irAlPerfil}
                  >
                    <IconoPerfil />
                    Mi perfil
                  </button>

                  <button
                    type="button"
                    className="logout"
                    onClick={cerrarSesion}
                  >
                    <IconoSalir />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="admin-mobile-menu-button"
              aria-label={
                menuMovilAbierto
                  ? 'Cerrar menú'
                  : 'Abrir menú'
              }
              onClick={() =>
                setMenuMovilAbierto(
                  (estadoActual) =>
                    !estadoActual
                )
              }
            >
              {menuMovilAbierto ? (
                <IconoCerrar />
              ) : (
                <IconoMenu />
              )}
            </button>
          </div>
        </div>
      </header>

      {menuMovilAbierto && (
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Cerrar navegación"
          onClick={() =>
            setMenuMovilAbierto(false)
          }
        />
      )}

      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;