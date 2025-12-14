import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Register',
    required: [true, 'İstifadəçi tələb olunur']
  },
  petType: {
    type: String,
    required: [true, 'Heyvan növü tələb olunur'],
    enum: ['it', 'pisik', 'quş', 'balıq', 'dovşan', 'digər'],
    trim: true
  },
  gender: {
    type: String,
    required: [true, 'Cins tələb olunur'],
    enum: ['erkək', 'dişi'],
    trim: true
  },
  breed: {
    type: String,
    required: [true, 'Cins tələb olunur'],
    trim: true
  },
  age: {
    type: Number,
    min: [0, 'Yaş mənfi ola bilməz']
  },
  description: {
    type: String,
    required: [true, 'Təsvir tələb olunur'],
    trim: true,
    maxlength: [1000, 'Təsvir maksimum 1000 simvol ola bilər']
  },
  images: [{
    type: String,
    required: [true, 'Ən azı bir şəkil tələb olunur']
  }],
  seher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'Şəhər tələb olunur']
  },
  status: {
    type: String,
    enum: ['aktiv', 'cütləşdirildi', 'vaxtı bitib', 'silinib'],
    default: 'aktiv'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default: 30 gün sonra
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  pairRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Register'
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },
    message: String,
    status: {
      type: String,
      enum: ['gözləyir', 'qəbul edildi', 'rədd edildi'],
      default: 'gözləyir'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index-lər performans üçün
listingSchema.index({ user: 1 });
listingSchema.index({ seher: 1 });
listingSchema.index({ petType: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ expiresAt: 1 });

// Virtual field - elanın aktiv olub olmadığını yoxlama
listingSchema.virtual('isActive').get(function() {
  return this.status === 'aktiv' && 
         this.expiresAt > new Date() && 
         !this.isBlocked;
});

// Vaxtı keçmiş elanları yoxlama metodu
listingSchema.methods.checkExpiration = function() {
  if (this.status === 'aktiv' && this.expiresAt < new Date()) {
    this.status = 'vaxtı bitib';
    return true;
  }
  return false;
};

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;