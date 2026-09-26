import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import Usuario from '../models/Usuario.js';
import { paginarConsulta } from '../utils/paginacion.js';

const rolesPermitidos = [
  'administrador',
  'recepcionista',
  'odontologo',
  'paciente'
];

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,30}$/;

const MAX_INTENTOS_FALLIDOS =
  Number(
    process.env.LOGIN_MAX_ATTEMPTS ||
      5
  );

const BLOQUEO_MINUTOS =
  Number(
    process.env.LOGIN_BLOCK_MINUTES ||
      15
  );

const RESET_TOKEN_MINUTOS =
  Number(
    process.env.RESET_TOKEN_MINUTES ||
      30
  );

const MENSAJE_CREDENCIALES_INVALIDAS =
  'El correo o la contraseña no son correctos.';

/* =====================================================
   UTILIDADES
===================================================== */

const normalizarCorreo = (
  email = ''
) => {
  return String(email)
    .trim()
    .toLowerCase();
};

const esCorreoValido = (
  email = ''
) => {
  return EMAIL_REGEX.test(
    normalizarCorreo(email)
  );
};

const esPasswordSegura = (
  password = ''
) => {
  return PASSWORD_REGEX.test(
    String(password)
  );
};

const esMismoUsuario = (
  primerId,
  segundoId
) => {
  return (
    String(primerId || '') ===
    String(segundoId || '')
  );
};

const limpiarBloqueo = (
  usuario
) => {
  usuario.intentosFallidos = 0;
  usuario.bloqueadoHasta = null;
};

const serializarUsuario = (
  usuario
) => {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    ci: usuario.ci,
    rol: usuario.rol,
    estado: usuario.estado,
    ultimoAcceso:
      usuario.ultimoAcceso,
    pacienteId:
      usuario.pacienteId,
    requiereCambioPassword:
      usuario.requiereCambioPassword,
    createdAt:
      usuario.createdAt,
    updatedAt:
      usuario.updatedAt
  };
};

export const obtenerSesionActual = async (req, res) => {
  return res.json({ usuario: serializarUsuario(req.usuarioActual) });
};

const escaparHtml = (
  valor = ''
) => {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const obtenerTransportadorCorreo =
  () => {
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS
    } = process.env;

    if (
      !EMAIL_HOST ||
      !EMAIL_PORT ||
      !EMAIL_USER ||
      !EMAIL_PASS
    ) {
      return null;
    }

    const puerto =
      Number(EMAIL_PORT);

    const secure =
      String(
        process.env.EMAIL_SECURE ??
          puerto === 465
      ).toLowerCase() ===
      'true';

    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: puerto,
      secure,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  };

