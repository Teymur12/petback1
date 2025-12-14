import jwt from 'jsonwebtoken';
import Register from '../model/register.model.js';

// ========================================
// 🔒 AUTH MIDDLEWARE - Token yoxlaması
// ========================================
export const authMiddleware = async (req, res, next) => {
  try {
    // Token-i cookie-dən və ya header-dən al
    let token = req.cookies?.token; // Cookie-dən

    if (!token) {
      // Əgər cookie-də yoxdursa, header-dən yoxla
      token = req.headers.authorization?.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '❌ Giriş tələb olunur. Token tapılmadı.'
      });
    }

    // Token-i verify et
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // İstifadəçini tap
    const user = await Register.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '❌ İstifadəçi tapılmadı'
      });
    }

    // Email təsdiqlənmişmi?
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: '❌ Email təsdiqlənməyib. Əvvəlcə emailinizi təsdiqləyin.',
        requiresVerification: true,
        userId: user._id
      });
    }

    // İstifadəçini request-ə əlavə et
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '❌ Yanlış token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '❌ Tokenin vaxtı keçib. Yenidən giriş edin.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// ========================================
// 👑 ADMIN MIDDLEWARE - Admin yoxlaması
// ========================================
export const adminMiddleware = async (req, res, next) => {
  try {
    // req.user authMiddleware-dən gəlir
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '❌ Giriş tələb olunur'
      });
    }

    // Admin yoxlaması
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '❌ Bu əməliyyat üçün admin icazəsi tələb olunur'
      });
    }

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};