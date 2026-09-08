import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import logo from '../assets/inicio/logo-orellana.png';

const RecepcionistaLayout = () => {
  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem('usuario') || 'null'
  );

  const iniciales = (nombre = '') => {
    return nombre
      .trim()
      .split(/\s+/)
      .map((parte) => parte[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const perfilRef = useRef(null);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const cerrarMenuExterior = (evento) => {
      if (
        menuPerfilAbierto &&
        perfilRef.current &&
        !perfilRef.current.contains(evento.target)
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
  }, [menuPerfilAbierto]);

  return (
    <div className="reception-portal">
      <header className="reception-navbar">
        <div className="reception-brand">
          <img
            src={logo}
            alt="Logo Clínica Dental Orellana"
            className="reception-brand-logo"
          />

          <div>
            <strong>Clínica Orellana</strong>
            <span>Portal Recepcionista</span>
          </div>
        </div>

        <nav className="reception-navbar-menu">
          <NavLink to="/recepcionista/inicio">
            Inicio
          </NavLink>

          <NavLink to="/recepcionista/registrar">
            Registrar
          </NavLink>

          <NavLink to="/recepcionista/citas">
            Citas
          </NavLink>

          <NavLink to="/recepcionista/cancelar">
            Cancelar
          </NavLink>

          <NavLink to="/recepcionista/buscar">
            Buscar
          </NavLink>
        </nav>

        <div className="reception-navbar-user" ref={perfilRef}>
          <button
            type="button"
            className="reception-notification-button"
            title="Notificaciones"
          >
            🔔
          </button>

          <button
            type="button"
            className="reception-user-avatar reception-avatar-trigger"
            aria-haspopup="menu"
            aria-expanded={menuPerfilAbierto}
            onClick={() =>
              setMenuPerfilAbierto(
                (abierto) => !abierto
              )
            }
          >
            {iniciales(usuario?.nombre || 'Recepcionista')}
          </button>

          {menuPerfilAbierto && (
            <div className="reception-profile-menu">
              <header>
                <span className="reception-avatar large">
                  {iniciales(usuario?.nombre || 'Recepcionista')}
                </span>
                <div>
                  <strong>
                    {usuario?.nombre || 'Recepcionista'}
                  </strong>
                  <small>
                    {usuario?.email || 'Sin correo registrado'}
                  </small>
                </div>
              </header>

              <button
                type="button"
                className="reception-profile-menu-item logout"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="reception-portal-content">
        <Outlet />
      </main>
    </div>
  );
};

export default RecepcionistaLayout;