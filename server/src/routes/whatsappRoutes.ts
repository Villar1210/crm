import { Router } from 'express';
import * as whatsappController from '../controllers/whatsappController';

const router = Router();

router.get('/status', whatsappController.getStatus);
router.get('/chats', whatsappController.getChats);
router.get('/messages/:chatId', whatsappController.getMessages);
router.post('/send', whatsappController.sendMessage);

export default router;