const enviarCorreoRecuperacion =
  async ({
    destinatario,
    nombre,
    enlace
  }) => {
    const transportador =
      obtenerTransportadorCorreo();

    if (!transportador) {
      if (
        process.env.NODE_ENV !==
        'production'
      ) {
        console.log(
          '\nEnlace de recuperación:',
          enlace,
          '\n'
        );

        return;
      }

      throw new Error(
        'El servicio de correo no está configurado.'
      );
    }

    const nombreSeguro =
      escaparHtml(nombre);

    await transportador.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER,

      to: destinatario,

      subject:
        'Recuperación de contraseña - Clínica Orellana',

      text:
        `Hola ${nombre}. Abre este enlace para restablecer tu contraseña: ${enlace}. ` +
        `El enlace vence en ${RESET_TOKEN_MINUTOS} minutos.`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
          <h2 style="color:#2563eb">Clínica Orellana</h2>
          <p>Hola <strong>${nombreSeguro}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>

          <p>
            <a
              href="${enlace}"
              style="
                display:inline-block;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                padding:12px 18px;
                border-radius:8px;
                font-weight:700;
              "
            >
              Restablecer contraseña
            </a>
          </p>

          <p>
            Este enlace vence en ${RESET_TOKEN_MINUTOS} minutos
            y puede utilizarse una sola vez.
          </p>

          <p>
            Si no realizaste esta solicitud, ignora este correo.
          </p>
        </div>
      `
    });
  };

/*
 * Comprueba si el usuario indicado es el último
 * administrador activo del sistema.
 */
const esUltimoAdministradorActivo =
  async (usuario) => {
    if (
      usuario.rol !==
        'administrador' ||
      usuario.estado === false
    ) {
      return false;
    }

    const otrosAdministradores =
      await Usuario.countDocuments({
        _id: {
          $ne: usuario._id
        },
        rol: 'administrador',
        estado: true
      });

    return (
      otrosAdministradores === 0
    );
  };

/* =====================================================
   REGISTRAR USUARIO
===================================================== */

export const registrarUsuario =
  async (req, res) => {
    try {
      const {
        nombre,
        email,
        ci,
        rol,
        estado,
        password
      } = req.body;

      if (
        !nombre?.trim() ||
        !email?.trim() ||
        !ci?.trim() ||
        !rol
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Nombre, correo, CI y rol son obligatorios.'
          });
      }

      if (
        !rolesPermitidos.includes(
          rol
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Rol no permitido.'
          });
      }

      if (
        !esCorreoValido(email)
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'El correo electrónico no es válido.'
          });
      }

      const correoNormalizado =
        normalizarCorreo(email);

      const existeUsuario =
        await Usuario.findOne({
          email:
            correoNormalizado
        });

      if (existeUsuario) {
        return res
          .status(400)
          .json({
            mensaje:
              'Ya existe un usuario registrado con ese correo.'
          });
      }

      /*
       * Compatibilidad con el módulo actual:
       * si no se envía una contraseña, se utiliza
       * temporalmente el CI y se marca el cambio pendiente.
       */
      const passwordInicial =
        password
          ? String(password)
          : String(ci).trim();

      if (
        password &&
        !esPasswordSegura(
          passwordInicial
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'La contraseña debe tener entre 8 y 30 caracteres, una mayúscula, una minúscula, un número y un símbolo, sin espacios.'
          });
      }

      if (
        passwordInicial.length > 72
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'La contraseña es demasiado larga.'
          });
      }

      const passwordEncriptado =
        await bcrypt.hash(
          passwordInicial,
          12
        );

      const usuario =
        new Usuario({
          nombre:
            nombre.trim(),

          email:
            correoNormalizado,

          ci:
            String(ci).trim(),

          password:
            passwordEncriptado,

          rol,

          estado:
            typeof estado ===
            'boolean'
              ? estado
              : true,

          requiereCambioPassword:
            !password
        });

      await usuario.save();

      return res
        .status(201)
        .json({
          mensaje:
            'Usuario registrado correctamente.',

          usuario:
            serializarUsuario(
              usuario
            )
        });
    } catch (error) {
      console.error(
        'Error al registrar usuario:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudo registrar el usuario.'
        });
    }
  };

/* =====================================================
   INICIAR SESIÓN
===================================================== */

export const loginUsuario =
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'El correo y la contraseña son obligatorios.'
          });
      }

      if (
        !esCorreoValido(email)
      ) {
        return res
          .status(401)
          .json({
            mensaje:
              MENSAJE_CREDENCIALES_INVALIDAS
          });
      }

      if (
        String(password).length >
        72
      ) {
        return res
          .status(401)
          .json({
            mensaje:
              MENSAJE_CREDENCIALES_INVALIDAS
          });
      }

      const usuario =
        await Usuario.findOne({
          email:
            normalizarCorreo(
              email
            )
        }).select(
          '+password +intentosFallidos +bloqueadoHasta'
        );

      if (!usuario) {
        return res
          .status(401)
          .json({
            mensaje:
              MENSAJE_CREDENCIALES_INVALIDAS
          });
      }

      const ahora =
        new Date();

      if (
        usuario.bloqueadoHasta &&
        usuario.bloqueadoHasta >
          ahora
      ) {
        return res
          .status(429)
          .json({
            mensaje:
              'La cuenta está bloqueada temporalmente por varios intentos fallidos. Intenta nuevamente más tarde.'
          });
      }

      if (
        usuario.bloqueadoHasta &&
        usuario.bloqueadoHasta <=
          ahora
      ) {
        limpiarBloqueo(
          usuario
        );
      }

      const passwordValido =
        await bcrypt.compare(
          String(password),
          usuario.password
        );


      if (
        !passwordValido
      ) {
        usuario.intentosFallidos =
          Number(
            usuario.intentosFallidos ||
              0
          ) + 1;

        if (
          usuario.intentosFallidos >=
          MAX_INTENTOS_FALLIDOS
        ) {
          usuario.bloqueadoHasta =
            new Date(
              Date.now() +
                BLOQUEO_MINUTOS *
                  60 *
                  1000
            );

          usuario.intentosFallidos = 0;
        }

        await usuario.save();

        return res
          .status(401)
          .json({
            mensaje:
              MENSAJE_CREDENCIALES_INVALIDAS
          });
      }

      if (
        usuario.estado === false
      ) {
        return res
          .status(403)
          .json({
            mensaje:
              'Tu cuenta se encuentra inactiva. Comunícate con administración.'
          });
      }

      if (
        !process.env.JWT_SECRET
      ) {
        console.error(
          'JWT_SECRET no está configurado.'
        );

        return res
          .status(500)
          .json({
            mensaje:
              'No se pudo iniciar sesión.'
          });
      }

      limpiarBloqueo(
        usuario
      );

      usuario.ultimoAcceso =
        new Date();

      await usuario.save();

      const token =
        jwt.sign(
          {
            rol: usuario.rol
          },
          process.env.JWT_SECRET,
          {
            subject: String(usuario._id),
            issuer: 'sist-clinica-api',
            audience: 'sist-clinica-web',
            algorithm: 'HS256',
            expiresIn:
              process.env
                .JWT_EXPIRES_IN ||
              '8h'
          }
        );

      return res.json({
        mensaje:
          'Inicio de sesión exitoso.',

        token,

        usuario:
          serializarUsuario(
            usuario
          )
      });
    } catch (error) {
      console.error(
        'Error al iniciar sesión:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudo iniciar sesión.'
        });
    }
  };

/* =====================================================
   SOLICITAR RECUPERACIÓN DE CONTRASEÑA
===================================================== */

export const solicitarRecuperacionPassword =
  async (req, res) => {
    const respuestaGenerica = {
      mensaje:
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'
    };

    try {
      const correoNormalizado =
        normalizarCorreo(
          req.body?.email
        );

      if (
        !esCorreoValido(
          correoNormalizado
        )
      ) {
        return res
          .status(200)
          .json(
            respuestaGenerica
          );
      }

      const usuario =
        await Usuario.findOne({
          email:
            correoNormalizado,
          estado: true
        }).select(
          '+passwordResetToken +passwordResetExpira'
        );

      if (!usuario) {
        return res
          .status(200)
          .json(
            respuestaGenerica
          );
      }

      const tokenPlano =
        crypto
          .randomBytes(32)
          .toString('hex');

      const tokenHash =
        crypto
          .createHash('sha256')
          .update(tokenPlano)
          .digest('hex');

      usuario.passwordResetToken =
        tokenHash;

      usuario.passwordResetExpira =
        new Date(
          Date.now() +
            RESET_TOKEN_MINUTOS *
              60 *
              1000
        );

      await usuario.save();

      const frontendUrl =
        (
          process.env
            .FRONTEND_URL ||
          'http://localhost:5173'
        ).replace(/\/+$/, '');

      const enlace =
        `${frontendUrl}/login?resetToken=${tokenPlano}`;

      await enviarCorreoRecuperacion({
        destinatario:
          usuario.email,
        nombre:
          usuario.nombre,
        enlace
      });

      const respuesta = {
        ...respuestaGenerica
      };

      if (
        process.env.NODE_ENV !==
          'production' &&
        !obtenerTransportadorCorreo()
      ) {
        respuesta.enlaceDesarrollo =
          enlace;
      }

      return res
        .status(200)
        .json(respuesta);
    } catch (error) {
      console.error(
        'Error al solicitar recuperación:',
        error
      );

      return res
        .status(200)
        .json(
          respuestaGenerica
        );
    }
  };

/* =====================================================
   RESTABLECER CONTRASEÑA
===================================================== */

export const restablecerPassword =
  async (req, res) => {
    try {
      const {
        token,
        nuevaPassword
      } = req.body;

      if (
        !token ||
        !nuevaPassword
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'El token y la nueva contraseña son obligatorios.'
          });
      }

      if (
        !esPasswordSegura(
          nuevaPassword
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'La contraseña debe tener entre 8 y 30 caracteres, una mayúscula, una minúscula, un número y un símbolo, sin espacios.'
          });
      }

      const tokenHash =
        crypto
          .createHash('sha256')
          .update(
            String(token)
          )
          .digest('hex');

      const usuario =
        await Usuario.findOne({
          passwordResetToken:
            tokenHash,

          passwordResetExpira: {
            $gt: new Date()
          },

          estado: true
        }).select(
          '+password +passwordResetToken +passwordResetExpira +intentosFallidos +bloqueadoHasta'
        );

      if (!usuario) {
        return res
          .status(400)
          .json({
            mensaje:
              'El enlace de recuperación no es válido o ha expirado.'
          });
      }

      usuario.password =
        await bcrypt.hash(
          String(
            nuevaPassword
          ),
          12
        );

      usuario.passwordResetToken =
        null;

      usuario.passwordResetExpira =
        null;

      usuario.passwordActualizadoEn =
        new Date();

      usuario.requiereCambioPassword =
        false;

      limpiarBloqueo(
        usuario
      );

      await usuario.save();

      return res.json({
        mensaje:
          'La contraseña se restableció correctamente. Ya puedes iniciar sesión.'
      });
    } catch (error) {
      console.error(
        'Error al restablecer contraseña:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudo restablecer la contraseña.'
        });
    }
  };

/* =====================================================
   OBTENER USUARIOS
===================================================== */

export const obtenerUsuarios =
  async (req, res) => {
    try {
      const { datos: usuarios } = await paginarConsulta({
        req,
        res,
        consulta: Usuario.find().sort({ createdAt: -1 }),
        contar: Usuario.countDocuments()
      });

      return res.json(usuarios);
    } catch (error) {
      console.error(
        'Error al obtener usuarios:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudieron obtener los usuarios.'
        });
    }
  };

/* =====================================================
   ACTUALIZAR ROL
===================================================== */

export const actualizarRolUsuario =
  async (req, res) => {
    try {
      const {
        rol
      } = req.body;

      if (
        !rolesPermitidos.includes(
          rol
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Rol no permitido.'
          });
      }

      const usuario =
        await Usuario.findById(
          req.params.id
        );

      if (!usuario) {
        return res
          .status(404)
          .json({
            mensaje:
              'Usuario no encontrado.'
          });
      }

      if (
        esMismoUsuario(
          usuario._id,
          req.usuario?.id
        ) &&
        rol !== 'administrador'
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'No puedes quitar tu propio rol de administrador.'
          });
      }

      if (
        usuario.rol ===
          'administrador' &&
        rol !==
          'administrador' &&
        await esUltimoAdministradorActivo(
          usuario
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'No puedes cambiar el rol del último administrador activo.'
          });
      }

      usuario.rol = rol;

      await usuario.save();

      const usuarioActualizado =
        await Usuario.findById(
          usuario._id
        );

      return res.json({
        mensaje:
          'Rol actualizado correctamente.',

        usuario:
          usuarioActualizado
      });
    } catch (error) {
      console.error(
        'Error al actualizar rol:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudo actualizar el rol.'
        });
    }
  };

/* =====================================================
   ACTUALIZAR USUARIO
===================================================== */

export const actualizarUsuario =
  async (req, res) => {
    try {
      const {
        nombre,
        email,
        ci,
        rol,
        estado
      } = req.body;

      const usuario =
        await Usuario.findById(
          req.params.id
        );

      if (!usuario) {
        return res
          .status(404)
          .json({
            mensaje:
              'Usuario no encontrado.'
          });
      }

      if (
        rol &&
        !rolesPermitidos.includes(
          rol
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Rol no permitido.'
          });
      }

      if (
        email !== undefined &&
        !esCorreoValido(email)
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'El correo electrónico no es válido.'
          });
      }

      if (email) {
        const correoNormalizado =
          normalizarCorreo(email);

        const correoOcupado =
          await Usuario.findOne({
            email:
              correoNormalizado,

            _id: {
              $ne: usuario._id
            }
          });

        if (correoOcupado) {
          return res
            .status(400)
            .json({
              mensaje:
                'Ese correo ya pertenece a otro usuario.'
            });
        }
      }

      const nuevoRol =
        rol || usuario.rol;

      const nuevoEstado =
        typeof estado ===
        'boolean'
          ? estado
          : usuario.estado;

      if (
        esMismoUsuario(
          usuario._id,
          req.usuario?.id
        )
      ) {
        if (
          nuevoEstado === false
        ) {
          return res
            .status(400)
            .json({
              mensaje:
                'No puedes desactivar tu propia cuenta.'
            });
        }

        if (
          nuevoRol !==
          'administrador'
        ) {
          return res
            .status(400)
            .json({
              mensaje:
                'No puedes quitar tu propio rol de administrador.'
            });
        }
      }

      const dejarDeSerAdministradorActivo =
        usuario.rol ===
          'administrador' &&
        usuario.estado === true &&
        (
          nuevoRol !==
            'administrador' ||
          nuevoEstado === false
        );

      if (
        dejarDeSerAdministradorActivo &&
        await esUltimoAdministradorActivo(
          usuario
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Debe existir al menos un administrador activo en el sistema.'
          });
      }

      if (
        nombre !== undefined
      ) {
        const nombreLimpio =
          String(nombre).trim();

        if (!nombreLimpio) {
          return res
            .status(400)
            .json({
              mensaje:
                'El nombre no puede estar vacío.'
            });
        }

        usuario.nombre =
          nombreLimpio;
      }

      if (
        email !== undefined
      ) {
        usuario.email =
          normalizarCorreo(
            email
          );
      }

      if (
        ci !== undefined
      ) {
        const ciLimpio =
          String(ci).trim();

        if (!ciLimpio) {
          return res
            .status(400)
            .json({
              mensaje:
                'El CI no puede estar vacío.'
            });
        }

        usuario.ci =
          ciLimpio;
      }

      usuario.rol =
        nuevoRol;

      usuario.estado =
        nuevoEstado;

      await usuario.save();

      const usuarioActualizado =
        await Usuario.findById(
          usuario._id
        );

      return res.json({
        mensaje:
          'Usuario actualizado correctamente.',

        usuario:
          usuarioActualizado
      });
    } catch (error) {
      console.error(
        'Error al actualizar usuario:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudo actualizar el usuario.'
        });
    }
  };

/* =====================================================
   ELIMINAR USUARIO
===================================================== */

export const eliminarUsuario =
  async (req, res) => {
    try {
      const usuario =
        await Usuario.findById(
          req.params.id
        );

      if (!usuario) {
        return res
          .status(404)
          .json({
            mensaje:
              'Usuario no encontrado.'
          });
      }

      if (
        esMismoUsuario(
          usuario._id,
          req.usuario?.id
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'No puedes eliminar tu propia cuenta.'
          });
      }

      if (
        await esUltimoAdministradorActivo(
          usuario
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'No puedes eliminar el último administrador activo.'
          });
      }

      await usuario.deleteOne();

      return res.json({
        mensaje:
          'Usuario eliminado correctamente.'
      });
    } catch (error) {
      console.error(
        'Error al eliminar usuario:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudo eliminar el usuario.'
        });
    }
  };

/* =====================================================
   OBTENER ODONTÓLOGOS
===================================================== */

export const obtenerOdontologos =
  async (req, res) => {
    try {
      const odontologos =
        await Usuario.find({
          rol: 'odontologo',
          estado: true
        })
          .sort({
            nombre: 1
          });

      return res.json(
        odontologos
      );
    } catch (error) {
      console.error(
        'Error al obtener odontólogos:',
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            'No se pudieron obtener los odontólogos.'
        });
    }
  };
