import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getAgents,
  updateAgent,
  resetAgent,
  getLogs,
  simulate,
  assignLeadManually
} from '../controllers/leadRouletteController';

const router = Router();

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/rules', getRules);
router.post('/rules', createRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);

router.get('/agents', getAgents);
router.put('/agents/:id', updateAgent);
router.post('/agents/:id/reset', resetAgent);

router.get('/logs', getLogs);

router.post('/simulate', simulate);
router.post('/assign', assignLeadManually);

export default router;
