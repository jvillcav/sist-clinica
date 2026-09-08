import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axios';
import '../../styles/paciente/PerfilPaciente.css';

const formularioInicial = {
  nombre: '',
  apellido: '',
  email: '',
  ci: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  sexo: '',
  tipoSangre: '',
  alergias: '',
  condicionesCronicas: '',
  contactoEmergencia: {
    nombre: '',
    telefono: '',
    parentesco: ''
  }
};

const PerfilPaciente = () => {
  const [paciente, setPaciente] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('success');
  const toastTimer = useRef(null);

  const mostrarToast = (texto, tipo = 'success') => {
    setMensaje(texto);
    setToastType(tipo);
    setToastVisible(true);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
    }, 2800);
  };

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [password, setPassword] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  useEffect(() => {
    obtenerPerfil();
  }, []);

  const fechaParaInput = (fecha) => {
    if (!fecha) return '';
    return String(fecha).split('T')[0];
  };

  const cargarFormulario = (datos) => {
    setFormulario({
      nombre: datos.nombre || '',
      apellido: datos.apellido || '',
      email: datos.email || '',
      ci: datos.ci || '',
      telefono: datos.telefono || '',
      direccion: datos.direccion || '',
      fechaNacimiento: fechaParaInput(datos.fechaNacimiento),
      sexo: datos.sexo || '',
      tipoSangre: datos.tipoSangre || '',
      alergias: (datos.alergias || []).join(', '),
      condicionesCronicas: (datos.condicionesCronicas || []).join(', '),

      contactoEmergencia: {
        nombre: datos.contactoEmergencia?.nombre || '',
        telefono: datos.contactoEmergencia?.telefono || '',
        parentesco: datos.contactoEmergencia?.parentesco || ''
      }
    });
  };

  const obtenerPerfil = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get('/pacientes/mi-perfil');

      setPaciente(data.paciente);
      cargarFormulario(data.paciente);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'No se pudo cargar tu perfil.'
      );
    } finally {
      setCargando(false);
    }
  };

  const convertirLista = (texto) => {
    return texto
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

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

  const guardarPerfil = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setMensaje('');
      setError('');

      const payload = {
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        email: formulario.email,
        telefono: formulario.telefono,
        direccion: formulario.direccion,
        fechaNacimiento: formulario.fechaNacimiento || null,
        sexo: formulario.sexo,
        tipoSangre: formulario.tipoSangre,
        alergias: convertirLista(formulario.alergias),
        condicionesCronicas: convertirLista(
          formulario.condicionesCronicas
        ),
        contactoEmergencia: formulario.contactoEmergencia
      };

      const { data } = await api.put(
        '/pacientes/mi-perfil',
        payload
      );

      setPaciente(data.paciente);
      cargarFormulario(data.paciente);

      localStorage.setItem(
        'usuario',
        JSON.stringify(data.usuario)
      );

      setModoEdicion(false);
      mostrarToast('Perfil actualizado correctamente.', 'success');
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'No se pudo actualizar el perfil.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    cargarFormulario(paciente);
    setModoEdicion(false);
    setError('');
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (password.nueva !== password.confirmar) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    try {
      await api.put('/pacientes/mi-perfil/password', {
        passwordActual: password.actual,
        passwordNueva: password.nueva
      });

      setPassword({
        actual: '',
        nueva: '',
        confirmar: ''
      });

      setMostrarPassword(false);
      setMensaje('Contraseña actualizada correctamente.');
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'No se pudo cambiar la contraseña.'
      );
    }
  };

  const porcentajePerfil = useMemo(() => {
    const campos = [
      paciente?.nombre,
      paciente?.apellido,
      paciente?.email,
      paciente?.ci,
      paciente?.telefono,
      paciente?.direccion,
      paciente?.fechaNacimiento,
      paciente?.sexo,
      paciente?.tipoSangre,
      paciente?.contactoEmergencia?.nombre,
      paciente?.contactoEmergencia?.telefono
    ];

    const completos = campos.filter(
      (campo) => campo !== null && campo !== undefined && campo !== ''
    ).length;

    return Math.round((completos / campos.length) * 100);
  }, [paciente]);

  const iniciales = `${paciente?.nombre?.[0] || ''}${
    paciente?.apellido?.[0] || ''
  }`.toUpperCase();

  if (cargando) {
    return (
      <main className="patient-profile-page">
        <p>Cargando perfil...</p>
      </main>
    );
  }

  return (
    <main className="patient-profile-page">
      <div className="patient-profile-heading">
        <div>
          <h1>Mi Perfil</h1>
          <p>Completa y mantén actualizada tu información personal</p>
        </div>

        {!modoEdicion && (
          <button
            className="profile-edit-button"
            onClick={() => setModoEdicion(true)}
          >
            Editar perfil
          </button>
        )}
      </div>

      {toastVisible && toastType === 'success' && (
        <div className="toast-notice success">
          {mensaje}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}

      <section className="profile-summary-card">
        <div className="profile-summary-avatar">{iniciales}</div>

        <div className="profile-summary-info">
          <div className="profile-summary-title">
            <div>
              <h2>
                {paciente?.nombre} {paciente?.apellido}
              </h2>

              <p>{paciente?.email || 'Correo sin registrar'}</p>
            </div>

            <span
              className={`patient-state-badge ${
                paciente?.estado ? 'active' : 'inactive'
              }`}
            >
              {paciente?.estado
                ? 'Paciente activo'
                : 'Paciente inactivo'}
            </span>
          </div>

          <div className="profile-progress">
            <div>
              <span>Perfil completado</span>
              <strong>{porcentajePerfil}%</strong>
            </div>

            <div className="profile-progress-track">
              <span style={{ width: `${porcentajePerfil}%` }} />
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={guardarPerfil}>
        <section className="profile-form-card">
          <div className="profile-section-title">
            <h2>Información personal</h2>
            <p>Datos de identificación y contacto</p>
          </div>

          <div className="profile-form-grid">
            <label>
              Nombre
              <input
                type="text"
                value={formulario.nombre}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('nombre', e.target.value)
                }
                required
              />
            </label>

            <label>
              Apellido
              <input
                type="text"
                value={formulario.apellido}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('apellido', e.target.value)
                }
                required
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                value={formulario.email}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('email', e.target.value)
                }
                required
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                value={formulario.telefono}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('telefono', e.target.value)
                }
              />
            </label>

            <label>
              Cédula de identidad
              <input
                type="text"
                value={formulario.ci}
                disabled
                title="La cédula de identidad solo puede ser modificada por administración."
              />
              <small>Solo puede modificarla administración.</small>
            </label>

            <label>
              Fecha de nacimiento
              <input
                type="date"
                value={formulario.fechaNacimiento}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('fechaNacimiento', e.target.value)
                }
              />
            </label>

            <label>
              Sexo
              <select
                value={formulario.sexo}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('sexo', e.target.value)
                }
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </label>

            <label>
              Tipo de sangre
              <select
                value={formulario.tipoSangre}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('tipoSangre', e.target.value)
                }
              >
                <option value="">Seleccionar</option>
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

            <label className="profile-field-full">
              Dirección
              <input
                type="text"
                value={formulario.direccion}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarCampo('direccion', e.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="profile-form-card">
          <div className="profile-section-title">
            <h2>Información clínica</h2>
            <p>
              Estos datos ayudan al odontólogo a brindarte una atención
              más segura.
            </p>
          </div>

          <div className="profile-form-grid">
            <label>
              Alergias
              <textarea
                value={formulario.alergias}
                disabled={!modoEdicion}
                placeholder="Ej.: Penicilina, látex"
                onChange={(e) =>
                  actualizarCampo('alergias', e.target.value)
                }
              />
              <small>Sepáralas mediante comas.</small>
            </label>

            <label>
              Condiciones crónicas
              <textarea
                value={formulario.condicionesCronicas}
                disabled={!modoEdicion}
                placeholder="Ej.: Diabetes, hipertensión"
                onChange={(e) =>
                  actualizarCampo(
                    'condicionesCronicas',
                    e.target.value
                  )
                }
              />
              <small>Sepáralas mediante comas.</small>
            </label>
          </div>
        </section>

        <section className="profile-form-card">
          <div className="profile-section-title">
            <h2>Contacto de emergencia</h2>
            <p>Persona a quien contactar en caso necesario</p>
          </div>

          <div className="profile-form-grid">
            <label>
              Nombre completo
              <input
                type="text"
                value={formulario.contactoEmergencia.nombre}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarContacto('nombre', e.target.value)
                }
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                value={formulario.contactoEmergencia.telefono}
                disabled={!modoEdicion}
                onChange={(e) =>
                  actualizarContacto('telefono', e.target.value)
                }
              />
            </label>

            <label>
              Parentesco
              <input
                type="text"
                value={formulario.contactoEmergencia.parentesco}
                disabled={!modoEdicion}
                placeholder="Ej.: Padre, hermana, cónyuge"
                onChange={(e) =>
                  actualizarContacto('parentesco', e.target.value)
                }
              />
            </label>
          </div>
        </section>

        {modoEdicion && (
          <div className="profile-form-actions">
            <button
              type="button"
              className="profile-cancel-button"
              onClick={cancelarEdicion}
            >
              Cancelar
            </button>

            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </form>

      <section className="profile-form-card">
        <div className="profile-security-row">
          <div>
            <h2>Seguridad</h2>
            <p>Protege el acceso a tu cuenta</p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
          >
            Cambiar contraseña
          </button>
        </div>

        {mostrarPassword && (
          <form
            className="password-form"
            onSubmit={cambiarPassword}
          >
            <label>
              Contraseña actual
              <input
                type="password"
                value={password.actual}
                onChange={(e) =>
                  setPassword({
                    ...password,
                    actual: e.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Nueva contraseña
              <input
                type="password"
                minLength="8"
                value={password.nueva}
                onChange={(e) =>
                  setPassword({
                    ...password,
                    nueva: e.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Confirmar nueva contraseña
              <input
                type="password"
                minLength="8"
                value={password.confirmar}
                onChange={(e) =>
                  setPassword({
                    ...password,
                    confirmar: e.target.value
                  })
                }
                required
              />
            </label>

            <button type="submit">
              Actualizar contraseña
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default PerfilPaciente;
