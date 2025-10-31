import express from 'express';
import {
  getAllKnowledge,
  getKnowledgeById,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
} from '../controllers/knowledgeBaseController.js';

const router = express.Router();

router.get('/', getAllKnowledge);
router.get('/search', searchKnowledge);
router.get('/:id', getKnowledgeById);
router.post('/', createKnowledge);
router.put('/:id', updateKnowledge);
router.delete('/:id', deleteKnowledge);

export default router;
