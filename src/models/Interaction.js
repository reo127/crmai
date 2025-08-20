import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note'],
    required: true,
  },
  outcome: {
    type: String,
    enum: ['Interested', 'Not Interested', 'Call Back Later', 'No Answer', 'Converted', 'Follow-up Scheduled'],
  },
  notes: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // in minutes
  },
  followUpDate: {
    type: Date,
  },
  previousStatus: {
    type: String,
  },
  newStatus: {
    type: String,
  },
}, {
  timestamps: true,
});

InteractionSchema.index({ lead: 1, createdAt: -1 });
InteractionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Interaction || mongoose.model('Interaction', InteractionSchema);