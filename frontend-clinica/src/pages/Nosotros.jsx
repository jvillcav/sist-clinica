import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import '../styles/public/nosotros.css';

/*
 * La página detecta las imágenes existentes en las carpetas habituales de
 * Nosotros. Así conserva las fotografías actuales aunque sus archivos tengan
 * nombres diferentes.
 */
const archivosNosotros = {
  ...import.meta.glob(
    '../assets/nosotros/*.{png,jpg,jpeg,webp,avif}',
    { eager: true, import: 'default' }
  ),
  ...import.meta.glob(
    '../assets/equipo/*.{png,jpg,jpeg,webp,avif}',
    { eager: true, import: 'default' }
  ),
  ...import.meta.glob(
    '../assets/doctores/*.{png,jpg,jpeg,webp,avif}',
    { eager: true, import: 'default' }
  ),
  ...import.meta.glob(
    '../assets/about/*.{png,jpg,jpeg,webp,avif}',
    { eager: true, import: 'default' }
  ),
};

const imagenPlaceholder = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
    <defs>
      <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#eaf3ff"/>
        <stop offset="1" stop-color="#c9e4ff"/>
      </linearGradient>
    </defs>
    <rect width="900" height="900" fill="url(#fondo)"/>
    <path d="M347 235c-77 0-129 61-129 142 0 64 31 104 50 147 22 50 20 141 69 141 42 0 44-86 113-86s71 86 113 86c49 0 47-91 69-141 19-43 50-83 50-147 0-81-52-142-129-142-40 0-70 16-103 16s-63-16-103-16Z" fill="#fff" stroke="#2f6fc6" stroke-width="22"/>
    <path d="M380 400h140M450 330v140" stroke="#69b4e8" stroke-width="24" stroke-linecap="round"/>
  </svg>
`)}`;

const normalizarTexto = (texto = '') =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const entradasImagenes = Object.entries(archivosNosotros).sort(([rutaA], [rutaB]) =>
  rutaA.localeCompare(rutaB)
);

const buscarImagen = (palabras) => {
  const coincidencia = entradasImagenes.find(([ruta]) => {
    const rutaNormalizada = normalizarTexto(ruta);
    return palabras.some((palabra) =>
      rutaNormalizada.includes(normalizarTexto(palabra))
    );
  });

  return coincidencia?.[1];
};

const imagenClinica =
  buscarImagen(['clinica', 'fachada', 'historia', 'local', 'interior']) ||
  entradasImagenes[0]?.[1] ||
  imagenPlaceholder;

const imagenesEquipoDisponibles = entradasImagenes
  .map(([, imagen]) => imagen)
  .filter((imagen) => imagen !== imagenClinica);

const obtenerFotoProfesional = (palabras, posicion) =>
  buscarImagen(palabras) ||
  imagenesEquipoDisponibles[posicion] ||
  imagenPlaceholder;

const valores = [
  {
    id: 'compromiso',
    numero: '01',
    titulo: 'Compromiso',
    descripcion:
      'Brindamos atención responsable y personalizada, escuchando las necesidades de cada paciente.',
    icono: 'corazon',
  },
  {
    id: 'calidad',
    numero: '02',
    titulo: 'Calidad',
    descripcion:
      'Aplicamos procedimientos seguros con criterio profesional y cuidado en cada detalle.',
    icono: 'escudo',
  },
  {
    id: 'confianza',
    numero: '03',
    titulo: 'Confianza',
    descripcion:
      'Construimos relaciones basadas en el respeto, la ética y una comunicación transparente.',
    icono: 'personas',
  },
];

