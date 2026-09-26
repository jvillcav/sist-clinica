import bcrypt from 'bcryptjs';

import Paciente from '../models/Paciente.js';
import Usuario from '../models/Usuario.js';
import Cita from '../models/Cita.js';
import Expediente from '../models/Expediente.js';
import { paginarConsulta } from '../utils/paginacion.js';

/* =====================================================
   UTILIDADES
===================================================== */

const normalizarCorreo = (correo = '') => {
  return String(correo)
    .trim()
    .toLowerCase();
};

const normalizarTexto = (texto = '') => {
  return String(texto).trim();
};

const normalizarLista = (lista) => {
  if (Array.isArray(lista)) {
    return lista
      .map((item) =>
        String(item).trim()
      )
      .filter(Boolean);
  }

  if (typeof lista === 'string') {
    return lista
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const obtenerDatosPacientePermitidos = (
  cuerpo
) => {
  const {
    nombre,
    apellido,
    ci,
    telefono,
    direccion,
    email,
    fechaNacimiento,
    sexo,
    tipoSangre,
    alergias,
    condicionesCronicas,
    contactoEmergencia,
    estado
  } = cuerpo;

  const datos = {};

  if (nombre !== undefined) {
    datos.nombre =
      normalizarTexto(nombre);
  }

  if (apellido !== undefined) {
    datos.apellido =
      normalizarTexto(apellido);
  }

  if (ci !== undefined) {
    datos.ci =
      normalizarTexto(ci);
  }

  if (telefono !== undefined) {
    datos.telefono =
      normalizarTexto(telefono);
  }

  if (direccion !== undefined) {
    datos.direccion =
      normalizarTexto(direccion);
  }

  if (email !== undefined) {
    datos.email =
      normalizarCorreo(email);
  }

  if (fechaNacimiento !== undefined) {
    datos.fechaNacimiento =
      fechaNacimiento || null;
  }

  if (sexo !== undefined) {
    datos.sexo = sexo || '';
  }

  if (tipoSangre !== undefined) {
    datos.tipoSangre =
      tipoSangre || '';
  }

  if (alergias !== undefined) {
    datos.alergias =
      normalizarLista(alergias);
  }

  if (
    condicionesCronicas !== undefined
  ) {
    datos.condicionesCronicas =
      normalizarLista(
        condicionesCronicas
      );
  }

  if (contactoEmergencia !== undefined) {
    datos.contactoEmergencia = {
      nombre: normalizarTexto(
        contactoEmergencia?.nombre
      ),

      telefono: normalizarTexto(
        contactoEmergencia?.telefono
      ),

      parentesco: normalizarTexto(
        contactoEmergencia?.parentesco
      )
    };
  }

  if (typeof estado === 'boolean') {
    datos.estado = estado;
  }

  return datos;
};

/* =====================================================
   CREAR PACIENTE
===================================================== */

export const crearPaciente = async (
  req,
  res
) => {
  let usuarioCreado = null;
  let pacienteCreado = null;

  try {
    const {
      nombre,
      apellido,
      ci,
      email,
      crearAccesoPortal = false
    } = req.body;

    if (
      !nombre?.trim() ||
      !apellido?.trim() ||
      !ci?.trim()
    ) {
      return res.status(400).json({
        mensaje:
          'Nombre, apellido y carnet de identidad son obligatorios.'
      });
    }

    const ciNormalizado =
      normalizarTexto(ci);

    const correoNormalizado =
      normalizarCorreo(email);

    const pacienteExistente =
      await Paciente.findOne({
        ci: ciNormalizado
      });

    if (pacienteExistente) {
      return res.status(400).json({
        mensaje:
          'Ya existe un paciente registrado con ese carnet de identidad.'
      });
    }

    /*
     * El correo puede ser un dato de contacto sin
     * necesidad de crear una cuenta de acceso.
     */
    if (
      crearAccesoPortal === true &&
      !correoNormalizado
    ) {
      return res.status(400).json({
        mensaje:
          'Debes registrar un correo para crear el acceso al portal.'
      });
    }

    if (crearAccesoPortal === true) {
      const usuarioExistente =
        await Usuario.findOne({
          email: correoNormalizado
        });

      if (usuarioExistente) {
        return res.status(400).json({
          mensaje:
            'El correo ya pertenece a una cuenta de usuario.'
        });
      }
    }

    const datosPaciente =
      obtenerDatosPacientePermitidos(
        req.body
      );

    /*
     * Primero se crea la ficha del paciente.
     * La cuenta del portal se crea después.
     */
    pacienteCreado =
      await Paciente.create({
        ...datosPaciente,
        nombre:
          normalizarTexto(nombre),
        apellido:
          normalizarTexto(apellido),
        ci: ciNormalizado,
        email: correoNormalizado,
        estado:
          typeof req.body.estado ===
          'boolean'
            ? req.body.estado
            : true,
        usuarioId: null
      });

    if (crearAccesoPortal === true) {
      const passwordEncriptado =
        await bcrypt.hash(
          ciNormalizado,
          10
        );

      usuarioCreado =
        await Usuario.create({
          nombre:
            `${nombre.trim()} ${apellido.trim()}`,
          email: correoNormalizado,
          ci: ciNormalizado,
          password:
            passwordEncriptado,
          rol: 'paciente',
          estado:
            pacienteCreado.estado,
          pacienteId:
            pacienteCreado._id
        });

      pacienteCreado.usuarioId =
        usuarioCreado._id;

      await pacienteCreado.save();
    }

    const pacienteRespuesta =
      await Paciente.findById(
        pacienteCreado._id
      )
        .populate(
          'usuarioId',
          'nombre email rol estado ultimoAcceso'
        );

    return res.status(201).json({
      mensaje:
        crearAccesoPortal === true
          ? 'Paciente y acceso al portal registrados correctamente.'
          : 'Paciente registrado correctamente.',

      paciente: pacienteRespuesta,

      accesoPortalCreado:
        crearAccesoPortal === true
    });
  } catch (error) {
    console.error(
      'Error al crear paciente:',
      error
    );

    /*
     * Si la creación quedó incompleta,
     * intentamos revertir los registros.
     */
    if (
      usuarioCreado?._id &&
      !pacienteCreado?.usuarioId
    ) {
      await Usuario.findByIdAndDelete(
        usuarioCreado._id
      ).catch(() => {});
    }

    return res.status(500).json({
      mensaje:
        'No se pudo registrar el paciente.',
    });
  }
};

/* =====================================================
   OBTENER TODOS LOS PACIENTES
===================================================== */

export const obtenerPacientes = async (
  req,
  res
) => {
  try {
    const sinPaginar =
      normalizarTexto(
        req.query.sinPaginar
      ).toLowerCase() === 'true';

    const construirConsulta = () =>
      Paciente.find()
        .populate(
          'usuarioId',
          'nombre email rol estado ultimoAcceso'
        )
        .sort({ createdAt: -1 });

    /*
     * La vista administrativa aplica búsqueda y filtros
     * en el navegador. Cuando solicita sinPaginar=true,
     * devolvemos el catálogo completo para que el total
     * y los indicadores no se limiten a la primera página.
     */
    if (sinPaginar) {
      const pacientes =
        await construirConsulta().lean();

      return res.json(pacientes);
    }

    const { datos: pacientes } = await paginarConsulta({
      req,
      res,
      consulta: construirConsulta(),
      contar: Paciente.countDocuments()
    });

    return res.json(pacientes);
  } catch (error) {
    console.error(
      'Error al obtener pacientes:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudieron obtener los pacientes.',
    });
  }
};

/* =====================================================
   OBTENER UN PACIENTE
===================================================== */

export const obtenerPaciente = async (
  req,
  res
) => {
  try {
    const paciente =
      await Paciente.findById(
        req.params.id
      ).populate(
        'usuarioId',
        'nombre email rol estado ultimoAcceso'
      );

    if (!paciente) {
      return res.status(404).json({
        mensaje:
          'Paciente no encontrado.'
      });
    }

    const [
      totalCitas,
      totalExpedientes,
      ultimaCita,
      ultimaAtencion
    ] = await Promise.all([
      Cita.countDocuments({
        pacienteId: paciente._id
      }),

      Expediente.countDocuments({
        pacienteId: paciente._id
      }),

      Cita.findOne({
        pacienteId: paciente._id
      })
        .sort({
          fecha: -1,
          hora: -1
        }),

      Expediente.findOne({
        pacienteId: paciente._id
      })
        .sort({
          fechaAtencion: -1,
          createdAt: -1
        })
    ]);

    return res.json({
      paciente,

      estadisticas: {
        totalCitas,
        totalExpedientes,
        ultimaCita,
        ultimaAtencion
      }
    });
  } catch (error) {
    console.error(
      'Error al obtener paciente:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudo obtener el paciente.',
    });
  }
};

