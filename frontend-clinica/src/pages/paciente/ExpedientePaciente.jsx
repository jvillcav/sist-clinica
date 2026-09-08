import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import '../../styles/paciente/ExpedientePaciente.css';

const ExpedientePaciente = () => {
  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerExpediente();
  }, []);

  const obtenerExpediente = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get('/expedientes/mi-expediente');

      setPaciente(data.paciente);
      setExpedientes(
        Array.isArray(data.expedientes) ? data.expedientes : []
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          'No se pudo cargar tu expediente clínico.'
      );
    } finally {
      setCargando(false);
    }
  };

  const iniciales = (nombre = '', apellido = '') => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
  };

  const fechaBonita = (fecha) => {
    if (!fecha) return 'Sin fecha';

    return new Date(fecha).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const expedientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return expedientes.filter((expediente) =>
      `${expediente.diagnostico} ${expediente.tratamiento} ${expediente.odontologo}`
        .toLowerCase()
        .includes(texto)
    );
  }, [expedientes, busqueda]);

  if (cargando) {
    return (
      <main className="patient-record-page">
        <p>Cargando expediente clínico...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="patient-record-page">
        <div className="error-message">{error}</div>
      </main>
    );
  }

  const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'Sin registro';

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }

  return `${edad} años`;
};

const formatearOdontologo = (nombre = '') => {
  if (!nombre) return 'Sin registro';

  const nombreNormalizado = nombre.trim();

  if (
    nombreNormalizado.toLowerCase().startsWith('dr.') ||
    nombreNormalizado.toLowerCase().startsWith('dra.')
  ) {
    return nombreNormalizado;
  }

  return `Dr. ${nombreNormalizado}`;
};

  return (
    <main className="patient-record-page">
      <div className="patient-record-header">
        <div>
          <h1>Expediente Clínico</h1>
          <p>Consulta tu historial odontológico completo</p>
        </div>
      </div>

<section className="patient-record-profile">
  <div className="patient-record-main">
    <div className="patient-record-avatar">
      {iniciales(paciente?.nombre, paciente?.apellido)}
    </div>

    <div className="patient-record-identity">
      <div className="patient-record-name-row">
        <h2>
          {paciente?.nombre} {paciente?.apellido}
        </h2>

        <span
          className={`patient-state-badge ${
            paciente?.estado ? 'active' : 'inactive'
          }`}
        >
          {paciente?.estado ? 'Paciente activo' : 'Paciente inactivo'}
        </span>
      </div>

      <div className="patient-record-data-grid">
        <div>
          <span>CI</span>
          <strong>{paciente?.ci || 'Sin registro'}</strong>
        </div>

        <div>
          <span>Sexo</span>
          <strong>{paciente?.sexo || 'Sin registro'}</strong>
        </div>

        <div>
          <span>Edad</span>
          <strong>{calcularEdad(paciente?.fechaNacimiento)}</strong>
        </div>

        <div>
          <span>Tipo de sangre</span>
          <strong>{paciente?.tipoSangre || 'Sin registro'}</strong>
        </div>

        <div>
          <span>Teléfono</span>
          <strong>{paciente?.telefono || 'Sin registro'}</strong>
        </div>
      </div>
    </div>
  </div>

  <div className="patient-clinical-alerts">
    <div className="clinical-info-box allergies">
      <h3>Alergias</h3>

      {paciente?.alergias?.length > 0 ? (
        <div className="clinical-tags">
          {paciente.alergias.map((alergia) => (
            <span key={alergia}>{alergia}</span>
          ))}
        </div>
      ) : (
        <p>Sin alergias registradas.</p>
      )}
    </div>

    <div className="clinical-info-box conditions">
      <h3>Condiciones crónicas</h3>

      {paciente?.condicionesCronicas?.length > 0 ? (
        <div className="clinical-tags">
          {paciente.condicionesCronicas.map((condicion) => (
            <span key={condicion}>{condicion}</span>
          ))}
        </div>
      ) : (
        <p>Sin condiciones registradas.</p>
      )}
    </div>
  </div>
</section>

      <div className="patient-record-toolbar">
        <div>
          <h2>Historial de Tratamientos</h2>
          <p>{expedientes.length} consultas registradas</p>
        </div>

        <input
          type="search"
          placeholder="Buscar por diagnóstico, tratamiento u odontólogo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <section className="patient-treatment-list">
        {expedientesFiltrados.length === 0 ? (
          <div className="appointments-empty">
            <h2>No se encontraron consultas</h2>
            <p>
              No tienes tratamientos que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          expedientesFiltrados.map((expediente) => (
            <article
              className="patient-treatment-card"
              key={expediente._id}
            >
<div className="treatment-card-header">
  <div>
    <h3>
      {expediente.citaId?.motivo ||
        expediente.tratamiento}
    </h3>

    <div className="treatment-meta">
      <span>
        👨‍⚕️ {formatearOdontologo(expediente.odontologo)}
      </span>

      <span>
        📅{' '}
        {fechaBonita(
          expediente.fechaAtencion ||
            expediente.createdAt
        )}
      </span>
    </div>
  </div>
</div>

              <div className="treatment-information-grid">
                <div>
                  <span>Diagnóstico</span>
                  <strong>{expediente.diagnostico}</strong>
                </div>

                <div>
                  <span>Tratamiento</span>
                  <strong>{expediente.tratamiento}</strong>
                </div>
              </div>

              <div className="treatment-observations">
                <span>Observaciones del Odontologo</span>
                <p>
                  {expediente.observaciones ||
                    'Sin observaciones registradas.'}
                </p>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
};

export default ExpedientePaciente;
