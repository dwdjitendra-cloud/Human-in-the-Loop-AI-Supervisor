import HelpRequest from '../models/HelpRequest.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import { logger } from '../utils/logger.js';
import { triggerEscalation } from './escalation.js';

const SALON_INFO = {
  name: 'Bella\'s Hair Salon',
  hours: '9 AM - 6 PM, Monday to Saturday',
  address: '123 Main Street, Downtown',
  phone: '(555) 123-4567',
  services: ['Hair Cut', 'Hair Coloring', 'Styling', 'Perms', 'Treatments'],
};

export const aiAgent = {
  async processCall(customerName, question) {
    logger.info(`Processing call from ${customerName}: "${question}"`);

    try {
      const knownAnswer = await this.searchKnowledgeBase(question);

      if (knownAnswer) {
        logger.info(`Found answer in knowledge base for: ${question}`);
        const response = `Thank you for your question! Here's what I found: ${knownAnswer.answer}`;

        knownAnswer.usageCount += 1;
        await knownAnswer.save();

        return {
          success: true,
          response,
          escalated: false,
          fromKnowledge: true,
        };
      }

      const defaultAnswer = this.getDefaultAnswer(question);
      if (defaultAnswer) {
        logger.info(`Found default answer for: ${question}`);
        return {
          success: true,
          response: defaultAnswer,
          escalated: false,
          fromKnowledge: false,
        };
      }

      logger.info(`Escalating question from ${customerName}: "${question}"`);
      const helpRequest = await triggerEscalation(customerName, question);

      return {
        success: true,
        response: 'Let me check with my supervisor and get back to you.',
        escalated: true,
        helpRequestId: helpRequest._id,
      };
    } catch (error) {
      logger.error('Error in aiAgent.processCall:', error.message);
      return {
        success: false,
        response: 'Sorry, I encountered an error. Please try again later.',
        escalated: false,
      };
    }
  },

  async searchKnowledgeBase(question) {
    try {
      const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);

      if (keywords.length === 0) return null;

      const regex = new RegExp(keywords.join('|'), 'i');
      const match = await KnowledgeBase.findOne({
        $or: [
          { question: regex },
          { answer: regex },
        ],
      });

      return match;
    } catch (error) {
      logger.error('Error searching knowledge base:', error.message);
      return null;
    }
  },

  getDefaultAnswer(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('hour') || lowerQuestion.includes('open')) {
      return `${SALON_INFO.name} is open ${SALON_INFO.hours}`;
    }

    if (lowerQuestion.includes('address') || lowerQuestion.includes('location')) {
      return `We're located at ${SALON_INFO.address}`;
    }

    if (lowerQuestion.includes('phone') || lowerQuestion.includes('call')) {
      return `You can reach us at ${SALON_INFO.phone}`;
    }

    if (lowerQuestion.includes('service')) {
      return `We offer the following services: ${SALON_INFO.services.join(', ')}`;
    }

    if (lowerQuestion.includes('name')) {
      return `Welcome to ${SALON_INFO.name}!`;
    }

    return null;
  },

  async followUpWithCustomer(customerName, answer, helpRequestId) {
  logger.info(`Automated Agent following up with ${customerName} - Answer: "${answer}"`);
    logger.info(`[CUSTOMER NOTIFICATION] ${customerName}: Your question has been answered - ${answer}`);

    return {
      success: true,
      message: 'Customer notified with answer',
    };
  },
};