/* =====================================================
   ACTUALIZAR PACIENTE
===================================================== */

export const actualizarPaciente = async (
  req,
  res
) => {
  try {
    const paciente =
      await Paciente.findById(
        req.params.id
      );

    if (!paciente) {
      return res.status(404).json({
        mensaje:
          'Paciente no encontrado.'
      });
    }

    const datosActualizados =
      obtenerDatosPacientePermitidos(
        req.body
      );

    if (datosActualizados.ci) {
      const ciOcupado =
        await Paciente.findOne({
          ci: datosActualizados.ci,
          _id: {
            $ne: paciente._id
          }
        });

      if (ciOcupado) {
        return res.status(400).json({
          mensaje:
            'El carnet de identidad ya pertenece a otro paciente.'
        });
      }
    }

    if (
      paciente.usuarioId &&
      datosActualizados.email
    ) {
      const correoOcupado =
        await Usuario.findOne({
          email:
            datosActualizados.email,
          _id: {
            $ne: paciente.usuarioId
          }
        });

      if (correoOcupado) {
        return res.status(400).json({
          mensaje:
            'El correo ya pertenece a otra cuenta de usuario.'
        });
      }
    }

    Object.assign(
      paciente,
      datosActualizados
    );

    await paciente.save();

    /*
     * Si el paciente tiene acceso al portal,
     * sincronizamos nombre, correo, CI y estado.
     */
    if (paciente.usuarioId) {
      const usuario =
        await Usuario.findById(
          paciente.usuarioId
        );

      if (usuario) {
        usuario.nombre =
          `${paciente.nombre} ${paciente.apellido}`.trim();

        usuario.email =
          paciente.email;

        usuario.ci =
          paciente.ci;

        usuario.estado =
          paciente.estado;

        usuario.pacienteId =
          paciente._id;

        await usuario.save();
      }
    }

    const pacienteActualizado =
      await Paciente.findById(
        paciente._id
      ).populate(
        'usuarioId',
        'nombre email rol estado ultimoAcceso'
      );

    return res.json({
      mensaje:
        'Paciente actualizado correctamente.',
      paciente: pacienteActualizado
    });
  } catch (error) {
    console.error(
      'Error al actualizar paciente:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudo actualizar el paciente.',
    });
  }
};

