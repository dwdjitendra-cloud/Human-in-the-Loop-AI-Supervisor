import KnowledgeBase from '../models/KnowledgeBase.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

export const getAllKnowledge = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await KnowledgeBase.countDocuments();
  const knowledge = await KnowledgeBase.find()
    .populate('helpRequestId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: knowledge,
    page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});

export const getKnowledgeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const knowledge = await KnowledgeBase.findById(id);

  if (!knowledge) {
    throw new AppError('Knowledge base entry not found', 404);
  }

  res.json({
    success: true,
    data: knowledge,
  });
});

export const createKnowledge = asyncHandler(async (req, res) => {
  const { question, answer, category } = req.body;

  if (!question || !answer) {
    throw new AppError('Question and answer are required', 400);
  }

  const existingKnowledge = await KnowledgeBase.findOne({ question });
  if (existingKnowledge) {
    throw new AppError('This question already exists in the knowledge base', 400);
  }

  const knowledge = new KnowledgeBase({
    question,
    answer,
    category: category || 'General',
  });

  await knowledge.save();
  logger.info(`Knowledge base entry created: ${knowledge._id}`);

  res.status(201).json({
    success: true,
    data: knowledge,
  });
});

export const updateKnowledge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answer, category } = req.body;

  if (!answer && !category) {
    throw new AppError('At least one field to update is required', 400);
  }

  const knowledge = await KnowledgeBase.findByIdAndUpdate(
    id,
    {
      answer: answer || undefined,
      category: category || undefined,
      updatedAt: new Date(),
    },
    { new: true }
  );

  if (!knowledge) {
    throw new AppError('Knowledge base entry not found', 404);
  }

  logger.info(`Knowledge base entry updated: ${id}`);

  res.json({
    success: true,
    data: knowledge,
  });
});

export const deleteKnowledge = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const knowledge = await KnowledgeBase.findByIdAndDelete(id);

  if (!knowledge) {
    throw new AppError('Knowledge base entry not found', 404);
  }

  logger.info(`Knowledge base entry deleted: ${id}`);

  res.json({
    success: true,
    message: 'Knowledge base entry deleted successfully',
  });
});

export const searchKnowledge = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new AppError('Search query is required', 400);
  }

  const regex = new RegExp(q, 'i');
  const results = await KnowledgeBase.find({
    $or: [
      { question: regex },
      { answer: regex },
      { category: regex },
    ],
  });

  res.json({
    success: true,
    data: results,
  });
});
