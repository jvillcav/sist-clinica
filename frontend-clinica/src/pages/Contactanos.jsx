import { useEffect, useMemo, useRef, useState } from 'react';

import telefono from '../assets/contact/telefono.png';
import emailImg from '../assets/contact/email.png';
import direccion from '../assets/contact/direccion.png';
import mapa from '../assets/contact/mapa.png';

import api from '../api/axios';
import '../styles/public/contactanos.css';

const formularioInicial = {
  nombre: '',
  apellido: '',
  ci: '',
  email: '',
  telefono: '',
  servicio: 'Odontología General',
  fecha: '',
  hora: '',
  mensaje: '',
};

const servicios = [
  'Odontología General',
  'Blanqueamiento Dental',
  'Ortodoncia',
  'Cirugía Oral',
  'Endodoncia',
  'Odontopediatría',
];

const canalesContacto = [
  {
    id: 'telefono',
    imagen: telefono,
    alt: 'Teléfono y WhatsApp',
    etiqueta: 'ATENCIÓN DIRECTA',
    titulo: 'Teléfono y WhatsApp',
    lineas: [
      {
        texto: '+591 688 69660',
        enlace: 'tel:+59168869660',
      },
      {
        texto: '+591 764 56789',
        enlace: 'tel:+59176456789',
      },
    ],
    accion: 'Realizar una llamada',
    enlaceAccion: 'tel:+59168869660',
  },
  {
    id: 'email',
    imagen: emailImg,
    alt: 'Correo electrónico',
    etiqueta: 'ESCRÍBENOS',
    titulo: 'Correo electrónico',
    lineas: [
      {
        texto: 'orellana42@gmail.com',
        enlace: 'mailto:orellana42@gmail.com',
      },
      {
        texto: 'dentalclinic@gmail.com',
        enlace: 'mailto:dentalclinic@gmail.com',
      },
    ],
    accion: 'Enviar un correo',
    enlaceAccion: 'mailto:orellana42@gmail.com',
  },
  {
    id: 'direccion',
    imagen: direccion,
    alt: 'Ubicación de la clínica',
    etiqueta: 'VISÍTANOS',
    titulo: 'Nuestra ubicación',
    lineas: [
      {
        texto: 'Av. Cochabamba–Santa Cruz',
      },
      {
        texto: 'Shinahota, Cochabamba',
      },
    ],
    accion: 'Ver en el mapa',
    enlaceAccion:
      'https://www.google.com/maps/search/?api=1&query=Clinica+Odontologica+Orellana+Shinahota',
    nuevaVentana: true,
  },
];

const IconoFlecha = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const IconoCalendario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const IconoReloj = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconoEscudo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-5" />
  </svg>
);

const IconoEnviar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const IconoUbicacion = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const IconoCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const obtenerFechaBolivia = () => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
};

const obtenerDiaSemana = (fecha) => {
  if (!fecha) return null;

  const [year, month, day] = fecha.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0).getDay();
};