/* =====================================================
   CREAR ACCESO AL PORTAL
===================================================== */

export const crearAccesoPaciente = async (
  req,
  res
) => {
  try {
    const paciente =
      await Paciente.findById(
        req.params.id
      );

    if (!paciente) {
      return res.status(404).json({
        mensaje:
          'Paciente no encontrado.'
      });
    }

    if (paciente.usuarioId) {
      return res.status(400).json({
        mensaje:
          'El paciente ya tiene acceso al portal.'
      });
    }

    const correoNormalizado =
      normalizarCorreo(
        req.body.email ||
          paciente.email
      );

    if (!correoNormalizado) {
      return res.status(400).json({
        mensaje:
          'El paciente necesita un correo para crear su acceso.'
      });
    }

    const usuarioExistente =
      await Usuario.findOne({
        email: correoNormalizado
      });

    if (usuarioExistente) {
      return res.status(400).json({
        mensaje:
          'El correo ya pertenece a otra cuenta.'
      });
    }

    const passwordEncriptado =
      await bcrypt.hash(
        paciente.ci,
        10
      );

    const usuario =
      await Usuario.create({
        nombre:
          `${paciente.nombre} ${paciente.apellido}`,
        email: correoNormalizado,
        ci: paciente.ci,
        password:
          passwordEncriptado,
        rol: 'paciente',
        estado:
          paciente.estado,
        pacienteId:
          paciente._id
      });

    paciente.email =
      correoNormalizado;

    paciente.usuarioId =
      usuario._id;

    await paciente.save();

    return res.status(201).json({
      mensaje:
        'Acceso al portal creado correctamente.',

      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        estado: usuario.estado
      }
    });
  } catch (error) {
    console.error(
      'Error al crear acceso:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudo crear el acceso al portal.',
    });
  }
};

