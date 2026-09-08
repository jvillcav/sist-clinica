import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import '../../styles/paciente/InicioPaciente.css';

const InicioPaciente = () => {
  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      const { data } = await api.get('/pacientes/mi-perfil');
      setPaciente(data?.paciente ?? null);
      setExpedientes(Array.isArray(data?.expedientes) ? data.expedientes : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setPaciente(null);
      setExpedientes([]);
      setError('No se pudo cargar la información. Intenta nuevamente.');
    }
  };

  const resumenExpediente = useMemo(() => {
    const ultimoExpediente = expedientes[expedientes.length - 1] || null;

    return {
      total: expedientes.length,
      tratamiento: ultimoExpediente?.tratamiento || 'Sin registro',
      diagnostico: ultimoExpediente?.diagnostico || 'Sin registro',
      odontologo: ultimoExpediente?.odontologo || 'Sin registro',
    };
  }, [expedientes]);

  const nombreCompleto = useMemo(() => {
    if (!paciente?.nombre && !paciente?.apellido) return 'Paciente';
    return `${paciente?.nombre || ''} ${paciente?.apellido || ''}`.trim();
  }, [paciente]);

  if (!paciente) return <p>{error || 'Cargando información...'}</p>;

  return (
    <main className="patient-home">
      <section className="patient-welcome">
        <div>
          <p>Bienvenido de vuelta</p>
          <h1>{nombreCompleto}</h1>
          <span>Portal del Paciente · Clínica Dental Orellana</span>

          <div className="welcome-actions">
            <a href="/paciente/agendar">Agendar Cita</a>
            <a href="/paciente/mis-citas">Mis Citas</a>
          </div>
        </div>
      </section>

      <section className="patient-stats">
        <div>
          <strong>{resumenExpediente.total}</strong>
          <span>Consultas totales</span>
        </div>

        <div>
          <strong>{resumenExpediente.tratamiento}</strong>
          <span>Último tratamiento</span>
        </div>

        <div>
          <strong>{resumenExpediente.diagnostico}</strong>
          <span>Último diagnóstico</span>
        </div>

        <div>
          <strong>{resumenExpediente.odontologo}</strong>
          <span>Último odontólogo</span>
        </div>
      </section>

      <section className="patient-home-grid">
        <a href="/paciente/expediente" className="patient-shortcut-card">
          <h3>Ver Expediente</h3>
          <p>Consulta tu historial clínico completo.</p>
        </a>

        <a href="/paciente/perfil" className="patient-shortcut-card">
          <h3>Actualizar Perfil</h3>
          <p>Revisa tu información personal.</p>
        </a>
      </section>
    </main>
  );
};

export default InicioPaciente;
