import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';

const motivosCancelacion = [
  'Solicitud del paciente',
  'Odontólogo no disponible',
  'Emergencia clínica',
  'Fuerza mayor',
  'Error en la programación',
  'Otro'
];

const CancelarCitaRecepcion = () => {
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [otroMotivo, setOtroMotivo] = useState('');

  useEffect(() => {
    obtenerCitas();
  }, []);

  const obtenerCitas = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get('/citas');

      setCitas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener citas:', error);

      setError(
        error.response?.data?.mensaje ||
          'No se pudieron cargar las citas.'
      );
    } finally {
      setCargando(false);
    }
  };

  const fechaISO = (fecha) => {
    if (!fecha) return '';

    const texto = String(fecha);

    return texto.includes('T')
      ? texto.split('T')[0]
      : texto;
  };

  const fechaBonita = (fecha) => {
    const texto = fechaISO(fecha);

    if (!texto) return 'Sin fecha';

    const [year, month, day] = texto.split('-');

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

  const mesCorto = (fecha) => {
    const texto = fechaISO(fecha);

    if (!texto) return '';

    const [year, month, day] = texto.split('-');

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString('es-BO', {
      month: 'short'
    });
  };

  const citasCancelables = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    return citas
      .filter(
        (cita) =>
          cita.estado !== 'cancelado' &&
          cita.estado !== 'atendido'
      )
      .filter((cita) => {
        const paciente = cita.pacienteId || {};

        const contenido = `
          ${paciente.nombre || ''}
          ${paciente.apellido || ''}
          ${paciente.ci || ''}
          ${paciente.telefono || ''}
          ${cita.motivo || ''}
          ${cita.odontologo || ''}
        `.toLowerCase();

        return contenido.includes(textoBusqueda);
      })
      .sort((a, b) => {
        const fechaA = `${fechaISO(a.fecha)}T${a.hora || '00:00'}`;
        const fechaB = `${fechaISO(b.fecha)}T${b.hora || '00:00'}`;

        return fechaA.localeCompare(fechaB);
      });
  }, [citas, busqueda]);

  const abrirCancelacion = (cita) => {
    setCitaSeleccionada(cita);
    setMotivoSeleccionado('');
    setOtroMotivo('');
    setMensaje('');
    setError('');
  };

  const cerrarModal = () => {
    if (procesando) return;

    setCitaSeleccionada(null);
    setMotivoSeleccionado('');
    setOtroMotivo('');
  };

  const confirmarCancelacion = async () => {
    const motivoFinal =
      motivoSeleccionado === 'Otro'
        ? otroMotivo.trim()
        : motivoSeleccionado;

    if (!motivoFinal) {
      setError('Debe seleccionar o escribir el motivo de cancelación.');
      return;
    }

    try {
      setProcesando(true);
      setMensaje('');
      setError('');

      await api.patch(
        `/citas/${citaSeleccionada._id}/cancelar`,
        {
          motivoCancelacion: motivoFinal
        }
      );

      setMensaje('Cita cancelada correctamente.');
      cerrarModal();

      await obtenerCitas();
    } catch (error) {
      console.error('Error al cancelar la cita:', error);

      setError(
        error.response?.data?.mensaje ||
          'No se pudo cancelar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <main className="reception-cancel-page">
        <p>Cargando citas disponibles...</p>
      </main>
    );
  }

  return (
    <main className="reception-cancel-page">
      <div className="reception-page-heading">
        <div>
          <h1>Cancelar Cita</h1>
          <p>
            Selecciona una cita activa e indica el motivo de cancelación
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="reception-success-message">
          {mensaje}
        </div>
      )}

      {error && !citaSeleccionada && (
        <div className="reception-error-message">
          {error}
        </div>
      )}

      <section className="reception-cancel-warning">
        <div className="reception-warning-icon">!</div>

        <div>
          <strong>Importante antes de cancelar</strong>

          <p>
            La cancelación debe comunicarse al paciente. Se recomienda
            realizarla con al menos 24 horas de anticipación.
          </p>
        </div>
      </section>

      <div className="reception-cancel-search">
        <input
          type="search"
          placeholder="Buscar por paciente, CI, teléfono, servicio u odontólogo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <section className="reception-cancel-list">
        {citasCancelables.map((cita) => {
          const paciente = cita.pacienteId || {};

          return (
            <article
              className="reception-cancel-card"
              key={cita._id}
            >
              <div className="reception-cancel-date">
                <strong>
                  {fechaISO(cita.fecha).split('-')[2]}
                </strong>

                <span>{mesCorto(cita.fecha)}</span>
              </div>

              <div className="reception-cancel-information">
                <div className="reception-cancel-card-heading">
                  <div>
                    <h2>
                      {paciente.nombre || 'Paciente'}{' '}
                      {paciente.apellido || ''}
                    </h2>

                    <p>
                      {cita.motivo} · {cita.odontologo}
                    </p>

                    <span>
                      {fechaBonita(cita.fecha)} · {cita.hora}
                    </span>
                  </div>

                  <span
                    className={`reception-status ${cita.estado}`}
                  >
                    {cita.estado === 'confirmada'
                      ? 'Confirmada'
                      : 'Pendiente'}
                  </span>
                </div>

                <div className="reception-cancel-actions">
                  {paciente.telefono ? (
                    <a href={`tel:${paciente.telefono}`}>
                      Llamar al paciente
                    </a>
                  ) : (
                    <span className="reception-no-phone">
                      Teléfono no registrado
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => abrirCancelacion(cita)}
                  >
                    Cancelar cita
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {citasCancelables.length === 0 && (
          <div className="reception-empty-state">
            <h3>No existen citas disponibles para cancelar</h3>

            <p>
              No se encontraron citas activas con los criterios
              seleccionados.
            </p>
          </div>
        )}
      </section>

      {citaSeleccionada && (
        <div className="patient-modal-backdrop">
          <div className="reception-cancel-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={cerrarModal}
              disabled={procesando}
            >
              ×
            </button>

            <div className="reception-cancel-modal-title">
              <div>×</div>

              <div>
                <h2>Confirmar cancelación</h2>
                <p>Esta acción cambiará el estado de la cita</p>
              </div>
            </div>

            <section className="reception-cancel-summary">
              <strong>
                {citaSeleccionada.pacienteId?.nombre}{' '}
                {citaSeleccionada.pacienteId?.apellido}
              </strong>

              <span>
                {citaSeleccionada.motivo} ·{' '}
                {fechaBonita(citaSeleccionada.fecha)} ·{' '}
                {citaSeleccionada.hora}
              </span>
            </section>

            {error && (
              <div className="reception-error-message">
                {error}
              </div>
            )}

            <label className="reception-cancel-label">
              Motivo de cancelación

              <select
                value={motivoSeleccionado}
                onChange={(e) => {
                  setMotivoSeleccionado(e.target.value);
                  setError('');

                  if (e.target.value !== 'Otro') {
                    setOtroMotivo('');
                  }
                }}
              >
                <option value="">Seleccionar motivo</option>

                {motivosCancelacion.map((motivo) => (
                  <option key={motivo} value={motivo}>
                    {motivo}
                  </option>
                ))}
              </select>
            </label>

            {motivoSeleccionado === 'Otro' && (
              <label className="reception-cancel-label">
                Especifique el motivo

                <textarea
                  maxLength="300"
                  placeholder="Describa brevemente el motivo..."
                  value={otroMotivo}
                  onChange={(e) => {
                    setOtroMotivo(e.target.value);
                    setError('');
                  }}
                />
              </label>
            )}

            <div className="reception-cancel-modal-actions">
              <button
                type="button"
                className="cancel-back"
                onClick={cerrarModal}
                disabled={procesando}
              >
                Volver
              </button>

              <button
                type="button"
                className="cancel-confirm"
                onClick={confirmarCancelacion}
                disabled={
                  procesando ||
                  !motivoSeleccionado ||
                  (motivoSeleccionado === 'Otro' &&
                    !otroMotivo.trim())
                }
              >
                {procesando
                  ? 'Cancelando...'
                  : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CancelarCitaRecepcion;