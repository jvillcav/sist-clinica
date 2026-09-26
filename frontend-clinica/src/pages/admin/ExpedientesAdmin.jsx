import {
  useEffect,
  useMemo,
  useState
} from 'react';

import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { obtenerArreglo } from '../../utils/respuesta';
import { normalizarTexto } from '../../utils/texto';
import '../../styles/admin/expedientesAdmin.css';

/* =====================================================
   ICONOS
===================================================== */

const IconoArchivo = () => (
  <svg viewBox="0 0 24 24">
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M15 3v5h5M9 13h6M9 17h6" />
  </svg>
);

const IconoPacientes = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="10" r="2.5" />
    <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6" />
    <path d="M15 15c3 0 5 1.8 5 5" />
  </svg>
);

const IconoCalendario = () => (
  <svg viewBox="0 0 24 24">
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
    />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const IconoOdontologo = () => (
  <svg viewBox="0 0 24 24">
    <path d="M7 3c-2 1-3 3-3 6 0 5 3 11 5 11 2 0 1-5 3-5s1 5 3 5c2 0 5-6 5-11 0-3-1-5-3-6-2-1-3 1-5 1S9 2 7 3Z" />
  </svg>
);

const IconoActivo = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const IconoAnulado = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 8 8 8" />
  </svg>
);

const IconoBuscar = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6 8a7 7 0 0 1 12-2l2 2" />
    <path d="M18 16a7 7 0 0 1-12 2l-2-2" />
  </svg>
);

