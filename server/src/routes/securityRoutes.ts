import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
    setup2FA, enable2FA, disable2FA,
    getLoginLogs, unlockUser, toggleUserActive,
    getSecuritySettings, updateSecuritySettings, adminResetPassword,
} from '../controllers/securityController.js';

const router = Router();

// All security routes require authentication
router.use(authenticate);

// 2FA — users can manage their own; super_admin can manage any
router.post('/2fa/setup/:userId', setup2FA);
router.post('/2fa/enable/:userId', enable2FA);
router.delete('/2fa/:userId', disable2FA);

// Super admin only
router.get('/logs', requireRole('super_admin'), getLoginLogs);
router.post('/users/:id/unlock', requireRole('super_admin', 'admin'), unlockUser);
router.put('/users/:id/active', requireRole('super_admin'), toggleUserActive);
router.put('/users/:id/reset-password', requireRole('super_admin', 'admin'), adminResetPassword);
router.get('/settings', requireRole('super_admin', 'admin'), getSecuritySettings);
router.put('/settings', requireRole('super_admin'), updateSecuritySettings);

export default router;
