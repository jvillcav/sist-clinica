import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import "../styles/public/login.css";
/* =====================================================
   CONFIGURACIÓN
===================================================== */
const RUTAS_POR_ROL = {
  administrador: "/admin/dashboard",
  odontologo: "/odontologo/dashboard",
  recepcionista: "/recepcionista/inicio",
  paciente: "/paciente/inicio",
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SEGURA_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,30}$/;
/* =====================================================
   ICONOS
===================================================== */
const IconoPaciente = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
const IconoOdontologo = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3c-3.8-2.2-7.4.7-7.4 4.9 0 3.1 1.8 5.1 2.4 8.5.3 1.8.7 4.6 2.4 4.6 1.4 0 1.4-4.4 2.6-4.4s1.2 4.4 2.6 4.4c1.7 0 2.1-2.8 2.4-4.6.6-3.4 2.4-5.4 2.4-8.5C19.4 3.7 15.8.8 12 3Z" />
  </svg>
);
const IconoRecepcionista = () => (
  <svg viewBox="0 0 24 24">
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4" />
  </svg>
);
const IconoAdministrador = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
  </svg>
);
const IconoCorreo = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
const IconoCandado = () => (
  <svg viewBox="0 0 24 24">
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
  </svg>
);
const IconoOjo = () => (
  <svg viewBox="0 0 24 24">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);
const IconoOjoCerrado = () => (
  <svg viewBox="0 0 24 24">
    <path d="m3 3 18 18" />
    <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a10 10 0 0 0 3.8-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);
