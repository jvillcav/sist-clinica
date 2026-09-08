import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import odontologia from '../assets/services/odontologia-general.png';
import blanqueamiento from '../assets/services/blanqueamiento.png';
import ortodoncia from '../assets/services/ortodoncia.png';
import cirugia from '../assets/services/cirugia-oral.png';
import endodoncia from '../assets/services/endodoncia.png';
import odontopediatria from '../assets/services/odontopediatria.png';
import '../styles/public/servicios.css';

const categorias = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'prevencion', nombre: 'Prevención' },
  { id: 'estetica', nombre: 'Estética' },
  { id: 'especialidad', nombre: 'Especialidades' },
  { id: 'infantil', nombre: 'Infantil' },
];

const servicios = [
  {
    id: 'odontologia-general',
    titulo: 'Odontología General',
    descripcion:
      'Evaluación bucodental, limpiezas, restauraciones simples y control preventivo para mantener una buena salud oral.',
    precio: 'Desde Bs 80',
    imagen: odontologia,
    categoria: 'prevencion',
    etiqueta: 'Cuidado integral',
    duracion: '30–45 min',
    beneficios: [
      'Evaluación completa de la salud bucal',
      'Prevención y detección temprana',
      'Plan de tratamiento personalizado',
    ],
  },
  {
    id: 'blanqueamiento-dental',
    titulo: 'Blanqueamiento Dental',
    descripcion:
      'Tratamiento estético profesional para aclarar el tono dental y mejorar la apariencia de la sonrisa.',
    precio: 'Desde Bs 100',
    imagen: blanqueamiento,
    categoria: 'estetica',
    etiqueta: 'Sonrisa luminosa',
    duracion: '45–60 min',
    beneficios: [
      'Procedimiento profesional y controlado',
      'Mejora visible del tono dental',
      'Orientación para prolongar el resultado',
    ],
  },
  {
    id: 'ortodoncia',
    titulo: 'Ortodoncia',
    descripcion:
      'Corrección de la posición dental mediante aparatología fija o removible para mejorar función y estética.',
    precio: 'Desde Bs 500',
    imagen: ortodoncia,
    categoria: 'especialidad',
    etiqueta: 'Alineación dental',
    duracion: '40–60 min',
    beneficios: [
      'Evaluación de mordida y alineación',
      'Alternativas adaptadas a cada paciente',
      'Seguimiento periódico del tratamiento',
    ],
  },
  {
    id: 'cirugia-oral',
    titulo: 'Cirugía Oral',
    descripcion:
      'Extracciones dentales, procedimientos quirúrgicos menores y atención especializada en tejidos bucales.',
    precio: 'Desde Bs 250',
    imagen: cirugia,
    categoria: 'especialidad',
    etiqueta: 'Atención especializada',
    duracion: 'Según evaluación',
    beneficios: [
      'Valoración clínica previa',
      'Procedimientos con cuidado especializado',
      'Indicaciones y control posoperatorio',
    ],
  },
  {
    id: 'endodoncia',
    titulo: 'Endodoncia',
    descripcion:
      'Tratamiento de conductos para conservar piezas dentales afectadas por caries profunda o infección pulpar.',
    precio: 'Desde Bs 100',
    imagen: endodoncia,
    categoria: 'especialidad',
    etiqueta: 'Conservación dental',
    duracion: '60–90 min',
    beneficios: [
      'Tratamiento orientado a conservar la pieza',
      'Control del dolor y la infección',
      'Evaluación y seguimiento clínico',
    ],
  },
  {
    id: 'odontopediatria',
    titulo: 'Odontopediatría',
    descripcion:
      'Atención odontológica especializada para niños, prevención de caries y educación en higiene bucal.',
    precio: 'Desde Bs 100',
    imagen: odontopediatria,
    categoria: 'infantil',
    etiqueta: 'Cuidado infantil',
    duracion: '30–45 min',
    beneficios: [
      'Atención amable y adaptada a niños',
      'Prevención temprana de caries',
      'Educación en hábitos de higiene bucal',
    ],
  },
];

const serviciosAdicionales = [
  {
    titulo: 'Periodoncia',
    descripcion: 'Cuidado especializado de encías.',
  },
  {
    titulo: 'Prótesis Dental',
    descripcion: 'Recuperación estética y funcional.',
  },
  {
    titulo: 'Estética Dental',
    descripcion: 'Alternativas para mejorar tu sonrisa.',
  },
  {
    titulo: 'Implantología',
    descripcion: 'Evaluación para reemplazo de piezas.',
  },
];

