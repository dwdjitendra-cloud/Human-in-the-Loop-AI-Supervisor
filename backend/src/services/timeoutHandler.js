import HelpRequest from '../models/HelpRequest.js';
import { logger } from '../utils/logger.js';

const TIMEOUT_MINUTES = parseInt(process.env.TIMEOUT_MINUTES || '5', 10);

export const startTimeoutHandler = () => {
  setInterval(async () => {
    try {
      const cutoffTime = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

      const timedOutRequests = await HelpRequest.updateMany(
        {
          status: 'Pending',
          createdAt: { $lt: cutoffTime },
          isTimeoutResolved: false,
        },
        {
          status: 'Unresolved',
          isTimeoutResolved: true,
          resolvedAt: new Date(),
        }
      );

      if (timedOutRequests.modifiedCount > 0) {
        logger.warn(
          `Timeout handler: Marked ${timedOutRequests.modifiedCount} requests as unresolved`
        );
      }
    } catch (error) {
      logger.error('Error in timeout handler:', error.message);
    }
  }, 60000);
};
