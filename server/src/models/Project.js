import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const TYPE_MAP = {
  trip: 'Viaje',
  viaje: 'Viaje',
  home: 'Hogar',
  hogar: 'Hogar',
  event: 'Evento',
  evento: 'Evento',
  general: 'General',
  couple: 'Pareja',
  pareja: 'Pareja',
};

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título del proyecto es obligatorio.'],
      trim: true,
      maxlength: [100, 'El título no puede exceder los 100 caracteres.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'Viaje', 'Hogar', 'Evento', 'General', 'Pareja',
        'trip', 'home', 'event', 'general', 'couple'
      ],
      default: 'General',
      set: (val) => {
        if (!val) return 'General';
        const normalized = String(val).toLowerCase().trim();
        return TYPE_MAP[normalized] || val;
      },
    },
    currency: {
      type: String,
      default: '€',
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: [0, 'El presupuesto no puede ser negativo.'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [MemberSchema],
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para acelerar búsquedas de proyectos por usuario
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ 'members.user': 1, 'members.status': 1 });

export const Project = mongoose.model('Project', ProjectSchema);