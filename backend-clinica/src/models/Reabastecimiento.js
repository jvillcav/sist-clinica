import mongoose from 'mongoose';

const reabastecimientoSchema = new mongoose.Schema({
  insumoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insumo',
    required: true
  },
  cantidad: {
    type: Number,
    required: true
  },
  proveedor: String,
  observacion: String,
  fechaReabastecimiento: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Reabastecimiento', reabastecimientoSchema, 'reabastecimientos');