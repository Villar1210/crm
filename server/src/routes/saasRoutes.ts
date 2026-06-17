import { Router } from 'express';
import { getPlans, createPlan, updatePlan, getAccounts, createAccount, getInvoices, getEvents } from '../controllers/saasController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('super_admin'));

router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);

router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);

router.get('/invoices', getInvoices);
router.get('/events', getEvents);

export default router;
