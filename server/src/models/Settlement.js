import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'El proyecto es obligatorio'],
      index: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario que paga la deuda es obligatorio'],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario que recibe el dinero es obligatorio'],
    },
    amount: {
      type: Number,
      required: [true, 'El importe liquidado es obligatorio'],
      min: [0.01, 'El importe debe ser mayor a 0'],
    },
    method: {
      type: String,
      enum: ['bizum', 'cash', 'bank', 'other'],
      default: 'bizum',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Índice compuesto para acelerar consultas por proyecto y fecha
settlementSchema.index({ project: 1, date: -1 });

export const Settlement = mongoose.model('Settlement', settlementSchema);