const IconoEscudo = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" />
    <path d="m9 12 2 2 4-5" />
  </svg>
);
const IconoCerrar = () => (
  <svg viewBox="0 0 24 24">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
const IconoEnviar = () => (
  <svg viewBox="0 0 24 24">
    <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    <path d="M22 2 11 13" />
  </svg>
);
/* =====================================================
   ROLES
===================================================== */
const ROLES = {
  paciente: {
    titulo: "Paciente",
    Icono: IconoPaciente,
  },
  odontologo: {
    titulo: "Odontólogo",
    Icono: IconoOdontologo,
  },
  recepcionista: {
    titulo: "Recepcionista",
    Icono: IconoRecepcionista,
  },
  administrador: {
    titulo: "Administrador",
    Icono: IconoAdministrador,
  },
};
/* =====================================================
   COMPONENTE
===================================================== */
const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get("resetToken");
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mayusculasActivas, setMayusculasActivas] = useState(false);
  const [modalRecuperacion, setModalRecuperacion] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [enlaceDesarrollo, setEnlaceDesarrollo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [camposTocados, setCamposTocados] = useState({
    email: false,
    password: false,
  });
  const [estadoIngreso, setEstadoIngreso] = useState("idle");
  /* ===================================================
     RECORDAR CORREO Y ROL
  =================================================== */
  useEffect(() => {
    try {
      const datosGuardados = JSON.parse(
        localStorage.getItem("loginRecordado") || "null",
      );
      if (datosGuardados) {
        setEmail(datosGuardados.email || "");
        setRolSeleccionado(datosGuardados.rol || "");
        setRecordarme(true);
      }
    } catch {
      localStorage.removeItem("loginRecordado");
    }
  }, []);
  useEffect(() => {
    setError("");
    setMensaje("");
  }, [resetToken]);
  useEffect(() => {
    if (!modalRecuperacion) {
      return undefined;
    }
    const overflowOriginal = document.body.style.overflow;
    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape" && !cargando) {
        setModalRecuperacion(false);
        setEnlaceDesarrollo("");
        setError("");
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowOriginal;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [modalRecuperacion, cargando]);
  useEffect(() => {
    if (estadoIngreso !== "error") {
      return undefined;
    }
    const temporizador = window.setTimeout(() => {
      setEstadoIngreso("idle");
    }, 580);
    return () => window.clearTimeout(temporizador);
  }, [estadoIngreso]);
  /* ===================================================
     REQUISITOS DE CONTRASEÑA
  =================================================== */
  const requisitosPassword = useMemo(() => {
    return {
      longitud: nuevaPassword.length >= 8 && nuevaPassword.length <= 30,
      mayuscula: /[A-Z]/.test(nuevaPassword),
      minuscula: /[a-z]/.test(nuevaPassword),
      numero: /\d/.test(nuevaPassword),
      simbolo: /[^A-Za-z0-9]/.test(nuevaPassword),
      sinEspacios: !/\s/.test(nuevaPassword),
    };
  }, [nuevaPassword]);
  const erroresEnLinea = useMemo(() => {
    let errorEmail = "";
    let errorPassword = "";
    if (camposTocados.email && !email.trim()) {
      errorEmail = "El correo electrónico es obligatorio.";
    } else if (camposTocados.email && !EMAIL_REGEX.test(email.trim())) {
      errorEmail = "Escribe un correo electrónico válido.";
    }
    if (camposTocados.password && !password) {
      errorPassword = "La contraseña es obligatoria.";
    }
    return {
      email: errorEmail,
      password: errorPassword,
    };
  }, [camposTocados, email, password]);
  /* ===================================================
     LOGIN
  =================================================== */
  const seleccionarRol = (rol) => {
    setRolSeleccionado(rol);
    setError("");
    setMensaje("");
    setEstadoIngreso("idle");
  };
  const marcarCampo = (campo) => {
    setCamposTocados((estadoActual) => ({
      ...estadoActual,
      [campo]: true,
    }));
  };
  const validarLogin = () => {
    if (!rolSeleccionado) {
      return "Selecciona el rol con el que deseas ingresar.";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Ingresa un correo electrónico válido.";
    }
    if (!password) {
      return "Ingresa tu contraseña.";
    }
    if (password.length > 30) {
      return "La contraseña no puede superar los 30 caracteres.";
    }
    return "";
  };
  const iniciarSesion = async (evento) => {
    evento.preventDefault();
    setCamposTocados({
      email: true,
      password: true,
    });
    const validacion = validarLogin();
    if (validacion) {
      setError(validacion);
      setEstadoIngreso("error");
      return;
    }
    try {
      setCargando(true);
      setError("");
      setMensaje("");
      setEstadoIngreso("idle");
      const { data } = await api.post("/usuarios/login", {
        email: email.trim(),
        password,
        rol: rolSeleccionado,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      /*
       * Mantiene compatibilidad con componentes
       * que consultan el rol por separado.
       */
      localStorage.setItem("rol", data.usuario.rol);
      if (recordarme) {
        localStorage.setItem(
          "loginRecordado",
          JSON.stringify({
            email: email.trim(),
            rol: rolSeleccionado,
          }),
        );
      } else {
        localStorage.removeItem("loginRecordado");
      }
      const ruta = RUTAS_POR_ROL[data.usuario.rol];
      if (!ruta) {
        throw new Error("El usuario no tiene una ruta de acceso válida.");
      }
      setMensaje(
        `Acceso correcto. Bienvenido, ${data.usuario.nombre || ROLES[data.usuario.rol].titulo}.`,
      );
      setEstadoIngreso("success");
      await new Promise((resolver) => window.setTimeout(resolver, 650));
      navigate(ruta, {
        replace: true,
      });
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          errorPeticion.message ||
          "No se pudo iniciar sesión.",
      );
      setEstadoIngreso("error");
    } finally {
      setCargando(false);
    }
  };
  /* ===================================================
     RECUPERACIÓN
  =================================================== */
  const abrirRecuperacion = () => {
    setCorreoRecuperacion(email);
    setEnlaceDesarrollo("");
    setModalRecuperacion(true);
    setError("");
    setMensaje("");
  };
  const cerrarRecuperacion = () => {
    if (cargando) {
      return;
    }
    setModalRecuperacion(false);
    setEnlaceDesarrollo("");
    setError("");
  };
  const solicitarRecuperacion = async (evento) => {
    evento.preventDefault();
    if (!EMAIL_REGEX.test(correoRecuperacion.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    try {
      setCargando(true);
      setError("");
      setMensaje("");
      setEnlaceDesarrollo("");
      const { data } = await api.post("/usuarios/solicitar-recuperacion", {
        email: correoRecuperacion.trim(),
      });
      setMensaje(data.mensaje);
      if (data.enlaceDesarrollo) {
        setEnlaceDesarrollo(data.enlaceDesarrollo);
      } else {
        setModalRecuperacion(false);
      }
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          "No se pudo procesar la solicitud.",
      );
    } finally {
      setCargando(false);
    }
  };
  /* ===================================================
     RESTABLECIMIENTO
  =================================================== */
  const restablecerPassword = async (evento) => {
    evento.preventDefault();
    if (!PASSWORD_SEGURA_REGEX.test(nuevaPassword)) {
      setError("La nueva contraseña no cumple los requisitos de seguridad.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    try {
      setCargando(true);
      setError("");
      setMensaje("");
      const { data } = await api.post("/usuarios/restablecer-password", {
        token: resetToken,
        nuevaPassword,
      });
      setNuevaPassword("");
      setConfirmarPassword("");
      setSearchParams(
        {},
        {
          replace: true,
        },
      );
      setMensaje(data.mensaje);
    } catch (errorPeticion) {
      setError(
        errorPeticion.response?.data?.mensaje ||
          "No se pudo restablecer la contraseña.",
      );
    } finally {
      setCargando(false);
    }
  };
  /* ===================================================
     VISTA DE NUEVA CONTRASEÑA
  =================================================== */
  if (resetToken) {
    return (
      <main className="login-page login-reset-page">
        <section className="reset-card">
          <div className="reset-icon">
            <IconoEscudo />
          </div>
          <span className="login-eyebrow">Seguridad de la cuenta</span>
          <h1>Crea una nueva contraseña</h1>
          <p>
            Elige una contraseña segura para recuperar el acceso a tu cuenta.
          </p>
          {error && (
            <div className="login-alert error" role="alert">
              {error}
            </div>
          )}
          {mensaje && (
            <div className="login-alert success" role="status">
              {mensaje}
            </div>
          )}
          <form className="login-form" onSubmit={restablecerPassword}>
            <label htmlFor="nueva-password">Nueva contraseña</label>
            <div className="login-input-group">
              <IconoCandado />
              <input
                id="nueva-password"
                type={mostrarNuevaPassword ? "text" : "password"}
                value={nuevaPassword}
                minLength={8}
                maxLength={30}
                autoComplete="new-password"
                placeholder="Crea una contraseña segura"
                onChange={(evento) => setNuevaPassword(evento.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setMostrarNuevaPassword((valor) => !valor)}
                aria-label={
                  mostrarNuevaPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {mostrarNuevaPassword ? <IconoOjoCerrado /> : <IconoOjo />}
              </button>
            </div>
            <label htmlFor="confirmar-password">Confirmar contraseña</label>
            <div className="login-input-group">
              <IconoCandado />
              <input
                id="confirmar-password"
                type={mostrarConfirmacion ? "text" : "password"}
                value={confirmarPassword}
                minLength={8}
                maxLength={30}
                autoComplete="new-password"
                placeholder="Repite la nueva contraseña"
                onChange={(evento) => setConfirmarPassword(evento.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setMostrarConfirmacion((valor) => !valor)}
                aria-label={
                  mostrarConfirmacion
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {mostrarConfirmacion ? <IconoOjoCerrado /> : <IconoOjo />}
              </button>
            </div>
            <div className="password-requirements">
              <p>La contraseña debe incluir:</p>
              <ul>
                <li className={requisitosPassword.longitud ? "valid" : ""}>
                  Entre 8 y 30 caracteres
                </li>
                <li className={requisitosPassword.mayuscula ? "valid" : ""}>
                  Una letra mayúscula
                </li>
                <li className={requisitosPassword.minuscula ? "valid" : ""}>
                  Una letra minúscula
                </li>
                <li className={requisitosPassword.numero ? "valid" : ""}>
                  Un número
                </li>
                <li className={requisitosPassword.simbolo ? "valid" : ""}>
                  Un símbolo
                </li>
                <li className={requisitosPassword.sinEspacios ? "valid" : ""}>
                  Sin espacios
                </li>
              </ul>
            </div>
            <button type="submit" className="login-submit" disabled={cargando}>
              {cargando
                ? "Actualizando contraseña..."
                : "Restablecer contraseña"}
            </button>
          </form>
        </section>
      </main>
    );
  }
  /* ===================================================
     VISTA DE LOGIN
  =================================================== */
  return (
    <main className="login-page">
      <header className="login-heading">
        <span className="login-eyebrow">Acceso seguro</span>
        <h1>Ingresa al sistema de la clínica</h1>
        <p>Selecciona tu rol e introduce tus credenciales personales.</p>
      </header>
      <section className="login-wrapper">
        <div className="login-panel roles-panel">
          <div className="login-panel-heading">
            <span>01</span>
            <div>
              <h2>Selecciona tu rol</h2>
              <p>
                El sistema comprobará que tus credenciales pertenezcan al perfil
                elegido.
              </p>
            </div>
          </div>
          <div className="roles-grid">
            {Object.entries(ROLES).map(([clave, rol]) => {
              const { Icono } = rol;
              const seleccionado = rolSeleccionado === clave;
              return (
                <button
                  key={clave}
                  type="button"
                  className={`role-card ${seleccionado ? "selected" : ""}`}
                  data-role={clave}
                  onClick={() => seleccionarRol(clave)}
                  aria-pressed={seleccionado}
                >
                  <span className="role-icon">
                    <Icono />
                  </span>
                  <strong>{rol.titulo}</strong>
                  <p>{rol.descripcion}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className={`login-panel credentials-panel ${
            estadoIngreso === "success" ? "is-success" : ""
          }`}
        >
          <div className="login-panel-heading">
            <span>02</span>
            <div>
              <h2>Ingresa tus credenciales</h2>
            </div>
          </div>
          {rolSeleccionado && (
            <div className="selected-role">
              <IconoEscudo />
              <div>
                <span>
                  Ingresar como <strong>{ROLES[rolSeleccionado].titulo}</strong>
                </span>
                <small>{ROLES[rolSeleccionado].descripcion}</small>
              </div>
            </div>
          )}
          {error && (
            <div className="login-alert error" role="alert">
              {error}
            </div>
          )}
          {mensaje && (
            <div className="login-alert success" role="status">
              {mensaje}
            </div>
          )}
          <form
            onSubmit={iniciarSesion}
            className={`login-form ${
              estadoIngreso === "error" ? "is-shaking" : ""
            }`}
            noValidate
          >
            <label htmlFor="login-email">Correo electrónico</label>
            <div
              className={`login-input-group ${
                erroresEnLinea.email ? "is-invalid" : ""
              }`}
            >
              <IconoCorreo />
              <input
                id="login-email"
                type="email"
                placeholder="nombre@correo.com"
                value={email}
                maxLength={150}
                autoComplete="email"
                aria-invalid={Boolean(erroresEnLinea.email)}
                aria-describedby={
                  erroresEnLinea.email ? "login-email-error" : undefined
                }
                onBlur={() => marcarCampo("email")}
                onChange={(evento) => {
                  setEmail(evento.target.value);
                  setError("");
                  setEstadoIngreso("idle");
                }}
                required
              />
            </div>
            {erroresEnLinea.email && (
              <small id="login-email-error" className="login-field-error">
                {erroresEnLinea.email}
              </small>
            )}
            <label htmlFor="login-password">Contraseña</label>
            <div
              className={`login-input-group ${
                erroresEnLinea.password ? "is-invalid" : ""
              }`}
            >
              <IconoCandado />
              <input
                id="login-password"
                type={mostrarPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                maxLength={30}
                autoComplete="current-password"
                aria-invalid={Boolean(erroresEnLinea.password)}
                aria-describedby={
                  erroresEnLinea.password ? "login-password-error" : undefined
                }
                onBlur={() => {
                  marcarCampo("password");
                  setMayusculasActivas(false);
                }}
                onChange={(evento) => {
                  setPassword(evento.target.value);
                  setError("");
                  setEstadoIngreso("idle");
                }}
                onKeyUp={(evento) =>
                  setMayusculasActivas(evento.getModifierState("CapsLock"))
                }
                onKeyDown={(evento) =>
                  setMayusculasActivas(evento.getModifierState("CapsLock"))
                }
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setMostrarPassword((valor) => !valor)}
                aria-label={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {mostrarPassword ? <IconoOjoCerrado /> : <IconoOjo />}
              </button>
            </div>
            {erroresEnLinea.password && (
              <small id="login-password-error" className="login-field-error">
                {erroresEnLinea.password}
              </small>
            )}
            {mayusculasActivas && (
              <small className="caps-warning">Bloq Mayús está activado.</small>
            )}
            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(evento) => setRecordarme(evento.target.checked)}
                />
                <span>Recordar</span>
              </label>
              <button
                type="button"
                className="forgot-button"
                onClick={abrirRecuperacion}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button
              type="submit"
              disabled={!rolSeleccionado || cargando}
              className={`login-submit ${
                estadoIngreso === "success" ? "is-success" : ""
              }`}
              aria-busy={cargando}
            >
              <span className="login-submit__content">
                {cargando && (
                  <span className="login-spinner" aria-hidden="true" />
                )}
                <span>
                  {estadoIngreso === "success"
                    ? "Acceso confirmado"
                    : cargando
                      ? "Verificando acceso..."
                      : "Iniciar sesión"}
                </span>
              </span>
            </button>
          </form>
          <div className="login-security-note">
            <IconoEscudo />
            <p>
              La clínica nunca solicitará tu contraseña por teléfono o correo
              electrónico.
            </p>
          </div>
        </div>
      </section>
      {/* MODAL DE RECUPERACIÓN */}
      {modalRecuperacion && (
        <div
          className="login-modal-overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarRecuperacion();
            }
          }}
        >
          <section
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-recuperacion"
          >
            <header>
              <div>
                <span className="login-eyebrow">Recuperación de acceso</span>
                <h2 id="titulo-recuperacion">Restablecer contraseña</h2>
                <p>Ingresa tu correo y recibirás un enlace temporal.</p>
              </div>
              <button
                type="button"
                onClick={cerrarRecuperacion}
                aria-label="Cerrar"
              >
                <IconoCerrar />
              </button>
            </header>
            <form onSubmit={solicitarRecuperacion}>
              <label htmlFor="correo-recuperacion">Correo electrónico</label>
              <div className="login-input-group">
                <IconoCorreo />
                <input
                  id="correo-recuperacion"
                  type="email"
                  value={correoRecuperacion}
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  onChange={(evento) =>
                    setCorreoRecuperacion(evento.target.value)
                  }
                  required
                />
              </div>
              {enlaceDesarrollo && (
                <a className="development-link" href={enlaceDesarrollo}>
                  Abrir enlace de recuperación de desarrollo
                </a>
              )}
              <footer>
                <button
                  type="button"
                  className="modal-secondary"
                  disabled={cargando}
                  onClick={cerrarRecuperacion}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-primary"
                  disabled={cargando}
                >
                  <IconoEnviar />
                  {cargando ? "Enviando..." : "Enviar enlace"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};
export default Login;