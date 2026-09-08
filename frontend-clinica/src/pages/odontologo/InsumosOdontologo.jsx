import {
  useEffect,
  useMemo,
  useState
} from 'react';


import api from '../../api/axios';
import '../../styles/odontologo/insumosOdontologo.css';

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

const obtenerFechaLocal = (fecha) => {
  if (!fecha) {
    return null;
  }

  const valor = String(fecha);
  const fechaObjeto = new Date(valor);

  return Number.isNaN(fechaObjeto.getTime())
    ? null
    : fechaObjeto;
};

const obtenerInicioHoy = () => {
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  return hoy;
};

const obtenerInicioSemana = () => {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diferencia =
    dia === 0 ? 6 : dia - 1;

  hoy.setDate(
    hoy.getDate() - diferencia
  );

  hoy.setHours(0, 0, 0, 0);

  return hoy;
};

const obtenerInicioMes = () => {
  const hoy = new Date();

  return new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  );
};

const obtenerEstadoStock = (insumo) => {
  if (!insumo) {
    return {
      clase: 'sin-datos',
      etiqueta: 'Sin datos'
    };
  }

  const actual =
    Number(insumo.stockActual || 0);

  const minimo =
    Number(insumo.stockMinimo || 0);

  if (actual <= 0) {
    return {
      clase: 'agotado',
      etiqueta: 'Agotado'
    };
  }

  if (actual <= minimo) {
    return {
      clase: 'bajo',
      etiqueta: 'Bajo stock'
    };
  }

  return {
    clase: 'disponible',
    etiqueta: 'Disponible'
  };
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

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6.1 8A7 7 0 0 1 18 6l2 2" />
    <path d="M17.9 16A7 7 0 0 1 6 18l-2-2" />
  </svg>
);

const IconoCaja = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 7 8-4 8 4-8 4-8-4Z" />
    <path d="M4 7v10l8 4 8-4V7" />
    <path d="M12 11v10" />
  </svg>
);

const IconoUsuario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-5 3.5-8 8-8s8 3 8 8" />
  </svg>
);

const IconoExpediente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

/* =====================================================
   COMPONENTE
===================================================== */

