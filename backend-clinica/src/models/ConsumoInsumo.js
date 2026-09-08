import mongoose from 'mongoose';

const consumoInsumoSchema = new mongoose.Schema(
  {
    insumoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insumo',
      required: true,
      index: true
    },
    
    expedienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expediente',
      required: true
    },

    odontologoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    },

    cantidadUtilizada: {
      type: Number,
      required: true,
      min: [0.01, 'La cantidad utilizada debe ser mayor que cero']
    },

    tipoTratamiento: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    fechaConsumo: {
      type: Date,
      default: Date.now
    },

    origenRegistro: {
      type: String,
      enum: ['atencion_clinica', 'ajuste_administrativo'],
      default: 'atencion_clinica'
    },

    observacion: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

consumoInsumoSchema.index({ expedienteId: 1, fechaConsumo: -1 });
consumoInsumoSchema.index({ odontologoId: 1, fechaConsumo: -1 });
consumoInsumoSchema.index({ insumoId: 1, fechaConsumo: -1 });
consumoInsumoSchema.index({ fechaConsumo: -1 });

export default mongoose.model(
  'ConsumoInsumo',
  consumoInsumoSchema,
  'consumoInsumos'
);