/* =====================================================
   ACTIVAR O DESACTIVAR ACCESO AL PORTAL
===================================================== */

export const cambiarEstadoAccesoPaciente =
  async (req, res) => {
    try {
      const paciente =
        await Paciente.findById(
          req.params.id
        );

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'Paciente no encontrado.'
        });
      }

      if (!paciente.usuarioId) {
        return res.status(400).json({
          mensaje:
            'El paciente no tiene una cuenta vinculada.'
        });
      }

      const { estado } = req.body;

      if (
        typeof estado !== 'boolean'
      ) {
        return res.status(400).json({
          mensaje:
            'Debes enviar un estado válido.'
        });
      }

      const usuario =
        await Usuario.findById(
          paciente.usuarioId
        );

      if (!usuario) {
        return res.status(404).json({
          mensaje:
            'La cuenta vinculada no fue encontrada.'
        });
      }

      usuario.estado = estado;
      await usuario.save();

      return res.json({
        mensaje: estado
          ? 'Acceso al portal activado correctamente.'
          : 'Acceso al portal desactivado correctamente.'
      });
    } catch (error) {
      console.error(
        'Error al cambiar acceso:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo cambiar el acceso al portal.',
      });
    }
  };

/* =====================================================
   ELIMINAR PACIENTE DE FORMA SEGURA
===================================================== */

export const eliminarPaciente = async (
  req,
  res
) => {
  try {
    const paciente =
      await Paciente.findById(
        req.params.id
      );

    if (!paciente) {
      return res.status(404).json({
        mensaje:
          'Paciente no encontrado.'
      });
    }

    const [
      totalCitas,
      totalExpedientes
    ] = await Promise.all([
      Cita.countDocuments({
        pacienteId: paciente._id
      }),

      Expediente.countDocuments({
        pacienteId: paciente._id
      })
    ]);

    if (
      totalCitas > 0 ||
      totalExpedientes > 0
    ) {
      return res.status(400).json({
        mensaje:
          'El paciente tiene citas o expedientes relacionados. Debes inactivarlo en lugar de eliminarlo.',

        relaciones: {
          citas: totalCitas,
          expedientes:
            totalExpedientes
        }
      });
    }

    if (paciente.usuarioId) {
      await Usuario.findByIdAndDelete(
        paciente.usuarioId
      );
    }

    await paciente.deleteOne();

    return res.json({
      mensaje:
        'Paciente eliminado correctamente.'
    });
  } catch (error) {
    console.error(
      'Error al eliminar paciente:',
      error
    );

    return res.status(500).json({
      mensaje:
        'No se pudo eliminar el paciente.',
    });
  }
};

/* =====================================================
   PERFIL DEL PACIENTE AUTENTICADO
===================================================== */

export const obtenerMiPerfilPaciente =
  async (req, res) => {
    try {
      let paciente =
        await Paciente.findOne({
          usuarioId: req.usuario.id
        });

      /*
       * Compatibilidad con cuentas antiguas:
       * también intenta buscar por pacienteId.
       */
      if (!paciente) {
        const usuario =
          await Usuario.findById(
            req.usuario.id
          );

        if (usuario?.pacienteId) {
          paciente =
            await Paciente.findById(
              usuario.pacienteId
            );
        }
      }

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'No existe una ficha de paciente vinculada a esta cuenta.'
        });
      }

      const expedientes =
        await Expediente.find({
          pacienteId: paciente._id
        }).sort({
          fechaAtencion: -1,
          createdAt: -1
        });

      return res.json({
        paciente,
        expedientes
      });
    } catch (error) {
      console.error(
        'Error al obtener perfil:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el perfil.',
      });
    }
  };

