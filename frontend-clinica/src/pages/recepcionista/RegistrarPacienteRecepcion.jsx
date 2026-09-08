import { useState } from 'react';
import api from '../../api/axios';

const formularioInicial = {
  nombre: '',
  apellido: '',
  ci: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  sexo: '',
  tipoSangre: '',
  direccion: '',
  alergias: '',
  condicionesCronicas: '',

  contactoEmergencia: {
    nombre: '',
    telefono: '',
    parentesco: ''
  }
};

const RegistrarPacienteRecepcion = () => {
  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [registroCreado, setRegistroCreado] = useState(null);

  const actualizarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  };

  const actualizarContacto = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      contactoEmergencia: {
        ...anterior.contactoEmergencia,
        [campo]: valor
      }
    }));
  };

  const convertirLista = (texto) => {
    if (!texto.trim()) return [];

    return texto
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const validarFormulario = () => {
    if (!formulario.nombre.trim()) {
      return 'El nombre es obligatorio.';
    }

    if (!formulario.apellido.trim()) {
      return 'El apellido es obligatorio.';
    }

    if (!formulario.ci.trim()) {
      return 'El CI es obligatorio.';
    }

    if (
      formulario.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)
    ) {
      return 'El correo electrónico no tiene un formato válido.';
    }

    return '';
  };

  const registrarPaciente = async (e) => {
    e.preventDefault();

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setMensaje('');
      setError('');
      setRegistroCreado(null);

      const payload = {
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        ci: formulario.ci,
        telefono: formulario.telefono,
        email: formulario.email,
        fechaNacimiento:
          formulario.fechaNacimiento || null,
        sexo: formulario.sexo,
        tipoSangre: formulario.tipoSangre,
        direccion: formulario.direccion,

        alergias: convertirLista(formulario.alergias),

        condicionesCronicas: convertirLista(
          formulario.condicionesCronicas
        ),

        contactoEmergencia:
          formulario.contactoEmergencia
      };

      const { data } = await api.post('/pacientes', payload);

      setRegistroCreado({
        paciente: data.paciente,
        accesoCreado: data.accesoCreado
      });

      setMensaje(data.mensaje);
      setFormulario(formularioInicial);
    } catch (error) {
      console.error('Error al registrar paciente:', error);

      setError(
        error.response?.data?.mensaje ||
          'No se pudo registrar el paciente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setMensaje('');
    setError('');
    setRegistroCreado(null);
  };

  return (
    <main className="reception-register-page">
      <div className="reception-page-heading">
        <div>
          <h1>Registrar Paciente</h1>

          <p>
            Registra la información inicial del paciente.
            Los datos faltantes podrán completarse posteriormente.
          </p>
        </div>

        <button
          type="button"
          className="reception-new-button"
          onClick={limpiarFormulario}
        >
          + Nuevo
        </button>
      </div>

      {mensaje && (
        <div className="reception-success-message">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="reception-error-message">
          {error}
        </div>
      )}

      {registroCreado && (
        <section className="reception-registration-summary">
          <div>
            <strong>
              {registroCreado.paciente.nombre}{' '}
              {registroCreado.paciente.apellido}
            </strong>

            <span>
              CI: {registroCreado.paciente.ci}
            </span>
          </div>

          <span
            className={
              registroCreado.accesoCreado
                ? 'access-created'
                : 'access-pending'
            }
          >
            {registroCreado.accesoCreado
              ? 'Cuenta de acceso creada'
              : 'Sin cuenta de acceso'}
          </span>
        </section>
      )}

      <form
        className="reception-patient-form"
        onSubmit={registrarPaciente}
      >
        <section className="reception-form-section">
          <div className="reception-form-section-title">
            <div className="reception-section-icon">
              👤
            </div>

            <div>
              <h2>Información personal</h2>
              <p>Datos de identificación y contacto</p>
            </div>
          </div>

          <div className="reception-form-grid">
            <label>
              Nombre
              <input
                type="text"
                placeholder="Nombres"
                value={formulario.nombre}
                onChange={(e) =>
                  actualizarCampo(
                    'nombre',
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Apellido
              <input
                type="text"
                placeholder="Apellidos"
                value={formulario.apellido}
                onChange={(e) =>
                  actualizarCampo(
                    'apellido',
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Cédula de identidad
              <input
                type="text"
                placeholder="Número de CI"
                value={formulario.ci}
                onChange={(e) =>
                  actualizarCampo(
                    'ci',
                    e.target.value.replace(
                      /[^0-9A-Za-z-]/g,
                      ''
                    )
                  )
                }
                required
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                placeholder="Ej.: 71234567"
                value={formulario.telefono}
                onChange={(e) =>
                  actualizarCampo(
                    'telefono',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={formulario.email}
                onChange={(e) =>
                  actualizarCampo(
                    'email',
                    e.target.value
                  )
                }
              />

              <small>
                Al proporcionar correo se creará una cuenta
                de acceso. La contraseña inicial será el CI.
              </small>
            </label>

            <label>
              Fecha de nacimiento
              <input
                type="date"
                max={new Date()
                  .toISOString()
                  .split('T')[0]}
                value={formulario.fechaNacimiento}
                onChange={(e) =>
                  actualizarCampo(
                    'fechaNacimiento',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Sexo
              <select
                value={formulario.sexo}
                onChange={(e) =>
                  actualizarCampo(
                    'sexo',
                    e.target.value
                  )
                }
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">
                  Masculino
                </option>
                <option value="Femenino">
                  Femenino
                </option>
                <option value="Otro">Otro</option>
              </select>
            </label>

            <label>
              Tipo de sangre
              <select
                value={formulario.tipoSangre}
                onChange={(e) =>
                  actualizarCampo(
                    'tipoSangre',
                    e.target.value
                  )
                }
              >
                <option value="">Sin registro</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label className="reception-field-full">
              Dirección
              <input
                type="text"
                placeholder="Zona, calle o referencia"
                value={formulario.direccion}
                onChange={(e) =>
                  actualizarCampo(
                    'direccion',
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

        <section className="reception-form-section">
          <div className="reception-form-section-title">
            <div className="reception-section-icon medical">
              🩺
            </div>

            <div>
              <h2>Información médica</h2>
              <p>
                Información opcional para una atención más
                segura
              </p>
            </div>
          </div>

          <div className="reception-form-grid">
            <label>
              Alergias conocidas
              <textarea
                placeholder="Ej.: Penicilina, látex. Separe cada dato con una coma."
                value={formulario.alergias}
                onChange={(e) =>
                  actualizarCampo(
                    'alergias',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Condiciones crónicas
              <textarea
                placeholder="Ej.: Diabetes, hipertensión. Separe cada dato con una coma."
                value={formulario.condicionesCronicas}
                onChange={(e) =>
                  actualizarCampo(
                    'condicionesCronicas',
                    e.target.value
                  )
                }
              />
            </label>
          </div>

          <div className="reception-form-note">
            Estos campos pueden quedar vacíos si el paciente no
            conoce la información. Posteriormente podrá
            completarla desde su perfil.
          </div>
        </section>

        <section className="reception-form-section">
          <div className="reception-form-section-title">
            <div className="reception-section-icon emergency">
              ☎
            </div>

            <div>
              <h2>Contacto de emergencia</h2>
              <p>Persona de contacto en caso necesario</p>
            </div>
          </div>

          <div className="reception-form-grid three-columns">
            <label>
              Nombre completo
              <input
                type="text"
                placeholder="Nombre del contacto"
                value={
                  formulario.contactoEmergencia.nombre
                }
                onChange={(e) =>
                  actualizarContacto(
                    'nombre',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                placeholder="Número de emergencia"
                value={
                  formulario.contactoEmergencia.telefono
                }
                onChange={(e) =>
                  actualizarContacto(
                    'telefono',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Parentesco
              <input
                type="text"
                placeholder="Ej.: Madre, hermano, cónyuge"
                value={
                  formulario.contactoEmergencia.parentesco
                }
                onChange={(e) =>
                  actualizarContacto(
                    'parentesco',
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

        <div className="reception-register-actions">
          <button
            type="button"
            className="reception-clear-button"
            onClick={limpiarFormulario}
          >
            Limpiar formulario
          </button>

          <button
            type="submit"
            className="reception-submit-button"
            disabled={guardando}
          >
            {guardando
              ? 'Registrando...'
              : 'Registrar paciente'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default RegistrarPacienteRecepcion;