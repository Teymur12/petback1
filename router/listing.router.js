import express from 'express';
import {
  createListing,
  getAllListings,
  getListingsByCity,
  getUserListings,
  getListingById,
  updateListing,
  extendListing,
  deleteListing,
  sendPairRequest,
  respondToPairRequest,
  toggleBlockListing,
  searchListings
} from '../controller/listing.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (token tələb olunmur)
router.get('/city/:cityId', getListingsByCity); // Şəhərə görə elanlar
router.get('/', getAllListings); // Bütün elanlar - PUBLIC
router.get('/search', searchListings); // Axtarış - PUBLIC

// Protected routes (token tələb olunur)
router.post('/', authMiddleware, createListing); // Elan yarat
router.get('/user/:userId', authMiddleware, getUserListings); // İstifadəçinin elanları
router.get('/:id', authMiddleware, getListingById); // Tək elan
router.put('/:id', authMiddleware, updateListing); // Elanı yenilə
router.patch('/:id/extend', authMiddleware, extendListing); // Elan vaxtını uzat
router.delete('/:id', authMiddleware, deleteListing); // Elanı sil

// Cütləşdirmə routes
router.post('/:listingId/pair-request', authMiddleware, sendPairRequest); // Sorğu göndər
router.patch('/:listingId/pair-request/:requestId', authMiddleware, respondToPairRequest); // Sorğuya cavab ver

// Admin routes
router.patch('/:id/block', authMiddleware, adminMiddleware, toggleBlockListing); // Elanı blokla

export default router;