const InsumosOdontologo = () => {
  const [consumos, setConsumos] =
    useState([]);

  const [resumenBackend, setResumenBackend] =
    useState({
      totalRegistros: 0,
      unidadesUtilizadas: 0,
      pacientesAtendidos: 0,
      insumosBajoStock: 0
    });

  const [odontologo, setOdontologo] =
    useState(null);

  const [busqueda, setBusqueda] =
    useState('');

  const [periodo, setPeriodo] =
    useState('todos');

  const [estadoStock, setEstadoStock] =
    useState('todos');

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    cargarConsumos();
  }, []);

  const cargarConsumos = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get(
        '/consumos-insumos/odontologo'
      );

      setOdontologo(
        data?.odontologo || null
      );

      setResumenBackend(
        data?.resumen || {
          totalRegistros: 0,
          unidadesUtilizadas: 0,
          pacientesAtendidos: 0,
          insumosBajoStock: 0
        }
      );

      setConsumos(
        Array.isArray(data?.consumos)
          ? data.consumos
          : []
      );
    } catch (errorPeticion) {
      console.error(
        'Error al cargar consumos:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo cargar el historial de consumos.'
      );
    } finally {
      setCargando(false);
    }
  };

  const consumosFiltrados = useMemo(() => {
    const texto =
      normalizarTexto(busqueda);

    const inicioHoy =
      obtenerInicioHoy();

    const inicioSemana =
      obtenerInicioSemana();

    const inicioMes =
      obtenerInicioMes();

    return consumos.filter((consumo) => {
      const insumo =
        consumo.insumoId;

      const expediente =
        consumo.expedienteId;

      const categoria =
        insumo?.categoriaId?.nombre ||
        insumo?.categoria?.nombre ||
        (typeof insumo?.categoria === 'string' ? insumo.categoria : '');

      const procedimiento =
        consumo.tipoTratamiento ||
        expediente?.tratamiento ||
        expediente?.diagnostico ||
        '';

      const coincideBusqueda =
        !texto ||
        normalizarTexto(
          insumo?.nombre
        ).includes(texto) ||
        normalizarTexto(
          categoria
        ).includes(texto) ||
        normalizarTexto(
          procedimiento
        ).includes(texto);

      const fechaConsumo =
        obtenerFechaLocal(
          consumo.fechaConsumo ||
            consumo.createdAt
        );

      let coincidePeriodo = true;

      if (fechaConsumo) {
        if (periodo === 'hoy') {
          coincidePeriodo =
            fechaConsumo >= inicioHoy;
        }

        if (periodo === 'semana') {
          coincidePeriodo =
            fechaConsumo >= inicioSemana;
        }

        if (periodo === 'mes') {
          coincidePeriodo =
            fechaConsumo >= inicioMes;
        }
      }

      const estado =
        obtenerEstadoStock(insumo);

      const coincideEstado =
        estadoStock === 'todos' ||
        estado.clase === estadoStock;

      return (
        coincideBusqueda &&
        coincidePeriodo &&
        coincideEstado
      );
    });
  }, [
    consumos,
    busqueda,
    periodo,
    estadoStock
  ]);

  const datasetConsolidado = useMemo(() => {
    const grupos = new Map();

    consumosFiltrados.forEach((consumo) => {
      const fecha = obtenerFechaLocal(
        consumo.fechaConsumo || consumo.createdAt
      );

      if (!fecha) {
        return;
      }

      const insumo = consumo.insumoId;
      const expediente = consumo.expedienteId;
      const pacienteId = expediente?.pacienteId?._id?.toString();
      const year = fecha.getFullYear();
      const month = fecha.getMonth() + 1;
      const periodoClave = `${year}-${String(month).padStart(2, '0')}`;
      const insumoId = insumo?._id?.toString() || 'insumo-eliminado';
      const clave = `${periodoClave}-${insumoId}`;
      const categoria =
        insumo?.categoriaId?.nombre ||
        insumo?.categoria?.nombre ||
        (typeof insumo?.categoria === 'string' ? insumo.categoria : '') ||
        'Sin categoría';
      const tratamiento =
        consumo.tipoTratamiento ||
        expediente?.tratamiento ||
        expediente?.diagnostico ||
        'Sin tratamiento';
      const grupo = grupos.get(clave) || {
        id: clave,
        periodo: periodoClave,
        year,
        month,
        trimestre: Math.ceil(month / 3),
        insumo: insumo?.nombre || 'Insumo eliminado',
        categoria,
        tratamientos: new Set(),
        pacientes: new Set(),
        cantidadTotal: 0
      };

      grupo.tratamientos.add(tratamiento);
      if (pacienteId) {
        grupo.pacientes.add(pacienteId);
      }
      grupo.cantidadTotal += Number(consumo.cantidadUtilizada || 0);
      grupos.set(clave, grupo);
    });

    return Array.from(grupos.values())
      .map((grupo) => ({
        ...grupo,
        tratamiento: Array.from(grupo.tratamientos).join(', '),
        numeroPacientes: grupo.pacientes.size
      }))
      .sort((a, b) =>
        b.periodo.localeCompare(a.periodo) ||
        a.insumo.localeCompare(b.insumo, 'es')
      );
  }, [consumosFiltrados]);

  const resumenFiltrado = useMemo(() => {
    const unidades =
      consumosFiltrados.reduce(
        (total, consumo) =>
          total +
          Number(
            consumo.cantidadUtilizada || 0
          ),
        0
      );

    const pacientes = new Set(
      consumosFiltrados
        .map((consumo) =>
          consumo.expedienteId
            ?.pacienteId?._id?.toString()
        )
        .filter(Boolean)
    ).size;

    const insumosCriticos = new Set(
      consumosFiltrados
        .filter((consumo) => {
          const estado =
            obtenerEstadoStock(
              consumo.insumoId
            );

          return [
            'bajo',
            'agotado'
          ].includes(estado.clase);
        })
        .map((consumo) =>
          consumo.insumoId?._id?.toString()
        )
        .filter(Boolean)
    ).size;

    return {
      totalRegistros:
        consumosFiltrados.length,
      unidadesUtilizadas: unidades,
      pacientesAtendidos: pacientes,
      insumosBajoStock: insumosCriticos
    };
  }, [consumosFiltrados]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setPeriodo('todos');
    setEstadoStock('todos');
  };

  if (cargando) {
    return (
      <section className="doctor-supplies-loading">
        <div className="doctor-supplies-spinner" />

        <h2>
          Cargando consumos de insumos
        </h2>

        <p>
          Consultando los materiales registrados en las atenciones.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="doctor-supplies-error">
        <div className="doctor-supplies-error-icon">
          !
        </div>

        <h2>
          No se pudo cargar el historial
        </h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={cargarConsumos}
        >
          <IconoActualizar />
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <main className="doctor-supplies-page">
      <header className="doctor-supplies-header">
        <div>
          <span className="doctor-supplies-eyebrow">
            Consumo clínico
          </span>

          <h1>
            Registro de Consumo de Insumos
          </h1>

          <p>
            Consulta los materiales utilizados por el Dr.{' '}
            <strong>
              {odontologo?.nombre ||
                'Odontólogo'}
            </strong>{' '}
            durante las atenciones médicas.
          </p>
        </div>

        <button
          type="button"
          className="doctor-supplies-refresh"
          onClick={cargarConsumos}
        >
          <IconoActualizar />
          Actualizar
        </button>
      </header>

      <section className="doctor-supplies-summary">
        <article className="doctor-supplies-summary-card records">
          <div>
            <span>Registros</span>
            <strong>
              {resumenFiltrado.totalRegistros}
            </strong>
          </div>

          <IconoExpediente />

          <small>
            Consumos encontrados
          </small>
        </article>

        <article className="doctor-supplies-summary-card units">
          <div>
            <span>
              Unidades utilizadas
            </span>

            <strong>
              {
                resumenFiltrado.unidadesUtilizadas
              }
            </strong>
          </div>

          <IconoCaja />

          <small>
            Cantidad total consumida
          </small>
        </article>

        <article className="doctor-supplies-summary-card patients">
          <div>
            <span>
              Pacientes atendidos
            </span>

            <strong>
              {
                resumenFiltrado.pacientesAtendidos
              }
            </strong>
          </div>

          <IconoUsuario />

          <small>
            Pacientes únicos
          </small>
        </article>

        <article className="doctor-supplies-summary-card alerts">
          <div>
            <span>
              Insumos críticos
            </span>

            <strong>
              {
                resumenFiltrado.insumosBajoStock
              }
            </strong>
          </div>

          <IconoAdvertencia />

          <small>
            Bajo stock o agotados
          </small>
        </article>
      </section>

      <section className="doctor-supplies-toolbar">
        <label className="doctor-supplies-search">
          <span>Buscar consumo</span>

          <div>
            <IconoBuscar />

            <input
              type="search"
              placeholder="Insumo, categoría o tratamiento..."
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
            />

            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() =>
                  setBusqueda('')
                }
              >
                <IconoCerrar />
              </button>
            )}
          </div>
        </label>

        <label className="doctor-supplies-filter">
          <span>Periodo</span>

          <select
            value={periodo}
            onChange={(evento) =>
              setPeriodo(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="hoy">
              Hoy
            </option>

            <option value="semana">
              Esta semana
            </option>

            <option value="mes">
              Este mes
            </option>
          </select>
        </label>

        <label className="doctor-supplies-filter">
          <span>Estado de stock</span>

          <select
            value={estadoStock}
            onChange={(evento) =>
              setEstadoStock(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="disponible">
              Disponible
            </option>

            <option value="bajo">
              Bajo stock
            </option>

            <option value="agotado">
              Agotado
            </option>
          </select>
        </label>
      </section>

      <section className="doctor-supplies-history doctor-supplies-dataset">
        <header className="doctor-supplies-history-header">
          <div>
            <h2>Dataset consolidado por insumo y periodo</h2>
            <p>Vista previa sin datos personales de pacientes</p>
          </div>
          <span className="doctor-supplies-dataset-count">
            {datasetConsolidado.length} {datasetConsolidado.length === 1 ? 'fila' : 'filas'}
          </span>
        </header>

        {datasetConsolidado.length > 0 ? (
          <>
            <div className="doctor-supplies-table-wrapper">
              <table className="doctor-supplies-table doctor-supplies-dataset-table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Año</th>
                    <th>Mes</th>
                    <th>Trimestre</th>
                    <th>Insumo</th>
                    <th>Categoría</th>
                    <th>Tratamiento</th>
                    <th>N.º pacientes</th>
                    <th>Cantidad total</th>
                  </tr>
                </thead>
                <tbody>
                  {datasetConsolidado.map((fila) => (
                    <tr key={fila.id}>
                      <td><strong>{fila.periodo}</strong></td>
                      <td>{fila.year}</td>
                      <td>{fila.month}</td>
                      <td>{fila.trimestre}</td>
                      <td><strong>{fila.insumo}</strong></td>
                      <td>{fila.categoria}</td>
                      <td className="doctor-supplies-treatment-cell">{fila.tratamiento}</td>
                      <td>{fila.numeroPacientes}</td>
                      <td>
                        <span className="doctor-supplies-total">
                          {fila.cantidadTotal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <aside className="doctor-supplies-dataset-notes">
              <strong>Comprobaciones del dataset</strong>
              <div>
                <p>• Una fila representa un insumo en un periodo.</p>
                <p>• Cantidad total corresponde a las unidades consumidas.</p>
                <p>• No se muestran nombres, CI ni teléfonos.</p>
              </div>
            </aside>
          </>
        ) : (
          <div className="doctor-supplies-empty">
            <div><IconoCaja /></div>
            <h3>No se encontraron consumos</h3>
            <p>No existen registros que coincidan con los filtros seleccionados.</p>
            <button type="button" onClick={limpiarFiltros}>Limpiar filtros</button>
          </div>
        )}
      </section>
    </main>
  );
};

export default InsumosOdontologo;