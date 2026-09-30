import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título del proyecto es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede exceder 100 caracteres']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      required: [true, 'El tipo de proyecto es obligatorio'],
      enum: ['trip', 'event', 'renovation', 'other'],
      default: 'trip'
    },
    budget: {
      type: Number,
      required: [true, 'El presupuesto estimado es obligatorio'],
      min: [0, 'El presupuesto no puede ser negativo'],
      default: 0
    },
    currency: {
      type: String,
      default: 'EUR',
      uppercase: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

export const Project = mongoose.model('Project', projectSchema);