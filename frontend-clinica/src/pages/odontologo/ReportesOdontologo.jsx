import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  Bar,
  Doughnut,
  Line
} from 'react-chartjs-2';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import api from '../../api/axios';
import logoClinica from '../../assets/inicio/logo-orellana.png';
import '../../styles/odontologo/reportesOdontologo.css';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
);

/* =====================================================
   ICONOS
===================================================== */

const IconoDescargar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6.2 8A7 7 0 0 1 18 6l2 2" />
    <path d="M17.8 16A7 7 0 0 1 6 18l-2-2" />
  </svg>
);

const IconoPacientes = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-4.5 3-7 7-7" />
    <circle cx="17" cy="10" r="3" />
    <path d="M14 21c0-3.5 2.3-5.5 5.5-5.5" />
  </svg>
);

const IconoTratamiento = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const IconoAsistencia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const IconoInsumos = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 7 8-4 8 4-8 4-8-4Z" />
    <path d="M4 7v10l8 4 8-4V7" />
    <path d="M12 11v10" />
  </svg>
);

const IconoError = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

/* =====================================================
   CONFIGURACIONES DE GRÁFICAS
===================================================== */

const opcionesLineas = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 9,
        boxHeight: 9,
        padding: 18,
        font: {
          size: 12,
          weight: '600'
        }
      }
    },
    tooltip: {
      padding: 12,
      cornerRadius: 9
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#64748b'
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        color: '#64748b'
      },
      grid: {
        color: '#e2e8f0'
      }
    }
  }
};

const opcionesDona = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '67%',
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 9,
        boxHeight: 9,
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      padding: 12,
      cornerRadius: 9,
      callbacks: {
        label: (contexto) => {
          const etiqueta =
            contexto.label || '';

          const cantidad =
            contexto.raw || 0;

          return `${etiqueta}: ${cantidad}`;
        }
      }
    }
  }
};

const opcionesBarras = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      padding: 12,
      cornerRadius: 9
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#64748b'
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        color: '#64748b'
      },
      grid: {
        color: '#e2e8f0'
      }
    }
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

