import express from 'express';
import {
  signup,
  verifyEmail,
  resendVerificationCode,
  login,
  forgotPassword,
  resetPassword,
  logout,
  getAllUsers,
  deleteUser
} from '../controller/register.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// 📧 PUBLIC ROUTES (Token tələb olunmur)
// ========================================

// 1️⃣ Qeydiyyat (Email verification ilə)
router.post('/signup', signup);

// 2️⃣ Email verification
router.post('/verify-email', verifyEmail);

// 3️⃣ Yeni verification code göndər
router.post('/resend-verification', resendVerificationCode);

// 4️⃣ Giriş
router.post('/login', login);

// 5️⃣ Şifrə unutdum (reset code göndər)
router.post('/forgot-password', forgotPassword);

// 6️⃣ Şifrə sıfırlama (reset code ilə)
router.post('/reset-password', resetPassword);

// ========================================
// 🔒 PROTECTED ROUTES (Token tələb olunur)
// ========================================

// 7️⃣ Çıxış
router.post('/logout', authMiddleware, logout);

// ========================================
// 👑 ADMIN ROUTES (Admin token tələb olunur)
// ========================================

// 8️⃣ Bütün istifadəçiləri əldə et
router.get('/all', authMiddleware, adminMiddleware, getAllUsers);
router.get('/users', authMiddleware, adminMiddleware, getAllUsers); // Alias for /all

// 9️⃣ İstifadəçi sil
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser); // Alias for /delete/:id

export default router;