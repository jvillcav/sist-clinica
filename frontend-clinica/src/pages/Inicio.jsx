import { Link } from 'react-router-dom';
import inicioPortada from '../assets/inicio/inicio-portada.png';
import atencionPro from '../assets/inicio/atencionProfesional.png';
import tratamientosInt from '../assets/inicio/tratamientosIntegrales.png';
import reservaCitas from '../assets/inicio/reservaCitas.png';
import '../styles/public/inicio.css';

const beneficios = [
  {
    titulo: 'Atención profesional',
    descripcion:
      'Equipo capacitado para brindar tratamientos seguros, cercanos y confiables.',
    imagen: atencionPro,
    alt: 'Profesional de la Clínica Odontológica Orellana atendiendo a un paciente',
  },
  {
    titulo: 'Tratamientos integrales',
    descripcion:
      'Servicios odontológicos preventivos, correctivos y estéticos para toda la familia.',
    imagen: tratamientosInt,
    alt: 'Tratamiento odontológico integral realizado en la clínica',
  },
  {
    titulo: 'Reserva de citas',
    descripcion:
      'Solicita tu atención de forma rápida y sencilla desde nuestro portal web.',
    imagen: reservaCitas,
    alt: 'Reserva digital de una cita odontológica',
  },
];

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="home-check-icon"
  >
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="home-arrow-icon"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Inicio = () => {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__decoration home-hero__decoration--one" />
        <div className="home-hero__decoration home-hero__decoration--two" />

        <div className="home-container home-hero__grid">
          <div className="home-hero__content">
            <p className="home-eyebrow">
              <span aria-hidden="true" />
              Clínica Odontológica Orellana
            </p>

            <h1 id="home-title">
              Dientes sanos,
              <span> corazones felices.</span>
              <small>Esa es nuestra misión.</small>
            </h1>

            <p className="home-hero__description">
              Atención odontológica integral, prevención y tratamientos
              personalizados para cuidar la sonrisa de toda tu familia.
            </p>

            <div className="home-hero__actions">
              <Link
                to="/contactanos"
                className="home-button home-button--primary"
              >
                Agendar cita
                <ArrowIcon />
              </Link>

              <Link
                to="/servicios"
                className="home-button home-button--secondary"
              >
                Ver servicios
              </Link>
            </div>

            <ul className="home-hero__features" aria-label="Beneficios principales">
              <li>
                <CheckIcon />
                Atención personalizada
              </li>
              <li>
                <CheckIcon />
                Citas organizadas
              </li>
              <li>
                <CheckIcon />
                Trato profesional
              </li>
            </ul>
          </div>

          <div className="home-hero__visual">
            <div className="home-hero__image-frame">
              <img
                src={inicioPortada}
                alt="Instalaciones y atención de la Clínica Odontológica Orellana"
                className="home-hero__image"
              />
            </div>

            <div className="home-experience-card">
              <span className="home-experience-card__number">5+</span>
              <span className="home-experience-card__text">
                Años cuidando
                <strong>sonrisas</strong>
              </span>
            </div>

            <div className="home-care-badge">
              <span className="home-care-badge__icon" aria-hidden="true">
                ✦
              </span>
              <span>
                Atención
                <strong>integral</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-benefits" aria-labelledby="benefits-title">
        <div className="home-container">
          <header className="home-section-heading">
            <p>Tu bienestar es nuestra prioridad</p>
            <h2 id="benefits-title">¿Por qué elegirnos?</h2>
            <span>
              Combinamos atención humana, experiencia profesional y herramientas
              digitales para ofrecerte un mejor servicio.
            </span>
          </header>

          <div className="home-benefits__grid">
            {beneficios.map((beneficio, index) => (
              <article
                className="home-benefit-card"
                key={beneficio.titulo}
                style={{ '--card-delay': `${index * 120}ms` }}
              >
                <div className="home-benefit-card__image-wrapper">
                  <img
                    src={beneficio.imagen}
                    alt={beneficio.alt}
                    className="home-benefit-card__image"
                  />
                  <span className="home-benefit-card__number">
                    0{index + 1}
                  </span>
                </div>

                <div className="home-benefit-card__content">
                  <h3>{beneficio.titulo}</h3>
                  <p>{beneficio.descripcion}</p>
                  <Link to="/servicios" className="home-benefit-card__link">
                    Conocer más
                    <ArrowIcon />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta" aria-labelledby="home-cta-title">
        <div className="home-container home-cta__content">
          <div>
            <p>Estamos listos para atenderte</p>
            <h2 id="home-cta-title">Tu próxima sonrisa comienza aquí</h2>
            <span>
              Solicita una cita y recibe una atención pensada especialmente para
              ti.
            </span>
          </div>

          <Link to="/contactanos" className="home-button home-button--light">
            Solicitar una cita
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Inicio;