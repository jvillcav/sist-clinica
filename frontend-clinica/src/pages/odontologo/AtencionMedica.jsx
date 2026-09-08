import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useLocation,
  useNavigate
} from 'react-router-dom';

import api from '../../api/axios';
import '../../styles/odontologo/atencionMedica.css';

/* =====================================================
   UTILIDADES
===================================================== */

const obtenerNombreCompleto = (paciente) => {
  if (!paciente) {
    return 'Paciente sin información';
  }

  return [
    paciente.nombre,
    paciente.apellido
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Paciente sin información';
};

const obtenerIniciales = (paciente) => {
  const nombreCompleto =
    obtenerNombreCompleto(paciente);

  const partes = nombreCompleto
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return 'PA';
  }

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`
    .toUpperCase();
};

const normalizarTexto = (texto = '') => {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const obtenerFechaTexto = (fecha) => {
  if (!fecha) {
    return '';
  }

  const valor = String(fecha).split('T')[0];
  const [year, month, day] = valor
    .split('-')
    .map(Number);

  if (!year || !month || !day) {
    return '';
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

const obtenerEstadoEtiqueta = (estado) => {
  const estados = {
    pendiente: 'Programada',
    confirmada: 'Confirmada',
    atendido: 'Completada',
    cancelado: 'Cancelada'
  };

  return estados[estado] || 'Sin estado';
};

const obtenerEstadoClase = (estado) => {
  const estados = {
    pendiente: 'programada',
    confirmada: 'confirmada',
    atendido: 'completada',
    cancelado: 'cancelada'
  };

  return estados[estado] || 'neutral';
};

/* =====================================================
   ICONOS
===================================================== */

const IconoUsuario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-5 3.5-8 8-8s8 3 8 8" />
  </svg>
);

const IconoDiagnostico = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v18M3 12h18" />
  </svg>
);

const IconoTratamiento = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const IconoBuscar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoAgregar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconoEliminar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8" />
    <path d="M6 7l1 14h10l1-14" />
  </svg>
);

const IconoGuardar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 3h11l3 3v15H5V3Z" />
    <path d="M8 3v6h8V3M8 21v-7h8v7" />
  </svg>
);

const IconoVolver = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const IconoSiguiente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const IconoCalendario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const IconoCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

/* =====================================================
   COMPONENTE
===================================================== */

const AtencionMedica = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const usuario = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem('usuario')
      );
    } catch {
      return null;
    }
  }, []);

  const datosNavegacion =
    location.state || {};

  const pacienteNavegacion =
    datosNavegacion.paciente ||
    datosNavegacion.cita?.pacienteId ||
    null;

  const pacienteIdNavegacion =
    datosNavegacion.pacienteId ||
    pacienteNavegacion?._id ||
    '';

  const citaIdNavegacion =
    datosNavegacion.citaId ||
    datosNavegacion.cita?._id ||
    '';

  const [pasoActual, setPasoActual] =
    useState(1);

  const [pacientes, setPacientes] =
    useState([]);

  const [insumos, setInsumos] =
    useState([]);

  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState(pacienteNavegacion);

  const [busquedaPaciente, setBusquedaPaciente] =
    useState('');

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  const [consulta, setConsulta] =
    useState({
      pacienteId: pacienteIdNavegacion,
      citaId: citaIdNavegacion,
      motivoConsulta:
        datosNavegacion.cita?.motivo || '',
      diagnostico: '',
      piezasDentales: '',
      tratamiento: '',
      prescripcion: '',
      observaciones: ''
    });

  const [insumoSeleccionado, setInsumoSeleccionado] =
    useState({
      insumoId: '',
      cantidadUtilizada: 1
    });


  const [busquedaInsumo, setBusquedaInsumo] = useState('');
  const [mostrarInsumos, setMostrarInsumos] = useState(false);
  const [consumos, setConsumos] =
    useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (
      pacienteIdNavegacion &&
      pacientes.length > 0
    ) {
      const pacienteEncontrado =
        pacientes.find(
          (paciente) =>
            paciente._id === pacienteIdNavegacion
        );

      if (pacienteEncontrado) {
        setPacienteSeleccionado(
          pacienteEncontrado
        );

        setConsulta((anterior) => ({
          ...anterior,
          pacienteId:
            pacienteEncontrado._id
        }));
      }
    }
  }, [
    pacientes,
    pacienteIdNavegacion
  ]);

  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);
      setError('');

      const [
        respuestaPacientes,
        respuestaInsumos
      ] = await Promise.all([
        api.get('/pacientes'),
        api.get('/insumos')
      ]);

      const listaPacientes =
        Array.isArray(respuestaPacientes.data)
          ? respuestaPacientes.data
          : respuestaPacientes.data?.pacientes ||
            [];

      const listaInsumos =
        Array.isArray(respuestaInsumos.data)
          ? respuestaInsumos.data
          : respuestaInsumos.data?.insumos ||
            [];

      setPacientes(listaPacientes);
      setInsumos(listaInsumos);
    } catch (errorPeticion) {
      console.error(
        'Error al cargar atención médica:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudieron cargar los datos necesarios.'
      );
    } finally {
      setCargando(false);
    }
  };

  const pacientesFiltrados = useMemo(() => {
    const texto =
      normalizarTexto(busquedaPaciente);

    if (!texto) {
      return pacientes;
    }

    return pacientes.filter((paciente) => {
      const nombreCompleto =
        normalizarTexto(
          obtenerNombreCompleto(paciente)
        );

      const ci =
        normalizarTexto(paciente.ci);

      return (
        nombreCompleto.includes(texto) ||
        ci.includes(texto)
      );
    });
  }, [
    pacientes,
    busquedaPaciente
  ]);

  const insumoActual = useMemo(() => {
    return insumos.find(
      (insumo) =>
        insumo._id ===
        insumoSeleccionado.insumoId
    );
  }, [
    insumos,
    insumoSeleccionado.insumoId
  ]);

  const insumosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaInsumo);
    return insumos.filter((insumo) =>
      !texto || normalizarTexto(
        `${insumo.nombre} ${insumo.unidadMedida || ''}`
      ).includes(texto)
    ).slice(0, 50);
  }, [insumos, busquedaInsumo]);

  const seleccionarInsumo = (insumo) => {
    setInsumoSeleccionado((anterior) => ({
      ...anterior,
      insumoId: insumo._id
    }));
    setBusquedaInsumo(insumo.nombre);
    setMostrarInsumos(false);
    setError('');
  };

  const seleccionarPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);

    setConsulta((anterior) => ({
      ...anterior,
      pacienteId: paciente._id
    }));

    setError('');
  };

  const validarPasoPaciente = () => {
    if (!consulta.pacienteId) {
      setError(
        'Debe seleccionar un paciente antes de continuar.'
      );

      return false;
    }

    return true;
  };

  const validarPasoDiagnostico = () => {
    if (!consulta.motivoConsulta.trim()) {
      setError(
        'El motivo de consulta es obligatorio.'
      );

      return false;
    }

    if (!consulta.diagnostico.trim()) {
      setError(
        'El diagnóstico es obligatorio.'
      );

      return false;
    }

    return true;
  };

  const irPasoSiguiente = () => {
    setMensaje('');
    setError('');

    if (
      pasoActual === 1 &&
      !validarPasoPaciente()
    ) {
      return;
    }

    if (
      pasoActual === 2 &&
      !validarPasoDiagnostico()
    ) {
      return;
    }

    setPasoActual((actual) =>
      Math.min(actual + 1, 3)
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const irPasoAnterior = () => {
    setMensaje('');
    setError('');

    setPasoActual((actual) =>
      Math.max(actual - 1, 1)
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const agregarInsumo = () => {
    setMensaje('');
    setError('');

    if (!insumoSeleccionado.insumoId) {
      setError(
        'Seleccione un insumo antes de agregarlo.'
      );

      return;
    }

    const cantidad =
      Number(
        insumoSeleccionado.cantidadUtilizada
      );

    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      setError(
        'La cantidad utilizada debe ser mayor a cero.'
      );

      return;
    }

    if (!insumoActual) {
      setError(
        'El insumo seleccionado no fue encontrado.'
      );

      return;
    }

    const consumoExistente =
      consumos.find(
        (consumo) =>
          consumo.insumoId ===
          insumoActual._id
      );

    const cantidadAcumulada =
      cantidad +
      Number(
        consumoExistente?.cantidadUtilizada ||
          0
      );

    if (
      cantidadAcumulada >
      Number(insumoActual.stockActual)
    ) {
      setError(
        `Stock insuficiente para ${insumoActual.nombre}. Disponible: ${insumoActual.stockActual}.`
      );

      return;
    }

    if (consumoExistente) {
      setConsumos((anteriores) =>
        anteriores.map((consumo) =>
          consumo.insumoId ===
          insumoActual._id
            ? {
                ...consumo,
                cantidadUtilizada:
                  cantidadAcumulada
              }
            : consumo
        )
      );
    } else {
      setConsumos((anteriores) => [
        ...anteriores,
        {
          insumoId: insumoActual._id,
          nombre: insumoActual.nombre,
          unidadMedida:
            insumoActual.unidadMedida,
          stockActual:
            Number(
              insumoActual.stockActual
            ),
          cantidadUtilizada: cantidad
        }
      ]);
    }

    setInsumoSeleccionado({
      insumoId: '',
      cantidadUtilizada: 1
    });
    setBusquedaInsumo('');
    setMostrarInsumos(false);
  };

  const quitarInsumo = (insumoId) => {
    setConsumos((anteriores) =>
      anteriores.filter(
        (consumo) =>
          consumo.insumoId !== insumoId
      )
    );
  };

  const cambiarCantidadConsumo = (
    insumoId,
    nuevaCantidad
  ) => {
    const cantidad =
      Number(nuevaCantidad);

    const consumo =
      consumos.find(
        (item) =>
          item.insumoId === insumoId
      );

    if (!consumo) {
      return;
    }

    if (
      !Number.isFinite(cantidad) ||
      cantidad < 1
    ) {
      return;
    }

    if (
      cantidad >
      Number(consumo.stockActual)
    ) {
      setError(
        `La cantidad no puede superar el stock disponible de ${consumo.nombre}.`
      );

      return;
    }

    setError('');

    setConsumos((anteriores) =>
      anteriores.map((item) =>
        item.insumoId === insumoId
          ? {
              ...item,
              cantidadUtilizada:
                cantidad
            }
          : item
      )
    );
  };

  const registrarAtencion = async () => {
    setMensaje('');
    setError('');

    if (!validarPasoPaciente()) {
      setPasoActual(1);
      return;
    }

    if (!validarPasoDiagnostico()) {
      setPasoActual(2);
      return;
    }

    if (!consulta.tratamiento.trim()) {
      setError(
        'El tratamiento realizado es obligatorio.'
      );

      return;
    }

    try {
      setGuardando(true);

      const payload = {
        pacienteId:
          consulta.pacienteId,

        citaId:
          consulta.citaId || null,

        motivoConsulta:
          consulta.motivoConsulta.trim(),

        diagnostico:
          consulta.diagnostico.trim(),

        piezasDentales:
          consulta.piezasDentales.trim(),

        tratamiento:
          consulta.tratamiento.trim(),

        prescripcion:
          consulta.prescripcion.trim(),

        observaciones:
          consulta.observaciones.trim(),

        insumos: consumos.map(
          (consumo) => ({
            insumoId:
              consumo.insumoId,

            cantidadUtilizada:
              Number(
                consumo.cantidadUtilizada
              )
          })
        )
      };

      const { data } = await api.post(
        '/expedientes/atencion-completa',
        payload
      );

      setMensaje(
        data?.mensaje ||
          'Atención médica registrada correctamente.'
      );

      setConsulta({
        pacienteId: '',
        citaId: '',
        motivoConsulta: '',
        diagnostico: '',
        piezasDentales: '',
        tratamiento: '',
        prescripcion: '',
        observaciones: ''
      });

      setPacienteSeleccionado(null);
      setConsumos([]);

      setInsumoSeleccionado({
        insumoId: '',
        cantidadUtilizada: 1
      });

      await cargarDatosIniciales();
      setBusquedaInsumo('');
      setMostrarInsumos(false);

      setTimeout(() => {
        navigate('/odontologo/citas');
      }, 1600);
    } catch (errorPeticion) {
      console.error(
        'Error al registrar atención:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo registrar la atención médica.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const alergiasPaciente = useMemo(() => {
    const valor =
      pacienteSeleccionado?.alergias;

    if (Array.isArray(valor)) {
      return valor.filter(Boolean);
    }

    if (
      typeof valor === 'string' &&
      valor.trim()
    ) {
      return valor
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }, [pacienteSeleccionado]);

  const condicionesPaciente =
    useMemo(() => {
      const valor =
        pacienteSeleccionado
          ?.condicionesCronicas;

      if (Array.isArray(valor)) {
        return valor.filter(Boolean);
      }

      if (
        typeof valor === 'string' &&
        valor.trim()
      ) {
        return valor
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [];
    }, [pacienteSeleccionado]);

  if (cargando) {
    return (
      <section className="attention-loading">
        <div className="attention-spinner" />

        <h2>
          Preparando atención médica
        </h2>

        <p>
          Cargando pacientes e insumos disponibles.
        </p>
      </section>
    );
  }

  return (
    <main className="attention-page">
      <header className="attention-header">
        <div>
          <span className="attention-eyebrow">
            Consulta clínica
          </span>

          <h1>
            Registrar Atención Médica
          </h1>

          <p>
            Documenta el diagnóstico,
            tratamiento e insumos utilizados
            durante la consulta.
          </p>
        </div>

        <div className="attention-doctor">
          <span>Odontólogo responsable</span>

          <strong>
            Dr. {usuario?.nombre || 'Sin registro'}
          </strong>
        </div>
      </header>

      {mensaje && (
        <div className="attention-message success">
          <IconoCheck />
          <span>{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="attention-message error">
          <IconoAdvertencia />
          <span>{error}</span>
        </div>
      )}

      <section className="attention-stepper">
        <div
          className={`attention-step ${
            pasoActual === 1
              ? 'active'
              : pasoActual > 1
                ? 'completed'
                : ''
          }`}
        >
          <div className="attention-step-circle">
            {pasoActual > 1 ? (
              <IconoCheck />
            ) : (
              <span>1</span>
            )}
          </div>

          <div>
            <strong>Paciente</strong>
            <small>
              Selección de la consulta
            </small>
          </div>
        </div>

        <div
          className={`attention-step-line ${
            pasoActual > 1
              ? 'completed'
              : ''
          }`}
        />

        <div
          className={`attention-step ${
            pasoActual === 2
              ? 'active'
              : pasoActual > 2
                ? 'completed'
                : ''
          }`}
        >
          <div className="attention-step-circle">
            {pasoActual > 2 ? (
              <IconoCheck />
            ) : (
              <span>2</span>
            )}
          </div>

          <div>
            <strong>Diagnóstico</strong>
            <small>
              Valoración odontológica
            </small>
          </div>
        </div>

        <div
          className={`attention-step-line ${
            pasoActual > 2
              ? 'completed'
              : ''
          }`}
        />

        <div
          className={`attention-step ${
            pasoActual === 3
              ? 'active'
              : ''
          }`}
        >
          <div className="attention-step-circle">
            <span>3</span>
          </div>

          <div>
            <strong>
              Tratamiento e insumos
            </strong>

            <small>
              Procedimiento realizado
            </small>
          </div>
        </div>
      </section>

      {pasoActual === 1 && (
        <section className="attention-panel">
          <header className="attention-panel-header">
            <div>
              <IconoUsuario />

              <div>
                <h2>
                  Selecciona el paciente
                </h2>

                <p>
                  Elige al paciente que está
                  siendo atendido.
                </p>
              </div>
            </div>
          </header>

          <div className="attention-patient-search">
            <IconoBuscar />

            <input
              type="search"
              placeholder="Buscar por nombre, apellido o CI..."
              value={busquedaPaciente}
              onChange={(evento) =>
                setBusquedaPaciente(
                  evento.target.value
                )
              }
            />
          </div>

          {pacienteSeleccionado && (
            <article className="attention-selected-patient">
              <div className="attention-patient-avatar selected">
                {obtenerIniciales(
                  pacienteSeleccionado
                )}
              </div>

              <div className="attention-selected-patient-main">
                <div>
                  <h3>
                    {obtenerNombreCompleto(
                      pacienteSeleccionado
                    )}
                  </h3>

                  <p>
                    CI:{' '}
                    {pacienteSeleccionado.ci ||
                      'Sin registro'}
                  </p>
                </div>

                <span>
                  Paciente seleccionado
                </span>
              </div>

              {consulta.citaId && (
                <div className="attention-linked-appointment">
                  <IconoCalendario />

                  <div>
                    <small>
                      Cita asociada
                    </small>

                    <strong>
                      {datosNavegacion.cita
                        ?.motivo ||
                        'Consulta odontológica'}
                    </strong>
                  </div>
                </div>
              )}
            </article>
          )}

          {pacienteSeleccionado &&
            (
              alergiasPaciente.length > 0 ||
              condicionesPaciente.length >
                0
            ) && (
              <div className="attention-patient-alerts">
                {alergiasPaciente.length >
                  0 && (
                  <article className="allergies">
                    <IconoAdvertencia />

                    <div>
                      <strong>
                        Alergias registradas
                      </strong>

                      <p>
                        {alergiasPaciente.join(
                          ', '
                        )}
                      </p>
                    </div>
                  </article>
                )}

                {condicionesPaciente.length >
                  0 && (
                  <article className="conditions">
                    <IconoDiagnostico />

                    <div>
                      <strong>
                        Condiciones crónicas
                      </strong>

                      <p>
                        {condicionesPaciente.join(
                          ', '
                        )}
                      </p>
                    </div>
                  </article>
                )}
              </div>
            )}

          <div className="attention-patient-list">
            {pacientesFiltrados.map(
              (paciente) => {
                const seleccionado =
                  pacienteSeleccionado?._id ===
                  paciente._id;

                return (
                  <button
                    type="button"
                    key={paciente._id}
                    className={`attention-patient-card ${
                      seleccionado
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      seleccionarPaciente(
                        paciente
                      )
                    }
                  >
                    <div className="attention-patient-avatar">
                      {obtenerIniciales(
                        paciente
                      )}
                    </div>

                    <div className="attention-patient-card-info">
                      <strong>
                        {obtenerNombreCompleto(
                          paciente
                        )}
                      </strong>

                      <span>
                        CI:{' '}
                        {paciente.ci ||
                          'Sin registro'}
                      </span>
                    </div>

                    <div className="attention-patient-card-status">
                      {seleccionado
                        ? 'Seleccionado'
                        : 'Elegir'}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <footer className="attention-navigation">
            <button
              type="button"
              className="attention-button primary"
              onClick={irPasoSiguiente}
            >
              Continuar
              <IconoSiguiente />
            </button>
          </footer>
        </section>
      )}

      {pasoActual === 2 && (
        <section className="attention-panel">
          <header className="attention-panel-header">
            <div>
              <IconoDiagnostico />

              <div>
                <h2>
                  Diagnóstico clínico
                </h2>

                <p>
                  Registra la valoración
                  realizada al paciente.
                </p>
              </div>
            </div>
          </header>

          <article className="attention-patient-banner">
            <div className="attention-patient-avatar selected">
              {obtenerIniciales(
                pacienteSeleccionado
              )}
            </div>

            <div>
              <strong>
                {obtenerNombreCompleto(
                  pacienteSeleccionado
                )}
              </strong>

              <span>
                CI:{' '}
                {pacienteSeleccionado?.ci ||
                  'Sin registro'}
              </span>
            </div>
          </article>

          <div className="attention-fields">
            <label className="attention-field full">
              <span>
                Motivo de consulta *
              </span>

              <textarea
                placeholder="Describe el motivo principal de la visita..."
                value={
                  consulta.motivoConsulta
                }
                onChange={(evento) =>
                  setConsulta((anterior) => ({
                    ...anterior,
                    motivoConsulta:
                      evento.target.value
                  }))
                }
              />
            </label>

            <label className="attention-field full">
              <span>
                Diagnóstico clínico *
              </span>

              <textarea
                placeholder="Registra el diagnóstico odontológico detallado..."
                value={consulta.diagnostico}
                onChange={(evento) =>
                  setConsulta((anterior) => ({
                    ...anterior,
                    diagnostico:
                      evento.target.value
                  }))
                }
              />
            </label>

            <label className="attention-field full">
              <span>
                Piezas dentales afectadas
              </span>

              <input
                type="text"
                placeholder="Ejemplo: 14, 15, 26, 46"
                value={
                  consulta.piezasDentales
                }
                onChange={(evento) =>
                  setConsulta((anterior) => ({
                    ...anterior,
                    piezasDentales:
                      evento.target.value
                  }))
                }
              />
            </label>
          </div>

          <footer className="attention-navigation">
            <button
              type="button"
              className="attention-button secondary"
              onClick={irPasoAnterior}
            >
              <IconoVolver />
              Volver
            </button>

            <button
              type="button"
              className="attention-button primary"
              onClick={irPasoSiguiente}
            >
              Continuar
              <IconoSiguiente />
            </button>
          </footer>
        </section>
      )}

      {pasoActual === 3 && (
        <section className="attention-panel final-step">
          <header className="attention-panel-header">
            <div>
              <IconoTratamiento />

              <div>
                <h2>
                  Tratamiento e insumos
                </h2>

                <p>
                  Documenta el procedimiento y
                  los materiales utilizados.
                </p>
              </div>
            </div>
          </header>

          <div className="attention-final-grid">
            <section className="attention-treatment-column">
              <h3>
                Datos del tratamiento
              </h3>

              <label className="attention-field">
                <span>
                  Tratamiento realizado *
                </span>

                <textarea
                  placeholder="Describe el procedimiento o plan de tratamiento..."
                  value={consulta.tratamiento}
                  onChange={(evento) =>
                    setConsulta((anterior) => ({
                      ...anterior,
                      tratamiento:
                        evento.target.value
                    }))
                  }
                />
              </label>

              <label className="attention-field">
                <span>
                  Prescripción y recomendaciones
                </span>

                <textarea
                  placeholder="Medicamentos, cuidados o indicaciones para el paciente..."
                  value={consulta.prescripcion}
                  onChange={(evento) =>
                    setConsulta((anterior) => ({
                      ...anterior,
                      prescripcion:
                        evento.target.value
                    }))
                  }
                />
              </label>

              <label className="attention-field">
                <span>
                  Observaciones finales
                </span>

                <textarea
                  placeholder="Observaciones clínicas adicionales..."
                  value={consulta.observaciones}
                  onChange={(evento) =>
                    setConsulta((anterior) => ({
                      ...anterior,
                      observaciones:
                        evento.target.value
                    }))
                  }
                />
              </label>
            </section>

            <section className="attention-supplies-column">
              <h3>
                Consumo de insumos
              </h3>

              <div className="attention-field attention-supply-picker">
                <span>Insumo utilizado</span>
                <div className="attention-supply-search">
                  <IconoBuscar />
                  <input
                    type="search"
                    autoComplete="off"
                    placeholder="Buscar insumo por nombre..."
                    value={busquedaInsumo}
                    onFocus={() => setMostrarInsumos(true)}
                    onChange={(evento) => {
                      setBusquedaInsumo(evento.target.value);
                      setInsumoSeleccionado((anterior) => ({ ...anterior, insumoId: '' }));
                      setMostrarInsumos(true);
                    }}
                    aria-expanded={mostrarInsumos}
                  />
                </div>
                {mostrarInsumos && (
                  <div className="attention-supply-results">
                    {insumosFiltrados.length > 0 ? insumosFiltrados.map((insumo) => (
                      <button key={insumo._id} type="button" onClick={() => seleccionarInsumo(insumo)}>
                        <span>{insumo.nombre}</span>
                        <small>Stock: {insumo.stockActual} {insumo.unidadMedida || ''}</small>
                      </button>
                    )) : <p>No se encontraron insumos.</p>}
                  </div>
                )}
              </div>

              <div className="attention-supply-add-row">
                <label className="attention-field">
                  <span>
                    Cantidad utilizada
                  </span>

                  <input
                    type="number"
                    min="1"
                    max={
                      insumoActual
                        ?.stockActual || undefined
                    }
                    value={
                      insumoSeleccionado
                        .cantidadUtilizada
                    }
                    onChange={(evento) =>
                      setInsumoSeleccionado(
                        (anterior) => ({
                          ...anterior,
                          cantidadUtilizada:
                            evento.target.value
                        })
                      )
                    }
                  />
                </label>

                <button
                  type="button"
                  className="attention-add-supply"
                  onClick={agregarInsumo}
                >
                  <IconoAgregar />
                  Agregar
                </button>
              </div>

              {insumoActual && (
                <div className="attention-stock-indicator">
                  <span>Stock disponible</span>

                  <strong>
                    {insumoActual.stockActual}{' '}
                    {insumoActual.unidadMedida}
                  </strong>
                </div>
              )}

              <div className="attention-selected-supplies">
                <header>
                  <h4>
                    Insumos seleccionados
                  </h4>

                  <span>
                    {consumos.length}
                  </span>
                </header>

                {consumos.length === 0 ? (
                  <div className="attention-no-supplies">
                    No se agregaron insumos.
                    Puede guardar la atención sin
                    consumos.
                  </div>
                ) : (
                  consumos.map((consumo) => (
                    <article
                      key={consumo.insumoId}
                      className="attention-supply-item"
                    >
                      <div>
                        <strong>
                          {consumo.nombre}
                        </strong>

                        <span>
                          Stock disponible:{' '}
                          {consumo.stockActual}
                        </span>
                      </div>

                      <input
                        type="number"
                        min="1"
                        max={
                          consumo.stockActual
                        }
                        value={
                          consumo.cantidadUtilizada
                        }
                        onChange={(evento) =>
                          cambiarCantidadConsumo(
                            consumo.insumoId,
                            evento.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        title="Quitar insumo"
                        onClick={() =>
                          quitarInsumo(
                            consumo.insumoId
                          )
                        }
                      >
                        <IconoEliminar />
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="attention-summary">
            <header>
              <h3>
                Resumen de la atención
              </h3>

              <span>
                Revisa los datos antes de
                guardar
              </span>
            </header>

            <div className="attention-summary-grid">
              <article>
                <span>Paciente</span>

                <strong>
                  {obtenerNombreCompleto(
                    pacienteSeleccionado
                  )}
                </strong>
              </article>

              <article>
                <span>Odontólogo</span>

                <strong>
                  Dr.{' '}
                  {usuario?.nombre ||
                    'Sin registro'}
                </strong>
              </article>

              <article>
                <span>Diagnóstico</span>

                <strong>
                  {consulta.diagnostico ||
                    'Sin registro'}
                </strong>
              </article>

              <article>
                <span>Piezas dentales</span>

                <strong>
                  {consulta.piezasDentales ||
                    'No especificadas'}
                </strong>
              </article>

              <article className="wide">
                <span>Tratamiento</span>

                <strong>
                  {consulta.tratamiento ||
                    'Sin registro'}
                </strong>
              </article>

              <article>
                <span>Insumos</span>

                <strong>
                  {consumos.length}{' '}
                  {consumos.length === 1
                    ? 'seleccionado'
                    : 'seleccionados'}
                </strong>
              </article>
            </div>
          </section>

          <footer className="attention-navigation">
            <button
              type="button"
              className="attention-button secondary"
              onClick={irPasoAnterior}
              disabled={guardando}
            >
              <IconoVolver />
              Volver
            </button>

            <button
              type="button"
              className="attention-button save"
              onClick={registrarAtencion}
              disabled={guardando}
            >
              <IconoGuardar />

              {guardando
                ? 'Guardando atención...'
                : 'Guardar atención médica'}
            </button>
          </footer>
        </section>
      )}
    </main>
  );
};

export default AtencionMedica;