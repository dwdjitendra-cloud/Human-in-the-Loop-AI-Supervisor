import express from 'express';
import {
  getAllKnowledge,
  getKnowledgeById,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
  saveSupervisorAnswer,
} from '../controllers/knowledgeBaseController.js';

const router = express.Router();

router.get('/', getAllKnowledge);
router.get('/search', searchKnowledge);
router.get('/:id', getKnowledgeById);
router.post('/', createKnowledge);
router.put('/:id', updateKnowledge);
router.delete('/:id', deleteKnowledge);
router.post('/supervisor-answer', saveSupervisorAnswer);

export default router;