/* =====================================================
   ACTUALIZAR MI PERFIL
===================================================== */

export const actualizarMiPerfilPaciente =
  async (req, res) => {
    try {
      let paciente =
        await Paciente.findOne({
          usuarioId: req.usuario.id
        });

      if (!paciente) {
        const usuario =
          await Usuario.findById(
            req.usuario.id
          );

        if (usuario?.pacienteId) {
          paciente =
            await Paciente.findById(
              usuario.pacienteId
            );
        }
      }

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'Paciente no encontrado.'
        });
      }

      const datos =
        obtenerDatosPacientePermitidos(
          req.body
        );

      delete datos.ci;
      delete datos.estado;

      if (datos.email !== undefined) {
        const correoNormalizado =
          datos.email;

        const correoOcupado =
          await Usuario.findOne({
            email:
              correoNormalizado,
            _id: {
              $ne: req.usuario.id
            }
          });

        if (correoOcupado) {
          return res.status(400).json({
            mensaje:
              'El correo ya pertenece a otra cuenta.'
          });
        }

        paciente.email =
          correoNormalizado;

        await Usuario.findByIdAndUpdate(
          req.usuario.id,
          {
            email:
              correoNormalizado
          }
        );
      }

      delete datos.email;

      for (const [campo, valor] of Object.entries(datos)) {
        paciente[campo] = valor;
      }

      await paciente.save();

      return res.json({
        mensaje:
          'Perfil actualizado correctamente.',
        paciente
      });
    } catch (error) {
      console.error(
        'Error al actualizar perfil:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo actualizar el perfil.',
      });
    }
  };

/* =====================================================
   CAMBIAR CONTRASEÑA
===================================================== */

export const cambiarMiPasswordPaciente =
  async (req, res) => {
    try {
      const {
        passwordActual,
        passwordNueva
      } = req.body;

      if (
        !passwordActual ||
        !passwordNueva
      ) {
        return res.status(400).json({
          mensaje:
            'Debes completar ambas contraseñas.'
        });
      }

      if (
        String(passwordNueva).length < 8
      ) {
        return res.status(400).json({
          mensaje:
            'La nueva contraseña debe tener al menos 8 caracteres.'
        });
      }

      const usuario =
        await Usuario.findById(
          req.usuario.id
        );

      if (!usuario) {
        return res.status(404).json({
          mensaje:
            'Usuario no encontrado.'
        });
      }

      const passwordValida =
        await bcrypt.compare(
          passwordActual,
          usuario.password
        );

      if (!passwordValida) {
        return res.status(401).json({
          mensaje:
            'La contraseña actual es incorrecta.'
        });
      }

      usuario.password =
        await bcrypt.hash(
          passwordNueva,
          10
        );

      await usuario.save();

      return res.json({
        mensaje:
          'Contraseña actualizada correctamente.'
      });
    } catch (error) {
      console.error(
        'Error al cambiar contraseña:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo cambiar la contraseña.',
      });
    }
  };

/* =====================================================
   EXPEDIENTE PARA EL ODONTÓLOGO
===================================================== */

export const obtenerExpedientePacienteOdontologo =
  async (req, res) => {
    try {
      const paciente =
        await Paciente.findById(
          req.params.id
        );

      if (!paciente) {
        return res.status(404).json({
          mensaje:
            'Paciente no encontrado.'
        });
      }

      const expedientes =
        await Expediente.find({
          pacienteId: paciente._id
        }).sort({
          fechaAtencion: -1,
          createdAt: -1
        });

      return res.json({
        paciente,
        expedientes
      });
    } catch (error) {
      console.error(
        'Error al obtener expediente:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo obtener el expediente clínico.',
      });
    }
  };
