import mongoose from 'mongoose';

const registerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ad tələb olunur'],
    trim: true,
    minlength: [2, 'Ad ən azı 2 simvol olmalıdır']
  },
  surname: {
    type: String,
    required: [true, 'Soyad tələb olunur'],
    trim: true,
    minlength: [2, 'Soyad ən azı 2 simvol olmalıdır']
  },
  email: {
    type: String,
    required: [true, 'Email tələb olunur'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Düzgün email formatı daxil edin'
    ]
  },
  telefon: {
    type: String,
    required: [true, 'Telefon nömrəsi tələb olunur'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Şifrə tələb olunur'],
    minlength: [6, 'Şifrə ən azı 6 simvol olmalıdır']
    // NOT: Şifrə artıq controller-də hash-lənir, ona görə pre-save hook silinib
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // ✅ EMAIL VERIFICATION SAHƏLƏRI (Brevo üçün)
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // ✅ PASSWORD RESET SAHƏLƏRI (Brevo üçün)
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// ❌ pre('save') hook SİLİNİB - şifrə artıq controller-də hash-lənir
// Bu şəkildə daha çox kontrol və şəffaflıq təmin edilir

const Register = mongoose.model('Register', registerSchema);

export default Register;