import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getConversations, getMessages, sendMessage, sendMessageByBody, createConversation, createSupportTicket, searchRecipients } from '../controllers/messages';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', getConversations);
router.get('/search-recipients', searchRecipients);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/:conversationId', sendMessage);
router.post('/', sendMessageByBody);
router.post('/support', createSupportTicket);

export default router;
