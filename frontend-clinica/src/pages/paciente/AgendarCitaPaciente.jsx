import { useEffect, useState } from 'react';
import api from '../../api/axios';
import '../../styles/paciente/AgendarCitaPaciente.css';

const servicios = [
  {
    nombre: 'Odontología General',
    icono: '🦷'
  },
  {
    nombre: 'Blanqueamiento Dental',
    icono: '✨'
  },
  {
    nombre: 'Ortodoncia',
    icono: '😁'
  },
  {
    nombre: 'Endodoncia',
    icono: '🩺'
  },
  {
    nombre: 'Extracción',
    icono: '🦴'
  },
  {
    nombre: 'Implantes',
    icono: '🔩'
  }
];

const horarios = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
];

const AgendarCitaPaciente = () => {
  const [paso, setPaso] = useState(1);
  const [paciente, setPaciente] = useState(null);
  const [odontologos, setOdontologos] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);

  const [formulario, setFormulario] = useState({
    servicio: '',
    odontologo: '',
    odontologoId: '',
    fecha: '',
    hora: '',
    observaciones: ''
  });

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    const perfil = await api.get('/pacientes/mi-perfil');
    const doctores = await api.get('/usuarios/odontologos');
    setPaciente(perfil.data.paciente);
    setOdontologos(doctores.data.filter((doctor) => doctor.estado));
  };

  const obtenerHorariosOcupados = async (fecha, odontologo) => {
  if (!fecha || !odontologo) {
    setHorasOcupadas([]);
    return;
  }

  try {
    const { data } = await api.get('/citas/disponibilidad', {
      params: {
        fecha,
        odontologoId: odontologo
      }
    });

    setHorasOcupadas((data.horariosOcupados || []).map((item) => item.hora));
  } catch (error) {
    console.error('Error al consultar disponibilidad:', error);
    setHorasOcupadas([]);
  }
};

