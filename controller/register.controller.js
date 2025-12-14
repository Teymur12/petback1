import Register from '../model/register.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} from '../services/emailService.js';

// JWT token yaratmaq
const generateToken = (userId, isAdmin) => {
  return jwt.sign({ id: userId, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// 1️⃣ SIGNUP - Email verification ilə
export const signup = async (req, res) => {
  try {
    const { name, surname, email, telefon, password, confirmPassword } = req.body;

    // Validation
    if (!name || !surname || !email || !telefon || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Bütün sahələri doldurun'
      });
    }

    // Şifrə təsdiqi
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Şifrələr uyğun gəlmir'
      });
    }

    // Şifrə uzunluq yoxlaması
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifrə ən azı 6 simvol olmalıdır'
      });
    }

    // Email və telefon mövcudluğunu yoxla
    const existingUser = await Register.findOne({
      $or: [{ email }, { telefon }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Bu email artıq istifadə olunur'
        });
      }
      if (existingUser.telefon === telefon) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon nömrəsi artıq istifadə olunur'
        });
      }
    }

    // Admin yoxlaması
    let isAdmin = false;
    if (
      password === 'Youcannotfind77' &&
      name === 'adminimdi' &&
      surname === 'admins' &&
      email === 'stadionaz1@gmail.com'
    ) {
      isAdmin = true;
    }

    // Şifrəni hash-lə
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Verification kodu yarat
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 dəqiqə

    // Yeni istifadəçi yarat
    const newUser = new Register({
      name,
      surname,
      email,
      telefon,
      password: hashedPassword,
      isAdmin,
      verificationCode,
      verificationCodeExpires,
      isEmailVerified: false
    });

    await newUser.save();

    // 📧 BREVO ilə verification email göndər
    const emailSent = await sendVerificationEmail(
      email,
      name,
      surname,
      verificationCode
    );

    if (!emailSent) {
      // Email göndərilə bilməzsə, istifadəçini sil
      await Register.findByIdAndDelete(newUser._id);
      return res.status(500).json({
        success: false,
        message: 'Email göndərmə xətası. Yenidən cəhd edin.'
      });
    }

    res.status(201).json({
      success: true,
      message: '✅ Qeydiyyat uğurla başladı! Email-inizə göndərilən 6 rəqəmli kodu daxil edin.',
      userId: newUser._id,
      email: newUser.email,
      requiresVerification: true,
      expiresIn: '10 dəqiqə'
    });

  } catch (error) {
    console.error('❌ Signup xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// 2️⃣ VERIFY EMAIL - Verification kodunu yoxla
export const verifyEmail = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;

    if (!userId || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'User ID və verification code tələb olunur'
      });
    }

    // Verification kodunun uzunluq yoxlaması
    if (verificationCode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Verification kod 6 rəqəm olmalıdır'
      });
    }

    // İstifadəçini tap
    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      });
    }

    // Artıq təsdiqlənmişmi?
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email artıq təsdiqlənmiş'
      });
    }

    // Kodun vaxtı keçibmi?
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification kodunun vaxtı keçib. Yeni kod tələb edin.',
        codeExpired: true
      });
    }

    // Verification kod düzgündürmü?
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Düzgün verification kod daxil edin'
      });
    }

    // ✅ Email-i təsdiqlə
    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // 📧 BREVO ilə welcome email göndər
    await sendWelcomeEmail(user.email, user.name, user.surname);

    // Token yarat
    const token = generateToken(user._id, user.isAdmin);

    res.status(200).json({
      success: true,
      message: '🎉 Email uğurla təsdiqləndi! Qeydiyyat tamamlandı.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        telefon: user.telefon,
        isAdmin: user.isAdmin,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Email verification xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// 3️⃣ RESEND VERIFICATION CODE - Yeni kod göndər
export const resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID tələb olunur'
      });
    }

    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email artıq təsdiqlənmiş'
      });
    }

    // Yeni verification code yarat
    const newVerificationCode = generateVerificationCode();
    const newVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = newVerificationCode;
    user.verificationCodeExpires = newVerificationExpires;
    await user.save();

    // 📧 Yeni email göndər
    const emailSent = await sendVerificationEmail(
      user.email,
      user.name,
      user.surname,
      newVerificationCode
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Email göndərmə xətası. Yenidən cəhd edin.'
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Yeni verification kod email-inizə göndərildi',
      expiresIn: '10 dəqiqə'
    });

  } catch (error) {
    console.error('❌ Resend verification xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// 4️⃣ LOGIN - Yalnız təsdiqlənmiş email-lər
export const login = async (req, res) => {
  try {
    const { emailOrPhone, email, password } = req.body;

    // Accept both emailOrPhone and email fields
    const loginIdentifier = emailOrPhone || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/telefon və şifrə tələb olunur'
      });
    }

    // Email və ya telefon ilə tap
    const user = await Register.findOne({
      $or: [{ email: loginIdentifier }, { telefon: loginIdentifier }]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      });
    }

    // Email təsdiqlənmişmi?
    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Əvvəlcə email-inizi təsdiqləyin',
        requiresVerification: true,
        userId: user._id
      });
    }

    // Şifrə yoxlaması
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Yanlış şifrə'
      });
    }

    // Token yarat
    const token = generateToken(user._id, user.isAdmin);

    // Token-i httpOnly cookie-də saxla (30 gün)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      message: '✅ Giriş uğurlu',
      token,
      user: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        telefon: user.telefon,
        isAdmin: user.isAdmin,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Login xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// 5️⃣ FORGOT PASSWORD - Şifrə sıfırlama kodu göndər
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email tələb olunur'
      });
    }

    const user = await Register.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Bu email ilə istifadəçi tapılmadı'
      });
    }

    // Email təsdiqlənmişmi?
    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email təsdiqlənməyib. Əvvəlcə emailinizi təsdiqləyin.'
      });
    }

    // Reset kodu yarat
    const resetCode = generateVerificationCode();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 dəqiqə

    user.resetPasswordToken = resetCode;
    user.resetPasswordExpire = resetCodeExpires;
    await user.save();

    // 📧 BREVO ilə password reset email göndər
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.name,
      user.surname,
      resetCode
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Email göndərmə xətası. Yenidən cəhd edin.'
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Şifrə sıfırlama kodu email-inizə göndərildi',
      userId: user._id,
      email: user.email,
      expiresIn: '15 dəqiqə'
    });

  } catch (error) {
    console.error('❌ Forgot password xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// 6️⃣ RESET PASSWORD - Yeni şifrə təyin et
export const resetPassword = async (req, res) => {
  try {
    const { userId, resetCode, newPassword, confirmPassword } = req.body;

    if (!userId || !resetCode || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Bütün sahələri doldurun'
      });
    }

    // Şifrələrin uyğunluğu
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Şifrələr uyğun gəlmir'
      });
    }

    // Şifrə uzunluq yoxlaması
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifrə ən azı 6 simvol olmalıdır'
      });
    }

    // Reset kodunun uzunluq yoxlaması
    if (resetCode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Reset kod 6 rəqəm olmalıdır'
      });
    }

    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      });
    }

    // Reset kodu olub-olmadığını yoxla
    if (!user.resetPasswordToken) {
      return res.status(400).json({
        success: false,
        message: 'Şifrə sıfırlama kodu tapılmadı. Yenidən forgot password edin.'
      });
    }

    // Kodun vaxtı keçibmi?
    if (user.resetPasswordExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Şifrə sıfırlama kodunun vaxtı keçib. Yenidən forgot password edin.',
        codeExpired: true
      });
    }

    // Reset kod düzgündürmü?
    if (user.resetPasswordToken !== resetCode) {
      return res.status(400).json({
        success: false,
        message: 'Düzgün reset kod daxil edin'
      });
    }

    // Yeni şifrəni hash-lə
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Şifrəni yenilə
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: '✅ Şifrə uğurla yeniləndi. İndi yeni şifrə ilə giriş edə bilərsiniz.'
    });

  } catch (error) {
    console.error('❌ Reset password xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// 7️⃣ LOGOUT
export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: '✅ Çıxış uğurlu'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout xətası',
      error: error.message
    });
  }
};

// 8️⃣ GET ALL USERS (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await Register.find()
      .select('-password -verificationCode -resetPasswordToken')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error('❌ GetAllUsers xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// 9️⃣ DELETE USER (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Register.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      });
    }

    await Register.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: '✅ İstifadəçi uğurla silindi'
    });

  } catch (error) {
    console.error('❌ DeleteUser xətası:', error);
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};