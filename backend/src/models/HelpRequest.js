import mongoose from 'mongoose';

const helpRequestSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved', 'Unresolved'],
    default: 'Pending',
  },
  answer: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supervisor',
    default: null,
  },
  isTimeoutResolved: {
    type: Boolean,
    default: false,
  },
});
helpRequestSchema.index({ status: 1, createdAt: -1 });

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);
export default HelpRequest;