const horarioOcupado = (hora) => {
  return horasOcupadas.includes(hora);
};

  const confirmarCita = async () => {
    try {
      await api.post('/citas', {
        pacienteId: paciente._id,
        fecha: formulario.fecha,
        hora: formulario.hora,
        motivo: formulario.servicio,
        observaciones: formulario.observaciones,
        odontologoId: formulario.odontologoId,
        estado: 'pendiente'
      });

      alert('Cita agendada correctamente.');

      setFormulario({
        servicio: '',
        odontologo: '',
        odontologoId: '',
        fecha: '',
        hora: '',
        observaciones: ''
      });

      setPaso(1);
      obtenerDatos();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'No se pudo agendar la cita.');
    }
  };

  const fechaBonita = (fecha) => {
  if (!fecha) return '';

  const [year, month, day] = fecha.split('-');

  return new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
};

  return (
    <main className="patient-booking-page">
      <div className="page-header">
        <div>
          <h1>Agendar Cita</h1>
          <p>Selecciona el servicio, odontólogo, fecha y horario disponible</p>
        </div>
      </div>

      <div className="booking-steps">
        {['Servicio', 'Odontólogo', 'Horario', 'Confirmar'].map((item, index) => (
          <div className={paso >= index + 1 ? 'step active' : 'step'} key={item}>
            <strong>{index + 1}</strong>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {paso === 1 && (
        <section className="booking-grid">
          {servicios.map((servicio) => (
            <button
              key={servicio.nombre}
              className="booking-card"
              onClick={() => {
                setFormulario({ ...formulario, servicio: servicio.nombre });
                setPaso(2);
              }}
            >
              <div className="service-icon">
                {servicio.icono}
              </div>
              
              <h3>{servicio.nombre}</h3>
            </button>
          ))}
        </section>
      )}

      {paso === 2 && (
        <section className="booking-list">
          <p className="selected-info">
            Servicio seleccionado: <strong>{formulario.servicio}</strong>
          </p>

          {odontologos.length === 0 && (
            <p>No hay odontólogos disponibles por el momento.</p>
          )}

          {odontologos.map((doctor) => (
            <button
              key={doctor._id}
              className="doctor-booking-card"
              onClick={() => {
                setFormulario({
                  ...formulario,
                  odontologo: doctor.nombre,
                  odontologoId: doctor._id
                });
                setPaso(3);
              }}
            >
              <div className="patient-avatar">
                {doctor.nombre
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <div>
                <h3>{doctor.nombre}</h3>
                <p>Odontólogo disponible</p>
              </div>

              <span className="status active">Disponible</span>
            </button>
          ))}
          
          <div className="wizard-actions">
            <button
              type="button"
              className="btn-back"
              onClick={() => setPaso(paso - 1)}
            >
                ← Volver
            </button>
          </div>
        </section>
      )}

      {paso === 3 && (
        <section className="booking-time-layout">
          <div className="booking-date-card">
            <label>Selecciona una fecha</label>
            <input
              type="date"
              value={formulario.fecha}
              onChange={async (e) => {
                  const fecha = e.target.value;
                  
                  setFormulario({
                    ...formulario,
                    fecha,
                    hora: ''
                  });
                  
                  await obtenerHorariosOcupados(fecha, formulario.odontologoId);
                }}
            />
          </div>

          <div className="booking-hours-card">
            <h3>Horarios disponibles</h3>

            {!formulario.fecha ? (
              <p>Primero selecciona una fecha.</p>
            ) : (
              <div className="hours-grid">
                {horarios.map((hora) => {
                  const ocupado = horarioOcupado(hora);
                  
                  return (
                    <button
                     key={hora}
                     type="button"
                     disabled={ocupado}
                     className={
                       formulario.hora === hora
                       ? 'hour-btn selected'
                       : ocupado
                       ? 'hour-btn disabled'
                       : 'hour-btn'
                     }
                     onClick={() => setFormulario({ ...formulario, hora })}
                    >
                      <strong>{hora}</strong>
                      <span>{ocupado ? 'Ocupado' : 'Disponible'}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setPaso(2)}>
                Volver
              </button>

              <button
                disabled={!formulario.fecha || !formulario.hora}
                onClick={() => setPaso(4)}
              >
                Continuar
              </button>
            </div>
          </div>
        </section>
      )}

{paso === 4 && (
  <section className="booking-confirm-layout">
    <div className="booking-confirm-card">
      <h2>Resumen de tu cita</h2>

      <div className="confirm-row">
        <span>Paciente</span>
        <strong>{paciente?.nombre} {paciente?.apellido}</strong>
      </div>

      <div className="confirm-row">
        <span>Servicio</span>
        <strong>{formulario.servicio}</strong>
      </div>

      <div className="confirm-row">
        <span>Odontólogo</span>
        <strong>{formulario.odontologo}</strong>
      </div>

      <div className="confirm-row">
        <span>Fecha</span>
        <strong>{fechaBonita(formulario.fecha)}</strong>
      </div>

      <div className="confirm-row">
        <span>Hora</span>
        <strong>{formulario.hora}</strong>
      </div>

      <div className="confirm-row">
        <span>Estado</span>
        <strong>Pendiente</strong>
      </div>

      <textarea
        placeholder="Alergias, medicamentos actuales o información importante para el odontólogo (opcional)."
        value={formulario.observaciones}
        onChange={(e) =>
          setFormulario({ ...formulario, observaciones: e.target.value })
        }
      />

      <div className="booking-warning">
        Recuerda llegar 10 minutos antes de tu cita. Si necesitas cancelar, hazlo con anticipación.
      </div>

      <div className="form-actions">
        <button className="btn-cancel" onClick={() => setPaso(3)}>
          ← Volver
        </button>

        <button onClick={confirmarCita}>Confirmar Cita</button>
      </div>
    </div>

    <aside className="booking-side-summary">
      <div className="summary-icon">🦷</div>
      <h3>{formulario.servicio}</h3>
      <p>{formulario.odontologo}</p>
      <span>{fechaBonita(formulario.fecha)}</span>
      <strong>{formulario.hora}</strong>
    </aside>
  </section>
)}
    </main>
  );
};

export default AgendarCitaPaciente;
