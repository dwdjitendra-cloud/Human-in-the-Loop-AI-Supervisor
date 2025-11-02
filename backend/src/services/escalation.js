import HelpRequest from '../models/HelpRequest.js';
import { logger } from '../utils/logger.js';
import { notifySupervisorHelpNeeded } from './notify.js';

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
  // Fire-and-forget webhook notification (optional)
  notifySupervisorHelpNeeded(helpRequest);
};

export const triggerHelpRequestEvent = async (customerName, question) => {
  try {
    const helpRequest = await triggerEscalation(customerName, question);

    logger.info(`[HELP_REQUEST EVENT] Triggered for customer: ${customerName}`);
    logger.info(`[HELP_REQUEST EVENT] Question: ${question}`);

    // Notify supervisor about the help request
    notifySupervisor(helpRequest);

    return helpRequest;
  } catch (error) {
    logger.error('Error triggering help_request event:', error.message);
    throw error;
  }
};
