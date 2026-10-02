import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'El gasto debe pertenecer a un proyecto'],
    },
    title: {
      type: String,
      required: [true, 'El concepto del gasto es obligatorio'],
      trim: true,
      maxlength: [100, 'El concepto no puede superar los 100 caracteres'],
    },
    amount: {
      type: Number,
      required: [true, 'El importe es obligatorio'],
      min: [0.01, 'El importe debe ser mayor a 0'],
    },
    category: {
      type: String,
      default: 'Comida / Restaurante',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isPersonal: {
      type: Boolean,
      default: false,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitBetween: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        share: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;