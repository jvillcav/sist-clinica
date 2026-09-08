import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import '../../styles/paciente/MisCitasPaciente.css';

const horarios = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
];

const MisCitasPaciente = () => {
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [detalle, setDetalle] = useState(null);
  const [reprogramando, setReprogramando] = useState(null);

  const [nuevoHorario, setNuevoHorario] = useState({
    fecha: '',
    hora: ''
  });

  const [horasOcupadas, setHorasOcupadas] = useState([]);

  useEffect(() => {
    obtenerMisCitas();
  }, []);

  const obtenerMisCitas = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get('/citas/mis-citas');
      setCitas(data);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'No se pudieron cargar tus citas.'
      );
    } finally {
      setCargando(false);
    }
  };

  const fechaISO = (fecha) => {
    if (!fecha) return '';
    return fecha.includes('T') ? fecha.split('T')[0] : fecha;
  };

  const fechaBonita = (fecha) => {
    if (!fecha) return '';

    const [year, month, day] = fechaISO(fecha).split('-');

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const fechaCorta = (fecha) => {
    if (!fecha) return { dia: '', mes: '', year: '' };

    const [year, month, day] = fechaISO(fecha).split('-');

    const fechaLocal = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return {
      dia: day,
      mes: fechaLocal.toLocaleDateString('es-BO', { month: 'short' }),
      year
    };
  };

  const etiquetaEstado = (estado) => {
    const etiquetas = {
      pendiente: 'Pendiente',
      atendido: 'Completada',
      cancelado: 'Cancelada'
    };

    return etiquetas[estado] || estado;
  };

  const citasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return citas
      .filter((cita) => {
        if (filtro === 'todas') return true;
        return cita.estado === filtro;
      })
      .filter((cita) => {
        return `${cita.motivo} ${cita.odontologo} ${cita.estado}`
          .toLowerCase()
          .includes(texto);
      })
      .sort((a, b) => {
        const fechaA = `${fechaISO(a.fecha)}T${a.hora}`;
        const fechaB = `${fechaISO(b.fecha)}T${b.hora}`;

        return fechaB.localeCompare(fechaA);
      });
  }, [citas, filtro, busqueda]);

  const cancelarCita = async (cita) => {
    const confirmar = window.confirm(
      `¿Deseas cancelar tu cita de ${cita.motivo}?`
    );

    if (!confirmar) return;

    try {
      setMensaje('');
      setError('');

      await api.patch(`/citas/mis-citas/${cita._id}/cancelar`);

      setMensaje('La cita fue cancelada correctamente.');
      await obtenerMisCitas();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'No se pudo cancelar la cita.'
      );
    }
  };

  const abrirReprogramacion = (cita) => {
    setReprogramando(cita);

    setNuevoHorario({
      fecha: fechaISO(cita.fecha),
      hora: cita.hora
    });

    consultarDisponibilidad(fechaISO(cita.fecha), cita.odontologo);
  };

  const consultarDisponibilidad = async (fecha, odontologo) => {
    if (!fecha || !odontologo) {
      setHorasOcupadas([]);
      return;
    }

    try {
      const { data } = await api.get('/citas/disponibilidad', {
        params: { fecha, odontologo }
      });

      setHorasOcupadas(data.horasOcupadas || []);
    } catch {
      setHorasOcupadas([]);
    }
  };

  const guardarReprogramacion = async () => {
    try {
      setMensaje('');
      setError('');

      await api.patch(
        `/citas/mis-citas/${reprogramando._id}/reprogramar`,
        nuevoHorario
      );

      setMensaje('La cita fue reprogramada correctamente.');
      setReprogramando(null);
      setHorasOcupadas([]);

      await obtenerMisCitas();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'No se pudo reprogramar la cita.'
      );
    }
  };

  if (cargando) {
    return (
      <main className="my-appointments-page">
        <p>Cargando tus citas...</p>
      </main>
    );
  }

  return (
    <main className="my-appointments-page">
      <div className="my-appointments-header">
        <div>
          <h1>Mis Citas</h1>
          <p>Consulta y gestiona tus citas odontológicas</p>
        </div>

        <input
          type="search"
          placeholder="Buscar por servicio u odontólogo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {mensaje && <div className="success-message">{mensaje}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="appointment-filters">
        <button
          className={filtro === 'todas' ? 'active' : ''}
          onClick={() => setFiltro('todas')}
        >
          Todas
        </button>

        <button
          className={filtro === 'pendiente' ? 'active' : ''}
          onClick={() => setFiltro('pendiente')}
        >
          Pendientes
        </button>

        <button
          className={filtro === 'atendido' ? 'active' : ''}
          onClick={() => setFiltro('atendido')}
        >
          Completadas
        </button>

        <button
          className={filtro === 'cancelado' ? 'active' : ''}
          onClick={() => setFiltro('cancelado')}
        >
          Canceladas
        </button>
      </div>

      <section className="my-appointments-list">
        {citasFiltradas.length === 0 ? (
          <div className="appointments-empty">
            <h2>No se encontraron citas</h2>
            <p>No tienes citas que coincidan con el filtro seleccionado.</p>
          </div>
        ) : (
          citasFiltradas.map((cita) => {
            const fecha = fechaCorta(cita.fecha);

            return (
              <article className="patient-appointment-card" key={cita._id}>
                <div className="appointment-date-box">
                  <strong>{fecha.dia}</strong>
                  <span>{fecha.mes}</span>
                  <small>{fecha.year}</small>
                </div>

                <div className="appointment-main-data">
                  <div className="appointment-title-row">
                    <div>
                      <h2>{cita.motivo}</h2>
                      <p>{cita.odontologo}</p>
                    </div>

                    <span className={`appointment-status ${cita.estado}`}>
                      {etiquetaEstado(cita.estado)}
                    </span>
                  </div>

                  <div className="appointment-metadata">
                    <span>📅 {fechaBonita(cita.fecha)}</span>
                    <span>🕒 {cita.hora}</span>
                  </div>

                  {cita.observaciones && (
                    <div className="appointment-note">
                      {cita.observaciones}
                    </div>
                  )}

                  <div className="appointment-card-actions">
                    <button onClick={() => setDetalle(cita)}>
                      Ver detalle
                    </button>

                    {cita.estado === 'pendiente' && (
                      <>
                        <button onClick={() => abrirReprogramacion(cita)}>
                          Reprogramar
                        </button>

                        <button
                          className="danger"
                          onClick={() => cancelarCita(cita)}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {detalle && (
        <div className="patient-modal-backdrop">
          <div className="patient-modal">
            <button
              className="patient-modal-close"
              onClick={() => setDetalle(null)}
            >
              ×
            </button>

            <h2>Detalle de la cita</h2>

            <div className="modal-detail-row">
              <span>Servicio</span>
              <strong>{detalle.motivo}</strong>
            </div>

            <div className="modal-detail-row">
              <span>Odontólogo</span>
              <strong>{detalle.odontologo}</strong>
            </div>

            <div className="modal-detail-row">
              <span>Fecha</span>
              <strong>{fechaBonita(detalle.fecha)}</strong>
            </div>

            <div className="modal-detail-row">
              <span>Hora</span>
              <strong>{detalle.hora}</strong>
            </div>

            <div className="modal-detail-row">
              <span>Estado</span>
              <strong>{etiquetaEstado(detalle.estado)}</strong>
            </div>

            <div className="modal-detail-notes">
              <span>Observaciones</span>
              <p>{detalle.observaciones || 'Sin observaciones registradas.'}</p>
            </div>
          </div>
        </div>
      )}

      {reprogramando && (
        <div className="patient-modal-backdrop">
          <div className="patient-modal">
            <button
              className="patient-modal-close"
              onClick={() => setReprogramando(null)}
            >
              ×
            </button>

            <h2>Reprogramar cita</h2>

            <label>Nueva fecha</label>
            <input
              type="date"
              value={nuevoHorario.fecha}
              onChange={async (e) => {
                const fecha = e.target.value;

                setNuevoHorario({
                  fecha,
                  hora: ''
                });

                await consultarDisponibilidad(
                  fecha,
                  reprogramando.odontologo
                );
              }}
            />

            <label>Nuevo horario</label>

            <div className="reprogram-hours-grid">
              {horarios.map((hora) => {
                const esHorarioActual =
                  fechaISO(reprogramando.fecha) === nuevoHorario.fecha &&
                  reprogramando.hora === hora;

                const ocupado =
                  horasOcupadas.includes(hora) && !esHorarioActual;

                return (
                  <button
                    key={hora}
                    type="button"
                    disabled={ocupado}
                    className={
                      nuevoHorario.hora === hora
                        ? 'selected'
                        : ocupado
                          ? 'disabled'
                          : ''
                    }
                    onClick={() =>
                      setNuevoHorario({
                        ...nuevoHorario,
                        hora
                      })
                    }
                  >
                    {hora}
                  </button>
                );
              })}
            </div>

            <div className="form-actions">
              <button
                className="btn-cancel"
                onClick={() => setReprogramando(null)}
              >
                Cancelar
              </button>

              <button
                disabled={!nuevoHorario.fecha || !nuevoHorario.hora}
                onClick={guardarReprogramacion}
              >
                Guardar cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MisCitasPaciente;
