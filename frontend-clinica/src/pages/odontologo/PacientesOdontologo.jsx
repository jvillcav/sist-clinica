import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../api/axios';
import '../../styles/odontologo/pacientesOdontologo.css';

/* =====================================================
   UTILIDADES
===================================================== */

const normalizarTexto = (texto = '') => {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const obtenerNombreCompleto = (paciente) => {
  if (!paciente) return 'Paciente sin nombre';

  return [paciente.nombre, paciente.apellido]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Paciente sin nombre';
};

const obtenerIniciales = (paciente) => {
  const nombreCompleto =
    obtenerNombreCompleto(paciente);

  const partes = nombreCompleto
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return 'PA';

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`
    .toUpperCase();
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin registro';

  const fechaTexto = String(fecha).split('T')[0];
  const [year, month, day] = fechaTexto
    .split('-')
    .map(Number);

  if (!year || !month || !day) {
    return 'Sin registro';
  }

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;

  const fechaTexto =
    String(fechaNacimiento).split('T')[0];

  const [year, month, day] = fechaTexto
    .split('-')
    .map(Number);

  if (!year || !month || !day) return null;

  const nacimiento = new Date(
    year,
    month - 1,
    day
  );

  const hoy = new Date();
  let edad =
    hoy.getFullYear() - nacimiento.getFullYear();

  const diferenciaMes =
    hoy.getMonth() - nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (
      diferenciaMes === 0 &&
      hoy.getDate() < nacimiento.getDate()
    )
  ) {
    edad -= 1;
  }

  return edad >= 0 ? edad : null;
};

const obtenerListaTexto = (
  valor,
  textoVacio = 'Sin registro'
) => {
  if (Array.isArray(valor)) {
    const elementos = valor
      .map((elemento) =>
        String(elemento).trim()
      )
      .filter(Boolean);

    return elementos.length > 0
      ? elementos
      : [textoVacio];
  }

  if (
    typeof valor === 'string' &&
    valor.trim()
  ) {
    return valor
      .split(',')
      .map((elemento) =>
        elemento.trim()
      )
      .filter(Boolean);
  }

  return [textoVacio];
};

const obtenerTituloAtencion = (expediente) => {
  return (
    expediente?.motivoConsulta ||
    expediente?.tipoTratamiento ||
    expediente?.tratamiento ||
    expediente?.diagnostico ||
    'Atención odontológica'
  );
};

/* =====================================================
   ICONOS
===================================================== */

const IconoBuscar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const IconoUsuario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-5 3.5-8 8-8s8 3 8 8" />
  </svg>
);

const IconoHistoria = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const IconoAtencion = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v18M3 12h18" />
  </svg>
);

const IconoVolver = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6.1 8A7 7 0 0 1 18 6l2 2" />
    <path d="M17.9 16A7 7 0 0 1 6 18l-2-2" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoCalendario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

/* =====================================================
   COMPONENTE
===================================================== */

const PacientesOdontologo = () => {
  const navigate = useNavigate();

  const [pacientes, setPacientes] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState('');

  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState(null);

  const [expedienteClinico, setExpedienteClinico] =
    useState(null);

  const [cargandoPacientes, setCargandoPacientes] =
    useState(true);

  const [cargandoExpediente, setCargandoExpediente] =
    useState(false);

  const [errorPacientes, setErrorPacientes] =
    useState('');

  const [errorExpediente, setErrorExpediente] =
    useState('');

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      setCargandoPacientes(true);
      setErrorPacientes('');

      const { data } = await api.get('/pacientes');

      const lista = Array.isArray(data)
        ? data
        : data?.pacientes || [];

      setPacientes(lista);
    } catch (error) {
      console.error(
        'Error al cargar pacientes:',
        error
      );

      setErrorPacientes(
        error.response?.data?.mensaje ||
          'No se pudo cargar la lista de pacientes.'
      );
    } finally {
      setCargandoPacientes(false);
    }
  };

  const seleccionarPaciente = async (paciente) => {
    try {
      setPacienteSeleccionado(paciente);
      setExpedienteClinico(null);
      setErrorExpediente('');
      setCargandoExpediente(true);

      const { data } = await api.get(
        `/pacientes/${paciente._id}/expediente`
      );

      setPacienteSeleccionado(
        data?.paciente || paciente
      );

      setExpedienteClinico(data);
    } catch (error) {
      console.error(
        'Error al cargar expediente clínico:',
        error
      );

      setErrorExpediente(
        error.response?.data?.mensaje ||
          'No se pudo cargar el expediente clínico.'
      );
    } finally {
      setCargandoExpediente(false);
    }
  };

  const volverListado = () => {
    setPacienteSeleccionado(null);
    setExpedienteClinico(null);
    setErrorExpediente('');
  };

  const iniciarAtencion = () => {
    if (!pacienteSeleccionado?._id) return;

    navigate('/odontologo/atencion', {
      state: {
        pacienteId: pacienteSeleccionado._id,
        paciente: pacienteSeleccionado
      }
    });
  };

  const pacientesFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    if (!texto) return pacientes;

    return pacientes.filter((paciente) => {
      const nombre =
        normalizarTexto(paciente.nombre);

      const apellido =
        normalizarTexto(paciente.apellido);

      const nombreCompleto =
        normalizarTexto(
          obtenerNombreCompleto(paciente)
        );

      const ci =
        normalizarTexto(paciente.ci);

      return (
        nombre.includes(texto) ||
        apellido.includes(texto) ||
        nombreCompleto.includes(texto) ||
        ci.includes(texto)
      );
    });
  }, [pacientes, busqueda]);

  if (cargandoPacientes) {
    return (
      <section className="doctor-patients-loading">
        <div className="doctor-patients-spinner" />

        <h2>Cargando pacientes</h2>

        <p>
          Estamos preparando la información clínica.
        </p>
      </section>
    );
  }

  if (errorPacientes) {
    return (
      <section className="doctor-patients-error">
        <div className="doctor-patients-error-icon">
          !
        </div>

        <h2>No se pudieron cargar los pacientes</h2>

        <p>{errorPacientes}</p>

        <button
          type="button"
          onClick={cargarPacientes}
        >
          <IconoActualizar />
          Volver a intentar
        </button>
      </section>
    );
  }

  const pacienteActual =
    expedienteClinico?.paciente ||
    pacienteSeleccionado;

  const expedientes =
    expedienteClinico?.expedientes || [];

  const resumen =
    expedienteClinico?.resumen || {};

  const edad =
    calcularEdad(
      pacienteActual?.fechaNacimiento
    );

  const alergias =
    obtenerListaTexto(
      pacienteActual?.alergias,
      'Sin alergias registradas'
    );

  const condiciones =
    obtenerListaTexto(
      pacienteActual?.condicionesCronicas,
      'Sin condiciones registradas'
    );

  return (
    <main className="doctor-patients-page">
      <header className="doctor-patients-header">
        <div>
          <span className="doctor-patients-eyebrow">
            Expedientes clínicos
          </span>

          <h1>Buscar Paciente</h1>

          <p>
            Busca por nombre, apellido o carnet de identidad
            para consultar el expediente clínico.
          </p>
        </div>

        {pacienteSeleccionado && (
          <button
            type="button"
            className="doctor-patients-back-button"
            onClick={volverListado}
          >
            <IconoVolver />
            Volver a pacientes
          </button>
        )}
      </header>

      <section className="doctor-patients-search">
        <IconoBuscar />

        <input
          type="search"
          value={busqueda}
          placeholder="Buscar por nombre, apellido o carnet de identidad..."
          onChange={(evento) =>
            setBusqueda(evento.target.value)
          }
        />

        {busqueda && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setBusqueda('')}
          >
            <IconoCerrar />
          </button>
        )}
      </section>

      {!pacienteSeleccionado && (
        <>
          <div className="doctor-patients-results">
            <strong>
              {pacientesFiltrados.length}
            </strong>

            <span>
              {pacientesFiltrados.length === 1
                ? 'paciente encontrado'
                : 'pacientes encontrados'}
            </span>
          </div>

          {pacientesFiltrados.length > 0 ? (
            <section className="doctor-patients-grid">
              {pacientesFiltrados.map((paciente) => {
                const nombreCompleto =
                  obtenerNombreCompleto(paciente);

                const edadPaciente =
                  calcularEdad(
                    paciente.fechaNacimiento
                  );

                return (
                  <button
                    type="button"
                    className="doctor-patient-card"
                    key={paciente._id}
                    onClick={() =>
                      seleccionarPaciente(paciente)
                    }
                  >
                    <div className="doctor-patient-card-top">
                      <div className="doctor-patient-avatar">
                        {obtenerIniciales(paciente)}
                      </div>

                      <span
                        className={`doctor-patient-status ${
                          paciente.estado === false
                            ? 'inactive'
                            : 'active'
                        }`}
                      >
                        {paciente.estado === false
                          ? 'Inactivo'
                          : 'Activo'}
                      </span>
                    </div>

                    <div className="doctor-patient-card-body">
                      <h2>{nombreCompleto}</h2>

                      <p>
                        <strong>CI:</strong>{' '}
                        {paciente.ci ||
                          'Sin registro'}
                      </p>

                      <div className="doctor-patient-card-details">
                        <span>
                          {edadPaciente !== null
                            ? `${edadPaciente} años`
                            : 'Edad sin registro'}
                        </span>

                        <span>
                          {paciente.sexo ||
                            'Sexo sin registro'}
                        </span>
                      </div>
                    </div>

                    <div className="doctor-patient-card-footer">
                      <IconoHistoria />
                      Consultar expediente
                    </div>
                  </button>
                );
              })}
            </section>
          ) : (
            <section className="doctor-patients-empty">
              <div>
                <IconoUsuario />
              </div>

              <h2>No se encontraron pacientes</h2>

              <p>
                No existe ningún paciente que coincida con
                el nombre, apellido o carnet ingresado.
              </p>

              <button
                type="button"
                onClick={() => setBusqueda('')}
              >
                Limpiar búsqueda
              </button>
            </section>
          )}
        </>
      )}

      {pacienteSeleccionado && (
        <>
          {cargandoExpediente && (
            <section className="doctor-clinical-loading">
              <div className="doctor-patients-spinner" />

              <h2>Cargando expediente clínico</h2>

              <p>
                Consultando el historial del paciente.
              </p>
            </section>
          )}

          {errorExpediente && (
            <section className="doctor-clinical-error">
              <div className="doctor-patients-error-icon">
                !
              </div>

              <h2>
                No se pudo cargar el expediente
              </h2>

              <p>{errorExpediente}</p>

              <button
                type="button"
                onClick={() =>
                  seleccionarPaciente(
                    pacienteSeleccionado
                  )
                }
              >
                <IconoActualizar />
                Volver a intentar
              </button>
            </section>
          )}

          {!cargandoExpediente &&
            !errorExpediente &&
            expedienteClinico && (
              <>
                <section className="doctor-clinical-profile">
                  <div className="doctor-clinical-profile-header">
                    <div className="doctor-clinical-profile-main">
                      <div className="doctor-clinical-avatar">
                        {obtenerIniciales(
                          pacienteActual
                        )}
                      </div>

                      <div>
                        <div className="doctor-clinical-name-row">
                          <h2>
                            {obtenerNombreCompleto(
                              pacienteActual
                            )}
                          </h2>

                          <span>
                            {pacienteActual?.estado === false
                              ? 'Paciente inactivo'
                              : 'Paciente activo'}
                          </span>
                        </div>

                        <p>
                          Expediente clínico digital
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="doctor-start-attention-button"
                      onClick={iniciarAtencion}
                    >
                      <IconoAtencion />
                      Iniciar atención
                    </button>
                  </div>

                  <div className="doctor-clinical-data-grid">
                    <article>
                      <span>CI</span>
                      <strong>
                        {pacienteActual?.ci ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Edad</span>
                      <strong>
                        {edad !== null
                          ? `${edad} años`
                          : 'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Sexo</span>
                      <strong>
                        {pacienteActual?.sexo ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Tipo de sangre</span>
                      <strong>
                        {pacienteActual?.tipoSangre ||
                          pacienteActual?.grupoSanguineo ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Teléfono</span>
                      <strong>
                        {pacienteActual?.telefono ||
                          'Sin registro'}
                      </strong>
                    </article>

                    <article>
                      <span>Última atención</span>
                      <strong>
                        {formatearFecha(
                          resumen.ultimaAtencion
                        )}
                      </strong>
                    </article>
                  </div>

                  <div className="doctor-clinical-alerts">
                    <article className="allergies">
                      <div className="doctor-clinical-alert-title">
                        <IconoAdvertencia />
                        <h3>Alergias</h3>
                      </div>

                      <div className="doctor-clinical-tags">
                        {alergias.map((alergia) => (
                          <span key={alergia}>
                            {alergia}
                          </span>
                        ))}
                      </div>
                    </article>

                    <article className="conditions">
                      <div className="doctor-clinical-alert-title">
                        <IconoHistoria />
                        <h3>
                          Condiciones crónicas
                        </h3>
                      </div>

                      <div className="doctor-clinical-tags">
                        {condiciones.map(
                          (condicion) => (
                            <span key={condicion}>
                              {condicion}
                            </span>
                          )
                        )}
                      </div>
                    </article>
                  </div>
                </section>

                <section className="doctor-clinical-history">
                  <header className="doctor-clinical-history-header">
                    <div>
                      <h2>Expediente Clínico</h2>

                      <p>
                        {resumen.totalAtenciones || 0}{' '}
                        {(resumen.totalAtenciones || 0) === 1
                          ? 'atención registrada'
                          : 'atenciones registradas'}
                      </p>
                    </div>
                  </header>

                  {expedientes.length > 0 ? (
                    <div className="doctor-clinical-history-list">
                      {expedientes.map(
                        (expediente) => (
                          <article
                            className="doctor-clinical-history-card"
                            key={expediente._id}
                          >
                            <header>
                              <div>
                                <h3>
                                  {obtenerTituloAtencion(
                                    expediente
                                  )}
                                </h3>

                                <p>
                                  {expediente.odontologo
                                    ? `Dr. ${expediente.odontologo}`
                                    : 'Odontólogo sin registro'}
                                </p>
                              </div>

                              <span>
                                <IconoCalendario />

                                {formatearFecha(
                                  expediente.fechaAtencion ||
                                    expediente.createdAt
                                )}
                              </span>
                            </header>

                            <div className="doctor-clinical-history-data">
                              <article>
                                <span>Diagnóstico</span>

                                <strong>
                                  {expediente.diagnostico ||
                                    'Sin diagnóstico registrado'}
                                </strong>
                              </article>

                              <article>
                                <span>Tratamiento</span>

                                <strong>
                                  {expediente.tratamiento ||
                                    expediente.planTratamiento ||
                                    'Sin tratamiento registrado'}
                                </strong>
                              </article>
                            </div>

                            {expediente.observaciones && (
                              <div className="doctor-clinical-observations">
                                <span>
                                  Observaciones clínicas
                                </span>

                                <p>
                                  {
                                    expediente.observaciones
                                  }
                                </p>
                              </div>
                            )}
                          </article>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="doctor-clinical-history-empty">
                      <IconoHistoria />

                      <h3>
                        Sin atenciones registradas
                      </h3>

                      <p>
                        Este paciente todavía no cuenta con
                        antecedentes clínicos en el sistema.
                      </p>

                      <button
                        type="button"
                        onClick={iniciarAtencion}
                      >
                        Registrar primera atención
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}
        </>
      )}
    </main>
  );
};

export default PacientesOdontologo;