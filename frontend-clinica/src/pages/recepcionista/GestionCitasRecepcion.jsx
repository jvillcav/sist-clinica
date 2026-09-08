import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';

const generarHorariosDisponibles = () => {
  const horarios = [];

  for (let minutos = 7 * 60; minutos <= 19 * 60; minutos += 30) {
    const hora = String(Math.floor(minutos / 60)).padStart(2, '0');
    const minuto = String(minutos % 60).padStart(2, '0');
    horarios.push(`${hora}:${minuto}`);
  }

  return horarios;
};

const horariosDisponibles = generarHorariosDisponibles();

const citaInicial = {
  pacienteId: '',
  odontologoId: '',
  fecha: '',
  hora: '',
  duracionMinutos: 30,
  motivo: '',
  estado: 'pendiente',
  observaciones: ''
};

const reprogramacionInicial = {
  fecha: '',
  hora: '',
  odontologoId: '',
  motivoReprogramacion: ''
};

const confirmacionSolicitudInicial = {
  pacienteId: '',
  odontologoId: '',
  duracionMinutos: 30
};

const GestionCitasRecepcion = () => {
  const [citas, setCitas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [odontologos, setOdontologos] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [vista, setVista] = useState('citas');

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [mostrarNuevaCita, setMostrarNuevaCita] = useState(false);
  const [nuevaCita, setNuevaCita] = useState(citaInicial);

  const [reprogramando, setReprogramando] = useState(null);
  const [nuevoHorario, setNuevoHorario] = useState(reprogramacionInicial);

  const [horasOcupadas, setHorasOcupadas] = useState([]);

  const [solicitudConfirmando, setSolicitudConfirmando] = useState(null);
  const [confirmacionSolicitud, setConfirmacionSolicitud] = useState(
    confirmacionSolicitudInicial
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const extraerLista = (respuesta, propiedad) => {
    const datos = respuesta?.data;

    if (Array.isArray(datos)) {
      return datos;
    }

    if (Array.isArray(datos?.[propiedad])) {
      return datos[propiedad];
    }

    return [];
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const resultados = await Promise.allSettled([
        api.get('/citas'),
        api.get('/solicitudes-citas'),
        api.get('/pacientes'),
        api.get('/usuarios/odontologos')
      ]);

      const [
        resultadoCitas,
        resultadoSolicitudes,
        resultadoPacientes,
        resultadoOdontologos
      ] = resultados;

      if (resultadoCitas.status === 'fulfilled') {
        setCitas(extraerLista(resultadoCitas.value, 'citas'));
      } else {
        console.error('Error al cargar citas:', resultadoCitas.reason);
        setCitas([]);
      }

      if (resultadoSolicitudes.status === 'fulfilled') {
        setSolicitudes(
          extraerLista(resultadoSolicitudes.value, 'solicitudes')
        );
      } else {
        console.error(
          'Error al cargar solicitudes:',
          resultadoSolicitudes.reason
        );
        setSolicitudes([]);
      }

      if (resultadoPacientes.status === 'fulfilled') {
        setPacientes(extraerLista(resultadoPacientes.value, 'pacientes'));
      } else {
        console.error(
          'Error al cargar pacientes:',
          resultadoPacientes.reason
        );
        setPacientes([]);
      }

      if (resultadoOdontologos.status === 'fulfilled') {
        const listaOdontologos = extraerLista(
          resultadoOdontologos.value,
          'odontologos'
        );

        setOdontologos(
          listaOdontologos.filter(
            (odontologo) => odontologo.estado !== false
          )
        );
      } else {
        console.error(
          'Error al cargar odontólogos:',
          resultadoOdontologos.reason
        );
        setOdontologos([]);
      }

      const errores = [];

      if (resultadoCitas.status === 'rejected') errores.push('citas');
      if (resultadoSolicitudes.status === 'rejected') {
        errores.push('solicitudes públicas');
      }
      if (resultadoPacientes.status === 'rejected') errores.push('pacientes');
      if (resultadoOdontologos.status === 'rejected') {
        errores.push('odontólogos');
      }

      if (errores.length > 0) {
        setError(`No se pudieron cargar: ${errores.join(', ')}.`);
      }
    } catch (errorPeticion) {
      console.error('Error general al cargar datos:', errorPeticion);
      setError('Ocurrió un error al cargar la gestión de citas.');
    } finally {
      setCargando(false);
    }
  };

  const fechaISO = (fecha) => {
    if (!fecha) return '';

    return String(fecha).includes('T')
      ? String(fecha).split('T')[0]
      : String(fecha);
  };

  const fechaBonita = (fecha) => {
    const texto = fechaISO(fecha);

    if (!texto) return 'Sin fecha';

    const [year, month, day] = texto.split('-').map(Number);

    return new Date(year, month - 1, day).toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const etiquetaEstado = (estado) => {
    const estados = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      atendido: 'Atendida',
      cancelado: 'Cancelada'
    };

    return estados[estado] || estado;
  };

  const obtenerNombreOdontologo = (cita) => {
    return cita.odontologoId?.nombre || cita.odontologo || 'Sin odontólogo';
  };

  const citasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return citas
      .filter((cita) => {
        if (filtroEstado === 'todas') return true;
        return cita.estado === filtroEstado;
      })
      .filter((cita) => {
        const paciente = cita.pacienteId || {};

        return `
          ${paciente.nombre || ''}
          ${paciente.apellido || ''}
          ${paciente.ci || ''}
          ${cita.motivo || ''}
          ${obtenerNombreOdontologo(cita)}
        `
          .toLowerCase()
          .includes(texto);
      })
      .sort((a, b) => {
        const fechaA = `${fechaISO(a.fecha)}T${a.hora || '00:00'}`;
        const fechaB = `${fechaISO(b.fecha)}T${b.hora || '00:00'}`;
        return fechaA.localeCompare(fechaB);
      });
  }, [citas, filtroEstado, busqueda]);

  const solicitudesPendientes = useMemo(
    () =>
      solicitudes.filter(
        (solicitud) => solicitud.estado === 'pendiente'
      ),
    [solicitudes]
  );

  const consultarDisponibilidad = async (fecha, odontologoId) => {
    if (!fecha || !odontologoId) {
      setHorasOcupadas([]);
      return;
    }

    try {
      const { data } = await api.get('/citas/disponibilidad', {
        params: {
          fecha,
          odontologoId
        }
      });

      const horarios = data.horariosOcupados ?? data.horasOcupadas ?? [];

      setHorasOcupadas(
        horarios
          .map((item) => (typeof item === 'string' ? item : item?.hora))
          .filter(Boolean)
      );
    } catch (errorPeticion) {
      console.error('Error al consultar disponibilidad:', errorPeticion);
      setHorasOcupadas([]);
    }
  };

  const cerrarNuevaCita = () => {
    setMostrarNuevaCita(false);
    setNuevaCita(citaInicial);
    setHorasOcupadas([]);
  };

  const guardarNuevaCita = async (evento) => {
    evento.preventDefault();

    try {
      setProcesando(true);
      setMensaje('');
      setError('');

      await api.post('/citas', {
        ...nuevaCita,
        duracionMinutos: Number(nuevaCita.duracionMinutos)
      });

      setMensaje('Cita registrada correctamente.');
      cerrarNuevaCita();
      await cargarDatos();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo registrar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const confirmarCita = async (cita) => {
    try {
      setProcesando(true);
      setMensaje('');
      setError('');

      await api.patch(`/citas/${cita._id}/confirmar`);

      setMensaje('Cita confirmada correctamente.');
      await cargarDatos();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo confirmar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const abrirReprogramacion = async (cita) => {
    const odontologoId = cita.odontologoId?._id || cita.odontologoId || '';

    const horario = {
      fecha: fechaISO(cita.fecha),
      hora: cita.hora || '',
      odontologoId,
      motivoReprogramacion: ''
    };

    setReprogramando(cita);
    setNuevoHorario(horario);

    await consultarDisponibilidad(horario.fecha, horario.odontologoId);
  };

  const cerrarReprogramacion = () => {
    setReprogramando(null);
    setNuevoHorario(reprogramacionInicial);
    setHorasOcupadas([]);
  };

  const guardarReprogramacion = async () => {
    try {
      setProcesando(true);
      setMensaje('');
      setError('');

      await api.patch(
        `/citas/${reprogramando._id}/reprogramar`,
        nuevoHorario
      );

      cerrarReprogramacion();
      setMensaje('Cita reprogramada correctamente.');
      await cargarDatos();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo reprogramar la cita.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const buscarPacienteCoincidente = (solicitud) => {
    const ciSolicitud = String(solicitud.ci || '')
      .replace(/\s/g, '')
      .toLowerCase();

    const correoSolicitud = String(solicitud.email || '')
      .trim()
      .toLowerCase();

    const telefonoSolicitud = String(solicitud.telefono || '').replace(
      /\D/g,
      ''
    );

    return pacientes.find((paciente) => {
      const mismoCi =
        ciSolicitud &&
        String(paciente.ci || '')
          .replace(/\s/g, '')
          .toLowerCase() === ciSolicitud;

      const mismoCorreo =
        correoSolicitud &&
        String(paciente.email || '')
          .trim()
          .toLowerCase() === correoSolicitud;

      const mismoTelefono =
        telefonoSolicitud &&
        String(paciente.telefono || '').replace(/\D/g, '') ===
          telefonoSolicitud;

      return mismoCi || mismoCorreo || mismoTelefono;
    });
  };

  const abrirConfirmacionSolicitud = (solicitud) => {
    const pacienteEncontrado = buscarPacienteCoincidente(solicitud);

    setSolicitudConfirmando(solicitud);
    setConfirmacionSolicitud({
      pacienteId: pacienteEncontrado?._id || '',
      odontologoId: '',
      duracionMinutos: 30
    });
  };

  const cerrarConfirmacionSolicitud = () => {
    setSolicitudConfirmando(null);
    setConfirmacionSolicitud(confirmacionSolicitudInicial);
  };

  const confirmarSolicitud = async () => {
    try {
      setProcesando(true);
      setMensaje('');
      setError('');

      await api.patch(
        `/solicitudes-citas/${solicitudConfirmando._id}/confirmar`,
        {
          ...confirmacionSolicitud,
          duracionMinutos: Number(
            confirmacionSolicitud.duracionMinutos
          )
        }
      );

      cerrarConfirmacionSolicitud();
      setMensaje('Solicitud confirmada y convertida en cita.');
      await cargarDatos();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo confirmar la solicitud.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const rechazarSolicitud = async (solicitud) => {
    const motivoRechazo = window.prompt(
      `Indica el motivo para rechazar la solicitud de ${
        solicitud.nombreCompleto ||
        `${solicitud.nombre || ''} ${solicitud.apellido || ''}`.trim()
      }:`
    );

    if (!motivoRechazo?.trim()) return;

    try {
      setProcesando(true);
      setMensaje('');
      setError('');

      await api.patch(
        `/solicitudes-citas/${solicitud._id}/rechazar`,
        {
          motivoRechazo: motivoRechazo.trim()
        }
      );

      setMensaje('Solicitud rechazada correctamente.');
      await cargarDatos();
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo rechazar la solicitud.'
      );
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <p>Cargando gestión de citas...</p>;
  }

  return (
    <main className="reception-appointments-page">
      <div className="reception-page-heading">
        <div>
          <h1>Gestión de Citas</h1>
          <p>Agenda, confirma y reprograma las citas de los pacientes</p>
        </div>

        <button
          type="button"
          className="reception-submit-button"
          onClick={() => {
            setMensaje('');
            setError('');
            setNuevaCita(citaInicial);
            setHorasOcupadas([]);
            setMostrarNuevaCita(true);
          }}
        >
          + Nueva cita
        </button>
      </div>

      {mensaje && (
        <div className="reception-success-message">{mensaje}</div>
      )}

      {error && <div className="reception-error-message">{error}</div>}

      <div className="reception-appointment-tabs">
        <button
          type="button"
          className={vista === 'citas' ? 'active' : ''}
          onClick={() => setVista('citas')}
        >
          Citas registradas
        </button>

        <button
          type="button"
          className={vista === 'solicitudes' ? 'active' : ''}
          onClick={() => setVista('solicitudes')}
        >
          Solicitudes públicas
          <span>{solicitudesPendientes.length}</span>
        </button>
      </div>

      {vista === 'citas' && (
        <>
          <div className="reception-appointments-toolbar">
            <input
              type="search"
              placeholder="Buscar por paciente, CI, servicio u odontólogo..."
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />

            <select
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
            >
              <option value="todas">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="atendido">Atendidas</option>
              <option value="cancelado">Canceladas</option>
            </select>
          </div>

          <section className="reception-appointments-list">
            {citasFiltradas.map((cita) => (
              <article className="reception-appointment-card" key={cita._id}>
                <div className="reception-appointment-date">
                  <strong>{fechaISO(cita.fecha).split('-')[2] || '--'}</strong>
                  <span>
                    {fechaISO(cita.fecha)
                      ? new Date(
                          `${fechaISO(cita.fecha)}T00:00:00`
                        ).toLocaleDateString('es-BO', {
                          month: 'short'
                        })
                      : ''}
                  </span>
                </div>

                <div className="reception-appointment-content">
                  <div className="reception-appointment-top">
                    <div>
                      <h2>
                        {cita.pacienteId?.nombre || 'Paciente'}{' '}
                        {cita.pacienteId?.apellido || ''}
                      </h2>

                      <p>
                        {cita.motivo} · {obtenerNombreOdontologo(cita)}
                      </p>

                      <span>
                        {fechaBonita(cita.fecha)} · {cita.hora}
                      </span>
                    </div>

                    <span className={`reception-status ${cita.estado}`}>
                      {etiquetaEstado(cita.estado)}
                    </span>
                  </div>

                  <div className="reception-appointment-actions">
                    {cita.estado === 'pendiente' && (
                      <button
                        type="button"
                        className="confirm"
                        disabled={procesando}
                        onClick={() => confirmarCita(cita)}
                      >
                        Confirmar
                      </button>
                    )}

                    {!['atendido', 'cancelado'].includes(cita.estado) && (
                      <button
                        type="button"
                        disabled={procesando}
                        onClick={() => abrirReprogramacion(cita)}
                      >
                        Reprogramar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {citasFiltradas.length === 0 && (
              <div className="reception-empty-state">
                <h3>No se encontraron citas</h3>
                <p>No existen resultados para los filtros seleccionados.</p>
              </div>
            )}
          </section>
        </>
      )}

      {vista === 'solicitudes' && (
        <section className="reception-appointments-list">
          {solicitudesPendientes.map((solicitud) => {
            const nombreCompleto =
              solicitud.nombreCompleto ||
              `${solicitud.nombre || ''} ${solicitud.apellido || ''}`.trim();

            return (
              <article
                className="reception-request-management-card"
                key={solicitud._id}
              >
                <div>
                  <h2>{nombreCompleto || 'Solicitante'}</h2>

                  <p>
                    {solicitud.servicio} · {fechaBonita(solicitud.fecha)} ·{' '}
                    {solicitud.hora}
                  </p>

                  <span>
                    CI: {solicitud.ci || 'Sin registro'} ·{' '}
                    {solicitud.telefono} · {solicitud.email}
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    className="confirm"
                    disabled={procesando}
                    onClick={() => abrirConfirmacionSolicitud(solicitud)}
                  >
                    Confirmar
                  </button>

                  <button
                    type="button"
                    className="danger"
                    disabled={procesando}
                    onClick={() => rechazarSolicitud(solicitud)}
                  >
                    Rechazar
                  </button>
                </div>
              </article>
            );
          })}

          {solicitudesPendientes.length === 0 && (
            <div className="reception-empty-state">
              <h3>No existen solicitudes pendientes</h3>
              <p>Las nuevas solicitudes públicas aparecerán aquí.</p>
            </div>
          )}
        </section>
      )}

      {mostrarNuevaCita && (
        <div className="patient-modal-backdrop">
          <div className="patient-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={cerrarNuevaCita}
              disabled={procesando}
            >
              ×
            </button>

            <h2>Nueva cita</h2>

            <form onSubmit={guardarNuevaCita}>
              <label>Paciente</label>
              <select
                value={nuevaCita.pacienteId}
                onChange={(evento) =>
                  setNuevaCita({
                    ...nuevaCita,
                    pacienteId: evento.target.value
                  })
                }
                required
              >
                <option value="">Seleccionar paciente</option>

                {pacientes
                  .filter((paciente) => paciente.estado !== false)
                  .map((paciente) => (
                    <option key={paciente._id} value={paciente._id}>
                      {paciente.nombre} {paciente.apellido} · CI: {paciente.ci}
                    </option>
                  ))}
              </select>

              <label>Fecha</label>
              <input
                type="date"
                value={nuevaCita.fecha}
                onChange={async (evento) => {
                  const fecha = evento.target.value;

                  setNuevaCita({
                    ...nuevaCita,
                    fecha,
                    hora: ''
                  });

                  await consultarDisponibilidad(
                    fecha,
                    nuevaCita.odontologoId
                  );
                }}
                required
              />

              <label>Odontólogo</label>
              <select
                value={nuevaCita.odontologoId}
                onChange={async (evento) => {
                  const odontologoId = evento.target.value;

                  setNuevaCita({
                    ...nuevaCita,
                    odontologoId,
                    hora: ''
                  });

                  await consultarDisponibilidad(
                    nuevaCita.fecha,
                    odontologoId
                  );
                }}
                required
              >
                <option value="">Seleccionar odontólogo</option>

                {odontologos.map((odontologo) => (
                  <option key={odontologo._id} value={odontologo._id}>
                    {odontologo.nombre}
                  </option>
                ))}
              </select>

              <label>Duración</label>
              <select
                value={nuevaCita.duracionMinutos}
                onChange={(evento) =>
                  setNuevaCita({
                    ...nuevaCita,
                    duracionMinutos: Number(evento.target.value),
                    hora: ''
                  })
                }
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
              </select>

              <label>Servicio o tratamiento</label>
              <input
                type="text"
                value={nuevaCita.motivo}
                onChange={(evento) =>
                  setNuevaCita({
                    ...nuevaCita,
                    motivo: evento.target.value
                  })
                }
                required
              />

              <label>Observaciones</label>
              <textarea
                value={nuevaCita.observaciones}
                onChange={(evento) =>
                  setNuevaCita({
                    ...nuevaCita,
                    observaciones: evento.target.value
                  })
                }
              />

              <label>Horario</label>
              <div className="reprogram-hours-grid">
                {horariosDisponibles.map((hora) => {
                  const ocupado = horasOcupadas.includes(hora);

                  return (
                    <button
                      key={hora}
                      type="button"
                      disabled={ocupado}
                      className={
                        nuevaCita.hora === hora
                          ? 'selected'
                          : ocupado
                            ? 'disabled'
                            : ''
                      }
                      onClick={() =>
                        setNuevaCita({
                          ...nuevaCita,
                          hora
                        })
                      }
                    >
                      {hora}
                    </button>
                  );
                })}
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={cerrarNuevaCita}
                  disabled={procesando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    procesando ||
                    !nuevaCita.pacienteId ||
                    !nuevaCita.odontologoId ||
                    !nuevaCita.fecha ||
                    !nuevaCita.hora ||
                    !nuevaCita.motivo.trim()
                  }
                >
                  {procesando ? 'Guardando...' : 'Guardar cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reprogramando && (
        <div className="patient-modal-backdrop">
          <div className="patient-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={cerrarReprogramacion}
              disabled={procesando}
            >
              ×
            </button>

            <h2>Reprogramar cita</h2>

            <label>Nueva fecha</label>
            <input
              type="date"
              value={nuevoHorario.fecha}
              onChange={async (evento) => {
                const fecha = evento.target.value;

                setNuevoHorario({
                  ...nuevoHorario,
                  fecha,
                  hora: ''
                });

                await consultarDisponibilidad(
                  fecha,
                  nuevoHorario.odontologoId
                );
              }}
            />

            <label>Odontólogo</label>
            <select
              value={nuevoHorario.odontologoId}
              onChange={async (evento) => {
                const odontologoId = evento.target.value;

                setNuevoHorario({
                  ...nuevoHorario,
                  odontologoId,
                  hora: ''
                });

                await consultarDisponibilidad(
                  nuevoHorario.fecha,
                  odontologoId
                );
              }}
            >
              <option value="">Seleccionar odontólogo</option>

              {odontologos.map((odontologo) => (
                <option key={odontologo._id} value={odontologo._id}>
                  {odontologo.nombre}
                </option>
              ))}
            </select>

            <label>Motivo de reprogramación</label>
            <textarea
              value={nuevoHorario.motivoReprogramacion}
              onChange={(evento) =>
                setNuevoHorario({
                  ...nuevoHorario,
                  motivoReprogramacion: evento.target.value
                })
              }
              placeholder="Ejemplo: Solicitud del paciente"
            />

            <label>Nuevo horario</label>

            <div className="reprogram-hours-grid">
              {horariosDisponibles.map((hora) => {
                const odontologoOriginalId =
                  reprogramando.odontologoId?._id ||
                  reprogramando.odontologoId ||
                  '';

                const esHorarioActual =
                  fechaISO(reprogramando.fecha) === nuevoHorario.fecha &&
                  reprogramando.hora === hora &&
                  String(odontologoOriginalId) ===
                    String(nuevoHorario.odontologoId);

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

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-button"
                onClick={cerrarReprogramacion}
                disabled={procesando}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  procesando ||
                  !nuevoHorario.fecha ||
                  !nuevoHorario.hora ||
                  !nuevoHorario.odontologoId
                }
                onClick={guardarReprogramacion}
              >
                {procesando ? 'Guardando...' : 'Reprogramar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {solicitudConfirmando && (
        <div className="patient-modal-backdrop">
          <div className="patient-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={cerrarConfirmacionSolicitud}
              disabled={procesando}
            >
              ×
            </button>

            <h2>Confirmar solicitud</h2>

            <p>
              {solicitudConfirmando.nombreCompleto ||
                `${solicitudConfirmando.nombre || ''} ${
                  solicitudConfirmando.apellido || ''
                }`.trim()}{' '}
              · {solicitudConfirmando.servicio}
            </p>

            <label>Paciente registrado</label>
            <select
              value={confirmacionSolicitud.pacienteId}
              onChange={(evento) =>
                setConfirmacionSolicitud({
                  ...confirmacionSolicitud,
                  pacienteId: evento.target.value
                })
              }
            >
              <option value="">Seleccionar paciente</option>

              {pacientes
                .filter((paciente) => paciente.estado !== false)
                .map((paciente) => (
                  <option key={paciente._id} value={paciente._id}>
                    {paciente.nombre} {paciente.apellido} · CI: {paciente.ci}
                  </option>
                ))}
            </select>

            <label>Odontólogo</label>
            <select
              value={confirmacionSolicitud.odontologoId}
              onChange={(evento) =>
                setConfirmacionSolicitud({
                  ...confirmacionSolicitud,
                  odontologoId: evento.target.value
                })
              }
            >
              <option value="">Seleccionar odontólogo</option>

              {odontologos.map((odontologo) => (
                <option key={odontologo._id} value={odontologo._id}>
                  {odontologo.nombre}
                </option>
              ))}
            </select>

            <label>Duración</label>
            <select
              value={confirmacionSolicitud.duracionMinutos}
              onChange={(evento) =>
                setConfirmacionSolicitud({
                  ...confirmacionSolicitud,
                  duracionMinutos: Number(evento.target.value)
                })
              }
            >
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
            </select>

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-button"
                onClick={cerrarConfirmacionSolicitud}
                disabled={procesando}
              >
                Volver
              </button>

              <button
                type="button"
                disabled={
                  procesando ||
                  !confirmacionSolicitud.pacienteId ||
                  !confirmacionSolicitud.odontologoId
                }
                onClick={confirmarSolicitud}
              >
                {procesando ? 'Confirmando...' : 'Confirmar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default GestionCitasRecepcion;