const ReportesOdontologo = () => {
  const reporteRef = useRef(null);

  const [reporte, setReporte] =
    useState(null);

  const [meses, setMeses] =
    useState(6);

  const [cargando, setCargando] =
    useState(true);

  const [exportando, setExportando] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    obtenerReporte();
  }, [meses]);

  const obtenerReporte = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get(
        `/reportes/odontologo/estadisticas?meses=${meses}`
      );

      setReporte(data);
    } catch (errorPeticion) {
      console.error(
        'Error al cargar estadísticas:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudieron cargar las estadísticas médicas.'
      );
    } finally {
      setCargando(false);
    }
  };

  const evolucionMensual =
    reporte?.evolucionMensual || [];

  const distribucionServicios =
    reporte?.distribucionServicios || [];

  const tratamientosPorMes =
    reporte?.tratamientosPorMes || [];

  const datosLineas = useMemo(() => {
    return {
      labels: evolucionMensual.map(
        (item) => item.mes
      ),

      datasets: [
        {
          label: 'Pacientes atendidos',
          data: evolucionMensual.map(
            (item) => item.pacientes
          ),
          borderColor: '#2563eb',
          backgroundColor:
            'rgba(37, 99, 235, 0.12)',
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true
        },
        {
          label: 'Tratamientos realizados',
          data: evolucionMensual.map(
            (item) => item.tratamientos
          ),
          borderColor: '#16a34a',
          backgroundColor:
            'rgba(22, 163, 74, 0.08)',
          pointBackgroundColor: '#16a34a',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: false
        }
      ]
    };
  }, [evolucionMensual]);

  const datosDona = useMemo(() => {
    const colores = [
      '#3b82f6',
      '#6366f1',
      '#22c55e',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6'
    ];

    return {
      labels:
        distribucionServicios.length > 0
          ? distribucionServicios.map(
              (item) => item.servicio
            )
          : ['Sin registros'],

      datasets: [
        {
          data:
            distribucionServicios.length > 0
              ? distribucionServicios.map(
                  (item) => item.cantidad
                )
              : [1],

          backgroundColor:
            distribucionServicios.length > 0
              ? distribucionServicios.map(
                  (_, indice) =>
                    colores[
                      indice % colores.length
                    ]
                )
              : ['#e2e8f0'],

          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 5
        }
      ]
    };
  }, [distribucionServicios]);

  const datosBarras = useMemo(() => {
    return {
      labels: tratamientosPorMes.map(
        (item) => item.mes
      ),

      datasets: [
        {
          label: 'Tratamientos',
          data: tratamientosPorMes.map(
            (item) => item.cantidad
          ),
          backgroundColor: '#3b82f6',
          borderRadius: 7,
          borderSkipped: false,
          maxBarThickness: 72
        }
      ]
    };
  }, [tratamientosPorMes]);

  const exportarPDF = async () => {
    if (!reporteRef.current) {
      return;
    }

    try {
      setExportando(true);

      const elemento =
        reporteRef.current;

      const canvas =
        await html2canvas(elemento, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (documentoClonado) => {
            const escenario =
              documentoClonado.querySelector(
                '.medical-export-stage'
              );
            const plantilla =
              documentoClonado.querySelector(
                '.medical-export-document'
              );

            if (escenario) {
              escenario.style.position = 'fixed';
              escenario.style.left = '0';
              escenario.style.top = '0';
            }

            if (plantilla) {
              plantilla.style.position = 'static';
              plantilla.style.left = '0';
              plantilla.style.top = '0';
            }
          }
        });

      const imagen =
        canvas.toDataURL(
          'image/png',
          1
        );

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const anchoPagina =
        pdf.internal.pageSize.getWidth();

      const altoPagina =
        pdf.internal.pageSize.getHeight();

      const escala = Math.min(
        anchoPagina / canvas.width,
        altoPagina / canvas.height
      );

      const anchoImagen = canvas.width * escala;
      const altoImagen = canvas.height * escala;

      pdf.addImage(
        imagen,
        'PNG',
        (anchoPagina - anchoImagen) / 2,
        (altoPagina - altoImagen) / 2,
        anchoImagen,
        altoImagen
      );

      const nombreOdontologo =
        reporte?.odontologo?.nombre
          ?.replace(/\s+/g, '_')
          ?.toLowerCase() ||
        'odontologo';

      pdf.save(
        `reporte_${nombreOdontologo}_${meses}_meses.pdf`
      );
    } catch (errorExportacion) {
      console.error(
        'Error al exportar PDF:',
        errorExportacion
      );

      window.alert(
        'No se pudo exportar el reporte.'
      );
    } finally {
      setExportando(false);
    }
  };

  const formatearPeriodo = () => {
    if (!reporte?.periodo) {
      return '';
    }

    const desde =
      new Date(
        reporte.periodo.desde
      ).toLocaleDateString('es-BO', {
        month: 'long',
        year: 'numeric'
      });

    const hasta =
      new Date(
        reporte.periodo.hasta
      ).toLocaleDateString('es-BO', {
        month: 'long',
        year: 'numeric'
      });

    return `${desde} a ${hasta}`;
  };

  if (cargando) {
    return (
      <section className="reports-loading">
        <div className="reports-spinner" />

        <h2>
          Preparando reportes médicos
        </h2>

        <p>
          Procesando las estadísticas clínicas.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reports-error">
        <div className="reports-error-icon">
          <IconoError />
        </div>

        <h2>
          No se pudieron cargar los reportes
        </h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={obtenerReporte}
        >
          <IconoActualizar />
          Volver a intentar
        </button>
      </section>
    );
  }

  const resumen =
    reporte?.resumen || {
      pacientesAtendidos: 0,
      tratamientosRealizados: 0,
      tasaAsistencia: 0,
      insumosUtilizados: 0
    };

  const fechaEmision =
    new Intl.DateTimeFormat('es-BO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/La_Paz'
    }).format(new Date());

  return (
    <main className="medical-reports-page">
      <header className="medical-reports-header">
        <div>
          <span className="medical-reports-eyebrow">
            Análisis clínico
          </span>

          <h1>Reportes Médicos</h1>

          <p>
            Estadísticas del Dr.{' '}
            <strong>
              {reporte?.odontologo?.nombre ||
                'Odontólogo'}
            </strong>{' '}
            correspondientes al periodo seleccionado.
          </p>
        </div>

        <div className="medical-reports-actions">
          <label>
            <span>Periodo</span>

            <select
              value={meses}
              onChange={(evento) =>
                setMeses(
                  Number(
                    evento.target.value
                  )
                )
              }
            >
              <option value={3}>
                Últimos 3 meses
              </option>

              <option value={6}>
                Últimos 6 meses
              </option>

              <option value={12}>
                Últimos 12 meses
              </option>
            </select>
          </label>

          <button
            type="button"
            className="medical-reports-export"
            onClick={exportarPDF}
            disabled={exportando}
          >
            <IconoDescargar />

            {exportando
              ? 'Generando PDF...'
              : 'Exportar reporte'}
          </button>
        </div>
      </header>

      <section
        className="medical-reports-content"
      >
        <div className="medical-reports-print-header">
          <h2>Clínica Orellana</h2>

          <p>
            Reporte médico del Dr.{' '}
            {reporte?.odontologo?.nombre}
          </p>

          <span>{formatearPeriodo()}</span>
        </div>

        <section className="medical-reports-summary">
          <article className="medical-report-card patients">
            <div>
              <span>
                Pacientes atendidos
              </span>

              <strong>
                {
                  resumen.pacientesAtendidos
                }
              </strong>

              <small>
                Pacientes únicos
              </small>
            </div>

            <IconoPacientes />
          </article>

          <article className="medical-report-card treatments">
            <div>
              <span>
                Tratamientos realizados
              </span>

              <strong>
                {
                  resumen.tratamientosRealizados
                }
              </strong>

              <small>
                Registros clínicos
              </small>
            </div>

            <IconoTratamiento />
          </article>

          <article className="medical-report-card attendance">
            <div>
              <span>
                Tasa de asistencia
              </span>

              <strong>
                {resumen.tasaAsistencia}%
              </strong>

              <small>
                Citas atendidas
              </small>
            </div>

            <IconoAsistencia />
          </article>

          <article className="medical-report-card supplies">
            <div>
              <span>
                Insumos utilizados
              </span>

              <strong>
                {
                  resumen.insumosUtilizados
                }
              </strong>

              <small>
                Unidades consumidas
              </small>
            </div>

            <IconoInsumos />
          </article>
        </section>

        <section className="medical-reports-grid">
          <article className="medical-chart-card line-chart">
            <header>
              <div>
                <h2>
                  Pacientes y tratamientos
                </h2>

                <p>
                  Evolución de los últimos{' '}
                  {meses} meses
                </p>
              </div>
            </header>

            <div className="medical-chart-container">
              <Line
                data={datosLineas}
                options={opcionesLineas}
              />
            </div>
          </article>

          <article className="medical-chart-card doughnut-chart">
            <header>
              <div>
                <h2>
                  Distribución de servicios
                </h2>

                <p>
                  Procedimientos atendidos
                </p>
              </div>
            </header>

            <div className="medical-chart-container">
              <Doughnut
                data={datosDona}
                options={opcionesDona}
              />
            </div>

            {distribucionServicios.length ===
              0 && (
              <p className="medical-chart-empty">
                Todavía no existen servicios
                atendidos en este periodo.
              </p>
            )}
          </article>
        </section>

        <section className="medical-chart-card full-chart">
          <header>
            <div>
              <h2>
                Tratamientos por mes
              </h2>

              <p>
                Cantidad de tratamientos
                registrados mensualmente
              </p>
            </div>
          </header>

          <div className="medical-chart-container bars">
            <Bar
              data={datosBarras}
              options={opcionesBarras}
            />
          </div>
        </section>

        <section className="medical-monthly-detail">
          <header>
            <div>
              <h2>
                Resumen mensual
              </h2>

              <p>
                Detalle estadístico del periodo
              </p>
            </div>
          </header>

          <div className="medical-monthly-table-wrapper">
            <table className="medical-monthly-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Pacientes</th>
                  <th>Tratamientos</th>
                  <th>Insumos</th>
                  <th>Asistencia</th>
                </tr>
              </thead>

              <tbody>
                {evolucionMensual.map(
                  (item) => (
                    <tr key={item.clave}>
                      <td>
                        <strong>
                          {item.mes}
                        </strong>
                      </td>

                      <td>
                        {item.pacientes}
                      </td>

                      <td>
                        {item.tratamientos}
                      </td>

                      <td>
                        {
                          item.insumosUtilizados
                        }
                      </td>

                      <td>
                        <span
                          className={`monthly-attendance ${
                            item.tasaAsistencia >=
                            80
                              ? 'good'
                              : item.tasaAsistencia >=
                                  50
                                ? 'medium'
                                : 'low'
                          }`}
                        >
                          {
                            item.tasaAsistencia
                          }
                          %
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <div className="medical-export-stage" aria-hidden="true">
        <article
          className="medical-export-document"
          ref={reporteRef}
        >
          <header className="medical-export-brand">
            <img
              src={logoClinica}
              alt=""
            />

            <div>
              <strong>CLÍNICA ODONTOLÓGICA ORELLANA</strong>
              <span>Shinahota · Cochabamba</span>
            </div>

          </header>

          <section className="medical-export-title">
            <h2>Reporte de actividad odontológica</h2>
            <p>Resumen del periodo seleccionado</p>
          </section>

          <section className="medical-export-metadata">
            <p>
              <strong>Profesional:</strong>
              <span>Dr. {reporte?.odontologo?.nombre || 'Odontólogo'}</span>
            </p>
            <p>
              <strong>Fecha de emisión:</strong>
              <span>{fechaEmision}</span>
            </p>
            <p>
              <strong>Periodo:</strong>
              <span>{formatearPeriodo()}</span>
            </p>
            <p>
              <strong>Tipo:</strong>
              <span>Reporte individual</span>
            </p>
          </section>

          <section className="medical-export-summary">
            <article className="patients">
              <IconoPacientes />
              <strong>{resumen.pacientesAtendidos}</strong>
              <span>Pacientes únicos</span>
            </article>
            <article className="treatments">
              <IconoTratamiento />
              <strong>{resumen.tratamientosRealizados}</strong>
              <span>Tratamientos</span>
            </article>
            <article className="attendance">
              <IconoAsistencia />
              <strong>{resumen.tasaAsistencia}%</strong>
              <span>Asistencia</span>
            </article>
            <article className="supplies">
              <IconoInsumos />
              <strong>{resumen.insumosUtilizados}</strong>
              <span>Unidades de insumos</span>
            </article>
          </section>

          <section className="medical-export-activity">
            <h3>Resumen de actividad</h3>
            <p>
              Durante el periodo consultado se registran{' '}
              <strong>{resumen.pacientesAtendidos} pacientes únicos</strong>,{' '}
              <strong>{resumen.tratamientosRealizados} tratamientos</strong> y{' '}
              <strong>{resumen.insumosUtilizados} unidades de insumos</strong>{' '}
              consumidas. La tasa de asistencia fue del{' '}
              <strong>{resumen.tasaAsistencia}%</strong>.
            </p>
          </section>

          <section className="medical-export-indicators">
            <h3>Indicadores del periodo</h3>
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Resultado</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pacientes atendidos</td>
                  <td>{resumen.pacientesAtendidos}</td>
                  <td>Personas únicas registradas</td>
                </tr>
                <tr>
                  <td>Tratamientos realizados</td>
                  <td>{resumen.tratamientosRealizados}</td>
                  <td>Registros clínicos del periodo</td>
                </tr>
                <tr>
                  <td>Tasa de asistencia</td>
                  <td>{resumen.tasaAsistencia}%</td>
                  <td>Indicador de citas atendidas</td>
                </tr>
                <tr>
                  <td>Insumos utilizados</td>
                  <td>{resumen.insumosUtilizados}</td>
                  <td>Unidades consumidas</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="medical-export-observations">
            <h3>Observaciones</h3>
            <p>
              Los indicadores corresponden al profesional y al periodo seleccionados.
              Las cifras reflejan los registros disponibles en el sistema al momento
              de emitir este reporte.
            </p>
          </section>

          <section className="medical-export-signatures">
            <div>
              <span />
              <p>Elaborado por</p>
              <strong>Dr. {reporte?.odontologo?.nombre || 'Odontólogo'}</strong>
            </div>
            <div>
              <span />
              <p>Revisado por</p>
            </div>
          </section>

          <footer className="medical-export-footer">
            <span>Sistema de Gestión Clínica Orellana</span>
            <span>Reporte interno · Página 1 de 1</span>
          </footer>
        </article>
      </div>
    </main>
  );
};

export default ReportesOdontologo;