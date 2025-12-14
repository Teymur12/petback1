import express from 'express';
import {
  sendMessageToAdmin,
  replyToUser,
  getUserChat,
  getAllChats,
  getChatById,
  closeChat,
  deleteChat,
  deleteMessage,
  getUnreadCount
} from '../controller/chat.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// İSTİFADƏÇİ ROUTES
router.post('/send', authMiddleware, sendMessageToAdmin);
router.get('/my-chat', authMiddleware, getUserChat);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.delete('/:chatId/message/:messageId', authMiddleware, deleteMessage);

// ADMİN ROUTES
router.get('/all', authMiddleware, adminMiddleware, getAllChats);
router.get('/:id', authMiddleware, adminMiddleware, getChatById);
router.post('/reply', authMiddleware, adminMiddleware, replyToUser);
router.patch('/:id/close', authMiddleware, adminMiddleware, closeChat);
router.delete('/:id', authMiddleware, adminMiddleware, deleteChat);

export default router;
