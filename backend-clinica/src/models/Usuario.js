import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
      index: true
    },

    ci: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    rol: {
      type: String,
      enum: [
        'administrador',
        'recepcionista',
        'odontologo',
        'paciente'
      ],
      default: 'paciente',
      index: true
    },

    estado: {
      type: Boolean,
      default: true,
      index: true
    },

    ultimoAcceso: {
      type: Date,
      default: null
    },

    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      default: null
    },

    intentosFallidos: {
      type: Number,
      default: 0,
      select: false
    },

    bloqueadoHasta: {
      type: Date,
      default: null,
      select: false
    },

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
      index: true
    },

    passwordResetExpira: {
      type: Date,
      default: null,
      select: false
    },

    passwordActualizadoEn: {
      type: Date,
      default: null
    },

    requiereCambioPassword: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  'Usuario',
  usuarioSchema,
  'usuarios'
);