const normalizarTexto = (texto = '') =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const IconoBusqueda = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const IconoReloj = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconoFlecha = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const Servicios = () => {
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const paginaRef = useRef(null);
  const botonCerrarRef = useRef(null);

  const serviciosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return servicios.filter((servicio) => {
      const coincideCategoria =
        categoriaActiva === 'todos' ||
        servicio.categoria === categoriaActiva;

      const contenido = normalizarTexto(
        `${servicio.titulo} ${servicio.descripcion} ${servicio.etiqueta}`
      );

      return coincideCategoria && contenido.includes(termino);
    });
  }, [busqueda, categoriaActiva]);

  useEffect(() => {
    const tarjetas =
      paginaRef.current?.querySelectorAll('[data-service-card]') ?? [];

    if (!('IntersectionObserver' in window)) {
      tarjetas.forEach((tarjeta) => tarjeta.classList.add('is-visible'));
      return undefined;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible');
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    tarjetas.forEach((tarjeta) => observador.observe(tarjeta));

    return () => observador.disconnect();
  }, [serviciosFiltrados]);

  useEffect(() => {
    if (!servicioSeleccionado) return undefined;

    const elementoAnterior = document.activeElement;

    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') {
        setServicioSeleccionado(null);
      }
    };

    document.body.classList.add('services-modal-open');
    window.addEventListener('keydown', cerrarConEscape);
    window.requestAnimationFrame(() => botonCerrarRef.current?.focus());

    return () => {
      document.body.classList.remove('services-modal-open');
      window.removeEventListener('keydown', cerrarConEscape);
      elementoAnterior?.focus?.();
    };
  }, [servicioSeleccionado]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaActiva('todos');
  };

  const cerrarModalAlPulsarFondo = (evento) => {
    if (evento.target === evento.currentTarget) {
      setServicioSeleccionado(null);
    }
  };

  return (
    <main className="services-page" ref={paginaRef}>
      <section className="services-hero" aria-labelledby="services-title">
        <div className="services-shell services-hero__content">
          <span className="services-eyebrow">CUIDAMOS TU SONRISA</span>

          <h1 id="services-title">Nuestros Servicios</h1>

          <p>
            Ofrecemos tratamientos odontológicos integrales orientados a la
            prevención, el diagnóstico y el cuidado personalizado de cada
            paciente.
          </p>

          <div className="services-hero__features" aria-label="Beneficios">
            <span>
              <i aria-hidden="true">✓</i>
              Atención personalizada
            </span>
            <span>
              <i aria-hidden="true">✓</i>
              Profesionales capacitados
            </span>
            <span>
              <i aria-hidden="true">✓</i>
              Primera consulta gratis
            </span>
          </div>
        </div>
      </section>

      <section
        className="services-catalog services-shell"
        aria-labelledby="catalog-title"
      >
        <div className="services-catalog__heading">
          <div>
            <span className="services-section-label">TRATAMIENTOS</span>
            <h2 id="catalog-title">Encuentra el servicio que necesitas</h2>
          </div>

          <p>
            Explora las opciones disponibles o utiliza los filtros para
            encontrar rápidamente un tratamiento.
          </p>
        </div>

        <div className="services-controls">
          <label className="services-search">
            <span className="services-search__icon">
              <IconoBusqueda />
            </span>
            <span className="sr-only">Buscar un servicio</span>
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar un servicio..."
            />

            {busqueda && (
              <button
                type="button"
                className="services-search__clear"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </label>

          <div className="services-filters" aria-label="Filtrar por categoría">
            {categorias.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                className={
                  categoriaActiva === categoria.id
                    ? 'services-filter is-active'
                    : 'services-filter'
                }
                onClick={() => setCategoriaActiva(categoria.id)}
                aria-pressed={categoriaActiva === categoria.id}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="services-results" aria-live="polite">
          <strong>{serviciosFiltrados.length}</strong>
          {serviciosFiltrados.length === 1
            ? ' servicio encontrado'
            : ' servicios encontrados'}
        </div>

        {serviciosFiltrados.length > 0 ? (
          <div className="services-grid">
            {serviciosFiltrados.map((servicio, indice) => (
              <article
                className="service-card"
                key={servicio.id}
                data-service-card
                style={{ '--service-index': indice }}
              >
                <div className="service-card__media">
                  <img
                    src={servicio.imagen}
                    alt={servicio.titulo}
                    className="service-card__image"
                  />
                  <div className="service-card__overlay" aria-hidden="true" />

                  <span className="service-card__number" aria-hidden="true">
                    {String(
                      servicios.findIndex((item) => item.id === servicio.id) + 1
                    ).padStart(2, '0')}
                  </span>

                  <span className="service-card__tag">
                    {servicio.etiqueta}
                  </span>
                </div>

                <div className="service-card__body">
                  <h3>{servicio.titulo}</h3>
                  <p>{servicio.descripcion}</p>

                  <div className="service-card__meta">
                    <span>
                      <IconoReloj />
                      {servicio.duracion}
                    </span>
                    <strong>{servicio.precio}</strong>
                  </div>

                  <div className="service-card__actions">
                    <button
                      type="button"
                      className="service-card__details"
                      onClick={() => setServicioSeleccionado(servicio)}
                      aria-label={`Ver detalles de ${servicio.titulo}`}
                    >
                      Ver detalles
                    </button>

                    <Link
                      to="/contactanos"
                      className="service-card__contact"
                      aria-label={`Solicitar información sobre ${servicio.titulo}`}
                    >
                      Más información
                      <IconoFlecha />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="services-empty">
            <span aria-hidden="true">⌕</span>
            <h3>No encontramos ese servicio</h3>
            <p>
              Intenta con otro nombre o restablece los filtros para ver todos
              nuestros tratamientos.
            </p>
            <button type="button" onClick={limpiarFiltros}>
              Ver todos los servicios
            </button>
          </div>
        )}
      </section>

      <section
        className="extra-services-section services-shell"
        aria-labelledby="extra-services-title"
      >
        <div className="extra-services-content">
          <span className="services-section-label">OTRAS ESPECIALIDADES</span>
          <h2 id="extra-services-title">
            ¿No encuentras el servicio que buscas?
          </h2>
          <p>
            Contáctanos y te ayudaremos a identificar el tratamiento más
            adecuado para tus necesidades.
          </p>

          <Link to="/contactanos" className="specialist-button">
            Contactar con un especialista
            <IconoFlecha />
          </Link>
        </div>

        <div className="extra-services-list">
          {serviciosAdicionales.map((servicio, indice) => (
            <article key={servicio.titulo}>
              <span aria-hidden="true">
                {String(indice + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>{servicio.titulo}</h3>
                <p>{servicio.descripcion}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="free-consultation-section services-shell">
        <div>
          <span>PRIMERA CONSULTA</span>
          <h2>Empieza hoy a cuidar tu sonrisa</h2>
          <p>
            Agenda tu primera consulta gratis y recibe una evaluación completa
            de tu salud bucal.
          </p>
        </div>

        <Link to="/contactanos">
          Agendar ahora
          <IconoFlecha />
        </Link>
      </section>

      {servicioSeleccionado && (
        <div
          className="service-modal"
          role="presentation"
          onMouseDown={cerrarModalAlPulsarFondo}
        >
          <section
            className="service-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            aria-describedby="service-modal-description"
          >
            <button
              ref={botonCerrarRef}
              type="button"
              className="service-modal__close"
              onClick={() => setServicioSeleccionado(null)}
              aria-label="Cerrar detalles del servicio"
            >
              ×
            </button>

            <div className="service-modal__media">
              <img
                src={servicioSeleccionado.imagen}
                alt={servicioSeleccionado.titulo}
              />
              <span>{servicioSeleccionado.etiqueta}</span>
            </div>

            <div className="service-modal__content">
              <span className="services-section-label">
                INFORMACIÓN DEL SERVICIO
              </span>
              <h2 id="service-modal-title">
                {servicioSeleccionado.titulo}
              </h2>
              <p id="service-modal-description">
                {servicioSeleccionado.descripcion}
              </p>

              <div className="service-modal__summary">
                <span>
                  <small>Precio referencial</small>
                  <strong>{servicioSeleccionado.precio}</strong>
                </span>
                <span>
                  <small>Duración estimada</small>
                  <strong>{servicioSeleccionado.duracion}</strong>
                </span>
              </div>

              <h3>Este servicio incluye</h3>
              <ul>
                {servicioSeleccionado.beneficios.map((beneficio) => (
                  <li key={beneficio}>
                    <i aria-hidden="true">✓</i>
                    {beneficio}
                  </li>
                ))}
              </ul>

              <Link
                to="/contactanos"
                className="service-modal__action"
                onClick={() => setServicioSeleccionado(null)}
              >
                Solicitar información
                <IconoFlecha />
              </Link>

              <small className="service-modal__note">
                El precio y la duración pueden variar según la evaluación
                profesional de cada paciente.
              </small>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default Servicios;