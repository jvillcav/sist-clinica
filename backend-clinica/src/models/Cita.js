import mongoose from 'mongoose';

const reprogramacionSchema = new mongoose.Schema(
  {
    fechaAnterior: {
      type: Date,
      default: null
    },

    horaAnterior: {
      type: String,
      trim: true,
      default: ''
    },

    odontologoAnterior: {
      type: String,
      trim: true,
      default: ''
    },

    fechaNueva: {
      type: Date,
      default: null
    },

    horaNueva: {
      type: String,
      trim: true,
      default: ''
    },

    odontologoNuevo: {
      type: String,
      trim: true,
      default: ''
    },

    motivo: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },

    realizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    },

    fechaCambio: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const citaSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true,
      index: true
    },

    odontologoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
      index: true
    },

    odontologo: {
      type: String,
      required: true,
      trim: true
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

    duracionMinutos: {
      type: Number,
      min: 15,
      max: 240,
      default: 30
    },

    minutosOcupados: {
      type: [Number],
      default: undefined,
      select: false
    },

    reservaActiva: {
      type: Boolean,
      default: true,
      select: false
    },

    motivo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    observaciones: {
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
        'atendido',
        'cancelado'
      ],
      default: 'pendiente',
      index: true
    },

    origen: {
      type: String,
      enum: [
        'interna',
        'solicitud_online'
      ],
      default: 'interna'
    },

    solicitudId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SolicitudCita',
      default: null
    },

    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    },

    motivoCancelacion: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },

    fechaCancelacion: {
      type: Date,
      default: null
    },

    canceladoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    },

    reprogramaciones: {
      type: [reprogramacionSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

citaSchema.pre('validate', function prepararReservaHorario() {
  this.reservaActiva = ['pendiente', 'confirmada'].includes(this.estado);

  if (!this.reservaActiva) {
    this.minutosOcupados = undefined;
    return;
  }

  const [horas, minutos] = String(this.hora || '').split(':').map(Number);
  const inicio = horas * 60 + minutos;
  const duracion = Number(this.duracionMinutos || 30);

  if (!Number.isInteger(inicio) || !Number.isInteger(duracion)) {
    this.invalidate('duracionMinutos', 'La duración debe ser un número entero de minutos.');
    return;
  }

  if (inicio + duracion > 24 * 60) {
    this.invalidate('duracionMinutos', 'La cita no puede extenderse al día siguiente.');
    return;
  }

  this.minutosOcupados = Array.from(
    { length: Math.ceil(duracion) },
    (_, desplazamiento) => inicio + desplazamiento
  );
});

citaSchema.index(
  {
    odontologoId: 1,
    fecha: 1,
    minutosOcupados: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      reservaActiva: true,
      odontologoId: { $type: 'objectId' },
      minutosOcupados: { $type: 'array' }
    },
    name: 'cita_horario_activo_unico'
  }
);

citaSchema.index(
  {
    pacienteId: 1,
    fecha: 1,
    minutosOcupados: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      reservaActiva: true,
      pacienteId: { $type: 'objectId' },
      minutosOcupados: { $type: 'array' }
    },
    name: 'cita_paciente_horario_activo_unico'
  }
);

citaSchema.index(
  { solicitudId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      solicitudId: { $type: 'objectId' }
    },
    name: 'cita_solicitud_unica'
  }
);

citaSchema.index({
  pacienteId: 1,
  fecha: -1
});

export default mongoose.model(
  'Cita',
  citaSchema,
  'citas'
);