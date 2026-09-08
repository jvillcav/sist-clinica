import mongoose from 'mongoose';

const contactoEmergenciaSchema =
  new mongoose.Schema(
    {
      nombre: {
        type: String,
        trim: true,
        default: ''
      },

      telefono: {
        type: String,
        trim: true,
        default: ''
      },

      parentesco: {
        type: String,
        trim: true,
        default: ''
      }
    },
    {
      _id: false
    }
  );

const pacienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    apellido: {
      type: String,
      required: true,
      trim: true
    },

    ci: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    telefono: {
      type: String,
      trim: true,
      default: ''
    },

    direccion: {
      type: String,
      trim: true,
      default: ''
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },

    fechaNacimiento: {
      type: Date,
      default: null
    },

    sexo: {
      type: String,
      enum: [
        '',
        'Masculino',
        'Femenino',
        'Otro'
      ],
      default: ''
    },

    tipoSangre: {
      type: String,
      enum: [
        '',
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-'
      ],
      default: ''
    },

    alergias: {
      type: [String],
      default: []
    },

    condicionesCronicas: {
      type: [String],
      default: []
    },

    contactoEmergencia: {
      type: contactoEmergenciaSchema,
      default: () => ({})
    },

    /*
     * Cuenta que permite iniciar sesión en el portal.
     * Es opcional: un paciente puede no tener acceso.
     */
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    },

    estado: {
      type: Boolean,
      default: true
    },

    fechaRegistro: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

pacienteSchema.index({
  nombre: 'text',
  apellido: 'text',
  ci: 'text'
});

export default mongoose.model(
  'Paciente',
  pacienteSchema,
  'pacientes'
);