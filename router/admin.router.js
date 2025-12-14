import express from 'express';
import {
  toggleBlockUser,
  sendNotificationToUser,
  sendBulkNotification,
  forceDeleteListing,
  getStatistics
} from '../controller/admin.controller.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} from '../controller/notification.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();


router.patch('/users/:userId/block', authMiddleware, adminMiddleware, toggleBlockUser);


router.post('/notifications/user/:userId', authMiddleware, adminMiddleware, sendNotificationToUser);
router.post('/notifications/bulk', authMiddleware, adminMiddleware, sendBulkNotification);


router.delete('/listings/:listingId/force', authMiddleware, adminMiddleware, forceDeleteListing);


router.get('/statistics', authMiddleware, adminMiddleware, getStatistics);


router.get('/notifications', authMiddleware, getUserNotifications); // Bütün bildirişlər
router.get('/notifications/unread-count', authMiddleware, getUnreadCount); // Oxunmamış say
router.patch('/notifications/:id/read', authMiddleware, markAsRead); // Bildirişi oxunmuş kimi işarələ
router.patch('/notifications/read-all', authMiddleware, markAllAsRead); // Hamısını oxunmuş kimi işarələ
router.delete('/notifications/:id', authMiddleware, deleteNotification); // Bildirişi sil
router.delete('/notifications', authMiddleware, deleteAllNotifications); // Hamısını sil

export default router;