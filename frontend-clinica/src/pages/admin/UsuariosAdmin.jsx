import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { normalizarTexto } from '../../utils/texto';
import '../../styles/admin/usuariosAdmin.css';

/* =====================================================
   ICONOS
===================================================== */

const IconoUsuarios = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-4.5 3-7 7-7" />
    <circle cx="17" cy="10" r="3" />
    <path d="M14 21c0-3.5 2.3-5.5 5.5-5.5" />
  </svg>
);

const IconoAdministrador = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
    <path d="m9 12 2 2 4-5" />
  </svg>
);

const IconoOdontologo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 3c-2 0-4 2-4 5 0 4 2 6 3 10 .3 1.2 1 3 2.5 3 1.3 0 1.5-2 2.5-2s1.2 2 2.5 2c1.5 0 2.2-1.8 2.5-3 1-4 3-6 3-10 0-3-2-5-4-5-1.5 0-2.5 1-4 1s-2.5-1-4-1Z" />
  </svg>
);

const IconoRecepcion = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="7" r="4" />
    <path d="M5 21v-2c0-4 3-7 7-7s7 3 7 7v2" />
    <path d="M3 21h18" />
  </svg>
);

const IconoPaciente = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-5 3.5-8 8-8s8 3 8 8" />
  </svg>
);

const IconoInactivo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 8 8 8" />
  </svg>
);

const IconoBuscar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const IconoAgregar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconoEditar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
  </svg>
);

const IconoEstado = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v9" />
    <path d="M7 5a8 8 0 1 0 10 0" />
  </svg>
);

const IconoEliminar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8" />
    <path d="M6 7l1 14h10l1-14" />
  </svg>
);

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6.2 8A7 7 0 0 1 18 6l2 2" />
    <path d="M17.8 16A7 7 0 0 1 6 18l-2-2" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

/* =====================================================
   UTILIDADES
===================================================== */

const roles = [
  {
    valor: 'administrador',
    etiqueta: 'Administrador'
  },
  {
    valor: 'odontologo',
    etiqueta: 'Odontólogo'
  },
  {
    valor: 'recepcionista',
    etiqueta: 'Recepcionista'
  },
  {
    valor: 'paciente',
    etiqueta: 'Paciente'
  }
];

const formularioInicial = {
  nombre: '',
  email: '',
  ci: '',
  rol: 'recepcionista',
  estado: true
};

const obtenerUsuarioLocal = () => {
  try {
    return JSON.parse(
      localStorage.getItem('usuario')
    );
  } catch {
    return null;
  }
};