const IconoVer = () => (
  <svg viewBox="0 0 24 24">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const IconoVolver = () => (
  <svg viewBox="0 0 24 24">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoCheck = () => (
  <svg viewBox="0 0 24 24">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

/* =====================================================
   UTILIDADES
===================================================== */

const obtenerNombreCompleto = (
  persona
) => {
  if (!persona) {
    return 'Sin registro';
  }

  return [
    persona.nombre,
    persona.apellido
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const obtenerIniciales = (
  nombre = ''
) => {
  const partes = String(nombre)
    .trim()
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

  return `${partes[0][0]}${
    partes[1][0]
  }`.toUpperCase();
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return 'Sin fecha';
  }

  const valor = new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return 'Sin fecha';
  }

  return valor.toLocaleDateString(
    'es-BO',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );
};

const formatearFechaHora = (
  fecha
) => {
  if (!fecha) {
    return 'Sin registro';
  }

  const valor = new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return 'Sin registro';
  }

  return valor.toLocaleString(
    'es-BO',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
};

/* =====================================================
   COMPONENTE
===================================================== */

const Expedientes = () => {
  const [
    expedientes,
    setExpedientes
  ] = useState([]);

  const [
    odontologos,
    setOdontologos
  ] = useState([]);

  const [
    resumen,
    setResumen
  ] = useState({
    totalExpedientes: 0,
    expedientesActivos: 0,
    expedientesAnulados: 0,
    atencionesMes: 0,
    pacientesConHistorial: 0,
    odontologosConAtenciones: 0
  });

  const [
    busqueda,
    setBusqueda
  ] = useState('');

  const [
    filtroOdontologo,
    setFiltroOdontologo
  ] = useState('todos');

  const [
    filtroEstado,
    setFiltroEstado
  ] = useState('todos');

  const [
    fechaDesde,
    setFechaDesde
  ] = useState('');

  const [
    fechaHasta,
    setFechaHasta
  ] = useState('');

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [tamanoPagina, setTamanoPagina] =
    useState(10);

  const [
    expedienteSeleccionado,
    setExpedienteSeleccionado
  ] = useState(null);

  const [
    consumosSeleccionados,
    setConsumosSeleccionados
  ] = useState([]);

  const [
    historialSeleccionado,
    setHistorialSeleccionado
  ] = useState([]);

  const [
    mostrarDetalle,
    setMostrarDetalle
  ] = useState(false);

  const [
    mostrarAnulacion,
    setMostrarAnulacion
  ] = useState(false);

  const [
    motivoAnulacion,
    setMotivoAnulacion
  ] = useState('');

  const [
    cargando,
    setCargando
  ] = useState(true);

  const [
    cargandoDetalle,
    setCargandoDetalle
  ] = useState(false);

  const [
    procesando,
    setProcesando
  ] = useState(false);

  const [
    mensaje,
    setMensaje
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  useEffect(() => {
    cargarInformacion();
  }, []);

  /* ===================================================
     CARGA
  =================================================== */

  const cargarInformacion =
    async () => {
      try {
        setCargando(true);
        setError('');

        const resultados =
          await Promise.allSettled([
            api.get(
              '/expedientes'
            ),

            api.get(
              '/expedientes/resumen'
            ),

            api.get(
              '/usuarios/odontologos'
            )
          ]);

        const [
          resultadoExpedientes,
          resultadoResumen,
          resultadoOdontologos
        ] = resultados;

        if (
          resultadoExpedientes.status ===
          'fulfilled'
        ) {
          setExpedientes(
            obtenerArreglo(
              resultadoExpedientes.value,
              'expedientes'
            )
          );
        } else {
          console.error(
            'Error en expedientes:',
            resultadoExpedientes.reason
          );

          setExpedientes([]);
        }

        if (
          resultadoResumen.status ===
          'fulfilled'
        ) {
          setResumen(
            resultadoResumen.value
              .data?.resumen || {
              totalExpedientes: 0,
              expedientesActivos: 0,
              expedientesAnulados: 0,
              atencionesMes: 0,
              pacientesConHistorial: 0,
              odontologosConAtenciones: 0
            }
          );
        }

        if (
          resultadoOdontologos.status ===
          'fulfilled'
        ) {
          setOdontologos(
            obtenerArreglo(
              resultadoOdontologos.value,
              'odontologos'
            )
          );
        }

        const errores = [];

        if (
          resultadoExpedientes.status ===
          'rejected'
        ) {
          errores.push(
            'expedientes'
          );
        }

        if (
          resultadoResumen.status ===
          'rejected'
        ) {
          errores.push(
            'indicadores'
          );
        }

        if (
          resultadoOdontologos.status ===
          'rejected'
        ) {
          errores.push(
            'odontólogos'
          );
        }

        if (
          errores.length > 0
        ) {
          setError(
            `No se pudieron cargar: ${errores.join(
              ', '
            )}.`
          );
        }
      } finally {
        setCargando(false);
      }
    };

  /* ===================================================
     FILTROS
  =================================================== */

  const expedientesFiltrados =
    useMemo(() => {
      const texto =
        normalizarTexto(
          busqueda
        );

      return expedientes.filter(
        (expediente) => {
          const paciente =
            expediente.pacienteId;

          const odontologoId =
            expediente.odontologoId
              ?._id ||
            expediente.odontologoId ||
            '';

          const fecha =
            expediente.fechaAtencion
              ? new Date(
                  expediente.fechaAtencion
                )
              : null;

          const coincideBusqueda =
            !texto ||
            normalizarTexto(
              [
                obtenerNombreCompleto(
                  paciente
                ),
                paciente?.ci,
                expediente.diagnostico,
                expediente.tratamiento,
                expediente.motivoConsulta,
                expediente.odontologo
              ]
                .filter(Boolean)
                .join(' ')
            ).includes(texto);

          const coincideOdontologo =
            filtroOdontologo ===
              'todos' ||
            String(
              odontologoId
            ) ===
              String(
                filtroOdontologo
              );

          const coincideEstado =
            filtroEstado ===
              'todos' ||
            expediente.estadoRegistro ===
              filtroEstado;

          let coincideDesde = true;
          let coincideHasta = true;

          if (
            fechaDesde &&
            fecha
          ) {
            const desde =
              new Date(
                `${fechaDesde}T00:00:00`
              );

            coincideDesde =
              fecha >= desde;
          }

          if (
            fechaHasta &&
            fecha
          ) {
            const hasta =
              new Date(
                `${fechaHasta}T23:59:59`
              );

            coincideHasta =
              fecha <= hasta;
          }

          return (
            coincideBusqueda &&
            coincideOdontologo &&
            coincideEstado &&
            coincideDesde &&
            coincideHasta
          );
        }
      );
    }, [
      expedientes,
      busqueda,
      filtroOdontologo,
      filtroEstado,
      fechaDesde,
      fechaHasta
    ]);

  const resumenPorPaciente =
    useMemo(() => {
      const pacientes = new Map();

      expedientes.forEach((expediente) => {
        const pacienteId =
          expediente.pacienteId?._id ||
          expediente.pacienteId;

        if (!pacienteId) {
          return;
        }

        const clave = String(pacienteId);
        const estado = pacientes.get(clave) || {
          activo: false,
          anulado: false
        };

        if (expediente.estadoRegistro === 'anulado') {
          estado.anulado = true;
        } else {
          estado.activo = true;
        }

        pacientes.set(clave, estado);
      });

      const valores = Array.from(pacientes.values());

      return {
        total: valores.length,
        activos: valores.filter((item) => item.activo).length,
        anulados: valores.filter(
          (item) => item.anulado && !item.activo
        ).length
      };
    }, [expedientes]);

  const expedientesAgrupados =
    useMemo(() => {
      const grupos = new Map();

      expedientesFiltrados.forEach((expediente) => {
        const pacienteId =
          expediente.pacienteId?._id ||
          expediente.pacienteId;

        if (!pacienteId) {
          return;
        }

        const clave = String(pacienteId);
        const grupo = grupos.get(clave);

        if (grupo) {
          grupo.atenciones.push(expediente);
        } else {
          grupos.set(clave, {
            pacienteId: expediente.pacienteId,
            atenciones: [expediente]
          });
        }
      });

      return Array.from(grupos.values()).map((grupo) => ({
        ...grupo,
        ultimaAtencion: grupo.atenciones[0],
        activas: grupo.atenciones.filter(
          (item) => item.estadoRegistro !== 'anulado'
        ).length
      }));
    }, [expedientesFiltrados]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroOdontologo, filtroEstado, fechaDesde, fechaHasta]);

  const expedientesPaginados = useMemo(() => {
    const inicio =
      (paginaActual - 1) * tamanoPagina;

    return expedientesAgrupados.slice(
      inicio,
      inicio + tamanoPagina
    );
  }, [expedientesAgrupados, paginaActual, tamanoPagina]);

  /* ===================================================
     DETALLE
  =================================================== */

  const abrirDetalle =
    async (grupo) => {
      try {
        setCargandoDetalle(true);
        setError('');

        const pacienteId =
          grupo.pacienteId?._id ||
          grupo.pacienteId;

        const [
          resultadoHistorial,
          resultadoUltimaAtencion
        ] = await Promise.all([
          api.get(
            `/expedientes/paciente/${pacienteId}`
          ),
          api.get(
            `/expedientes/${grupo.ultimaAtencion._id}`
          )
        ]);

        const historial =
          Array.isArray(resultadoHistorial.data.expedientes)
            ? resultadoHistorial.data.expedientes
            : grupo.atenciones;

        setExpedienteSeleccionado(
          resultadoUltimaAtencion.data.expediente ||
            historial[0] ||
            null
        );
        setHistorialSeleccionado(
          historial
        );
        setConsumosSeleccionados(
          Array.isArray(resultadoUltimaAtencion.data.consumos)
            ? resultadoUltimaAtencion.data.consumos
            : []
        );
        setMostrarDetalle(true);
      } catch (errorPeticion) {
        setError(
          errorPeticion.response?.data?.mensaje ||
            'No se pudo obtener el historial clínico del paciente.'
        );
      } finally {
        setCargandoDetalle(false);
      }
    };

  const cerrarDetalle = () => {
    if (procesando) {
      return;
    }

    setMostrarDetalle(false);
    setExpedienteSeleccionado(
      null
    );
    setConsumosSeleccionados(
      []
    );
    setHistorialSeleccionado([]);
    setMostrarAnulacion(false);
    setMotivoAnulacion('');
  };

  /* ===================================================
     ANULACIÓN
  =================================================== */

  const abrirAnulacion = (expediente) => {
    setExpedienteSeleccionado(expediente);
    setMotivoAnulacion('');
    setMostrarAnulacion(true);
  };

  const anularExpediente =
    async (evento) => {
      evento.preventDefault();

      if (
        motivoAnulacion
          .trim()
          .length < 10
      ) {
        setError(
          'Registra un motivo de anulación de al menos 10 caracteres.'
        );

        return;
      }

      try {
        setProcesando(true);
        setError('');
        setMensaje('');

        const { data } =
          await api.patch(
            `/expedientes/${expedienteSeleccionado._id}/anular`,
            {
              motivoAnulacion:
                motivoAnulacion.trim()
            }
          );

        setMensaje(
          data.mensaje ||
            'Expediente anulado correctamente.'
        );

        setMostrarAnulacion(false);
        setMostrarDetalle(false);
        setExpedienteSeleccionado(
          null
        );

        await cargarInformacion();
      } catch (
        errorPeticion
      ) {
        setError(
          errorPeticion.response
            ?.data?.mensaje ||
            'No se pudo anular el expediente.'
        );
      } finally {
        setProcesando(false);
      }
    };

  /* ===================================================
     CARGA INICIAL
  =================================================== */

  if (cargando) {
    return (
      <section className="admin-records-loading">
        <div className="admin-records-spinner" />

        <h2>
          Cargando expedientes
        </h2>

        <p>
          Consultando historiales y
          registros clínicos.
        </p>
      </section>
    );
  }

  return (
    <main className="admin-records-page">
      {/* ENCABEZADO */}

      <header className="admin-records-header">
        <div>
          <span className="admin-records-eyebrow">
            Gestión clínica
          </span>

          <h1>
            Expedientes clínicos
          </h1>

          <p>
            Consulta y supervisa los
            diagnósticos, tratamientos y
            evolución de los pacientes.
          </p>
        </div>

        <button
          type="button"
          className="admin-records-refresh"
          onClick={
            cargarInformacion
          }
        >
          <IconoActualizar />
          Actualizar
        </button>
      </header>

      {/* MENSAJES */}

      {mensaje && (
        <div className="admin-records-message success">
          <IconoCheck />
          <span>{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="admin-records-message error">
          <IconoAdvertencia />
          <span>{error}</span>
        </div>
      )}

      {/* INDICADORES */}

      <section className="admin-records-summary">
        <article className="total">
          <div>
            <span>
              Total expedientes
            </span>

            <strong>
              {
                resumenPorPaciente.total
              }
            </strong>
          </div>

          <IconoArchivo />
        </article>

        <article className="active">
          <div>
            <span>
              Expedientes activos
            </span>

            <strong>
              {
                resumenPorPaciente.activos
              }
            </strong>
          </div>

          <IconoActivo />
        </article>

        <article className="patients">
          <div>
            <span>
              Pacientes con historial
            </span>

            <strong>
              {
                resumen.pacientesConHistorial
              }
            </strong>
          </div>

          <IconoPacientes />
        </article>

        <article className="month">
          <div>
            <span>
              Atenciones este mes
            </span>

            <strong>
              {
                resumen.atencionesMes
              }
            </strong>
          </div>

          <IconoCalendario />
        </article>

        <article className="dentists">
          <div>
            <span>
              Odontólogos participantes
            </span>

            <strong>
              {
                resumen.odontologosConAtenciones
              }
            </strong>
          </div>

          <IconoOdontologo />
        </article>

        <article className="cancelled">
          <div>
            <span>
              Expedientes anulados
            </span>

            <strong>
              {
                resumenPorPaciente.anulados
              }
            </strong>
          </div>

          <IconoAnulado />
        </article>
      </section>

      {/* FILTROS */}

      <section className="admin-records-toolbar">
        <label className="records-search">
          <span>
            Buscar expediente
          </span>

          <div>
            <IconoBuscar />

            <input
              type="search"
              value={busqueda}
              placeholder="Paciente, CI, diagnóstico o tratamiento..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
            />
          </div>
        </label>

        <label>
          <span>
            Odontólogo
          </span>

          <select
            value={
              filtroOdontologo
            }
            onChange={(evento) =>
              setFiltroOdontologo(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            {odontologos.map(
              (odontologo) => (
                <option
                  key={
                    odontologo._id
                  }
                  value={
                    odontologo._id
                  }
                >
                  {obtenerNombreCompleto(
                    odontologo
                  )}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span>Estado</span>

          <select
            value={
              filtroEstado
            }
            onChange={(evento) =>
              setFiltroEstado(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="activo">
              Activos
            </option>

            <option value="anulado">
              Anulados
            </option>
          </select>
        </label>

        <label>
          <span>
            Desde
          </span>

          <input
            type="date"
            value={fechaDesde}
            onChange={(evento) =>
              setFechaDesde(
                evento.target.value
              )
            }
          />
        </label>

        <label>
          <span>
            Hasta
          </span>

          <input
            type="date"
            value={fechaHasta}
            onChange={(evento) =>
              setFechaHasta(
                evento.target.value
              )
            }
          />
        </label>
      </section>

      {/* LISTADO */}

      <section className="admin-records-list-card">
        <header>
          <div>
            <span>
              Historial clínico
            </span>

            <h2>
              Listado de expedientes
            </h2>

            <p>
              {
                expedientesAgrupados.length
              }{' '}
              {expedientesAgrupados.length ===
              1
                ? 'registro encontrado'
                : 'registros encontrados'}
            </p>
          </div>
        </header>

        {expedientesAgrupados.length ===
        0 ? (
          <div className="admin-records-empty">
            <IconoArchivo />

            <h3>
              No se encontraron expedientes
            </h3>

            <p>
              Ajusta los filtros o registra
              una atención desde el panel del
              odontólogo.
            </p>
          </div>
        ) : (
          <div className="admin-records-table-wrapper">
            <table className="admin-records-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Odontólogo</th>
                  <th>Diagnóstico</th>
                  <th>Tratamiento</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {expedientesPaginados.map(
                  (grupo) => {
                    const expediente =
                      grupo.ultimaAtencion;
                    const paciente =
                      expediente.pacienteId;

                    const nombrePaciente =
                      obtenerNombreCompleto(
                        paciente
                      );

                    const nombreOdontologo =
                      expediente.odontologoId
                        ? obtenerNombreCompleto(
                            expediente.odontologoId
                          )
                        : expediente.odontologo ||
                          'Sin registro';

                    return (
                      <tr
                        key={
                          grupo.pacienteId?._id ||
                          grupo.pacienteId
                        }
                      >
                        <td>
                          <div className="record-patient">
                            <span>
                              {obtenerIniciales(
                                nombrePaciente
                              )}
                            </span>

                            <div>
                              <strong>
                                {
                                  nombrePaciente
                                }
                              </strong>

                              <small>
                                CI:{' '}
                                {paciente?.ci ||
                                  'Sin registro'}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="record-date">
                            <strong>
                              {formatearFecha(
                                expediente.fechaAtencion
                              )}
                            </strong>

                            <small>
                              Registrado:{' '}
                              {formatearFecha(
                                expediente.createdAt
                              )}
                            </small>
                          </div>
                        </td>

                        <td>
                          {
                            nombreOdontologo
                          }
                        </td>

                        <td>
                          <p className="record-clinical-text">
                            {grupo.atenciones.length}{' '}
                            {grupo.atenciones.length === 1
                              ? 'diagnóstico registrado'
                              : 'diagnósticos registrados'}
                          </p>
                        </td>

                        <td>
                          <p className="record-clinical-text">
                            Última atención:{' '}
                            {expediente.tratamiento}
                          </p>
                        </td>

                        <td>
                          <span
                            className={`record-status ${
                              grupo.activas > 0
                                ? 'activo'
                                : 'anulado'
                            }`}
                          >
                            {grupo.activas > 0
                              ? 'Activo'
                              : 'Anulado'}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="record-view-button"
                            title="Ver detalle"
                            disabled={
                              cargandoDetalle
                            }
                            onClick={() =>
                              abrirDetalle(
                                grupo
                              )
                            }
                          >
                            <IconoVer />
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={paginaActual}
          pageSize={tamanoPagina}
          totalItems={expedientesAgrupados.length}
          onPageChange={setPaginaActual}
          onPageSizeChange={(size) => {
            setTamanoPagina(size);
            setPaginaActual(1);
          }}
          label="expedientes"
        />
      </section>

      {/* MODAL DETALLE */}

      {mostrarDetalle &&
        expedienteSeleccionado && (
          <div
            className="record-modal-overlay"
            onMouseDown={(evento) => {
              if (
                evento.target ===
                evento.currentTarget
              ) {
                cerrarDetalle();
              }
            }}
          >
            <section className="record-modal">
              <header>
                <div>
                  <span>
                    Expediente clínico
                  </span>

                  <h2>
                    Expediente unificado
                  </h2>

                  <p>
                    Todas las atenciones, diagnósticos y
                    tratamientos del paciente.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={
                    cerrarDetalle
                  }
                >
                  <IconoCerrar />
                </button>
              </header>

              <div className="record-modal-content">
                <section className="record-person-card">
                  <span className="record-person-avatar">
                    {obtenerIniciales(
                      obtenerNombreCompleto(
                        expedienteSeleccionado.pacienteId
                      )
                    )}
                  </span>

                  <div>
                    <h3>
                      {obtenerNombreCompleto(
                        expedienteSeleccionado.pacienteId
                      )}
                    </h3>

                    <p>
                      CI:{' '}
                      {expedienteSeleccionado
                        .pacienteId?.ci ||
                        'Sin registro'}
                    </p>

                    <span
                      className={`record-status ${
                        expedienteSeleccionado.estadoRegistro ||
                        'activo'
                      }`}
                    >
                      {expedienteSeleccionado.estadoRegistro ===
                      'anulado'
                        ? 'Expediente anulado'
                        : 'Expediente activo'}
                    </span>
                  </div>
                </section>

                <section className="record-info-grid">
                  <article>
                    <span>
                      Fecha de atención
                    </span>

                    <strong>
                      {formatearFechaHora(
                        expedienteSeleccionado.fechaAtencion
                      )}
                    </strong>
                  </article>

                  <article>
                    <span>
                      Odontólogo
                    </span>

                    <strong>
                      {expedienteSeleccionado
                        .odontologoId
                        ? obtenerNombreCompleto(
                            expedienteSeleccionado.odontologoId
                          )
                        : expedienteSeleccionado.odontologo ||
                          'Sin registro'}
                    </strong>
                  </article>

                  <article>
                    <span>
                      Cita asociada
                    </span>

                    <strong>
                      {expedienteSeleccionado
                        .citaId
                        ? `${formatearFecha(
                            expedienteSeleccionado
                              .citaId
                              .fecha
                          )} · ${
                            expedienteSeleccionado
                              .citaId
                              .hora ||
                            'Sin hora'
                          }`
                        : 'Atención sin cita'}
                    </strong>
                  </article>

                  <article>
                    <span>
                      Piezas dentales
                    </span>

                    <strong>
                      {expedienteSeleccionado.piezasDentales ||
                        'Sin registro'}
                    </strong>
                  </article>
                </section>

                <section className="record-clinical-grid">
                  <article>
                    <h4>
                      Motivo de consulta
                    </h4>

                    <p>
                      {expedienteSeleccionado.motivoConsulta ||
                        'Sin registro'}
                    </p>
                  </article>

                  <article>
                    <h4>
                      Diagnóstico
                    </h4>

                    <p>
                      {
                        expedienteSeleccionado.diagnostico
                      }
                    </p>
                  </article>

                  <article>
                    <h4>
                      Tratamiento
                    </h4>

                    <p>
                      {
                        expedienteSeleccionado.tratamiento
                      }
                    </p>
                  </article>

                  <article>
                    <h4>
                      Prescripción
                    </h4>

                    <p>
                      {expedienteSeleccionado.prescripcion ||
                        'Sin prescripción registrada'}
                    </p>
                  </article>
                </section>

                <section className="record-history">
                  <header>
                    <div>
                      <h4>Historial de diagnósticos</h4>
                      <p>
                        Todas las atenciones clínicas del paciente,
                        de la más reciente a la más antigua.
                      </p>
                    </div>
                    <strong>
                      {historialSeleccionado.length}{' '}
                      {historialSeleccionado.length === 1
                        ? 'atención'
                        : 'atenciones'}
                    </strong>
                  </header>

                  <div className="record-history-list">
                    {historialSeleccionado.map((atencion, indice) => (
                      <article
                        className="record-history-item"
                        key={atencion._id}
                      >
                        <header>
                          <div>
                            <span>Atención {historialSeleccionado.length - indice}</span>
                            <h4>{formatearFechaHora(atencion.fechaAtencion)}</h4>
                          </div>
                          <span
                            className={`record-status ${atencion.estadoRegistro || 'activo'}`}
                          >
                            {atencion.estadoRegistro === 'anulado'
                              ? 'Anulada'
                              : 'Activa'}
                          </span>
                        </header>

                        <dl>
                          <div>
                            <dt>Odontólogo</dt>
                            <dd>
                              {atencion.odontologoId
                                ? obtenerNombreCompleto(atencion.odontologoId)
                                : atencion.odontologo || 'Sin registro'}
                            </dd>
                          </div>
                          <div>
                            <dt>Diagnóstico</dt>
                            <dd>{atencion.diagnostico}</dd>
                          </div>
                          <div>
                            <dt>Tratamiento</dt>
                            <dd>{atencion.tratamiento}</dd>
                          </div>
                          <div>
                            <dt>Motivo de consulta</dt>
                            <dd>{atencion.motivoConsulta || 'Sin registro'}</dd>
                          </div>
                          <div>
                            <dt>Prescripción</dt>
                            <dd>{atencion.prescripcion || 'Sin registro'}</dd>
                          </div>
                          <div>
                            <dt>Observaciones</dt>
                            <dd>{atencion.observaciones || 'Sin registro'}</dd>
                          </div>
                        </dl>

                        {atencion.estadoRegistro !== 'anulado' && (
                          <button
                            type="button"
                            className="record-danger record-history-cancel"
                            onClick={() => abrirAnulacion(atencion)}
                          >
                            <IconoAnulado />
                            Anular esta atención
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>

                <section className="record-observations">
                  <h4>
                    Observaciones
                  </h4>

                  <p>
                    {expedienteSeleccionado.observaciones ||
                      'Sin observaciones registradas.'}
                  </p>
                </section>

                <section className="record-supplies">
                  <header>
                    <h4>
                      Insumos utilizados
                    </h4>

                    <span>
                      {
                        consumosSeleccionados.length
                      }{' '}
                      registros
                    </span>
                  </header>

                  {consumosSeleccionados.length ===
                  0 ? (
                    <p className="record-supplies-empty">
                      No se registraron
                      insumos para esta
                      atención.
                    </p>
                  ) : (
                    <div className="record-supplies-list">
                      {consumosSeleccionados.map(
                        (consumo) => (
                          <article
                            key={
                              consumo._id
                            }
                          >
                            <div>
                              <strong>
                                {consumo
                                  .insumoId
                                  ?.nombre ||
                                  'Insumo no disponible'}
                              </strong>

                              <small>
                                {consumo
                                  .insumoId
                                  ?.unidad ||
                                  'unidad'}
                              </small>
                            </div>

                            <span>
                              {
                                consumo.cantidadUtilizada
                              }
                            </span>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </section>

                {expedienteSeleccionado.estadoRegistro ===
                  'anulado' && (
                  <section className="record-cancellation-info">
                    <h4>
                      Información de anulación
                    </h4>

                    <p>
                      {expedienteSeleccionado.motivoAnulacion ||
                        'Sin motivo registrado.'}
                    </p>

                    <small>
                      {formatearFechaHora(
                        expedienteSeleccionado.fechaAnulacion
                      )}
                    </small>
                  </section>
                )}

                <footer className="record-modal-footer">
                  <button
                    type="button"
                    className="record-secondary"
                    onClick={
                      cerrarDetalle
                    }
                  >
                    <IconoVolver />
                    Cerrar
                  </button>

                </footer>
              </div>
            </section>
          </div>
        )}

      {/* MODAL ANULACIÓN */}

      {mostrarAnulacion &&
        expedienteSeleccionado && (
          <div className="record-modal-overlay elevated">
            <section className="record-modal small">
              <header>
                <div>
                  <span>
                    Control administrativo
                  </span>

                  <h2>
                    Anular expediente
                  </h2>

                  <p>
                    El registro permanecerá
                    disponible para auditoría.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarAnulacion(
                      false
                    )
                  }
                >
                  <IconoCerrar />
                </button>
              </header>

              <form
                className="record-cancellation-form"
                onSubmit={
                  anularExpediente
                }
              >
                <div className="record-warning">
                  <IconoAdvertencia />

                  <p>
                    Esta acción no elimina
                    físicamente el expediente.
                    Únicamente lo marcará como
                    anulado.
                  </p>
                </div>

                <label>
                  <span>
                    Motivo de anulación *
                  </span>

                  <textarea
                    value={
                      motivoAnulacion
                    }
                    placeholder="Explique por qué debe anularse este expediente..."
                    onChange={(evento) =>
                      setMotivoAnulacion(
                        evento.target.value
                      )
                    }
                    minLength={10}
                    required
                  />
                </label>

                {error && (
                  <div className="record-form-feedback" role="alert">
                    <IconoAdvertencia />
                    <span>{error}</span>
                  </div>
                )}

                <footer>
                  <button
                    type="button"
                    className="record-secondary"
                    onClick={() =>
                      setMostrarAnulacion(
                        false
                      )
                    }
                    disabled={
                      procesando
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="record-danger"
                    disabled={
                      procesando
                    }
                  >
                    {procesando
                      ? 'Anulando...'
                      : 'Confirmar anulación'}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}
    </main>
  );
};

export default Expedientes;