import { Link } from 'react-router-dom';
import logoOrellana from '../assets/inicio/logo-orellana.png';
import telefonoIcono from '../assets/contact/telefono.png';
import '../styles/footer.css';

/*
 * Agrega aquí los datos oficiales cuando la clínica los confirme.
 * Si el valor queda vacío, el enlace no se muestra y no se publica información falsa.
 */
const correoClinica = '';

const redesSociales = [
  {
    nombre: 'WhatsApp',
    url: 'https://wa.me/59168869660',
    icono: telefonoIcono,
  },
  {
    nombre: 'Facebook',
    url: '',
    letra: 'f',
  },
  {
    nombre: 'Instagram',
    url: '',
    letra: '◎',
  },
];

const LocationIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const PhoneIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

const MailIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const Footer = () => {
  const redesDisponibles = redesSociales.filter((red) => red.url);

  return (
    <footer className="site-footer">
      <div className="site-footer__glow" aria-hidden="true" />

      <div className="site-footer__container">
        <div className="site-footer__grid">
          <section
            className="site-footer__brand"
            aria-labelledby="footer-clinic-name"
          >
            <Link to="/" className="site-footer__logo-link">
              <img
                src={logoOrellana}
                alt="Logo de la Clínica Odontológica Orellana"
                className="site-footer__logo"
              />
              <span id="footer-clinic-name">
                Clínica Odontológica
                <strong>Orellana</strong>
              </span>
            </Link>

            <p>
              Cuidamos tu salud bucal con atención profesional, cercana y
              personalizada para toda la familia.
            </p>

            {redesDisponibles.length > 0 && (
              <div className="site-footer__socials" aria-label="Redes sociales">
                {redesDisponibles.map((red) => (
                  <a
                    href={red.url}
                    key={red.nombre}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={red.nombre}
                    title={red.nombre}
                  >
                    {red.icono ? (
  <img
    src={red.icono}
    alt=""
    className="site-footer__social-icon"
  />
) : (
  red.letra
)}
                  </a>
                ))}
              </div>
            )}
          </section>

          <nav className="site-footer__column" aria-label="Enlaces del sitio">
            <h2>Enlaces rápidos</h2>
            <ul>
              <li>
                <Link to="/">Inicio</Link>
              </li>
              <li>
                <Link to="/servicios">Servicios</Link>
              </li>
              <li>
                <Link to="/nosotros">Nosotros</Link>
              </li>
              <li>
                <Link to="/contactanos">Contáctanos</Link>
              </li>
              <li>
                <Link to="/login">Iniciar sesión</Link>
              </li>
            </ul>
          </nav>

          <section className="site-footer__column">
            <h2>Servicios</h2>
            <ul>
              <li>
                <Link to="/servicios">Odontología general</Link>
              </li>
              <li>
                <Link to="/servicios">Blanqueamiento dental</Link>
              </li>
              <li>
                <Link to="/servicios">Ortodoncia</Link>
              </li>
              <li>
                <Link to="/servicios">Endodoncia</Link>
              </li>
              <li>
                <Link to="/servicios">Odontopediatría</Link>
              </li>
            </ul>
          </section>

          <section className="site-footer__column site-footer__contact">
            <h2>Contacto</h2>

            <address>
              <div className="site-footer__contact-item">
                <span className="site-footer__contact-icon">
                  <LocationIcon />
                </span>
                <span>
                  Av. Cochabamba–Santa Cruz
                  <strong>Shinahota, Cochabamba</strong>
                </span>
              </div>

              <a
                href="tel:+59168869660"
                className="site-footer__contact-item"
              >
                <span className="site-footer__contact-icon">
                  <PhoneIcon />
                </span>
                <span>
                  Llámanos
                  <strong>+591 688 69660</strong>
                </span>
              </a>

              {correoClinica && (
                <a
                  href={`mailto:${correoClinica}`}
                  className="site-footer__contact-item"
                >
                  <span className="site-footer__contact-icon">
                    <MailIcon />
                  </span>
                  <span>
                    Escríbenos
                    <strong>{correoClinica}</strong>
                  </span>
                </a>
              )}
            </address>
          </section>
        </div>

        <div className="site-footer__bottom">
          <p>
            © 2026 Clínica Odontológica Orellana. Todos los derechos reservados.
          </p>
          <p>Shinahota, Bolivia</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