const obtenerIniciales = (nombre = '') => {
  const partes = String(nombre)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return 'US';

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`
    .toUpperCase();
};

const obtenerEtiquetaRol = (rol) => {
  return (
    roles.find((item) => item.valor === rol)
      ?.etiqueta || 'Sin rol'
  );
};

const formatearFechaHora = (fecha) => {
  if (!fecha) return 'Nunca ingresó';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return 'Sin registro';
  }

  return valor.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* =====================================================
   COMPONENTE
===================================================== */

const Usuarios = () => {
  const usuarioSesion = useMemo(
    () => obtenerUsuarioLocal(),
    []
  );

  const [usuarios, setUsuarios] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroRol, setFiltroRol] =
    useState('todos');

  const [filtroEstado, setFiltroEstado] =
    useState('todos');

  const [paginaActual, setPaginaActual] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(10);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [usuarioEditando, setUsuarioEditando] =
    useState(null);

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [usuarioProcesando, setUsuarioProcesando] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [mostrarNotificacion, setMostrarNotificacion] =
    useState(false);

  const temporizadorNotificacion = useRef(null);

  const [error, setError] =
    useState('');

  useEffect(() => {
    obtenerUsuarios();

    return () => {
      if (temporizadorNotificacion.current) {
        clearTimeout(temporizadorNotificacion.current);
      }
    };
  }, []);

  const obtenerUsuarios = async () => {
    try {
      setCargando(true);
      setError('');

      const { data } = await api.get(
        '/usuarios'
      );

      setUsuarios(
        Array.isArray(data) ? data : []
      );
    } catch (errorPeticion) {
      console.error(
        'Error al obtener usuarios:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudieron cargar los usuarios.'
      );
    } finally {
      setCargando(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        !texto ||
        normalizarTexto(
          `${usuario.nombre || ''} ${
            usuario.email || ''
          } ${usuario.ci || ''}`
        ).includes(texto);

      const coincideRol =
        filtroRol === 'todos' ||
        usuario.rol === filtroRol;

      const coincideEstado =
        filtroEstado === 'todos' ||
        (
          filtroEstado === 'activo' &&
          usuario.estado !== false
        ) ||
        (
          filtroEstado === 'inactivo' &&
          usuario.estado === false
        );

      return (
        coincideBusqueda &&
        coincideRol &&
        coincideEstado
      );
    });
  }, [
    usuarios,
    busqueda,
    filtroRol,
    filtroEstado
  ]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRol, filtroEstado]);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * tamanoPagina;
    return usuariosFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [usuariosFiltrados, paginaActual, tamanoPagina]);

  const resumen = useMemo(() => {
    return {
      total: usuarios.length,

      administradores:
        usuarios.filter(
          (usuario) =>
            usuario.rol === 'administrador'
        ).length,

      odontologos:
        usuarios.filter(
          (usuario) =>
            usuario.rol === 'odontologo'
        ).length,

      recepcionistas:
        usuarios.filter(
          (usuario) =>
            usuario.rol === 'recepcionista'
        ).length,

      pacientes:
        usuarios.filter(
          (usuario) =>
            usuario.rol === 'paciente'
        ).length,

      inactivos:
        usuarios.filter(
          (usuario) =>
            usuario.estado === false
        ).length
    };
  }, [usuarios]);

  const limpiarMensajes = () => {
    setMensaje('');
    setMostrarNotificacion(false);
    setError('');

    if (temporizadorNotificacion.current) {
      clearTimeout(temporizadorNotificacion.current);
    }
  };

  const mostrarMensajeExito = (texto) => {
    setMensaje(texto);
    setMostrarNotificacion(true);

    if (temporizadorNotificacion.current) {
      clearTimeout(temporizadorNotificacion.current);
    }

    temporizadorNotificacion.current = setTimeout(() => {
      setMostrarNotificacion(false);
    }, 2800);
  };

  const abrirNuevoUsuario = () => {
    limpiarMensajes();
    setUsuarioEditando(null);
    setFormulario(formularioInicial);
    setMostrarFormulario(true);
  };

  const abrirEditarUsuario = (usuario) => {
    limpiarMensajes();

    setUsuarioEditando(usuario);

    setFormulario({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      ci: usuario.ci || '',
      rol:
        usuario.rol || 'recepcionista',
      estado:
        usuario.estado !== false
    });

    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setMostrarFormulario(false);
    setUsuarioEditando(null);
    setFormulario(formularioInicial);
  };

  const cambiarFormulario = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();

    limpiarMensajes();

    if (!formulario.nombre.trim()) {
      setError(
        'El nombre completo es obligatorio.'
      );
      return;
    }

    if (!formulario.email.trim()) {
      setError(
        'El correo electrónico es obligatorio.'
      );
      return;
    }

    if (!formulario.ci.trim()) {
      setError(
        'El carnet de identidad es obligatorio.'
      );
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim(),
        ci: formulario.ci.trim(),
        rol: formulario.rol,
        estado: formulario.estado
      };

      let respuesta;

      if (usuarioEditando) {
        respuesta = await api.put(
          `/usuarios/${usuarioEditando._id}`,
          payload
        );
      } else {
        respuesta = await api.post(
          '/usuarios/registro',
          payload
        );
      }

      mostrarMensajeExito(
        respuesta.data?.mensaje ||
          (
            usuarioEditando
              ? 'Usuario actualizado correctamente.'
              : 'Usuario registrado correctamente.'
          )
      );

      cerrarFormulario();
      await obtenerUsuarios();
    } catch (errorPeticion) {
      console.error(
        'Error al guardar usuario:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo guardar el usuario.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoUsuario = async (
    usuario
  ) => {
    limpiarMensajes();

    const nuevoEstado =
      usuario.estado === false;

    const accion = nuevoEstado
      ? 'activar'
      : 'desactivar';

    const confirmar = window.confirm(
      `¿Confirmas que deseas ${accion} la cuenta de ${usuario.nombre}?`
    );

    if (!confirmar) return;

    try {
      setUsuarioProcesando(usuario._id);

      const { data } = await api.put(
        `/usuarios/${usuario._id}`,
        {
          estado: nuevoEstado
        }
      );

      mostrarMensajeExito(
        data?.mensaje ||
          `Usuario ${
            nuevoEstado
              ? 'activado'
              : 'desactivado'
          } correctamente.`
      );

      await obtenerUsuarios();
    } catch (errorPeticion) {
      console.error(
        'Error al cambiar estado:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo cambiar el estado del usuario.'
      );
    } finally {
      setUsuarioProcesando('');
    }
  };

  const eliminarUsuario = async (
    usuario
  ) => {
    limpiarMensajes();

    const confirmar = window.confirm(
      `Esta acción eliminará definitivamente a ${usuario.nombre}. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    try {
      setUsuarioProcesando(usuario._id);

      const { data } = await api.delete(
        `/usuarios/${usuario._id}`
      );

      mostrarMensajeExito(
        data?.mensaje ||
          'Usuario eliminado correctamente.'
      );

      await obtenerUsuarios();
    } catch (errorPeticion) {
      console.error(
        'Error al eliminar usuario:',
        errorPeticion
      );

      setError(
        errorPeticion.response?.data?.mensaje ||
          'No se pudo eliminar el usuario.'
      );
    } finally {
      setUsuarioProcesando('');
    }
  };

  const esUsuarioSesion = (usuario) => {
    return (
      String(usuario._id) ===
      String(usuarioSesion?.id)
    );
  };

  if (cargando) {
    return (
      <section className="admin-users-loading">
        <div className="admin-users-spinner" />

        <h2>Cargando usuarios</h2>

        <p>
          Consultando cuentas, roles y estados.
        </p>
      </section>
    );
  }

  return (
    <main className="admin-users-page">
      <header className="admin-users-header">
        <div>
          <span className="admin-users-eyebrow">
            Administración de accesos
          </span>

          <h1>Usuarios</h1>

          <p>
            Gestiona las cuentas, roles,
            estados y accesos al sistema.
          </p>
        </div>

        <div className="admin-users-header-actions">
          <button
            type="button"
            className="admin-users-refresh"
            onClick={obtenerUsuarios}
          >
            <IconoActualizar />
            Actualizar
          </button>

          <button
            type="button"
            className="admin-users-new"
            onClick={abrirNuevoUsuario}
          >
            <IconoAgregar />
            Nuevo usuario
          </button>
        </div>
      </header>

      {mostrarNotificacion && mensaje && (
        <div className="admin-users-message success toast-notice">
          <IconoCheck />
          <span>{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="admin-users-message error">
          <IconoAdvertencia />
          <span>{error}</span>
        </div>
      )}

      <section className="admin-users-summary">
        <article className="total">
          <div>
            <span>Total usuarios</span>
            <strong>{resumen.total}</strong>
          </div>

          <IconoUsuarios />
        </article>

        <article className="administrators">
          <div>
            <span>Administradores</span>
            <strong>
              {resumen.administradores}
            </strong>
          </div>

          <IconoAdministrador />
        </article>

        <article className="dentists">
          <div>
            <span>Odontólogos</span>
            <strong>
              {resumen.odontologos}
            </strong>
          </div>

          <IconoOdontologo />
        </article>

        <article className="reception">
          <div>
            <span>Recepcionistas</span>
            <strong>
              {resumen.recepcionistas}
            </strong>
          </div>

          <IconoRecepcion />
        </article>

        <article className="patients">
          <div>
            <span>Pacientes</span>
            <strong>
              {resumen.pacientes}
            </strong>
          </div>

          <IconoPaciente />
        </article>

        <article className="inactive">
          <div>
            <span>Inactivos</span>
            <strong>
              {resumen.inactivos}
            </strong>
          </div>

          <IconoInactivo />
        </article>
      </section>

      <section className="admin-users-toolbar">
        <label className="admin-users-search">
          <span>Buscar usuario</span>

          <div>
            <IconoBuscar />

            <input
              type="search"
              value={busqueda}
              placeholder="Nombre, correo o carnet..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
            />
          </div>
        </label>

        <label>
          <span>Rol</span>

          <select
            value={filtroRol}
            onChange={(evento) =>
              setFiltroRol(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos los roles
            </option>

            {roles.map((rol) => (
              <option
                key={rol.valor}
                value={rol.valor}
              >
                {rol.etiqueta}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Estado</span>

          <select
            value={filtroEstado}
            onChange={(evento) =>
              setFiltroEstado(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="activo">
              Activos
            </option>

            <option value="inactivo">
              Inactivos
            </option>
          </select>
        </label>
      </section>

      <section className="admin-users-table-card">
        <header>
          <div>
            <h2>Listado de usuarios</h2>

            <p>
              {usuariosFiltrados.length}{' '}
              {usuariosFiltrados.length === 1
                ? 'usuario encontrado'
                : 'usuarios encontrados'}
            </p>
          </div>
        </header>

        {usuariosFiltrados.length > 0 ? (
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>CI</th>
                  <th>Rol</th>
                  <th>Último acceso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuariosPaginados.map(
                  (usuario) => {
                    const procesando =
                      usuarioProcesando ===
                      usuario._id;

                    const cuentaPropia =
                      esUsuarioSesion(usuario);

                    return (
                      <tr key={usuario._id}>
                        <td>
                          <div className="admin-user-identity">
                            <span>
                              {obtenerIniciales(
                                usuario.nombre
                              )}
                            </span>

                            <div>
                              <strong>
                                {usuario.nombre}
                              </strong>

                              <small>
                                {usuario.email}
                              </small>

                              {cuentaPropia && (
                                <em>
                                  Tu cuenta
                                </em>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong className="admin-user-ci">
                            {usuario.ci ||
                              'Sin registro'}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`admin-user-role ${usuario.rol}`}
                          >
                            {obtenerEtiquetaRol(
                              usuario.rol
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="admin-user-last-access">
                            {formatearFechaHora(
                              usuario.ultimoAcceso
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-user-status ${
                              usuario.estado ===
                              false
                                ? 'inactive'
                                : 'active'
                            }`}
                          >
                            {usuario.estado ===
                            false
                              ? 'Inactivo'
                              : 'Activo'}
                          </span>
                        </td>

                        <td>
                          <div className="admin-user-actions">
                            <button
                              type="button"
                              title="Editar usuario"
                              onClick={() =>
                                abrirEditarUsuario(
                                  usuario
                                )
                              }
                              disabled={procesando}
                            >
                              <IconoEditar />
                            </button>

                            <button
                              type="button"
                              className={
                                usuario.estado ===
                                false
                                  ? 'activate'
                                  : 'deactivate'
                              }
                              title={
                                usuario.estado ===
                                false
                                  ? 'Activar usuario'
                                  : 'Desactivar usuario'
                              }
                              onClick={() =>
                                cambiarEstadoUsuario(
                                  usuario
                                )
                              }
                              disabled={
                                procesando ||
                                cuentaPropia
                              }
                            >
                              <IconoEstado />
                            </button>

                            <button
                              type="button"
                              className="delete"
                              title="Eliminar usuario"
                              onClick={() =>
                                eliminarUsuario(
                                  usuario
                                )
                              }
                              disabled={
                                procesando ||
                                cuentaPropia
                              }
                            >
                              <IconoEliminar />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-users-empty">
            <div>
              <IconoUsuarios />
            </div>

            <h3>
              No se encontraron usuarios
            </h3>

            <p>
              No existen cuentas que coincidan
              con los filtros seleccionados.
            </p>

            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setFiltroRol('todos');
                setFiltroEstado('todos');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
        <Pagination
          currentPage={paginaActual}
          pageSize={tamanoPagina}
          totalItems={usuariosFiltrados.length}
          onPageChange={setPaginaActual}
          onPageSizeChange={(size) => {
            setTamanoPagina(size);
            setPaginaActual(1);
          }}
          label="usuarios"
        />
      </section>

      {mostrarFormulario && (
        <div
          className="admin-user-modal-overlay"
          onMouseDown={(evento) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              cerrarFormulario();
            }
          }}
        >
          <section className="admin-user-modal">
            <header>
              <div>
                <span>
                  {usuarioEditando
                    ? 'Edición de cuenta'
                    : 'Nueva cuenta'}
                </span>

                <h2>
                  {usuarioEditando
                    ? 'Editar usuario'
                    : 'Registrar usuario'}
                </h2>

                <p>
                  {usuarioEditando
                    ? 'Actualiza la información, rol y estado de la cuenta.'
                    : 'La contraseña inicial será el carnet de identidad.'}
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar formulario"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                <IconoCerrar />
              </button>
            </header>

            <form onSubmit={guardarUsuario}>
              <label className="full">
                <span>Nombre completo *</span>

                <input
                  type="text"
                  value={formulario.nombre}
                  placeholder="Ejemplo: Pablo Maldonado"
                  onChange={(evento) =>
                    cambiarFormulario(
                      'nombre',
                      evento.target.value
                    )
                  }
                  required
                />
              </label>

              <label className="full">
                <span>Correo electrónico *</span>

                <input
                  type="email"
                  value={formulario.email}
                  placeholder="usuario@correo.com"
                  onChange={(evento) =>
                    cambiarFormulario(
                      'email',
                      evento.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Carnet de identidad *
                </span>

                <input
                  type="text"
                  value={formulario.ci}
                  placeholder="Número de CI"
                  onChange={(evento) =>
                    cambiarFormulario(
                      'ci',
                      evento.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Rol *</span>

                <select
                  value={formulario.rol}
                  onChange={(evento) =>
                    cambiarFormulario(
                      'rol',
                      evento.target.value
                    )
                  }
                >
                  {roles.map((rol) => (
                    <option
                      key={rol.valor}
                      value={rol.valor}
                    >
                      {rol.etiqueta}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full">
                <span>Estado de la cuenta</span>

                <select
                  value={String(
                    formulario.estado
                  )}
                  onChange={(evento) =>
                    cambiarFormulario(
                      'estado',
                      evento.target.value ===
                        'true'
                    )
                  }
                >
                  <option value="true">
                    Activo
                  </option>

                  <option value="false">
                    Inactivo
                  </option>
                </select>
              </label>

              {!usuarioEditando && (
                <div className="admin-user-password-note">
                  <IconoAdvertencia />

                  <p>
                    El usuario podrá iniciar sesión
                    utilizando su carnet de identidad
                    como contraseña inicial.
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="admin-users-message error form-feedback"
                  role="alert"
                >
                  <IconoAdvertencia />
                  <span>{error}</span>
                </div>
              )}

              <footer>
                <button
                  type="button"
                  className="cancel"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="save"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : usuarioEditando
                      ? 'Actualizar usuario'
                      : 'Registrar usuario'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};

export default Usuarios;