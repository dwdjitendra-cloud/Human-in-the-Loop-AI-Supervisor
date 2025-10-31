import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    unique: true,
  },
  answer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  helpRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpRequest',
    default: null,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
});
knowledgeBaseSchema.index({ question: 1 });

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
export default KnowledgeBase;
