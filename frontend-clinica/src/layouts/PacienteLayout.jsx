import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import logo from '../assets/inicio/logo-orellana.png';

const PacienteLayout = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const iniciales = (nombre = '') =>
    nombre
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const perfilRef = useRef(null);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
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

    document.addEventListener('mousedown', cerrarMenuExterior);

    return () => {
      document.removeEventListener('mousedown', cerrarMenuExterior);
    };
  }, [menuPerfilAbierto]);

  return (
    <div className="patient-portal-modern">
      <header className="patient-topbar">
        <div className="patient-brand">
          <img src={logo} alt="Logo Clínica Orellana" />
          <div>
            <strong>Clínica Orellana</strong>
            <span>Portal del Paciente</span>
          </div>
        </div>

        <nav className="patient-topnav">
          <NavLink to="/paciente/inicio">Inicio</NavLink>
          <NavLink to="/paciente/agendar">Agendar Cita</NavLink>
          <NavLink to="/paciente/mis-citas">Mis Citas</NavLink>
          <NavLink to="/paciente/expediente">Expediente</NavLink>
          <NavLink to="/paciente/perfil">Mi Perfil</NavLink>
        </nav>

        <div className="patient-actions" ref={perfilRef}>
          <button className="notification-btn" aria-label="Notificaciones">
            🔔
          </button>

          <button
            className="patient-avatar-btn patient-avatar-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuPerfilAbierto}
            onClick={() =>
              setMenuPerfilAbierto((abierto) => !abierto)
            }
          >
            {iniciales(usuario?.nombre || 'Paciente')}
          </button>

          {menuPerfilAbierto && (
            <div className="patient-profile-menu">
              <header>
                <span className="patient-avatar large">
                  {iniciales(usuario?.nombre || 'Paciente')}
                </span>
                <div>
                  <strong>{usuario?.nombre || 'Paciente'}</strong>
                  <small>{usuario?.email || 'Sin correo registrado'}</small>
                </div>
              </header>

              <button
                type="button"
                className="patient-profile-menu-item"
                onClick={() => {
                  setMenuPerfilAbierto(false);
                  navigate('/paciente/perfil');
                }}
              >
                Mi perfil
              </button>

              <button
                type="button"
                className="patient-profile-menu-item logout"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="patient-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default PacienteLayout;