import HelpRequest from '../models/HelpRequest.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';
import { aiAgent } from '../services/aiAgent.js';

export const getAllHelpRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await HelpRequest.countDocuments();
  const requests = await HelpRequest.find()
    .populate('supervisorId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: requests,
    page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});

export const getHelpRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await HelpRequest.findById(id).populate('supervisorId', 'name email');

  if (!request) {
    throw new AppError('Help request not found', 404);
  }

  res.json({
    success: true,
    data: request,
  });
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await HelpRequest.countDocuments({ status: 'Pending' });
  const requests = await HelpRequest.find({ status: 'Pending' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: requests,
    page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});

export const getResolvedRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await HelpRequest.countDocuments({ status: 'Resolved' });
  const requests = await HelpRequest.find({ status: 'Resolved' })
    .populate('supervisorId', 'name email')
    .sort({ resolvedAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: requests,
    page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});

export const getUnresolvedRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await HelpRequest.countDocuments({ status: 'Unresolved' });
  const requests = await HelpRequest.find({ status: 'Unresolved' })
    .sort({ resolvedAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: requests,
    page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});

export const createHelpRequest = asyncHandler(async (req, res) => {
  const { customerName, question } = req.body;

  if (!customerName || !question) {
    throw new AppError('Customer name and question are required', 400);
  }

  const helpRequest = new HelpRequest({
    customerName,
    question,
  });

  await helpRequest.save();

  logger.info(`Help request created: ${helpRequest._id}`);

  res.status(201).json({
    success: true,
    data: helpRequest,
  });
});

export const resolveHelpRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answer, supervisorId, saveToKnowledgeBase } = req.body;

  if (!answer) {
    logger.error('Resolve HelpRequest: Missing answer');
    throw new AppError('Answer is required', 400);
  }
  if (!supervisorId) {
    logger.error('Resolve HelpRequest: Missing supervisorId');
    throw new AppError('Supervisor ID is required', 400);
  }

  // Validate supervisor exists
  const Supervisor = (await import('../models/Supervisor.js')).default;
  const supervisor = await Supervisor.findById(supervisorId);
  if (!supervisor) {
    logger.error(`Resolve HelpRequest: Supervisor not found for ID ${supervisorId}`);
    throw new AppError('Supervisor not found', 404);
  }

  const helpRequest = await HelpRequest.findByIdAndUpdate(
    id,
    {
      status: 'Resolved',
      answer,
      supervisorId,
      resolvedAt: new Date(),
    },
    { new: true }
  );

  if (!helpRequest) {
    logger.error(`Resolve HelpRequest: Help request not found for ID ${id}`);
    throw new AppError('Help request not found', 404);
  }

  if (saveToKnowledgeBase) {
    try {
      let knowledge = await KnowledgeBase.findOne({ question: helpRequest.question });

      if (!knowledge) {
        knowledge = new KnowledgeBase({
          question: helpRequest.question,
          answer,
          helpRequestId: id,
          category: 'Learned',
        });
        await knowledge.save();
        logger.info(`New knowledge base entry created: ${knowledge._id}`);
      }
    } catch (error) {
      logger.error('Error saving to knowledge base:', error.message);
    }
  }

  await aiAgent.followUpWithCustomer(helpRequest.customerName, answer, id);

  res.json({
    success: true,
    data: helpRequest,
  });
});

export const deleteHelpRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const helpRequest = await HelpRequest.findByIdAndDelete(id);

  if (!helpRequest) {
    throw new AppError('Help request not found', 404);
  }

  logger.info(`Help request deleted: ${id}`);

  res.json({
    success: true,
    message: 'Help request deleted successfully',
  });
});
