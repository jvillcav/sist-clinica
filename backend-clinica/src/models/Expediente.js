import mongoose from 'mongoose';

const expedienteSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true,
      index: true
    },

    citaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cita',
      default: null,
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
      trim: true,
      maxlength: 120
    },

    motivoConsulta: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },

    diagnostico: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    piezasDentales: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },

    tratamiento: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    prescripcion: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },

    observaciones: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: ''
    },

    fechaAtencion: {
      type: Date,
      default: Date.now,
      index: true
    },

    estadoRegistro: {
      type: String,
      enum: ['activo', 'anulado'],
      default: 'activo',
      index: true
    },

    motivoAnulacion: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },

    anuladoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    },

    fechaAnulacion: {
      type: Date,
      default: null
    },

    ultimaActualizacionPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    }
  },
  {
    timestamps: true
  }
);

expedienteSchema.index(
  { citaId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      citaId: { $type: 'objectId' },
      estadoRegistro: 'activo'
    },
    name: 'expediente_activo_por_cita'
  }
);

expedienteSchema.index({
  pacienteId: 1,
  fechaAtencion: -1
});

expedienteSchema.index({
  odontologoId: 1,
  fechaAtencion: -1
});

expedienteSchema.index({
  estadoRegistro: 1,
  fechaAtencion: -1
});

export default mongoose.model(
  'Expediente',
  expedienteSchema,
  'expedientes'
);