const profesionales = [
  {
    id: 'alfredo-orellana',
    nombre: 'Dr. Alfredo Orellana',
    especialidad: 'Director y Ortodoncista',
    descripcion:
      'Lidera la atención clínica con una visión integral, cercana y orientada a resultados funcionales y estéticos.',
    areas: ['Ortodoncia', 'Evaluación integral', 'Planificación de tratamientos'],
    imagen: obtenerFotoProfesional(['alfredo', 'orellana'], 0),
  },
  {
    id: 'cristina-rivero',
    nombre: 'Dra. Cristina Rivero',
    especialidad: 'Odontopediatra',
    descripcion:
      'Acompaña a niñas y niños con una atención amable, preventiva y adaptada a cada etapa de crecimiento.',
    areas: ['Odontopediatría', 'Prevención infantil', 'Educación en higiene'],
    imagen: obtenerFotoProfesional(['cristina', 'rivero'], 1),
  },
  {
    id: 'pablo-maldonado',
    nombre: 'Dr. Pablo Maldonado',
    especialidad: 'Cirujano Oral',
    descripcion:
      'Realiza valoraciones y procedimientos quirúrgicos con planificación, precisión y seguimiento profesional.',
    areas: ['Cirugía oral', 'Extracciones', 'Control posoperatorio'],
    imagen: obtenerFotoProfesional(['pablo', 'maldonado'], 2),
  },
  {
    id: 'vitmar-ordonez',
    nombre: 'Dr. Vitmar Ordóñez',
    especialidad: 'Endodoncista',
    descripcion:
      'Trabaja en la conservación de piezas dentales mediante diagnósticos oportunos y tratamientos especializados.',
    areas: ['Endodoncia', 'Diagnóstico pulpar', 'Conservación dental'],
    imagen: obtenerFotoProfesional(['vitmar', 'ordonez', 'ordóñez'], 3),
  },
];

const testimonios = [
  {
    id: 'ana-martinez',
    nombre: 'Ana Martínez',
    iniciales: 'AM',
    texto: 'La atención fue excelente, muy profesional y amable.',
    tratamiento: 'Atención general',
  },
  {
    id: 'luis-fernandez',
    nombre: 'Luis Fernández',
    iniciales: 'LF',
    texto: 'Me ayudaron con mi tratamiento de forma clara y segura.',
    tratamiento: 'Tratamiento dental',
  },
  {
    id: 'carla-rios',
    nombre: 'Carla Ríos',
    iniciales: 'CR',
    texto: 'Excelente clínica, organizada y con buena atención.',
    tratamiento: 'Consulta odontológica',
  },
];

const IconoFlecha = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const IconoCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const IconoComillas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 11H5.5C5.5 7.5 7 5.5 10 4v3c-1.2.7-1.8 1.5-2 2.5h2V15H5v-4" />
    <path d="M20 11h-4.5c0-3.5 1.5-5.5 4.5-7v3c-1.2.7-1.8 1.5-2 2.5h2V15h-5v-4" />
  </svg>
);

const IconoValor = ({ tipo }) => {
  if (tipo === 'corazon') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
      </svg>
    );
  }

  if (tipo === 'personas') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14a4.5 4.5 0 0 1 4.5 4.5V20" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
};

