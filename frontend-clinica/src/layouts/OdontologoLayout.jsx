import { useEffect, useRef, useState } from 'react';
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from 'react-router-dom';

import logo from '../assets/inicio/logo-orellana.png';
import '../styles/odontologo/odontologoLayout.css';

const obtenerUsuarioGuardado = () => {
  try {
    const usuarioGuardado = localStorage.getItem('usuario');

    return usuarioGuardado
      ? JSON.parse(usuarioGuardado)
      : null;
  } catch (error) {
    console.error(
      'No se pudo leer el usuario guardado:',
      error
    );

    return null;
  }
};

const obtenerIniciales = (nombre = '') => {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return 'OD';

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
};

const IconoInicio = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10.5V20h13v-9.5" />
    <path d="M9.5 20v-6h5v6" />
  </svg>
);

const IconoAgenda = () => (
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

const IconoAtencion = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3.5h6M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const IconoInsumos = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v9" />
  </svg>
);

const IconoReportes = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 20V10M12 20V4M19 20v-7" />
  </svg>
);

const IconoCampana = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const IconoSalir = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" />
  </svg>
);

const IconoMenu = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const enlaces = [
  {
    to: '/odontologo/dashboard',
    texto: 'Inicio',
    Icono: IconoInicio
  },
  {
    to: '/odontologo/citas',
    texto: 'Agenda',
    Icono: IconoAgenda
  },
  {
    to: '/odontologo/pacientes',
    texto: 'Pacientes',
    Icono: IconoBuscar
  },
  {
    to: '/odontologo/atencion',
    texto: 'Atención',
    Icono: IconoAtencion
  },
  {
    to: '/odontologo/insumos',
    texto: 'Insumos',
    Icono: IconoInsumos
  },
  {
    to: '/odontologo/reportes',
    texto: 'Reportes',
    Icono: IconoReportes
  }
];

const OdontologoLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuUsuarioRef = useRef(null);

  const [usuario] = useState(obtenerUsuarioGuardado);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] =
    useState(false);

  const [menuMovilAbierto, setMenuMovilAbierto] =
    useState(false);

  const nombreUsuario =
    usuario?.nombre || 'Odontólogo';

  const iniciales = obtenerIniciales(nombreUsuario);

  useEffect(() => {
    setMenuMovilAbierto(false);
    setMenuUsuarioAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    const cerrarAlHacerClickFuera = (evento) => {
      if (
        menuUsuarioRef.current &&
        !menuUsuarioRef.current.contains(evento.target)
      ) {
        setMenuUsuarioAbierto(false);
      }
    };

    document.addEventListener(
      'mousedown',
      cerrarAlHacerClickFuera
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        cerrarAlHacerClickFuera
      );
    };
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    navigate('/login', {
      replace: true
    });
  };

  return (
    <div className="odontologo-portal">
      <header className="odontologo-navbar">
        <div className="odontologo-navbar-inner">
          <NavLink
            to="/odontologo/dashboard"
            className="odontologo-brand"
            aria-label="Ir al inicio del portal odontológico"
          >
            <img
              src={logo}
              alt="Logo de la Clínica Orellana"
              className="odontologo-brand-logo"
            />

            <div className="odontologo-brand-text">
              <strong>Clínica Orellana</strong>
              <span>Portal Odontólogo</span>
            </div>
          </NavLink>

          <nav
            className={`odontologo-navigation ${
              menuMovilAbierto ? 'open' : ''
            }`}
            aria-label="Navegación del odontólogo"
          >
            {enlaces.map(({ to, texto, Icono }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `odontologo-nav-link ${
                    isActive ? 'active' : ''
                  }`
                }
              >
                <span className="odontologo-nav-icon">
                  <Icono />
                </span>

                <span>{texto}</span>
              </NavLink>
            ))}
          </nav>

          <div className="odontologo-navbar-actions">
            <button
              type="button"
              className="odontologo-notification-button"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <IconoCampana />
              <span className="odontologo-notification-dot" />
            </button>

            <div
              className="odontologo-user-menu"
              ref={menuUsuarioRef}
            >
              <button
                type="button"
                className="odontologo-avatar-button"
                aria-expanded={menuUsuarioAbierto}
                aria-haspopup="menu"
                onClick={() =>
                  setMenuUsuarioAbierto(
                    (estadoActual) => !estadoActual
                  )
                }
              >
                {iniciales}
              </button>

              {menuUsuarioAbierto && (
                <div
                  className="odontologo-user-dropdown"
                  role="menu"
                >
                  <div className="odontologo-dropdown-user">
                    <div className="odontologo-dropdown-avatar">
                      {iniciales}
                    </div>

                    <div>
                      <strong>{nombreUsuario}</strong>
                      <span>{usuario?.email || 'Odontólogo'}</span>
                    </div>
                  </div>

                  <div className="odontologo-dropdown-divider" />

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="odontologo-logout-button"
                    role="menuitem"
                  >
                    <IconoSalir />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="odontologo-mobile-menu-button"
              aria-label="Abrir menú"
              aria-expanded={menuMovilAbierto}
              onClick={() =>
                setMenuMovilAbierto(
                  (estadoActual) => !estadoActual
                )
              }
            >
              <IconoMenu />
            </button>
          </div>
        </div>
      </header>

      <main className="odontologo-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default OdontologoLayout;