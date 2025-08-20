import mongoose from 'mongoose';

const CommunicationSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  type: {
    type: String,
    enum: ['call', 'email', 'sms', 'meeting', 'note'],
    required: true,
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'outbound',
  },
  subject: {
    type: String,
  },
  notes: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // in minutes for calls/meetings
  },
  outcome: {
    type: String,
    enum: ['successful', 'no_answer', 'busy', 'voicemail', 'scheduled_callback', 'not_interested', 'converted'],
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
CommunicationSchema.index({ leadId: 1, createdAt: -1 });
CommunicationSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.models.Communication || mongoose.model('Communication', CommunicationSchema);