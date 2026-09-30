import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'El gasto debe pertenecer a un proyecto']
    },
    title: {
      type: String,
      required: [true, 'El concepto o título del gasto es obligatorio'],
      trim: true,
      maxlength: [120, 'El concepto no puede superar 120 caracteres']
    },
    amount: {
      type: Number,
      required: [true, 'El importe es obligatorio'],
      min: [0.01, 'El importe debe ser mayor que 0']
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Debe indicarse quién pagó el gasto']
    },
    splitBetween: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        share: {
          type: Number,
          required: true
        }
      }
    ],
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    date: {
      type: Date,
      default: Date.now
    }
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

export const Expense = mongoose.model('Expense', expenseSchema);