import express from 'express';
import {
  getAllHelpRequests,
  getHelpRequestById,
  getPendingRequests,
  getResolvedRequests,
  getUnresolvedRequests,
  createHelpRequest,
  resolveHelpRequest,
  deleteHelpRequest,
} from '../controllers/helpRequestController.js';

const router = express.Router();

router.get('/', getAllHelpRequests);
router.get('/pending', getPendingRequests);
router.get('/resolved', getResolvedRequests);
router.get('/unresolved', getUnresolvedRequests);
router.get('/:id', getHelpRequestById);
router.post('/', createHelpRequest);
router.post('/:id/resolve', resolveHelpRequest);
router.delete('/:id', deleteHelpRequest);

export default router;
