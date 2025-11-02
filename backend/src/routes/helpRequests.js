import express from 'express';
import { receiveCall } from '../services/livekitAgent.js';
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


// Simulated LiveKit endpoint
router.post('/simulate-livekit-call', async (req, res) => {
  const { customerName, question } = req.body;
  if (!customerName || !question) {
    return res.status(400).json({ success: false, message: 'customerName and question required' });
  }
  const result = await receiveCall(customerName, question);
  res.json({ success: true, data: result });
});

export default router;
