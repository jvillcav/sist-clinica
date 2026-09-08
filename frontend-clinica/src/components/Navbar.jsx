import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo2 from '../assets/inicio/logo-orellana2.png';
import '../styles/navbar.css';

const enlaces = [
  { nombre: 'INICIO', ruta: '/', exacto: true },
  { nombre: 'SERVICIOS', ruta: '/servicios' },
  { nombre: 'INICIAR SESIÓN', ruta: '/login' },
  { nombre: 'CONTÁCTANOS', ruta: '/contactanos' },
  { nombre: 'NOSOTROS', ruta: '/nosotros' },
];

const Navbar = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [navbarReducido, setNavbarReducido] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const controlarScroll = () => {
      setNavbarReducido(window.scrollY > 20);
    };

    controlarScroll();
    window.addEventListener('scroll', controlarScroll);

    return () => {
      window.removeEventListener('scroll', controlarScroll);
    };
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuAbierto(false);
      }
    };

    window.addEventListener('keydown', cerrarConEscape);

    return () => {
      window.removeEventListener('keydown', cerrarConEscape);
    };
  }, []);

  const claseEnlace = ({ isActive }) =>
    `public-navbar__link ${
      isActive ? 'public-navbar__link--active' : ''
    }`;

  return (
    <header
      className={`public-navbar ${
        navbarReducido ? 'public-navbar--scrolled' : ''
      }`}
    >
      <div className="public-navbar__container">
        <NavLink
          to="/"
          end
          className="public-navbar__brand"
          aria-label="Ir al inicio"
        >
          <img
            src={logo2}
            alt="Logo de la Clínica Odontológica Orellana"
            className="public-navbar__logo"
          />

          <span className="public-navbar__brand-text">
            <strong>CLÍNICA</strong>
            <small>ODONTOLÓGICA ORELLANA</small>
          </span>
        </NavLink>

        <nav
          id="public-navigation"
          className={`public-navbar__menu ${
            menuAbierto ? 'public-navbar__menu--open' : ''
          }`}
          aria-label="Navegación principal"
        >
          <div className="public-navbar__links">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.ruta}
                to={enlace.ruta}
                end={enlace.exacto}
                className={claseEnlace}
                onClick={() => setMenuAbierto(false)}
              >
                {enlace.nombre}
              </NavLink>
            ))}
          </div>

          <a
            href="tel:+59168869660"
            className="public-navbar__phone public-navbar__phone--mobile"
          >
            <span aria-hidden="true">☎</span>
            +591 688 69660
          </a>
        </nav>

        <a
          href="tel:+59168869660"
          className="public-navbar__phone public-navbar__phone--desktop"
          aria-label="Llamar al 688 69660"
        >
          <span aria-hidden="true">☎</span>
          +591 688 69660
        </a>

        <button
          type="button"
          className={`public-navbar__toggle ${
            menuAbierto ? 'public-navbar__toggle--open' : ''
          }`}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="public-navigation"
          onClick={() => setMenuAbierto((estado) => !estado)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
};

export default Navbar;