import HelpRequest from '../models/HelpRequest.js';
import { logger } from '../utils/logger.js';

export const triggerEscalation = async (customerName, question) => {
  try {
    const helpRequest = new HelpRequest({
      customerName,
      question,
      status: 'Pending',
    });

    await helpRequest.save();

    logger.info(`[SUPERVISOR ALERT] New help request from ${customerName}`);
    logger.info(`[SUPERVISOR ALERT] Question: "${question}"`);
    logger.info(`[SUPERVISOR ALERT] Request ID: ${helpRequest._id}`);

    return helpRequest;
  } catch (error) {
    logger.error('Error creating help request:', error.message);
    throw error;
  }
};

export const notifySupervisor = (helpRequest) => {
  logger.info(`[SUPERVISOR NOTIFICATION] New unresolved request: ${helpRequest._id}`);
  logger.info(`[SUPERVISOR NOTIFICATION] Customer: ${helpRequest.customerName}`);
  logger.info(`[SUPERVISOR NOTIFICATION] Question: ${helpRequest.question}`);
};