const generarHorariosDisponibles = (fecha) => {
  const diaSemana = obtenerDiaSemana(fecha);

  if (diaSemana === null || diaSemana === 0) {
    return [];
  }

  const horaInicio = diaSemana === 6 ? 9 : 7;
  const horaFin = diaSemana === 6 ? 14 : 19;
  const horarios = [];

  for (
    let minutosTotales = horaInicio * 60;
    minutosTotales <= horaFin * 60;
    minutosTotales += 30
  ) {
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;

    horarios.push(
      `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    );
  }

  return horarios;
};

const obtenerEstadoClinica = () => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/La_Paz',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value])
  );

  const dias = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dia = dias[valores.weekday];
  const minutosActuales =
    Number(valores.hour) * 60 + Number(valores.minute);
  const inicio = dia === 6 ? 9 * 60 : 7 * 60;
  const fin = dia === 6 ? 14 * 60 : 19 * 60;
  const abierta =
    dia !== 0 && minutosActuales >= inicio && minutosActuales < fin;

  if (abierta) {
    return {
      abierta: true,
      titulo: 'Abierto ahora',
      detalle: dia === 6 ? 'Atención hasta las 14:00' : 'Atención hasta las 19:00',
    };
  }

  return {
    abierta: false,
    titulo: 'Cerrado ahora',
    detalle:
      dia === 0
        ? 'Abrimos el lunes a las 07:00'
        : 'Consulta el horario de atención',
  };
};

const Contactanos = () => {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [estadoClinica, setEstadoClinica] = useState(obtenerEstadoClinica);

  const paginaRef = useRef(null);
  const formularioRef = useRef(null);
  const mensajeEstadoRef = useRef(null);

  const fechaMinima = useMemo(() => obtenerFechaBolivia(), []);

  const horariosDisponibles = useMemo(
    () => generarHorariosDisponibles(formulario.fecha),
    [formulario.fecha]
  );

  const diaSeleccionado = useMemo(
    () => obtenerDiaSemana(formulario.fecha),
    [formulario.fecha]
  );

  const progresoFormulario = useMemo(() => {
    const camposObligatorios = [
      formulario.nombre,
      formulario.apellido,
      formulario.ci,
      formulario.email,
      formulario.telefono,
      formulario.servicio,
      formulario.fecha,
      formulario.hora,
    ];

    const completados = camposObligatorios.filter((campo) =>
      String(campo).trim()
    ).length;

    return Math.round((completados / camposObligatorios.length) * 100);
  }, [formulario]);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setEstadoClinica(obtenerEstadoClinica());
    }, 60000);

    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const elementos =
      paginaRef.current?.querySelectorAll('[data-contact-reveal]') ?? [];

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
      { threshold: 0.12 }
    );

    elementos.forEach((elemento) => observador.observe(elemento));

    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (mensajeExito || error) {
      mensajeEstadoRef.current?.focus();
    }
  }, [mensajeExito, error]);

  const actualizarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    if (error) setError('');
  };

  const actualizarFecha = (fecha) => {
    setFormulario((anterior) => ({
      ...anterior,
      fecha,
      hora: '',
    }));

    setError('');
  };

  const irAlFormulario = () => {
    formularioRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const enviarSolicitud = async (evento) => {
    evento.preventDefault();
    setMensajeExito('');
    setError('');

    const nombre = formulario.nombre.trim();
    const apellido = formulario.apellido.trim();
    const ci = formulario.ci.trim();
    const email = formulario.email.trim().toLowerCase();
    const telefonoPaciente = formulario.telefono.trim();

    if (!nombre || !apellido || !ci) {
      setError(
        'Nombre, apellido y carnet de identidad son obligatorios.'
      );
      return;
    }

    if (!/^[0-9A-Za-z-]{5,20}$/.test(ci)) {
      setError('Ingresa un carnet de identidad válido.');
      return;
    }

    if (!/^[+0-9()\s-]{7,30}$/.test(telefonoPaciente)) {
      setError('Ingresa un número de teléfono válido.');
      return;
    }

    if (formulario.fecha < fechaMinima) {
      setError('Selecciona una fecha actual o futura.');
      return;
    }

    if (diaSeleccionado === 0) {
      setError(
        'Los domingos la clínica permanece cerrada. Selecciona otro día.'
      );
      return;
    }

    if (!horariosDisponibles.includes(formulario.hora)) {
      setError('Selecciona un horario disponible para la fecha elegida.');
      return;
    }

    try {
      setEnviando(true);

      await api.post('/solicitudes-citas', {
        nombre,
        apellido,
        ci,
        nombreCompleto: `${nombre} ${apellido}`.trim(),
        email,
        telefono: telefonoPaciente,
        servicio: formulario.servicio,
        fecha: formulario.fecha,
        hora: formulario.hora,
        mensaje: formulario.mensaje.trim(),
      });

      setMensajeExito(
        'Tu solicitud fue enviada correctamente. La clínica revisará la disponibilidad y se comunicará contigo para confirmar la cita.'
      );
      setFormulario(formularioInicial);
    } catch (errorPeticion) {
      console.error('Error al enviar solicitud:', errorPeticion);

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo enviar la solicitud. Intenta nuevamente.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="contact-page" ref={paginaRef}>
      <section className="contact-hero" aria-labelledby="contact-title">
        <div className="contact-shell contact-hero__grid">
          <div className="contact-hero__content">
            <span className="contact-eyebrow">ESTAMOS PARA AYUDARTE</span>

            <h1 id="contact-title">
              Hablemos de tu <span>sonrisa</span>
            </h1>

            <p>
              Solicita tu atención en línea o comunícate directamente con la
              Clínica Odontológica Orellana. Te orientaremos para encontrar el
              tratamiento adecuado.
            </p>

            <div className="contact-hero__actions">
              <button type="button" onClick={irAlFormulario}>
                Solicitar una cita
                <IconoCalendario />
              </button>

              <a
                href="https://wa.me/59168869660?text=Hola%2C%20quisiera%20solicitar%20informaci%C3%B3n%20sobre%20una%20atenci%C3%B3n%20odontol%C3%B3gica."
                target="_blank"
                rel="noreferrer"
              >
                Escribir por WhatsApp
                <IconoFlecha />
              </a>
            </div>

            <div className="contact-hero__benefits" aria-label="Beneficios">
              <span>
                <IconoCheck />
                Solicitud rápida
              </span>
              <span>
                <IconoCheck />
                Atención personalizada
              </span>
              <span>
                <IconoCheck />
                Confirmación por la clínica
              </span>
            </div>
          </div>

          <aside className="contact-hero__status" aria-label="Estado de atención">
            <div
              className={`contact-open-status ${
                estadoClinica.abierta
                  ? 'contact-open-status--open'
                  : 'contact-open-status--closed'
              }`}
            >
              <span aria-hidden="true" />

              <div>
                <strong>{estadoClinica.titulo}</strong>
                <small>{estadoClinica.detalle}</small>
              </div>
            </div>

            <div className="contact-hero__status-main">
              <span className="contact-hero__status-icon">
                <IconoReloj />
              </span>

              <div>
                <small>HORARIO REGULAR</small>
                <strong>Lunes a viernes</strong>
                <p>07:00 – 19:00</p>
              </div>
            </div>

            <div className="contact-hero__status-footer">
              <span>Sábados</span>
              <strong>09:00 – 14:00</strong>
            </div>
          </aside>
        </div>
      </section>

      <section
        className="contact-shell contact-channels"
        aria-labelledby="contact-channels-title"
      >
        <h2 id="contact-channels-title" className="contact-sr-only">
          Canales de contacto
        </h2>

        {canalesContacto.map((canal, indice) => (
          <article
            className="contact-channel"
            key={canal.id}
            data-contact-reveal
            style={{
              '--contact-delay': `${indice * 90}ms`,
            }}
          >
            <div className="contact-channel__top">
              <span className="contact-channel__image">
                <img src={canal.imagen} alt={canal.alt} />
              </span>

              <span className="contact-channel__label">{canal.etiqueta}</span>
            </div>

            <h3>{canal.titulo}</h3>

            <div className="contact-channel__details">
              {canal.lineas.map((linea) =>
                linea.enlace ? (
                  <a href={linea.enlace} key={linea.texto}>
                    {linea.texto}
                  </a>
                ) : (
                  <span key={linea.texto}>{linea.texto}</span>
                )
              )}
            </div>

            <a
              href={canal.enlaceAccion}
              className="contact-channel__action"
              target={canal.nuevaVentana ? '_blank' : undefined}
              rel={canal.nuevaVentana ? 'noreferrer' : undefined}
            >
              {canal.accion}
              <IconoFlecha />
            </a>
          </article>
        ))}
      </section>

      <section className="contact-shell contact-main">
        <article
          className="contact-appointment"
          ref={formularioRef}
          data-contact-reveal
        >
          <div className="contact-appointment__header">
            <div>
              <span className="contact-section-label">RESERVA EN LÍNEA</span>
              <h2>Agenda tu cita</h2>
              <p>
                Completa tus datos. La solicitud quedará pendiente hasta que
                la clínica verifique la disponibilidad.
              </p>
            </div>

            <div
              className="contact-form-progress"
              aria-label={`Formulario completado al ${progresoFormulario}%`}
            >
              <strong>{progresoFormulario}%</strong>
              <span>completado</span>
            </div>
          </div>

          <div className="contact-form-progress__track" aria-hidden="true">
            <span
              style={{
                width: `${progresoFormulario}%`,
              }}
            />
          </div>

          {(mensajeExito || error) && (
            <div
              ref={mensajeEstadoRef}
              tabIndex="-1"
              role={error ? 'alert' : 'status'}
              className={`contact-form-message ${
                error
                  ? 'contact-form-message--error'
                  : 'contact-form-message--success'
              }`}
            >
              <span className="contact-form-message__icon">
                {error ? '!' : <IconoCheck />}
              </span>

              <div>
                <strong>
                  {error ? 'Revisa la información' : 'Solicitud recibida'}
                </strong>
                <p>{error || mensajeExito}</p>
              </div>
            </div>
          )}

          <form className="contact-form" onSubmit={enviarSolicitud}>
            <fieldset>
              <legend>
                <span>01</span>
                Datos personales
              </legend>

              <div className="contact-form__row">
                <label className="contact-field" htmlFor="nombre">
                  <span>Nombre *</span>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Nombre(s)"
                    value={formulario.nombre}
                    onChange={(evento) =>
                      actualizarCampo('nombre', evento.target.value)
                    }
                    maxLength={60}
                    autoComplete="given-name"
                    required
                  />
                </label>

                <label className="contact-field" htmlFor="apellido">
                  <span>Apellido *</span>
                  <input
                    id="apellido"
                    type="text"
                    placeholder="Apellido(s)"
                    value={formulario.apellido}
                    onChange={(evento) =>
                      actualizarCampo('apellido', evento.target.value)
                    }
                    maxLength={60}
                    autoComplete="family-name"
                    required
                  />
                </label>
              </div>

              <label className="contact-field" htmlFor="ci">
                <span>Carnet de identidad *</span>
                <input
                  id="ci"
                  type="text"
                  placeholder="Ingresa tu número de CI"
                  value={formulario.ci}
                  onChange={(evento) =>
                    actualizarCampo(
                      'ci',
                      evento.target.value.replace(/\s/g, '').slice(0, 20)
                    )
                  }
                  maxLength={20}
                  autoComplete="off"
                  required
                />
              </label>

              <div className="contact-form__row">
                <label className="contact-field" htmlFor="email">
                  <span>Correo electrónico *</span>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formulario.email}
                    onChange={(evento) =>
                      actualizarCampo('email', evento.target.value)
                    }
                    maxLength={120}
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="contact-field" htmlFor="telefono">
                  <span>Teléfono *</span>
                  <input
                    id="telefono"
                    type="tel"
                    placeholder="+591 700 00000"
                    value={formulario.telefono}
                    onChange={(evento) =>
                      actualizarCampo('telefono', evento.target.value)
                    }
                    maxLength={30}
                    autoComplete="tel"
                    required
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <span>02</span>
                Detalles de la atención
              </legend>

              <label className="contact-field" htmlFor="servicio">
                <span>Servicio *</span>
                <select
                  id="servicio"
                  value={formulario.servicio}
                  onChange={(evento) =>
                    actualizarCampo('servicio', evento.target.value)
                  }
                  required
                >
                  {servicios.map((servicio) => (
                    <option value={servicio} key={servicio}>
                      {servicio}
                    </option>
                  ))}
                </select>
              </label>

              <div className="contact-form__row">
                <label className="contact-field" htmlFor="fecha">
                  <span>Fecha solicitada *</span>
                  <input
                    id="fecha"
                    type="date"
                    value={formulario.fecha}
                    min={fechaMinima}
                    onChange={(evento) => actualizarFecha(evento.target.value)}
                    required
                  />
                </label>

                <label className="contact-field" htmlFor="hora">
                  <span>Hora solicitada *</span>
                  <select
                    id="hora"
                    value={formulario.hora}
                    onChange={(evento) =>
                      actualizarCampo('hora', evento.target.value)
                    }
                    disabled={!formulario.fecha || diaSeleccionado === 0}
                    required
                  >
                    <option value="">
                      {!formulario.fecha
                        ? 'Selecciona primero una fecha'
                        : diaSeleccionado === 0
                          ? 'Domingo: clínica cerrada'
                          : 'Selecciona una hora'}
                    </option>

                    {horariosDisponibles.map((horaDisponible) => (
                      <option
                        value={horaDisponible}
                        key={horaDisponible}
                      >
                        {horaDisponible}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {formulario.fecha && (
                <div
                  className={`contact-form__availability ${
                    diaSeleccionado === 0
                      ? 'contact-form__availability--closed'
                      : ''
                  }`}
                >
                  <IconoReloj />

                  <span>
                    {diaSeleccionado === 0
                      ? 'Los domingos no se realizan atenciones.'
                      : diaSeleccionado === 6
                        ? 'Horario disponible para sábado: 09:00 a 14:00.'
                        : 'Horario disponible: 07:00 a 19:00.'}
                  </span>
                </div>
              )}

              <label className="contact-field" htmlFor="mensaje">
                <span>Motivo de la consulta</span>
                <textarea
                  id="mensaje"
                  placeholder="Describe brevemente el motivo de tu consulta..."
                  value={formulario.mensaje}
                  onChange={(evento) =>
                    actualizarCampo('mensaje', evento.target.value)
                  }
                  maxLength={500}
                />

                <small className="contact-field__counter">
                  {formulario.mensaje.length}/500
                </small>
              </label>
            </fieldset>

            <div className="contact-form__footer">
              <p>
                <IconoEscudo />
                Tus datos se utilizarán únicamente para gestionar esta
                solicitud de atención.
              </p>

              <button type="submit" disabled={enviando}>
                {enviando ? (
                  <>
                    <span className="contact-form__spinner" aria-hidden="true" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    Enviar solicitud
                    <IconoEnviar />
                  </>
                )}
              </button>
            </div>
          </form>
        </article>

        <aside className="contact-side" data-contact-reveal>
          <section className="contact-schedule">
            <div className="contact-side__heading">
              <span className="contact-side__heading-icon">
                <IconoReloj />
              </span>

              <div>
                <span className="contact-section-label">PLANIFICA TU VISITA</span>
                <h2>Horario de atención</h2>
              </div>
            </div>

            <div className="contact-schedule__rows">
              <div>
                <span>Lunes – Viernes</span>
                <strong>07:00 – 19:00</strong>
              </div>

              <div>
                <span>Sábados</span>
                <strong>09:00 – 14:00</strong>
              </div>

              <div className="contact-schedule__closed">
                <span>Domingos</span>
                <strong>Cerrado</strong>
              </div>
            </div>

            <p className="contact-schedule__note">
              La hora seleccionada corresponde a una solicitud y será
              confirmada por la clínica.
            </p>
          </section>

          <section className="contact-map">
            <div className="contact-map__image">
              <img
                src={mapa}
                alt="Mapa de ubicación de la Clínica Odontológica Orellana"
              />

              <span className="contact-map__pin">
                <IconoUbicacion />
              </span>
            </div>

            <div className="contact-map__content">
              <div>
                <span>CLÍNICA ODONTOLÓGICA ORELLANA</span>
                <strong>Shinahota, Cochabamba</strong>
                <p>Av. Cochabamba–Santa Cruz</p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Clinica+Odontologica+Orellana+Shinahota"
                target="_blank"
                rel="noreferrer"
              >
                Abrir ubicación
                <IconoFlecha />
              </a>
            </div>
          </section>

          <section className="contact-process">
            <span className="contact-section-label">¿QUÉ SUCEDE DESPUÉS?</span>
            <h2>Tu solicitud en tres pasos</h2>

            <ol>
              <li>
                <span>1</span>
                <div>
                  <strong>Envías tus datos</strong>
                  <p>Recibimos la solicitud de atención.</p>
                </div>
              </li>

              <li>
                <span>2</span>
                <div>
                  <strong>Verificamos la disponibilidad</strong>
                  <p>Revisamos fecha, hora y servicio.</p>
                </div>
              </li>

              <li>
                <span>3</span>
                <div>
                  <strong>Confirmamos tu cita</strong>
                  <p>La clínica se comunica contigo.</p>
                </div>
              </li>
            </ol>
          </section>
        </aside>
      </section>
    </main>
  );
};

export default Contactanos;