const Nosotros = () => {
  const [profesionalActivo, setProfesionalActivo] = useState(profesionales[0]);
  const [testimonioActivo, setTestimonioActivo] = useState(0);
  const [carruselPausado, setCarruselPausado] = useState(false);
  const paginaRef = useRef(null);

  useEffect(() => {
    const elementos =
      paginaRef.current?.querySelectorAll('[data-about-reveal]') ?? [];

    if (!('IntersectionObserver' in window)) {
      elementos.forEach((elemento) => elemento.classList.add('is-visible'));
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
      { threshold: 0.13, rootMargin: '0px 0px -35px' }
    );

    elementos.forEach((elemento) => observador.observe(elemento));

    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (carruselPausado) return undefined;

    const intervalo = window.setInterval(() => {
      setTestimonioActivo(
        (indiceActual) => (indiceActual + 1) % testimonios.length
      );
    }, 6500);

    return () => window.clearInterval(intervalo);
  }, [carruselPausado]);

  const moverTestimonio = (direccion) => {
    setTestimonioActivo((indiceActual) => {
      const nuevoIndice = indiceActual + direccion;
      return (nuevoIndice + testimonios.length) % testimonios.length;
    });
  };

  const testimonio = testimonios[testimonioActivo];

  return (
    <main className="about-page" ref={paginaRef}>
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-shell about-hero__grid">
          <div className="about-hero__content">
            <span className="about-eyebrow">CONÓCENOS</span>

            <h1 id="about-title">
              Experiencia que cuida <span>cada sonrisa</span>
            </h1>

            <p>
              En la Clínica Odontológica Orellana combinamos atención cercana,
              experiencia profesional y tratamientos personalizados para
              acompañar la salud bucal de las familias de Shinahota.
            </p>

            <div className="about-hero__actions">
              <Link to="/contactanos" className="about-button about-button--primary">
                Solicitar una cita
                <IconoFlecha />
              </Link>

              <a
                href="tel:+59168869660"
                className="about-button about-button--ghost"
              >
                Llamar a la clínica
              </a>
            </div>
          </div>

          <div className="about-hero__stats" aria-label="Datos de la clínica">
            <article className="about-hero__stat about-hero__stat--featured">
              <strong>5+</strong>
              <span>Años de experiencia</span>
              <p>Cuidando sonrisas con atención profesional y cercana.</p>
            </article>

            <article className="about-hero__stat">
              <strong>4</strong>
              <span>Profesionales</span>
            </article>

            <article className="about-hero__stat">
              <strong>6</strong>
              <span>Especialidades</span>
            </article>
          </div>
        </div>

        <a className="about-hero__scroll" href="#nuestra-historia">
          <span />
          Descubre nuestra historia
        </a>
      </section>

      <section
        className="about-history about-shell"
        id="nuestra-historia"
        data-about-reveal
      >
        <div className="about-history__content">
          <span className="about-section-label">NUESTRA HISTORIA</span>
          <h2>Una clínica construida alrededor de las personas</h2>

          <p>
            La Clínica Odontológica Orellana nace con la finalidad de ofrecer
            atención dental integral a familias de Shinahota y la región,
            priorizando la prevención, el diagnóstico oportuno y el cuidado
            personalizado de cada paciente.
          </p>

          <p>
            A lo largo de los años, la clínica se ha consolidado como un espacio
            de confianza, combinando experiencia profesional, atención cercana
            y herramientas que fortalecen la gestión y el seguimiento de los
            tratamientos.
          </p>

          <ul className="about-history__features">
            <li>
              <span>
                <IconoCheck />
              </span>
              Atención personalizada para cada paciente
            </li>
            <li>
              <span>
                <IconoCheck />
              </span>
              Prevención y diagnóstico oportuno
            </li>
            <li>
              <span>
                <IconoCheck />
              </span>
              Seguimiento responsable de tratamientos
            </li>
          </ul>
        </div>

        <div className="about-history__visual">
          <div className="about-history__image">
            <img
              src={imagenClinica}
              alt="Fachada de la Clínica Odontológica Orellana"
              onError={(evento) => {
                evento.currentTarget.src = imagenPlaceholder;
              }}
            />
          </div>

          <div className="about-history__badge">
            <strong>5+</strong>
            <span>Años acompañando a nuestros pacientes</span>
          </div>

          <div className="about-history__note">
            <span aria-hidden="true">●</span>
            Shinahota, Cochabamba
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="about-shell">
          <header className="about-heading" data-about-reveal>
            <span className="about-section-label">LO QUE NOS DEFINE</span>
            <h2>Valores presentes en cada atención</h2>
            <p>
              Nuestra manera de trabajar se refleja tanto en el tratamiento
              clínico como en la relación que construimos con cada paciente.
            </p>
          </header>

          <div className="about-values__grid">
            {valores.map((valor, indice) => (
              <article
                className="about-value-card"
                key={valor.id}
                data-about-reveal
                style={{ '--about-delay': `${indice * 90}ms` }}
              >
                <div className="about-value-card__top">
                  <span className="about-value-card__icon">
                    <IconoValor tipo={valor.icono} />
                  </span>
                  <span className="about-value-card__number">
                    {valor.numero}
                  </span>
                </div>

                <h3>{valor.titulo}</h3>
                <p>{valor.descripcion}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-team about-shell" id="nuestro-equipo">
        <header className="about-heading" data-about-reveal>
          <span className="about-section-label">NUESTRO EQUIPO</span>
          <h2>Profesionales que cuidan de ti</h2>
          <p>
            Selecciona a un profesional para conocer su área de atención.
          </p>
        </header>

        <div className="about-team__grid">
          {profesionales.map((profesional, indice) => {
            const estaActivo = profesionalActivo.id === profesional.id;

            return (
              <button
                type="button"
                className={`about-doctor-card ${
                  estaActivo ? 'about-doctor-card--active' : ''
                }`}
                key={profesional.id}
                onClick={() => setProfesionalActivo(profesional)}
                aria-pressed={estaActivo}
                data-about-reveal
                style={{ '--about-delay': `${indice * 80}ms` }}
              >
                <span className="about-doctor-card__image">
                  <img
                    src={profesional.imagen}
                    alt={profesional.nombre}
                    onError={(evento) => {
                      evento.currentTarget.src = imagenPlaceholder;
                    }}
                  />

                  <span className="about-doctor-card__status">
                    <i />
                    Disponible
                  </span>
                </span>

                <span className="about-doctor-card__content">
                  <strong>{profesional.nombre}</strong>
                  <small>{profesional.especialidad}</small>
                  <span>
                    Ver perfil
                    <IconoFlecha />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <article
          className="about-team-profile"
          key={profesionalActivo.id}
          aria-live="polite"
        >
          <div className="about-team-profile__identity">
            <span className="about-team-profile__avatar">
              <img
                src={profesionalActivo.imagen}
                alt=""
                onError={(evento) => {
                  evento.currentTarget.src = imagenPlaceholder;
                }}
              />
            </span>

            <div>
              <span>PERFIL PROFESIONAL</span>
              <h3>{profesionalActivo.nombre}</h3>
              <strong>{profesionalActivo.especialidad}</strong>
            </div>
          </div>

          <p>{profesionalActivo.descripcion}</p>

          <ul>
            {profesionalActivo.areas.map((area) => (
              <li key={area}>
                <IconoCheck />
                {area}
              </li>
            ))}
          </ul>

          <Link to="/contactanos">
            Consultar disponibilidad
            <IconoFlecha />
          </Link>
        </article>
      </section>

      <section className="about-testimonials">
        <div className="about-shell about-testimonials__grid">
          <div className="about-testimonials__heading" data-about-reveal>
            <span className="about-section-label">TESTIMONIOS</span>
            <h2>La confianza de nuestros pacientes</h2>
            <p>
              Cada experiencia nos motiva a continuar ofreciendo una atención
              humana, clara y responsable.
            </p>

            <div className="about-testimonials__controls">
              <button
                type="button"
                onClick={() => moverTestimonio(-1)}
                aria-label="Ver testimonio anterior"
              >
                <IconoFlecha />
              </button>

              <button
                type="button"
                onClick={() => moverTestimonio(1)}
                aria-label="Ver testimonio siguiente"
              >
                <IconoFlecha />
              </button>
            </div>
          </div>

          <div
            className="about-testimonial"
            data-about-reveal
            onMouseEnter={() => setCarruselPausado(true)}
            onMouseLeave={() => setCarruselPausado(false)}
            onFocus={() => setCarruselPausado(true)}
            onBlur={() => setCarruselPausado(false)}
          >
            <span className="about-testimonial__quote">
              <IconoComillas />
            </span>

            <div className="about-testimonial__stars" aria-label="5 de 5 estrellas">
              ★ ★ ★ ★ ★
            </div>

            <blockquote key={testimonio.id}>“{testimonio.texto}”</blockquote>

            <div className="about-testimonial__author">
              <span>{testimonio.iniciales}</span>
              <div>
                <strong>{testimonio.nombre}</strong>
                <small>{testimonio.tratamiento}</small>
              </div>
            </div>

            <div className="about-testimonial__dots" aria-label="Elegir testimonio">
              {testimonios.map((item, indice) => (
                <button
                  type="button"
                  key={item.id}
                  className={indice === testimonioActivo ? 'is-active' : ''}
                  onClick={() => setTestimonioActivo(indice)}
                  aria-label={`Ver testimonio de ${item.nombre}`}
                  aria-current={indice === testimonioActivo ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta about-shell" data-about-reveal>
        <div>
          <span>ESTAMOS PARA AYUDARTE</span>
          <h2>Tu próxima sonrisa puede comenzar hoy</h2>
          <p>
            Conoce nuestros tratamientos o solicita una cita con nuestro equipo.
          </p>
        </div>

        <div className="about-cta__actions">
          <Link to="/contactanos" className="about-button about-button--light">
            Solicitar una cita
            <IconoFlecha />
          </Link>

          <Link to="/servicios" className="about-button about-button--outline">
            Ver servicios
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Nosotros;