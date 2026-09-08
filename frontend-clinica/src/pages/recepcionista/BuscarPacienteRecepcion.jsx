import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const BuscarPacienteRecepcion = () => {
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState(null);

  useEffect(() => {
    obtenerPacientes();
  }, []);

  const obtenerPacientes = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get('/pacientes');

      setPacientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener pacientes:', error);

      setError(
        error.response?.data?.mensaje ||
          'No se pudieron cargar los pacientes.'
      );
    } finally {
      setCargando(false);
    }
  };

  const iniciales = (nombre = '', apellido = '') => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
  };

  const pacientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return pacientes
      .filter((paciente) => {
        const contenido = `
          ${paciente.nombre || ''}
          ${paciente.apellido || ''}
          ${paciente.ci || ''}
          ${paciente.telefono || ''}
          ${paciente.email || ''}
        `.toLowerCase();

        return contenido.includes(texto);
      })
      .sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(
          `${b.nombre} ${b.apellido}`,
          'es'
        )
      );
  }, [pacientes, busqueda]);

  if (cargando) {
    return (
      <main className="reception-search-page">
        <p>Cargando pacientes...</p>
      </main>
    );
  }

  return (
    <main className="reception-search-page">
      <div className="reception-page-heading">
        <div>
          <h1>Buscar Paciente</h1>

          <p>
            Busca por nombre, cédula de identidad, teléfono o correo
            electrónico
          </p>
        </div>

        <button
          type="button"
          className="reception-submit-button"
          onClick={() =>
            navigate('/recepcionista/registrar')
          }
        >
          + Registrar paciente
        </button>
      </div>

      {error && (
        <div className="reception-error-message">
          {error}
        </div>
      )}

      <div className="reception-search-box">
        <input
          type="search"
          placeholder="Nombre, CI, teléfono o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoFocus
        />
      </div>

      <div className="reception-search-summary">
        <strong>{pacientesFiltrados.length}</strong>
        <span>
          {pacientesFiltrados.length === 1
            ? 'paciente encontrado'
            : 'pacientes encontrados'}
        </span>
      </div>

      <section className="reception-patient-grid">
        {pacientesFiltrados.map((paciente) => (
          <article
            className="reception-patient-card"
            key={paciente._id}
          >
            <div className="reception-patient-card-header">
              <div className="reception-patient-avatar">
                {iniciales(
                  paciente.nombre,
                  paciente.apellido
                )}
              </div>

              <span
                className={`patient-state-badge ${
                  paciente.estado ? 'active' : 'inactive'
                }`}
              >
                {paciente.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="reception-patient-card-content">
              <h2>
                {paciente.nombre} {paciente.apellido}
              </h2>

              <div className="reception-patient-data">
                <span>
                  <strong>CI:</strong>{' '}
                  {paciente.ci || 'Sin registro'}
                </span>

                <span>
                  <strong>Teléfono:</strong>{' '}
                  {paciente.telefono || 'Sin registro'}
                </span>

                <span>
                  <strong>Correo:</strong>{' '}
                  {paciente.email || 'Sin registro'}
                </span>
              </div>
            </div>

            <div className="reception-patient-card-actions">
              <button
                type="button"
                onClick={() =>
                  setPacienteSeleccionado(paciente)
                }
              >
                Ver detalle
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  navigate('/recepcionista/citas', {
                    state: {
                      pacienteId: paciente._id
                    }
                  })
                }
              >
                Agendar cita
              </button>

              {paciente.telefono && (
                <a href={`tel:${paciente.telefono}`}>
                  Llamar
                </a>
              )}
            </div>
          </article>
        ))}

        {pacientesFiltrados.length === 0 && (
          <div className="reception-empty-state">
            <h3>No se encontraron pacientes</h3>

            <p>
              Intenta con otro nombre, CI, teléfono o correo.
            </p>
          </div>
        )}
      </section>

      {pacienteSeleccionado && (
        <div className="patient-modal-backdrop">
          <div className="reception-patient-detail-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={() =>
                setPacienteSeleccionado(null)
              }
            >
              ×
            </button>

            <div className="reception-patient-detail-header">
              <div className="reception-patient-avatar large">
                {iniciales(
                  pacienteSeleccionado.nombre,
                  pacienteSeleccionado.apellido
                )}
              </div>

              <div>
                <h2>
                  {pacienteSeleccionado.nombre}{' '}
                  {pacienteSeleccionado.apellido}
                </h2>

                <span
                  className={`patient-state-badge ${
                    pacienteSeleccionado.estado
                      ? 'active'
                      : 'inactive'
                  }`}
                >
                  {pacienteSeleccionado.estado
                    ? 'Paciente activo'
                    : 'Paciente inactivo'}
                </span>
              </div>
            </div>

            <div className="reception-patient-detail-grid">
              <div>
                <span>CI</span>
                <strong>
                  {pacienteSeleccionado.ci ||
                    'Sin registro'}
                </strong>
              </div>

              <div>
                <span>Teléfono</span>
                <strong>
                  {pacienteSeleccionado.telefono ||
                    'Sin registro'}
                </strong>
              </div>

              <div>
                <span>Correo electrónico</span>
                <strong>
                  {pacienteSeleccionado.email ||
                    'Sin registro'}
                </strong>
              </div>

              <div>
                <span>Sexo</span>
                <strong>
                  {pacienteSeleccionado.sexo ||
                    'Sin registro'}
                </strong>
              </div>

              <div>
                <span>Tipo de sangre</span>
                <strong>
                  {pacienteSeleccionado.tipoSangre ||
                    'Sin registro'}
                </strong>
              </div>

              <div>
                <span>Dirección</span>
                <strong>
                  {pacienteSeleccionado.direccion ||
                    'Sin registro'}
                </strong>
              </div>
            </div>

            <section className="reception-patient-clinical">
              <div>
                <h3>Alergias</h3>

                <p>
                  {pacienteSeleccionado.alergias?.length
                    ? pacienteSeleccionado.alergias.join(', ')
                    : 'Sin alergias registradas.'}
                </p>
              </div>

              <div>
                <h3>Condiciones crónicas</h3>

                <p>
                  {pacienteSeleccionado.condicionesCronicas
                    ?.length
                    ? pacienteSeleccionado.condicionesCronicas.join(
                        ', '
                      )
                    : 'Sin condiciones registradas.'}
                </p>
              </div>
            </section>

            <div className="reception-patient-detail-actions">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setPacienteSeleccionado(null)
                }
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/recepcionista/citas', {
                    state: {
                      pacienteId:
                        pacienteSeleccionado._id
                    }
                  })
                }
              >
                Agendar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default BuscarPacienteRecepcion;