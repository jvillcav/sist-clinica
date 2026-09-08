import mongoose from 'mongoose';

const solicitudCitaSchema =
  new mongoose.Schema(
    {
      /*
       * Se conserva para que las solicitudes
       * antiguas y Citas.jsx sigan funcionando.
       */
      nombreCompleto: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
      },

      nombre: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
      },

      apellido: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
      },

      ci: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
        index: true
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 120
      },

      telefono: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30
      },

      servicio: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
      },

      fecha: {
        type: Date,
        required: true,
        index: true
      },

      hora: {
        type: String,
        required: true,
        trim: true,
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          'La hora debe tener el formato HH:mm.'
        ]
      },

      mensaje: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
      },

      estado: {
        type: String,
        enum: [
          'pendiente',
          'confirmada',
          'rechazada'
        ],
        default: 'pendiente',
        index: true
      },

      clavePendiente: {
        type: String,
        default: undefined,
        select: false
      },

      pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        default: null
      },

      odontologoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
      },

      citaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cita',
        default: null
      },

      procesadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
      },

      fechaProcesamiento: {
        type: Date,
        default: null
      },

      motivoRechazo: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ''
      }
    },
    {
      timestamps: true
    }
  );

solicitudCitaSchema.pre('validate', function prepararClavePendiente() {
  if (this.estado !== 'pendiente' || !this.ci || !this.fecha || !this.hora) {
    this.clavePendiente = undefined;
    return;
  }

  this.clavePendiente = [
    String(this.ci).trim().toLowerCase(),
    new Date(this.fecha).toISOString().slice(0, 10),
    this.hora
  ].join('|');
});

solicitudCitaSchema.index(
  { clavePendiente: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clavePendiente: { $type: 'string' }
    },
    name: 'solicitud_pendiente_unica'
  }
);

/*
 * No es único porque una persona podría enviar
 * más de una solicitud a lo largo del tiempo.
 */
solicitudCitaSchema.index({
  ci: 1,
  estado: 1,
  createdAt: -1
});

export default mongoose.model(
  'SolicitudCita',
  solicitudCitaSchema,
  'solicitudCitas'
);