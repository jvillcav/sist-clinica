import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import api from '../../api/axios';
import '../../styles/admin/prediccionesAdmin.css?predicciones-v2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const numero = (valor) => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
};
const formatearNumero = (valor) =>
  new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 2
  }).format(numero(valor));
const formatearFecha = (valor) => {
  if (!valor) return 'Sin registro';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin registro';
  return fecha.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
const formatearFechaHora = (valor) => {
  if (!valor) return 'Sin registro';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin registro';
  return fecha.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const normalizar = (valor = '') =>
  String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
const riesgoInfo = (valor = 'bajo') => {
  const mapa = {
    critico: { clase: 'critical', texto: 'Crítico' },
    alto: { clase: 'high', texto: 'Alto' },
    medio: { clase: 'medium', texto: 'Medio' },
    bajo: { clase: 'low', texto: 'Bajo' }
  };
  return mapa[normalizar(valor)] || mapa.bajo;
};
const tendenciaInfo = (valor = 'estable') => {
  const mapa = {
    creciente: { clase: 'up', texto: 'Creciente', icono: '↑' },
    decreciente: { clase: 'down', texto: 'Decreciente', icono: '↓' },
    estable: { clase: 'stable', texto: 'Estable', icono: '→' }
  };
  return mapa[normalizar(valor)] || mapa.estable;
};
const esResultadoPreliminar = (resultado) =>
  Boolean(resultado?.esPreliminar) ||
  resultado?.tipoResultado === 'estimacion_preliminar';
const formatearMetrica = (valor) =>
  valor === null || valor === undefined
    ? 'No aplica'
    : formatearNumero(valor);
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);
const Icons = {
  refresh: <Icon><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6 8a7 7 0 0 1 12-2l2 2"/><path d="M18 16a7 7 0 0 1-12 2l-2-2"/></Icon>,
  brain: <Icon><path d="M9 4a3 3 0 0 0-5 2.2A3.5 3.5 0 0 0 4.5 13 4 4 0 0 0 9 19"/><path d="M15 4a3 3 0 0 1 5 2.2 3.5 3.5 0 0 1-.5 6.8A4 4 0 0 1 15 19"/><path d="M9 4v16M15 4v16M9 8h3M12 13h3M9 17h3"/></Icon>,
  chart: <Icon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></Icon>,
  database: <Icon><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></Icon>,
  box: <Icon><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></Icon>,
  warning: <Icon><path d="M12 4 3 20h18L12 4Z"/><path d="M12 9v5M12 17h.01"/></Icon>,
  check: <Icon><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></Icon>,
  search: <Icon><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></Icon>,
  bolt: <Icon><path d="m13 2-9 12h7l-1 8 10-13h-7V2Z"/></Icon>,
  calendar: <Icon><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></Icon>,
  close: <Icon><path d="m6 6 12 12M18 6 6 18"/></Icon>,
  download: <Icon><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></Icon>
};
const Predicciones = () => {
  const [insumos, setInsumos] = useState([]);
  const [resumenDataset, setResumenDataset] = useState({
    totalRegistros: 0,
    totalInsumos: 0,
    insumosSuficientes: 0,
    insumosInsuficientes: 0,
    periodosMinimos: 3,
    fechaInicial: null,
    fechaFinal: null
  });
  const [detalleDataset, setDetalleDataset] = useState([]);
  const [servicioML, setServicioML] = useState({ disponible: false, servicio: null });
  const [predicciones, setPredicciones] = useState([]);
  const [datosInsuficientes, setDatosInsuficientes] = useState([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState('todos');
  const [horizonteMeses, setHorizonteMeses] = useState(3);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos');
  const [generadoEn, setGeneradoEn] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    cargarInformacion();
  }, []);
  const cargarInformacion = async () => {
    try {
      setActualizando(true);
      setError('');
      const resultados = await Promise.allSettled([
        api.get('/insumos'),
        api.get('/predicciones/estado'),
        api.get('/predicciones/resumen-dataset')
      ]);
      const [rInsumos, rEstado, rDataset] = resultados;
      if (rInsumos.status === 'fulfilled') {
        const lista = rInsumos.value.data?.insumos ?? rInsumos.value.data;
        setInsumos(Array.isArray(lista) ? lista.filter((i) => i.estado !== 'inactivo') : []);
      } else {
        setInsumos([]);
      }
      if (rEstado.status === 'fulfilled') {
        setServicioML({
          disponible: Boolean(rEstado.value.data?.disponible),
          servicio: rEstado.value.data?.servicio || null
        });
      } else {
        setServicioML({ disponible: false, servicio: null });
      }
      if (rDataset.status === 'fulfilled') {
        const resumen = rDataset.value.data?.resumen || {};
        setResumenDataset({
          totalRegistros: numero(resumen.totalRegistros),
          totalInsumos: numero(resumen.totalInsumos),
          insumosSuficientes: numero(resumen.insumosSuficientes),
          insumosInsuficientes: numero(resumen.insumosInsuficientes),
          periodosMinimos: numero(resumen.periodosMinimos) || 3,
          fechaInicial: resumen.fechaInicial || null,
          fechaFinal: resumen.fechaFinal || null
        });
        setDetalleDataset(Array.isArray(rDataset.value.data?.insumos) ? rDataset.value.data.insumos : []);
      }
      const fallos = [];
      if (rInsumos.status === 'rejected') fallos.push('insumos');
      if (rEstado.status === 'rejected') fallos.push('servicio ML');
      if (rDataset.status === 'rejected') fallos.push('dataset');
      if (fallos.length) setError(`No se pudieron cargar: ${fallos.join(', ')}.`);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el módulo de predicciones.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };
  const generarPrediccion = async () => {
    if (!servicioML.disponible) {
      setError('El servicio de Machine Learning no está disponible. Inicia Flask antes de continuar.');
      return;
    }
    try {
      setGenerando(true);
      setError('');
      setMensaje('');
      const ruta = insumoSeleccionado === 'todos'
        ? '/predicciones/consumo-insumos'
        : `/predicciones/consumo-insumos/${insumoSeleccionado}`;
      const { data } = await api.get(ruta, {
        params: { horizonteMeses }
      });
      if (insumoSeleccionado === 'todos') {
        setPredicciones(Array.isArray(data?.predicciones) ? data.predicciones : []);
        setDatosInsuficientes(Array.isArray(data?.datosInsuficientes) ? data.datosInsuficientes : []);
      } else {
        setPredicciones(data?.prediccion ? [data.prediccion] : []);
        setDatosInsuficientes([]);
      }
      setModelo(data?.modelo || null);
      setGeneradoEn(data?.generadoEn || new Date().toISOString());
      setMensaje(data?.mensaje || 'Predicción generada correctamente.');
    } catch (err) {
      console.error(err);
      setPredicciones([]);
      const insuficiente = err.response?.data?.datos;
      setDatosInsuficientes(insuficiente ? [insuficiente] : []);
      setError(err.response?.data?.mensaje || 'No se pudo generar la predicción.');
    } finally {
      setGenerando(false);
    }
  };
  const prediccionesFiltradas = useMemo(() => {
    const texto = normalizar(busqueda);
    return predicciones.filter((item) => {
      const riesgo = riesgoInfo(item.riesgoDesabastecimiento);
      const coincideTexto = !texto || normalizar([
        item.insumo,
        item.inventario?.categoria,
        item.tendencia,
        riesgo.texto
      ].filter(Boolean).join(' ')).includes(texto);
      const coincideRiesgo = filtroRiesgo === 'todos' || riesgo.clase === filtroRiesgo;
      return coincideTexto && coincideRiesgo;
    });
  }, [predicciones, busqueda, filtroRiesgo]);
  const resumenResultados = useMemo(() => ({
    total: predicciones.length,
    preliminares: predicciones.filter(esResultadoPreliminar).length,
    riesgo: predicciones.filter((p) => ['critico', 'alto'].includes(normalizar(p.riesgoDesabastecimiento))).length,
    reabastecer: predicciones.filter((p) => numero(p.cantidadSugeridaReabastecer) > 0).length,
    consumo: predicciones.reduce((total, p) => total + numero(p.consumoEstimadoHorizonte), 0)
  }), [predicciones]);
  const recomendaciones = useMemo(() =>
    [...predicciones]
      .filter((p) => numero(p.cantidadSugeridaReabastecer) > 0)
      .sort((a, b) => numero(b.cantidadSugeridaReabastecer) - numero(a.cantidadSugeridaReabastecer)),
    [predicciones]
  );
  const exportarCSV = () => {
    if (!prediccionesFiltradas.length) {
      setError('No existen predicciones para exportar.');
      return;
    }
    const filas = prediccionesFiltradas.map((p) => {
      const preliminar = esResultadoPreliminar(p);
      const intervalo = preliminar
        ? p.predicciones?.[0]?.intervaloReferencial
        : p.predicciones?.[0]?.intervaloPrediccion80;
      return [
        p.insumo,
        p.inventario?.categoria || 'General',
        numero(p.inventario?.stockActual),
        numero(p.inventario?.stockMinimo),
        numero(p.consumoEstimadoHorizonte),
        numero(p.cantidadSugeridaReabastecer),
        p.riesgoDesabastecimiento,
        p.tendencia,
        preliminar ? 'Estimación preliminar' : p.modeloSeleccionado,
        p.calidad?.nivel,
        preliminar ? '' : numero(p.calidad?.puntaje),
        preliminar ? '' : numero(p.metricas?.maeValidacionTemporal),
        preliminar ? '' : numero(p.metricas?.errorPorcentualValidacion),
        intervalo?.inferior ?? '',
        intervalo?.superior ?? ''
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const contenido = [
      'Insumo,Categoria,Stock actual,Stock minimo,Consumo horizonte,Cantidad sugerida,Riesgo,Tendencia,Metodo,Calidad,Puntaje,MAE validacion,Error porcentual,Limite inferior,Limite superior',
      ...filas
    ].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `predicciones-insumos-${new Date().toISOString().split('T')[0]}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  };
  if (cargando) {
    return (
      <section className="admin-ml-loading">
        <div className="admin-ml-spinner" />
        <h2>Cargando predicciones</h2>
        <p>Verificando el modelo y preparando el historial de consumo.</p>
      </section>
    );
  }
  return (
    <main className="admin-ml-page">
      <header className="admin-ml-header">
        <div>
          <span className="admin-ml-eyebrow">Inteligencia predictiva</span>
          <h1>Predicción de consumo</h1>
          <p>Proyecta la demanda con ML y, mientras se completa el historial, genera estimaciones preliminares con los consumos disponibles.</p>
        </div>
        <div className="admin-ml-header-actions">
          <button className="ml-secondary-button" disabled={actualizando} onClick={cargarInformacion}>
            {Icons.refresh}{actualizando ? 'Actualizando...' : 'Actualizar datos'}
          </button>
          <button className="ml-export-button" disabled={!predicciones.length} onClick={exportarCSV}>
            {Icons.download}Exportar CSV
          </button>
        </div>
      </header>
      {mensaje && <div className="ml-message success">{Icons.check}<span>{mensaje}</span><button onClick={() => setMensaje('')}>×</button></div>}
      {error && <div className="ml-message error">{Icons.warning}<span>{error}</span><button onClick={() => setError('')}>×</button></div>}
      <section className="admin-ml-status-grid">
        <article className={`ml-status-card ${servicioML.disponible ? 'online' : 'offline'}`}>
          <div><span>Servicio Machine Learning</span><strong>{servicioML.disponible ? 'Activo' : 'No disponible'}</strong><small>{servicioML.servicio?.modelo || 'Regresión lineal mensual'}</small></div>{Icons.brain}
        </article>
        <article className="ml-status-card records"><div><span>Registros históricos</span><strong>{resumenDataset.totalRegistros}</strong><small>Consumos válidos para análisis</small></div>{Icons.database}</article>
        <article className="ml-status-card supplies"><div><span>Insumos con datos</span><strong>{resumenDataset.totalInsumos}</strong><small>{resumenDataset.insumosSuficientes} con ML · {resumenDataset.insumosInsuficientes} preliminares</small></div>{Icons.box}</article>
        <article className="ml-status-card periods"><div><span>Periodo del dataset</span><strong>{formatearFecha(resumenDataset.fechaInicial)}</strong><small>Hasta {formatearFecha(resumenDataset.fechaFinal)}</small></div>{Icons.calendar}</article>
      </section>
      <section className="admin-ml-control-card">
        <header><div><span>Configuración del análisis</span><h2>Generar nueva proyección</h2><p>Con 3 meses o más se ejecuta el modelo ML; con menos historial se aplica una estimación preliminar basada en el promedio diario observado.</p></div></header>
        <div className="admin-ml-control-grid">
          <label><span>Insumo</span><select value={insumoSeleccionado} onChange={(e) => setInsumoSeleccionado(e.target.value)}>
            <option value="todos">Todos los insumos con registros</option>
            {insumos.map((insumo) => {
              const dataset = detalleDataset.find((d) => String(d.insumoId) === String(insumo._id));
              const modo = dataset && !dataset.suficiente ? ' · preliminar' : '';
              const periodos = dataset ? ` · ${dataset.periodos} ${dataset.periodos === 1 ? 'mes' : 'meses'}` : '';
              return <option key={insumo._id} value={insumo._id}>{insumo.nombre}{periodos}{modo}</option>;
            })}
          </select></label>
          <label><span>Horizonte</span><select value={horizonteMeses} onChange={(e) => setHorizonteMeses(Number(e.target.value))}>
            <option value={1}>Próximo mes</option><option value={3}>Próximos 3 meses</option><option value={6}>Próximos 6 meses</option><option value={12}>Próximos 12 meses</option>
          </select></label>
          <button className="ml-primary-button" disabled={generando || !servicioML.disponible} onClick={generarPrediccion}>{Icons.bolt}{generando ? 'Generando resultado...' : 'Generar proyección'}</button>
        </div>
      </section>
      {!!predicciones.length && <>
        <section className="admin-ml-summary">
          <article className="predictions"><div><span>Resultados generados</span><strong>{resumenResultados.total}</strong><small>{resumenResultados.preliminares} estimaciones preliminares</small></div>{Icons.chart}</article>
          <article className="risk"><div><span>Riesgo alto o crítico</span><strong>{resumenResultados.riesgo}</strong><small>Requieren atención</small></div>{Icons.warning}</article>
          <article className="restock"><div><span>Reabastecimiento sugerido</span><strong>{resumenResultados.reabastecer}</strong><small>Con déficit previsto</small></div>{Icons.box}</article>
          <article className="consumption"><div><span>Consumo del horizonte</span><strong>{formatearNumero(resumenResultados.consumo)}</strong><small>Unidades estimadas</small></div>{Icons.bolt}</article>
        </section>
        <section className="admin-ml-toolbar">
          <label className="ml-search"><span>Buscar predicción</span><div>{Icons.search}<input value={busqueda} placeholder="Insumo, categoría, tendencia o riesgo..." onChange={(e) => setBusqueda(e.target.value)} /></div></label>
          <label><span>Nivel de riesgo</span><select value={filtroRiesgo} onChange={(e) => setFiltroRiesgo(e.target.value)}><option value="todos">Todos</option><option value="critical">Crítico</option><option value="high">Alto</option><option value="medium">Medio</option><option value="low">Bajo</option></select></label>
        </section>
        <section className="admin-ml-results-card">
          <header><div><span>Proyección de demanda</span><h2>Resultados del análisis</h2><p>{prediccionesFiltradas.length} resultados · {modelo?.nombre || 'Método seleccionado según el historial'} · Generado {formatearFechaHora(generadoEn)}</p></div></header>
          <div className="admin-ml-table-wrapper"><table className="admin-ml-table"><thead><tr><th>Insumo</th><th>Stock</th><th>Próximo mes</th><th>Horizonte</th><th>Tendencia</th><th>Riesgo</th><th>Sugerencia</th><th>Método</th><th>Acción</th></tr></thead><tbody>
            {prediccionesFiltradas.map((p) => {
              const riesgo = riesgoInfo(p.riesgoDesabastecimiento);
              const tendencia = tendenciaInfo(p.tendencia);
              const unidad = p.inventario?.unidadMedida || 'unidad';
              const proximo = numero(p.predicciones?.[0]?.cantidadEstimada ?? p.prediccionConsumo);
              const preliminar = esResultadoPreliminar(p);
              return <tr key={p.insumoId || p.insumo}>
                <td><div className="ml-supply-cell"><span>{Icons.box}</span><div><strong>{p.insumo}</strong><small>{p.inventario?.categoria || 'General'}</small></div></div></td>
                <td><div className="ml-stock-cell"><strong>{formatearNumero(p.inventario?.stockActual)}</strong><small>Mínimo: {formatearNumero(p.inventario?.stockMinimo)} {unidad}</small></div></td>
                <td><div className="ml-value-cell"><strong className="ml-main-value">{formatearNumero(proximo)}</strong><small className="ml-unit-text">{unidad}</small></div></td>
                <td><div className="ml-value-cell"><strong>{formatearNumero(p.consumoEstimadoHorizonte)}</strong><small className="ml-unit-text">{horizonteMeses} meses</small></div></td>
                <td><span className={`ml-trend ${tendencia.clase}`}><b>{tendencia.icono}</b>{tendencia.texto}</span></td>
                <td><span className={`ml-risk ${riesgo.clase}`}>{riesgo.texto}</span></td>
                <td><div className="ml-suggestion"><strong>{numero(p.cantidadSugeridaReabastecer) > 0 ? formatearNumero(p.cantidadSugeridaReabastecer) : 'Sin compra'}</strong><small>{numero(p.cantidadSugeridaReabastecer) > 0 ? `${unidad} sugeridas` : 'Stock suficiente'}</small></div></td>
                <td><div className="ml-metrics"><span>{preliminar ? 'Estimación preliminar' : `Calidad ${p.calidad?.nivel || 'preliminar'} · ${numero(p.calidad?.puntaje)}/100`}</span><small>{preliminar ? `Promedio diario · ${numero(p.registrosUtilizados)} registros` : `${p.modeloSeleccionado === 'ultimo_valor' ? 'Último valor' : 'Regresión lineal'} · MAE val. ${formatearNumero(p.metricas?.maeValidacionTemporal)}`}</small></div></td>
                <td><button className="ml-view-button" onClick={() => setDetalle(p)}>{Icons.chart}Analizar</button></td>
              </tr>;
            })}
          </tbody></table></div>
        </section>
        {!!recomendaciones.length && <section className="admin-ml-recommendations"><header><div><span>Decisiones sugeridas</span><h2>Recomendaciones automatizadas</h2><p>Prioriza los insumos con déficit proyectado.</p></div></header><div className="ml-recommendations-list">
          {recomendaciones.map((p) => { const riesgo = riesgoInfo(p.riesgoDesabastecimiento); return <article key={p.insumoId || p.insumo}><span className={`ml-recommendation-dot ${riesgo.clase}`} /><div><strong>{p.insumo}</strong><p>Reabastecer aproximadamente <b>{formatearNumero(p.cantidadSugeridaReabastecer)} {p.inventario?.unidadMedida || 'unidades'}</b> para cubrir {horizonteMeses} meses y conservar el stock mínimo.</p></div><span className={`ml-risk ${riesgo.clase}`}>{riesgo.texto}</span></article>; })}
        </div></section>}
      </>}
      {!!datosInsuficientes.length && <section className="admin-ml-insufficient"><header><div><span>Calidad del dataset</span><h2>Datos insuficientes</h2><p>Estos insumos todavía no reúnen el mínimo histórico requerido.</p></div></header><div className="ml-insufficient-grid">
        {datosInsuficientes.map((d) => <article key={d.insumoId || d.insumo}>{Icons.warning}<div><strong>{d.insumo}</strong><p>{d.mensaje}</p><small>{d.periodosDisponibles || 0} de {d.periodosMinimos || resumenDataset.periodosMinimos} meses requeridos</small></div></article>)}
      </div></section>}
      {!predicciones.length && !datosInsuficientes.length && <section className="admin-ml-empty">{Icons.brain}<h2>El módulo está listo para analizar</h2><p>Selecciona un insumo o genera una proyección. El sistema escogerá automáticamente entre ML y estimación preliminar.</p><button className="ml-primary-button" disabled={generando || !servicioML.disponible} onClick={generarPrediccion}>{Icons.bolt}Generar proyección</button></section>}
      {detalle && <div className="ml-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDetalle(null)}><section className="ml-modal"><header><div><span>{esResultadoPreliminar(detalle) ? 'Estimación preliminar' : 'Análisis predictivo'}</span><h2>{detalle.insumo}</h2><p>{esResultadoPreliminar(detalle) ? `Resultado referencial calculado con ${numero(detalle.registrosUtilizados)} registros y ${numero(detalle.diasObservados)} día(s) observados.` : 'Historial mensual y predicción de consumo mediante Machine Learning.'}</p></div><button onClick={() => setDetalle(null)}>{Icons.close}</button></header><div className="ml-modal-content">
        <section className="ml-detail-summary"><article><span>{esResultadoPreliminar(detalle) ? 'Promedio diario' : 'Promedio histórico'}</span><strong>{formatearNumero(esResultadoPreliminar(detalle) ? detalle.promedioDiarioObservado : detalle.promedioMensualHistorico)}</strong></article><article><span>Último consumo</span><strong>{formatearNumero(detalle.ultimoConsumoMensual)}</strong></article><article><span>Calidad</span><strong>{esResultadoPreliminar(detalle) ? 'Preliminar · sin validación ML' : `${detalle.calidad?.nivel || 'preliminar'} · ${numero(detalle.calidad?.puntaje)}/100`}</strong></article><article><span>Sugerencia de compra</span><strong>{formatearNumero(detalle.cantidadSugeridaReabastecer)}</strong></article></section>
        <section className="ml-chart-card"><h3>Consumo histórico y proyección</h3><div className="ml-chart-wrapper"><Line data={{ labels: [...(detalle.historialMensual || []).map((x) => x.periodo), ...(detalle.predicciones || []).map((x) => x.periodo)], datasets: [{ label: 'Histórico', data: [...(detalle.historialMensual || []).map((x) => numero(x.cantidadConsumida)), ...(detalle.predicciones || []).map(() => null)], tension: .35, pointRadius: 4, spanGaps: true }, { label: esResultadoPreliminar(detalle) ? 'Estimación preliminar' : 'Predicción ML', data: [...(detalle.historialMensual || []).map(() => null), ...(detalle.predicciones || []).map((x) => numero(x.cantidadEstimada))], tension: .35, pointRadius: 4, borderDash: [7, 5], spanGaps: true }] }} options={{ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} /></div></section>
        <section className="ml-detail-grid"><article><span>Stock actual</span><strong>{formatearNumero(detalle.inventario?.stockActual)} {detalle.inventario?.unidadMedida || 'unidades'}</strong></article><article><span>Método aplicado</span><strong>{esResultadoPreliminar(detalle) ? 'Promedio diario proyectado' : detalle.modeloSeleccionado === 'ultimo_valor' ? 'Último valor' : 'Regresión lineal'}</strong></article><article><span>MAE validación</span><strong>{esResultadoPreliminar(detalle) ? 'No aplica' : formatearMetrica(detalle.metricas?.maeValidacionTemporal)}</strong></article><article><span>Error porcentual</span><strong>{esResultadoPreliminar(detalle) ? 'No aplica' : `${formatearMetrica(detalle.metricas?.errorPorcentualValidacion)}%`}</strong></article></section>
        {!!detalle.advertencias?.length && <section className="admin-ml-insufficient"><header><div><span>Limitaciones estadísticas</span><h3>Advertencias del modelo</h3></div></header><div className="ml-insufficient-grid">{detalle.advertencias.map((aviso) => <article key={aviso}>{Icons.warning}<div><p>{aviso}</p></div></article>)}</div></section>}
        <footer><button className="ml-secondary-button" onClick={() => setDetalle(null)}>Cerrar análisis</button></footer>
      </div></section></div>}
    </main>
  );
};
export default Predicciones;
