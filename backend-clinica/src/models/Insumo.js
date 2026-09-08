import mongoose from 'mongoose';

const insumoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [
        20,
        'El código no puede superar los 20 caracteres.'
      ]
    },

    nombre: {
      type: String,
      required: [
        true,
        'El nombre del insumo es obligatorio.'
      ],
      trim: true,
      maxlength: [
        120,
        'El nombre no puede superar los 120 caracteres.'
      ],
      index: true
    },

    descripcion: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'La descripción no puede superar los 500 caracteres.'
      ],
      default: ''
    },

    categoria: {
      type: String,
      trim: true,
      maxlength: [
        100,
        'La categoría no puede superar los 100 caracteres.'
      ],
      default: 'General',
      index: true
    },

    unidadMedida: {
      type: String,
      required: [
        true,
        'La unidad de medida es obligatoria.'
      ],
      trim: true,
      maxlength: [
        50,
        'La unidad de medida no puede superar los 50 caracteres.'
      ]
    },

    stockActual: {
      type: Number,
      required: true,
      default: 0,
      min: [
        0,
        'El stock actual no puede ser negativo.'
      ]
    },

    stockMinimo: {
      type: Number,
      required: true,
      default: 0,
      min: [
        0,
        'El stock mínimo no puede ser negativo.'
      ]
    },

    costoUnitario: {
      type: Number,
      default: 0,
      min: [
        0,
        'El costo unitario no puede ser negativo.'
      ]
    },

    prioridad: {
      type: String,
      enum: {
        values: [
          'critica',
          'alta',
          'media',
          'baja'
        ],
        message:
          'La prioridad debe ser critica, alta, media o baja.'
      },
      lowercase: true,
      trim: true,
      default: 'media',
      index: true
    },

    especialidad: {
      type: String,
      trim: true,
      maxlength: [
        150,
        'La especialidad no puede superar los 150 caracteres.'
      ],
      default: 'Todas',
      index: true
    },

    aplicacion: {
      type: String,
      enum: {
        values: [
          'base',
          'condicional'
        ],
        message:
          'La aplicación debe ser base o condicional.'
      },
      lowercase: true,
      trim: true,
      default: 'base',
      index: true
    },

    usarEnML: {
      type: Boolean,
      default: true,
      index: true
    },

    controlVencimiento: {
      type: Boolean,
      default: false,
      index: true
    },

    /*
     * Estos dos campos se completan con el producto físico.
     * El catálogo solo indica si corresponde controlar vencimiento.
     */
    lote: {
      type: String,
      trim: true,
      maxlength: [
        100,
        'El lote no puede superar los 100 caracteres.'
      ],
      default: ''
    },

    fechaVencimiento: {
      type: Date,
      default: null
    },

    fuenteReferencia: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'La fuente de referencia no puede superar los 500 caracteres.'
      ],
      default: ''
    },

    estado: {
      type: String,
      enum: {
        values: [
          'activo',
          'inactivo'
        ],
        message:
          'El estado debe ser activo o inactivo.'
      },
      default: 'activo',
      index: true
    },

    fechaRegistro: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/*
 * El código se valida como obligatorio al crear nuevos registros desde
 * la API. En el esquema queda temporalmente opcional para que los
 * documentos antiguos sin código puedan seguir consultándose,
 * activándose y migrándose sin romper el módulo.
 */
insumoSchema.index(
  {
    codigo: 1
  },
  {
    unique: true,
    sparse: true
  }
);

/*
 * Índices utilizados por búsquedas, filtros,
 * alertas de inventario y selección de datos para ML.
 */
insumoSchema.index({
  nombre: 1,
  estado: 1
});

insumoSchema.index({
  categoria: 1,
  estado: 1
});

insumoSchema.index({
  estado: 1,
  stockActual: 1
});

insumoSchema.index({
  prioridad: 1,
  estado: 1
});

insumoSchema.index({
  usarEnML: 1,
  estado: 1
});

insumoSchema.index({
  controlVencimiento: 1,
  estado: 1
});

export default mongoose.model(
  'Insumo',
  insumoSchema,
  'insumos'
);